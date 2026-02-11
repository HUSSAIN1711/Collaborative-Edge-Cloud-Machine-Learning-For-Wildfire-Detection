"""
Flask API for wildfire image detection using ResNet18 model.
Serves predictions on POST /predict endpoint.
"""

import torch
import torch.nn as nn
from torchvision import models, transforms
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import io
from pathlib import Path
import requests
from datetime import datetime
import time

from inference import (
    get_feature_names as get_weather_feature_names,
    predict as predict_weather_class,
    predict_proba as predict_weather_proba,
)

app = Flask(__name__)
# Enable CORS for all routes (allows React app to call the API)
CORS(app)

# Get the script directory and resolve model path
SCRIPT_DIR = Path(__file__).resolve().parent
MODEL_PATH = (
    SCRIPT_DIR.parent
    / "CNNModelArtifacts"
    / "models"
    / "wildfire_resnet18.pth"
)

_model = None
_preprocess = None


def load_model():
    """Load the ResNet18 model and set up preprocessing."""
    global _model, _preprocess
    
    if _model is not None:
        return _model, _preprocess
    
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Model not found at {MODEL_PATH}. "
            "Ensure wildfire_resnet18.pth is in src/MachineLearningModels/CNNModelArtifacts/models/."
        )
    
    # Setup the model architecture
    model = models.resnet18()
    model.fc = nn.Linear(512, 1)  # Binary classification output
    model.load_state_dict(torch.load(MODEL_PATH, map_location='cpu'))
    model.eval()
    
    # Setup preprocessing (ImageNet normalization)
    preprocess = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    
    _model = model
    _preprocess = preprocess
    
    return model, preprocess


def _to_float(value, field_name):
    """Convert a value to float and raise a clear API error if invalid."""
    try:
        return float(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"Invalid numeric value for {field_name}: {value}") from exc


def _extract_weather_features(payload):
    """
    Build model features required by inference.py:
    MIN_TEMP, MAX_TEMP, AVG_WIND_SPEED, DAY_OF_YEAR
    """
    weather = payload.get("weatherData", payload)
    day_of_year = payload.get("dayOfYear")

    min_temp = weather.get("MIN_TEMP", weather.get("minTemperature", weather.get("temperature")))
    max_temp = weather.get("MAX_TEMP", weather.get("maxTemperature", weather.get("temperature")))
    avg_wind_speed = weather.get("AVG_WIND_SPEED", weather.get("windSpeed"))
    day_of_year = weather.get("DAY_OF_YEAR", day_of_year)

    if day_of_year is None:
        day_of_year = datetime.utcnow().timetuple().tm_yday

    features = {
        "MIN_TEMP": _to_float(min_temp, "MIN_TEMP"),
        "MAX_TEMP": _to_float(max_temp, "MAX_TEMP"),
        "AVG_WIND_SPEED": _to_float(avg_wind_speed, "AVG_WIND_SPEED"),
        "DAY_OF_YEAR": _to_float(day_of_year, "DAY_OF_YEAR"),
    }

    missing = [key for key, value in features.items() if value is None]
    if missing:
        raise ValueError(f"Missing required weather features: {', '.join(missing)}")

    # Ensure payload exactly follows trained model feature order.
    model_feature_names = get_weather_feature_names()
    return {name: features[name] for name in model_feature_names}


@app.route('/predict', methods=['POST'])
def predict():
    """Predict wildfire from uploaded image."""
    try:
        # Check if image file is present
        if 'image' not in request.files:
            return jsonify({"error": "No image file provided"}), 400
        
        file = request.files['image']
        
        if file.filename == '':
            return jsonify({"error": "Empty filename"}), 400
        
        # Load and preprocess image
        img_bytes = file.read()
        img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
        
        # Get model and preprocess
        model, preprocess = load_model()
        
        # Preprocess image
        input_tensor = preprocess(img).unsqueeze(0)
        
        # Run inference
        with torch.no_grad():
            output = model(input_tensor)
            prob = torch.sigmoid(output).item()
        
        return jsonify({
            "fire_detected": prob > 0.5,
            "confidence": round(prob * 100, 2),
            "probability": round(prob, 4)
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/predict-from-url', methods=['POST'])
def predict_from_url():
    """Predict wildfire from image URL. Server fetches the image (avoids browser CORS)."""
    try:
        data = request.get_json()
        if not data or 'image_url' not in data:
            return jsonify({"error": "No image_url in body"}), 400

        image_url = data['image_url'].strip()
        if not image_url:
            return jsonify({"error": "Empty image_url"}), 400

        # Use browser-like headers to reduce 403/429 from image hosts.
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": image_url,
            "Connection": "keep-alive",
        }
        resp = requests.get(image_url, timeout=15, headers=headers)
        if resp.status_code in (403, 429):
            # Quick retry for transient anti-bot/rate-limit responses.
            time.sleep(0.6)
            resp = requests.get(image_url, timeout=20, headers=headers)
        resp.raise_for_status()
        # Bytes (JPEG/PNG/etc.) → PIL Image RGB → model sees a normalized tensor
        img = Image.open(io.BytesIO(resp.content)).convert('RGB')

        model, preprocess = load_model()
        input_tensor = preprocess(img).unsqueeze(0)
        with torch.no_grad():
            output = model(input_tensor)
            prob = torch.sigmoid(output).item()

        return jsonify({
            "fire_detected": prob > 0.5,
            "confidence": round(prob * 100, 2),
            "probability": round(prob, 4),
        })
    except requests.RequestException as e:
        return jsonify({"error": f"Failed to fetch image: {e}"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/predict-weather-risk', methods=['POST'])
def predict_weather_risk():
    """
    Predict fire risk from weather features using EdgeDeviceModelArtifacts/inference.py.
    Expects JSON containing either:
      - model feature keys directly: MIN_TEMP, MAX_TEMP, AVG_WIND_SPEED, DAY_OF_YEAR
      - or a weatherData object with minTemperature/maxTemperature/windSpeed/temperature.
    """
    try:
        payload = request.get_json()
        if not payload:
            return jsonify({"error": "No JSON body provided"}), 400

        features = _extract_weather_features(payload)
        fire_class = int(predict_weather_class(features))
        fire_probability = float(predict_weather_proba(features))

        return jsonify({
            "fire_risk_class": fire_class,                  # 0 or 1
            "fire_risk_probability": round(fire_probability, 4),  # 0-1
            "fire_risk_percent": round(fire_probability * 100, 2),  # 0-100
            "features_used": features,
        })
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    try:
        load_model()  # Try loading model
        return jsonify({"status": "healthy", "model_loaded": _model is not None})
    except Exception as e:
        return jsonify({"status": "unhealthy", "error": str(e)}), 500


if __name__ == '__main__':
    # Load model on startup - REQUIRED before server starts
    print("Loading wildfire detection model...")
    try:
        load_model()
        print(f"✓ Model loaded successfully from {MODEL_PATH}")
        print(f"✓ Model ready for inference")
        print(f"✓ Starting Flask server on http://0.0.0.0:5001")
    except Exception as e:
        print(f"✗ ERROR: Failed to load model: {e}")
        print("✗ Server will NOT start without the model.")
        exit(1)
    
    # Only start server if model loaded successfully
    app.run(host='0.0.0.0', port=5001, debug=False)

"""
Flask API for wildfire image detection using ResNet18 model.
Serves predictions on POST /predict and POST /predict-from-url endpoints.
"""

import base64
import io
from pathlib import Path

import requests
import torch
import torch.nn as nn
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
from torchvision import models, transforms

app = Flask(__name__)
# Enable CORS for all routes (allows React app to call the API)
CORS(app)

# Script lives in project_root/api/; model lives in project_root/models/
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
MODEL_PATH = PROJECT_ROOT / "models" / "wildfire_resnet18.pth"

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
            "Ensure wildfire_resnet18.pth is in the models/ directory."
        )

    # Setup the model architecture
    model = models.resnet18()
    model.fc = nn.Linear(512, 1)  # Binary classification output
    model.load_state_dict(torch.load(MODEL_PATH, map_location="cpu"))
    model.eval()

    # Setup preprocessing (ImageNet normalization)
    preprocess = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])

    _model = model
    _preprocess = preprocess

    return model, preprocess


@app.route("/predict", methods=["POST"])
def predict():
    """Predict wildfire from uploaded image."""
    try:
        # Check if image file is present
        if "image" not in request.files:
            return jsonify({"error": "No image file provided"}), 400

        file = request.files["image"]

        if file.filename == "":
            return jsonify({"error": "Empty filename"}), 400

        # Load and preprocess image
        img_bytes = file.read()
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")

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
            "probability": round(prob, 4),
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/predict-from-url", methods=["POST"])
def predict_from_url():
    """Predict wildfire from image URL. Server fetches the image (avoids browser CORS)."""
    try:
        data = request.get_json()
        if not data or "image_url" not in data:
            return jsonify({"error": "No image_url in body"}), 400

        image_url = data["image_url"].strip()
        if not image_url:
            return jsonify({"error": "Empty image_url"}), 400

        # Use full browser-like headers so image hosts (CDNs, news sites) don't return 403
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "/",
        }
        resp = requests.get(image_url, timeout=15, headers=headers)
        resp.raise_for_status()
        img_bytes = resp.content
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")

        model, preprocess = load_model()
        input_tensor = preprocess(img).unsqueeze(0)
        with torch.no_grad():
            output = model(input_tensor)
            prob = torch.sigmoid(output).item()

        # Return the same image we used for inference so the dashboard can display it (avoids 403)
        content_type = (resp.headers.get("Content-Type") or "image/jpeg").split(";")[0].strip()
        image_b64 = base64.b64encode(img_bytes).decode("ascii")

        return jsonify({
            "fire_detected": prob > 0.5,
            "confidence": round(prob * 100, 2),
            "probability": round(prob, 4),
            "image_base64": image_b64,
            "image_content_type": content_type,
        })
    except requests.RequestException as e:
        return jsonify({"error": f"Failed to fetch image: {e}"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    try:
        load_model()
        return jsonify({"status": "healthy", "model_loaded": _model is not None})
    except Exception as e:
        return jsonify({"status": "unhealthy", "error": str(e)}), 500


if __name__ == "__main__":
    print("Loading wildfire detection model...")
    try:
        load_model()
        print(f"✓ Model loaded successfully from {MODEL_PATH}")
        print("✓ Model ready for inference")
        print("✓ Starting Flask server on http://0.0.0.0:5001")
    except Exception as e:
        print(f"✗ ERROR: Failed to load model: {e}")
        print("✗ Server will NOT start without the model.")
        exit(1)

    app.run(host="0.0.0.0", port=5001, debug=False)

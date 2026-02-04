# Fire Risk ML Models

This directory contains two ML models for wildfire detection:

1. **Weather-based Fire Risk Model** (Random Forest) - Uses weather features
2. **Image-based Wildfire Detection Model** (ResNet18) - Uses image classification

---

## Weather-based Fire Risk Model

### For developers (when model or dataset changes)

1. Install dependencies: `pip install -r requirements.txt`
2. The dataset `CA_Weather_Fire_Dataset_1984-2025.csv` should be in this directory (or in `data/`), or set `FIRE_DATASET_CSV` to its path.
3. Run training: `python train_fire_risk_model.py`
4. This produces `fire_risk_model.joblib` and `feature_names.json` in this directory.

### For production / other code

- **Do not** run `train_fire_risk_model.py` in production.
- Use the **inference** module to run the saved model:

```python
# From project root (with PYTHONPATH=src) or from this directory:
from MachineLearningModels.EdgeDeviceModelArtifacts.inference import get_feature_names, predict, predict_proba

# One sample (dict)
features = {"MIN_TEMP": 75, "MAX_TEMP": 100, "AVG_WIND_SPEED": 12, "DAY_OF_YEAR": 180}
risk_class = predict(features)           # 0 or 1
risk_probability = predict_proba(features)  # 0.0–1.0
```

The model is loaded once and reused; ensure `fire_risk_model.joblib` and `feature_names.json` are deployed with your app.

---

## Image-based Wildfire Detection Model (ResNet18)

### Setup

1. Ensure the ResNet18 model file `wildfire_resnet18.pth` is in the `models/` directory at the project root.
2. Install Python dependencies: `pip install -r requirements.txt` (includes PyTorch, Flask, **flask-cors**, Pillow, etc.)

### Running the API Server

Start the Flask API server (or use `npm run dev` to start both the dashboard and API):

```bash
python3 src/MachineLearningModels/EdgeDeviceModelArtifacts/image_inference_api.py
```

The server will start on `http://localhost:5001`. CORS is enabled via **flask-cors** so the React dashboard can call the API.

### API Endpoints

#### POST `/predict`
Predict wildfire from an uploaded image.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: Form field `image` with image file (JPG, PNG, etc.)

**Response:**
```json
{
  "fire_detected": true,
  "confidence": 87.45,
  "probability": 0.8745
}
```

**Example using curl:**
```bash
curl -X POST -F "image=@path/to/test_image.jpg" http://localhost:5001/predict
```

**Example using Python:**
```python
import requests

with open('test_image.jpg', 'rb') as f:
    response = requests.post(
        'http://localhost:5001/predict',
        files={'image': f}
    )
    result = response.json()
    print(f"Fire detected: {result['fire_detected']}")
    print(f"Confidence: {result['confidence']}%")
```

#### GET `/health`
Health check endpoint to verify the model is loaded.

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true
}
```

### Model Details

- **Architecture**: ResNet18
- **Input**: RGB images (224x224 pixels)
- **Output**: Binary classification (fire detected / no fire)
- **Preprocessing**: ImageNet normalization
- **Model Location**: `models/wildfire_resnet18.pth` (project root)

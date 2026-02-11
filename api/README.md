# Wildfire Image Inference API

Flask API that runs ResNet18-based wildfire detection on images. Used by the dashboard to show predictions on the drone feed image.

## Setup

1. Create a virtual environment and install dependencies:

   ```bash
   cd api
   python -m venv venv
   source venv/bin/activate   # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. Ensure the model is present at `models/wildfire_resnet18.pth` (project root).

## Run

From the project root:

```bash
cd api
python image_inference_api.py
```

Server runs at **http://localhost:5001**.

- `POST /predict-from-url` — body: `{ "image_url": "https://..." }` → returns `{ fire_detected, confidence, probability }`
- `GET /health` — health check

The React app calls `/predict-from-url` with the sensor feed image URL; the API fetches the image server-side and returns the prediction.

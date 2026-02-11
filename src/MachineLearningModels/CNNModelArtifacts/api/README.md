# Wildfire Image Inference API

Flask API that runs ResNet18-based wildfire detection on images. Used by the dashboard to show predictions on the drone feed image.

## Setup

1. Create a virtual environment and install dependencies:

   ```bash
   cd src/MachineLearningModels/CNNModelArtifacts/api
   python -m venv venv
   source venv/bin/activate   # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. Ensure the model is present at `src/MachineLearningModels/CNNModelArtifacts/models/wildfire_resnet18.pth`.

## Run

From the project root:

```bash
python src/MachineLearningModels/CNNModelArtifacts/api/image_inference_api.py
```

Or from the api directory:

```bash
cd src/MachineLearningModels/CNNModelArtifacts/api
python image_inference_api.py
```

Server runs at **http://localhost:5001**.

- `POST /predict-from-url` — body: `{ "image_url": "https://..." }` → returns `{ fire_detected, confidence, probability }`
- `GET /health` — health check

The React app calls `/predict-from-url` with the sensor feed image URL; the API fetches the image server-side and returns the prediction.

## Troubleshooting

- **"Internal Server Error" or 500**: The API now returns JSON with an `error` field describing the failure (e.g. invalid image, model not found). The dashboard shows this message. When running the API in a terminal, the full traceback is also printed there—check the terminal where you started the server for the exact cause.
- **Model not found**: Ensure `wildfire_resnet18.pth` is in `src/MachineLearningModels/CNNModelArtifacts/models/`.
- **Invalid image**: Some URLs or uploads are not valid images (e.g. HTML error page, unsupported format). The API returns a 400 with a clear message in that case.

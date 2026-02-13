# Models

All ML models and artifacts are consolidated in this folder.

## Contents

| File | Description |
|------|-------------|
| `wildfire_resnet18.pth` | Image-based wildfire detection (ResNet18) — used by `api/image_inference_api.py` |
| `fire_risk_model.joblib` | Fire risk Random Forest (weather features) — used by `api/fire_risk_inference.py` |
| `feature_names.json` | Feature names for fire risk model (MIN_TEMP, MAX_TEMP, etc.) |
| `CA_Weather_Fire_Dataset_1984-2025.csv` | Dataset for fire risk training |
| `train_fire_risk_model.py` | Dev-only: train and save fire risk model |

## Fire risk model (dev)

Run only when the model or dataset changes:

```bash
cd models
pip install pandas numpy scikit-learn joblib
python train_fire_risk_model.py
```

This produces `fire_risk_model.joblib` and updates `feature_names.json`.

## Fire risk inference (production)

```python
from api.fire_risk_inference import get_feature_names, predict, predict_proba

features = {"MIN_TEMP": 75, "MAX_TEMP": 100, "AVG_WIND_SPEED": 12, "DAY_OF_YEAR": 180}
risk_class = predict(features)           # 0 or 1
risk_probability = predict_proba(features)  # 0.0–1.0
```

Ensure `fire_risk_model.joblib` and `feature_names.json` are deployed with your app.

# Fire Risk ML Model

## For developers (when model or dataset changes)

1. Install dependencies: `pip install -r requirements.txt`
2. The dataset `CA_Weather_Fire_Dataset_1984-2025.csv` should be in this directory (or in `data/`), or set `FIRE_DATASET_CSV` to its path.
3. Run training: `python train_fire_risk_model.py`
4. This produces `fire_risk_model.joblib` and `feature_names.json` in this directory.

## For production / other code

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

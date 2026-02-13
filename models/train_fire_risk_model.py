"""
Dev-only script: train the fire-risk Random Forest model and save it for production.

Run this only when the model hyperparameters or the dataset change.
Output: fire_risk_model.joblib + feature_names.json (used by fire_risk_inference).
"""

import json
import os
import warnings
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split

warnings.filterwarnings("ignore", category=UserWarning)

# Script lives in models/; artifacts saved in same directory
SCRIPT_DIR = Path(__file__).resolve().parent
_DEFAULT_CSV = "CA_Weather_Fire_Dataset_1984-2025.csv"
DATASET_PATH = os.environ.get(
    "FIRE_DATASET_CSV",
    str(SCRIPT_DIR / _DEFAULT_CSV),
)
MODEL_PATH = SCRIPT_DIR / "fire_risk_model.joblib"
FEATURE_NAMES_PATH = SCRIPT_DIR / "feature_names.json"

FEATURES = ["MIN_TEMP", "MAX_TEMP", "AVG_WIND_SPEED", "DAY_OF_YEAR"]


def main() -> None:
    if not os.path.isfile(DATASET_PATH):
        alt = SCRIPT_DIR / "data" / _DEFAULT_CSV
        raise FileNotFoundError(
            f"Dataset not found: {DATASET_PATH}. "
            f"Set FIRE_DATASET_CSV or place {_DEFAULT_CSV} in {SCRIPT_DIR} or {SCRIPT_DIR / 'data'}."
        )

    df = pd.read_csv(DATASET_PATH)
    df_clean = df.dropna().copy()
    df_clean["FIRE_START_DAY"] = df_clean["FIRE_START_DAY"].astype(int)

    X = df_clean[FEATURES]
    y = df_clean["FIRE_START_DAY"]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    rf_model = RandomForestClassifier(
        n_estimators=100, max_depth=12, random_state=42
    )
    rf_model.fit(X_train, y_train)

    y_pred = rf_model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Model accuracy: {accuracy:.2%}")
    print("\nClassification report:\n", classification_report(y_test, y_pred))

    SCRIPT_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(rf_model, MODEL_PATH)
    with open(FEATURE_NAMES_PATH, "w") as f:
        json.dump(FEATURES, f, indent=2)

    print(f"[SUCCESS] Model saved to {MODEL_PATH}")
    print(f"[SUCCESS] Feature names saved to {FEATURE_NAMES_PATH}")


if __name__ == "__main__":
    main()

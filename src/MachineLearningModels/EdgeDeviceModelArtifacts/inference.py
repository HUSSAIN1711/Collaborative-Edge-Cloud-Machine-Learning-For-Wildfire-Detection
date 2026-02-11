"""
Production inference: load the trained fire-risk model and run predictions.

Other code should use this module instead of running the training script.
Requires fire_risk_model.joblib and feature_names.json (produced by train_fire_risk_model.py).
"""

import json
from pathlib import Path
from typing import Dict, List, Union

import joblib
import pandas as pd

SCRIPT_DIR = Path(__file__).resolve().parent
MODEL_PATH = SCRIPT_DIR / "fire_risk_model.joblib"
FEATURE_NAMES_PATH = SCRIPT_DIR / "feature_names.json"

_model = None
_feature_names: List[str] = []


def _ensure_loaded() -> None:
    global _model, _feature_names
    if _model is None:
        if not MODEL_PATH.is_file():
            raise FileNotFoundError(
                f"Model not found: {MODEL_PATH}. "
                "Run train_fire_risk_model.py first (when model or dataset changes)."
            )
        _model = joblib.load(MODEL_PATH)
        with open(FEATURE_NAMES_PATH) as f:
            _feature_names = json.load(f)


def get_feature_names() -> List[str]:
    """Return the expected feature names for predictions."""
    _ensure_loaded()
    return list(_feature_names)


def predict(features: Union[Dict[str, float], pd.DataFrame]) -> int:
    """
    Predict fire risk class: 1 = fire started, 0 = no fire.

    features: dict with keys MIN_TEMP, MAX_TEMP, AVG_WIND_SPEED, DAY_OF_YEAR,
              or a DataFrame with those columns (single or multiple rows).
    """
    _ensure_loaded()
    if isinstance(features, dict):
        df = pd.DataFrame([features], columns=_feature_names)
    else:
        df = features[_feature_names].copy()
    return int(_model.predict(df)[0])


def predict_proba(features: Union[Dict[str, float], pd.DataFrame]) -> float:
    """
    Return probability of class 1 (fire started) in [0, 1].

    features: same as predict().
    """
    _ensure_loaded()
    if isinstance(features, dict):
        df = pd.DataFrame([features], columns=_feature_names)
    else:
        df = features[_feature_names].copy()
    return float(_model.predict_proba(df)[0][1])

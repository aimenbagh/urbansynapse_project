"""Predictive model wrapper for territorial KPIs (XGBoost regressor)."""
import os
import joblib
import numpy as np
from app.core.config import settings

FEATURES = ["population_density", "green_ratio", "building_age_avg",
            "energy_class_score", "mobility_index", "co2_baseline"]


class TerritorialPredictor:
    def __init__(self, model_name: str = "energy_performance.joblib"):
        self.path = os.path.join(settings.ML_MODEL_DIR, model_name)
        self._model = None

    def load(self):
        if os.path.exists(self.path):
            self._model = joblib.load(self.path)
        return self

    def predict(self, features: dict) -> float:
        if self._model is None:
            # graceful fallback heuristic before a trained model is shipped
            return float(np.clip(
                70 + features.get("green_ratio", 0) * 30
                - features.get("co2_baseline", 0) * 0.01, 0, 100))
        x = np.array([[features.get(f, 0.0) for f in FEATURES]])
        return float(self._model.predict(x)[0])

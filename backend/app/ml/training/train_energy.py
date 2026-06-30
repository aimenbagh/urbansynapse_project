"""Train the energy-performance predictor from processed territorial data."""
import joblib
import pandas as pd
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
from app.ml.predictor import FEATURES

def main(csv_path: str = "data/processed/training_set.csv",
         out: str = "app/ml/models/energy_performance.joblib"):
    df = pd.read_csv(csv_path)
    X, y = df[FEATURES], df["energy_performance"]
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=42)
    model = XGBRegressor(n_estimators=400, max_depth=5, learning_rate=0.05)
    model.fit(Xtr, ytr)
    print("MAE:", mean_absolute_error(yte, model.predict(Xte)))
    joblib.dump(model, out)

if __name__ == "__main__":
    main()

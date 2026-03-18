import pickle
import pandas as pd
import numpy as np


def load_model():
    import os
    model_path = os.path.join(os.path.dirname(__file__), "risk_model.pkl")
    with open(model_path, "rb") as f:
        return pickle.load(f)


def predict_risk(data: dict):
    model = load_model()

    features = pd.DataFrame([{
        "has_mfa": int(data["has_mfa"]),
        "mfa_coverage": data["mfa_coverage"],
        "patch_days": data["patch_days"],
        "training_percent": data["training_percent"],
        "has_irp": int(data["has_irp"]),
        "vulnerabilities": data["vulnerabilities"],
        "employees": data["employees"],
        "industry_code": 0
    }])

    breach_probability = model.predict_proba(features)[0][1]
    risk_score = round(breach_probability * 100, 1)

    return risk_score


def predict_trend(data: dict):
    trend = []
    current = data.copy()

    for month in range(1, 13):
        score = predict_risk(current)
        trend.append({
            "month": month,
            "risk_score": score
        })

    return trend


if __name__ == "__main__":
    test = {
        "has_mfa": False,
        "mfa_coverage": 0,
        "patch_days": 60,
        "training_percent": 40,
        "has_irp": False,
        "vulnerabilities": 15,
        "employees": 100
    }

    score = predict_risk(test)
    trend = predict_trend(test)

    print("Risk Score:", score)
    print("\n12-Month Trend:")
    for t in trend:
        print(f"  Month {t['month']}: {t['risk_score']}")
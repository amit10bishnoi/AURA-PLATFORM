import pandas as pd
import numpy as np
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, roc_auc_score, classification_report
import shap
import pickle

df = pd.read_csv("training_data.csv")

X = df.drop("breach_occurred", axis=1)
y = df["breach_occurred"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = XGBClassifier(
    n_estimators=100,
    max_depth=4,
    learning_rate=0.1,
    random_state=42,
    eval_metric="logloss"
)

model.fit(X_train, y_train)

y_pred = model.predict(X_test)
y_prob = model.predict_proba(X_test)[:, 1]

accuracy = accuracy_score(y_test, y_pred)
auc = roc_auc_score(y_test, y_prob)

print("================================")
print("AURA ML Model — Training Results")
print("================================")
print(f"Accuracy:  {round(accuracy * 100, 1)}%")
print(f"AUC Score: {round(auc, 3)}")
print("\nClassification Report:")
print(classification_report(y_test, y_pred))

explainer = shap.Explainer(model)
shap_values = explainer(X_test)

print("Top features driving risk:")
feature_importance = pd.DataFrame({
    "feature": X.columns,
    "importance": model.feature_importances_
}).sort_values("importance", ascending=False)

for _, row in feature_importance.iterrows():
    print(f"  {row['feature']}: {round(row['importance'] * 100, 1)}%")

with open("risk_model.pkl", "wb") as f:
    pickle.dump(model, f)

print("\nModel saved to risk_model.pkl")
print("================================")
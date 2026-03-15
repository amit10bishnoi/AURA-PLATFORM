import json
import os
from datetime import datetime


def get_inputs():
    print("================================")
    print("      AURA Risk Assessment")
    print("================================")

    name = input("Company name: ")
    industry = input("Industry: ")
    employees = int(input("Number of employees: "))
    has_mfa = input("Is MFA enabled? (yes/no): ").lower() == "yes"
    mfa_coverage = int(input("MFA coverage % (0-100): ")) if has_mfa else 0
    patch_days = int(input("Days between patches: "))
    training = int(input("Staff training completion % (0-100): "))
    has_irp = input("Incident response plan? (yes/no): ").lower() == "yes"
    vulns = int(input("Open vulnerabilities: "))

    return {
        "name": name,
        "industry": industry,
        "employees": employees,
        "has_mfa": has_mfa,
        "mfa_coverage": mfa_coverage,
        "patch_days": patch_days,
        "training_percent": training,
        "has_irp": has_irp,
        "vulnerabilities": vulns
    }


def calculate_risk(org):
    score = 30

    if not org["has_mfa"]:
        score += 25
    elif org["mfa_coverage"] < 80:
        score += 8

    if org["patch_days"] <= 7:
        score += 0
    elif org["patch_days"] <= 30:
        score += 5
    elif org["patch_days"] <= 90:
        score += 12
    else:
        score += 20

    if org["training_percent"] >= 80:
        score += 0
    elif org["training_percent"] >= 50:
        score += 7
    else:
        score += 15

    if not org["has_irp"]:
        score += 10

    score += min(20, org["vulnerabilities"] * 1.5)

    return min(100, round(score, 1))


def risk_level(score):
    if score >= 75:
        return "CRITICAL"
    elif score >= 55:
        return "HIGH"
    elif score >= 35:
        return "MEDIUM"
    return "LOW"


def financial_exposure(score, employees):
    base = 150000
    size_factor = 1 + (employees / 500)
    risk_factor = score / 50
    return round(base * size_factor * risk_factor)


def get_recommendations(org):
    recs = []
    if not org["has_mfa"]:
        recs.append("Enable MFA across all systems immediately")
    if org["patch_days"] > 30:
        recs.append("Reduce patching cycle to under 30 days")
    if org["training_percent"] < 80:
        recs.append("Complete security training for all staff")
    if not org["has_irp"]:
        recs.append("Create and test an incident response plan")
    if org["vulnerabilities"] > 5:
        recs.append("Remediate open vulnerabilities")
    return recs


def save_result(org, score, level, exposure, recs):
    os.makedirs("results", exist_ok=True)

    result = {
        "company": org["name"],
        "industry": org["industry"],
        "employees": org["employees"],
        "date": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "risk_score": score,
        "risk_level": level,
        "financial_exposure": exposure,
        "recommendations": recs,
        "inputs": org
    }

    filename = org["name"].replace(" ", "_").lower() + "_" + datetime.now().strftime("%Y%m%d") + ".json"
    filepath = os.path.join("results", filename)

    with open(filepath, "w") as f:
        json.dump(result, f, indent=2)

    return filepath


org = get_inputs()
score = calculate_risk(org)
level = risk_level(score)
exposure = financial_exposure(score, org["employees"])
recs = get_recommendations(org)
filepath = save_result(org, score, level, exposure, recs)

print("\n================================")
print("Company:", org["name"])
print("Risk Score:", score, "/100")
print("Risk Level:", level)
print("Financial Exposure: $" + f"{exposure:,}")
print("Recommendations:")
for i, r in enumerate(recs, 1):
    print(f"  {i}.", r)
print("\nReport saved to:", filepath)
print("================================")
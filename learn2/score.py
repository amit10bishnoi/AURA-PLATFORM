org = {
    "name": "SecureBank Ltd",
    "industry": "finance",
    "employees": 300,
    "has_mfa": True,
    "mfa_coverage": 95,
    "patch_days": 7,
    "training_percent": 90,
    "has_irp": True,
    "vulnerabilities": 2
}


def mfa_risk(has_mfa, coverage):
    if not has_mfa:
        return 25
    elif coverage < 50:
        return 15
    elif coverage < 80:
        return 8
    return 2


def patch_risk(days):
    if days <= 7:
        return 0
    elif days <= 30:
        return 5
    elif days <= 90:
        return 12
    return 20


def training_risk(percent):
    if percent >= 80:
        return 0
    elif percent >= 50:
        return 7
    return 15


def vuln_risk(count):
    return min(20, count * 1.5)


def calculate_risk(org):
    score = 30
    score += mfa_risk(org["has_mfa"], org["mfa_coverage"])
    score += patch_risk(org["patch_days"])
    score += training_risk(org["training_percent"])
    score += vuln_risk(org["vulnerabilities"])

    if not org["has_irp"]:
        score += 10

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


score = calculate_risk(org)
level = risk_level(score)
exposure = financial_exposure(score, org["employees"])
recs = get_recommendations(org)

print("================================")
print("Company:", org["name"])
print("Industry:", org["industry"])
print("Risk Score:", score, "/100")
print("Risk Level:", level)
print("Financial Exposure: $" + f"{exposure:,}")
print("Recommendations:")
for i, r in enumerate(recs, 1):
    print(f"  {i}.", r)
print("================================")
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


def calculate_risk(data):
    score = 30
    score += mfa_risk(data["has_mfa"], data["mfa_coverage"])
    score += patch_risk(data["patch_days"])
    score += training_risk(data["training_percent"])
    score += vuln_risk(data["vulnerabilities"])

    if not data["has_irp"]:
        score += 10

    return min(100, round(score, 1))


def get_risk_level(score):
    if score >= 75:
        return "CRITICAL"
    elif score >= 55:
        return "HIGH"
    elif score >= 35:
        return "MEDIUM"
    return "LOW"


def get_financial_exposure(score, employees):
    base = 150000
    size_factor = 1 + (employees / 500)
    risk_factor = score / 50
    return round(base * size_factor * risk_factor)


def get_recommendations(data):
    recs = []
    if not data["has_mfa"]:
        recs.append("Enable MFA across all systems immediately")
    if data["patch_days"] > 30:
        recs.append("Reduce patching cycle to under 30 days")
    if data["training_percent"] < 80:
        recs.append("Complete security training for all staff")
    if not data["has_irp"]:
        recs.append("Create and test an incident response plan")
    if data["vulnerabilities"] > 5:
        recs.append("Remediate open vulnerabilities")
    return recs
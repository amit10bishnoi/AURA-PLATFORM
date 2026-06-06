"""
assessment_service.py — MongoDB edition
Risk scoring logic unchanged; Task creation now uses Motor async.
"""
import os
import json
import pickle
import httpx
from typing import List, Tuple, Optional

from database import col, gen_uuid, ist_now

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "risk_model.pkl")
ml_model = None
try:
    if os.path.exists(MODEL_PATH):
        with open(MODEL_PATH, "rb") as f:
            ml_model = pickle.load(f)
        print("✅ ML model loaded")
except Exception as e:
    print(f"⚠️  ML model not loaded: {e}")

def _tasks(): return col("tasks")


def calculate_risk_score(employees, has_mfa, mfa_coverage, patch_days,
                         training_percent, has_irp, vulnerabilities,
                         vuln_critical=0, vuln_high=0, vuln_medium=0, vuln_low=0
                         ) -> Tuple[float, str]:
    if ml_model:
        try:
            features = [[employees, int(has_mfa), mfa_coverage, patch_days,
                         training_percent, int(has_irp), vulnerabilities]]
            score = float(ml_model.predict(features)[0])
            score = max(0.0, min(100.0, score))
        except Exception:
            score = _rule_score(employees, has_mfa, mfa_coverage, patch_days,
                                training_percent, has_irp, vulnerabilities,
                                vuln_critical, vuln_high, vuln_medium, vuln_low)
    else:
        score = _rule_score(employees, has_mfa, mfa_coverage, patch_days,
                            training_percent, has_irp, vulnerabilities,
                            vuln_critical, vuln_high, vuln_medium, vuln_low)

    level = ("CRITICAL" if score >= 75 else
             "HIGH"     if score >= 50 else
             "MEDIUM"   if score >= 25 else "LOW")
    return round(score, 2), level


def _rule_score(employees, has_mfa, mfa_coverage, patch_days,
                training_percent, has_irp, vulnerabilities,
                vuln_critical, vuln_high, vuln_medium, vuln_low) -> float:
    score = 50.0
    score += -20 * (mfa_coverage / 100) if has_mfa else 10
    if   patch_days <= 7:  score -= 15
    elif patch_days <= 14: score -= 10
    elif patch_days <= 30: score -= 5
    elif patch_days <= 60: score += 5
    else:                  score += 15
    if   training_percent >= 90: score -= 10
    elif training_percent >= 70: score -= 5
    elif training_percent >= 25: score += 3
    else:                        score += 5
    score += -10 if has_irp else 5
    if vuln_critical or vuln_high:
        score += min(25, (vuln_critical * 10 + vuln_high * 5 + vuln_medium * 2 + vuln_low * 0.5) / 2)
    else:
        if   vulnerabilities > 50: score += 20
        elif vulnerabilities > 20: score += 10
        elif vulnerabilities > 10: score += 5
        elif vulnerabilities > 0:  score += 2
    if employees > 1000: score += 5
    elif employees > 500: score += 3
    return max(0.0, min(100.0, score))


def estimate_financial_exposure(risk_score: float, employees: int, industry: Optional[str] = None) -> float:
    multipliers = {"healthcare":1.5,"finance":1.4,"financial services":1.4,"banking":1.4,"technology":1.2,"retail":1.1}
    m = 1.0
    if industry:
        for k, v in multipliers.items():
            if k in industry.lower(): m = v; break
    prob = (0.4 if risk_score >= 75 else 0.25 if risk_score >= 50 else 0.1 if risk_score >= 25 else 0.05)
    return round(employees * 500 * m * (risk_score / 100) * prob, 2)


def generate_recommendations(has_mfa, mfa_coverage, patch_days, training_percent,
                              has_irp, vulnerabilities, vuln_critical=0, vuln_high=0) -> List[str]:
    recs = []
    if not has_mfa: recs.append("CRITICAL: Implement MFA across all user accounts.")
    elif mfa_coverage < 80: recs.append(f"HIGH: Increase MFA coverage from {mfa_coverage}% to at least 95%.")
    if patch_days > 30: recs.append(f"HIGH: Reduce patch deployment time from {patch_days} days to under 14 days.")
    if training_percent < 50: recs.append(f"HIGH: Increase security training from {training_percent}% to at least 90%.")
    if not has_irp: recs.append("CRITICAL: Develop and document an Incident Response Plan (IRP).")
    if vuln_critical > 0: recs.append(f"CRITICAL: Address {vuln_critical} critical vulnerabilities immediately.")
    if vuln_high > 5: recs.append(f"HIGH: Prioritize {vuln_high} high-severity vulnerabilities within 30 days.")
    if vulnerabilities > 20 and not vuln_critical and not vuln_high:
        recs.append(f"MEDIUM: Review and remediate {vulnerabilities} open vulnerabilities.")
    if not recs:
        recs.append("Your security posture is strong. Continue regular assessments.")
        recs.append("Consider Zero Trust Architecture and threat hunting exercises.")
    return recs


async def create_remediation_tasks(tenant_id: str, assessment_id: str,
                                    recommendations: List[str],
                                    created_by: Optional[str] = None) -> list:
    docs = []
    for rec in recommendations:
        if rec.startswith("CRITICAL:"): priority, title = "CRITICAL", rec[9:].strip()
        elif rec.startswith("HIGH:"):   priority, title = "HIGH",     rec[5:].strip()
        elif rec.startswith("MEDIUM:"): priority, title = "MEDIUM",   rec[7:].strip()
        else:                           priority, title = "MEDIUM",   rec
        if len(title) > 200: title = title[:197] + "..."
        uid = gen_uuid()
        docs.append({"_id":uid,"id":uid,"tenant_id":tenant_id,"title":title,"description":rec,"priority":priority,"status":"open","source":"assessment","source_assessment_id":assessment_id,"created_by":created_by,"created_at":ist_now(),"updated_at":ist_now()})
    if docs:
        await _tasks().insert_many(docs)
    return docs


async def generate_ai_remediation(org_name, industry, risk_score, risk_level,
                                   financial_exposure, has_mfa, mfa_coverage,
                                   patch_days, training_percent, has_irp,
                                   vulnerabilities, vuln_critical, vuln_high, vuln_medium) -> List[dict]:
    prompt = f"""You are a cybersecurity expert. Analyze this security assessment and provide detailed remediation steps.

ORGANIZATION: {org_name}
INDUSTRY: {industry or "General"}
RISK SCORE: {risk_score}/100 ({risk_level})
FINANCIAL EXPOSURE: ${financial_exposure:,.0f}

SECURITY POSTURE:
- MFA Enabled: {has_mfa} | Coverage: {mfa_coverage}%
- Patch Deployment: {patch_days} days average
- Security Training: {training_percent}% of staff
- Incident Response Plan: {has_irp}
- Total Vulnerabilities: {vulnerabilities}
- Critical: {vuln_critical} | High: {vuln_high} | Medium: {vuln_medium}

Generate exactly 5 remediation tasks. Respond ONLY with a JSON array:
[{{"title":"...","description":"...","priority":"CRITICAL|HIGH|MEDIUM|LOW","effort_days":7,"impact":"..."}}]"""

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={"Content-Type":"application/json","x-api-key":os.getenv("ANTHROPIC_API_KEY",""),"anthropic-version":"2023-06-01"},
                json={"model":"claude-sonnet-4-20250514","max_tokens":1500,"messages":[{"role":"user","content":prompt}]},
            )
            data = response.json()
            text = data["content"][0]["text"].strip()
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"): text = text[4:]
            return json.loads(text.strip())
    except Exception as e:
        print(f"❌ AI remediation failed: {e}")
        return []

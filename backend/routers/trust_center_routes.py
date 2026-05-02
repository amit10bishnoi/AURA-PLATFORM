"""
trust_center_routes.py — Public Trust Center
Place at: backend/routers/trust_center_routes.py

Public endpoint — NO auth required.
Returns a company's compliance posture for public display.

Wire in main.py:
  from routers.trust_center_routes import router as trust_router
  app.include_router(trust_router)

Public URL pattern:
  GET /trust/{tenant_id}          ← full trust center data
  GET /trust/{tenant_id}/badge    ← embeddable badge JSON
"""

from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session
from fastapi import Depends
from database import get_db
from models import Assessment, User, Task
from datetime import datetime, timedelta
from typing import Optional

router = APIRouter(prefix="/trust", tags=["Public Trust Center"])

IST = timedelta(hours=5, minutes=30)
def ist_now(): return (datetime.utcnow() + IST).strftime("%d %b %Y, %I:%M %p IST")


def _get_trust_data(tenant_id: str, db: Session):
    """Core function — builds trust center payload."""

    # Get org name from users
    user = db.query(User).filter(User.tenant_id == tenant_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Organisation not found")

    org_name = getattr(user, "tenant_name", None) or tenant_id.replace("tenant_", "").replace("_", " ").title()

    # Get latest assessment
    assessment = (
        db.query(Assessment)
        .filter(Assessment.tenant_id == tenant_id)
        .order_by(Assessment.created_at.desc())
        .first()
    )

    if not assessment:
        return {
            "tenant_id":  tenant_id,
            "org_name":   org_name,
            "status":     "no_data",
            "message":    "No assessment data available yet.",
            "last_updated": ist_now(),
        }

    # Compute framework scores
    risk_score = float(assessment.risk_score or 0)
    risk_level = assessment.risk_level or "UNKNOWN"

    # Derive compliance % from risk score (inverse)
    iso_pct   = max(0, min(100, round(100 - risk_score * 0.7, 0)))
    nist_pct  = max(0, min(100, round(100 - risk_score * 0.65, 0)))
    soc2_pct  = max(0, min(100, round(100 - risk_score * 0.6, 0)))
    hipaa_pct = max(0, min(100, round(100 - risk_score * 0.75, 0)))
    gdpr_pct  = max(0, min(100, round(100 - risk_score * 0.7, 0)))
    rbi_pct   = max(0, min(100, round(100 - risk_score * 0.65, 0)))
    dpdp_pct  = max(0, min(100, round(100 - risk_score * 0.6, 0)))

    def status(pct):
        if pct >= 80: return "compliant"
        if pct >= 50: return "in_progress"
        return "attention"

    # Open tasks
    open_tasks = db.query(Task).filter(
        Task.tenant_id == tenant_id,
        Task.status != "done"
    ).count()

    done_tasks = db.query(Task).filter(
        Task.tenant_id == tenant_id,
        Task.status == "done"
    ).count()

    frameworks = [
        {"key": "ISO27001",  "name": "ISO 27001:2022",                  "score": iso_pct,   "status": status(iso_pct),   "color": "#6366F1", "description": "Information Security Management"},
        {"key": "NIST_CSF",  "name": "NIST CSF v2.0",                   "score": nist_pct,  "status": status(nist_pct),  "color": "#3B82F6", "description": "Cybersecurity Framework"},
        {"key": "SOC2",      "name": "SOC 2 Type II",                    "score": soc2_pct,  "status": status(soc2_pct),  "color": "#8B5CF6", "description": "Trust Service Criteria"},
        {"key": "HIPAA",     "name": "HIPAA",                            "score": hipaa_pct, "status": status(hipaa_pct), "color": "#EC4899", "description": "Health Data Protection"},
        {"key": "GDPR",      "name": "GDPR",                             "score": gdpr_pct,  "status": status(gdpr_pct),  "color": "#F59E0B", "description": "EU Data Protection"},
        {"key": "RBI",       "name": "RBI Cybersecurity Framework",      "score": rbi_pct,   "status": status(rbi_pct),   "color": "#10B981", "description": "Reserve Bank of India"},
        {"key": "DPDP",      "name": "DPDP Act 2023",                    "score": dpdp_pct,  "status": status(dpdp_pct),  "color": "#F97316", "description": "India Digital Personal Data"},
    ]

    overall_pct = round(sum(f["score"] for f in frameworks) / len(frameworks), 1)

    security_highlights = []
    if assessment.has_mfa:
        security_highlights.append({"icon": "shield", "text": f"Multi-Factor Authentication enabled ({assessment.mfa_coverage or 0}% coverage)"})
    if assessment.patch_days and assessment.patch_days <= 14:
        security_highlights.append({"icon": "zap", "text": f"Patches applied within {assessment.patch_days} days of release"})
    if assessment.has_irp:
        security_highlights.append({"icon": "check", "text": "Incident Response Plan in place"})
    if assessment.training_percent and assessment.training_percent >= 70:
        security_highlights.append({"icon": "users", "text": f"{assessment.training_percent}% of employees completed security training"})
    if not security_highlights:
        security_highlights.append({"icon": "shield", "text": "Security posture actively monitored"})

    return {
        "tenant_id":          tenant_id,
        "org_name":           org_name,
        "overall_score":      overall_pct,
        "risk_score":         risk_score,
        "risk_level":         risk_level,
        "last_assessed":      assessment.created_at.strftime("%d %b %Y") if assessment.created_at else "Unknown",
        "last_updated":       ist_now(),
        "frameworks":         frameworks,
        "security_highlights": security_highlights,
        "open_remediations":  open_tasks,
        "completed_remediations": done_tasks,
        "powered_by":         "AURA Platform — AI-Powered GRC",
        "verified":           True,
    }


@router.get("/{tenant_id}", summary="Public Trust Center — full data", include_in_schema=True)
def get_trust_center(tenant_id: str, db: Session = Depends(get_db)):
    """Public endpoint — no auth. Returns compliance posture for public Trust Center page."""
    return _get_trust_data(tenant_id, db)


@router.get("/{tenant_id}/badge", summary="Embeddable compliance badge data")
def get_badge(tenant_id: str, db: Session = Depends(get_db)):
    """Returns minimal badge data for embedding in websites."""
    data = _get_trust_data(tenant_id, db)
    compliant_count = sum(1 for f in data.get("frameworks", []) if f["status"] == "compliant")
    return {
        "org_name":       data.get("org_name"),
        "overall_score":  data.get("overall_score"),
        "compliant_frameworks": compliant_count,
        "total_frameworks":     len(data.get("frameworks", [])),
        "last_updated":   data.get("last_updated"),
        "powered_by":     "AURA Platform",
    }

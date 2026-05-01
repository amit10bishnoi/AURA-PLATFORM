import json
"""
auto_assessment_routes.py — Fully Automatic Assessment Engine
Place at: backend/routers/auto_assessment_routes.py

Endpoints:
  POST /api/auto/assess           — Full auto assessment (no manual input)
  GET  /api/auto/pull/{id}        — Enrich existing assessment with live data
  GET  /api/auto/sources          — Show which providers are LIVE vs SIMULATED
  GET  /api/auto/dashboard/{id}   — Rich dashboard data for frontend

Wire up in main.py:
  from routers.auto_assessment_routes import router as auto_router
  app.include_router(auto_router)
"""

import os
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from models import Assessment, Task
from services.identity_service import pull_identity_data
from services.patch_service import pull_patch_data
from services.asset_service import pull_asset_data

router = APIRouter(prefix="/api/auto", tags=["Auto Assessment"])


# ── Pydantic Schemas ──────────────────────────────────────────────────────────

class AutoAssessRequest(BaseModel):
    org_name: str
    industry: str = "Technology"
    employees: int = 100


class SourceStatus(BaseModel):
    provider: str
    mode: str
    fields_provided: List[str]
    to_enable: str


class AutoAssessResponse(BaseModel):
    assessment_id: str
    org_name: str
    pulled_at: str
    identity_summary: Dict[str, Any]
    patch_summary: Dict[str, Any]
    asset_summary: Dict[str, Any]
    all_findings: List[Dict[str, Any]]
    auto_filled_fields: Dict[str, Any]
    tasks_created: int
    risk_summary: str


# ── Internal helpers ──────────────────────────────────────────────────────────

def _merge_aura_fields(
    identity: Dict, patch: Dict, assets: Dict
) -> Dict[str, Any]:
    """
    Merges all 3 provider outputs into AURA Assessment model fields.
    Priority: Identity → Patch → Assets
    """
    id_fields   = identity.get("aura_fields", {})
    patch_fields = patch.get("aura_fields", {})
    asset_fields = assets.get("aura_fields", {})

    return {
        # Identity-derived
        "has_mfa":         id_fields.get("has_mfa", False),
        "mfa_coverage":    id_fields.get("mfa_coverage", 0),
        "has_irp":         id_fields.get("has_irp", False),
        "training_percent":id_fields.get("training_percent", 50),

        # Patch-derived
        "patch_days":      patch_fields.get("patch_days", 30),
        "vulnerabilities": patch_fields.get("vulnerabilities", 0),
        "vuln_critical":   patch_fields.get("vuln_critical", 0),
        "vuln_high":       patch_fields.get("vuln_high", 0),
        "vuln_medium":     patch_fields.get("vuln_medium", 0),
        "vuln_low":        patch_fields.get("vuln_low", 0),
        "vuln_source":     "Intune+Jamf+WSUS+NVD (Auto)",

        # Asset-derived
        "data_encryption":    asset_fields.get("data_encryption", False),
        "audit_logging":      asset_fields.get("audit_logging", False),
        "threat_detection":   asset_fields.get("threat_detection", False),
        "network_segmentation": asset_fields.get("network_segmentation", False),
    }


def _compute_risk_score(fields: Dict, all_findings: List) -> tuple:
    """Compute risk score from auto-pulled data."""
    score = 50  # baseline

    # MFA impact
    mfa_cov = fields.get("mfa_coverage", 0)
    if mfa_cov < 50:   score += 20
    elif mfa_cov < 80: score += 10
    else:              score -= 5

    # Patch impact
    patch_days = fields.get("patch_days", 30)
    if patch_days > 60: score += 15
    elif patch_days > 30: score += 8

    # Critical vulns impact
    crit = fields.get("vuln_critical", 0)
    score += min(crit * 5, 20)

    # IRP and training
    if not fields.get("has_irp", False): score += 10
    training = fields.get("training_percent", 50)
    if training < 50: score += 8

    # Asset security
    if not fields.get("data_encryption", False): score += 8
    if not fields.get("audit_logging", False):   score += 7

    # Cap and determine level
    score = max(0, min(100, score))
    if score >= 75:   level = "CRITICAL"
    elif score >= 50: level = "HIGH"
    elif score >= 25: level = "MEDIUM"
    else:             level = "LOW"

    return round(score, 1), level


def _create_remediation_tasks(
    db: Session, assessment_id: str,
    tenant_id: str, user_id: str,
    findings: List[Dict]
) -> int:
    """Auto-creates tasks for CRITICAL and HIGH findings only."""
    created = 0
    for f in findings:
        if f.get("severity") not in ("CRITICAL", "HIGH"):
            continue
        task = Task(
            tenant_id=tenant_id,
            created_by=user_id,
            source_assessment_id=assessment_id,
            title=f"[{f['severity']}] {f['control']}: {f['finding'][:100]}",
            description=(
                f"Auto-detected finding:\n{f['finding']}\n\n"
                f"Recommended fix:\n{f['recommendation']}\n\n"
                f"Framework: NIST {f['nist_ref']} | ISO {f['iso_ref']}"
            ),
            status="open",
            priority=f["severity"],
            source="auto_assessment",
        )
        db.add(task)
        created += 1

    if created:
        db.commit()
    return created


def _collect_findings(identity: Dict, patch: Dict, assets: Dict) -> List[Dict]:
    """Collects and deduplicates findings from all providers."""
    all_findings = []

    # From identity (nested by provider)
    all_findings.extend(identity.get("all_risk_indicators", []))

    # From patch (nested by provider)
    all_findings.extend(patch.get("all_risk_indicators", []))

    # From assets (nested by provider)
    all_findings.extend(assets.get("all_risk_indicators", []))

    # Deduplicate by control+severity
    seen = set()
    unique = []
    for f in all_findings:
        key = f"{f.get('control','')}_{f.get('severity','')}"
        if key not in seen:
            seen.add(key)
            unique.append(f)

    # Sort by severity
    order = {"CRITICAL":0,"HIGH":1,"MEDIUM":2,"LOW":3}
    unique.sort(key=lambda x: order.get(x.get("severity","LOW"), 4))
    return unique


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post(
    "/assess",
    response_model=AutoAssessResponse,
    summary="Fully automatic risk assessment",
    description=(
        "Pulls identity data from Azure AD + AWS IAM + Google Workspace, "
        "patch data from Intune + Jamf + WSUS, and asset inventory from "
        "AWS + Azure + GCP. Scores the assessment automatically and creates "
        "remediation tasks for all CRITICAL and HIGH findings. "
        "No manual form input required."
    ),
)
def run_auto_assessment(
    req: AutoAssessRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    org_name = req.org_name
    employees = req.employees

    # Pull all data sources
    try:
        identity_data = pull_identity_data(org_name, employees)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Identity pull failed: {e}")

    try:
        patch_data = pull_patch_data(org_name, employees)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Patch pull failed: {e}")

    try:
        asset_data = pull_asset_data(org_name, employees)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Asset pull failed: {e}")

    # Merge fields
    auto_fields = _merge_aura_fields(identity_data, patch_data, asset_data)
    all_findings = _collect_findings(identity_data, patch_data, asset_data)
    risk_score, risk_level = _compute_risk_score(auto_fields, all_findings)

    # Save assessment
    assessment = Assessment(
        tenant_id=current_user.tenant_id,
        created_by=current_user.id,
        org_name=org_name,
        industry=req.industry,
        employees=employees,
        has_mfa=auto_fields["has_mfa"],
        mfa_coverage=auto_fields["mfa_coverage"],
        patch_days=auto_fields["patch_days"],
        training_percent=auto_fields["training_percent"],
        has_irp=auto_fields["has_irp"],
        vulnerabilities=auto_fields["vulnerabilities"],
        risk_score=risk_score,
        risk_level=risk_level,
        financial_exposure=float(employees * 9200),
        recommendations=json.dumps([f["recommendation"] for f in all_findings[:6]]),
        model_version="auto-v2",
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    tasks_created = _create_remediation_tasks(
        db, assessment.id,
        current_user.tenant_id,
        current_user.id,
        all_findings,
    )

    crit_count = sum(1 for f in all_findings if f["severity"]=="CRITICAL")
    high_count = sum(1 for f in all_findings if f["severity"]=="HIGH")
    risk_summary = (
        f"Auto-scored {risk_score}/100 ({risk_level}). "
        f"{crit_count} Critical + {high_count} High findings across "
        f"3 identity providers, 3 patch systems, 3 clouds. "
        f"{tasks_created} remediation tasks created."
    )

    return AutoAssessResponse(
        assessment_id=assessment.id,
        org_name=org_name,
        pulled_at=(datetime.utcnow() + timedelta(hours=5, minutes=30)).strftime('%Y-%m-%dT%H:%M:%S IST'),
        identity_summary=identity_data.get("summary", {}),
        patch_summary=patch_data.get("summary", {}),
        asset_summary=asset_data.get("summary", {}),
        all_findings=all_findings,
        auto_filled_fields=auto_fields,
        tasks_created=tasks_created,
        risk_summary=risk_summary,
    )


@router.get(
    "/pull/{assessment_id}",
    summary="Enrich existing assessment with live data",
)
def pull_for_assessment(
    assessment_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Takes an existing assessment and auto-fills all fields from live sources."""
    assessment = (
        db.query(Assessment)
        .filter(
            Assessment.id == assessment_id,
            Assessment.tenant_id == current_user.tenant_id,
        )
        .first()
    )
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found.")

    employees = assessment.employees or 100

    identity_data = pull_identity_data(assessment.org_name, employees)
    patch_data    = pull_patch_data(assessment.org_name, employees)
    asset_data    = pull_asset_data(assessment.org_name, employees)

    auto_fields = _merge_aura_fields(identity_data, patch_data, asset_data)
    all_findings = _collect_findings(identity_data, patch_data, asset_data)
    risk_score, risk_level = _compute_risk_score(auto_fields, all_findings)

    # Update existing assessment
    for field in ["has_mfa","mfa_coverage","patch_days","training_percent",
                  "has_irp","vulnerabilities","vuln_critical","vuln_high",
                  "vuln_medium","vuln_low","vuln_source"]:
        if field in auto_fields and hasattr(assessment, field):
            setattr(assessment, field, auto_fields[field])

    assessment.risk_score = risk_score
    assessment.risk_level = risk_level
    db.commit()

    tasks_created = _create_remediation_tasks(
        db, assessment.id,
        current_user.tenant_id,
        current_user.id,
        all_findings,
    )

    return {
        "assessment_id": assessment_id,
        "updated": True,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "fields_updated": list(auto_fields.keys()),
        "findings": len(all_findings),
        "tasks_created": tasks_created,
        "identity": identity_data,
        "patch": patch_data,
        "assets": asset_data,
    }


@router.get(
    "/sources",
    summary="Show integration status for all data sources",
)
def get_data_sources(_=Depends(get_current_user)):
    """Shows which of the 9 integrations are LIVE vs SIMULATED."""
    return {
        "identity_providers": [
            {
                "provider": "Azure AD / Microsoft Entra ID",
                "mode": "LIVE" if os.getenv("AZURE_TENANT_ID") else "SIMULATED",
                "fields": ["has_mfa","mfa_coverage","has_irp","training_percent"],
                "enable_with": "AZURE_TENANT_ID + AZURE_CLIENT_ID + AZURE_CLIENT_SECRET",
            },
            {
                "provider": "AWS IAM",
                "mode": "LIVE" if os.getenv("AWS_ACCESS_KEY_ID") else "SIMULATED",
                "fields": ["has_mfa","mfa_coverage","audit_logging"],
                "enable_with": "AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY",
            },
            {
                "provider": "Google Workspace",
                "mode": "LIVE" if os.getenv("GOOGLE_WORKSPACE_DOMAIN") else "SIMULATED",
                "fields": ["has_mfa","mfa_coverage","data_retention"],
                "enable_with": "GOOGLE_WORKSPACE_DOMAIN + GOOGLE_SERVICE_ACCOUNT_JSON",
            },
        ],
        "patch_providers": [
            {
                "provider": "Microsoft Intune",
                "mode": "LIVE" if os.getenv("INTUNE_TENANT_ID") else "SIMULATED",
                "fields": ["patch_days","vulnerabilities","vuln_critical","vuln_high"],
                "enable_with": "INTUNE_TENANT_ID + INTUNE_CLIENT_ID + INTUNE_CLIENT_SECRET",
            },
            {
                "provider": "Jamf Pro",
                "mode": "LIVE" if os.getenv("JAMF_URL") else "SIMULATED",
                "fields": ["patch_days","data_encryption","malware_protection"],
                "enable_with": "JAMF_URL + JAMF_CLIENT_ID + JAMF_CLIENT_SECRET",
            },
            {
                "provider": "Windows Update for Business / WSUS",
                "mode": "LIVE" if os.getenv("WSUS_SERVER_URL") else "SIMULATED",
                "fields": ["patch_days","vulnerabilities"],
                "enable_with": "WSUS_SERVER_URL + WSUS_API_KEY",
            },
        ],
        "asset_providers": [
            {
                "provider": "Amazon Web Services",
                "mode": "LIVE" if os.getenv("AWS_ACCESS_KEY_ID") else "SIMULATED",
                "fields": ["data_encryption","audit_logging","threat_detection"],
                "enable_with": "AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY + AWS_REGION",
            },
            {
                "provider": "Microsoft Azure",
                "mode": "LIVE" if os.getenv("AZURE_SUBSCRIPTION_ID") else "SIMULATED",
                "fields": ["data_encryption","threat_detection","siem_enabled"],
                "enable_with": "AZURE_SUBSCRIPTION_ID + AZURE_TENANT_ID",
            },
            {
                "provider": "Google Cloud Platform",
                "mode": "LIVE" if os.getenv("GCP_PROJECT_ID") else "SIMULATED",
                "fields": ["data_encryption","audit_logging","threat_detection"],
                "enable_with": "GCP_PROJECT_ID + GOOGLE_APPLICATION_CREDENTIALS",
            },
        ],
        "total_providers": 9,
        "live_providers": sum([
            bool(os.getenv("AZURE_TENANT_ID")),
            bool(os.getenv("AWS_ACCESS_KEY_ID")),
            bool(os.getenv("GOOGLE_WORKSPACE_DOMAIN")),
            bool(os.getenv("INTUNE_TENANT_ID")),
            bool(os.getenv("JAMF_URL")),
            bool(os.getenv("WSUS_SERVER_URL")),
            bool(os.getenv("AZURE_SUBSCRIPTION_ID")),
            bool(os.getenv("GCP_PROJECT_ID")),
        ]),
        "simulated_providers": 9 - sum([
            bool(os.getenv("AZURE_TENANT_ID")),
            bool(os.getenv("AWS_ACCESS_KEY_ID")),
            bool(os.getenv("GOOGLE_WORKSPACE_DOMAIN")),
            bool(os.getenv("INTUNE_TENANT_ID")),
            bool(os.getenv("JAMF_URL")),
            bool(os.getenv("WSUS_SERVER_URL")),
            bool(os.getenv("AZURE_SUBSCRIPTION_ID")),
            bool(os.getenv("GCP_PROJECT_ID")),
        ]),
    }

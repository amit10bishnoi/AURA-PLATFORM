"""
auto_assessment_routes.py — MongoDB edition
All SQLAlchemy ORM (Assessment, Task) replaced with Motor async inserts/updates.
Business logic (_merge_aura_fields, _compute_risk_score, etc.) unchanged.
"""
import json
import os
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from database import get_collection, ist_now, gen_uuid
from dependencies import get_current_user
from services.identity_service import pull_identity_data
from services.patch_service import pull_patch_data
from services.asset_service import pull_asset_data

router = APIRouter(prefix="/api/auto", tags=["Auto Assessment"])


def _assessments():
    return get_collection("assessments")

def _tasks():
    return get_collection("tasks")


# ── Pydantic Schemas ──────────────────────────────────────────────────────────

class AutoAssessRequest(BaseModel):
    org_name:  str
    industry:  str = "Technology"
    employees: int = 100


class AutoAssessResponse(BaseModel):
    assessment_id:     str
    org_name:          str
    pulled_at:         str
    identity_summary:  Dict[str, Any]
    patch_summary:     Dict[str, Any]
    asset_summary:     Dict[str, Any]
    all_findings:      List[Dict[str, Any]]
    auto_filled_fields: Dict[str, Any]
    tasks_created:     int
    risk_summary:      str


# ── Internal helpers (business logic unchanged) ───────────────────────────────

def _merge_aura_fields(identity: Dict, patch: Dict, assets: Dict) -> Dict[str, Any]:
    id_fields    = identity.get("aura_fields", {})
    patch_fields = patch.get("aura_fields", {})
    asset_fields = assets.get("aura_fields", {})
    return {
        "has_mfa":              id_fields.get("has_mfa", False),
        "mfa_coverage":         id_fields.get("mfa_coverage", 0),
        "has_irp":              id_fields.get("has_irp", False),
        "training_percent":     id_fields.get("training_percent", 50),
        "patch_days":           patch_fields.get("patch_days", 30),
        "vulnerabilities":      patch_fields.get("vulnerabilities", 0),
        "vuln_critical":        patch_fields.get("vuln_critical", 0),
        "vuln_high":            patch_fields.get("vuln_high", 0),
        "vuln_medium":          patch_fields.get("vuln_medium", 0),
        "vuln_low":             patch_fields.get("vuln_low", 0),
        "vuln_source":          "Intune+Jamf+WSUS+NVD (Auto)",
        "data_encryption":      asset_fields.get("data_encryption", False),
        "audit_logging":        asset_fields.get("audit_logging", False),
        "threat_detection":     asset_fields.get("threat_detection", False),
        "network_segmentation": asset_fields.get("network_segmentation", False),
    }


def _compute_risk_score(fields: Dict, all_findings: List) -> tuple:
    score = 50
    mfa_cov = fields.get("mfa_coverage", 0)
    if mfa_cov < 50:   score += 20
    elif mfa_cov < 80: score += 10
    else:              score -= 5
    patch_days = fields.get("patch_days", 30)
    if patch_days > 60:  score += 15
    elif patch_days > 30: score += 8
    score += min(fields.get("vuln_critical", 0) * 5, 20)
    if not fields.get("has_irp", False):           score += 10
    if fields.get("training_percent", 50) < 50:    score += 8
    if not fields.get("data_encryption", False):   score += 8
    if not fields.get("audit_logging", False):     score += 7
    score = max(0, min(100, score))
    if score >= 75:   level = "CRITICAL"
    elif score >= 50: level = "HIGH"
    elif score >= 25: level = "MEDIUM"
    else:             level = "LOW"
    return round(score, 1), level


def _collect_findings(identity: Dict, patch: Dict, assets: Dict) -> List[Dict]:
    all_findings = (
        identity.get("all_risk_indicators", []) +
        patch.get("all_risk_indicators", []) +
        assets.get("all_risk_indicators", [])
    )
    seen, unique = set(), []
    for f in all_findings:
        key = f"{f.get('control','')}_{f.get('severity','')}"
        if key not in seen:
            seen.add(key)
            unique.append(f)
    order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    unique.sort(key=lambda x: order.get(x.get("severity", "LOW"), 4))
    return unique


async def _create_remediation_tasks(
    assessment_id: str,
    tenant_id: str,
    user_id: str,
    findings: List[Dict],
) -> int:
    docs = []
    for f in findings:
        if f.get("severity") not in ("CRITICAL", "HIGH"):
            continue
        uid = gen_uuid()
        docs.append({
            "_id":                  uid,
            "id":                   uid,
            "tenant_id":            tenant_id,
            "created_by":           user_id,
            "source_assessment_id": assessment_id,
            "title":                f"[{f['severity']}] {f['control']}: {f['finding'][:100]}",
            "description": (
                f"Auto-detected finding:\n{f['finding']}\n\n"
                f"Recommended fix:\n{f['recommendation']}\n\n"
                f"Framework: NIST {f['nist_ref']} | ISO {f['iso_ref']}"
            ),
            "status":    "open",
            "priority":  f["severity"],
            "source":    "auto_assessment",
            "created_at": ist_now(),
            "updated_at": ist_now(),
        })
    if docs:
        await _tasks().insert_many(docs)
    return len(docs)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/assess", response_model=AutoAssessResponse,
             summary="Fully automatic risk assessment")
async def run_auto_assessment(
    req: AutoAssessRequest,
    current_user=Depends(get_current_user),
):
    try:
        identity_data = pull_identity_data(req.org_name, req.employees)
    except Exception as e:
        raise HTTPException(500, f"Identity pull failed: {e}")
    try:
        patch_data = pull_patch_data(req.org_name, req.employees)
    except Exception as e:
        raise HTTPException(500, f"Patch pull failed: {e}")
    try:
        asset_data = pull_asset_data(req.org_name, req.employees)
    except Exception as e:
        raise HTTPException(500, f"Asset pull failed: {e}")

    auto_fields   = _merge_aura_fields(identity_data, patch_data, asset_data)
    all_findings  = _collect_findings(identity_data, patch_data, asset_data)
    risk_score, risk_level = _compute_risk_score(auto_fields, all_findings)

    uid = gen_uuid()
    doc = {
        "_id":               uid,
        "id":                uid,
        "tenant_id":         current_user.tenant_id,
        "created_by":        current_user.id,
        "org_name":          req.org_name,
        "industry":          req.industry,
        "employees":         req.employees,
        "risk_score":        risk_score,
        "risk_level":        risk_level,
        "financial_exposure": float(req.employees * 9200),
        "recommendations":   [f["recommendation"] for f in all_findings[:6]],
        "model_version":     "auto-v2",
        "created_at":        ist_now(),
        "updated_at":        ist_now(),
        **{k: v for k, v in auto_fields.items()},
    }
    await _assessments().insert_one(doc)

    tasks_created = await _create_remediation_tasks(
        uid, current_user.tenant_id, current_user.id, all_findings
    )

    crit  = sum(1 for f in all_findings if f["severity"] == "CRITICAL")
    high  = sum(1 for f in all_findings if f["severity"] == "HIGH")
    risk_summary = (
        f"Auto-scored {risk_score}/100 ({risk_level}). "
        f"{crit} Critical + {high} High findings across "
        f"3 identity providers, 3 patch systems, 3 clouds. "
        f"{tasks_created} remediation tasks created."
    )

    return AutoAssessResponse(
        assessment_id=uid,
        org_name=req.org_name,
        pulled_at=(datetime.utcnow() + timedelta(hours=5, minutes=30)).strftime("%Y-%m-%dT%H:%M:%S IST"),
        identity_summary=identity_data.get("summary", {}),
        patch_summary=patch_data.get("summary", {}),
        asset_summary=asset_data.get("summary", {}),
        all_findings=all_findings,
        auto_filled_fields=auto_fields,
        tasks_created=tasks_created,
        risk_summary=risk_summary,
    )


@router.get("/pull/{assessment_id}", summary="Enrich existing assessment with live data")
async def pull_for_assessment(
    assessment_id: str,
    current_user=Depends(get_current_user),
):
    assessment = await _assessments().find_one(
        {"$or": [{"_id": assessment_id}, {"id": assessment_id}],
         "tenant_id": current_user.tenant_id}
    )
    if not assessment:
        raise HTTPException(404, "Assessment not found.")

    employees     = assessment.get("employees", 100)
    org_name      = assessment.get("org_name", "")
    identity_data = pull_identity_data(org_name, employees)
    patch_data    = pull_patch_data(org_name, employees)
    asset_data    = pull_asset_data(org_name, employees)

    auto_fields  = _merge_aura_fields(identity_data, patch_data, asset_data)
    all_findings = _collect_findings(identity_data, patch_data, asset_data)
    risk_score, risk_level = _compute_risk_score(auto_fields, all_findings)

    update_fields = {**auto_fields, "risk_score": risk_score, "risk_level": risk_level, "updated_at": ist_now()}
    await _assessments().update_one(
        {"$or": [{"_id": assessment_id}, {"id": assessment_id}]},
        {"$set": update_fields},
    )

    tasks_created = await _create_remediation_tasks(
        assessment_id, current_user.tenant_id, current_user.id, all_findings
    )

    return {
        "assessment_id":  assessment_id,
        "updated":        True,
        "risk_score":     risk_score,
        "risk_level":     risk_level,
        "fields_updated": list(auto_fields.keys()),
        "findings":       len(all_findings),
        "tasks_created":  tasks_created,
        "identity":       identity_data,
        "patch":          patch_data,
        "assets":         asset_data,
    }


@router.get("/sources", summary="Show integration status for all data sources")
def get_data_sources(_=Depends(get_current_user)):
    def live(key): return "LIVE" if os.getenv(key) else "SIMULATED"
    providers = [
        ("AZURE_TENANT_ID", "Azure AD / Microsoft Entra ID"),
        ("AWS_ACCESS_KEY_ID", "AWS IAM"),
        ("GOOGLE_WORKSPACE_DOMAIN", "Google Workspace"),
        ("INTUNE_TENANT_ID", "Microsoft Intune"),
        ("JAMF_URL", "Jamf Pro"),
        ("WSUS_SERVER_URL", "WSUS"),
        ("AZURE_SUBSCRIPTION_ID", "Microsoft Azure"),
        ("GCP_PROJECT_ID", "Google Cloud Platform"),
    ]
    live_count = sum(1 for key, _ in providers if os.getenv(key))
    return {
        "total_providers":      9,
        "live_providers":       live_count,
        "simulated_providers":  9 - live_count,
        "providers":            [{"name": name, "mode": live(key)} for key, name in providers],
    }

"""
audit_logs_routes.py — MongoDB edition
All SQLAlchemy/Session replaced with Motor async.
Demo fallback preserved for empty collections.
"""
from fastapi import APIRouter, Depends, Query
from datetime import datetime, timedelta
from typing import Optional
import random

from database import get_collection, ist_now
from dependencies import get_current_user

router = APIRouter(prefix="/api/audit-logs", tags=["audit-logs"])


def _logs():
    return get_collection("audit_logs")


DEMO_LOGS = [
    {"user_name": "Amit Shah",  "user_email": "amit@acme.com",    "action": "CONTROL_UPDATED",       "category": "Compliance",  "framework": "SOC2", "resource": "CC6.1 Logical Access",    "status": "SUCCESS", "detail": {"old": "IN_PROGRESS", "new": "IMPLEMENTED"}},
    {"user_name": "System",     "user_email": "system@aura",      "action": "RISK_SCAN_COMPLETED",   "category": "Risk",        "framework": None,   "resource": "Full Platform Scan",      "status": "SUCCESS", "detail": {"findings": 12, "critical": 2}},
    {"user_name": "Amit Shah",  "user_email": "amit@acme.com",    "action": "INTEGRATION_CONNECTED", "category": "Integration", "framework": None,   "resource": "Okta SSO",                "status": "SUCCESS", "detail": {}},
    {"user_name": "Riya Mehta", "user_email": "riya@acme.com",    "action": "USER_INVITED",          "category": "User",        "framework": None,   "resource": "new.user@acme.com",       "status": "SUCCESS", "detail": {"role": "Auditor"}},
    {"user_name": "Riya Mehta", "user_email": "riya@acme.com",    "action": "LOGIN",                 "category": "User",        "framework": None,   "resource": None,                      "status": "SUCCESS", "detail": {"method": "SSO"}},
    {"user_name": "Unknown",    "user_email": "attacker@evil.com","action": "LOGIN",                 "category": "User",        "framework": None,   "resource": None,                      "status": "FAILURE", "detail": {"reason": "Invalid credentials"}},
    {"user_name": "Amit Shah",  "user_email": "amit@acme.com",    "action": "TRUST_CENTER_UPDATED",  "category": "Compliance",  "framework": None,   "resource": "Trust Center",            "status": "SUCCESS", "detail": {"section": "Security Policies"}},
    {"user_name": "Priya Nair", "user_email": "priya@acme.com",   "action": "EVIDENCE_UPLOADED",     "category": "Evidence",    "framework": "SOC2", "resource": "Penetration Test Report.pdf", "status": "SUCCESS", "detail": {"size_kb": 1820}},
]


def _clean(doc: dict) -> dict:
    doc = dict(doc)
    doc["id"] = str(doc.get("_id", doc.get("id", "")))
    doc.pop("_id", None)
    if isinstance(doc.get("created_at"), datetime):
        doc["created_at"] = doc["created_at"].isoformat()
    return doc


@router.get("")
async def get_audit_logs(
    tenant_id: str           = Query(...),
    category:  Optional[str] = Query(None),
    status:    Optional[str] = Query(None),
    framework: Optional[str] = Query(None),
    search:    Optional[str] = Query(None),
    limit:     int           = Query(50),
    offset:    int           = Query(0),
    _=Depends(get_current_user),
):
    filt: dict = {"tenant_id": tenant_id}
    if category:
        filt["category"] = category
    if status:
        filt["status"] = status
    if framework:
        filt["framework"] = framework
    if search:
        filt["$or"] = [
            {"action":     {"$regex": search, "$options": "i"}},
            {"resource":   {"$regex": search, "$options": "i"}},
            {"user_name":  {"$regex": search, "$options": "i"}},
        ]

    total = await _logs().count_documents(filt)
    docs  = await _logs().find(filt).sort("created_at", -1).skip(offset).limit(limit).to_list(limit)

    if total == 0:
        # Demo fallback
        filtered = DEMO_LOGS[:]
        if category:  filtered = [l for l in filtered if l["category"] == category]
        if status:    filtered = [l for l in filtered if l["status"] == status]
        if framework: filtered = [l for l in filtered if l.get("framework") == framework]
        if search:
            s = search.lower()
            filtered = [l for l in filtered if s in l["action"].lower()
                        or s in (l.get("resource") or "").lower()
                        or s in l["user_name"].lower()]
        now = datetime.utcnow()
        result = []
        for i, l in enumerate(filtered):
            result.append({
                **l,
                "id":         str(i + 1),
                "ip_address": f"192.168.1.{random.randint(10, 99)}",
                "created_at": (now - timedelta(hours=i * 3 + random.randint(0, 2))).isoformat(),
            })
        return {"total": len(result), "logs": result[offset: offset + limit]}

    return {"total": total, "logs": [_clean(d) for d in docs]}


@router.post("")
async def create_audit_log(
    body:      dict,
    tenant_id: str = Query(...),
    _=Depends(get_current_user),
):
    """Write a structured audit log entry."""
    from database import gen_uuid
    uid = gen_uuid()
    doc = {
        "_id":        uid,
        "id":         uid,
        "tenant_id":  tenant_id,
        "user_email": body.get("user_email", "system@aura"),
        "user_name":  body.get("user_name", "System"),
        "action":     body.get("action", "UNKNOWN"),
        "category":   body.get("category", "System"),
        "framework":  body.get("framework"),
        "resource":   body.get("resource"),
        "detail":     body.get("detail", {}),
        "ip_address": body.get("ip_address"),
        "status":     body.get("status", "SUCCESS"),
        "created_at": ist_now(),
    }
    await _logs().insert_one(doc)
    return {"message": "Logged", "id": uid}

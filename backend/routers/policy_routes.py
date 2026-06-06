"""
policy_routes.py — MongoDB edition
All SQLAlchemy/Session replaced with Motor async.
Falls back to DEMO_POLICIES if the collection is empty (same behaviour as before).
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from datetime import datetime, timedelta
from typing import Optional
import random

from database import get_collection, ist_now, gen_uuid
from dependencies import get_current_user

router = APIRouter(prefix="/api/policies", tags=["policies"])


def _policies():
    return get_collection("policies")


# ── Demo seed data (used when collection is empty) ────────────────────────────

DEMO_POLICIES = [
    {
        "title":        "Information Security Policy",
        "category":     "Security",
        "status":       "APPROVED",
        "version":      "3.1",
        "owner":        "Amit Shah",
        "frameworks":   ["SOC2", "ISO27001"],
        "controls":     ["CC6.1", "A.5.1"],
        "approved_by":  "Board of Directors",
        "description":  "Defines the overall information security objectives, principles, and responsibilities.",
        "content":      "1. Purpose\nThis policy establishes the information security framework.\n\n2. Scope\nApplies to all employees, contractors, and third parties.\n\n3. Policy Statements\n3.1 All information assets must be classified.\n3.2 Access to systems must follow least privilege.\n3.3 Incidents must be reported within 24 hours.",
        "review_date":  (datetime.utcnow() + timedelta(days=180)).isoformat(),
        "effective_date": (datetime.utcnow() - timedelta(days=365)).isoformat(),
    },
    {
        "title":        "Business Continuity Policy",
        "category":     "Compliance",
        "status":       "REVIEW",
        "version":      "1.5",
        "owner":        "Priya Nair",
        "frameworks":   ["ISO27001", "SOC2"],
        "controls":     ["A.17.1", "A1.2"],
        "approved_by":  None,
        "description":  "Ensures critical business functions can continue during and after a disaster.",
        "content":      "1. Purpose\nMaintain business operations during disruptions.\n\n2. RTO and RPO\nRTO: 4 hours for critical systems\nRPO: 1 hour for financial data",
        "review_date":  (datetime.utcnow() + timedelta(days=45)).isoformat(),
        "effective_date": None,
    },
]


def _make_demo(p: dict, i: int = 0) -> dict:
    now = datetime.utcnow()
    return {
        **p,
        "id":         str(i + 1),
        "created_at": (now - timedelta(days=i * 15 + random.randint(0, 10))).isoformat(),
        "updated_at": (now - timedelta(days=i * 2 + random.randint(0, 5))).isoformat(),
    }


def _clean(doc: dict) -> dict:
    doc = dict(doc)
    doc["id"] = str(doc.get("_id", doc.get("id", "")))
    doc.pop("_id", None)
    if isinstance(doc.get("created_at"), datetime):
        doc["created_at"] = doc["created_at"].isoformat()
    if isinstance(doc.get("updated_at"), datetime):
        doc["updated_at"] = doc["updated_at"].isoformat()
    if isinstance(doc.get("review_date"), datetime):
        doc["review_date"] = doc["review_date"].isoformat()
    if isinstance(doc.get("effective_date"), datetime):
        doc["effective_date"] = doc["effective_date"].isoformat()
    return doc


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("")
async def get_policies(
    tenant_id: str           = Query(...),
    category:  Optional[str] = Query(None),
    status:    Optional[str] = Query(None),
    framework: Optional[str] = Query(None),
    search:    Optional[str] = Query(None),
    _=Depends(get_current_user),
):
    filt: dict = {"tenant_id": tenant_id}
    if category:
        filt["category"] = category
    if status:
        filt["status"] = status
    if search:
        filt["$or"] = [
            {"title":       {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
        ]

    docs = await _policies().find(filt).sort("updated_at", -1).to_list(500)

    if not docs:
        # Fall back to demo data
        filtered = DEMO_POLICIES[:]
        if category:  filtered = [p for p in filtered if p["category"] == category]
        if status:    filtered = [p for p in filtered if p["status"] == status]
        if framework: filtered = [p for p in filtered if framework in p.get("frameworks", [])]
        if search:
            s = search.lower()
            filtered = [p for p in filtered if s in p["title"].lower()
                        or s in p.get("description", "").lower()]
        return {"policies": [_make_demo(p, i) for i, p in enumerate(filtered)],
                "total": len(filtered)}

    # Filter by framework (stored as array in Mongo)
    if framework:
        docs = [d for d in docs if framework in (d.get("frameworks") or [])]

    return {"policies": [_clean(d) for d in docs], "total": len(docs)}


@router.post("")
async def create_policy(
    body:      dict,
    tenant_id: str = Query(...),
    _=Depends(get_current_user),
):
    uid = gen_uuid()
    doc = {
        "_id":           uid,
        "id":            uid,
        "tenant_id":     tenant_id,
        "title":         body.get("title"),
        "description":   body.get("description"),
        "content":       body.get("content"),
        "category":      body.get("category", "Security"),
        "status":        "DRAFT",
        "version":       body.get("version", "1.0"),
        "owner":         body.get("owner", ""),
        "frameworks":    body.get("frameworks", []),
        "controls":      body.get("controls", []),
        "approved_by":   None,
        "review_date":   None,
        "effective_date": None,
        "created_at":    ist_now(),
        "updated_at":    ist_now(),
    }
    await _policies().insert_one(doc)
    return {"message": "Policy created", "id": uid}


@router.patch("/{policy_id}/status")
async def update_status(
    policy_id:   str,
    status:      str           = Query(...),
    approved_by: Optional[str] = Query(None),
    _=Depends(get_current_user),
):
    update: dict = {"status": status, "updated_at": ist_now()}
    if approved_by:
        update["approved_by"] = approved_by
    if status == "APPROVED":
        update["effective_date"] = ist_now()

    result = await _policies().update_one(
        {"$or": [{"_id": policy_id}, {"id": policy_id}]},
        {"$set": update},
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Policy not found")
    return {"message": "Updated"}


@router.delete("/{policy_id}")
async def delete_policy(policy_id: str, _=Depends(get_current_user)):
    result = await _policies().delete_one(
        {"$or": [{"_id": policy_id}, {"id": policy_id}]}
    )
    if result.deleted_count == 0:
        raise HTTPException(404, "Policy not found")
    return {"message": "Deleted"}

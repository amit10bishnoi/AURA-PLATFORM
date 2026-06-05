"""
AURA — Automation API routes
=============================
Wire into your FastAPI app with:

    from routes_automation import router as automation_router
    app.include_router(automation_router)

All endpoints are under /api/automation. They run against the in-memory
simulation engine today; no new dependencies, no credentials required.

Auth note: these endpoints read the Authorization header if present but do not
hard-fail without it, so they drop in without depending on your existing auth
dependency. To enforce auth, add your usual `Depends(get_current_user)` to each
route signature.
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Header
from pydantic import BaseModel

from automation_engine import ENGINE, REGISTRY
from policy_engine import generate_policy, list_policies

router = APIRouter(prefix="/api/automation", tags=["automation"])


# --------------------------------------------------------------------------- #
#  Request bodies
# --------------------------------------------------------------------------- #
class RemediateBody(BaseModel):
    control_id: str
    dry_run: bool = True       # default to a safe preview
    approved: bool = False     # must be explicitly set to apply


class RollbackBody(BaseModel):
    rollback_token: str


class PolicyBody(BaseModel):
    policy_key: str
    company_context: Optional[dict] = None


# --------------------------------------------------------------------------- #
#  Scan / findings
# --------------------------------------------------------------------------- #
@router.get("/scan")
def scan(tenant_id: str = "demo", framework: Optional[str] = None,
         authorization: Optional[str] = Header(None)):
    """Detect current state of every automatable control across all providers."""
    return ENGINE.scan(tenant_id, framework)


@router.get("/summary")
def summary(tenant_id: str = "demo", authorization: Optional[str] = Header(None)):
    """Lightweight counts for dashboard cards."""
    return ENGINE.scan(tenant_id)["summary"]


@router.get("/registry")
def registry(authorization: Optional[str] = Header(None)):
    """The full control-automation catalogue (no detection run)."""
    return {"count": len(REGISTRY), "controls": [c.public() for c in REGISTRY]}


# --------------------------------------------------------------------------- #
#  Remediation (preview → approve → apply → rollback)
# --------------------------------------------------------------------------- #
@router.post("/remediate")
def remediate(body: RemediateBody, authorization: Optional[str] = Header(None)):
    """Preview (dry_run) or apply (approved) a single remediation.

    Safety gate: a non-preview call without approved=true is refused.
    """
    return ENGINE.remediate(body.control_id, dry_run=body.dry_run, approved=body.approved)


@router.post("/rollback")
def rollback(body: RollbackBody, authorization: Optional[str] = Header(None)):
    return ENGINE.rollback(body.rollback_token)


@router.get("/ledger")
def ledger(authorization: Optional[str] = Header(None)):
    """Audit trail of every applied action and rollback this session."""
    return {"count": len(ENGINE.ledger), "entries": ENGINE.ledger}


# --------------------------------------------------------------------------- #
#  Evidence
# --------------------------------------------------------------------------- #
@router.get("/evidence")
def evidence(tenant_id: str = "demo", control_id: Optional[str] = None,
             authorization: Optional[str] = Header(None)):
    """Auto-collect evidence artifacts for all controls (or one)."""
    return ENGINE.collect_evidence(tenant_id, control_id)


# --------------------------------------------------------------------------- #
#  AI policies
# --------------------------------------------------------------------------- #
@router.get("/policies/types")
def policy_types(authorization: Optional[str] = Header(None)):
    return {"policies": list_policies()}


@router.post("/policies/generate")
def policies_generate(body: PolicyBody, authorization: Optional[str] = Header(None)):
    return generate_policy(body.policy_key, body.company_context)

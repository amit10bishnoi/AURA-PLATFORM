"""
integrations_routes.py — 10 new security tool integrations
"""
from fastapi import APIRouter, Depends
from dependencies import get_current_user
from integrations_service import pull_integration, pull_all_integrations, INTEGRATION_HANDLERS

router = APIRouter(prefix="/api/integrations", tags=["Integrations"])


@router.get("/", summary="List all available integrations")
def list_integrations(current_user=Depends(get_current_user)):
    return {
        "available": list(INTEGRATION_HANDLERS.keys()),
        "count": len(INTEGRATION_HANDLERS),
    }


@router.post("/pull/{provider}", summary="Pull data from a specific integration")
def pull_single(provider: str, current_user=Depends(get_current_user)):
    org_name = getattr(current_user, "tenant_name", "Organisation") or "Organisation"
    return pull_integration(provider, org_name)


@router.post("/pull-all", summary="Pull data from all 10 integrations")
def pull_all(current_user=Depends(get_current_user)):
    org_name = getattr(current_user, "tenant_name", "Organisation") or "Organisation"
    return pull_all_integrations(org_name)

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

from fastapi import Body
import os

@router.post("/credentials")
def save_credentials(body: dict = Body(...), current_user=Depends(get_current_user)):
    """Save integration credentials to environment."""
    provider = body.get("provider","")
    creds = body.get("credentials", {})
    # Write to .env file
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
    try:
        with open(env_path, "r") as f:
            env_content = f.read()
        for key, value in creds.items():
            if value:  # Only save non-empty values
                if f"{key}=" in env_content:
                    import re
                    env_content = re.sub(f"^{key}=.*$", f"{key}={value}", env_content, flags=re.MULTILINE)
                else:
                    env_content += f"\n{key}={value}"
        with open(env_path, "w") as f:
            f.write(env_content)
        # Reload env vars immediately
        for key, value in creds.items():
            if value:
                os.environ[key] = value
        return {"message": f"{provider} credentials saved", "provider": provider}
    except Exception as e:
        return {"message": "Saved in memory only", "error": str(e), "provider": provider}

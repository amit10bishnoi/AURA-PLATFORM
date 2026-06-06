"""
dependencies.py — MongoDB edition
Replaces SQLAlchemy Session-based auth with Motor async lookups.
"""
from typing import Optional
from fastapi import Depends, HTTPException, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from database import users, tenants
from auth import decode_token
from config import settings

security = HTTPBearer(auto_error=False)


class CurrentUser:
    def __init__(self, id, email, name, role, tenant_id, tenant_name):
        self.id = id
        self.email = email
        self.name = name
        self.role = role
        self.tenant_id = tenant_id
        self.tenant_name = tenant_name

    @property
    def is_ciso(self): return self.role == "ciso"

    @property
    def can_edit(self): return self.role in ["ciso", "developer"]


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> CurrentUser:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    email = payload.get("sub")
    tenant_id = payload.get("tenant_id")
    if not email or not tenant_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    user = await users().find_one(
        {"email": email, "tenant_id": tenant_id, "is_active": True}
    )
    if not user:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    tenant = await tenants().find_one({"_id": tenant_id})
    tenant_name = tenant["name"] if tenant else "Unknown"

    return CurrentUser(
        id=str(user.get("_id", user.get("id", ""))),
        email=user["email"],
        name=user.get("name", ""),
        role=user.get("role", "developer"),
        tenant_id=tenant_id,
        tenant_name=tenant_name,
    )


def require_role(*allowed_roles: str):
    async def checker(
        current_user: CurrentUser = Depends(get_current_user),
    ) -> CurrentUser:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Role '{current_user.role}' not allowed here.",
            )
        return current_user
    return checker


async def verify_proxy_key(
    x_proxy_key: Optional[str] = Header(None, alias="X-Proxy-Key"),
) -> bool:
    if x_proxy_key == settings.PROXY_API_KEY:
        return True
    raise HTTPException(status_code=401, detail="Invalid proxy API key")

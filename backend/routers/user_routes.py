"""
User management routes — fully migrated to MongoDB/Motor
"""
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from passlib.context import CryptContext

from database import users, tenants, ist_now, gen_uuid
from routers.auth_routes import get_current_user, get_current_tenant_id

router = APIRouter(prefix="/api/users", tags=["users"])
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


class UserInvite(BaseModel):
    email: str
    name: str
    role: str = "developer"
    password: str = "ChangeMe123!"


class RoleUpdate(BaseModel):
    role: str


def _clean(doc: dict) -> dict:
    doc = dict(doc)
    doc["id"] = str(doc.get("_id", doc.get("id", "")))
    doc.pop("_id", None)
    doc.pop("hashed_password", None)
    return doc


@router.get("")
async def list_users(
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") not in ("ciso", "admin"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    docs = await users().find({"tenant_id": tenant_id}).sort("created_at", -1).to_list(200)
    return [_clean(d) for d in docs]


@router.post("/invite")
async def invite_user(
    body: UserInvite,
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") not in ("ciso", "admin"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    existing = await users().find_one({"tenant_id": tenant_id, "email": body.email.lower()})
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered in this tenant")

    uid = gen_uuid()
    doc = {
        "_id": uid,
        "id": uid,
        "tenant_id": tenant_id,
        "email": body.email.lower().strip(),
        "name": body.name,
        "hashed_password": pwd_ctx.hash(body.password),
        "role": body.role,
        "is_active": True,
        "created_at": ist_now(),
        "updated_at": ist_now(),
    }
    await users().insert_one(doc)
    return _clean(doc)


@router.patch("/{user_email}/role")
async def change_role(
    user_email: str,
    body: RoleUpdate,
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") not in ("ciso", "admin"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    result = await users().update_one(
        {"tenant_id": tenant_id, "email": user_email.lower()},
        {"$set": {"role": body.role, "updated_at": ist_now()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"updated": True, "email": user_email, "new_role": body.role}


@router.delete("/{user_email}")
async def remove_user(
    user_email: str,
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") not in ("ciso", "admin"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    if user_email.lower() == current_user.get("email", "").lower():
        raise HTTPException(status_code=400, detail="Cannot remove yourself")
    result = await users().delete_one({"tenant_id": tenant_id, "email": user_email.lower()})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"deleted": True, "email": user_email}
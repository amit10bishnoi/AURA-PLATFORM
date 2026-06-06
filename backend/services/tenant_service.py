"""
tenant_service.py — MongoDB edition
"""
import re
import uuid
from typing import Optional, Tuple

from database import col, gen_uuid, gen_tenant_id, ist_now
from auth import get_password_hash


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[-\s]+", "-", text)
    return text[:100]


def _tenants(): return col("tenants")
def _users():   return col("users")


async def unique_slug(base_slug: str) -> str:
    slug = base_slug
    counter = 1
    while await _tenants().find_one({"slug": slug}):
        slug = f"{base_slug}-{counter}"
        counter += 1
    return slug


async def create_tenant(name: str, industry: Optional[str] = None) -> dict:
    tid = gen_tenant_id()
    tenant = {
        "_id":           tid,
        "id":            tid,
        "name":          name,
        "slug":          await unique_slug(slugify(name)),
        "industry":      industry,
        "plan":          "free",
        "max_users":     20,
        "is_active":     True,
        "is_msp":        False,
        "brand_primary": "#7c3aed",
        "brand_secondary": "#db2777",
        "msp_plan":      "starter",
        "max_sub_tenants": 5,
        "revenue_share": 0.20,
        "created_at":    ist_now(),
    }
    await _tenants().insert_one(tenant)
    return tenant


async def get_tenant_by_id(tenant_id: str) -> Optional[dict]:
    return await _tenants().find_one({"$or": [{"_id": tenant_id}, {"id": tenant_id}], "is_active": True})


async def get_tenant_by_name(name: str) -> Optional[dict]:
    return await _tenants().find_one({"name": name})


async def create_user_with_tenant(
    email: str,
    password: str,
    name: str,
    role: str,
    tenant_name: Optional[str] = None,
    tenant_id: Optional[str] = None,
    create_tenant_flag: bool = False,
    join_existing: bool = False,
) -> Tuple[dict, dict, str]:

    if await _users().find_one({"email": email}):
        raise ValueError(f"Email '{email}' is already registered.")

    tenant = None
    message = ""

    if create_tenant_flag and tenant_name:
        if await get_tenant_by_name(tenant_name):
            raise ValueError(f"Tenant '{tenant_name}' already exists.")
        tenant = await create_tenant(tenant_name)
        message = f"Created tenant '{tenant_name}'"

    elif join_existing and tenant_id:
        tenant = await get_tenant_by_id(tenant_id)
        if not tenant:
            raise ValueError(f"Tenant ID '{tenant_id}' not found.")
        count = await _users().count_documents({"tenant_id": tenant_id, "is_active": True})
        if count >= tenant.get("max_users", 20):
            raise ValueError("Tenant has reached its user limit.")
        message = f"Joined tenant '{tenant['name']}'"

    else:
        tenant = await create_tenant(f"{name}'s Organization")
        message = "Created personal tenant"

    uid = gen_uuid()
    user = {
        "_id":             uid,
        "id":              uid,
        "email":           email,
        "name":            name,
        "hashed_password": get_password_hash(password),
        "role":            role,
        "tenant_id":       tenant["id"],
        "is_active":       True,
        "created_at":      ist_now(),
        "updated_at":      ist_now(),
    }
    await _users().insert_one(user)
    return user, tenant, message

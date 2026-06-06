"""
Auth routes — fully migrated to MongoDB/Motor
"""
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr

from config import settings
from database import users, tenants, ist_now, gen_uuid

router = APIRouter(tags=["auth"])
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str
    tenant_id: Optional[str] = None

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    role: str = "developer"
    tenant_id: Optional[str] = None
    join_existing_tenant: bool = False

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    name: str
    role: str
    tenant_id: str
    tenant_name: str

class UserOut(BaseModel):
    id: str
    email: str
    name: str
    role: str
    tenant_id: str
    is_active: bool


# ── Helpers ───────────────────────────────────────────────────────────────────

def _make_token(data: dict, expires_minutes: int = None) -> str:
    exp = datetime.utcnow() + timedelta(
        minutes=expires_minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    return jwt.encode({**data, "exp": exp}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def _verify_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    payload = _verify_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    user = await users().find_one({"_id": user_id, "is_active": True})
    if not user:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    return user


async def get_current_tenant_id(token: str = Depends(oauth2_scheme)) -> str:
    payload = _verify_token(token)
    tid = payload.get("tenant_id")
    if not tid:
        raise HTTPException(status_code=401, detail="No tenant in token")
    return tid


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/api/auth/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    user = await users().find_one({"email": body.email.lower().strip()})
    if not user or not pwd_ctx.verify(body.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account disabled")

    tenant = await tenants().find_one({"_id": user["tenant_id"]})
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    # Update last_login
    await users().update_one({"_id": user["_id"]}, {"$set": {"last_login": ist_now()}})

    token = _make_token({
        "sub": user["_id"],
        "email": user["email"],
        "role": user.get("role", "developer"),
        "tenant_id": user["tenant_id"],
    })
    return TokenResponse(
        access_token=token,
        name=user.get("name", user["email"]),
        role=user.get("role", "developer"),
        tenant_id=user["tenant_id"],
        tenant_name=tenant.get("name", ""),
    )


@router.post("/api/auth/register")
async def register(body: RegisterRequest):
    email = body.email.lower().strip()

    # Determine tenant
    tenant_id = body.tenant_id
    if body.join_existing_tenant and tenant_id:
        tenant = await tenants().find_one({"_id": tenant_id})
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant not found")
    else:
        # Create new tenant
        import uuid as _uuid
        tenant_id = f"tenant_{_uuid.uuid4().hex[:12]}"
        new_tenant = {
            "_id": tenant_id,
            "id": tenant_id,
            "name": body.name + "'s Organization",
            "slug": email.split("@")[0],
            "plan": "free",
            "is_active": True,
            "brand_primary": "#7c3aed",
            "brand_secondary": "#db2777",
            "created_at": ist_now(),
        }
        try:
            await tenants().insert_one(new_tenant)
        except Exception:
            pass  # slug collision — continue

    # Check duplicate email in this tenant
    existing = await users().find_one({"tenant_id": tenant_id, "email": email})
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered in this tenant")

    uid = gen_uuid()
    new_user = {
        "_id": uid,
        "id": uid,
        "tenant_id": tenant_id,
        "email": email,
        "name": body.name,
        "hashed_password": pwd_ctx.hash(body.password),
        "role": body.role,
        "is_active": True,
        "created_at": ist_now(),
        "updated_at": ist_now(),
    }
    await users().insert_one(new_user)

    tenant = await tenants().find_one({"_id": tenant_id})
    token = _make_token({
        "sub": uid,
        "email": email,
        "role": body.role,
        "tenant_id": tenant_id,
    })
    return {
        "access_token": token,
        "token_type": "bearer",
        "name": body.name,
        "role": body.role,
        "tenant_id": tenant_id,
        "tenant_name": tenant.get("name", "") if tenant else "",
    }


@router.get("/me")
async def me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["_id"],
        "email": current_user["email"],
        "name": current_user.get("name", ""),
        "role": current_user.get("role", "developer"),
        "tenant_id": current_user["tenant_id"],
        "is_active": current_user.get("is_active", True),
    }


@router.get("/api/auth/validate")
async def validate_token(current_user: dict = Depends(get_current_user)):
    return {"valid": True, "user_id": current_user["_id"], "role": current_user.get("role")}


@router.post("/api/auth/logout")
async def logout():
    # JWT is stateless — client drops the token
    return {"message": "Logged out"}
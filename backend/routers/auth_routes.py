from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, Tenant
from schemas import RegisterRequest, LoginRequest, LoginResponse, MessageResponse, UserResponse
from auth import verify_password, create_access_token
from dependencies import get_current_user, CurrentUser
from services.tenant_service import create_user_with_tenant

router = APIRouter(tags=["Auth"])


@router.post("/register", response_model=MessageResponse)
async def register(data: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user — creates or joins a tenant."""
    try:
        user, tenant, message = create_user_with_tenant(
            db=db,
            email=data.email,
            password=data.password,
            name=data.name,
            role=data.role,
            tenant_name=data.tenant_name,
            tenant_id=data.tenant_id,
            create_tenant_flag=data.create_tenant,
            join_existing=data.join_existing_tenant,
        )
        return MessageResponse(message=f"Registration successful. {message}",
                               detail=f"Tenant ID: {tenant.id}")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login", response_model=LoginResponse)
async def login(data: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate and return JWT + tenant info."""
    user = db.query(User).filter(User.email == data.email, User.is_active == True).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    tenant = db.query(Tenant).filter(Tenant.id == user.tenant_id, Tenant.is_active == True).first()
    if not tenant:
        raise HTTPException(status_code=403, detail="Tenant not found or inactive")

    user.last_login = datetime.utcnow()
    db.commit()

    token = create_access_token(email=user.email, role=user.role, tenant_id=user.tenant_id)
    return LoginResponse(
        access_token=token,
        name=user.name,
        email=user.email,
        role=user.role,
        tenant_id=user.tenant_id,
        tenant_name=tenant.name,
    )


@router.get("/me", response_model=UserResponse)
async def me(current_user: CurrentUser = Depends(get_current_user),
             db: Session = Depends(get_db)):
    """Return current user info."""
    user = db.query(User).filter(User.id == current_user.id).first()
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
        tenant_id=user.tenant_id,
        is_active=user.is_active,
        last_login=user.last_login,
        created_at=user.created_at,
        tenant_name=current_user.tenant_name,
    )
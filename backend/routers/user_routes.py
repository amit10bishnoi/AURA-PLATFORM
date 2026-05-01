from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, Tenant
from schemas import UserResponse, RoleChangeRequest, RegisterRequest, MessageResponse
from dependencies import get_current_user, CurrentUser
from services.tenant_service import create_user_with_tenant
from services.email_service import send_invite_email

router = APIRouter(tags=["Users"])


@router.get("/users", response_model=list[UserResponse])
async def list_users(current_user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    users = db.query(User).filter(User.tenant_id == current_user.tenant_id, User.is_active == True).all()
    tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
    tenant_name = tenant.name if tenant else ""
    return [UserResponse(id=u.id, email=u.email, name=u.name, role=u.role, tenant_id=u.tenant_id,
            is_active=u.is_active, last_login=u.last_login, created_at=u.created_at,
            tenant_name=tenant_name) for u in users]


@router.post("/register", response_model=MessageResponse, include_in_schema=False)
async def invite_user(data: RegisterRequest, current_user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "ciso":
        raise HTTPException(status_code=403, detail="Only CISOs can invite users.")
    temp_password = "ChangeMe123!"
    try:
        user, tenant, message = create_user_with_tenant(
            db=db, email=data.email, password=temp_password,
            name=data.name or data.email.split("@")[0], role=data.role,
            tenant_name=None, tenant_id=current_user.tenant_id,
            create_tenant_flag=False, join_existing=True,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    email_sent = send_invite_email(
        to_email=user.email, to_name=user.name, tenant_name=tenant.name,
        temp_password=temp_password, invited_by=current_user.name, role=user.role,
    )
    msg = f"Account created for {user.email}. Temp password: {temp_password}"
    msg += " — Invite email sent!" if email_sent else " — (Configure email in config.py)"
    return MessageResponse(message=msg)


@router.delete("/users/{email}", response_model=MessageResponse)
async def remove_user(email: str, current_user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "ciso":
        raise HTTPException(status_code=403, detail="Only CISOs can remove users.")
    user = db.query(User).filter(User.email == email, User.tenant_id == current_user.tenant_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.email == current_user.email:
        raise HTTPException(status_code=400, detail="You cannot remove yourself.")
    user.is_active = False
    db.commit()
    return MessageResponse(message=f"{email} has been removed.")


@router.put("/users/{email}/role", response_model=MessageResponse)
async def change_role(email: str, data: RoleChangeRequest, current_user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "ciso":
        raise HTTPException(status_code=403, detail="Only CISOs can change roles.")
    user = db.query(User).filter(User.email == email, User.tenant_id == current_user.tenant_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.role = data.role
    db.commit()
    return MessageResponse(message=f"{email} role updated to {data.role}.")
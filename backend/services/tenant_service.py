import re
import uuid
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from models import Tenant, User
from auth import get_password_hash


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[-\s]+", "-", text)
    return text[:100]


def unique_slug(db: Session, base_slug: str) -> str:
    """Generate a unique slug by appending a number if needed."""
    slug = base_slug
    counter = 1
    while db.query(Tenant).filter(Tenant.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1
    return slug


def create_tenant(db: Session, name: str, industry: Optional[str] = None) -> Tenant:
    tenant = Tenant(
        name=name,
        slug=unique_slug(db, slugify(name)),
        industry=industry,
    )
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    return tenant


def get_tenant_by_id(db: Session, tenant_id: str) -> Optional[Tenant]:
    return db.query(Tenant).filter(Tenant.id == tenant_id, Tenant.is_active == True).first()


def get_tenant_by_name(db: Session, name: str) -> Optional[Tenant]:
    return db.query(Tenant).filter(Tenant.name == name).first()


def create_user_with_tenant(
    db: Session,
    email: str,
    password: str,
    name: str,
    role: str,
    tenant_name: Optional[str] = None,
    tenant_id: Optional[str] = None,
    create_tenant_flag: bool = False,
    join_existing: bool = False,
) -> Tuple[User, Tenant, str]:

    # Check email uniqueness globally
    if db.query(User).filter(User.email == email).first():
        raise ValueError(f"Email '{email}' is already registered.")

    tenant = None
    message = ""

    if create_tenant_flag and tenant_name:
        if get_tenant_by_name(db, tenant_name):
            raise ValueError(f"Tenant '{tenant_name}' already exists. Please login or use a different name.")
        tenant = create_tenant(db, tenant_name)
        message = f"Created tenant '{tenant_name}'"

    elif join_existing and tenant_id:
        tenant = get_tenant_by_id(db, tenant_id)
        if not tenant:
            raise ValueError(f"Tenant ID '{tenant_id}' not found.")
        count = db.query(User).filter(User.tenant_id == tenant_id, User.is_active == True).count()
        if count >= tenant.max_users:
            raise ValueError("Tenant has reached its user limit.")
        message = f"Joined tenant '{tenant.name}'"

    else:
        tenant = create_tenant(db, f"{name}'s Organization")
        message = "Created personal tenant"

    user = User(
        email=email,
        name=name,
        hashed_password=get_password_hash(password),
        role=role,
        tenant_id=tenant.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user, tenant, message
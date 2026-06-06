import uuid
from datetime import datetime, timedelta, timezone
IST = timezone(timedelta(hours=5, minutes=30))
def ist_now(): return datetime.now(IST).replace(tzinfo=None)
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, Index, JSON   # ← JSON added
from sqlalchemy.orm import relationship
# from database import Base  # removed: MongoDB has no Base


def gen_uuid():
    return str(uuid.uuid4())


def gen_tenant_id():
    return f"tenant_{uuid.uuid4().hex[:12]}"


# ─── Tenant ───────────────────────────────────────────────────────────────────

class Tenant(Base):
    __tablename__ = "tenants"

    id         = Column(String(60),  primary_key=True, default=gen_tenant_id)
    name       = Column(String(200), nullable=False, unique=True, index=True)
    slug       = Column(String(120), nullable=True,  unique=True, index=True)
    industry   = Column(String(100), nullable=True)
    plan       = Column(String(50),  default="free")
    max_users  = Column(Integer,     default=20)
    is_active  = Column(Boolean,     default=True)
    created_at = Column(DateTime,    default=ist_now)

    # ── White-label / MSP fields ─────────────────────────────────────
    is_msp          = Column(Boolean, default=False)          # Is this an MSP partner?
    msp_partner_id  = Column(String(60), nullable=True)       # Parent MSP tenant ID
    brand_name      = Column(String(120), nullable=True)      # Custom brand name
    brand_logo_url  = Column(String(500), nullable=True)      # Logo URL
    brand_primary   = Column(String(20), default="#7c3aed")   # Primary color
    brand_secondary = Column(String(20), default="#db2777")   # Secondary color
    custom_domain   = Column(String(200), nullable=True)      # e.g. compliance.rahulsec.com
    msp_plan        = Column(String(50), default="starter")   # starter/growth/enterprise
    max_sub_tenants = Column(Integer, default=5)              # Max client workspaces
    revenue_share   = Column(Float, default=0.20)             # 20% rev share
    is_active       = Column(Boolean, default=True)
    created_at      = Column(DateTime, default=datetime.utcnow)

    users       = relationship("User",       back_populates="tenant", cascade="all, delete-orphan")
    assessments = relationship("Assessment", back_populates="tenant", cascade="all, delete-orphan")
    tasks       = relationship("Task",       back_populates="tenant", cascade="all, delete-orphan")


# ─── User ─────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        Index("ix_users_tenant_email", "tenant_id", "email", unique=True),
    )

    id              = Column(String(50),  primary_key=True, default=gen_uuid)
    tenant_id       = Column(String(60),  ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    email           = Column(String(255), nullable=False, index=True)
    name            = Column(String(200), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role            = Column(String(20),  default="developer")
    is_active       = Column(Boolean,     default=True)
    last_login      = Column(DateTime,    nullable=True)
    created_at      = Column(DateTime,    default=ist_now)
    updated_at      = Column(DateTime,    default=ist_now, onupdate=datetime.utcnow)

    tenant          = relationship("Tenant", back_populates="users")
    assessments     = relationship("Assessment", back_populates="created_by_user")
    tasks_created   = relationship("Task", foreign_keys="Task.created_by", back_populates="creator")


# ─── Assessment ───────────────────────────────────────────────────────────────

class Assessment(Base):
    __tablename__ = "assessments"
    __table_args__ = (
        Index("ix_assessments_tenant_created", "tenant_id", "created_at"),
    )

    id                  = Column(String(50),  primary_key=True, default=gen_uuid)
    tenant_id           = Column(String(60),  ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by          = Column(String(50),  ForeignKey("users.id",   ondelete="SET NULL"), nullable=True)

    org_name            = Column(String(200), nullable=False)
    industry            = Column(String(100), nullable=True)
    employees           = Column(Integer,     default=1)

    has_mfa             = Column(Boolean,     default=False)
    mfa_coverage        = Column(Integer,     default=0)
    patch_days          = Column(Integer,     default=30)
    training_percent    = Column(Integer,     default=0)
    has_irp             = Column(Boolean,     default=False)
    vulnerabilities     = Column(Integer,     default=0)

    vuln_critical       = Column(Integer,     default=0)
    vuln_high           = Column(Integer,     default=0)
    vuln_medium         = Column(Integer,     default=0)
    vuln_low            = Column(Integer,     default=0)
    vuln_source         = Column(String(50),  nullable=True)

    risk_score          = Column(Float,       default=0.0)
    risk_level          = Column(String(20),  default="LOW")
    financial_exposure  = Column(Float,       default=0.0)
    recommendations     = Column(Text,        nullable=True)
    model_version       = Column(String(50),  nullable=True)

    created_at          = Column(DateTime,    default=ist_now)

    tenant              = relationship("Tenant", back_populates="assessments")
    created_by_user     = relationship("User",   back_populates="assessments")
    compliance_results  = relationship(          # ← NEW
        "ComplianceResult",
        back_populates="assessment",
        cascade="all, delete-orphan",
    )


# ─── Task ─────────────────────────────────────────────────────────────────────

class Task(Base):
    __tablename__ = "tasks"
    __table_args__ = (
        Index("ix_tasks_tenant_status", "tenant_id", "status"),
    )

    id              = Column(String(50),  primary_key=True, default=gen_uuid)
    tenant_id       = Column(String(60),  ForeignKey("tenants.id",    ondelete="CASCADE"),  nullable=False, index=True)
    created_by      = Column(String(50),  ForeignKey("users.id",      ondelete="SET NULL"), nullable=True)
    source_assessment_id = Column(String(50), ForeignKey("assessments.id", ondelete="SET NULL"), nullable=True)

    title           = Column(String(500), nullable=False)
    description     = Column(Text,        nullable=True)
    status          = Column(String(20),  default="open")
    priority        = Column(String(20),  default="MEDIUM")
    assignee_email  = Column(String(255), nullable=True)
    due_date        = Column(DateTime,    nullable=True)
    completed_at    = Column(DateTime,    nullable=True)
    source          = Column(String(50),  default="manual")

    created_at      = Column(DateTime,    default=ist_now)
    updated_at      = Column(DateTime,    default=ist_now, onupdate=datetime.utcnow)

    tenant  = relationship("Tenant", back_populates="tasks")
    creator = relationship("User",   foreign_keys=[created_by], back_populates="tasks_created")


# ─── Controls reference data ───────────────────────────────────────────────────

class Control(Base):
    __tablename__ = "controls"

    id             = Column(Integer,     primary_key=True, autoincrement=True)
    framework      = Column(String(50),  nullable=False)
    function       = Column(String(50),  nullable=False)
    control_id     = Column(String(50),  nullable=False, unique=True)
    name           = Column(String(200), nullable=False)
    nist_ref       = Column(String(50),  nullable=True)
    iso_ref        = Column(String(50),  nullable=True)
    risk_reduction = Column(Integer,     default=5)


# ─── ComplianceResult ─────────────────────────────────────────────────────────   ← NEW CLASS

class ComplianceResult(Base):
    __tablename__ = "compliance_results"

    id              = Column(String(50),  primary_key=True, default=gen_uuid)
    assessment_id   = Column(String(50),  ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False, index=True)
    framework       = Column(String(50),  nullable=False)
    score           = Column(Float,       nullable=False, default=0.0)
    controls_detail = Column(JSON,        nullable=False, default=list)
    created_at      = Column(DateTime,    default=ist_now, nullable=False)
    updated_at      = Column(DateTime,    default=ist_now, onupdate=datetime.utcnow, nullable=False)

    assessment = relationship("Assessment", back_populates="compliance_results")


# ─── Seed controls ────────────────────────────────────────────────────────────

def seed_controls(db):
    if db.query(Control).count() > 0:
        return
    data = [
        dict(framework="NIST", function="Identify", control_id="ID.AM-1",  name="Asset inventory management",           nist_ref="ID.AM-1", iso_ref="A.8.1.1",  risk_reduction=5),
        dict(framework="NIST", function="Identify", control_id="ID.BE-1",  name="Business environment & risk strategy", nist_ref="ID.BE-1", iso_ref="A.6.1.1",  risk_reduction=4),
        dict(framework="NIST", function="Identify", control_id="ID.RA-1",  name="Information security risk assessment", nist_ref="ID.RA-1", iso_ref="A.6.1.2",  risk_reduction=8),
        dict(framework="NIST", function="Protect",  control_id="PR.AC-1",  name="Access control & identity management", nist_ref="PR.AC-1", iso_ref="A.9.1.1",  risk_reduction=8),
        dict(framework="NIST", function="Protect",  control_id="PR.AC-2",  name="Physical & environmental security",    nist_ref="PR.AC-2", iso_ref="A.11.1.1", risk_reduction=5),
        dict(framework="NIST", function="Protect",  control_id="PR.DS-1",  name="Data security & encryption at rest",  nist_ref="PR.DS-1", iso_ref="A.10.1.1", risk_reduction=7),
        dict(framework="NIST", function="Protect",  control_id="PR.DS-2",  name="Cryptographic controls policy",       nist_ref="PR.DS-2", iso_ref="A.10.1.1", risk_reduction=7),
        dict(framework="NIST", function="Protect",  control_id="PR.AT-1",  name="Security awareness training",         nist_ref="PR.AT-1", iso_ref="A.7.2.2",  risk_reduction=6),
        dict(framework="NIST", function="Detect",   control_id="DE.AE-1",  name="Anomalous activity detection",        nist_ref="DE.AE-1", iso_ref="A.12.4.1", risk_reduction=7),
        dict(framework="NIST", function="Detect",   control_id="DE.CM-1",  name="Monitoring & event logging",          nist_ref="DE.CM-1", iso_ref="A.12.4.1", risk_reduction=6),
        dict(framework="NIST", function="Respond",  control_id="RS.RP-1",  name="Incident response plan",              nist_ref="RS.RP-1", iso_ref="A.16.1.1", risk_reduction=9),
        dict(framework="NIST", function="Recover",  control_id="RC.RP-1",  name="Recovery planning & improvements",    nist_ref="RC.RP-1", iso_ref="A.17.1.1", risk_reduction=6),
        dict(framework="ISO",  function="Protect",  control_id="ISO.10.1", name="ISO cryptographic policy",            nist_ref="PR.DS-2", iso_ref="A.10.1",   risk_reduction=7),
        dict(framework="ISO",  function="Identify", control_id="ISO.6.1",  name="ISO risk assessment",                 nist_ref="ID.RA-1", iso_ref="A.6.1.2",  risk_reduction=8),
        dict(framework="ISO",  function="Protect",  control_id="ISO.11.1", name="ISO physical security",               nist_ref="PR.AC-2", iso_ref="A.11.1.1", risk_reduction=5),
        dict(framework="ISO",  function="Detect",   control_id="ISO.12.4", name="ISO monitoring & logging",            nist_ref="DE.CM-1", iso_ref="A.12.4.1", risk_reduction=6),
    ]
    for d in data:
        db.add(Control(**d))
    db.commit()
    print(f"✅ Seeded {len(data)} security controls")
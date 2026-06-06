"""
models.py — MongoDB edition
SQLAlchemy ORM classes replaced with plain Python dataclasses.
These are used only as data containers where needed; all DB ops use Motor directly.
"""
import uuid
from datetime import datetime, timedelta, timezone
from dataclasses import dataclass, field
from typing import Optional, List

IST = timezone(timedelta(hours=5, minutes=30))
def ist_now(): return datetime.now(IST).replace(tzinfo=None)

def gen_uuid(): return str(uuid.uuid4())
def gen_tenant_id(): return f"tenant_{uuid.uuid4().hex[:12]}"


@dataclass
class Tenant:
    id: str = field(default_factory=gen_tenant_id)
    name: str = ""
    slug: Optional[str] = None
    industry: Optional[str] = None
    plan: str = "free"
    max_users: int = 20
    is_active: bool = True
    is_msp: bool = False
    msp_partner_id: Optional[str] = None
    brand_name: Optional[str] = None
    brand_logo_url: Optional[str] = None
    brand_primary: str = "#7c3aed"
    brand_secondary: str = "#db2777"
    custom_domain: Optional[str] = None
    msp_plan: str = "starter"
    max_sub_tenants: int = 5
    revenue_share: float = 0.20
    created_at: datetime = field(default_factory=ist_now)


@dataclass
class User:
    id: str = field(default_factory=gen_uuid)
    tenant_id: str = ""
    email: str = ""
    name: str = ""
    hashed_password: str = ""
    role: str = "developer"
    is_active: bool = True
    last_login: Optional[datetime] = None
    created_at: datetime = field(default_factory=ist_now)
    updated_at: datetime = field(default_factory=ist_now)
    tenant_name: Optional[str] = None


@dataclass
class Assessment:
    id: str = field(default_factory=gen_uuid)
    tenant_id: str = ""
    created_by: Optional[str] = None
    org_name: str = ""
    industry: Optional[str] = None
    employees: int = 1
    has_mfa: bool = False
    mfa_coverage: int = 0
    patch_days: int = 30
    training_percent: int = 0
    has_irp: bool = False
    vulnerabilities: int = 0
    vuln_critical: int = 0
    vuln_high: int = 0
    vuln_medium: int = 0
    vuln_low: int = 0
    vuln_source: Optional[str] = None
    risk_score: float = 0.0
    risk_level: str = "LOW"
    financial_exposure: float = 0.0
    recommendations: Optional[str] = None
    model_version: Optional[str] = None
    created_at: datetime = field(default_factory=ist_now)


@dataclass
class Task:
    id: str = field(default_factory=gen_uuid)
    tenant_id: str = ""
    created_by: Optional[str] = None
    source_assessment_id: Optional[str] = None
    title: str = ""
    description: Optional[str] = None
    status: str = "open"
    priority: str = "MEDIUM"
    assignee_email: Optional[str] = None
    due_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    source: str = "manual"
    created_at: datetime = field(default_factory=ist_now)
    updated_at: datetime = field(default_factory=ist_now)


@dataclass
class Control:
    id: Optional[str] = None
    framework: str = ""
    function: str = ""
    control_id: str = ""
    name: str = ""
    nist_ref: Optional[str] = None
    iso_ref: Optional[str] = None
    risk_reduction: int = 5


@dataclass
class ComplianceResult:
    id: str = field(default_factory=gen_uuid)
    assessment_id: str = ""
    framework: str = ""
    score: float = 0.0
    controls_detail: List = field(default_factory=list)
    created_at: datetime = field(default_factory=ist_now)
    updated_at: datetime = field(default_factory=ist_now)


def seed_controls(db=None):
    """No-op — controls are seeded via database.py seed_demo_data()"""
    pass

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, validator
import json


# ── Tenant ──────────────────────────────────────────────────────────────────

class TenantResponse(BaseModel):
    id: str
    name: str
    plan: str
    is_active: bool
    created_at: datetime
    class Config: from_attributes = True


# ── Auth ────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    name: str = Field(..., min_length=1)
    role: str = Field(default="developer", pattern="^(ciso|developer|auditor)$")
    # tenant options
    tenant_name: Optional[str] = None
    tenant_id: Optional[str] = None
    create_tenant: bool = False
    join_existing_tenant: bool = False


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    name: str
    email: str
    role: str
    tenant_id: str
    tenant_name: str


class MessageResponse(BaseModel):
    message: str
    detail: Optional[str] = None


# ── User ────────────────────────────────────────────────────────────────────

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    tenant_id: str
    is_active: bool
    last_login: Optional[datetime]
    created_at: datetime
    tenant_name: Optional[str] = None
    class Config: from_attributes = True


class RoleChangeRequest(BaseModel):
    role: str = Field(..., pattern="^(ciso|developer|auditor)$")


# ── Assessment ──────────────────────────────────────────────────────────────

class AssessmentCreate(BaseModel):
    org_name: str = Field(..., min_length=1)
    industry: Optional[str] = None
    employees: int = Field(default=1, ge=1)
    has_mfa: bool = False
    mfa_coverage: int = Field(default=0, ge=0, le=100)
    patch_days: int = Field(default=30, ge=0)
    training_percent: int = Field(default=0, ge=0, le=100)
    has_irp: bool = False
    vulnerabilities: int = Field(default=0, ge=0)
    vuln_critical: Optional[int] = 0
    vuln_high: Optional[int] = 0
    vuln_medium: Optional[int] = 0
    vuln_low: Optional[int] = 0
    vuln_source: Optional[str] = None


class AssessmentResponse(BaseModel):
    id: str
    tenant_id: str
    org_name: str
    industry: Optional[str]
    employees: int
    has_mfa: bool
    mfa_coverage: int
    patch_days: int
    training_percent: int
    has_irp: bool
    vulnerabilities: int
    risk_score: float
    risk_level: str
    financial_exposure: float
    recommendations: Optional[List[str]] = []
    model_version: Optional[str]
    created_at: datetime

    @validator("recommendations", pre=True, always=True)
    def parse_recs(cls, v):
        if v is None: return []
        if isinstance(v, str):
            try: return json.loads(v)
            except: return []
        return v

    class Config: from_attributes = True


class AssessmentListItem(BaseModel):
    id: str
    org_name: str
    industry: Optional[str]
    risk_score: float
    risk_level: str
    financial_exposure: float
    created_at: datetime
    class Config: from_attributes = True


# ── Task ────────────────────────────────────────────────────────────────────

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1)
    description: Optional[str] = None
    priority: str = Field(default="MEDIUM", pattern="^(LOW|MEDIUM|HIGH|CRITICAL)$")
    assignee: Optional[str] = None
    due: Optional[str] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(open|in-progress|done)$")
    priority: Optional[str] = Field(None, pattern="^(LOW|MEDIUM|HIGH|CRITICAL)$")
    assignee: Optional[str] = None
    due: Optional[str] = None


class TaskResponse(BaseModel):
    id: str
    tenant_id: str
    title: str
    description: Optional[str]
    status: str
    priority: str
    assignee: Optional[str]
    due: Optional[str]
    source: str
    created_at: datetime
    updated_at: datetime
    class Config: from_attributes = True


# ── Report ──────────────────────────────────────────────────────────────────

class BoardReportRequest(BaseModel):
    org_name: str
    tenant_name: Optional[str]
    risk_score: float
    nist_pct: int
    iso_pct: int
    implemented_controls: int
    total_controls: int
    financial_exposure: float
    assessment_history: Optional[List[dict]] = []
    tasks: Optional[List[dict]] = []
    generated_by: str
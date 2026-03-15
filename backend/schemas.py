from pydantic import BaseModel
from typing import List


class AssessmentInput(BaseModel):
    org_name: str
    industry: str
    employees: int
    has_mfa: bool
    mfa_coverage: int
    patch_days: int
    training_percent: int
    has_irp: bool
    vulnerabilities: int


class AssessmentResult(BaseModel):
    org_name: str
    industry: str
    employees: int
    risk_score: float
    risk_level: str
    financial_exposure: int
    recommendations: List[str]
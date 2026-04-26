import sys
sys.path.append("../ml")

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db, Assessment, Base, engine
from models import User
from schemas import AssessmentInput, AssessmentResult, RegisterInput, LoginInput, TokenResponse
from scoring import get_risk_level, get_financial_exposure, get_recommendations
from predict import predict_risk, predict_trend
from auth import hash_password, verify_password, create_token, get_current_user
from audit_chain import anchor_assessment
from controls import get_controls, calculate_checklist_score

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AURA", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"message": "AURA is running", "version": "2.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/register", response_model=TokenResponse)
def register(data: RegisterInput, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        name=data.name,
        email=data.email,
        hashed_password=hash_password(data.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_token({"sub": user.email})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        name=user.name,
        email=user.email
    )


@app.post("/login", response_model=TokenResponse)
def login(data: LoginInput, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token({"sub": user.email})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        name=user.name,
        email=user.email
    )


@app.post("/assess", response_model=AssessmentResult)
def assess(data: AssessmentInput, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    input_data = {
        "has_mfa": data.has_mfa,
        "mfa_coverage": data.mfa_coverage,
        "patch_days": data.patch_days,
        "training_percent": data.training_percent,
        "has_irp": data.has_irp,
        "vulnerabilities": data.vulnerabilities,
        "employees": data.employees
    }
    score = float(predict_risk(input_data))
    level = get_risk_level(score)
    exposure = get_financial_exposure(score, data.employees)
    recs = get_recommendations(input_data)
    record = Assessment(
        org_name=data.org_name,
        industry=data.industry,
        employees=data.employees,
        risk_score=score,
        risk_level=level,
        financial_exposure=exposure,
        has_mfa=data.has_mfa,
        mfa_coverage=data.mfa_coverage,
        patch_days=data.patch_days,
        training_percent=data.training_percent,
        has_irp=data.has_irp,
        vulnerabilities=data.vulnerabilities,
        created_at=datetime.utcnow()
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    anchor_assessment(data.org_name, score, level, record.id)
    return AssessmentResult(
        org_name=data.org_name,
        industry=data.industry,
        employees=data.employees,
        risk_score=score,
        risk_level=level,
        financial_exposure=exposure,
        recommendations=recs
    )


@app.get("/assessments")
def get_assessments(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    records = db.query(Assessment).order_by(Assessment.created_at.desc()).all()
    return records


@app.post("/trend")
def get_trend(data: AssessmentInput, current_user: User = Depends(get_current_user)):
    input_data = {
        "has_mfa": data.has_mfa,
        "mfa_coverage": data.mfa_coverage,
        "patch_days": data.patch_days,
        "training_percent": data.training_percent,
        "has_irp": data.has_irp,
        "vulnerabilities": data.vulnerabilities,
        "employees": data.employees
    }
    return predict_trend(input_data)


@app.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "name": current_user.name,
        "email": current_user.email,
        "created_at": current_user.created_at
    }


@app.get("/audit-trail/{org_name}")
def audit_trail(org_name: str, current_user: User = Depends(get_current_user)):
    from audit_chain import get_audit_trail
    return get_audit_trail(org_name)


@app.get("/verify/{org_name}/{assessment_id}")
def verify(org_name: str, assessment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from audit_chain import verify_assessment
    record = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return verify_assessment(org_name, record.risk_score, record.risk_level, assessment_id)


@app.get("/controls")
def list_controls(current_user: User = Depends(get_current_user)):
    return get_controls()


@app.post("/controls/score")
def score_controls(data: dict, current_user: User = Depends(get_current_user)):
    implemented = data.get("implemented_ids", [])
    score = calculate_checklist_score(implemented)

    if score >= 75:
        level = "CRITICAL"
    elif score >= 55:
        level = "HIGH"
    elif score >= 35:
        level = "MEDIUM"
    else:
        level = "LOW"

    total_reduction = 100 - score
    all_controls = get_controls()
    max_possible = sum(c["risk_reduction"] for c in all_controls)

    return {
        "risk_score": score,
        "risk_level": level,
        "total_reduction": total_reduction,
        "controls_implemented": len(implemented),
        "controls_total": len(all_controls),
        "max_possible_reduction": max_possible
    }
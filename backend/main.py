from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db, Assessment, Base, engine
from schemas import AssessmentInput, AssessmentResult
from scoring import calculate_risk, get_risk_level, get_financial_exposure, get_recommendations

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AURA", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"message": "AURA is running", "version": "1.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/assess", response_model=AssessmentResult)
def assess(data: AssessmentInput, db: Session = Depends(get_db)):
    input_data = {
        "has_mfa": data.has_mfa,
        "mfa_coverage": data.mfa_coverage,
        "patch_days": data.patch_days,
        "training_percent": data.training_percent,
        "has_irp": data.has_irp,
        "vulnerabilities": data.vulnerabilities
    }

    score = calculate_risk(input_data)
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
def get_assessments(db: Session = Depends(get_db)):
    records = db.query(Assessment).order_by(Assessment.created_at.desc()).all()
    return records
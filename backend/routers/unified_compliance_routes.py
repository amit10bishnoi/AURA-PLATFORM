from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from dependencies import get_current_user
from models import Assessment
from compliance_frameworks import score_all_frameworks, build_assessment_dict

router = APIRouter(prefix="/api/compliance", tags=["Compliance"])


def get_all_8(assessment):
    # Convert SQLAlchemy object to dict first
    assessment_dict = build_assessment_dict(assessment)
    results = list(score_all_frameworks(assessment_dict))
    try:
        from extra_frameworks import score_extra_framework, EXTRA_FRAMEWORK_META
        for key in EXTRA_FRAMEWORK_META.keys():
            r = score_extra_framework(key, assessment)
            if r and isinstance(r, dict):
                results.append(r)
    except Exception as e:
        print(f"extra error: {e}")
    return results


@router.post("/assessments/{assessment_id}")
def run_compliance_mapping(
    assessment_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    a = db.query(Assessment).filter(
        Assessment.id == assessment_id,
        Assessment.tenant_id == current_user.tenant_id,
    ).first()
    if not a:
        raise HTTPException(status_code=404, detail="Not found")
    return get_all_8(a)


@router.get("/assessments/{assessment_id}")
def get_compliance_results(
    assessment_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    a = db.query(Assessment).filter(
        Assessment.id == assessment_id,
        Assessment.tenant_id == current_user.tenant_id,
    ).first()
    if not a:
        raise HTTPException(status_code=404, detail="Not found")
    return get_all_8(a)


@router.get("/summary")
def get_compliance_summary(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    assessments = db.query(Assessment).filter(
        Assessment.tenant_id == current_user.tenant_id
    ).order_by(Assessment.created_at.desc()).limit(10).all()
    out = []
    for a in assessments:
        for r in get_all_8(a):
            out.append({
                "assessment_id": a.id,
                "org_name": a.org_name,
                "framework": r.get("framework") or r.get("key"),
                "score": r.get("score", 0),
                "created_at": str(a.created_at),
            })
    return out

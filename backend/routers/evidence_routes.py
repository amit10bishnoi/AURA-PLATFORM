from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
from typing import Optional
import os, shutil, json

router = APIRouter(prefix="/api/evidence", tags=["evidence"])
Base  = declarative_base()
UPLOAD_DIR = "uploads/evidence"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ── Model ──────────────────────────────────────────────────────────────────────
class Evidence(Base):
    __tablename__ = "evidence"
    id           = Column(Integer, primary_key=True, index=True)
    tenant_id    = Column(String, index=True)
    name         = Column(String)
    file_path    = Column(String, nullable=True)
    file_size_kb = Column(Integer, nullable=True)
    file_type    = Column(String, nullable=True)
    framework    = Column(String)
    control_id   = Column(String, nullable=True)
    control_name = Column(String, nullable=True)
    category     = Column(String)   # Policy | Report | Screenshot | Config | Other
    status       = Column(String, default="PENDING_REVIEW")  # PENDING_REVIEW | APPROVED | REJECTED | EXPIRED
    description  = Column(Text, nullable=True)
    uploaded_by  = Column(String)
    reviewed_by  = Column(String, nullable=True)
    expires_at   = Column(DateTime, nullable=True)
    created_at   = Column(DateTime, default=datetime.utcnow)
    updated_at   = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# ── DB dependency ──────────────────────────────────────────────────────────────
def get_db():
    from database import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ── Demo seed data ─────────────────────────────────────────────────────────────
DEMO_EVIDENCE = [
    {"name":"Penetration Test Report 2025","framework":"SOC2","control_id":"CC7.1","control_name":"System Operations","category":"Report","status":"APPROVED","file_type":"pdf","file_size_kb":1820,"description":"Annual pentest by SecureWorks","uploaded_by":"Amit Shah","reviewed_by":"Priya Nair"},
    {"name":"Access Control Policy v3.2","framework":"SOC2","control_id":"CC6.1","control_name":"Logical Access","category":"Policy","status":"APPROVED","file_type":"pdf","file_size_kb":245,"description":"Updated IAM policy document","uploaded_by":"Priya Nair","reviewed_by":"Amit Shah"},
    {"name":"MFA Screenshot — Admin Portal","framework":"SOC2","control_id":"CC6.1","control_name":"Logical Access","category":"Screenshot","status":"APPROVED","file_type":"png","file_size_kb":85,"description":"Screenshot showing MFA enforcement","uploaded_by":"Amit Shah","reviewed_by":"Priya Nair"},
    {"name":"Incident Response Plan v2","framework":"SOC2","control_id":"CC7.4","control_name":"Incident Response","category":"Policy","status":"APPROVED","file_type":"pdf","file_size_kb":189,"description":"Updated IR playbook","uploaded_by":"Priya Nair","reviewed_by":"Amit Shah"},
    {"name":"AWS Config Rules Export","framework":"SOC2","control_id":"CC6.6","control_name":"Cloud Security","category":"Config","status":"REJECTED","file_type":"json","file_size_kb":55,"description":"Outdated — needs refresh","uploaded_by":"Riya Mehta","reviewed_by":"Amit Shah"},
]

def _fmt_evidence(e, idx=0):
    from datetime import timedelta
    import random
    now = datetime.utcnow()
    base = {
        "id": idx+1,
        "name": e["name"], "framework": e["framework"],
        "control_id": e.get("control_id"), "control_name": e.get("control_name"),
        "category": e["category"], "status": e["status"],
        "file_type": e.get("file_type"), "file_size_kb": e.get("file_size_kb"),
        "description": e.get("description"), "uploaded_by": e["uploaded_by"],
        "reviewed_by": e.get("reviewed_by"),
        "created_at": (now - timedelta(days=idx*4+random.randint(0,3))).isoformat(),
        "updated_at": (now - timedelta(days=idx+random.randint(0,2))).isoformat(),
        "expires_at": (now + timedelta(days=365-idx*10)).isoformat() if e["status"]=="APPROVED" else None,
    }
    return base

# ── Routes ─────────────────────────────────────────────────────────────────────
@router.get("")
def get_evidence(
    tenant_id: str = Query(...),
    framework: Optional[str] = Query(None),
    status:    Optional[str] = Query(None),
    category:  Optional[str] = Query(None),
    search:    Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    try:
        q = db.query(Evidence).filter(Evidence.tenant_id == tenant_id)
        if framework: q = q.filter(Evidence.framework == framework)
        if status:    q = q.filter(Evidence.status == status)
        if category:  q = q.filter(Evidence.category == category)
        if search:
            s = f"%{search}%"
            q = q.filter(Evidence.name.ilike(s) | Evidence.control_name.ilike(s))
        items = q.order_by(Evidence.created_at.desc()).all()
        return {"evidence": [
            {"id":e.id,"name":e.name,"framework":e.framework,"control_id":e.control_id,
             "control_name":e.control_name,"category":e.category,"status":e.status,
             "file_type":e.file_type,"file_size_kb":e.file_size_kb,
             "description":e.description,"uploaded_by":e.uploaded_by,
             "reviewed_by":e.reviewed_by,
             "created_at":e.created_at.isoformat(),
             "expires_at":e.expires_at.isoformat() if e.expires_at else None}
            for e in items
        ], "total": len(items)}
    except Exception:
        filtered = DEMO_EVIDENCE[:]
        if framework: filtered = [e for e in filtered if e["framework"]==framework]
        if status:    filtered = [e for e in filtered if e["status"]==status]
        if category:  filtered = [e for e in filtered if e["category"]==category]
        if search:
            s = search.lower()
            filtered = [e for e in filtered if s in e["name"].lower() or s in (e.get("control_name") or "").lower()]
        return {"evidence": [_fmt_evidence(e, i) for i,e in enumerate(filtered)], "total": len(filtered)}


@router.post("")
async def upload_evidence(
    tenant_id:    str = Form(...),
    name:         str = Form(...),
    framework:    str = Form(...),
    category:     str = Form(...),
    uploaded_by:  str = Form(...),
    control_id:   str = Form(None),
    control_name: str = Form(None),
    description:  str = Form(None),
    file: UploadFile = File(None),
    db: Session = Depends(get_db),
):
    file_path, file_size_kb, file_type = None, None, None
    if file:
        dest = os.path.join(UPLOAD_DIR, f"{tenant_id}_{datetime.utcnow().timestamp()}_{file.filename}")
        with open(dest, "wb") as f:
            shutil.copyfileobj(file.file, f)
        file_path    = dest
        file_size_kb = os.path.getsize(dest) // 1024
        file_type    = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "unknown"
    try:
        entry = Evidence(
            tenant_id=tenant_id, name=name, framework=framework,
            category=category, uploaded_by=uploaded_by,
            control_id=control_id, control_name=control_name,
            description=description, file_path=file_path,
            file_size_kb=file_size_kb, file_type=file_type,
        )
        db.add(entry); db.commit(); db.refresh(entry)
        return {"message": "Evidence uploaded", "id": entry.id}
    except Exception as e:
        return {"message": "Demo mode — evidence recorded", "id": 999}


@router.patch("/{evidence_id}/status")
def update_status(
    evidence_id: int,
    status:      str = Query(...),
    reviewed_by: str = Query(...),
    db: Session = Depends(get_db),
):
    try:
        e = db.query(Evidence).filter(Evidence.id == evidence_id).first()
        if not e:
            raise HTTPException(404, "Evidence not found")
        e.status = status; e.reviewed_by = reviewed_by
        db.commit()
        return {"message": "Status updated"}
    except HTTPException:
        raise
    except Exception:
        return {"message": "Demo mode — status updated"}


@router.delete("/{evidence_id}")
def delete_evidence(evidence_id: int, db: Session = Depends(get_db)):
    try:
        e = db.query(Evidence).filter(Evidence.id == evidence_id).first()
        if not e:
            raise HTTPException(404, "Not found")
        if e.file_path and os.path.exists(e.file_path):
            os.remove(e.file_path)
        db.delete(e); db.commit()
        return {"message": "Deleted"}
    except HTTPException:
        raise
    except Exception:
        return {"message": "Demo mode — deleted"}

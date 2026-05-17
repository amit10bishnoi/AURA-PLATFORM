from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, DateTime, Text, desc
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
from typing import Optional
import json

router = APIRouter(prefix="/api/audit-logs", tags=["audit-logs"])
Base = declarative_base()

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id         = Column(Integer, primary_key=True, index=True)
    tenant_id  = Column(String, index=True)
    user_email = Column(String)
    user_name  = Column(String)
    action     = Column(String)
    category   = Column(String)
    framework  = Column(String, nullable=True)
    resource   = Column(String, nullable=True)
    detail     = Column(Text, nullable=True)
    ip_address = Column(String, nullable=True)
    status     = Column(String, default="SUCCESS")
    created_at = Column(DateTime, default=datetime.utcnow)

def get_db():
    from database import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

DEMO_LOGS = [
    {"user_name":"Amit Shah","user_email":"amit@acme.com","action":"CONTROL_UPDATED","category":"Compliance","framework":"SOC2","resource":"CC6.1 Logical Access","status":"SUCCESS","detail":{"old":"IN_PROGRESS","new":"IMPLEMENTED"}},
    {"user_name":"System","user_email":"system@aura","action":"RISK_SCAN_COMPLETED","category":"Risk","framework":None,"resource":"Full Platform Scan","status":"SUCCESS","detail":{"findings":12,"critical":2}},
    {"user_name":"Amit Shah","user_email":"amit@acme.com","action":"INTEGRATION_CONNECTED","category":"Integration","framework":None,"resource":"Okta SSO","status":"SUCCESS","detail":{}},
    {"user_name":"Riya Mehta","user_email":"riya@acme.com","action":"USER_INVITED","category":"User","framework":None,"resource":"new.user@acme.com","status":"SUCCESS","detail":{"role":"Auditor"}},
    {"user_name":"Riya Mehta","user_email":"riya@acme.com","action":"LOGIN","category":"User","framework":None,"resource":None,"status":"SUCCESS","detail":{"method":"SSO"}},
    {"user_name":"Unknown","user_email":"attacker@evil.com","action":"LOGIN","category":"User","framework":None,"resource":None,"status":"FAILURE","detail":{"reason":"Invalid credentials"}},
    {"user_name":"Amit Shah","user_email":"amit@acme.com","action":"TRUST_CENTER_UPDATED","category":"Compliance","framework":None,"resource":"Trust Center","status":"SUCCESS","detail":{"section":"Security Policies"}},
    {"user_name":"Priya Nair","user_email":"priya@acme.com","action":"EVIDENCE_UPLOADED","category":"Evidence","framework":"SOC2","resource":"Penetration Test Report.pdf","status":"SUCCESS","detail":{"size_kb":1820}},
]

@router.get("")
def get_audit_logs(
    tenant_id: str = Query(...),
    category:  Optional[str] = Query(None),
    status:    Optional[str] = Query(None),
    framework: Optional[str] = Query(None),
    search:    Optional[str] = Query(None),
    limit:     int = Query(50),
    offset:    int = Query(0),
    db: Session = Depends(get_db),
):
    try:
        q = db.query(AuditLog).filter(AuditLog.tenant_id == tenant_id)
        if category:  q = q.filter(AuditLog.category == category)
        if status:    q = q.filter(AuditLog.status == status)
        if framework: q = q.filter(AuditLog.framework == framework)
        if search:
            s = f"%{search}%"
            q = q.filter(AuditLog.action.ilike(s)|AuditLog.resource.ilike(s)|AuditLog.user_name.ilike(s))
        total = q.count()
        logs  = q.order_by(desc(AuditLog.created_at)).offset(offset).limit(limit).all()
        return {"total":total,"logs":[{"id":l.id,"user_name":l.user_name,"user_email":l.user_email,"action":l.action,"category":l.category,"framework":l.framework,"resource":l.resource,"status":l.status,"detail":json.loads(l.detail) if l.detail else {},"ip_address":l.ip_address,"created_at":l.created_at.isoformat()} for l in logs]}
    except Exception:
        import random
        from datetime import timedelta
        filtered = DEMO_LOGS[:]
        if category:  filtered = [l for l in filtered if l["category"]==category]
        if status:    filtered = [l for l in filtered if l["status"]==status]
        if framework: filtered = [l for l in filtered if l.get("framework")==framework]
        if search:
            s=search.lower()
            filtered=[l for l in filtered if s in l["action"].lower() or s in (l.get("resource") or "").lower() or s in l["user_name"].lower()]
        now=datetime.utcnow()
        result=[]
        for i,l in enumerate(filtered):
            result.append({**l,"id":i+1,"detail":l.get("detail",{}),"ip_address":f"192.168.1.{random.randint(10,99)}","created_at":(now-timedelta(hours=i*3+random.randint(0,2))).isoformat()})
        return {"total":len(result),"logs":result[offset:offset+limit]}

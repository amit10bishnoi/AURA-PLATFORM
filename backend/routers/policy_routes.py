from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, DateTime, Text, desc
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime, timedelta
from typing import Optional
import json

router = APIRouter(prefix="/api/policies", tags=["policies"])
Base  = declarative_base()

class Policy(Base):
    __tablename__ = "policies"
    id             = Column(Integer, primary_key=True, index=True)
    tenant_id      = Column(String, index=True)
    title          = Column(String)
    description    = Column(Text, nullable=True)
    content        = Column(Text, nullable=True)
    category       = Column(String)
    status         = Column(String, default="DRAFT")
    version        = Column(String, default="1.0")
    owner          = Column(String)
    frameworks     = Column(String, nullable=True)
    controls       = Column(String, nullable=True)
    approved_by    = Column(String, nullable=True)
    review_date    = Column(DateTime, nullable=True)
    effective_date = Column(DateTime, nullable=True)
    created_at     = Column(DateTime, default=datetime.utcnow)
    updated_at     = Column(DateTime, default=datetime.utcnow)

def get_db():
    from database import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

DEMO_POLICIES = [
    {"title":"Information Security Policy","category":"Security","status":"APPROVED","version":"3.1","owner":"Amit Shah","frameworks":["SOC2","ISO27001"],"controls":["CC6.1","A.5.1"],"approved_by":"Board of Directors","description":"Defines the overall information security objectives, principles, and responsibilities.","content":"1. Purpose\nThis policy establishes the information security framework.\n\n2. Scope\nApplies to all employees, contractors, and third parties.\n\n3. Policy Statements\n3.1 All information assets must be classified.\n3.2 Access to systems must follow least privilege.\n3.3 Incidents must be reported within 24 hours.","review_date":(datetime.utcnow()+timedelta(days=180)).isoformat(),"effective_date":(datetime.utcnow()-timedelta(days=365)).isoformat()},
    {"title":"Data Privacy Policy","category":"Privacy","status":"APPROVED","version":"2.3","owner":"Priya Nair","frameworks":["GDPR","DPDP"],"controls":["Art.5","Art.13"],"approved_by":"DPO","description":"Governs how personal data is collected, processed, stored, and deleted in compliance with GDPR and DPDP.","content":"1. Purpose\nThis policy ensures lawful processing of personal data.\n\n2. Principles\n2.1 Data minimization\n2.2 Purpose limitation\n2.3 Storage limitation","review_date":(datetime.utcnow()+timedelta(days=90)).isoformat(),"effective_date":(datetime.utcnow()-timedelta(days=180)).isoformat()},
    {"title":"Acceptable Use Policy","category":"IT","status":"APPROVED","version":"1.8","owner":"Riya Mehta","frameworks":["SOC2","NIST_CSF"],"controls":["CC6.6"],"approved_by":"CISO","description":"Defines acceptable use of company systems, devices, and networks.","content":"1. Purpose\nProtect company assets from misuse.\n\n2. Acceptable Use\n2.1 Use systems for business purposes only\n2.2 Do not share credentials\n2.3 Lock devices when unattended","review_date":(datetime.utcnow()+timedelta(days=270)).isoformat(),"effective_date":(datetime.utcnow()-timedelta(days=200)).isoformat()},
    {"title":"Incident Response Policy","category":"Security","status":"APPROVED","version":"2.0","owner":"Amit Shah","frameworks":["SOC2","HIPAA","NIST_CSF"],"controls":["CC7.4","IR-1"],"approved_by":"CISO","description":"Defines the process for detecting, responding to, and recovering from security incidents.","content":"1. Purpose\nEnsure timely and effective response to security incidents.\n\n2. Incident Classification\nP1 - Critical: Data breach, ransomware\nP2 - High: Unauthorized access\nP3 - Medium: Policy violation\nP4 - Low: Phishing attempt","review_date":(datetime.utcnow()+timedelta(days=120)).isoformat(),"effective_date":(datetime.utcnow()-timedelta(days=300)).isoformat()},
    {"title":"Business Continuity Policy","category":"Compliance","status":"REVIEW","version":"1.5","owner":"Priya Nair","frameworks":["ISO27001","SOC2"],"controls":["A.17.1","A1.2"],"approved_by":None,"description":"Ensures critical business functions can continue during and after a disaster.","content":"1. Purpose\nMaintain business operations during disruptions.\n\n2. RTO and RPO\nRTO: 4 hours for critical systems\nRPO: 1 hour for financial data","review_date":(datetime.utcnow()+timedelta(days=45)).isoformat(),"effective_date":None},
    {"title":"Password Policy","category":"Security","status":"APPROVED","version":"4.0","owner":"Amit Shah","frameworks":["SOC2","HIPAA","PCI_DSS"],"controls":["CC6.1","164.308","Req.8"],"approved_by":"CISO","description":"Defines password complexity, rotation, and management requirements.","content":"1. Password Requirements\n- Minimum 14 characters\n- Must include uppercase, lowercase, number, symbol\n- No reuse of last 12 passwords\n\n2. MFA required for all admin access","review_date":(datetime.utcnow()+timedelta(days=200)).isoformat(),"effective_date":(datetime.utcnow()-timedelta(days=400)).isoformat()},
    {"title":"Data Classification Policy","category":"Security","status":"DRAFT","version":"0.9","owner":"Priya Nair","frameworks":["ISO27001","GDPR"],"controls":["A.8.2"],"approved_by":None,"description":"Defines how data is classified and handled accordingly.","content":"1. Classification Levels\n- Public: No restrictions\n- Internal: Employees only\n- Confidential: Need-to-know\n- Restricted: Encrypted, limited access","review_date":None,"effective_date":None},
    {"title":"Vendor Management Policy","category":"Compliance","status":"REVIEW","version":"1.2","owner":"Riya Mehta","frameworks":["SOC2","PCI_DSS"],"controls":["CC9.2","Req.12.8"],"approved_by":None,"description":"Governs assessment, onboarding, and monitoring of third-party vendors.","content":"1. Purpose\nManage risk from third-party vendors.\n\n2. Vendor Assessment\n2.1 All vendors must complete security questionnaire\n2.2 Critical vendors require annual audit","review_date":(datetime.utcnow()+timedelta(days=30)).isoformat(),"effective_date":None},
    {"title":"Remote Work Security Policy","category":"IT","status":"APPROVED","version":"2.1","owner":"Riya Mehta","frameworks":["SOC2","NIST_CSF"],"controls":["CC6.6","PR.AC-3"],"approved_by":"CISO","description":"Security requirements for employees working remotely.","content":"1. VPN Requirements\nAll remote access must use company VPN.\n\n2. Device Security\nOnly company-managed devices allowed.\n\n3. Home Network\nWPA3 encryption required","review_date":(datetime.utcnow()+timedelta(days=160)).isoformat(),"effective_date":(datetime.utcnow()-timedelta(days=500)).isoformat()},
    {"title":"HIPAA Privacy Policy","category":"Privacy","status":"EXPIRED","version":"1.3","owner":"Amit Shah","frameworks":["HIPAA"],"controls":["164.502","164.514"],"approved_by":"Compliance Officer","description":"Governs the use and disclosure of protected health information (PHI).","content":"1. PHI Definition\nProtected Health Information includes all individually identifiable health information.\n\n2. Permitted Uses\n2.1 Treatment, payment, operations\n2.2 As required by law","review_date":(datetime.utcnow()-timedelta(days=30)).isoformat(),"effective_date":(datetime.utcnow()-timedelta(days=730)).isoformat()},
]

def _fmt(p, i=0):
    import random
    now = datetime.utcnow()
    return {"id":i+1,"title":p["title"],"category":p["category"],"status":p["status"],"version":p["version"],"owner":p["owner"],"frameworks":p.get("frameworks",[]),"controls":p.get("controls",[]),"approved_by":p.get("approved_by"),"description":p.get("description",""),"content":p.get("content",""),"review_date":p.get("review_date"),"effective_date":p.get("effective_date"),"created_at":(now-timedelta(days=i*15+random.randint(0,10))).isoformat(),"updated_at":(now-timedelta(days=i*2+random.randint(0,5))).isoformat()}

@router.get("")
def get_policies(tenant_id:str=Query(...),category:Optional[str]=Query(None),status:Optional[str]=Query(None),framework:Optional[str]=Query(None),search:Optional[str]=Query(None),db:Session=Depends(get_db)):
    try:
        q=db.query(Policy).filter(Policy.tenant_id==tenant_id)
        if category: q=q.filter(Policy.category==category)
        if status:   q=q.filter(Policy.status==status)
        if search:
            s=f"%{search}%"
            q=q.filter(Policy.title.ilike(s)|Policy.description.ilike(s))
        items=q.order_by(desc(Policy.updated_at)).all()
        result=[]
        for p in items:
            fw=json.loads(p.frameworks) if p.frameworks else []
            ct=json.loads(p.controls)   if p.controls   else []
            if framework and framework not in fw: continue
            result.append({"id":p.id,"title":p.title,"category":p.category,"status":p.status,"version":p.version,"owner":p.owner,"frameworks":fw,"controls":ct,"approved_by":p.approved_by,"description":p.description,"content":p.content,"review_date":p.review_date.isoformat() if p.review_date else None,"effective_date":p.effective_date.isoformat() if p.effective_date else None,"created_at":p.created_at.isoformat(),"updated_at":p.updated_at.isoformat()})
        return {"policies":result,"total":len(result)}
    except Exception:
        filtered=DEMO_POLICIES[:]
        if category: filtered=[p for p in filtered if p["category"]==category]
        if status:   filtered=[p for p in filtered if p["status"]==status]
        if framework:filtered=[p for p in filtered if framework in p.get("frameworks",[])]
        if search:
            s=search.lower()
            filtered=[p for p in filtered if s in p["title"].lower() or s in p.get("description","").lower()]
        return {"policies":[_fmt(p,i) for i,p in enumerate(filtered)],"total":len(filtered)}

@router.post("")
def create_policy(body:dict,tenant_id:str=Query(...),db:Session=Depends(get_db)):
    try:
        p=Policy(tenant_id=tenant_id,title=body.get("title"),description=body.get("description"),content=body.get("content"),category=body.get("category","Security"),status="DRAFT",version=body.get("version","1.0"),owner=body.get("owner",""),frameworks=json.dumps(body.get("frameworks",[])),controls=json.dumps(body.get("controls",[])))
        db.add(p);db.commit();db.refresh(p)
        return {"message":"Policy created","id":p.id}
    except Exception:
        return {"message":"Demo mode","id":999}

@router.patch("/{policy_id}/status")
def update_status(policy_id:int,status:str=Query(...),approved_by:str=Query(None),db:Session=Depends(get_db)):
    try:
        p=db.query(Policy).filter(Policy.id==policy_id).first()
        if not p: raise HTTPException(404,"Not found")
        p.status=status
        if approved_by: p.approved_by=approved_by
        if status=="APPROVED": p.effective_date=datetime.utcnow()
        p.updated_at=datetime.utcnow()
        db.commit()
        return {"message":"Updated"}
    except HTTPException: raise
    except Exception: return {"message":"Demo mode"}

@router.delete("/{policy_id}")
def delete_policy(policy_id:int,db:Session=Depends(get_db)):
    try:
        p=db.query(Policy).filter(Policy.id==policy_id).first()
        if not p: raise HTTPException(404,"Not found")
        db.delete(p);db.commit()
        return {"message":"Deleted"}
    except HTTPException: raise
    except Exception: return {"message":"Demo mode"}

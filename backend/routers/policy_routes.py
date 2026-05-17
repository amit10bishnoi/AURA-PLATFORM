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
    {"title":"Business Continuity Policy","category":"Compliance","status":"REVIEW","version":"1.5","owner":"Priya Nair","frameworks":["ISO27001","SOC2"],"controls":["A.17.1","A1.2"],"approved_by":None,"description":"Ensures critical business functions can continue during and after a disaster.","content":"1. Purpose\nMaintain business operations during disruptions.\n\n2. RTO and RPO\nRTO: 4 hours for critical systems\nRPO: 1 hour for financial data","review_date":(datetime.utcnow()+timedelta(days=45)).isoformat(),"effective_date":None},
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

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, DateTime, Text, Float
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime, timedelta
from typing import Optional
import json, random

router = APIRouter(prefix="/api/vendors", tags=["vendors"])
Base = declarative_base()

class Vendor(Base):
    __tablename__ = "vendors"
    id              = Column(Integer, primary_key=True, index=True)
    tenant_id       = Column(String, index=True)
    name            = Column(String)
    category        = Column(String)
    website         = Column(String, nullable=True)
    contact_email   = Column(String, nullable=True)
    risk_score      = Column(Float, default=0.0)
    risk_level      = Column(String, default="LOW")
    status          = Column(String, default="ACTIVE")
    data_access     = Column(String, nullable=True)
    frameworks      = Column(String, nullable=True)
    questionnaire_status = Column(String, default="NOT_SENT")
    questionnaire_sent   = Column(DateTime, nullable=True)
    questionnaire_due    = Column(DateTime, nullable=True)
    last_reviewed   = Column(DateTime, nullable=True)
    next_review     = Column(DateTime, nullable=True)
    notes           = Column(Text, nullable=True)
    created_at      = Column(DateTime, default=datetime.utcnow)
    updated_at      = Column(DateTime, default=datetime.utcnow)

def get_db():
    from database import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

DEMO_VENDORS = [
    {"name":"AWS","category":"Infrastructure","website":"aws.amazon.com","contact_email":"security@amazon.com","risk_score":15,"risk_level":"LOW","status":"ACTIVE","data_access":["Infrastructure","Compute","Storage"],"frameworks":["SOC2","ISO27001","PCI_DSS"],"questionnaire_status":"COMPLETED","notes":"Primary cloud provider. Annual review completed."},
    {"name":"Okta","category":"SaaS","website":"okta.com","contact_email":"security@okta.com","risk_score":22,"risk_level":"LOW","status":"ACTIVE","data_access":["Identity","Authentication"],"frameworks":["SOC2","ISO27001"],"questionnaire_status":"COMPLETED","notes":"Identity provider. SOC2 Type II certified."},
    {"name":"Salesforce","category":"SaaS","website":"salesforce.com","contact_email":"security@salesforce.com","risk_score":35,"risk_level":"MEDIUM","status":"ACTIVE","data_access":["Customer PII","Sales Data","Contacts"],"frameworks":["SOC2","GDPR"],"questionnaire_status":"COMPLETED","notes":"CRM with access to customer PII. GDPR DPA signed."},
    {"name":"Zendesk","category":"SaaS","website":"zendesk.com","contact_email":"security@zendesk.com","risk_score":42,"risk_level":"MEDIUM","status":"UNDER_REVIEW","data_access":["Customer PII","Support Tickets","Email"],"frameworks":["SOC2"],"questionnaire_status":"OVERDUE","notes":"Support platform. Questionnaire overdue."},
    {"name":"DataAnalytics Co","category":"Professional Services","website":"dataanalytics.co","contact_email":"info@dataanalytics.co","risk_score":68,"risk_level":"HIGH","status":"UNDER_REVIEW","data_access":["Financial Data","Customer PII","Analytics"],"frameworks":[],"questionnaire_status":"SENT","notes":"High data access — needs review."},
    {"name":"CloudBackup Ltd","category":"Infrastructure","website":"cloudbackup.io","contact_email":"security@cloudbackup.io","risk_score":55,"risk_level":"HIGH","status":"ACTIVE","data_access":["All Data","Backups","Encryption Keys"],"frameworks":["ISO27001"],"questionnaire_status":"COMPLETED","notes":"Backup provider with broad data access."},
    {"name":"Slack","category":"SaaS","website":"slack.com","contact_email":"security@slack.com","risk_score":28,"risk_level":"LOW","status":"ACTIVE","data_access":["Internal Communications","Files"],"frameworks":["SOC2","ISO27001"],"questionnaire_status":"COMPLETED","notes":"Internal comms tool. DPA in place."},
    {"name":"PaymentGateway Pro","category":"SaaS","website":"pgpro.io","contact_email":"compliance@pgpro.io","risk_score":82,"risk_level":"CRITICAL","status":"UNDER_REVIEW","data_access":["Payment Data","Financial PII","Card Data"],"frameworks":["PCI_DSS"],"questionnaire_status":"OVERDUE","notes":"Payment processor. PCI compliance evidence not received."},
    {"name":"HR Systems Inc","category":"SaaS","website":"hrsystems.com","contact_email":"security@hrsystems.com","risk_score":48,"risk_level":"MEDIUM","status":"ACTIVE","data_access":["Employee PII","Payroll","Health Data"],"frameworks":["SOC2","HIPAA"],"questionnaire_status":"COMPLETED","notes":"HRIS with sensitive employee data."},
    {"name":"PenTest Partners","category":"Professional Services","website":"pentestpartners.com","contact_email":"hello@pentestpartners.com","risk_score":30,"risk_level":"MEDIUM","status":"ACTIVE","data_access":["System Access","Vulnerability Data"],"frameworks":["ISO27001"],"questionnaire_status":"NOT_SENT","notes":"Annual pentest vendor. NDA signed."},
]

def _fmt(v, i=0):
    now = datetime.utcnow()
    return {"id":i+1,"name":v["name"],"category":v["category"],"website":v.get("website"),"contact_email":v.get("contact_email"),"risk_score":v["risk_score"],"risk_level":v["risk_level"],"status":v["status"],"data_access":v.get("data_access",[]),"frameworks":v.get("frameworks",[]),"questionnaire_status":v["questionnaire_status"],"questionnaire_sent":(now-timedelta(days=30)).isoformat() if v["questionnaire_status"]!="NOT_SENT" else None,"questionnaire_due":(now-timedelta(days=5)).isoformat() if v["questionnaire_status"]=="OVERDUE" else (now+timedelta(days=25)).isoformat() if v["questionnaire_status"]=="SENT" else None,"last_reviewed":(now-timedelta(days=i*20+30)).isoformat(),"next_review":(now+timedelta(days=365-i*20)).isoformat(),"notes":v.get("notes",""),"created_at":(now-timedelta(days=i*30+60)).isoformat(),"updated_at":(now-timedelta(days=i*3+1)).isoformat()}

@router.get("")
def get_vendors(tenant_id:str=Query(...),risk_level:Optional[str]=Query(None),status:Optional[str]=Query(None),search:Optional[str]=Query(None),db:Session=Depends(get_db)):
    try:
        q=db.query(Vendor).filter(Vendor.tenant_id==tenant_id)
        if risk_level: q=q.filter(Vendor.risk_level==risk_level)
        if status: q=q.filter(Vendor.status==status)
        if search:
            s=f"%{search}%"
            q=q.filter(Vendor.name.ilike(s)|Vendor.category.ilike(s))
        items=q.all()
        return {"vendors":[{"id":v.id,"name":v.name,"category":v.category,"website":v.website,"contact_email":v.contact_email,"risk_score":v.risk_score,"risk_level":v.risk_level,"status":v.status,"data_access":json.loads(v.data_access) if v.data_access else [],"frameworks":json.loads(v.frameworks) if v.frameworks else [],"questionnaire_status":v.questionnaire_status,"notes":v.notes,"last_reviewed":v.last_reviewed.isoformat() if v.last_reviewed else None,"next_review":v.next_review.isoformat() if v.next_review else None,"created_at":v.created_at.isoformat()} for v in items],"total":len(items)}
    except Exception:
        filtered=DEMO_VENDORS[:]
        if risk_level: filtered=[v for v in filtered if v["risk_level"]==risk_level]
        if status: filtered=[v for v in filtered if v["status"]==status]
        if search:
            s=search.lower()
            filtered=[v for v in filtered if s in v["name"].lower() or s in v["category"].lower()]
        return {"vendors":[_fmt(v,i) for i,v in enumerate(filtered)],"total":len(filtered)}

@router.post("")
def create_vendor(body:dict,tenant_id:str=Query(...),db:Session=Depends(get_db)):
    try:
        v=Vendor(tenant_id=tenant_id,name=body.get("name"),category=body.get("category","SaaS"),website=body.get("website"),contact_email=body.get("contact_email"),risk_score=body.get("risk_score",0),risk_level=body.get("risk_level","LOW"),data_access=json.dumps(body.get("data_access",[])),frameworks=json.dumps(body.get("frameworks",[])),notes=body.get("notes",""))
        db.add(v);db.commit();db.refresh(v)
        return {"message":"Vendor added","id":v.id}
    except Exception:
        return {"message":"Demo mode","id":999}

@router.patch("/{vendor_id}/questionnaire")
def send_questionnaire(vendor_id:int,db:Session=Depends(get_db)):
    try:
        v=db.query(Vendor).filter(Vendor.id==vendor_id).first()
        if not v: raise HTTPException(404,"Not found")
        v.questionnaire_status="SENT";v.questionnaire_sent=datetime.utcnow();v.questionnaire_due=datetime.utcnow()+timedelta(days=30)
        db.commit()
        return {"message":"Questionnaire sent"}
    except HTTPException: raise
    except Exception: return {"message":"Demo mode"}

@router.delete("/{vendor_id}")
def delete_vendor(vendor_id:int,db:Session=Depends(get_db)):
    try:
        v=db.query(Vendor).filter(Vendor.id==vendor_id).first()
        if not v: raise HTTPException(404,"Not found")
        db.delete(v);db.commit()
        return {"message":"Deleted"}
    except HTTPException: raise
    except Exception: return {"message":"Demo mode"}

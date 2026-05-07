from fastapi import APIRouter, Query
from datetime import datetime, timedelta
import random

router = APIRouter(prefix="/api/reports", tags=["reports"])

DEMO_REPORTS = [
    {"id":1,"name":"SOC2 Type II Readiness Report","framework":"SOC2","type":"Readiness","status":"READY","score":74,"generated_by":"Amit Shah","period":"Q1 2025","pages":24,"created_at":(datetime.utcnow()-timedelta(days=5)).isoformat()},
    {"id":2,"name":"HIPAA Compliance Summary","framework":"HIPAA","type":"Summary","status":"READY","score":81,"generated_by":"Priya Nair","period":"Q1 2025","pages":18,"created_at":(datetime.utcnow()-timedelta(days=10)).isoformat()},
    {"id":3,"name":"GDPR Board Report","framework":"GDPR","type":"Board","status":"READY","score":69,"generated_by":"Amit Shah","period":"March 2025","pages":12,"created_at":(datetime.utcnow()-timedelta(days=15)).isoformat()},
    {"id":4,"name":"PCI DSS Gap Analysis","framework":"PCI_DSS","type":"Gap Analysis","status":"READY","score":55,"generated_by":"Riya Mehta","period":"Q1 2025","pages":31,"created_at":(datetime.utcnow()-timedelta(days=20)).isoformat()},
    {"id":5,"name":"ISO 27001 Audit Package","framework":"ISO27001","type":"Audit Package","status":"READY","score":88,"generated_by":"Priya Nair","period":"Annual 2025","pages":45,"created_at":(datetime.utcnow()-timedelta(days=30)).isoformat()},
    {"id":6,"name":"Executive Risk Dashboard","framework":"ALL","type":"Executive","status":"READY","score":72,"generated_by":"Amit Shah","period":"Q1 2025","pages":8,"created_at":(datetime.utcnow()-timedelta(days=3)).isoformat()},
]

REPORT_TEMPLATES = [
    {"id":"readiness","name":"Readiness Report","description":"Full control status, gaps, and remediation plan","pages_est":20,"frameworks":["SOC2","HIPAA","GDPR","PCI_DSS","ISO27001"]},
    {"id":"board","name":"Board Summary","description":"Executive-level compliance posture overview","pages_est":8,"frameworks":["ALL"]},
    {"id":"gap_analysis","name":"Gap Analysis","description":"Detailed gap analysis with risk scores and priorities","pages_est":25,"frameworks":["SOC2","HIPAA","GDPR","PCI_DSS","ISO27001"]},
    {"id":"audit_package","name":"Audit Package","description":"Complete evidence package for external auditors","pages_est":40,"frameworks":["SOC2","ISO27001","PCI_DSS"]},
    {"id":"vendor_risk","name":"Vendor Risk Report","description":"Third-party risk landscape and questionnaire results","pages_est":15,"frameworks":["ALL"]},
    {"id":"evidence","name":"Evidence Summary","description":"Approved evidence inventory with expiry status","pages_est":12,"frameworks":["ALL"]},
]

@router.get("")
def get_reports(tenant_id:str=Query(...)):
    return {"reports":DEMO_REPORTS,"total":len(DEMO_REPORTS)}

@router.get("/templates")
def get_templates():
    return {"templates":REPORT_TEMPLATES}

@router.post("/generate")
def generate_report(body:dict,tenant_id:str=Query(...)):
    report_id=random.randint(100,999)
    new_report={"id":report_id,"name":body.get("name",f"{body.get('framework','ALL')} {body.get('type','Report')}"),"framework":body.get("framework","ALL"),"type":body.get("type","Summary"),"status":"READY","score":random.randint(60,95),"generated_by":body.get("generated_by","Current User"),"period":body.get("period",datetime.utcnow().strftime("%B %Y")),"pages":random.randint(8,45),"created_at":datetime.utcnow().isoformat()}
    DEMO_REPORTS.insert(0,new_report)
    return {"message":"Report generated","report":new_report}

@router.get("/{report_id}/data")
def get_report_data(report_id:int,tenant_id:str=Query(...)):
    report=next((r for r in DEMO_REPORTS if r["id"]==report_id),DEMO_REPORTS[0])
    return {"report":report,"tenant":{"name":"ACME Corp","industry":"Technology","size":"201-500"},"summary":{"overall_score":report["score"],"controls_total":147,"controls_implemented":int(147*report["score"]/100),"controls_in_progress":18,"controls_not_started":int(147*(1-report["score"]/100))-18,"evidence_total":42,"evidence_approved":35,"evidence_expiring":3,"open_risks":12,"critical_risks":2,"vendors_total":10,"vendors_high_risk":3,"policies_total":10,"policies_approved":7},"framework_scores":[{"framework":"SOC2","score":74,"controls":89},{"framework":"HIPAA","score":81,"controls":45},{"framework":"GDPR","score":69,"controls":32},{"framework":"PCI_DSS","score":55,"controls":78},{"framework":"ISO27001","score":88,"controls":114}],"top_gaps":[{"control":"CC7.2 System Monitoring","framework":"SOC2","priority":"HIGH","status":"IN_PROGRESS"},{"control":"Req 8.3 MFA","framework":"PCI_DSS","priority":"CRITICAL","status":"NOT_STARTED"},{"control":"Art. 32 Security of Processing","framework":"GDPR","priority":"HIGH","status":"IN_PROGRESS"},{"control":"164.308 Risk Analysis","framework":"HIPAA","priority":"MEDIUM","status":"IN_PROGRESS"},{"control":"A.12.6 Vulnerability Management","framework":"ISO27001","priority":"HIGH","status":"NOT_STARTED"}],"generated_at":datetime.utcnow().isoformat()}

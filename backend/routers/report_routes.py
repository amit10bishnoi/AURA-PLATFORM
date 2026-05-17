from fastapi import APIRouter, Query
from datetime import datetime, timedelta
import random

router = APIRouter(prefix="/api/reports", tags=["reports"])

DEMO_REPORTS = [
    {"id":1,"name":"SOC2 Type II Readiness Report","framework":"SOC2","type":"Readiness","status":"READY","score":74,"generated_by":"Amit Shah","period":"Q1 2025","pages":24,"created_at":(datetime.utcnow()-timedelta(days=5)).isoformat()},
    {"id":5,"name":"ISO 27001 Audit Package","framework":"ISO27001","type":"Audit Package","status":"READY","score":88,"generated_by":"Priya Nair","period":"Annual 2025","pages":45,"created_at":(datetime.utcnow()-timedelta(days=30)).isoformat()},
    {"id":6,"name":"Executive Risk Dashboard","framework":"ALL","type":"Executive","status":"READY","score":72,"generated_by":"Amit Shah","period":"Q1 2025","pages":8,"created_at":(datetime.utcnow()-timedelta(days=3)).isoformat()},
]

REPORT_TEMPLATES = [
    {"id":"board","name":"Board Summary","description":"Executive-level compliance posture overview","pages_est":8,"frameworks":["ALL"]},
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

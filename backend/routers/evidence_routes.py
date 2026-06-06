"""
evidence_routes.py — MongoDB edition
"""
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from datetime import datetime, timedelta
from typing import Optional
import os, shutil, random

from database import col, ist_now, gen_uuid
from dependencies import get_current_user

router = APIRouter(prefix="/api/evidence", tags=["evidence"])

UPLOAD_DIR = "/tmp/aura_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def _evidence(): return col("evidence")

DEMO_EVIDENCE = [
    {"name":"Penetration Test Report 2025","framework":"SOC2","category":"Security Testing","control_id":"CC7.1","control_name":"System Monitoring","uploaded_by":"Priya Nair","status":"APPROVED","file_type":"pdf","file_size_kb":1820,"description":"Annual external penetration test conducted by PenTest Partners."},
    {"name":"MFA Enrollment Screenshot","framework":"SOC2","category":"Access Control","control_id":"CC6.1","control_name":"Logical Access","uploaded_by":"Amit Shah","status":"APPROVED","file_type":"png","file_size_kb":245,"description":"Screenshot showing MFA enabled for all admin accounts."},
    {"name":"ISO 27001 Certificate","framework":"ISO27001","category":"Certification","control_id":"A.5.1","control_name":"Information Security Policies","uploaded_by":"Riya Mehta","status":"APPROVED","file_type":"pdf","file_size_kb":512,"description":"ISO 27001:2022 certification from BSI."},
    {"name":"Employee Security Training Completion","framework":"SOC2","category":"Training","control_id":"CC1.4","control_name":"Security Awareness","uploaded_by":"HR Team","status":"PENDING","file_type":"xlsx","file_size_kb":88,"description":"Q1 2025 security awareness training completion records."},
    {"name":"Vendor Risk Assessment — Okta","framework":"ISO27001","category":"Vendor Management","control_id":"A.15.1","control_name":"Supplier Relationships","uploaded_by":"Compliance Team","status":"APPROVED","file_type":"pdf","file_size_kb":340,"description":"Annual vendor risk assessment for Okta identity provider."},
]

def _clean(doc):
    doc = dict(doc)
    doc["id"] = str(doc.get("_id", doc.get("id","")))
    doc.pop("_id", None)
    for f in ["created_at","updated_at","expiry_date"]:
        if isinstance(doc.get(f), datetime):
            doc[f] = doc[f].isoformat()
    return doc

def _fmt_demo(e, i=0):
    now = datetime.utcnow()
    return {**e,"id":str(i+1),"created_at":(now-timedelta(days=i*10+5)).isoformat(),"updated_at":(now-timedelta(days=i*2)).isoformat(),"expiry_date":(now+timedelta(days=365-i*30)).isoformat(),"file_path":None}

@router.get("")
async def get_evidence(tenant_id:str=Query(...),framework:Optional[str]=Query(None),status:Optional[str]=Query(None),search:Optional[str]=Query(None),_=Depends(get_current_user)):
    filt = {"tenant_id":tenant_id}
    if framework: filt["framework"] = framework
    if status: filt["status"] = status
    if search: filt["$or"] = [{"name":{"$regex":search,"$options":"i"}},{"control_name":{"$regex":search,"$options":"i"}}]
    docs = await _evidence().find(filt).sort("created_at",-1).to_list(500)
    if not docs:
        filtered = DEMO_EVIDENCE[:]
        if framework: filtered = [e for e in filtered if e["framework"]==framework]
        if status: filtered = [e for e in filtered if e["status"]==status]
        if search:
            s = search.lower()
            filtered = [e for e in filtered if s in e["name"].lower() or s in e.get("control_name","").lower()]
        return {"evidence":[_fmt_demo(e,i) for i,e in enumerate(filtered)],"total":len(filtered)}
    return {"evidence":[_clean(d) for d in docs],"total":len(docs)}

@router.post("")
async def upload_evidence(
    tenant_id:str=Form(...),
    name:str=Form(...),
    framework:str=Form(...),
    category:str=Form("General"),
    uploaded_by:str=Form(...),
    control_id:Optional[str]=Form(None),
    control_name:Optional[str]=Form(None),
    description:Optional[str]=Form(None),
    file:Optional[UploadFile]=File(None),
    _=Depends(get_current_user),
):
    file_path, file_size_kb, file_type = None, None, None
    if file:
        dest = os.path.join(UPLOAD_DIR, f"{tenant_id}_{datetime.utcnow().timestamp()}_{file.filename}")
        with open(dest,"wb") as f_out:
            shutil.copyfileobj(file.file, f_out)
        file_path = dest
        file_size_kb = os.path.getsize(dest) // 1024
        file_type = file.filename.rsplit(".",1)[-1].lower() if "." in file.filename else "unknown"
    uid = gen_uuid()
    doc = {"_id":uid,"id":uid,"tenant_id":tenant_id,"name":name,"framework":framework,"category":category,"uploaded_by":uploaded_by,"control_id":control_id,"control_name":control_name,"description":description,"file_path":file_path,"file_size_kb":file_size_kb,"file_type":file_type,"status":"PENDING","created_at":ist_now(),"updated_at":ist_now()}
    await _evidence().insert_one(doc)
    return {"message":"Evidence uploaded","id":uid}

@router.patch("/{evidence_id}/status")
async def update_status(evidence_id:str,status:str=Query(...),reviewed_by:str=Query(...),_=Depends(get_current_user)):
    result = await _evidence().update_one(
        {"$or":[{"_id":evidence_id},{"id":evidence_id}]},
        {"$set":{"status":status,"reviewed_by":reviewed_by,"updated_at":ist_now()}}
    )
    if result.matched_count == 0:
        raise HTTPException(404,"Evidence not found")
    return {"message":"Status updated"}

@router.delete("/{evidence_id}")
async def delete_evidence(evidence_id:str,_=Depends(get_current_user)):
    doc = await _evidence().find_one({"$or":[{"_id":evidence_id},{"id":evidence_id}]})
    if not doc:
        raise HTTPException(404,"Not found")
    fp = doc.get("file_path")
    if fp and os.path.exists(fp):
        os.remove(fp)
    await _evidence().delete_one({"$or":[{"_id":evidence_id},{"id":evidence_id}]})
    return {"message":"Deleted"}

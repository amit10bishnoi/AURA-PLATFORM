from fastapi import APIRouter, Query, Request
from datetime import datetime, timedelta
import os, httpx, secrets

router = APIRouter(prefix="/api/unified", tags=["unified"])

# One control maps to multiple frameworks
UNIFIED_CONTROLS = [
    {"id":"UC-001","name":"Multi-Factor Authentication","description":"All users must authenticate with MFA. Admins require hardware tokens.","frameworks":{"SOC2":"CC6.1","ISO27001":"A.8.5","RBI":"RBI-CSF-3.2","DPDP":"DPDP-1.1"},"status":"IMPLEMENTED","automated":True,"evidence_count":4,"owner":"IT","category":"Access Control"},
    {"id":"UC-002","name":"Data Encryption at Rest","description":"All sensitive data encrypted with AES-256. Keys managed via HSM.","frameworks":{"SOC2":"CC6.7","ISO27001":"A.8.24","RBI":"RBI-CSF-5.1","DPDP":"DPDP-4.2"},"status":"IMPLEMENTED","automated":True,"evidence_count":3,"owner":"Engineering","category":"Data Protection"},
    {"id":"UC-003","name":"Access Control Policy","description":"Role-based access control with least privilege principle.","frameworks":{"SOC2":"CC6.3","ISO27001":"A.5.15","RBI":"RBI-CSF-3.1","DPDP":"DPDP-1.2"},"status":"IMPLEMENTED","automated":False,"evidence_count":2,"owner":"CISO","category":"Access Control"},
    {"id":"UC-004","name":"Vulnerability Management","description":"Weekly scans, patch within 72hrs (critical) / 30 days (high).","frameworks":{"SOC2":"CC7.1","ISO27001":"A.8.8","RBI":"RBI-CSF-4.1","DPDP":None},"status":"IN_PROGRESS","automated":True,"evidence_count":2,"owner":"Security","category":"Vulnerability Management"},
    {"id":"UC-005","name":"Incident Response Plan","description":"Documented IRP with RBI 2-6 hour reporting and CERT-In 6 hour notification.","frameworks":{"SOC2":"CC7.4","ISO27001":"A.5.24","RBI":"RBI-CSF-6.1","DPDP":"DPDP-6.1"},"status":"IN_PROGRESS","automated":False,"evidence_count":1,"owner":"CISO","category":"Incident Management"},
    {"id":"UC-006","name":"Data Retention and Deletion","description":"Data retained per RBI 7-year mandate, deleted when DPDP purpose fulfilled.","frameworks":{"SOC2":"C1.2","ISO27001":"A.8.10","RBI":"RBI-CSF-5.2","DPDP":"DPDP-4.3"},"status":"NOT_STARTED","automated":False,"evidence_count":0,"owner":"Engineering","category":"Data Lifecycle"},
    {"id":"UC-007","name":"Third-Party Risk Assessment","description":"Annual vendor assessments, quarterly for critical vendors.","frameworks":{"SOC2":"CC9.2","ISO27001":"A.5.19","RBI":"RBI-ITG-2.1","DPDP":"DPDP-7.1"},"status":"IN_PROGRESS","automated":False,"evidence_count":2,"owner":"Procurement","category":"Third Party Risk"},
    {"id":"UC-008","name":"Business Continuity Plan","description":"BCP tested annually. RTO < 4 hours, RPO < 1 hour.","frameworks":{"SOC2":"A1.2","ISO27001":"A.5.29","RBI":"RBI-ITG-3.1","DPDP":None},"status":"IN_PROGRESS","automated":False,"evidence_count":1,"owner":"CTO","category":"Business Continuity"},
    {"id":"UC-009","name":"Audit Logging","description":"All system events logged. Logs retained 180 days in India (CERT-In).","frameworks":{"SOC2":"CC7.2","ISO27001":"A.8.15","RBI":"RBI-CSF-2.3","DPDP":None},"status":"IMPLEMENTED","automated":True,"evidence_count":3,"owner":"DevOps","category":"Audit & Logging"},
    {"id":"UC-010","name":"Consent Management","description":"User consent captured, stored, and withdrawal mechanism provided.","frameworks":{"SOC2":"P1.1","ISO27001":"A.5.34","RBI":None,"DPDP":"DPDP-1.1"},"status":"IN_PROGRESS","automated":False,"evidence_count":1,"owner":"Product","category":"Privacy"},
    {"id":"UC-011","name":"Penetration Testing","description":"Annual VAPT by CERT-In empanelled firm. Quarterly for internet-facing apps.","frameworks":{"SOC2":"CC7.1","ISO27001":"A.8.29","RBI":"RBI-CSF-4.3","DPDP":None},"status":"IN_PROGRESS","automated":False,"evidence_count":1,"owner":"Security","category":"Security Testing"},
    {"id":"UC-012","name":"Cryptographic Key Management","description":"Keys rotated annually. HSM used for critical keys. Key custodian assigned.","frameworks":{"SOC2":"CC6.7","ISO27001":"A.8.24","RBI":"RBI-CSF-5.1","DPDP":"DPDP-4.2"},"status":"IMPLEMENTED","automated":True,"evidence_count":2,"owner":"Engineering","category":"Cryptography"},
]

@router.get("/controls")
def get_unified_controls(tenant_id: str = Query(...), category: str = Query(None), framework: str = Query(None)):
    controls = UNIFIED_CONTROLS[:]
    if category: controls = [c for c in controls if c["category"]==category]
    if framework: controls = [c for c in controls if framework in c["frameworks"]]
    impl = len([c for c in UNIFIED_CONTROLS if c["status"]=="IMPLEMENTED"])
    total = len(UNIFIED_CONTROLS)
    return {"controls":controls,"total":len(controls),"summary":{"total":total,"implemented":impl,"score":int(impl/total*100)},"categories":list(set(c["category"] for c in UNIFIED_CONTROLS)),"frameworks":["SOC2","ISO27001","RBI","DPDP"]}

@router.get("/gap-analysis")
def get_gap_analysis(tenant_id: str = Query(...)):
    results = {}
    for fw in ["SOC2","ISO27001","RBI","DPDP"]:
        fw_controls = [c for c in UNIFIED_CONTROLS if fw in c["frameworks"] and c["frameworks"][fw]]
        impl = [c for c in fw_controls if c["status"]=="IMPLEMENTED"]
        results[fw] = {"total":len(fw_controls),"implemented":len(impl),"score":int(len(impl)/len(fw_controls)*100) if fw_controls else 0,"gaps":[{"id":c["id"],"name":c["name"],"status":c["status"]} for c in fw_controls if c["status"]!="IMPLEMENTED"]}
    return {"framework_scores":results,"overlap_savings":f"{len([c for c in UNIFIED_CONTROLS if len([f for f,v in c['frameworks'].items() if v])>=3])} controls satisfy 3+ frameworks simultaneously","generated_at":datetime.utcnow().isoformat()}

@router.get("/compliance-score")
def get_overall_score(tenant_id: str = Query(...)):
    scores = {}
    for fw in ["SOC2","ISO27001","RBI","DPDP"]:
        fw_controls = [c for c in UNIFIED_CONTROLS if fw in c["frameworks"] and c["frameworks"][fw]]
        impl = len([c for c in fw_controls if c["status"]=="IMPLEMENTED"])
        scores[fw] = int(impl/len(fw_controls)*100) if fw_controls else 0
    overall = int(sum(scores.values())/len(scores))
    return {"overall":overall,"frameworks":scores,"trend":"improving","last_updated":datetime.utcnow().isoformat()}

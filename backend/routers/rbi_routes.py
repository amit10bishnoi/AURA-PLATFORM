from fastapi import APIRouter, Query
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/rbi", tags=["rbi"])

RBI_CONTROLS = [
    # RBI Cyber Security Framework 2016
    {"id":"RBI-CSF-1.1","name":"Board approved Cyber Security Policy","category":"Governance","status":"IMPLEMENTED","evidence_count":2,"owner":"CISO","priority":"CRITICAL","framework":"RBI CSF 2016"},
    {"id":"RBI-CSF-1.2","name":"Cyber Crisis Management Plan (CCMP)","category":"Governance","status":"IN_PROGRESS","evidence_count":1,"owner":"CISO","priority":"CRITICAL","framework":"RBI CSF 2016"},
    {"id":"RBI-CSF-1.3","name":"Cyber Security Operations Centre (C-SOC)","category":"Governance","status":"IN_PROGRESS","evidence_count":1,"owner":"IT","priority":"HIGH","framework":"RBI CSF 2016"},
    {"id":"RBI-CSF-2.1","name":"Network Security Architecture documented","category":"Network","status":"IMPLEMENTED","evidence_count":3,"owner":"IT","priority":"HIGH","framework":"RBI CSF 2016"},
    {"id":"RBI-CSF-2.2","name":"DMZ and network segmentation","category":"Network","status":"IMPLEMENTED","evidence_count":2,"owner":"IT","priority":"HIGH","framework":"RBI CSF 2016"},
    {"id":"RBI-CSF-2.3","name":"24x7 network monitoring","category":"Network","status":"IN_PROGRESS","evidence_count":1,"owner":"Security","priority":"HIGH","framework":"RBI CSF 2016"},
    {"id":"RBI-CSF-3.1","name":"Privileged Access Management (PAM)","category":"Access Control","status":"IMPLEMENTED","evidence_count":3,"owner":"IT","priority":"CRITICAL","framework":"RBI CSF 2016"},
    {"id":"RBI-CSF-3.2","name":"Multi-factor authentication for critical systems","category":"Access Control","status":"IMPLEMENTED","evidence_count":2,"owner":"IT","priority":"CRITICAL","framework":"RBI CSF 2016"},
    {"id":"RBI-CSF-3.3","name":"Vendor and third-party access controls","category":"Access Control","status":"IN_PROGRESS","evidence_count":1,"owner":"Procurement","priority":"HIGH","framework":"RBI CSF 2016"},
    {"id":"RBI-CSF-4.1","name":"Security patch management SLA","category":"Vulnerability","status":"IN_PROGRESS","evidence_count":1,"owner":"IT","priority":"HIGH","framework":"RBI CSF 2016"},
    {"id":"RBI-CSF-4.2","name":"Vulnerability Assessment and Penetration Testing (VAPT)","category":"Vulnerability","status":"IMPLEMENTED","evidence_count":2,"owner":"Security","priority":"HIGH","framework":"RBI CSF 2016"},
    {"id":"RBI-CSF-4.3","name":"VAPT by CERT-In empanelled auditors","category":"Vulnerability","status":"IN_PROGRESS","evidence_count":1,"owner":"Security","priority":"HIGH","framework":"RBI CSF 2016"},
    {"id":"RBI-CSF-5.1","name":"Data encryption in transit and at rest","category":"Data Security","status":"IMPLEMENTED","evidence_count":3,"owner":"Engineering","priority":"CRITICAL","framework":"RBI CSF 2016"},
    {"id":"RBI-CSF-5.2","name":"Customer data localisation in India","category":"Data Security","status":"IMPLEMENTED","evidence_count":2,"owner":"CTO","priority":"CRITICAL","framework":"RBI CSF 2016"},
    {"id":"RBI-CSF-5.3","name":"Data masking in non-production environments","category":"Data Security","status":"IN_PROGRESS","evidence_count":1,"owner":"Engineering","priority":"HIGH","framework":"RBI CSF 2016"},
    {"id":"RBI-CSF-6.1","name":"Incident response and reporting to RBI within 2-6 hours","category":"Incident Response","status":"IN_PROGRESS","evidence_count":1,"owner":"CISO","priority":"CRITICAL","framework":"RBI CSF 2016"},
    {"id":"RBI-CSF-6.2","name":"Cyber Security incident classification and escalation","category":"Incident Response","status":"IMPLEMENTED","evidence_count":2,"owner":"CISO","priority":"HIGH","framework":"RBI CSF 2016"},
    {"id":"RBI-CSF-6.3","name":"Business continuity and disaster recovery","category":"Incident Response","status":"IN_PROGRESS","evidence_count":1,"owner":"CTO","priority":"HIGH","framework":"RBI CSF 2016"},
    # RBI IT Governance
    {"id":"RBI-ITG-1.1","name":"IT Strategy Committee at Board level","category":"IT Governance","status":"IMPLEMENTED","evidence_count":1,"owner":"Board","priority":"HIGH","framework":"RBI IT Governance"},
    {"id":"RBI-ITG-1.2","name":"IT Steering Committee","category":"IT Governance","status":"IMPLEMENTED","evidence_count":1,"owner":"CTO","priority":"HIGH","framework":"RBI IT Governance"},
    {"id":"RBI-ITG-2.1","name":"Outsourcing risk management policy","category":"Outsourcing","status":"IN_PROGRESS","evidence_count":1,"owner":"Legal","priority":"HIGH","framework":"RBI IT Governance"},
    {"id":"RBI-ITG-2.2","name":"Cloud service provider assessment","category":"Outsourcing","status":"IN_PROGRESS","evidence_count":1,"owner":"IT","priority":"HIGH","framework":"RBI IT Governance"},
    {"id":"RBI-ITG-3.1","name":"Business Continuity Plan tested annually","category":"BCP","status":"NOT_STARTED","evidence_count":0,"owner":"CTO","priority":"HIGH","framework":"RBI IT Governance"},
    {"id":"RBI-ITG-3.2","name":"Recovery Time Objective (RTO) < 4 hours","category":"BCP","status":"IN_PROGRESS","evidence_count":1,"owner":"IT","priority":"HIGH","framework":"RBI IT Governance"},
    # Digital Lending Guidelines
    {"id":"RBI-DL-1.1","name":"Loan Service Provider (LSP) due diligence","category":"Digital Lending","status":"NOT_STARTED","evidence_count":0,"owner":"Legal","priority":"HIGH","framework":"RBI Digital Lending"},
    {"id":"RBI-DL-1.2","name":"Customer data usage consent mechanism","category":"Digital Lending","status":"IN_PROGRESS","evidence_count":1,"owner":"Product","priority":"CRITICAL","framework":"RBI Digital Lending"},
    {"id":"RBI-DL-1.3","name":"Cooling-off period implementation","category":"Digital Lending","status":"IMPLEMENTED","evidence_count":1,"owner":"Product","priority":"HIGH","framework":"RBI Digital Lending"},
]

CERT_IN_REQUIREMENTS = [
    {"id":"CERT-1","name":"Mandatory incident reporting to CERT-In within 6 hours","status":"IN_PROGRESS","deadline":"Within 6 hours of detection","owner":"CISO"},
    {"id":"CERT-2","name":"Synchronisation of ICT system clocks to NTP","status":"IMPLEMENTED","deadline":"Continuous","owner":"IT"},
    {"id":"CERT-3","name":"Maintain logs for 180 days within India jurisdiction","status":"IMPLEMENTED","deadline":"Continuous","owner":"IT"},
    {"id":"CERT-4","name":"Designated Point of Contact (PoC) for CERT-In","status":"IMPLEMENTED","deadline":"Ongoing","owner":"CISO"},
    {"id":"CERT-5","name":"Annual cyber security audit by CERT-In empanelled firm","status":"NOT_STARTED","deadline":"Annual","owner":"CISO"},
]

@router.get("/controls")
def get_rbi_controls(tenant_id: str = Query(...), category: str = Query(None), framework: str = Query(None)):
    controls = RBI_CONTROLS[:]
    if category: controls = [c for c in controls if c["category"]==category]
    if framework: controls = [c for c in controls if c["framework"]==framework]
    impl = len([c for c in RBI_CONTROLS if c["status"]=="IMPLEMENTED"])
    total = len(RBI_CONTROLS)
    categories = list(set(c["category"] for c in RBI_CONTROLS))
    frameworks = list(set(c["framework"] for c in RBI_CONTROLS))
    return {"controls":controls,"total":len(controls),"summary":{"total":total,"implemented":impl,"in_progress":len([c for c in RBI_CONTROLS if c["status"]=="IN_PROGRESS"]),"not_started":len([c for c in RBI_CONTROLS if c["status"]=="NOT_STARTED"]),"score":int(impl/total*100)},"categories":categories,"frameworks":frameworks}

@router.get("/cert-in")
def get_cert_in(tenant_id: str = Query(...)):
    impl = len([r for r in CERT_IN_REQUIREMENTS if r["status"]=="IMPLEMENTED"])
    return {"requirements":CERT_IN_REQUIREMENTS,"total":len(CERT_IN_REQUIREMENTS),"implemented":impl,"score":int(impl/len(CERT_IN_REQUIREMENTS)*100)}

@router.get("/readiness")
def get_rbi_readiness(tenant_id: str = Query(...)):
    impl = len([c for c in RBI_CONTROLS if c["status"]=="IMPLEMENTED"])
    total = len(RBI_CONTROLS)
    score = int(impl/total*100)
    critical_gaps = [{"id":c["id"],"name":c["name"],"category":c["category"]} for c in RBI_CONTROLS if c["priority"]=="CRITICAL" and c["status"]!="IMPLEMENTED"]
    return {"score":score,"label":"Ready" if score>=80 else "On Track" if score>=60 else "Needs Work","color":"#16a34a" if score>=80 else "#d97706" if score>=60 else "#e11d48","implemented":impl,"total":total,"critical_gaps":critical_gaps,"cert_in_score":int(len([r for r in CERT_IN_REQUIREMENTS if r["status"]=="IMPLEMENTED"])/len(CERT_IN_REQUIREMENTS)*100)}

@router.get("/incident-reporting")
def get_incident_reporting(tenant_id: str = Query(...)):
    return {"requirements":[{"event":"Cyber attack on banking/payment systems","report_to":"RBI + CERT-In","timeline":"2-6 hours","format":"CISO email + online portal"},{"event":"Data breach involving customer data","report_to":"RBI + CERT-In + DPDP Board","timeline":"6 hours","format":"Structured incident report"},{"event":"Ransomware attack","report_to":"RBI + CERT-In","timeline":"6 hours","format":"Incident report"},{"event":"ATM/POS fraud","report_to":"RBI","timeline":"24 hours","format":"FIR + bank report"},{"event":"Mobile banking fraud","report_to":"RBI","timeline":"24 hours","format":"Incident report"}],"contacts":{"rbi_email":"chiefgm@rbi.org.in","cert_in":"incident@cert-in.org.in","cert_in_phone":"+91-1800-11-4949"}}

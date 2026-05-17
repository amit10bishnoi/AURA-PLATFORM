from fastapi import APIRouter, Query
from datetime import datetime, timedelta
import secrets

router = APIRouter(prefix="/api/dpdp", tags=["dpdp"])

DPDP_OBLIGATIONS = [
    {"id":"DPDP-1.1","obligation":"Obtain free, specific, informed and unambiguous consent","section":"Section 6","status":"IN_PROGRESS","evidence_count":1,"owner":"Product","priority":"CRITICAL","penalty":"Up to Rs 250 Crore"},
    {"id":"DPDP-1.2","obligation":"Consent must be for specified purpose only","section":"Section 6","status":"IN_PROGRESS","evidence_count":1,"owner":"Legal","priority":"CRITICAL","penalty":"Up to Rs 250 Crore"},
    {"id":"DPDP-1.3","obligation":"Consent withdrawal mechanism must be easy as giving consent","section":"Section 6","status":"NOT_STARTED","evidence_count":0,"owner":"Product","priority":"CRITICAL","penalty":"Up to Rs 250 Crore"},
    {"id":"DPDP-2.1","obligation":"Notice to data principals in clear plain language","section":"Section 5","status":"IN_PROGRESS","evidence_count":1,"owner":"Legal","priority":"HIGH","penalty":"Up to Rs 200 Crore"},
    {"id":"DPDP-2.2","obligation":"Notice available in all 22 scheduled languages","section":"Section 5","status":"NOT_STARTED","evidence_count":0,"owner":"Product","priority":"HIGH","penalty":"Up to Rs 200 Crore"},
    {"id":"DPDP-3.1","obligation":"Appoint Data Protection Officer (DPO) if significant data fiduciary","section":"Section 10","status":"NOT_STARTED","evidence_count":0,"owner":"Legal","priority":"HIGH","penalty":"Up to Rs 150 Crore"},
    {"id":"DPDP-3.2","obligation":"Data Protection Impact Assessment (DPIA) for significant fiduciaries","section":"Section 10","status":"NOT_STARTED","evidence_count":0,"owner":"CISO","priority":"HIGH","penalty":"Up to Rs 150 Crore"},
    {"id":"DPDP-4.1","obligation":"Data accuracy and completeness","section":"Section 8","status":"IN_PROGRESS","evidence_count":1,"owner":"Engineering","priority":"MEDIUM","penalty":"Up to Rs 50 Crore"},
    {"id":"DPDP-4.2","obligation":"Data minimisation — collect only what is necessary","section":"Section 8","status":"IN_PROGRESS","evidence_count":1,"owner":"Engineering","priority":"HIGH","penalty":"Up to Rs 50 Crore"},
    {"id":"DPDP-4.3","obligation":"Erase personal data when purpose fulfilled or consent withdrawn","section":"Section 8","status":"NOT_STARTED","evidence_count":0,"owner":"Engineering","priority":"HIGH","penalty":"Up to Rs 50 Crore"},
    {"id":"DPDP-5.1","obligation":"Right of access — provide data summary within 48 hours","section":"Section 11","status":"NOT_STARTED","evidence_count":0,"owner":"Product","priority":"HIGH","penalty":"Up to Rs 50 Crore"},
    {"id":"DPDP-5.2","obligation":"Right to correction and erasure of personal data","section":"Section 12","status":"NOT_STARTED","evidence_count":0,"owner":"Product","priority":"HIGH","penalty":"Up to Rs 50 Crore"},
    {"id":"DPDP-5.3","obligation":"Right to grievance redressal within 48 hours","section":"Section 13","status":"NOT_STARTED","evidence_count":0,"owner":"Support","priority":"HIGH","penalty":"Up to Rs 50 Crore"},
    {"id":"DPDP-5.4","obligation":"Right to nominate — allow nomination of another person","section":"Section 14","status":"NOT_STARTED","evidence_count":0,"owner":"Product","priority":"MEDIUM","penalty":"Up to Rs 50 Crore"},
    {"id":"DPDP-6.1","obligation":"Personal data breach notification to DPBI","section":"Section 8","status":"IN_PROGRESS","evidence_count":1,"owner":"CISO","priority":"CRITICAL","penalty":"Up to Rs 250 Crore"},
    {"id":"DPDP-6.2","obligation":"Breach notification to affected data principals","section":"Section 8","status":"NOT_STARTED","evidence_count":0,"owner":"CISO","priority":"CRITICAL","penalty":"Up to Rs 250 Crore"},
    {"id":"DPDP-7.1","obligation":"Cross-border data transfer restrictions compliance","section":"Section 16","status":"IN_PROGRESS","evidence_count":1,"owner":"Legal","priority":"HIGH","penalty":"Up to Rs 150 Crore"},
    {"id":"DPDP-7.2","obligation":"Children's data — parental consent for under-18","section":"Section 9","status":"NOT_STARTED","evidence_count":0,"owner":"Product","priority":"CRITICAL","penalty":"Up to Rs 200 Crore"},
    {"id":"DPDP-8.1","obligation":"Register as Data Fiduciary with DPBI if required","section":"Section 3","status":"NOT_STARTED","evidence_count":0,"owner":"Legal","priority":"HIGH","penalty":"Up to Rs 150 Crore"},
    {"id":"DPDP-8.2","obligation":"Publish privacy policy on website/app","section":"Section 5","status":"IMPLEMENTED","evidence_count":2,"owner":"Legal","priority":"HIGH","penalty":"Up to Rs 50 Crore"},
]

DATA_CATEGORIES = [
    {"id":"DC-1","category":"Financial Data","examples":"Bank account, credit card, transaction history","sensitivity":"HIGH","volume_estimate":"50K records","retention_policy":"7 years (RBI mandate)","legal_basis":"Contract","status":"MAPPED"},
    {"id":"DC-2","category":"Identity Data","examples":"Aadhaar, PAN, passport, driving licence","sensitivity":"HIGH","volume_estimate":"45K records","retention_policy":"5 years post relationship","legal_basis":"Legal obligation","status":"MAPPED"},
    {"id":"DC-3","category":"Contact Information","examples":"Name, email, phone, address","sensitivity":"MEDIUM","volume_estimate":"80K records","retention_policy":"Duration of relationship + 2 years","legal_basis":"Consent","status":"MAPPED"},
    {"id":"DC-4","category":"Behavioral Data","examples":"App usage, transaction patterns","sensitivity":"MEDIUM","volume_estimate":"200K records","retention_policy":"2 years","legal_basis":"Legitimate interest","status":"REVIEW_NEEDED"},
    {"id":"DC-5","category":"Device Data","examples":"IP address, device ID, location","sensitivity":"MEDIUM","volume_estimate":"150K records","retention_policy":"1 year","legal_basis":"Consent","status":"REVIEW_NEEDED"},
    {"id":"DC-6","category":"Sensitive Personal Data","examples":"Health data, biometrics, caste, religion","sensitivity":"CRITICAL","volume_estimate":"2K records","retention_policy":"Minimum necessary","legal_basis":"Explicit consent","status":"NEEDS_ATTENTION"},
]

CONSENT_RECORDS = [
    {"id":"CR-1","purpose":"Account creation and KYC","consent_date":(datetime.utcnow()-timedelta(days=180)).isoformat(),"status":"ACTIVE","data_principals":45230,"withdrawal_requests":12,"expiry":"Indefinite"},
    {"id":"CR-2","purpose":"Marketing communications","consent_date":(datetime.utcnow()-timedelta(days=90)).isoformat(),"status":"ACTIVE","data_principals":28400,"withdrawal_requests":340,"expiry":(datetime.utcnow()+timedelta(days=275)).isoformat()},
    {"id":"CR-3","purpose":"Credit assessment and lending","consent_date":(datetime.utcnow()-timedelta(days=120)).isoformat(),"status":"ACTIVE","data_principals":12800,"withdrawal_requests":5,"expiry":"Loan tenure"},
    {"id":"CR-4","purpose":"Third-party data sharing for offers","consent_date":(datetime.utcnow()-timedelta(days=60)).isoformat(),"status":"REVIEW_NEEDED","data_principals":8900,"withdrawal_requests":1240,"expiry":(datetime.utcnow()+timedelta(days=305)).isoformat()},
]

DSR_REQUESTS = [
    {"id":"DSR-001","type":"Access Request","status":"PENDING","raised_date":(datetime.utcnow()-timedelta(hours=36)).isoformat(),"deadline":(datetime.utcnow()+timedelta(hours=12)).isoformat(),"priority":"HIGH"},
    {"id":"DSR-002","type":"Erasure Request","status":"IN_PROGRESS","raised_date":(datetime.utcnow()-timedelta(days=1)).isoformat(),"deadline":(datetime.utcnow()+timedelta(hours=12)).isoformat(),"priority":"HIGH"},
    {"id":"DSR-003","type":"Correction Request","status":"COMPLETED","raised_date":(datetime.utcnow()-timedelta(days=3)).isoformat(),"deadline":(datetime.utcnow()-timedelta(days=1)).isoformat(),"priority":"MEDIUM"},
    {"id":"DSR-004","type":"Access Request","status":"PENDING","raised_date":(datetime.utcnow()-timedelta(hours=10)).isoformat(),"deadline":(datetime.utcnow()+timedelta(hours=38)).isoformat(),"priority":"HIGH"},
]

@router.get("/obligations")
def get_obligations(tenant_id: str = Query(...), section: str = Query(None)):
    obs = DPDP_OBLIGATIONS[:]
    if section: obs = [o for o in obs if o["section"]==section]
    impl = len([o for o in DPDP_OBLIGATIONS if o["status"]=="IMPLEMENTED"])
    total = len(DPDP_OBLIGATIONS)
    return {"obligations":obs,"total":len(obs),"summary":{"total":total,"implemented":impl,"in_progress":len([o for o in DPDP_OBLIGATIONS if o["status"]=="IN_PROGRESS"]),"not_started":len([o for o in DPDP_OBLIGATIONS if o["status"]=="NOT_STARTED"]),"score":int(impl/total*100),"compliance_deadline":"May 2027"}}

@router.get("/data-categories")
def get_data_categories(tenant_id: str = Query(...)):
    return {"categories":DATA_CATEGORIES,"total":len(DATA_CATEGORIES),"needs_attention":len([d for d in DATA_CATEGORIES if d["status"]=="NEEDS_ATTENTION"])}

@router.get("/consent")
def get_consent(tenant_id: str = Query(...)):
    total_principals = sum(c["data_principals"] for c in CONSENT_RECORDS)
    total_withdrawals = sum(c["withdrawal_requests"] for c in CONSENT_RECORDS)
    return {"records":CONSENT_RECORDS,"total_records":len(CONSENT_RECORDS),"total_data_principals":total_principals,"total_withdrawals":total_withdrawals,"withdrawal_rate":round(total_withdrawals/total_principals*100,2)}

@router.get("/dsr")
def get_dsr(tenant_id: str = Query(...)):
    pending = len([r for r in DSR_REQUESTS if r["status"]=="PENDING"])
    overdue = len([r for r in DSR_REQUESTS if r["status"]=="PENDING" and r["deadline"]<datetime.utcnow().isoformat()])
    return {"requests":DSR_REQUESTS,"total":len(DSR_REQUESTS),"pending":pending,"overdue":overdue,"completed":len([r for r in DSR_REQUESTS if r["status"]=="COMPLETED"]),"sla_hours":48}

@router.post("/dsr")
def create_dsr(body: dict, tenant_id: str = Query(...)):
    req = {"id":f"DSR-{secrets.token_hex(4).upper()[:6]}","type":body.get("type","Access Request"),"status":"PENDING","raised_date":datetime.utcnow().isoformat(),"deadline":(datetime.utcnow()+timedelta(hours=48)).isoformat(),"priority":"HIGH"}
    DSR_REQUESTS.append(req)
    return {"message":"DSR created","request":req}

@router.get("/readiness")
def get_dpdp_readiness(tenant_id: str = Query(...)):
    impl = len([o for o in DPDP_OBLIGATIONS if o["status"]=="IMPLEMENTED"])
    total = len(DPDP_OBLIGATIONS)
    score = int(impl/total*100)
    critical_gaps = [{"id":o["id"],"obligation":o["obligation"],"penalty":o["penalty"]} for o in DPDP_OBLIGATIONS if o["priority"]=="CRITICAL" and o["status"]!="IMPLEMENTED"]
    return {"score":score,"compliance_deadline":"May 2027","weeks_to_deadline":104,"label":"On Track" if score>=50 else "Needs Urgent Attention","color":"#d97706" if score>=50 else "#e11d48","implemented":impl,"total":total,"critical_gaps":critical_gaps,"max_penalty":"Rs 250 Crore per violation"}

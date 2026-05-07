from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
import json, random, asyncio

router = APIRouter(prefix="/api/auto-evidence", tags=["auto-evidence"])

INTEGRATION_PULLS = {
    "aws": [
        {"name":"AWS IAM Password Policy","control":"CC6.1","framework":"SOC2","category":"Config","description":"IAM password policy enforces complexity and rotation","status":"PASS","file_type":"json","size_kb":12},
        {"name":"AWS CloudTrail Enabled","control":"CC7.2","framework":"SOC2","category":"Config","description":"CloudTrail logging enabled across all regions","status":"PASS","file_type":"json","size_kb":8},
        {"name":"AWS S3 Bucket Encryption","control":"CC6.7","framework":"SOC2","category":"Config","description":"All S3 buckets have server-side encryption enabled","status":"PASS","file_type":"json","size_kb":15},
        {"name":"AWS Security Groups Audit","control":"CC6.6","framework":"SOC2","category":"Config","description":"Security group rules reviewed","status":"FAIL","file_type":"json","size_kb":22,"remediation":"Remove inbound 0.0.0.0/0 rules from sg-0abc123"},
        {"name":"AWS GuardDuty Status","control":"CC7.1","framework":"SOC2","category":"Report","description":"GuardDuty threat detection enabled in all regions","status":"PASS","file_type":"json","size_kb":6},
    ],
    "okta": [
        {"name":"Okta MFA Enforcement Policy","control":"CC6.1","framework":"SOC2","category":"Config","description":"MFA enforced for all users via Okta policy","status":"PASS","file_type":"json","size_kb":4},
        {"name":"Okta User Provisioning Report","control":"CC6.2","framework":"SOC2","category":"Report","description":"All active users provisioned through Okta","status":"PASS","file_type":"json","size_kb":18},
        {"name":"Okta Failed Login Attempts","control":"CC7.2","framework":"SOC2","category":"Report","description":"Failed login attempt report for last 30 days","status":"WARNING","file_type":"json","size_kb":9,"remediation":"Review failed login IPs and consider IP allowlisting"},
        {"name":"Okta Admin Access Review","control":"CC6.3","framework":"SOC2","category":"Report","description":"Admin role assignments reviewed and approved","status":"PASS","file_type":"json","size_kb":7},
    ],
    "github": [
        {"name":"GitHub Branch Protection Rules","control":"CC8.1","framework":"SOC2","category":"Config","description":"Main branch protection enabled — requires PR reviews","status":"PASS","file_type":"json","size_kb":5},
        {"name":"GitHub Secret Scanning","control":"CC6.8","framework":"SOC2","category":"Config","description":"Secret scanning enabled on all repositories","status":"PASS","file_type":"json","size_kb":3},
        {"name":"GitHub Dependency Alerts","control":"CC7.1","framework":"SOC2","category":"Report","description":"Dependabot alerts — 3 high severity open","status":"FAIL","file_type":"json","size_kb":11,"remediation":"Run npm audit fix or update affected packages"},
        {"name":"GitHub Code Review Compliance","control":"CC8.1","framework":"SOC2","category":"Report","description":"100% of commits in last 30 days had PR review","status":"PASS","file_type":"json","size_kb":14},
    ],
    "jira": [
        {"name":"Jira Vulnerability Remediation Tracking","control":"CC7.1","framework":"SOC2","category":"Report","description":"Open security tickets by severity and age","status":"WARNING","file_type":"json","size_kb":16,"remediation":"Escalate SEC-234 and SEC-198 to engineering lead"},
        {"name":"Jira Change Management Records","control":"CC8.1","framework":"SOC2","category":"Report","description":"Change tickets with approval records last 90 days","status":"PASS","file_type":"json","size_kb":28},
    ],
    "crowdstrike": [
        {"name":"CrowdStrike Agent Coverage","control":"CC6.8","framework":"SOC2","category":"Report","description":"EDR agent installed on 98% of endpoints","status":"PASS","file_type":"json","size_kb":9},
        {"name":"CrowdStrike Threat Report","control":"CC7.1","framework":"SOC2","category":"Report","description":"Monthly threat detection and response summary","status":"PASS","file_type":"json","size_kb":21},
    ],
    "datadog": [
        {"name":"Datadog Uptime Monitoring","control":"A1.1","framework":"SOC2","category":"Report","description":"System availability — 99.97% uptime last 30 days","status":"PASS","file_type":"json","size_kb":7},
        {"name":"Datadog Anomaly Alerts","control":"CC7.2","framework":"SOC2","category":"Report","description":"Anomaly detection alerts configured for all services","status":"PASS","file_type":"json","size_kb":5},
    ],
}

PULL_HISTORY = []

@router.get("/integrations")
def get_connected_integrations(tenant_id: str = Query(...)):
    integrations = []
    for key, pulls in INTEGRATION_PULLS.items():
        last_pull = next((p for p in reversed(PULL_HISTORY) if p.get("integration") == key), None)
        integrations.append({"id":key,"name":{"aws":"AWS","okta":"Okta","github":"GitHub","jira":"Jira","crowdstrike":"CrowdStrike","datadog":"Datadog"}.get(key,key),"connected":True,"evidence_count":len(pulls),"last_pull":last_pull.get("pulled_at") if last_pull else (datetime.utcnow()-timedelta(days=random.randint(1,7))).isoformat(),"status":"active","pass_count":len([p for p in pulls if p["status"]=="PASS"]),"fail_count":len([p for p in pulls if p["status"]=="FAIL"]),"warning_count":len([p for p in pulls if p["status"]=="WARNING"])})
    return {"integrations": integrations}

@router.post("/pull/{integration_id}")
async def pull_evidence(integration_id: str, tenant_id: str = Query(...)):
    if integration_id not in INTEGRATION_PULLS:
        raise HTTPException(404, f"Integration {integration_id} not found")
    await asyncio.sleep(0.5)
    pulls = INTEGRATION_PULLS[integration_id]
    now = datetime.utcnow()
    result = [{**p,"id":random.randint(1000,9999),"integration":integration_id,"tenant_id":tenant_id,"pulled_at":now.isoformat(),"expires_at":(now+timedelta(days=90)).isoformat(),"auto_collected":True} for p in pulls]
    PULL_HISTORY.append({"integration":integration_id,"pulled_at":now.isoformat(),"count":len(pulls)})
    return {"message":f"Pulled {len(result)} items from {integration_id}","integration":integration_id,"pulled_at":now.isoformat(),"evidence":result,"summary":{"total":len(result),"pass":len([r for r in result if r["status"]=="PASS"]),"fail":len([r for r in result if r["status"]=="FAIL"]),"warning":len([r for r in result if r["status"]=="WARNING"])}}

@router.post("/pull-all")
async def pull_all_evidence(tenant_id: str = Query(...)):
    all_evidence = []
    now = datetime.utcnow()
    for integration_id, pulls in INTEGRATION_PULLS.items():
        for p in pulls:
            all_evidence.append({**p,"id":random.randint(1000,9999),"integration":integration_id,"tenant_id":tenant_id,"pulled_at":now.isoformat(),"expires_at":(now+timedelta(days=90)).isoformat(),"auto_collected":True})
        PULL_HISTORY.append({"integration":integration_id,"pulled_at":now.isoformat(),"count":len(pulls)})
    return {"message":f"Pulled {len(all_evidence)} items from {len(INTEGRATION_PULLS)} integrations","pulled_at":now.isoformat(),"evidence":all_evidence,"summary":{"total":len(all_evidence),"pass":len([e for e in all_evidence if e["status"]=="PASS"]),"fail":len([e for e in all_evidence if e["status"]=="FAIL"]),"warning":len([e for e in all_evidence if e["status"]=="WARNING"])}}

@router.get("/evidence")
def get_auto_evidence(tenant_id:str=Query(...),integration:Optional[str]=Query(None),status:Optional[str]=Query(None)):
    all_ev=[]
    now=datetime.utcnow()
    for int_id,pulls in INTEGRATION_PULLS.items():
        if integration and int_id!=integration: continue
        for i,p in enumerate(pulls):
            if status and p["status"]!=status: continue
            all_ev.append({**p,"id":i+1,"integration":int_id,"tenant_id":tenant_id,"pulled_at":(now-timedelta(hours=random.randint(1,48))).isoformat(),"expires_at":(now+timedelta(days=90)).isoformat(),"auto_collected":True})
    return {"evidence":all_ev,"total":len(all_ev)}

from fastapi import APIRouter, Query
from datetime import datetime, timedelta
import random

router = APIRouter(prefix="/api/monitoring", tags=["monitoring"])

DEMO_CHECKS = [
    {"id":1,"name":"MFA Enforced — All Users","category":"Access Control","framework":"SOC2","control":"CC6.1","integration":"okta","status":"PASS","last_checked":(datetime.utcnow()-timedelta(minutes=5)).isoformat(),"frequency":"hourly","details":"47/47 users have MFA enabled","trend":"stable"},
    {"id":2,"name":"Admin Access Review","category":"Access Control","framework":"SOC2","control":"CC6.3","integration":"okta","status":"PASS","last_checked":(datetime.utcnow()-timedelta(minutes=5)).isoformat(),"frequency":"daily","details":"3 admin users — all reviewed in last 30 days","trend":"stable"},
    {"id":3,"name":"S3 Bucket Public Access","category":"Cloud Security","framework":"SOC2","control":"CC6.6","integration":"aws","status":"PASS","last_checked":(datetime.utcnow()-timedelta(minutes=8)).isoformat(),"frequency":"hourly","details":"0 of 12 buckets have public access enabled","trend":"stable"},
    {"id":4,"name":"Security Groups — Open Ports","category":"Cloud Security","framework":"SOC2","control":"CC6.6","integration":"aws","status":"FAIL","last_checked":(datetime.utcnow()-timedelta(minutes=8)).isoformat(),"frequency":"hourly","details":"2 security groups allow 0.0.0.0/0 on port 22","trend":"failing","remediation":"Remove inbound 0.0.0.0/0 rules from sg-0abc123 and sg-0def456"},
    {"id":5,"name":"CloudTrail Logging","category":"Audit Logging","framework":"SOC2","control":"CC7.2","integration":"aws","status":"PASS","last_checked":(datetime.utcnow()-timedelta(minutes=8)).isoformat(),"frequency":"daily","details":"CloudTrail enabled in all 3 active regions","trend":"stable"},
    {"id":6,"name":"Dependency Vulnerabilities","category":"Vulnerability Management","framework":"SOC2","control":"CC7.1","integration":"github","status":"FAIL","last_checked":(datetime.utcnow()-timedelta(minutes=12)).isoformat(),"frequency":"daily","details":"3 HIGH severity vulnerabilities in dependencies","trend":"degrading","remediation":"Run npm audit fix or update affected packages"},
    {"id":7,"name":"Branch Protection Rules","category":"Change Management","framework":"SOC2","control":"CC8.1","integration":"github","status":"PASS","last_checked":(datetime.utcnow()-timedelta(minutes=12)).isoformat(),"frequency":"daily","details":"Main branch protection enabled — requires 2 reviewers","trend":"stable"},
    {"id":8,"name":"Failed Login Attempts","category":"Threat Detection","framework":"SOC2","control":"CC7.2","integration":"okta","status":"WARNING","last_checked":(datetime.utcnow()-timedelta(minutes=5)).isoformat(),"frequency":"hourly","details":"47 failed logins in last 24h — above threshold of 20","trend":"degrading","remediation":"Review failed login IPs and consider IP allowlisting"},
    {"id":9,"name":"Endpoint EDR Coverage","category":"Endpoint Security","framework":"SOC2","control":"CC6.8","integration":"crowdstrike","status":"PASS","last_checked":(datetime.utcnow()-timedelta(minutes=15)).isoformat(),"frequency":"daily","details":"EDR agent on 98% of endpoints (49/50)","trend":"stable"},
    {"id":10,"name":"System Uptime","category":"Availability","framework":"SOC2","control":"A1.1","integration":"datadog","status":"PASS","last_checked":(datetime.utcnow()-timedelta(minutes=2)).isoformat(),"frequency":"5min","details":"99.97% uptime last 30 days — SLA target 99.9%","trend":"stable"},
    {"id":11,"name":"Database Encryption","category":"Data Security","framework":"HIPAA","control":"164.312","integration":"aws","status":"PASS","last_checked":(datetime.utcnow()-timedelta(minutes=8)).isoformat(),"frequency":"daily","details":"All RDS instances have encryption at rest enabled","trend":"stable"},
    {"id":12,"name":"Vulnerability Remediation SLA","category":"Vulnerability Management","framework":"SOC2","control":"CC7.1","integration":"jira","status":"WARNING","last_checked":(datetime.utcnow()-timedelta(minutes=20)).isoformat(),"frequency":"daily","details":"2 HIGH severity vulnerabilities open for >30 days","trend":"degrading","remediation":"Escalate JIRA tickets SEC-234 and SEC-198 to engineering lead"},
    {"id":13,"name":"Password Policy Compliance","category":"Access Control","framework":"PCI_DSS","control":"Req 8","integration":"okta","status":"PASS","last_checked":(datetime.utcnow()-timedelta(minutes=5)).isoformat(),"frequency":"daily","details":"Password policy enforces 14+ chars, complexity, 90-day rotation","trend":"stable"},
    {"id":14,"name":"Logging & Monitoring Alerts","category":"Audit Logging","framework":"NIST_CSF","control":"DE.CM-1","integration":"datadog","status":"PASS","last_checked":(datetime.utcnow()-timedelta(minutes=2)).isoformat(),"frequency":"5min","details":"42 active monitors — all configured with PagerDuty alerts","trend":"stable"},
    {"id":15,"name":"Data Loss Prevention","category":"Data Security","framework":"GDPR","control":"Art.32","integration":"aws","status":"WARNING","last_checked":(datetime.utcnow()-timedelta(minutes=8)).isoformat(),"frequency":"daily","details":"DLP policy missing on 2 S3 buckets with PII classification","trend":"degrading","remediation":"Apply DLP policy to buckets: user-data-prod, analytics-raw"},
]

DEMO_ALERTS = [
    {"id":1,"check_id":4,"title":"Open SSH Port Detected","severity":"HIGH","message":"Security group sg-0abc123 allows SSH (port 22) from 0.0.0.0/0","status":"OPEN","created_at":(datetime.utcnow()-timedelta(hours=2)).isoformat(),"integration":"aws"},
    {"id":2,"check_id":6,"title":"Critical Vulnerability Unpatched","severity":"HIGH","message":"lodash@4.17.15 has a critical prototype pollution vulnerability","status":"OPEN","created_at":(datetime.utcnow()-timedelta(hours=6)).isoformat(),"integration":"github"},
    {"id":3,"check_id":8,"title":"Brute Force Attempt Detected","severity":"MEDIUM","message":"47 failed login attempts from IP 192.168.1.254 in last 24 hours","status":"INVESTIGATING","created_at":(datetime.utcnow()-timedelta(hours=8)).isoformat(),"integration":"okta"},
    {"id":4,"check_id":12,"title":"SLA Breach — Vulnerability Overdue","severity":"MEDIUM","message":"SEC-234 HIGH vulnerability unresolved for 32 days (SLA: 30 days)","status":"OPEN","created_at":(datetime.utcnow()-timedelta(days=2)).isoformat(),"integration":"jira"},
    {"id":5,"check_id":15,"title":"DLP Gap Identified","severity":"MEDIUM","message":"2 S3 buckets with PII data missing DLP policy","status":"OPEN","created_at":(datetime.utcnow()-timedelta(days=1)).isoformat(),"integration":"aws"},
]

@router.get("/checks")
def get_checks(tenant_id:str=Query(...),status:str=Query(None),integration:str=Query(None),framework:str=Query(None),category:str=Query(None)):
    checks=DEMO_CHECKS[:]
    if status: checks=[c for c in checks if c["status"]==status]
    if integration: checks=[c for c in checks if c["integration"]==integration]
    if framework: checks=[c for c in checks if c["framework"]==framework]
    if category: checks=[c for c in checks if c["category"]==category]
    return {"checks":checks,"total":len(checks),"summary":{"pass":len([c for c in checks if c["status"]=="PASS"]),"fail":len([c for c in checks if c["status"]=="FAIL"]),"warning":len([c for c in checks if c["status"]=="WARNING"]),"last_run":datetime.utcnow().isoformat()}}

@router.post("/checks/run")
def run_checks(tenant_id:str=Query(...)):
    now=datetime.utcnow()
    for check in DEMO_CHECKS:
        check["last_checked"]=now.isoformat()
    return {"message":f"Running {len(DEMO_CHECKS)} checks","started_at":now.isoformat(),"estimated_completion":(now+timedelta(seconds=30)).isoformat()}

@router.get("/alerts")
def get_alerts(tenant_id:str=Query(...),status:str=Query(None)):
    alerts=DEMO_ALERTS[:]
    if status: alerts=[a for a in alerts if a["status"]==status]
    return {"alerts":alerts,"total":len(alerts),"open":len([a for a in alerts if a["status"]=="OPEN"])}

@router.patch("/alerts/{alert_id}")
def update_alert(alert_id:int,body:dict):
    for alert in DEMO_ALERTS:
        if alert["id"]==alert_id:
            if "status" in body: alert["status"]=body["status"]
    return {"message":"Alert updated"}

@router.get("/timeline")
def get_timeline(tenant_id:str=Query(...)):
    now=datetime.utcnow()
    timeline=[]
    for h in range(24,0,-1):
        t=now-timedelta(hours=h)
        p=random.randint(11,15);f=random.randint(0,3);w=random.randint(0,3)
        timeline.append({"time":t.strftime("%H:%M"),"pass":p,"fail":f,"warning":w,"total":p+f+w})
    return {"timeline":timeline}

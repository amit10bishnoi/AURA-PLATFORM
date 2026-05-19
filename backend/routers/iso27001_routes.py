"""
iso27001_routes.py — ISO 27001:2022 Certification Hub API
"""
from fastapi import APIRouter, Query, Depends
from datetime import datetime, timedelta
from dependencies import get_current_user

router = APIRouter(prefix="/api/iso27001", tags=["ISO 27001"])

# 93 ISO 27001:2022 controls across 4 themes
ISO_CONTROLS = [
    # Theme 1: Organisational Controls (A.5)
    {"id":"A.5.1","theme":"Organisational","name":"Policies for information security","status":"implemented","priority":"HIGH","evidence":["Information Security Policy v2.1"],"gap":None},
    {"id":"A.5.2","theme":"Organisational","name":"Information security roles and responsibilities","status":"implemented","priority":"HIGH","evidence":["RACI Matrix"],"gap":None},
    {"id":"A.5.3","theme":"Organisational","name":"Segregation of duties","status":"in_progress","priority":"MEDIUM","evidence":[],"gap":"Formal SoD policy needed"},
    {"id":"A.5.4","theme":"Organisational","name":"Management responsibilities","status":"implemented","priority":"MEDIUM","evidence":["Management commitment letter"],"gap":None},
    {"id":"A.5.5","theme":"Organisational","name":"Contact with authorities","status":"implemented","priority":"LOW","evidence":["CERT-In contact list"],"gap":None},
    {"id":"A.5.6","theme":"Organisational","name":"Contact with special interest groups","status":"not_started","priority":"LOW","evidence":[],"gap":"Join ISACA/DSCI India chapter"},
    {"id":"A.5.7","theme":"Organisational","name":"Threat intelligence","status":"in_progress","priority":"MEDIUM","evidence":[],"gap":"Subscribe to threat intel feed"},
    {"id":"A.5.8","theme":"Organisational","name":"Information security in project management","status":"implemented","priority":"MEDIUM","evidence":["SDLC Security Policy"],"gap":None},
    {"id":"A.5.9","theme":"Organisational","name":"Inventory of information and other assets","status":"in_progress","priority":"HIGH","evidence":["Asset inventory v1"],"gap":"Incomplete — needs cloud assets"},
    {"id":"A.5.10","theme":"Organisational","name":"Acceptable use of information assets","status":"implemented","priority":"HIGH","evidence":["AUP v1.2"],"gap":None},
    {"id":"A.5.11","theme":"Organisational","name":"Return of assets","status":"implemented","priority":"MEDIUM","evidence":["Offboarding checklist"],"gap":None},
    {"id":"A.5.12","theme":"Organisational","name":"Classification of information","status":"in_progress","priority":"HIGH","evidence":[],"gap":"Classification scheme not fully implemented"},
    {"id":"A.5.13","theme":"Organisational","name":"Labelling of information","status":"not_started","priority":"MEDIUM","evidence":[],"gap":"Data labelling tooling needed"},
    {"id":"A.5.14","theme":"Organisational","name":"Information transfer","status":"implemented","priority":"HIGH","evidence":["Data transfer policy"],"gap":None},
    {"id":"A.5.15","theme":"Organisational","name":"Access control","status":"implemented","priority":"HIGH","evidence":["Access control policy","MFA report"],"gap":None},
    {"id":"A.5.16","theme":"Organisational","name":"Identity management","status":"implemented","priority":"HIGH","evidence":["Okta configuration"],"gap":None},
    {"id":"A.5.17","theme":"Organisational","name":"Authentication information","status":"implemented","priority":"HIGH","evidence":["Password policy"],"gap":None},
    {"id":"A.5.18","theme":"Organisational","name":"Access rights","status":"in_progress","priority":"HIGH","evidence":["Access review Q1"],"gap":"Quarterly reviews not completed"},
    {"id":"A.5.19","theme":"Organisational","name":"Information security in supplier relationships","status":"in_progress","priority":"HIGH","evidence":["Vendor questionnaires"],"gap":"2 critical vendors pending assessment"},
    {"id":"A.5.20","theme":"Organisational","name":"Addressing security in supplier agreements","status":"implemented","priority":"HIGH","evidence":["DPA templates"],"gap":None},
    {"id":"A.5.21","theme":"Organisational","name":"Managing security in the ICT supply chain","status":"not_started","priority":"MEDIUM","evidence":[],"gap":"Supply chain risk framework needed"},
    {"id":"A.5.22","theme":"Organisational","name":"Monitoring and review of supplier services","status":"in_progress","priority":"MEDIUM","evidence":[],"gap":"Monthly review cadence not established"},
    {"id":"A.5.23","theme":"Organisational","name":"Information security for cloud services","status":"implemented","priority":"HIGH","evidence":["AWS security config","Cloud policy"],"gap":None},
    {"id":"A.5.24","theme":"Organisational","name":"Information security incident management","status":"implemented","priority":"HIGH","evidence":["IRP v2.0"],"gap":None},
    {"id":"A.5.25","theme":"Organisational","name":"Assessment and decision on IS events","status":"implemented","priority":"HIGH","evidence":["Incident classification matrix"],"gap":None},
    {"id":"A.5.26","theme":"Organisational","name":"Response to information security incidents","status":"implemented","priority":"HIGH","evidence":["IRP runbooks"],"gap":None},
    {"id":"A.5.27","theme":"Organisational","name":"Learning from IS incidents","status":"in_progress","priority":"MEDIUM","evidence":["Post-incident report template"],"gap":"No completed PIR yet"},
    {"id":"A.5.28","theme":"Organisational","name":"Collection of evidence","status":"implemented","priority":"MEDIUM","evidence":["Evidence collection procedure"],"gap":None},
    {"id":"A.5.29","theme":"Organisational","name":"Business continuity","status":"in_progress","priority":"HIGH","evidence":["BCP draft"],"gap":"BCP not tested yet"},
    {"id":"A.5.30","theme":"Organisational","name":"ICT readiness for business continuity","status":"not_started","priority":"HIGH","evidence":[],"gap":"DR test not conducted"},
    {"id":"A.5.31","theme":"Organisational","name":"Legal, statutory, regulatory requirements","status":"implemented","priority":"HIGH","evidence":["Compliance register"],"gap":None},
    {"id":"A.5.32","theme":"Organisational","name":"Intellectual property rights","status":"implemented","priority":"MEDIUM","evidence":["IP policy"],"gap":None},
    {"id":"A.5.33","theme":"Organisational","name":"Protection of records","status":"implemented","priority":"HIGH","evidence":["Records retention policy"],"gap":None},
    {"id":"A.5.34","theme":"Organisational","name":"Privacy and PII protection","status":"in_progress","priority":"HIGH","evidence":["Privacy policy"],"gap":"DPDP consent not implemented"},
    {"id":"A.5.35","theme":"Organisational","name":"Independent review of IS","status":"not_started","priority":"HIGH","evidence":[],"gap":"Annual audit not scheduled"},
    {"id":"A.5.36","theme":"Organisational","name":"Compliance with IS policies","status":"implemented","priority":"HIGH","evidence":["Compliance monitoring report"],"gap":None},
    {"id":"A.5.37","theme":"Organisational","name":"Documented operating procedures","status":"implemented","priority":"MEDIUM","evidence":["Runbooks","SOPs"],"gap":None},
    # Theme 2: People Controls (A.6)
    {"id":"A.6.1","theme":"People","name":"Screening","status":"implemented","priority":"HIGH","evidence":["BGV policy","BGV reports"],"gap":None},
    {"id":"A.6.2","theme":"People","name":"Terms and conditions of employment","status":"implemented","priority":"HIGH","evidence":["Employment contracts"],"gap":None},
    {"id":"A.6.3","theme":"People","name":"Information security awareness, education and training","status":"implemented","priority":"HIGH","evidence":["Training completion 92%"],"gap":None},
    {"id":"A.6.4","theme":"People","name":"Disciplinary process","status":"implemented","priority":"MEDIUM","evidence":["HR disciplinary policy"],"gap":None},
    {"id":"A.6.5","theme":"People","name":"Responsibilities after termination or change","status":"implemented","priority":"HIGH","evidence":["Offboarding SOP"],"gap":None},
    {"id":"A.6.6","theme":"People","name":"Confidentiality or NDA agreements","status":"implemented","priority":"HIGH","evidence":["NDA template","Signed NDAs"],"gap":None},
    {"id":"A.6.7","theme":"People","name":"Remote working","status":"implemented","priority":"HIGH","evidence":["Remote work policy","VPN logs"],"gap":None},
    {"id":"A.6.8","theme":"People","name":"IS event reporting","status":"implemented","priority":"HIGH","evidence":["Incident reporting procedure"],"gap":None},
    # Theme 3: Physical Controls (A.7)
    {"id":"A.7.1","theme":"Physical","name":"Physical security perimeters","status":"implemented","priority":"HIGH","evidence":["Office security policy"],"gap":None},
    {"id":"A.7.2","theme":"Physical","name":"Physical entry","status":"implemented","priority":"HIGH","evidence":["Access card logs"],"gap":None},
    {"id":"A.7.3","theme":"Physical","name":"Securing offices, rooms and facilities","status":"implemented","priority":"MEDIUM","evidence":["CCTV policy"],"gap":None},
    {"id":"A.7.4","theme":"Physical","name":"Physical security monitoring","status":"in_progress","priority":"MEDIUM","evidence":[],"gap":"CCTV review procedure needed"},
    {"id":"A.7.5","theme":"Physical","name":"Protecting against physical threats","status":"implemented","priority":"HIGH","evidence":["Physical security assessment"],"gap":None},
    {"id":"A.7.6","theme":"Physical","name":"Working in secure areas","status":"implemented","priority":"MEDIUM","evidence":["Secure area policy"],"gap":None},
    {"id":"A.7.7","theme":"Physical","name":"Clear desk and clear screen","status":"in_progress","priority":"MEDIUM","evidence":[],"gap":"Policy exists but not audited"},
    {"id":"A.7.8","theme":"Physical","name":"Equipment siting and protection","status":"implemented","priority":"MEDIUM","evidence":["DC colocation contract"],"gap":None},
    {"id":"A.7.9","theme":"Physical","name":"Security of assets off-premises","status":"implemented","priority":"HIGH","evidence":["Remote device policy"],"gap":None},
    {"id":"A.7.10","theme":"Physical","name":"Storage media","status":"in_progress","priority":"HIGH","evidence":[],"gap":"Media disposal policy needed"},
    {"id":"A.7.11","theme":"Physical","name":"Supporting utilities","status":"implemented","priority":"HIGH","evidence":["UPS maintenance records"],"gap":None},
    {"id":"A.7.12","theme":"Physical","name":"Cabling security","status":"implemented","priority":"MEDIUM","evidence":["DC cabling audit"],"gap":None},
    {"id":"A.7.13","theme":"Physical","name":"Equipment maintenance","status":"implemented","priority":"MEDIUM","evidence":["Maintenance schedule"],"gap":None},
    {"id":"A.7.14","theme":"Physical","name":"Secure disposal or re-use of equipment","status":"in_progress","priority":"HIGH","evidence":[],"gap":"Certificate of destruction needed"},
    # Theme 4: Technological Controls (A.8)
    {"id":"A.8.1","theme":"Technological","name":"User endpoint devices","status":"implemented","priority":"HIGH","evidence":["MDM enrollment","FileVault report"],"gap":None},
    {"id":"A.8.2","theme":"Technological","name":"Privileged access rights","status":"implemented","priority":"HIGH","evidence":["PAM policy","Privileged account list"],"gap":None},
    {"id":"A.8.3","theme":"Technological","name":"Information access restriction","status":"implemented","priority":"HIGH","evidence":["RBAC configuration"],"gap":None},
    {"id":"A.8.4","theme":"Technological","name":"Access to source code","status":"implemented","priority":"HIGH","evidence":["GitHub access policy"],"gap":None},
    {"id":"A.8.5","theme":"Technological","name":"Secure authentication","status":"implemented","priority":"HIGH","evidence":["MFA enrollment 98%","Okta config"],"gap":None},
    {"id":"A.8.6","theme":"Technological","name":"Capacity management","status":"in_progress","priority":"MEDIUM","evidence":[],"gap":"Capacity planning document needed"},
    {"id":"A.8.7","theme":"Technological","name":"Protection against malware","status":"implemented","priority":"HIGH","evidence":["EDR deployment report"],"gap":None},
    {"id":"A.8.8","theme":"Technological","name":"Management of technical vulnerabilities","status":"in_progress","priority":"HIGH","evidence":["Tenable scan Q1"],"gap":"Critical vuln patch SLA exceeded once"},
    {"id":"A.8.9","theme":"Technological","name":"Configuration management","status":"implemented","priority":"HIGH","evidence":["IaC configs","CIS benchmarks"],"gap":None},
    {"id":"A.8.10","theme":"Technological","name":"Information deletion","status":"not_started","priority":"HIGH","evidence":[],"gap":"Data deletion procedure needed"},
    {"id":"A.8.11","theme":"Technological","name":"Data masking","status":"not_started","priority":"HIGH","evidence":[],"gap":"PII masking in non-prod needed"},
    {"id":"A.8.12","theme":"Technological","name":"Data leakage prevention","status":"in_progress","priority":"HIGH","evidence":[],"gap":"DLP tooling not deployed"},
    {"id":"A.8.13","theme":"Technological","name":"Information backup","status":"implemented","priority":"HIGH","evidence":["Backup policy","RTO/RPO docs"],"gap":None},
    {"id":"A.8.14","theme":"Technological","name":"Redundancy of information processing","status":"implemented","priority":"HIGH","evidence":["Multi-AZ architecture"],"gap":None},
    {"id":"A.8.15","theme":"Technological","name":"Logging","status":"implemented","priority":"HIGH","evidence":["CloudTrail config","Log retention policy"],"gap":None},
    {"id":"A.8.16","theme":"Technological","name":"Monitoring activities","status":"implemented","priority":"HIGH","evidence":["Datadog dashboards","Alert rules"],"gap":None},
    {"id":"A.8.17","theme":"Technological","name":"Clock synchronisation","status":"implemented","priority":"LOW","evidence":["NTP configuration"],"gap":None},
    {"id":"A.8.18","theme":"Technological","name":"Use of privileged utility programs","status":"implemented","priority":"MEDIUM","evidence":["Admin tool policy"],"gap":None},
    {"id":"A.8.19","theme":"Technological","name":"Installation of software on operational systems","status":"implemented","priority":"HIGH","evidence":["Software installation policy"],"gap":None},
    {"id":"A.8.20","theme":"Technological","name":"Networks security","status":"implemented","priority":"HIGH","evidence":["VPC config","Firewall rules"],"gap":None},
    {"id":"A.8.21","theme":"Technological","name":"Security of network services","status":"implemented","priority":"HIGH","evidence":["WAF config","CloudFlare setup"],"gap":None},
    {"id":"A.8.22","theme":"Technological","name":"Segregation of networks","status":"implemented","priority":"HIGH","evidence":["Network diagram","VPC subnets"],"gap":None},
    {"id":"A.8.23","theme":"Technological","name":"Web filtering","status":"in_progress","priority":"MEDIUM","evidence":[],"gap":"Web proxy not configured"},
    {"id":"A.8.24","theme":"Technological","name":"Use of cryptography","status":"implemented","priority":"HIGH","evidence":["Encryption policy","KMS config"],"gap":None},
    {"id":"A.8.25","theme":"Technological","name":"Secure development lifecycle","status":"implemented","priority":"HIGH","evidence":["SDLC policy","Code review process"],"gap":None},
    {"id":"A.8.26","theme":"Technological","name":"Application security requirements","status":"implemented","priority":"HIGH","evidence":["Security requirements doc"],"gap":None},
    {"id":"A.8.27","theme":"Technological","name":"Secure system architecture and engineering","status":"in_progress","priority":"HIGH","evidence":["Architecture review"],"gap":"Threat modelling not completed"},
    {"id":"A.8.28","theme":"Technological","name":"Secure coding","status":"implemented","priority":"HIGH","evidence":["Coding standards","SonarQube config"],"gap":None},
    {"id":"A.8.29","theme":"Technological","name":"Security testing in development and acceptance","status":"implemented","priority":"HIGH","evidence":["Pentest report Q1","SAST results"],"gap":None},
    {"id":"A.8.30","theme":"Technological","name":"Outsourced development","status":"implemented","priority":"MEDIUM","evidence":["Vendor dev agreement"],"gap":None},
    {"id":"A.8.31","theme":"Technological","name":"Separation of development, test and production","status":"implemented","priority":"HIGH","evidence":["Environment policy"],"gap":None},
    {"id":"A.8.32","theme":"Technological","name":"Change management","status":"implemented","priority":"HIGH","evidence":["Change management policy","Change log"],"gap":None},
    {"id":"A.8.33","theme":"Technological","name":"Test information","status":"implemented","priority":"HIGH","evidence":["Test data policy"],"gap":None},
    {"id":"A.8.34","theme":"Technological","name":"Protection of information systems during audit testing","status":"implemented","priority":"HIGH","evidence":["Audit access procedure"],"gap":None},
]

def _get_scores():
    impl = len([c for c in ISO_CONTROLS if c["status"]=="implemented"])
    prog = len([c for c in ISO_CONTROLS if c["status"]=="in_progress"])
    ns   = len([c for c in ISO_CONTROLS if c["status"]=="not_started"])
    total = len(ISO_CONTROLS)
    score = round((impl + prog*0.5) / total * 100)
    return {"implemented":impl,"in_progress":prog,"not_started":ns,"total":total,"score":score}

@router.get("/controls")
def get_controls(tenant_id: str = Query(default="demo"), theme: str = Query(None), status: str = Query(None)):
    controls = ISO_CONTROLS[:]
    if theme: controls = [c for c in controls if c["theme"]==theme]
    if status: controls = [c for c in controls if c["status"]==status]
    s = _get_scores()
    return {
        "controls": controls,
        "total": len(controls),
        "scores": s,
        "themes": list(set(c["theme"] for c in ISO_CONTROLS)),
    }

@router.get("/readiness")
def get_readiness(tenant_id: str = Query(default="demo")):
    s = _get_scores()
    gaps = [c for c in ISO_CONTROLS if c["status"]!="implemented" and c["priority"]=="HIGH"]
    return {
        "score": s["score"],
        "implemented": s["implemented"],
        "in_progress": s["in_progress"],
        "not_started": s["not_started"],
        "total": s["total"],
        "audit_ready_in_weeks": max(4, round((100-s["score"])/3)),
        "critical_gaps": len([c for c in ISO_CONTROLS if c["status"]=="not_started" and c["priority"]=="HIGH"]),
        "top_gaps": [{"id":c["id"],"name":c["name"],"priority":c["priority"],"gap":c["gap"]} for c in gaps[:5]],
        "themes": {
            theme: {
                "implemented": len([c for c in ISO_CONTROLS if c["theme"]==theme and c["status"]=="implemented"]),
                "total": len([c for c in ISO_CONTROLS if c["theme"]==theme]),
                "score": round(len([c for c in ISO_CONTROLS if c["theme"]==theme and c["status"]=="implemented"]) / max(len([c for c in ISO_CONTROLS if c["theme"]==theme]),1) * 100)
            }
            for theme in ["Organisational","People","Physical","Technological"]
        }
    }

@router.get("/timeline")
def get_timeline(tenant_id: str = Query(default="demo")):
    from datetime import datetime, timedelta
    now = datetime.utcnow()
    return {
        "phases": [
            {"phase":"Gap Analysis","status":"completed","start":(now-timedelta(days=90)).strftime("%Y-%m-%d"),"end":(now-timedelta(days=60)).strftime("%Y-%m-%d"),"description":"Identify gaps against ISO 27001:2022"},
            {"phase":"Remediation","status":"in_progress","start":(now-timedelta(days=60)).strftime("%Y-%m-%d"),"end":(now+timedelta(days=30)).strftime("%Y-%m-%d"),"description":"Close identified gaps and implement controls"},
            {"phase":"Internal Audit","status":"pending","start":(now+timedelta(days=30)).strftime("%Y-%m-%d"),"end":(now+timedelta(days=45)).strftime("%Y-%m-%d"),"description":"Internal audit against all 93 controls"},
            {"phase":"Management Review","status":"pending","start":(now+timedelta(days=45)).strftime("%Y-%m-%d"),"end":(now+timedelta(days=52)).strftime("%Y-%m-%d"),"description":"Board-level review of ISMS"},
            {"phase":"Certification Audit","status":"pending","start":(now+timedelta(days=52)).strftime("%Y-%m-%d"),"end":(now+timedelta(days=66)).strftime("%Y-%m-%d"),"description":"External audit by accredited certification body"},
        ],
        "estimated_certification": (now+timedelta(days=66)).strftime("%Y-%m-%d"),
        "weeks_to_cert": 9,
    }

@router.patch("/controls/{control_id}")
def update_control(control_id: str, body: dict, tenant_id: str = Query(default="demo")):
    for c in ISO_CONTROLS:
        if c["id"] == control_id:
            if "status" in body: c["status"] = body["status"]
            if "internal_note" in body: c["internal_note"] = body["internal_note"]
            return {"message":"Updated","control":c}
    return {"error":"Not found"}

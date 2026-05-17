from fastapi import APIRouter, Query, BackgroundTasks, HTTPException
from datetime import datetime, timedelta
import os, secrets, asyncio

router = APIRouter(prefix="/api/test-engine", tags=["test-engine"])
TEST_RUNS = {}
TEST_RESULTS = {}

def get_demo_aws():
    now = datetime.utcnow().isoformat()
    return [
        {"id":"aws_iam_root_mfa","name":"Root Account MFA Enabled","category":"Identity & Access","framework":"SOC2","control":"CC6.1","status":"PASS","details":"Root account has MFA enabled","severity":"CRITICAL","demo":True},
        {"id":"aws_iam_password_policy","name":"IAM Password Policy","category":"Identity & Access","framework":"SOC2","control":"CC6.1","status":"FAIL","details":"Min length 8 — too weak","remediation":"Set min length ≥14, require symbols, max age ≤90 days","severity":"HIGH","demo":True},
        {"id":"aws_iam_key_rotation","name":"Access Key Rotation (90d)","category":"Identity & Access","framework":"SOC2","control":"CC6.1","status":"WARNING","details":"2 access keys older than 90 days","remediation":"Rotate keys for: deploy-user, ci-user","severity":"HIGH","demo":True},
        {"id":"aws_iam_no_inline","name":"No Inline IAM Policies","category":"Identity & Access","framework":"SOC2","control":"CC6.3","status":"PASS","details":"No inline policies found","severity":"MEDIUM","demo":True},
        {"id":"aws_s3_public","name":"S3 Public Access Blocked","category":"Data Security","framework":"SOC2","control":"CC6.6","status":"PASS","details":"All 12 buckets block public access","severity":"CRITICAL","demo":True},
        {"id":"aws_s3_encryption","name":"S3 Encryption at Rest","category":"Data Security","framework":"SOC2","control":"CC6.7","status":"PASS","details":"All buckets encrypted with SSE-S3","severity":"HIGH","demo":True},
        {"id":"aws_cloudtrail","name":"CloudTrail Logging Enabled","category":"Audit Logging","framework":"SOC2","control":"CC7.2","status":"PASS","details":"2 active trails, 1 multi-region","severity":"HIGH","demo":True},
        {"id":"aws_guardduty","name":"GuardDuty Threat Detection","category":"Threat Detection","framework":"SOC2","control":"CC7.1","status":"PASS","details":"GuardDuty enabled (1 detector)","severity":"HIGH","demo":True},
        {"id":"aws_ec2_ssh","name":"No Open SSH (0.0.0.0/0:22)","category":"Network Security","framework":"SOC2","control":"CC6.6","status":"FAIL","details":"2 security groups allow SSH from anywhere","remediation":"Restrict port 22 to your office IP in: sg-web-servers, sg-bastion","severity":"CRITICAL","demo":True},
        {"id":"aws_ec2_rdp","name":"No Open RDP (0.0.0.0/0:3389)","category":"Network Security","framework":"SOC2","control":"CC6.6","status":"PASS","details":"No security groups expose RDP","severity":"CRITICAL","demo":True},
        {"id":"aws_rds_public","name":"RDS Not Publicly Accessible","category":"Data Security","framework":"SOC2","control":"CC6.6","status":"PASS","details":"No public RDS instances","severity":"CRITICAL","demo":True},
        {"id":"aws_vpc_flow_logs","name":"VPC Flow Logs Enabled","category":"Network Security","framework":"SOC2","control":"CC7.2","status":"WARNING","details":"1 of 2 VPCs missing flow logs","remediation":"Enable VPC flow logs for vpc-0abc123","severity":"MEDIUM","demo":True},
        {"id":"aws_config_enabled","name":"AWS Config Enabled","category":"Audit Logging","framework":"SOC2","control":"CC7.2","status":"PASS","details":"AWS Config recording enabled in us-east-1","severity":"MEDIUM","demo":True},
    ]

def get_demo_github():
    return [
        {"id":"github_branch_protection","name":"Branch Protection Rules","category":"Change Management","framework":"SOC2","control":"CC8.1","status":"PASS","details":"All 8 repos have branch protection","severity":"HIGH","demo":True},
        {"id":"github_secret_scanning","name":"Secret Scanning Active","category":"Code Security","framework":"SOC2","control":"CC6.8","status":"WARNING","details":"1 open secret alert in api repo","remediation":"Revoke and rotate the exposed credential immediately","severity":"CRITICAL","demo":True},
        {"id":"github_dependabot","name":"Dependency Vulnerabilities","category":"Vulnerability Management","framework":"SOC2","control":"CC7.1","status":"FAIL","details":"3 critical, 5 high severity open","remediation":"Update lodash, axios, express to latest versions","severity":"CRITICAL","demo":True},
        {"id":"github_org_2fa","name":"Organization 2FA Required","category":"Identity & Access","framework":"SOC2","control":"CC6.1","status":"PASS","details":"All orgs require 2FA","severity":"HIGH","demo":True},
        {"id":"github_code_scanning","name":"Code Scanning (SAST) Enabled","category":"Code Security","framework":"SOC2","control":"CC7.1","status":"WARNING","details":"3 of 8 repos missing CodeQL scanning","remediation":"Enable GitHub Actions CodeQL workflow","severity":"HIGH","demo":True},
        {"id":"github_signed_commits","name":"Signed Commits Required","category":"Change Management","framework":"SOC2","control":"CC8.1","status":"FAIL","details":"No repos require signed commits","remediation":"Enable required signed commits in branch protection rules","severity":"MEDIUM","demo":True},
    ]

def get_demo_okta():
    return [
        {"id":"okta_mfa_required","name":"MFA Required for All Users","category":"Identity & Access","framework":"SOC2","control":"CC6.1","status":"PASS","details":"MFA required in enrollment policy","severity":"CRITICAL","demo":True},
        {"id":"okta_password_policy","name":"Strong Password Policy","category":"Identity & Access","framework":"SOC2","control":"CC6.1","status":"PASS","details":"Min 14 chars, symbols required","severity":"HIGH","demo":True},
        {"id":"okta_user_lifecycle","name":"User Lifecycle Management","category":"Identity & Access","framework":"SOC2","control":"CC6.2","status":"PASS","details":"47 active, 3 deprovisioned users","severity":"MEDIUM","demo":True},
        {"id":"okta_session_timeout","name":"Session Timeout Policy","category":"Identity & Access","framework":"SOC2","control":"CC6.1","status":"WARNING","details":"1 policy with session >8h","remediation":"Reduce idle timeout to ≤480 minutes","severity":"MEDIUM","demo":True},
        {"id":"okta_admin_mfa","name":"Admin MFA Enforced","category":"Identity & Access","framework":"SOC2","control":"CC6.1","status":"PASS","details":"All 3 admin users have MFA active","severity":"CRITICAL","demo":True},
        {"id":"okta_inactive_users","name":"No Inactive Users > 90 Days","category":"Identity & Access","framework":"SOC2","control":"CC6.2","status":"FAIL","details":"4 users inactive for >90 days","remediation":"Suspend or deprovision: john.old@, contractor1@, ...","severity":"HIGH","demo":True},
    ]

async def run_real_aws(creds):
    try:
        import boto3
        session = boto3.Session(
            aws_access_key_id=creds.get("access_key_id") or os.getenv("AWS_ACCESS_KEY_ID",""),
            aws_secret_access_key=creds.get("secret_access_key") or os.getenv("AWS_SECRET_ACCESS_KEY",""),
            region_name=creds.get("region","us-east-1"),
        )
        results = []
        now = datetime.utcnow().isoformat()

        # IAM
        iam = session.client("iam")
        try:
            summary = iam.get_account_summary()["SummaryMap"]
            mfa = summary.get("AccountMFAEnabled",0)==1
            results.append({"id":"aws_iam_root_mfa","name":"Root Account MFA Enabled","category":"Identity & Access","framework":"SOC2","control":"CC6.1","status":"PASS" if mfa else "FAIL","details":"MFA enabled" if mfa else "CRITICAL: Root MFA not enabled","remediation":None if mfa else "Enable MFA on root account immediately","severity":"CRITICAL","evidence":{"root_mfa":mfa}})
        except Exception as e:
            results.append({"id":"aws_iam_root_mfa","name":"Root Account MFA","status":"ERROR","details":str(e),"category":"Identity & Access","framework":"SOC2","control":"CC6.1","severity":"CRITICAL"})

        try:
            pw = iam.get_account_password_policy()["PasswordPolicy"]
            strong = pw.get("MinimumPasswordLength",0)>=14 and pw.get("RequireSymbols",False)
            results.append({"id":"aws_iam_password_policy","name":"IAM Password Policy","category":"Identity & Access","framework":"SOC2","control":"CC6.1","status":"PASS" if strong else "FAIL","details":f"Min length: {pw.get('MinimumPasswordLength',0)}","remediation":None if strong else "Set min 14 chars, require symbols","severity":"HIGH","evidence":pw})
        except: results.append({"id":"aws_iam_password_policy","name":"IAM Password Policy","category":"Identity & Access","framework":"SOC2","control":"CC6.1","status":"FAIL","details":"No password policy configured","remediation":"Configure IAM password policy","severity":"HIGH"})

        try:
            users = iam.list_users()["Users"]
            old = []
            for u in users[:15]:
                keys = iam.list_access_keys(UserName=u["UserName"])["AccessKeyMetadata"]
                for k in keys:
                    if k["Status"]=="Active":
                        age=(datetime.utcnow()-k["CreateDate"].replace(tzinfo=None)).days
                        if age>90: old.append({"user":u["UserName"],"age":age})
            results.append({"id":"aws_iam_key_rotation","name":"Access Key Rotation","category":"Identity & Access","framework":"SOC2","control":"CC6.1","status":"PASS" if not old else "FAIL","details":f"{len(old)} keys >90 days old" if old else "All keys rotated within 90 days","remediation":None if not old else f"Rotate keys for: {','.join(x['user'] for x in old[:3])}","severity":"HIGH","evidence":{"old_keys":old}})
        except Exception as e: results.append({"id":"aws_iam_key_rotation","name":"Access Key Rotation","status":"ERROR","details":str(e),"category":"Identity & Access","framework":"SOC2","control":"CC6.1","severity":"HIGH"})

        # S3
        try:
            s3 = session.client("s3")
            buckets = s3.list_buckets()["Buckets"]
            pub=[]; unenc=[]
            for b in buckets[:20]:
                name=b["Name"]
                try:
                    pa=s3.get_public_access_block(Bucket=name)["PublicAccessBlockConfiguration"]
                    if not all([pa.get("BlockPublicAcls"),pa.get("BlockPublicPolicy"),pa.get("IgnorePublicAcls"),pa.get("RestrictPublicBuckets")]): pub.append(name)
                except: pub.append(name)
                try: s3.get_bucket_encryption(Bucket=name)
                except: unenc.append(name)
            results.append({"id":"aws_s3_public","name":"S3 Public Access Blocked","category":"Data Security","framework":"SOC2","control":"CC6.6","status":"PASS" if not pub else "FAIL","details":f"{len(pub)} public buckets" if pub else f"All {len(buckets)} buckets block public access","remediation":None if not pub else f"Block public access on: {','.join(pub[:3])}","severity":"CRITICAL","evidence":{"public":pub,"total":len(buckets)}})
            results.append({"id":"aws_s3_encryption","name":"S3 Encryption at Rest","category":"Data Security","framework":"SOC2","control":"CC6.7","status":"PASS" if not unenc else "FAIL","details":f"{len(unenc)} unencrypted buckets" if unenc else "All buckets encrypted","remediation":None if not unenc else f"Enable SSE on: {','.join(unenc[:3])}","severity":"HIGH","evidence":{"unencrypted":unenc}})
        except Exception as e:
            results.append({"id":"aws_s3_general","name":"S3 Checks","status":"ERROR","details":str(e),"category":"Data Security","framework":"SOC2","control":"CC6.6","severity":"CRITICAL"})

        # CloudTrail
        try:
            ct=session.client("cloudtrail")
            trails=ct.describe_trails(includeShadowTrails=False)["trailList"]
            active=[t for t in trails if ct.get_trail_status(Name=t["TrailARN"]).get("IsLogging")]
            mr=[t for t in trails if t.get("IsMultiRegionTrail")]
            results.append({"id":"aws_cloudtrail","name":"CloudTrail Logging","category":"Audit Logging","framework":"SOC2","control":"CC7.2","status":"PASS" if active and mr else "FAIL","details":f"{len(active)} active, {len(mr)} multi-region trails" if trails else "No CloudTrail configured","remediation":None if (active and mr) else "Create multi-region CloudTrail trail","severity":"HIGH","evidence":{"trails":len(trails),"active":len(active),"multi_region":len(mr)}})
        except Exception as e: results.append({"id":"aws_cloudtrail","name":"CloudTrail","status":"ERROR","details":str(e),"category":"Audit Logging","framework":"SOC2","control":"CC7.2","severity":"HIGH"})

        # GuardDuty
        try:
            gd=session.client("guardduty")
            dets=gd.list_detectors()["DetectorIds"]
            enabled=[d for d in dets if gd.get_detector(DetectorId=d)["Status"]=="ENABLED"]
            results.append({"id":"aws_guardduty","name":"GuardDuty Enabled","category":"Threat Detection","framework":"SOC2","control":"CC7.1","status":"PASS" if enabled else "FAIL","details":f"GuardDuty enabled ({len(enabled)} detectors)" if enabled else "GuardDuty not enabled","remediation":None if enabled else "Enable GuardDuty in this region","severity":"HIGH","evidence":{"enabled":len(enabled)}})
        except Exception as e: results.append({"id":"aws_guardduty","name":"GuardDuty","status":"ERROR","details":str(e),"category":"Threat Detection","framework":"SOC2","control":"CC7.1","severity":"HIGH"})

        # EC2 SGs
        try:
            ec2=session.client("ec2")
            sgs=ec2.describe_security_groups()["SecurityGroups"]
            ssh=[]; rdp=[]
            for sg in sgs:
                for rule in sg.get("IpPermissions",[]):
                    for ip in rule.get("IpRanges",[]):
                        if ip.get("CidrIp")=="0.0.0.0/0":
                            if rule.get("FromPort")==22: ssh.append(sg["GroupId"])
                            if rule.get("FromPort")==3389: rdp.append(sg["GroupId"])
            results.append({"id":"aws_ec2_ssh","name":"No Open SSH (0.0.0.0/0:22)","category":"Network Security","framework":"SOC2","control":"CC6.6","status":"PASS" if not ssh else "FAIL","details":f"{len(ssh)} SGs allow SSH from anywhere" if ssh else "No open SSH ports","remediation":None if not ssh else f"Restrict port 22 in: {','.join(ssh[:3])}","severity":"CRITICAL","evidence":{"open_ssh":ssh}})
            results.append({"id":"aws_ec2_rdp","name":"No Open RDP (0.0.0.0/0:3389)","category":"Network Security","framework":"SOC2","control":"CC6.6","status":"PASS" if not rdp else "FAIL","details":f"{len(rdp)} SGs allow RDP from anywhere" if rdp else "No open RDP ports","remediation":None if not rdp else f"Restrict port 3389 in: {','.join(rdp[:3])}","severity":"CRITICAL","evidence":{"open_rdp":rdp}})
        except Exception as e:
            results.append({"id":"aws_ec2_sg","name":"EC2 Security Groups","status":"ERROR","details":str(e),"category":"Network Security","framework":"SOC2","control":"CC6.6","severity":"CRITICAL"})

        # RDS
        try:
            rds=session.client("rds")
            instances=rds.describe_db_instances()["DBInstances"]
            unenc=[i["DBInstanceIdentifier"] for i in instances if not i.get("StorageEncrypted")]
            pub=[i["DBInstanceIdentifier"] for i in instances if i.get("PubliclyAccessible")]
            results.append({"id":"aws_rds_public","name":"RDS Not Publicly Accessible","category":"Data Security","framework":"SOC2","control":"CC6.6","status":"PASS" if not pub else "FAIL","details":f"{len(pub)} public instances" if pub else "No public RDS instances","remediation":None if not pub else f"Disable public access on: {','.join(pub[:3])}","severity":"CRITICAL","evidence":{"public":pub}})
        except Exception as e:

        return results
    except Exception as e:
        demo = get_demo_aws()
        for d in demo: d["note"]=f"Demo — AWS error: {str(e)[:80]}"
        return demo

async def run_real_github(token):
    if not token: return get_demo_github()
    try:
        import httpx
        headers={"Authorization":f"token {token}","Accept":"application/vnd.github.v3+json"}
        results=[]
        async with httpx.AsyncClient(timeout=15) as client:
            resp=await client.get("https://api.github.com/user/repos?type=all&per_page=20",headers=headers)
            repos=resp.json() if resp.status_code==200 else []
            if isinstance(repos,dict): return get_demo_github()

            # Branch protection
            prot=[]; unprot=[]
            for r in repos[:10]:
                if r.get("archived"): continue
                bp=await client.get(f"https://api.github.com/repos/{r['full_name']}/branches/{r.get('default_branch','main')}/protection",headers=headers)
                (prot if bp.status_code==200 else unprot).append(r["name"])
            results.append({"id":"github_branch_protection","name":"Branch Protection Rules","category":"Change Management","framework":"SOC2","control":"CC8.1","status":"PASS" if not unprot else "FAIL","details":f"{len(unprot)} repos missing branch protection" if unprot else f"All {len(prot)} repos protected","remediation":None if not unprot else f"Enable branch protection on: {','.join(unprot[:3])}","severity":"HIGH","evidence":{"protected":prot,"unprotected":unprot}})

            # Secret scanning
            total_alerts=0; ss_disabled=[]
            for r in repos[:10]:
                if r.get("archived"): continue
                ss=await client.get(f"https://api.github.com/repos/{r['full_name']}/secret-scanning/alerts",headers=headers)
                if ss.status_code==200 and isinstance(ss.json(),list):
                    total_alerts+=len([a for a in ss.json() if a.get("state")=="open"])
                else: ss_disabled.append(r["name"])
            results.append({"id":"github_secret_scanning","name":"Secret Scanning Active","category":"Code Security","framework":"SOC2","control":"CC6.8","status":"PASS" if (not ss_disabled and total_alerts==0) else ("FAIL" if total_alerts>0 else "WARNING"),"details":f"{total_alerts} open secret alerts" if total_alerts else "No open secret alerts","remediation":None if total_alerts==0 else "Revoke and rotate exposed credentials immediately","severity":"CRITICAL","evidence":{"open_alerts":total_alerts,"disabled_repos":ss_disabled}})

            # Dependabot
            crit=0; high=0
            for r in repos[:10]:
                if r.get("archived"): continue
                dep=await client.get(f"https://api.github.com/repos/{r['full_name']}/dependabot/alerts?state=open&per_page=20",headers=headers)
                if dep.status_code==200 and isinstance(dep.json(),list):
                    for a in dep.json():
                        sev=a.get("security_vulnerability",{}).get("severity","")
                        if sev=="critical": crit+=1
                        elif sev=="high": high+=1
            results.append({"id":"github_dependabot","name":"Dependency Vulnerabilities","category":"Vulnerability Management","framework":"SOC2","control":"CC7.1","status":"PASS" if crit==0 and high==0 else ("FAIL" if crit>0 else "WARNING"),"details":f"{crit} critical, {high} high open" if crit+high>0 else "No critical/high vulnerabilities","remediation":None if crit==0 else "Update vulnerable dependencies immediately","severity":"CRITICAL" if crit>0 else "HIGH","evidence":{"critical":crit,"high":high}})

            # Org 2FA
            orgs=await client.get("https://api.github.com/user/orgs",headers=headers)
            no2fa=[]
            for org in (orgs.json() if orgs.status_code==200 else [])[:3]:
                od=await client.get(f"https://api.github.com/orgs/{org['login']}",headers=headers)
                if od.status_code==200 and not od.json().get("two_factor_requirement_enabled",False):
                    no2fa.append(org["login"])
            results.append({"id":"github_org_2fa","name":"Organization 2FA Required","category":"Identity & Access","framework":"SOC2","control":"CC6.1","status":"PASS" if not no2fa else "FAIL","details":f"{len(no2fa)} orgs missing 2FA requirement" if no2fa else "All orgs require 2FA","remediation":None if not no2fa else f"Enable 2FA in org settings: {','.join(no2fa)}","severity":"HIGH","evidence":{"no_2fa_orgs":no2fa}})

        return results
    except Exception as e:
        demo=get_demo_github()
        for d in demo: d["note"]=f"Demo — GitHub error: {str(e)[:80]}"
        return demo

async def run_real_okta(domain, api_token):
    if not domain or not api_token: return get_demo_okta()
    try:
        import httpx
        headers={"Authorization":f"SSWS {api_token}","Accept":"application/json"}
        base=f"https://{domain}"
        results=[]
        async with httpx.AsyncClient(timeout=15) as client:
            # MFA
            try:
                resp=await client.get(f"{base}/api/v1/policies?type=MFA_ENROLL",headers=headers)
                pols=resp.json() if resp.status_code==200 else []
                req=[p for p in pols if isinstance(p,dict) and p.get("settings",{}).get("factors",{}).get("okta_otp",{}).get("enroll",{}).get("self")=="REQUIRED"]
                results.append({"id":"okta_mfa_required","name":"MFA Required for All Users","category":"Identity & Access","framework":"SOC2","control":"CC6.1","status":"PASS" if req else "FAIL","details":f"{len(req)} MFA policies requiring enrollment" if req else "No MFA REQUIRED policy found","remediation":None if req else "Create MFA enrollment policy set to REQUIRED","severity":"CRITICAL","evidence":{"policy_count":len(pols),"required":len(req)}})
            except Exception as e: results.append({"id":"okta_mfa_required","name":"MFA Required","status":"ERROR","details":str(e),"category":"Identity & Access","framework":"SOC2","control":"CC6.1","severity":"CRITICAL"})

            # Password policy
            try:
                resp=await client.get(f"{base}/api/v1/policies?type=PASSWORD",headers=headers)
                pols=resp.json() if resp.status_code==200 else []
                strong=any(p.get("settings",{}).get("password",{}).get("complexity",{}).get("minLength",0)>=12 for p in pols if isinstance(p,dict))
                results.append({"id":"okta_password_policy","name":"Strong Password Policy","category":"Identity & Access","framework":"SOC2","control":"CC6.1","status":"PASS" if strong else "FAIL","details":"Password meets complexity requirements" if strong else "Password min length <12","remediation":None if strong else "Update password policy: min 12 chars, require symbols","severity":"HIGH","evidence":{"policies_checked":len(pols)}})
            except Exception as e: results.append({"id":"okta_password_policy","name":"Password Policy","status":"ERROR","details":str(e),"category":"Identity & Access","framework":"SOC2","control":"CC6.1","severity":"HIGH"})

            # Users
            try:
                resp=await client.get(f"{base}/api/v1/users?limit=200",headers=headers)
                users=resp.json() if resp.status_code==200 else []
                active=[u for u in users if isinstance(u,dict) and u.get("status")=="ACTIVE"]
                deprov=[u for u in users if isinstance(u,dict) and u.get("status")=="DEPROVISIONED"]
                ninety_days_ago=(datetime.utcnow()-timedelta(days=90)).isoformat()
                inactive=[u for u in active if isinstance(u,dict) and (u.get("lastLogin") or "9999") < ninety_days_ago]
                results.append({"id":"okta_user_lifecycle","name":"User Lifecycle Management","category":"Identity & Access","framework":"SOC2","control":"CC6.2","status":"PASS" if not inactive else "WARNING","details":f"{len(active)} active, {len(inactive)} inactive >90d","remediation":None if not inactive else f"Review and deprovision {len(inactive)} inactive users","severity":"MEDIUM","evidence":{"active":len(active),"deprovisioned":len(deprov),"inactive_90d":len(inactive)}})
            except Exception as e: results.append({"id":"okta_user_lifecycle","name":"User Lifecycle","status":"ERROR","details":str(e),"category":"Identity & Access","framework":"SOC2","control":"CC6.2","severity":"MEDIUM"})

            # Session timeout
            try:
                resp=await client.get(f"{base}/api/v1/policies?type=OKTA_SIGN_ON",headers=headers)
                pols=resp.json() if resp.status_code==200 else []
                long_sess=[]
                for p in pols:
                    if not isinstance(p,dict): continue
                    for rule in p.get("conditions",{}).get("people",{}).get("users",{}).get("include",[]):
                        pass
                    maxIdle=p.get("settings",{}).get("session",{}).get("maxSessionIdleMinutes",0)
                    if maxIdle>480: long_sess.append(f"{p.get('name','?')}: {maxIdle}min")
                results.append({"id":"okta_session_timeout","name":"Session Timeout Policy","category":"Identity & Access","framework":"SOC2","control":"CC6.1","status":"PASS" if not long_sess else "WARNING","details":f"{len(long_sess)} policies with session >8h" if long_sess else "Session timeouts appropriate","remediation":None if not long_sess else "Reduce idle timeout to ≤480 minutes","severity":"MEDIUM","evidence":{"long_sessions":long_sess}})
            except Exception as e: results.append({"id":"okta_session_timeout","name":"Session Timeout","status":"ERROR","details":str(e),"category":"Identity & Access","framework":"SOC2","control":"CC6.1","severity":"MEDIUM"})

        return results
    except Exception as e:
        demo=get_demo_okta()
        for d in demo: d["note"]=f"Demo — Okta error: {str(e)[:80]}"
        return demo

def calc_score(results):
    if not results: return 0
    passed=len([r for r in results if r["status"]=="PASS"])
    return int(passed/len(results)*100)

@router.post("/run")
async def run_tests(body: dict, tenant_id: str = Query(...), background_tasks: BackgroundTasks = None):
    run_id = secrets.token_hex(8)
    integrations = body.get("integrations", ["aws","github","okta"])
    TEST_RUNS[run_id] = {"id":run_id,"tenant_id":tenant_id,"status":"RUNNING","started_at":datetime.utcnow().isoformat(),"integrations":integrations,"progress":0,"results":[],"summary":{}}

    async def execute():
        all_results = []
        steps = len(integrations)
        for i, intg in enumerate(integrations):
            TEST_RUNS[run_id]["progress"] = int((i/steps)*80)
            if intg == "aws":
                creds={"access_key_id":body.get("aws_access_key_id",""),"secret_access_key":body.get("aws_secret_access_key",""),"region":body.get("aws_region","us-east-1")}
                all_results.extend(await run_real_aws(creds))
            elif intg == "github":
                all_results.extend(await run_real_github(body.get("github_token","") or os.getenv("GITHUB_TOKEN","")))
            elif intg == "okta":
                all_results.extend(await run_real_okta(body.get("okta_domain","") or os.getenv("OKTA_DOMAIN",""), body.get("okta_api_token","") or os.getenv("OKTA_API_TOKEN","")))

        passed=len([r for r in all_results if r["status"]=="PASS"])
        failed=len([r for r in all_results if r["status"]=="FAIL"])
        warn=len([r for r in all_results if r["status"]=="WARNING"])
        errors=len([r for r in all_results if r["status"]=="ERROR"])
        total=len(all_results)
        TEST_RUNS[run_id].update({"status":"COMPLETED","completed_at":datetime.utcnow().isoformat(),"progress":100,"results":all_results,"summary":{"total":total,"passed":passed,"failed":failed,"warning":warn,"score":int(passed/max(total-errors,1)*100) if total else 0,"critical_failures":len([r for r in all_results if r.get("status")=="FAIL" and r.get("severity")=="CRITICAL"])}})
        TEST_RESULTS[tenant_id] = TEST_RUNS[run_id]

    if background_tasks:
        background_tasks.add_task(execute)
    else:
        await execute()

    return {"run_id":run_id,"status":"RUNNING","message":f"Running {len(integrations)} integration checks"}

@router.get("/run/{run_id}")
def get_run(run_id: str):
    run = TEST_RUNS.get(run_id)
    if not run: raise HTTPException(404,"Run not found")
    return run

@router.get("/results")
def get_results(tenant_id: str = Query(...), status: str = Query(None), severity: str = Query(None), category: str = Query(None)):
    run = TEST_RESULTS.get(tenant_id)
    if not run:
        results = get_demo_aws() + get_demo_github() + get_demo_okta()
        is_demo = True
    else:
        results = run.get("results", [])
        is_demo = False
    if status: results=[r for r in results if r.get("status")==status]
    if severity: results=[r for r in results if r.get("severity")==severity]
    if category: results=[r for r in results if r.get("category")==category]
    passed=len([r for r in results if r["status"]=="PASS"])
    total=len(results)
    return {"results":results,"total":total,"summary":{"passed":passed,"failed":len([r for r in results if r["status"]=="FAIL"]),"warning":len([r for r in results if r["status"]=="WARNING"]),"score":int(passed/max(total-errors,1)*100) if total else 0},"last_run":run.get("completed_at") if run else None,"is_demo":is_demo}

@router.get("/score")
def get_score(tenant_id: str = Query(...)):
    run = TEST_RESULTS.get(tenant_id)
    if not run:
        return {"score":68,"is_demo":True,"breakdown":{"aws":72,"github":58,"okta":85},"last_run":None,"total_checks":26,"critical_failures":3}
    results=run.get("results",[])
    aws_r=[r for r in results if r["id"].startswith("aws_")]
    gh_r=[r for r in results if r["id"].startswith("github_")]
    ok_r=[r for r in results if r["id"].startswith("okta_")]
    summary=run.get("summary",{})
    return {"score":summary.get("score",0),"is_demo":False,"breakdown":{"aws":calc_score(aws_r),"github":calc_score(gh_r),"okta":calc_score(ok_r)},"last_run":run.get("completed_at"),"total_checks":summary.get("total",0),"critical_failures":summary.get("critical_failures",0)}

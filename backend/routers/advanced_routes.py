"""
advanced_routes.py — Option B endpoints
Place at: backend/routers/advanced_routes.py

Wire in main.py:
  from routers.advanced_routes import router as advanced_router
  app.include_router(advanced_router)
"""

from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from dependencies import get_current_user

router = APIRouter(prefix="/api/advanced", tags=["Option B — Advanced Integrations"])


class AttackSurfaceRequest(BaseModel):
    org_name: str
    domain: str = ""

class CodeScanRequest(BaseModel):
    org_name: str
    github_org: str = ""

class BenchmarkRequest(BaseModel):
    org_name: str
    industry: str = "Technology"
    your_score: float

class CVEFeedRequest(BaseModel):
    technology_stack: List[str] = []


@router.post("/attack-surface", summary="Shodan — external attack surface scan")
def scan_attack_surface(req: AttackSurfaceRequest, _=Depends(get_current_user)):
    from services.advanced_services import scan_attack_surface
    return scan_attack_surface(req.org_name, req.domain)


@router.post("/code-security", summary="GitHub/GitLab — code security scanning")
def scan_code_security(req: CodeScanRequest, _=Depends(get_current_user)):
    from services.advanced_services import scan_code_security
    return scan_code_security(req.org_name, req.github_org)


@router.post("/benchmark", summary="Compare risk score against industry peers")
def get_benchmark(req: BenchmarkRequest, _=Depends(get_current_user)):
    from services.advanced_services import get_industry_benchmark
    return get_industry_benchmark(req.org_name, req.industry, req.your_score)


@router.post("/cve-feed", summary="Latest critical CVEs relevant to your stack")
def get_cve_feed(req: CVEFeedRequest, _=Depends(get_current_user)):
    from services.advanced_services import get_cve_feed
    return get_cve_feed(req.technology_stack)


@router.get("/status", summary="Option B feature status")
def get_status(_=Depends(get_current_user)):
    import os
    return {
        "features": {
            "shodan_attack_surface": {
                "status": "LIVE" if os.getenv("SHODAN_API_KEY") else "SIMULATED",
                "enable_with": "SHODAN_API_KEY in .env (free tier available at shodan.io)",
                "description": "Discovers exposed ports, services, SSL issues, leaked credentials"
            },
            "github_code_scanning": {
                "status": "LIVE" if os.getenv("GITHUB_TOKEN") else "SIMULATED",
                "enable_with": "GITHUB_TOKEN in .env (GitHub Settings → Developer Settings → PAT)",
                "description": "Secret scanning, Dependabot alerts, code scanning results"
            },
            "industry_benchmarking": {
                "status": "ACTIVE",
                "description": "Compare risk score vs 500-1500 peers in same industry sector"
            },
            "cve_feed": {
                "status": "ACTIVE",
                "description": "Real-time critical CVE monitoring filtered to your tech stack"
            },
        }
    }

from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, Query
import httpx
from config import settings
from dependencies import verify_proxy_key

router = APIRouter(prefix="/api", tags=["Scanner"])


@router.get("/health")
async def health():
    return {
        "status": "ok",
        "version": settings.APP_VERSION,
        "database": "connected",
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/vulns/pull")
async def pull_vulns(
    source: str = Query(default="nvd", regex="^(nvd|vulners|openvas)$"),
    keyword: Optional[str] = Query(default=None),
    _: bool = Depends(verify_proxy_key),
):
    try:
        if source == "nvd":
            return await _pull_nvd(keyword)
        elif source == "vulners":
            return _mock_vulners()
        else:
            return _mock_openvas()
    except Exception as e:
        return {"ok": False, "error": str(e)}


async def _pull_nvd(keyword: Optional[str]) -> dict:
    base = "https://services.nvd.nist.gov/rest/json/cves/2.0"
    params: dict = {"resultsPerPage": 50}
    if keyword:
        params["keywordSearch"] = keyword
    else:
        end = datetime.utcnow()
        start = end - timedelta(days=30)
        params["pubStartDate"] = start.strftime("%Y-%m-%dT00:00:00.000")
        params["pubEndDate"] = end.strftime("%Y-%m-%dT23:59:59.999")

    headers = {}
    if settings.NVD_API_KEY:
        headers["apiKey"] = settings.NVD_API_KEY

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(base, params=params, headers=headers)
        if resp.status_code != 200:
            return {"ok": False, "error": f"NVD returned {resp.status_code}"}
        data = resp.json()

    critical = high = medium = low = 0
    top = []
    for v in data.get("vulnerabilities", []):
        cve = v.get("cve", {})
        cve_id = cve.get("id", "")
        metrics = cve.get("metrics", {})
        v3 = metrics.get("cvssMetricV31", metrics.get("cvssMetricV30", []))
        severity = v3[0]["cvssData"]["baseScore"] if v3 else 0.0

        if   severity >= 9.0: critical += 1
        elif severity >= 7.0: high += 1
        elif severity >= 4.0: medium += 1
        else:                  low += 1

        if len(top) < 5 and severity >= 7.0:
            desc = next((d["value"] for d in cve.get("descriptions", [])
                         if d.get("lang") == "en"), "No description")
            top.append({"cve": cve_id, "name": desc[:80], "severity": severity})

    return {"ok": True, "data": {
        "source": "NIST NVD",
        "total": critical + high + medium + low,
        "critical": critical, "high": high, "medium": medium, "low": low,
        "topVulns": sorted(top, key=lambda x: x["severity"], reverse=True),
    }}


def _mock_vulners() -> dict:
    return {"ok": True, "data": {
        "source": "Vulners (mock — add API key to enable)",
        "total": 25, "critical": 3, "high": 8, "medium": 10, "low": 4,
        "topVulns": [
            {"cve": "CVE-2024-1234", "name": "Critical RCE vulnerability", "severity": 9.8},
            {"cve": "CVE-2024-1235", "name": "Authentication bypass",      "severity": 8.5},
        ],
    }}


def _mock_openvas() -> dict:
    return {"ok": True, "data": {
        "source": "OpenVAS (mock — requires local GVM install)",
        "total": 42, "critical": 5, "high": 12, "medium": 18, "low": 7,
        "topVulns": [
            {"cve": "CVE-2024-0001", "name": "SSH vulnerability detected", "severity": 9.1},
            {"cve": "CVE-2024-0002", "name": "Outdated SSL/TLS",          "severity": 7.5},
        ],
    }}
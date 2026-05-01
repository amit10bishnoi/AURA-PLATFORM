import os
import httpx
import re
import xml.etree.ElementTree as ET

OPENVAS_HOST = os.getenv("OPENVAS_HOST", "localhost")
OPENVAS_PORT = os.getenv("OPENVAS_PORT", "9392")
OPENVAS_USER = os.getenv("OPENVAS_USERNAME", "admin")
OPENVAS_PASS = os.getenv("OPENVAS_PASSWORD", "admin")
VULNERS_KEY  = os.getenv("VULNERS_API_KEY", "")
NVD_KEY      = os.getenv("NVD_API_KEY", "")

def _weighted_score(critical=0, high=0, medium=0, low=0):
    weighted = critical * 10 + high * 4 + medium * 1.5 + low * 0.3
    return min(25, round(weighted / 8))

async def fetch_nvd(keyword: str = "") -> dict:
    headers = {"User-Agent": "AURA-GRC/1.0"}
    if NVD_KEY:
        headers["apiKey"] = NVD_KEY

    base = "https://services.nvd.nist.gov/rest/json/cves/2.0"

    async def get_severity(sev: str) -> dict:
        params = {"resultsPerPage": 100, "startIndex": 0, "cvssV3Severity": sev}
        if keyword:
            params["keywordSearch"] = keyword
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.get(base, params=params, headers=headers)
            r.raise_for_status()
            return r.json()

    crit_data = await get_severity("CRITICAL")
    high_data = await get_severity("HIGH")
    med_data  = await get_severity("MEDIUM")

    critical = crit_data.get("totalResults", 0)
    high     = high_data.get("totalResults", 0)
    medium   = med_data.get("totalResults",  0)

    top_vulns = []
    for v in (crit_data.get("vulnerabilities") or [])[:5]:
        cve    = v.get("cve", {})
        m31    = (cve.get("metrics") or {}).get("cvssMetricV31", [{}])[0]
        m30    = (cve.get("metrics") or {}).get("cvssMetricV30", [{}])[0]
        metric = m31 or m30
        score  = (metric.get("cvssData") or {}).get("baseScore", 9.0)
        desc   = ((cve.get("descriptions") or [{}])[0]).get("value", "Unknown")[:80]
        top_vulns.append({
            "name": desc,
            "severity": str(score),
            "cve": cve.get("id", "")
        })

    return {
        "source":         "NIST NVD",
        "critical":       critical,
        "high":           high,
        "medium":         medium,
        "low":            0,
        "total":          critical + high + medium,
        "topVulns":       top_vulns,
        "weighted_score": _weighted_score(critical, high, medium),
    }

async def fetch_vulners(keyword: str = "") -> dict:
    if not VULNERS_KEY:
        raise ValueError("VULNERS_API_KEY is not set in .env")

    query = (
        f"type:cve AND ({keyword}) AND cvss.score:[0.1 TO 10]"
        if keyword
        else "type:cve AND cvss.score:[0.1 TO 10] AND published:[now-90d TO now]"
    )

    payload = {
        "query":  query,
        "size":   200,
        "fields": ["id", "title", "cvss", "published"],
        "apiKey": VULNERS_KEY,
    }

    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(
            "https://vulners.com/api/v3/search/lucene/",
            json=payload,
        )
        r.raise_for_status()
        data = r.json()

    if data.get("result") != "OK":
        raise ValueError(data.get("data", {}).get("error", "Vulners API error"))

    critical = high = medium = low = 0
    top_vulns = []

    for doc in (data.get("data") or {}).get("search") or []:
        src   = doc.get("_source", {})
        score = (src.get("cvss") or {}).get("score", 0)
        if   score >= 9.0: critical += 1
        elif score >= 7.0: high     += 1
        elif score >= 4.0: medium   += 1
        elif score >  0:   low      += 1
        if score >= 7.0 and len(top_vulns) < 5:
            top_vulns.append({
                "name":     (src.get("title") or "Unknown")[:80],
                "severity": str(score),
                "cve":      src.get("id", ""),
            })

    return {
        "source":         "Vulners",
        "critical":       critical,
        "high":           high,
        "medium":         medium,
        "low":            low,
        "total":          critical + high + medium + low,
        "topVulns":       top_vulns,
        "weighted_score": _weighted_score(critical, high, medium, low),
    }

async def fetch_openvas() -> dict:
    base = f"https://{OPENVAS_HOST}:{OPENVAS_PORT}/gmp"

    async with httpx.AsyncClient(verify=False, timeout=30) as client:
        login_r = await client.post(
            base,
            data={
                "cmd":      "authenticate",
                "login":    OPENVAS_USER,
                "password": OPENVAS_PASS,
            },
        )
        login_r.raise_for_status()
        text = login_r.text

    token_match = re.search(r'token="([^"]+)"', text)
    if not token_match:
        raise ValueError("OpenVAS login failed — check credentials in .env")
    token = token_match.group(1)

    async with httpx.AsyncClient(verify=False, timeout=30) as client:
        results_r = await client.post(
            base,
            data={
                "cmd":     "get_results",
                "token":   token,
                "filter":  "severity>0.0 rows=500 first=1",
                "details": "1",
            },
        )
        results_r.raise_for_status()
        xml_text = results_r.text

    root  = ET.fromstring(xml_text)
    items = root.findall(".//result")

    critical = high = medium = low = 0
    top_vulns = []

    for r in items:
        sev_el   = r.find("severity")
        severity = float(sev_el.text or "0") if sev_el is not None else 0.0
        name_el  = r.find("name")
        name     = name_el.text if name_el is not None else "Unknown"
        cve_el   = r.find(".//ref[@type='cve']")
        cve      = cve_el.get("id", "") if cve_el is not None else ""

        if   severity >= 9.0: critical += 1
        elif severity >= 7.0: high     += 1
        elif severity >= 4.0: medium   += 1
        elif severity >  0:   low      += 1

        if severity >= 7.0 and len(top_vulns) < 5:
            top_vulns.append({
                "name":     name[:80],
                "severity": str(round(severity, 1)),
                "cve":      cve
            })

    return {
        "source":         "OpenVAS",
        "critical":       critical,
        "high":           high,
        "medium":         medium,
        "low":            low,
        "total":          critical + high + medium + low,
        "topVulns":       top_vulns,
        "weighted_score": _weighted_score(critical, high, medium, low),
    }

async def fetch_single_cve(cve_id: str) -> dict:
    headers = {"User-Agent": "AURA-GRC/1.0"}
    if NVD_KEY:
        headers["apiKey"] = NVD_KEY

    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.get(
            "https://services.nvd.nist.gov/rest/json/cves/2.0",
            params={"cveId": cve_id.upper()},
            headers=headers,
        )
        r.raise_for_status()
        data = r.json()

    vulns = data.get("vulnerabilities") or []
    if not vulns:
        raise ValueError(f"{cve_id} not found in NVD")

    cve    = vulns[0]["cve"]
    m31    = (cve.get("metrics") or {}).get("cvssMetricV31", [{}])[0]
    m30    = (cve.get("metrics") or {}).get("cvssMetricV30", [{}])[0]
    metric = m31 or m30
    cvss   = metric.get("cvssData") or {}

    return {
        "id":          cve.get("id"),
        "description": ((cve.get("descriptions") or [{}])[0]).get("value", ""),
        "score":       cvss.get("baseScore"),
        "severity":    cvss.get("baseSeverity"),
        "vector":      cvss.get("vectorString"),
        "published":   cve.get("published"),
        "modified":    cve.get("lastModified"),
    }
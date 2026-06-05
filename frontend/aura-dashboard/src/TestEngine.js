import { useState, useEffect, useCallback, useRef } from "react";
import { Activity, Play, RefreshCw, CheckCircle, XCircle, AlertTriangle, ChevronRight, Shield, Github, Cloud, Lock, ExternalLink, Clock } from "lucide-react";
const API = "https://web-production-320c3.up.railway.app";

const SEV_COLOR = { CRITICAL:"#e11d48", HIGH:"#ea580c", MEDIUM:"#d97706", LOW:"#16a34a" };
const SEV_BG    = { CRITICAL:"rgba(225,29,72,.08)", HIGH:"rgba(234,88,12,.08)", MEDIUM:"rgba(217,119,6,.08)", LOW:"rgba(22,163,74,.08)" };
const STATUS_CFG = {
  PASS:    { color:"#16a34a", bg:"rgba(22,163,74,.08)",    icon:CheckCircle,    label:"Pass" },
  FAIL:    { color:"#e11d48", bg:"rgba(225,29,72,.08)",    icon:XCircle,        label:"Fail" },
  WARNING: { color:"#d97706", bg:"rgba(217,119,6,.08)",    icon:AlertTriangle,  label:"Warning" },
  ERROR:   { color:"#6b5b9e", bg:"rgba(107,91,158,.08)",   icon:AlertTriangle,  label:"Error" },
};
const INTG_CFG = {
  aws:    { label:"AWS",    icon:"☁️",  color:"#FF9900", bg:"rgba(255,153,0,.08)" },
  github: { label:"GitHub", icon:"🐙",  color:"#1a0a3a", bg:"rgba(26,10,58,.06)" },
  okta:   { label:"Okta",   icon:"🔐",  color:"#007DC1", bg:"rgba(0,125,193,.08)" },
};

function ScoreRing({ score, size = 100 }) {
  const r = 38; const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? "#16a34a" : score >= 60 ? "#d97706" : "#e11d48";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(124,58,237,.1)" strokeWidth="8"/>
      <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 50 50)" style={{transition:"stroke-dashoffset 1s ease"}}/>
      <text x="50" y="54" textAnchor="middle" fontSize="20" fontWeight="800" fontFamily="'Syne',sans-serif" fill={color}>{score}</text>
    </svg>
  );
}

export default function TestEngine({ token, tenantId }) {
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState(null);
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runProgress, setRunProgress] = useState(0);
  const [runId, setRunId] = useState(null);
  const [filter, setFilter] = useState({ status: "", severity: "", integration: "" });
  const [expanded, setExpanded] = useState({});
  const [lastRun, setLastRun] = useState(null);
  const [isDemo, setIsDemo] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [creds, setCreds] = useState({ aws_access_key_id:"", aws_secret_access_key:"", aws_region:"us-east-1", github_token:"", okta_domain:"", okta_api_token:"" });
  const pollRef = useRef(null);

  const fetchResults = useCallback(async () => {
    try {
      const [resResp, scoreResp] = await Promise.all([
        fetch(`${API}/api/checks/latest?tenant_id=${tenantId||"demo"}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/scores/live?tenant_id=${tenantId||"demo"}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const resData = await resResp.json();
      const scoreData = await scoreResp.json();
      setResults(resData.results || []);
      setSummary(resData.summary || {});
      setLastRun(resData.last_run);
      setIsDemo(resData.is_demo !== false);
      setScore(scoreData);
    } catch {}
    setLoading(false);
  }, [token, tenantId]);

  useEffect(() => { fetchResults(); }, [fetchResults]);

  const pollRun = useCallback(async (rid) => {
    try {
      const resp = await fetch(`${API}/api/checks/run/${rid}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await resp.json();
      setRunProgress(data.progress || 0);
      if (data.status === "COMPLETED") {
        clearInterval(pollRef.current);
        setRunning(false);
        setRunProgress(100);
        await fetchResults();
      }
    } catch {}
  }, [token, fetchResults]);

  const runTests = async () => {
    setRunning(true);
    setRunProgress(5);
    setShowConfig(false);
    try {
      const resp = await fetch(`${API}/api/checks/run?tenant_id=${tenantId||"demo"}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ integrations: ["aws","github","okta"], ...creds }),
      });
      const data = await resp.json();
      setRunId(data.run_id);
      pollRef.current = setInterval(() => pollRun(data.run_id), 2000);
    } catch { setRunning(false); }
  };

  const filtered = results.filter(r =>
    (!filter.status || r.status === filter.status) &&
    (!filter.severity || r.severity === filter.severity) &&
    (!filter.integration || r.id.startsWith(filter.integration))
  );

  const categories = [...new Set(filtered.map(r => r.category))];

  const filterBtn = (key, val, label) => (
    <button onClick={() => setFilter(f => ({ ...f, [key]: f[key] === val ? "" : val }))}
      style={{ padding:"5px 12px", borderRadius:100, fontSize:11, fontWeight:600, cursor:"pointer", border:"1px solid", borderColor: filter[key]===val ? "rgba(124,58,237,.4)" : "rgba(124,58,237,.12)", background: filter[key]===val ? "rgba(124,58,237,.1)" : "#fff", color: filter[key]===val ? "#7c3aed" : "#6b5b9e", transition:"all .15s" }}>
      {label}
    </button>
  );

  return (
    <div style={{ padding:"28px 32px" }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
        <div>
          <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:700, color:"#1a0a3a", display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
            <Activity size={22} color="#7c3aed"/>Automated Test Engine
          </h2>
          <p style={{ color:"#a89dc8", fontSize:13 }}>
            {isDemo ? "⚠️ Demo data — connect real credentials to run live checks" : `Live checks · Last run: ${lastRun ? new Date(lastRun).toLocaleString() : "never"}`}
          </p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={() => setShowConfig(v => !v)} style={{ padding:"9px 16px", background:"#fff", border:"1px solid rgba(124,58,237,.2)", borderRadius:9, color:"#7c3aed", fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
            ⚙️ Configure
          </button>
          <button onClick={runTests} disabled={running} style={{ padding:"9px 18px", background:running?"#e9e4f8":"linear-gradient(135deg,#7c3aed,#db2777)", border:"none", borderRadius:9, color:running?"#a89dc8":"#fff", fontSize:13, fontWeight:700, cursor:running?"not-allowed":"pointer", display:"flex", alignItems:"center", gap:8, boxShadow:running?"none":"0 4px 14px rgba(124,58,237,.3)" }}>
            {running ? <><RefreshCw size={14} style={{ animation:"spin .8s linear infinite" }}/> Running {runProgress}%</> : <><Play size={14}/> Run All Checks</>}
          </button>
        </div>
      </div>

      {/* Config panel */}
      {showConfig && (
        <div style={{ background:"#fff", border:"1px solid rgba(124,58,237,.15)", borderRadius:14, padding:22, marginBottom:20 }}>
          <h4 style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:700, color:"#1a0a3a", marginBottom:16 }}>Integration Credentials</h4>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
            {[
              { label:"AWS Access Key ID", key:"aws_access_key_id", placeholder:"AKIA...", type:"text" },
              { label:"AWS Secret Access Key", key:"aws_secret_access_key", placeholder:"••••••••", type:"password" },
              { label:"AWS Region", key:"aws_region", placeholder:"us-east-1", type:"text" },
              { label:"GitHub Token", key:"github_token", placeholder:"ghp_...", type:"password" },
              { label:"Okta Domain", key:"okta_domain", placeholder:"yourorg.okta.com", type:"text" },
              { label:"Okta API Token", key:"okta_api_token", placeholder:"00...", type:"password" },
            ].map(f => (
              <label key={f.key} style={{ display:"block" }}>
                <div style={{ fontSize:11, fontWeight:600, color:"#6b5b9e", marginBottom:5, textTransform:"uppercase", letterSpacing:".5px" }}>{f.label}</div>
                <input type={f.type} value={creds[f.key]} onChange={e => setCreds(c => ({ ...c, [f.key]: e.target.value }))} placeholder={f.placeholder} style={{ width:"100%", background:"rgba(124,58,237,.04)", border:"1px solid rgba(124,58,237,.15)", borderRadius:8, padding:"8px 12px", color:"#1a0a3a", fontSize:12, fontFamily:"'JetBrains Mono',monospace", outline:"none", boxSizing:"border-box" }}/>
              </label>
            ))}
          </div>
          <div style={{ marginTop:12, fontSize:11, color:"#a89dc8" }}>💡 Credentials are used only for this session and not stored permanently. Set them in your <code>.env</code> file for persistent use.</div>
        </div>
      )}

      {/* Progress bar */}
      {running && (
        <div style={{ background:"#fff", border:"1px solid rgba(124,58,237,.12)", borderRadius:12, padding:16, marginBottom:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <span style={{ fontSize:13, fontWeight:600, color:"#1a0a3a" }}>Running compliance checks…</span>
            <span style={{ fontSize:13, color:"#7c3aed", fontWeight:700 }}>{runProgress}%</span>
          </div>
          <div style={{ height:6, background:"rgba(124,58,237,.1)", borderRadius:3, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${runProgress}%`, background:"linear-gradient(90deg,#7c3aed,#db2777)", borderRadius:3, transition:"width .5s" }}/>
          </div>
        </div>
      )}

      {/* Score overview */}
      {score && (
        <div style={{ display:"grid", gridTemplateColumns:"auto 1fr 1fr 1fr 1fr", gap:16, marginBottom:20, background:"#fff", border:"1px solid rgba(124,58,237,.1)", borderRadius:16, padding:24, alignItems:"center" }}>
          <div style={{ textAlign:"center", paddingRight:24, borderRight:"1px solid rgba(124,58,237,.08)" }}>
            <ScoreRing score={score.score} size={90}/>
            <div style={{ fontSize:11, color:"#a89dc8", marginTop:6, fontWeight:600, textTransform:"uppercase", letterSpacing:".5px" }}>Overall Score</div>
          </div>
          {Object.entries(score.breakdown || {}).map(([intg, s]) => {
            const cfg = INTG_CFG[intg] || {};
            const color = s >= 80 ? "#16a34a" : s >= 60 ? "#d97706" : "#e11d48";
            return (
              <div key={intg} style={{ textAlign:"center" }}>
                <div style={{ fontSize:24, marginBottom:4 }}>{cfg.icon}</div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color, marginBottom:2 }}>{s}%</div>
                <div style={{ fontSize:11, color:"#a89dc8", textTransform:"uppercase", letterSpacing:".5px" }}>{cfg.label}</div>
              </div>
            );
          })}
          <div style={{ textAlign:"center" }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color:"#e11d48", marginBottom:2 }}>{score.critical_failures || 0}</div>
            <div style={{ fontSize:11, color:"#a89dc8", textTransform:"uppercase", letterSpacing:".5px" }}>Critical Fails</div>
          </div>
        </div>
      )}

      {/* Stats row */}
      {summary && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
          {[
            { label:"Total Checks", value:summary.total||0, color:"#7c3aed" },
            { label:"Passing", value:summary.passed||0, color:"#16a34a" },
            { label:"Failing", value:summary.failed||0, color:"#e11d48" },
            { label:"Warnings", value:summary.warning||0, color:"#d97706" },
          ].map(s => (
            <div key={s.label} style={{ background:"#fff", border:"1px solid rgba(124,58,237,.08)", borderRadius:12, padding:"16px 20px", position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${s.color},transparent)` }}/>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color:s.color, marginBottom:4 }}>{s.value}</div>
              <div style={{ fontSize:11, color:"#a89dc8", textTransform:"uppercase", letterSpacing:".5px" }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap", alignItems:"center" }}>
        <span style={{ fontSize:11, color:"#a89dc8", fontWeight:600 }}>FILTER:</span>
        {filterBtn("status","FAIL","❌ Failing")}
        {filterBtn("status","WARNING","⚠️ Warnings")}
        {filterBtn("status","PASS","✅ Passing")}
        <div style={{ width:1, height:16, background:"rgba(124,58,237,.12)", margin:"0 4px" }}/>
        {filterBtn("severity","CRITICAL","🔴 Critical")}
        {filterBtn("severity","HIGH","🟠 High")}
        {filterBtn("severity","MEDIUM","🟡 Medium")}
        <div style={{ width:1, height:16, background:"rgba(124,58,237,.12)", margin:"0 4px" }}/>
        {filterBtn("integration","aws","☁️ AWS")}
        {filterBtn("integration","github","🐙 GitHub")}
        {filterBtn("integration","okta","🔐 Okta")}
        {(filter.status||filter.severity||filter.integration) && (
          <button onClick={() => setFilter({status:"",severity:"",integration:""})} style={{ padding:"5px 12px", borderRadius:100, fontSize:11, fontWeight:600, cursor:"pointer", border:"1px solid rgba(225,29,72,.2)", background:"rgba(225,29,72,.05)", color:"#e11d48" }}>
            Clear filters
          </button>
        )}
      </div>

      {/* Results by category */}
      {loading ? (
        <div style={{ textAlign:"center", padding:60, color:"#a89dc8" }}><RefreshCw size={20} style={{ animation:"spin 1s linear infinite" }}/></div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {categories.map(cat => {
            const catResults = filtered.filter(r => r.category === cat);
            const catPassed = catResults.filter(r => r.status === "PASS").length;
            return (
              <div key={cat} style={{ background:"#fff", border:"1px solid rgba(124,58,237,.08)", borderRadius:14, overflow:"hidden" }}>
                <div style={{ padding:"14px 20px", background:"rgba(124,58,237,.02)", borderBottom:"1px solid rgba(124,58,237,.06)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:700, color:"#1a0a3a" }}>{cat}</div>
                  <div style={{ fontSize:12, color:"#6b5b9e" }}>{catPassed}/{catResults.length} passing</div>
                </div>
                {catResults.map(r => {
                  const st = STATUS_CFG[r.status] || STATUS_CFG.ERROR;
                  const StatusIcon = st.icon;
                  const isExpanded = expanded[r.id];
                  return (
                    <div key={r.id} onClick={() => setExpanded(e => ({ ...e, [r.id]: !e[r.id] }))} style={{ padding:"14px 20px", borderBottom:"1px solid rgba(124,58,237,.04)", cursor:"pointer", transition:"background .1s" }} onMouseEnter={e=>e.currentTarget.style.background="rgba(124,58,237,.02)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                        <StatusIcon size={16} color={st.color} style={{ flexShrink:0 }}/>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:13, fontWeight:600, color:"#1a0a3a", marginBottom:2 }}>{r.name}</div>
                          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                            <span style={{ fontSize:10, color:"#a89dc8" }}>{r.framework} · {r.control}</span>
                            {r.demo && <span style={{ fontSize:9, background:"rgba(124,58,237,.08)", color:"#7c3aed", borderRadius:4, padding:"1px 5px", fontWeight:700 }}>DEMO</span>}
                          </div>
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <span style={{ background:SEV_BG[r.severity]||"#f0edf8", color:SEV_COLOR[r.severity]||"#7c3aed", borderRadius:100, padding:"2px 8px", fontSize:10, fontWeight:700 }}>{r.severity}</span>
                          <span style={{ background:st.bg, color:st.color, borderRadius:100, padding:"2px 8px", fontSize:10, fontWeight:700 }}>{st.label}</span>
                          <ChevronRight size={14} color="#a89dc8" style={{ transform:isExpanded?"rotate(90deg)":"none", transition:"transform .15s" }}/>
                        </div>
                      </div>
                      {isExpanded && (
                        <div style={{ marginTop:12, paddingTop:12, borderTop:"1px dashed rgba(124,58,237,.1)" }} onClick={e=>e.stopPropagation()}>
                          <div style={{ fontSize:13, color:"#6b5b9e", marginBottom:r.remediation?12:0, lineHeight:1.6 }}>{r.details}</div>
                          {r.remediation && (
                            <div style={{ background:"rgba(225,29,72,.04)", border:"1px solid rgba(225,29,72,.12)", borderRadius:8, padding:"10px 14px" }}>
                              <div style={{ fontSize:11, fontWeight:700, color:"#e11d48", marginBottom:4, textTransform:"uppercase", letterSpacing:".5px" }}>Remediation</div>
                              <div style={{ fontSize:13, color:"#1a0a3a", lineHeight:1.6 }}>{r.remediation}</div>
                            </div>
                          )}
                          {r.evidence && Object.keys(r.evidence).length > 0 && (
                            <div style={{ marginTop:10, background:"rgba(124,58,237,.03)", border:"1px solid rgba(124,58,237,.1)", borderRadius:8, padding:"8px 12px" }}>
                              <div style={{ fontSize:11, fontWeight:700, color:"#7c3aed", marginBottom:4, textTransform:"uppercase", letterSpacing:".5px" }}>Evidence</div>
                              <pre style={{ fontSize:11, color:"#6b5b9e", overflowX:"auto", margin:0, fontFamily:"'JetBrains Mono',monospace" }}>{JSON.stringify(r.evidence,null,2)}</pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ textAlign:"center", padding:60, color:"#a89dc8" }}>
              <Shield size={40} style={{ opacity:.3, marginBottom:12 }}/>
              <div style={{ fontSize:14 }}>No results match current filters</div>
            </div>
          )}
        </div>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

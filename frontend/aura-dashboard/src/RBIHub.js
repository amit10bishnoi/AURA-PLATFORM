import { useState, useEffect, useCallback } from "react";
import { Shield, RefreshCw, AlertTriangle, Download } from "lucide-react";
const API = "http://localhost:8001";
const STATUS = {
  IMPLEMENTED: { color:"#16a34a", bg:"rgba(22,163,74,.08)", label:"Implemented", icon:"✓" },
  IN_PROGRESS:  { color:"#d97706", bg:"rgba(217,119,6,.08)", label:"In Progress",  icon:"◔" },
  NOT_STARTED:  { color:"#e11d48", bg:"rgba(225,29,72,.08)", label:"Not Started",  icon:"○" },
};
const PRI = { CRITICAL:"#e11d48", HIGH:"#ea580c", MEDIUM:"#d97706", LOW:"#16a34a" };

function ScoreRing({ score, size=100 }) {
  const r=40, circ=2*Math.PI*r, offset=circ-(score/100)*circ;
  const color = score>=80?"#16a34a":score>=60?"#d97706":"#e11d48";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(124,58,237,.1)" strokeWidth="8"/>
      <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform="rotate(-90 50 50)" style={{transition:"stroke-dashoffset 1.2s"}}/>
      <text x="50" y="47" textAnchor="middle" fontSize="18" fontWeight="800"
        fontFamily="'Syne',sans-serif" fill={color}>{score}%</text>
      <text x="50" y="60" textAnchor="middle" fontSize="7" fill="#a89dc8">RBI READY</text>
    </svg>
  );
}

export default function RBIHub({ token, tenantId }) {
  const [tab, setTab] = useState("overview");
  const [controls, setControls] = useState([]);
  const [summary, setSummary] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [certIn, setCertIn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, rRes, ciRes] = await Promise.all([
        fetch(`${API}/api/rbi/controls?tenant_id=${tenantId||"demo"}`, { headers:{ Authorization:`Bearer ${token}` } }),
        fetch(`${API}/api/rbi/readiness?tenant_id=${tenantId||"demo"}`, { headers:{ Authorization:`Bearer ${token}` } }),
        fetch(`${API}/api/rbi/cert-in?tenant_id=${tenantId||"demo"}`, { headers:{ Authorization:`Bearer ${token}` } }),
      ]);
      const cData = await cRes.json();
      const rData = await rRes.json();
      const ciData = await ciRes.json();
      setControls(cData.controls || []);
      setSummary(cData.summary || {});
      setReadiness(rData);
      setCertIn(ciData);
    } catch(e) { console.error(e); }
    setLoading(false);
  }, [token, tenantId]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const tabBtn = (id, label) => (
    <button onClick={() => setTab(id)} style={{ padding:"8px 18px", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", border:"1px solid", borderColor:tab===id?"rgba(124,58,237,.3)":"rgba(124,58,237,.1)", background:tab===id?"rgba(124,58,237,.1)":"#fff", color:tab===id?"#7c3aed":"#6b5b9e" }}>
      {label}
    </button>
  );

  const frameworks = [...new Set(controls.map(c => c.framework))];

  return (
    <div style={{ padding:"28px 32px" }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
            <div style={{ background:"linear-gradient(135deg,#d97706,#ea580c)", borderRadius:8, padding:"4px 12px", fontSize:11, fontWeight:700, color:"#fff" }}>RBI COMPLIANCE</div>
            {readiness && (
              <div style={{ background:`${readiness.color}14`, color:readiness.color, border:`1px solid ${readiness.color}30`, borderRadius:6, padding:"3px 10px", fontSize:11, fontWeight:700 }}>
                {readiness.label}
              </div>
            )}
          </div>
          <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:800, color:"#1a0a3a", marginBottom:4 }}>RBI Compliance Center</h2>
          <p style={{ color:"#a89dc8", fontSize:13 }}>RBI Cyber Security Framework · IT Governance · Digital Lending · CERT-In Directions 2022</p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={fetch_} style={{ padding:"9px 16px", background:"#fff", border:"1px solid rgba(124,58,237,.15)", borderRadius:9, color:"#7c3aed", fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
            <RefreshCw size={14}/>Refresh
          </button>
          <button style={{ padding:"9px 18px", background:"linear-gradient(135deg,#d97706,#ea580c)", border:"none", borderRadius:9, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
            <Download size={14}/>RBI Report
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:8, marginBottom:24 }}>
        {tabBtn("overview","🏛️ Overview")}
        {tabBtn("controls","📋 Controls")}
        {tabBtn("cert-in","⚡ CERT-In")}
        {tabBtn("reporting","🚨 Incident Reporting")}
      </div>

      {loading && (
        <div style={{ textAlign:"center", padding:60, color:"#a89dc8" }}>
          <RefreshCw size={20} style={{ animation:"spin 1s linear infinite" }}/>
        </div>
      )}

      {/* Overview Tab */}
      {!loading && tab==="overview" && readiness && summary && (
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"auto 1fr 1fr 1fr 1fr", gap:20, marginBottom:24, background:"#fff", border:"1px solid rgba(124,58,237,.1)", borderRadius:18, padding:28, alignItems:"center" }}>
            <div style={{ paddingRight:24, borderRight:"1px solid rgba(124,58,237,.08)" }}>
              <ScoreRing score={readiness.score||0}/>
            </div>
            {[
              { label:"Implemented", value:summary.implemented||0, color:"#16a34a" },
              { label:"In Progress",  value:summary.in_progress||0, color:"#d97706" },
              { label:"Not Started",  value:summary.not_started||0, color:"#e11d48" },
              { label:"CERT-In Score",value:`${certIn?.score||0}%`, color:"#7c3aed" },
            ].map(s => (
              <div key={s.label} style={{ textAlign:"center" }}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:32, fontWeight:800, color:s.color }}>{s.value}</div>
                <div style={{ fontSize:11, color:"#a89dc8", textTransform:"uppercase", letterSpacing:".5px", marginTop:4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:20 }}>
            {[
              { fw:"RBI CSF 2016",       desc:"Cyber Security Framework", color:"#d97706" },
              { fw:"RBI IT Governance",  desc:"IT Governance Guidelines",  color:"#7c3aed" },
              { fw:"RBI Digital Lending",desc:"Digital Lending Guidelines",color:"#0891b2" },
            ].map(f => {
              const fwControls = controls.filter(c => c.framework===f.fw);
              const done = fwControls.filter(c => c.status==="IMPLEMENTED").length;
              const pct = fwControls.length ? Math.round(done/fwControls.length*100) : 0;
              return (
                <div key={f.fw} onClick={() => setTab("controls")} style={{ background:"#fff", border:`1px solid ${f.color}20`, borderRadius:14, padding:20, cursor:"pointer", position:"relative", overflow:"hidden", transition:"all .2s" }} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"} onMouseLeave={e=>e.currentTarget.style.transform="none"}>
                  <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:f.color }}/>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, color:"#1a0a3a", marginBottom:4 }}>{f.fw}</div>
                  <div style={{ fontSize:12, color:"#a89dc8", marginBottom:12 }}>{f.desc}</div>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                    <span style={{ fontSize:11, color:"#6b5b9e" }}>{done}/{fwControls.length} done</span>
                    <span style={{ fontSize:16, fontWeight:800, color:f.color }}>{pct}%</span>
                  </div>
                  <div style={{ height:5, background:`${f.color}15`, borderRadius:2, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${pct}%`, background:f.color, borderRadius:2, transition:"width 1s" }}/>
                  </div>
                </div>
              );
            })}
          </div>

          {readiness.critical_gaps?.length > 0 && (
            <div style={{ background:"rgba(225,29,72,.04)", border:"1px solid rgba(225,29,72,.15)", borderRadius:14, padding:20 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                <AlertTriangle size={16} color="#e11d48"/>
                <span style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:700, color:"#1a0a3a" }}>Critical RBI Gaps — Must Fix Immediately</span>
              </div>
              {readiness.critical_gaps.map(gap => (
                <div key={gap.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", background:"#fff", borderRadius:8, marginBottom:8, border:"1px solid rgba(225,29,72,.1)" }}>
                  <div>
                    <div style={{ fontSize:12, fontWeight:600, color:"#1a0a3a" }}>{gap.name}</div>
                    <div style={{ fontSize:10, color:"#a89dc8" }}>{gap.category} · {gap.id}</div>
                  </div>
                  <button onClick={() => setTab("controls")} style={{ padding:"5px 12px", background:"rgba(225,29,72,.08)", border:"1px solid rgba(225,29,72,.2)", borderRadius:6, color:"#e11d48", fontSize:11, fontWeight:600, cursor:"pointer" }}>Fix →</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Controls Tab */}
      {!loading && tab==="controls" && (
        <div>
          {frameworks.map(fw => (
            <div key={fw} style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#7c3aed", textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>{fw}</div>
              {controls.filter(c => c.framework===fw).map(c => {
                const st = STATUS[c.status] || STATUS.NOT_STARTED;
                return (
                  <div key={c.id} onClick={() => setExpanded(e => ({...e,[c.id]:!e[c.id]}))} style={{ background:"#fff", border:"1px solid rgba(124,58,237,.08)", borderRadius:10, padding:"12px 16px", cursor:"pointer", marginBottom:4, transition:"border-color .15s" }} onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(124,58,237,.2)"} onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(124,58,237,.08)"}>
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"#a89dc8", minWidth:90 }}>{c.id}</span>
                      <div style={{ flex:1, fontSize:13, fontWeight:500, color:"#1a0a3a" }}>{c.name}</div>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:9, fontWeight:700, color:PRI[c.priority], background:`${PRI[c.priority]}14`, borderRadius:4, padding:"1px 6px" }}>{c.priority}</span>
                        <span style={{ background:st.bg, color:st.color, borderRadius:100, padding:"3px 10px", fontSize:11, fontWeight:700, minWidth:90, textAlign:"center" }}>{st.icon} {st.label}</span>
                      </div>
                    </div>
                    {expanded[c.id] && (
                      <div style={{ marginTop:12, paddingTop:12, borderTop:"1px dashed rgba(124,58,237,.1)", display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                        <div><div style={{ fontSize:10, color:"#a89dc8", marginBottom:3, textTransform:"uppercase" }}>Owner</div><div style={{ fontSize:13, color:"#1a0a3a", fontWeight:500 }}>{c.owner}</div></div>
                        <div><div style={{ fontSize:10, color:"#a89dc8", marginBottom:3, textTransform:"uppercase" }}>Category</div><div style={{ fontSize:13, color:"#1a0a3a", fontWeight:500 }}>{c.category}</div></div>
                        <div><div style={{ fontSize:10, color:"#a89dc8", marginBottom:3, textTransform:"uppercase" }}>Evidence</div><div style={{ fontSize:13, color:"#1a0a3a", fontWeight:500 }}>{c.evidence_count} items</div></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* CERT-In Tab */}
      {!loading && tab==="cert-in" && certIn && (
        <div>
          <div style={{ background:"rgba(124,58,237,.04)", border:"1px solid rgba(124,58,237,.12)", borderRadius:12, padding:"14px 18px", marginBottom:20, fontSize:13, color:"#6b5b9e" }}>
            CERT-In Directions 2022 — All organisations with digital presence in India must comply. Non-compliance carries criminal liability.
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:20 }}>
            {[
              { label:"Requirements",  value:certIn.total,         color:"#7c3aed" },
              { label:"Implemented",   value:certIn.implemented,   color:"#16a34a" },
              { label:"CERT-In Score", value:`${certIn.score}%`,   color:certIn.score>=80?"#16a34a":certIn.score>=60?"#d97706":"#e11d48" },
            ].map(s => (
              <div key={s.label} style={{ background:"#fff", border:"1px solid rgba(124,58,237,.08)", borderRadius:12, padding:"16px 20px" }}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color:s.color }}>{s.value}</div>
                <div style={{ fontSize:11, color:"#a89dc8", textTransform:"uppercase", letterSpacing:".5px" }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {certIn.requirements?.map(r => {
              const st = STATUS[r.status] || STATUS.NOT_STARTED;
              return (
                <div key={r.id} style={{ background:"#fff", border:"1px solid rgba(124,58,237,.08)", borderRadius:12, padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:"#1a0a3a", marginBottom:4 }}>{r.name}</div>
                    <div style={{ display:"flex", gap:12 }}>
                      <span style={{ fontSize:11, color:"#a89dc8" }}>Owner: {r.owner}</span>
                      <span style={{ fontSize:11, color:"#a89dc8" }}>Deadline: {r.deadline}</span>
                    </div>
                  </div>
                  <span style={{ background:st.bg, color:st.color, borderRadius:100, padding:"4px 12px", fontSize:11, fontWeight:700, flexShrink:0 }}>{st.icon} {st.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Incident Reporting Tab */}
      {!loading && tab==="reporting" && (
        <div>
          <div style={{ background:"rgba(225,29,72,.04)", border:"1px solid rgba(225,29,72,.15)", borderRadius:12, padding:"14px 18px", marginBottom:20, display:"flex", gap:12, alignItems:"center" }}>
            <AlertTriangle size={16} color="#e11d48"/>
            <span style={{ fontSize:13, color:"#1a0a3a" }}><strong>Mandatory:</strong> Cyber incidents must be reported to RBI within 2–6 hours and CERT-In within 6 hours. Failure carries criminal liability under IT Act 2000.</span>
          </div>
          <div style={{ background:"#fff", border:"1px solid rgba(124,58,237,.1)", borderRadius:14, padding:22, marginBottom:16 }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, color:"#1a0a3a", marginBottom:16 }}>📞 Emergency Contacts</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              {[
                { name:"RBI CISO",           contact:"chiefgm@rbi.org.in",      type:"Email", when:"All cyber incidents" },
                { name:"CERT-In Hotline",    contact:"+91-1800-11-4949",         type:"Phone", when:"Within 6 hours" },
                { name:"CERT-In Email",      contact:"incident@cert-in.org.in",  type:"Email", when:"Structured incident report" },
                { name:"RBI Cybercrime",     contact:"cybercrime.gov.in",        type:"Web",   when:"FIR + regulatory report" },
              ].map((contact, i) => (
                <div key={i} style={{ background:"rgba(124,58,237,.04)", border:"1px solid rgba(124,58,237,.1)", borderRadius:10, padding:"14px 16px" }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"#1a0a3a", marginBottom:4 }}>{contact.name}</div>
                  <div style={{ fontSize:13, color:"#7c3aed", fontFamily:"'JetBrains Mono',monospace", marginBottom:4 }}>{contact.contact}</div>
                  <div style={{ fontSize:10, color:"#a89dc8" }}>{contact.type} · {contact.when}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background:"#fff", border:"1px solid rgba(124,58,237,.1)", borderRadius:14, padding:22 }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, color:"#1a0a3a", marginBottom:16 }}>⏱️ Reporting Timeline</div>
            {[
              { time:"0–2 hrs",     action:"Detect, contain, assess severity and scope",                                           color:"#e11d48" },
              { time:"2–6 hrs",     action:"Report to RBI CISO via email. Report to CERT-In via portal/email.",                   color:"#ea580c" },
              { time:"6–24 hrs",    action:"Submit structured incident report. File FIR if fraud involved.",                       color:"#d97706" },
              { time:"24–72 hrs",   action:"Submit detailed forensic report. Begin root cause analysis.",                          color:"#16a34a" },
              { time:"Post-incident",action:"Submit final report with remediation actions taken.",                                 color:"#7c3aed" },
            ].map((r, i) => (
              <div key={i} style={{ display:"flex", gap:16, alignItems:"flex-start", marginBottom:12 }}>
                <div style={{ minWidth:70, background:`${r.color}14`, color:r.color, borderRadius:6, padding:"4px 8px", fontSize:10, fontWeight:700, textAlign:"center", flexShrink:0 }}>{r.time}</div>
                <div style={{ fontSize:13, color:"#1a0a3a", paddingTop:4 }}>{r.action}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

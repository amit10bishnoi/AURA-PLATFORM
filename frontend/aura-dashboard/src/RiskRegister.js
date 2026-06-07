import { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle, RefreshCw, Plus, X, Shield, TrendingUp,
  TrendingDown, Siren, ListChecks, Activity, ChevronDown,
  ChevronUp, ArrowUpDown, Calendar, User, Tag, Flame
} from "lucide-react";

const API = "http://localhost:8000";

/* ─── Design tokens — matches DarkSidebar/DarkOverview dark system ─── */
const T = {
  bg:       "#09090F",
  surface:  "#111118",
  surface2: "#16161F",
  border:   "rgba(255,255,255,0.06)",
  borderHi: "rgba(139,92,246,0.3)",
  accent:   "#8b5cf6",
  accent2:  "#a78bfa",
  text:     "#E2E8F0",
  muted:    "#64748B",
  muted2:   "#94A3B8",
  mono:     "'JetBrains Mono', ui-monospace, monospace",
  display:  "'Syne', sans-serif",
  body:     "'DM Sans', sans-serif",
  red:      "#EF4444",
  orange:   "#F97316",
  amber:    "#F59E0B",
  green:    "#10B981",
  blue:     "#3B82F6",
  purple:   "#8B5CF6",
};

/* ─── Risk severity colors ─── */
const SEV_COLOR = {
  CRITICAL: { text: "#EF4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.2)" },
  HIGH:     { text: "#F97316", bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.2)" },
  MEDIUM:   { text: "#F59E0B", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.2)" },
  LOW:      { text: "#10B981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.2)" },
};

const SCORE_COLOR = (s) => {
  if (s >= 20) return T.red;
  if (s >= 15) return T.orange;
  if (s >= 10) return T.amber;
  return T.green;
};

/* ─── Framework badge colors ─── */
const FW_COLORS = {
  "ISO 27001": { bg: "rgba(139,92,246,0.15)", text: "#a78bfa", border: "rgba(139,92,246,0.25)" },
  "SOC 2":     { bg: "rgba(16,185,129,0.12)", text: "#34d399", border: "rgba(16,185,129,0.2)" },
  "RBI":       { bg: "rgba(59,130,246,0.12)", text: "#60a5fa", border: "rgba(59,130,246,0.2)" },
  "DPDP":      { bg: "rgba(244,114,182,0.12)", text: "#f472b6", border: "rgba(244,114,182,0.2)" },
  "CERT-In":   { bg: "rgba(245,158,11,0.12)", text: "#fbbf24", border: "rgba(245,158,11,0.2)" },
};

/* ─── Demo data matching Figma ─── */
const DEMO_RISKS = [
  { id:"RSK-001", title:"Unpatched critical CVEs in production", category:"Vulnerability", framework:"ISO 27001", likelihood:4, impact:5, score:20, owner:"Priya Nair",    status:"Open",       due:"2024-01-15", description:"Critical CVEs found in lodash, axios, and other production dependencies. Exploitable remotely." },
  { id:"RSK-002", title:"Third-party vendor data breach",        category:"Supply Chain", framework:"SOC 2",     likelihood:3, impact:5, score:15, owner:"Arjun Mehta",   status:"Mitigating", due:"2024-02-01", description:"Key SaaS vendor lacks SOC 2 Type II certification. Risk of cascading data exposure." },
  { id:"RSK-004", title:"DPDP Act non-compliance penalty",        category:"Regulatory",   framework:"DPDP",      likelihood:3, impact:4, score:12, owner:"Rahul Sharma",  status:"Mitigating", due:"2024-03-01", description:"Data fiduciary obligations under DPDP Act 2023 not fully implemented. Penalty up to ₹250Cr." },
  { id:"RSK-005", title:"Open SSH port on production security group", category:"Technical", framework:"ISO 27001", likelihood:5, impact:4, score:20, owner:"IT Team",      status:"Open",       due:"2024-01-20", description:"Port 22 exposed to 0.0.0.0/0 on production AWS security group. Active exploitation risk." },
  { id:"RSK-006", title:"No DPO appointed for DPDP compliance",  category:"Regulatory",   framework:"DPDP",      likelihood:4, impact:5, score:25, owner:"Legal Team",   status:"Open",       due:"2024-01-10", description:"DPDP Act mandates appointment of Data Protection Officer. Non-compliance = penalty." },
  { id:"RSK-007", title:"PaymentGateway Pro questionnaire overdue", category:"Third Party", framework:"SOC 2",    likelihood:3, impact:3, score:9,  owner:"Procurement",  status:"Open",       due:"2024-02-15", description:"Annual vendor risk assessment overdue by 45 days for key payment gateway partner." },
  { id:"RSK-008", title:"Critical dependency vulnerabilities (lodash)", category:"Technical", framework:"ISO 27001", likelihood:3, impact:4, score:12, owner:"Engineering", status:"Open",       due:"2024-01-25", description:"Lodash 4.17.19 has CRITICAL CVE. Affects 3 production microservices." },
  { id:"RSK-009", title:"Insufficient audit logging for RBI compliance", category:"Regulatory", framework:"RBI",   likelihood:2, impact:3, score:6,  owner:"Compliance",   status:"Mitigating", due:"2024-03-15", description:"RBI IT Gov framework requires 180-day audit log retention. Current setup: 30 days." },
];

const RISK_SUMMARY = {
  critical: DEMO_RISKS.filter(r => r.score >= 20).length,
  high:     DEMO_RISKS.filter(r => r.score >= 12 && r.score < 20).length,
  medium:   DEMO_RISKS.filter(r => r.score >= 6  && r.score < 12).length,
  low:      DEMO_RISKS.filter(r => r.score < 6).length,
};

/* ─── 5×5 Risk Matrix data ─── */
const buildMatrix = (risks) => {
  const m = {};
  risks.forEach(r => {
    const key = `${r.likelihood}-${r.impact}`;
    if (!m[key]) m[key] = [];
    m[key].push(r);
  });
  return m;
};

const MATRIX_CELL_COLOR = (likelihood, impact) => {
  const score = likelihood * impact;
  if (score >= 20) return { bg: "rgba(239,68,68,0.25)", text: "#EF4444", border: "rgba(239,68,68,0.4)" };
  if (score >= 12) return { bg: "rgba(249,115,22,0.2)", text: "#F97316", border: "rgba(249,115,22,0.3)" };
  if (score >= 8)  return { bg: "rgba(245,158,11,0.18)", text: "#F59E0B", border: "rgba(245,158,11,0.3)" };
  if (score >= 4)  return { bg: "rgba(34,197,94,0.15)", text: "#22C55E", border: "rgba(34,197,94,0.25)" };
  return { bg: "rgba(100,116,139,0.12)", text: "#64748B", border: "rgba(100,116,139,0.15)" };
};

/* ─── Empty form state ─── */
const EMPTY = { title:"", category:"Technical", framework:"ISO 27001", likelihood:1, impact:1, owner:"", status:"Open", due:"", description:"" };

/* ─── Status pill ─── */
function StatusPill({ status }) {
  const map = {
    Open:       { bg:"rgba(239,68,68,0.12)",  text:"#EF4444", dot:"#EF4444" },
    Mitigating: { bg:"rgba(245,158,11,0.12)", text:"#F59E0B", dot:"#F59E0B" },
    Closed:     { bg:"rgba(16,185,129,0.12)", text:"#10B981", dot:"#10B981" },
    Accepted:   { bg:"rgba(139,92,246,0.12)", text:"#8B5CF6", dot:"#8B5CF6" },
  };
  const c = map[status] || map.Open;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5,
      background:c.bg, color:c.text,
      border:`1px solid ${c.text}30`,
      borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:600,
      fontFamily:T.mono, letterSpacing:"0.02em"
    }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:c.dot, display:"inline-block" }}/>
      {status}
    </span>
  );
}

/* ─── Framework badge ─── */
function FwBadge({ fw }) {
  const c = FW_COLORS[fw] || FW_COLORS["ISO 27001"];
  return (
    <span style={{
      background:c.bg, color:c.text, border:`1px solid ${c.border}`,
      borderRadius:6, padding:"2px 8px", fontSize:11, fontWeight:700,
      fontFamily:T.mono, whiteSpace:"nowrap"
    }}>
      {fw}
    </span>
  );
}

/* ─── 5×5 Risk Matrix ─── */
function RiskMatrix({ risks }) {
  const matrix = buildMatrix(risks);
  const [hovered, setHovered] = useState(null);
  const rowLabels = ["Negligible","Rare","Unlikely","Possible","Likely","Almost"];
  const colLabels = ["","Negligible","Low","Medium","High","Critical"];

  return (
    <div style={{ fontFamily:T.body }}>
      {/* Column headers */}
      <div style={{ display:"flex", marginBottom:4 }}>
        <div style={{ width:72, flexShrink:0 }}/>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{
            flex:1, textAlign:"center", fontSize:10, color:T.muted,
            fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", paddingBottom:4
          }}>
            {colLabels[i]}
          </div>
        ))}
      </div>
      {/* Rows — likelihood 5→1 */}
      {[5,4,3,2,1].map(likelihood => (
        <div key={likelihood} style={{ display:"flex", marginBottom:3, alignItems:"center" }}>
          {/* Row label */}
          <div style={{ width:72, flexShrink:0, fontSize:10, color:T.muted, fontWeight:600,
            textTransform:"uppercase", letterSpacing:"0.06em", textAlign:"right", paddingRight:10
          }}>
            {rowLabels[likelihood]}
          </div>
          {[1,2,3,4,5].map(impact => {
            const key = `${likelihood}-${impact}`;
            const items = matrix[key] || [];
            const colors = MATRIX_CELL_COLOR(likelihood, impact);
            const isHov = hovered === key;
            return (
              <div
                key={impact}
                onMouseEnter={() => setHovered(key)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  flex:1, aspectRatio:"1", margin:"0 2px",
                  background: isHov ? colors.bg.replace("0.25","0.4") : colors.bg,
                  border:`1px solid ${isHov ? colors.border : "transparent"}`,
                  borderRadius:6,
                  display:"flex", flexDirection:"column",
                  alignItems:"center", justifyContent:"center",
                  transition:"all 0.15s ease",
                  cursor: items.length ? "pointer" : "default",
                  position:"relative",
                  minHeight:52,
                }}
              >
                <span style={{ fontSize:9, color:colors.text, fontWeight:600, opacity:0.6,
                  fontFamily:T.mono, position:"absolute", top:4, left:5 }}>
                  {likelihood}×{impact}
                </span>
                {items.length > 0 && (
                  <div style={{
                    width:22, height:22, borderRadius:"50%",
                    background:colors.text, color:"#fff",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:11, fontWeight:800, fontFamily:T.mono
                  }}>
                    {items.length}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
      {/* X-axis label */}
      <div style={{ marginLeft:72, display:"flex", justifyContent:"center",
        fontSize:10, color:T.muted, marginTop:6, letterSpacing:"0.08em",
        textTransform:"uppercase", fontWeight:600, gap:4, alignItems:"center"
      }}>
        ← Likelihood →
      </div>
    </div>
  );
}

/* ─── Main component ─── */
export default function RiskRegister({ token, tenantId }) {
  const [tab, setTab]           = useState("register");
  const [risks, setRisks]       = useState(DEMO_RISKS);
  const [loading, setLoading]   = useState(false);
  const [showAdd, setShowAdd]   = useState(false);
  const [form, setForm]         = useState(EMPTY);
  const [sortCol, setSortCol]   = useState("score");
  const [sortAsc, setSortAsc]   = useState(false);
  const [fwFilter, setFwFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  /* ─── Fetch live data if backend available ─── */
  const fetchRisks = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(`${API}/api/risk/register?tenant_id=${tenantId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data?.risks?.length) setRisks(data.risks);
      }
    } catch {}
    finally { setLoading(false); }
  }, [token, tenantId]);

  useEffect(() => { fetchRisks(); }, [fetchRisks]);

  /* ─── Sort ─── */
  const toggleSort = (col) => {
    if (sortCol === col) setSortAsc(!sortAsc);
    else { setSortCol(col); setSortAsc(false); }
  };

  /* ─── Filtered + sorted risks ─── */
  const visibleRisks = [...risks]
    .filter(r => fwFilter === "All" || r.framework === fwFilter)
    .filter(r => statusFilter === "All" || r.status === statusFilter)
    .sort((a,b) => {
      const av = a[sortCol], bv = b[sortCol];
      if (typeof av === "number") return sortAsc ? av-bv : bv-av;
      return sortAsc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });

  /* ─── Add risk ─── */
  const handleAdd = async (e) => {
    e.preventDefault();
    const newRisk = {
      ...form,
      id: `RSK-${String(risks.length+1).padStart(3,"0")}`,
      score: form.likelihood * form.impact,
      likelihood: Number(form.likelihood),
      impact: Number(form.impact),
    };
    setRisks(prev => [newRisk, ...prev]);
    setShowAdd(false);
    setForm(EMPTY);
    if (token) {
      try {
        await fetch(`${API}/api/risk/register`, {
          method:"POST",
          headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
          body: JSON.stringify({ ...newRisk, tenant_id:tenantId }),
        });
      } catch {}
    }
  };

  const statsCards = [
    { label:"Risk Score", value:`${risks.reduce((a,r)=>a+r.score,0)/risks.length|0}/25`, color:T.orange },
    { label:"Open Risks", value:risks.filter(r=>r.status==="Open").length, color:T.red },
    { label:"Critical",   value:RISK_SUMMARY.critical, color:T.red },
    { label:"High Risks", value:RISK_SUMMARY.high,  color:T.orange },
    { label:"Total Exposure", value:"₹422Cr",         color:T.purple },
  ];

  const fwOptions = ["All", "ISO 27001", "SOC 2", "RBI", "DPDP", "CERT-In"];
  const statusOptions = ["All", "Open", "Mitigating", "Closed", "Accepted"];

  return (
    <div style={{ background:T.bg, minHeight:"100vh", color:T.text, fontFamily:T.body, padding:"28px 32px" }}>

      {/* ─── Header ─── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
        marginBottom:24, flexWrap:"wrap", gap:16 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
            <div style={{
              width:36, height:36, borderRadius:10,
              background:"rgba(239,68,68,0.12)", border:"1px solid rgba(239,68,68,0.2)",
              display:"flex", alignItems:"center", justifyContent:"center"
            }}>
              <AlertTriangle size={18} color={T.red}/>
            </div>
            <h1 style={{ margin:0, fontFamily:T.display, fontSize:22, fontWeight:800,
              color:T.text, letterSpacing:"-0.3px" }}>
              Risk Register
            </h1>
          </div>
          <p style={{ margin:0, fontSize:13, color:T.muted }}>
            4 open risks · 4 being mitigated
          </p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={fetchRisks} style={{
            display:"flex", alignItems:"center", gap:6, padding:"9px 16px",
            background:T.surface2, border:`1px solid ${T.border}`, borderRadius:10,
            color:T.muted2, fontSize:13, fontWeight:600, cursor:"pointer"
          }}>
            <RefreshCw size={14} style={{ animation: loading?"spin 1s linear infinite":"none" }}/> Refresh
          </button>
          <button onClick={() => setShowAdd(true)} style={{
            display:"flex", alignItems:"center", gap:6, padding:"9px 16px",
            background:"linear-gradient(135deg, #7c3aed, #8b5cf6)",
            border:"none", borderRadius:10, color:"#fff",
            fontSize:13, fontWeight:700, cursor:"pointer",
            boxShadow:"0 4px 16px rgba(139,92,246,0.3)"
          }}>
            <Plus size={14}/> Add risk
          </button>
        </div>
      </div>

      {/* ─── Stats Cards ─── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12, marginBottom:24 }}>
        {statsCards.map(({ label, value, color }) => (
          <div key={label} style={{
            background:T.surface, border:`1px solid ${T.border}`,
            borderRadius:12, padding:"16px 18px",
            borderTop:`2px solid ${color}40`
          }}>
            <div style={{ fontSize:24, fontWeight:800, color, fontFamily:T.mono, letterSpacing:"-0.5px" }}>
              {value}
            </div>
            <div style={{ fontSize:11, color:T.muted, fontWeight:600, marginTop:3,
              textTransform:"uppercase", letterSpacing:"0.08em" }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* ─── Tabs ─── */}
      <div style={{ display:"flex", gap:0, borderBottom:`1px solid ${T.border}`, marginBottom:24 }}>
        {[
          { id:"register", label:"Risk Register", Icon:ListChecks },
          { id:"matrix",   label:"Risk Matrix",   Icon:Shield },
          { id:"trends",   label:"Trends",        Icon:TrendingUp },
        ].map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setTab(id)} style={{
            display:"flex", alignItems:"center", gap:7, padding:"11px 18px",
            background:"none", border:"none", borderBottom: tab===id ? `2px solid ${T.accent}` : "2px solid transparent",
            color: tab===id ? T.accent : T.muted,
            fontFamily:T.body, fontSize:13, fontWeight:600, cursor:"pointer",
            transition:"all 0.15s ease", marginBottom:-1,
          }}>
            <Icon size={14}/>{label}
          </button>
        ))}
      </div>

      {/* ═══ TAB: RISK REGISTER (table) ═══ */}
      {tab === "register" && (
        <>
          {/* Filters */}
          <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
            {fwOptions.map(fw => (
              <button key={fw} onClick={() => setFwFilter(fw)} style={{
                padding:"5px 14px", borderRadius:20,
                background: fwFilter===fw ? T.accent : T.surface,
                border: fwFilter===fw ? `1px solid ${T.accent}` : `1px solid ${T.border}`,
                color: fwFilter===fw ? "#fff" : T.muted2,
                fontSize:12, fontWeight:600, cursor:"pointer", transition:"all 0.15s"
              }}>{fw}</button>
            ))}
            <div style={{ marginLeft:"auto", display:"flex", gap:6 }}>
              {statusOptions.map(s => (
                <button key={s} onClick={() => setStatusFilter(s)} style={{
                  padding:"5px 14px", borderRadius:20,
                  background: statusFilter===s ? "rgba(139,92,246,0.15)" : T.surface,
                  border: statusFilter===s ? `1px solid ${T.accent}40` : `1px solid ${T.border}`,
                  color: statusFilter===s ? T.accent2 : T.muted,
                  fontSize:12, fontWeight:600, cursor:"pointer", transition:"all 0.15s"
                }}>{s}</button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div style={{
            background:T.surface, border:`1px solid ${T.border}`,
            borderRadius:14, overflow:"hidden"
          }}>
            {/* Table head */}
            <div style={{
              display:"grid",
              gridTemplateColumns:"80px 1fr 110px 110px 90px 70px 80px 130px 110px 100px",
              padding:"10px 16px",
              borderBottom:`1px solid ${T.border}`,
              background:T.surface2,
            }}>
              {[
                { label:"ID",         col:"id" },
                { label:"RISK",       col:"title" },
                { label:"CATEGORY",   col:"category" },
                { label:"FRAMEWORK",  col:"framework" },
                { label:"LIKELIHOOD", col:"likelihood" },
                { label:"IMPACT",     col:"impact" },
                { label:"SCORE",      col:"score" },
                { label:"OWNER",      col:"owner" },
                { label:"STATUS",     col:"status" },
                { label:"DUE",        col:"due" },
              ].map(({ label, col }) => (
                <div key={col}
                  onClick={() => toggleSort(col)}
                  style={{
                    fontSize:10, fontWeight:700, color:T.muted,
                    letterSpacing:"0.1em", textTransform:"uppercase",
                    cursor:"pointer", display:"flex", alignItems:"center", gap:4,
                    userSelect:"none"
                  }}
                >
                  {label}
                  {sortCol===col
                    ? (sortAsc ? <ChevronUp size={10}/> : <ChevronDown size={10}/>)
                    : <ArrowUpDown size={9} style={{ opacity:0.3 }}/>}
                </div>
              ))}
            </div>

            {/* Rows */}
            {visibleRisks.map((r, i) => (
              <div key={r.id} style={{
                display:"grid",
                gridTemplateColumns:"80px 1fr 110px 110px 90px 70px 80px 130px 110px 100px",
                padding:"14px 16px",
                borderBottom: i < visibleRisks.length-1 ? `1px solid ${T.border}` : "none",
                alignItems:"center",
                transition:"background 0.12s",
                cursor:"default",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                {/* ID */}
                <div style={{ fontFamily:T.mono, fontSize:11, color:T.muted, fontWeight:600 }}>
                  {r.id}
                </div>

                {/* Risk title */}
                <div style={{ fontSize:13, fontWeight:600, color:T.text, paddingRight:16,
                  lineHeight:1.4, display:"-webkit-box", WebkitLineClamp:2,
                  WebkitBoxOrient:"vertical", overflow:"hidden"
                }}>
                  {r.title}
                </div>

                {/* Category */}
                <div style={{ fontSize:12, color:T.muted2 }}>{r.category}</div>

                {/* Framework badge */}
                <div><FwBadge fw={r.framework}/></div>

                {/* Likelihood */}
                <div style={{
                  fontSize:14, fontWeight:700, fontFamily:T.mono,
                  color: r.likelihood >= 4 ? T.red : r.likelihood >= 3 ? T.amber : T.green,
                  textAlign:"center"
                }}>
                  {r.likelihood}
                </div>

                {/* Impact */}
                <div style={{
                  fontSize:14, fontWeight:700, fontFamily:T.mono,
                  color: r.impact >= 5 ? T.red : r.impact >= 4 ? T.orange : T.amber,
                  textAlign:"center"
                }}>
                  {r.impact}
                </div>

                {/* Score */}
                <div>
                  <span style={{
                    fontFamily:T.mono, fontSize:15, fontWeight:800,
                    color: SCORE_COLOR(r.score),
                    background: `${SCORE_COLOR(r.score)}15`,
                    padding:"2px 10px", borderRadius:6,
                  }}>
                    {r.score}
                  </span>
                </div>

                {/* Owner */}
                <div style={{ fontSize:12, color:T.muted2, display:"flex", alignItems:"center", gap:5 }}>
                  <div style={{
                    width:22, height:22, borderRadius:"50%",
                    background:"rgba(139,92,246,0.2)", border:"1px solid rgba(139,92,246,0.3)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:9, fontWeight:700, color:T.accent2, flexShrink:0
                  }}>
                    {(r.owner||"?")[0].toUpperCase()}
                  </div>
                  <span style={{ fontSize:12 }}>{r.owner}</span>
                </div>

                {/* Status */}
                <div><StatusPill status={r.status}/></div>

                {/* Due date */}
                <div style={{ fontSize:11, color:T.muted, fontFamily:T.mono }}>
                  {r.due || "—"}
                </div>
              </div>
            ))}

            {visibleRisks.length === 0 && (
              <div style={{ padding:"40px 20px", textAlign:"center", color:T.muted }}>
                No risks match the current filters.
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══ TAB: RISK MATRIX ═══ */}
      {tab === "matrix" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:20 }}>

          {/* Left — Matrix */}
          <div style={{
            background:T.surface, border:`1px solid ${T.border}`,
            borderRadius:14, padding:24
          }}>
            <h3 style={{ margin:"0 0 20px", fontFamily:T.display, fontSize:17, fontWeight:800, color:T.text }}>
              Risk Matrix (5×5)
            </h3>
            <RiskMatrix risks={risks}/>

            {/* Legend */}
            <div style={{ display:"flex", gap:16, marginTop:20, flexWrap:"wrap" }}>
              {[
                { label:"Low",      color:"#22C55E" },
                { label:"Medium",   color:"#F59E0B" },
                { label:"High",     color:"#F97316" },
                { label:"Critical", color:"#EF4444" },
              ].map(({ label, color }) => (
                <div key={label} style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:T.muted2 }}>
                  <div style={{ width:12, height:12, borderRadius:3, background:`${color}30`, border:`1px solid ${color}50` }}/>
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Right — Risk Summary */}
          <div style={{
            background:T.surface, border:`1px solid ${T.border}`,
            borderRadius:14, padding:24
          }}>
            <h3 style={{ margin:"0 0 16px", fontFamily:T.display, fontSize:17, fontWeight:800, color:T.text }}>
              Risk summary
            </h3>
            {[
              { label:"Critical (score 20–25)", count:RISK_SUMMARY.critical, color:T.red },
              { label:"High (score 12–19)",     count:RISK_SUMMARY.high,     color:T.orange },
              { label:"Medium (score 6–11)",    count:RISK_SUMMARY.medium,   color:T.blue },
              { label:"Low (score 1–5)",        count:RISK_SUMMARY.low,      color:T.green },
            ].map(({ label, count, color }) => (
              <div key={label} style={{
                display:"flex", justifyContent:"space-between", alignItems:"center",
                padding:"14px 16px", marginBottom:8,
                background:T.surface2, border:`1px solid ${T.border}`,
                borderRadius:10
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:color }}/>
                  <span style={{ fontSize:13, color:T.muted2 }}>{label}</span>
                </div>
                <span style={{ fontFamily:T.mono, fontSize:18, fontWeight:800, color }}>
                  {count}
                </span>
              </div>
            ))}

            {/* Risk items mini list */}
            <div style={{ marginTop:24 }}>
              <h4 style={{ fontSize:12, fontWeight:700, color:T.muted, textTransform:"uppercase",
                letterSpacing:"0.1em", marginBottom:12 }}>Risk items</h4>
              {risks.slice(0,4).map(r => (
                <div key={r.id} style={{
                  display:"flex", justifyContent:"space-between", alignItems:"center",
                  padding:"10px 12px", marginBottom:6,
                  background:T.surface2, border:`1px solid ${T.border}`, borderRadius:8
                }}>
                  <div>
                    <div style={{ fontSize:12, fontWeight:600, color:T.text,
                      maxWidth:200, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"
                    }}>{r.title}</div>
                    <div style={{ fontSize:10, color:T.muted, marginTop:2 }}>
                      {r.owner} · {r.due}
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <FwBadge fw={r.framework}/>
                    <StatusPill status={r.status}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB: TRENDS ═══ */}
      {tab === "trends" && (
        <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:20 }}>
          <div style={{
            background:T.surface, border:`1px solid ${T.border}`,
            borderRadius:14, padding:24
          }}>
            <h3 style={{ margin:"0 0 20px", fontFamily:T.display, fontSize:17, fontWeight:800, color:T.text }}>
              Risk Score Trend
            </h3>
            {/* Simple bar chart */}
            <div style={{ display:"flex", alignItems:"flex-end", gap:8, height:140 }}>
              {[
                { month:"Jan", score:78 }, { month:"Feb", score:72 }, { month:"Mar", score:68 },
                { month:"Apr", score:75 }, { month:"May", score:65 }, { month:"Jun", score:63 },
                { month:"Jul", score:60 }, { month:"Aug", score:55 }, { month:"Sep", score:58 },
              ].map(({ month, score }) => (
                <div key={month} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                  <div style={{ fontSize:10, color:T.muted, fontFamily:T.mono }}>{score}</div>
                  <div style={{
                    width:"100%", height:`${(score/100)*120}px`,
                    background:`linear-gradient(180deg, ${T.accent} 0%, rgba(139,92,246,0.3) 100%)`,
                    borderRadius:"4px 4px 0 0",
                    border:`1px solid ${T.accent}40`
                  }}/>
                  <div style={{ fontSize:10, color:T.muted }}>{month}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{
            background:T.surface, border:`1px solid ${T.border}`,
            borderRadius:14, padding:24
          }}>
            <h3 style={{ margin:"0 0 16px", fontFamily:T.display, fontSize:17, fontWeight:800, color:T.text }}>
              By Category
            </h3>
            {[
              { cat:"Technical",   count:3, color:T.red },
              { cat:"Regulatory",  count:2, color:T.orange },
              { cat:"Third Party", count:2, color:T.amber },
              { cat:"Supply Chain",count:1, color:T.blue },
            ].map(({ cat, count, color }) => (
              <div key={cat} style={{ marginBottom:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between",
                  fontSize:12, color:T.muted2, marginBottom:5 }}>
                  <span>{cat}</span>
                  <span style={{ fontFamily:T.mono, fontWeight:700, color }}>{count}</span>
                </div>
                <div style={{ height:5, background:T.surface2, borderRadius:3 }}>
                  <div style={{ height:"100%", width:`${(count/4)*100}%`,
                    background:color, borderRadius:3 }}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ Add Risk Modal ═══ */}
      {showAdd && (
        <div style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(4px)",
          display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:20
        }}>
          <div style={{
            background:T.surface, border:`1px solid ${T.borderHi}`,
            borderRadius:16, padding:28, width:"100%", maxWidth:540,
            maxHeight:"90vh", overflowY:"auto"
          }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <h3 style={{ margin:0, fontFamily:T.display, fontSize:18, fontWeight:800, color:T.text }}>
                Add risk
              </h3>
              <button onClick={() => setShowAdd(false)} style={{
                background:"none", border:"none", color:T.muted, cursor:"pointer", padding:4
              }}>
                <X size={18}/>
              </button>
            </div>

            <form onSubmit={handleAdd}>
              {[
                { field:"title", label:"Risk Title", type:"text", placeholder:"Describe the risk..." },
                { field:"owner", label:"Owner",      type:"text", placeholder:"e.g. Engineering Team" },
                { field:"due",   label:"Due Date",   type:"date" },
              ].map(({ field, label, type, placeholder }) => (
                <div key={field} style={{ marginBottom:14 }}>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:T.muted,
                    textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>
                    {label}
                  </label>
                  <input
                    type={type} required={field!=="due"}
                    value={form[field]} placeholder={placeholder}
                    onChange={e => setForm(f => ({ ...f, [field]:e.target.value }))}
                    style={{
                      width:"100%", padding:"10px 14px",
                      background:T.surface2, border:`1px solid ${T.border}`,
                      borderRadius:8, color:T.text, fontSize:13, outline:"none",
                      boxSizing:"border-box",
                    }}
                  />
                </div>
              ))}

              {/* Selects row */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
                {[
                  { field:"framework", label:"Framework", options:["ISO 27001","SOC 2","RBI","DPDP","CERT-In"] },
                  { field:"category",  label:"Category",  options:["Technical","Regulatory","Supply Chain","Third Party","Process"] },
                  { field:"status",    label:"Status",    options:["Open","Mitigating","Accepted","Closed"] },
                ].map(({ field, label, options }) => (
                  <div key={field}>
                    <label style={{ display:"block", fontSize:11, fontWeight:700, color:T.muted,
                      textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>
                      {label}
                    </label>
                    <select
                      value={form[field]}
                      onChange={e => setForm(f => ({ ...f, [field]:e.target.value }))}
                      style={{
                        width:"100%", padding:"10px 14px",
                        background:T.surface2, border:`1px solid ${T.border}`,
                        borderRadius:8, color:T.text, fontSize:13, outline:"none",
                      }}
                    >
                      {options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>

              {/* Likelihood × Impact */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
                {["likelihood","impact"].map(field => (
                  <div key={field}>
                    <label style={{ display:"block", fontSize:11, fontWeight:700, color:T.muted,
                      textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>
                      {field} (1–5)
                    </label>
                    <input type="number" min={1} max={5}
                      value={form[field]}
                      onChange={e => setForm(f => ({ ...f, [field]:Number(e.target.value) }))}
                      style={{
                        width:"100%", padding:"10px 14px",
                        background:T.surface2, border:`1px solid ${T.border}`,
                        borderRadius:8, color:T.text, fontSize:13, outline:"none",
                        boxSizing:"border-box",
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Score preview */}
              <div style={{
                display:"flex", alignItems:"center", justifyContent:"center", gap:12,
                padding:"12px 16px", background:T.surface2, borderRadius:10,
                border:`1px solid ${T.border}`, marginBottom:20
              }}>
                <span style={{ fontSize:13, color:T.muted }}>Score preview:</span>
                <span style={{
                  fontFamily:T.mono, fontSize:22, fontWeight:800,
                  color:SCORE_COLOR(form.likelihood * form.impact)
                }}>
                  {form.likelihood * form.impact}
                </span>
                <span style={{ fontSize:12, color:T.muted }}>/25</span>
              </div>

              <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
                <button type="button" onClick={() => setShowAdd(false)} style={{
                  padding:"10px 18px", background:T.surface2, border:`1px solid ${T.border}`,
                  borderRadius:8, color:T.muted2, fontSize:13, fontWeight:600, cursor:"pointer"
                }}>
                  Cancel
                </button>
                <button type="submit" style={{
                  padding:"10px 20px",
                  background:"linear-gradient(135deg, #7c3aed, #8b5cf6)",
                  border:"none", borderRadius:8, color:"#fff",
                  fontSize:13, fontWeight:700, cursor:"pointer",
                }}>
                  Add Risk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

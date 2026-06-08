import { useState, useEffect, useCallback } from "react";
import {
  Play, RefreshCw, CheckCircle, XCircle, AlertCircle,
  Clock, Zap, Shield, FileText, Plus, ChevronRight
} from "lucide-react";

const API = "http://localhost:8000";

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

const INTEGRATIONS = [
  { id:"aws",         name:"AWS",         icon:"☁️",  ctls:47, lastScan:"2m ago",  status:"connected" },
  { id:"gcp",         name:"GCP",         icon:"🌐",  ctls:31, lastScan:"5m ago",  status:"connected" },
  { id:"azure",       name:"Azure",       icon:"🔷",  ctls:28, lastScan:"8m ago",  status:"connected" },
  { id:"github",      name:"GitHub",      icon:"🐙",  ctls:22, lastScan:"12m ago", status:"connected" },
  { id:"gitlab",      name:"GitLab",      icon:"🦊",  ctls:null, lastScan:"—",     status:"connected" },
  { id:"jira",        name:"Jira",        icon:"📋",  ctls:8,  lastScan:"1h ago",  status:"connected" },
  { id:"slack",       name:"Slack",       icon:"💬",  ctls:5,  lastScan:"1h ago",  status:"connected" },
  { id:"okta",        name:"Okta",        icon:"🔐",  ctls:35, lastScan:"15m ago", status:"connected" },
  { id:"crowdstrike",name:"Crowdstrike",  icon:"🪖",  ctls:41, lastScan:"3m ago",  status:"connected" },
  { id:"qualys",      name:"Qualys",      icon:"🔍",  ctls:null, lastScan:"—",     status:"warning"   },
  { id:"tenable",     name:"Tenable",     icon:"🛡️",  ctls:29, lastScan:"30m ago", status:"connected" },
  { id:"splunk",      name:"Splunk",      icon:"📊",  ctls:18, lastScan:"7m ago",  status:"connected" },
  { id:"datadog",     name:"Datadog",     icon:"🐶",  ctls:14, lastScan:"4m ago",  status:"connected" },
  { id:"pagerduty",   name:"PagerDuty",   icon:"🚨",  ctls:6,  lastScan:"45m ago", status:"connected" },
];

const LOG_ENTRIES = [
  { time:"14:32:01", integration:"AWS",        icon:"☁️",  event:"IAM policy scan completed",          ctls:47, duration:"1m 23s", status:"Pass" },
  { time:"14:30:18", integration:"Okta",       icon:"🔐",  event:"MFA coverage check — 98.4% coverage",ctls:35, duration:"0m 42s", status:"Pass" },
  { time:"14:28:55", integration:"Crowdstrike",icon:"🪖",  event:"EDR policy sync completed",          ctls:41, duration:"0m 18s", status:"Pass" },
  { time:"14:25:10", integration:"GitHub",     icon:"🐙",  event:"Branch protection rule audit",       ctls:22, duration:"0m 55s", status:"Warn" },
  { time:"14:20:44", integration:"Splunk",     icon:"📊",  event:"SIEM alert rule verification",       ctls:18, duration:"1m 02s", status:"Pass" },
  { time:"14:15:30", integration:"GCP",        icon:"🌐",  event:"Storage bucket ACL scan",            ctls:31, duration:"2m 14s", status:"Fail" },
  { time:"14:10:22", integration:"Tenable",    icon:"🛡️",  event:"Vulnerability scan — 3 critical found",ctls:29,duration:"4m 38s", status:"Warn" },
  { time:"14:05:01", integration:"Azure",      icon:"🔷",  event:"AD conditional access policy check", ctls:28, duration:"1m 07s", status:"Pass" },
];

const CONTROLS = [
  { provider:"AWS",  provIcon:"☁️",  id:"CC6.1", name:"Enforce MFA on all IAM users",        desc:"SOC2 · Partially configured — some resources non-compliant.", risk:"MEDIUM", status:"Partial"  },
  { provider:"AWS",  provIcon:"☁️",  id:"CC6.7", name:"Enable default S3 bucket encryption", desc:"SOC2 · Partially configured — some resources non-compliant.", risk:"LOW",    status:"Partial"  },
  { provider:"AWS",  provIcon:"☁️",  id:"CC7.2", name:"Enable CloudTrail across all regions",desc:"SOC2 · Already configured correctly.",                        risk:"LOW",    status:"Passing"  },
  { provider:"AWS",  provIcon:"☁️",  id:"A.8.2", name:"Restrict public security groups",     desc:"ISO27001 · Not configured — remediation available.",         risk:"HIGH",   status:"Failing"  },
  { provider:"Okta", provIcon:"🔐",  id:"CC6.2", name:"Require strong password policy",      desc:"SOC2 · Not configured — remediation available.",             risk:"LOW",    status:"Failing"  },
  { provider:"GitHub",provIcon:"🐙", id:"CC8.1", name:"Enforce branch protection rules",     desc:"SOC2 · Partially configured.",                               risk:"MEDIUM", status:"Partial"  },
  { provider:"GCP",  provIcon:"🌐",  id:"AC-1.1",name:"Restrict public GCS buckets",         desc:"ISO27001 · Failing — public access enabled on 3 buckets.",   risk:"HIGH",   status:"Failing"  },
];

function StatusBadge({ status }) {
  const map = {
    Pass:    { color:"#10B981", bg:"rgba(16,185,129,0.12)",  icon:<CheckCircle size={12}/> },
    Warn:    { color:"#F59E0B", bg:"rgba(245,158,11,0.12)",  icon:<AlertCircle size={12}/> },
    Fail:    { color:"#EF4444", bg:"rgba(239,68,68,0.12)",   icon:<XCircle size={12}/> },
    Passing: { color:"#10B981", bg:"rgba(16,185,129,0.12)",  icon:<CheckCircle size={12}/> },
    Partial: { color:"#F59E0B", bg:"rgba(245,158,11,0.12)",  icon:<AlertCircle size={12}/> },
    Failing: { color:"#EF4444", bg:"rgba(239,68,68,0.12)",   icon:<XCircle size={12}/> },
  };
  const c = map[status] || map.Fail;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:4,
      background:c.bg, color:c.color,
      border:`1px solid ${c.color}30`,
      borderRadius:20, padding:"3px 10px",
      fontSize:11, fontWeight:600, fontFamily:T.mono,
    }}>
      {c.icon}{status}
    </span>
  );
}

function RiskBadge({ risk }) {
  const map = {
    HIGH:   "#EF4444",
    MEDIUM: "#F59E0B",
    LOW:    "#10B981",
  };
  const color = map[risk] || T.muted;
  return (
    <span style={{
      fontSize:10, fontWeight:700, color,
      background:`${color}15`, border:`1px solid ${color}30`,
      borderRadius:4, padding:"2px 7px", fontFamily:T.mono,
      letterSpacing:"0.06em"
    }}>
      {risk}
    </span>
  );
}

export default function AutomationHub({ token, tenantId }) {
  const [tab, setTab]         = useState("scan");
  const [scanning, setScanning] = useState(false);
  const [scanDone, setScanDone] = useState(false);
  const [showRemediable, setShowRemediable] = useState(false);

  const runScan = () => {
    setScanning(true);
    setTimeout(() => { setScanning(false); setScanDone(true); }, 2200);
  };

  const visibleControls = showRemediable
    ? CONTROLS.filter(c => c.status !== "Passing")
    : CONTROLS;

  const stats = [
    { label:"CONNECTED",          value:"12/14", color:T.purple },
    { label:"CONTROLS AUTOMATED", value:"284/500", color:T.blue },
    { label:"EVIDENCE COLLECTED", value:"1,847",   color:T.green },
    { label:"LAST SCAN",          value:"2m ago",  color:T.muted2 },
  ];

  return (
    <div style={{ background:T.bg, minHeight:"100vh", color:T.text, fontFamily:T.body, padding:"28px 32px" }}>

      {/* ─── Header ─── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
        marginBottom:24, flexWrap:"wrap", gap:16 }}>
        <div>
          <h1 style={{ margin:"0 0 4px", fontFamily:T.display, fontSize:24, fontWeight:800,
            color:T.text, letterSpacing:"-0.4px" }}>
            Automation
          </h1>
          <p style={{ margin:0, fontSize:13, color:T.muted }}>
            12 integrations connected · 284 controls automated
          </p>
        </div>
        <button onClick={runScan} disabled={scanning} style={{
          display:"flex", alignItems:"center", gap:8, padding:"11px 22px",
          background:"linear-gradient(135deg, #7c3aed, #8b5cf6)",
          border:"none", borderRadius:10, color:"#fff",
          fontSize:14, fontWeight:700, cursor:"pointer",
          boxShadow:"0 4px 20px rgba(139,92,246,0.35)",
          opacity: scanning ? 0.7 : 1, transition:"all 0.2s"
        }}>
          {scanning
            ? <><RefreshCw size={15} style={{ animation:"spin 1s linear infinite" }}/> Scanning...</>
            : <><Play size={15}/> Run full scan</>}
        </button>
      </div>

      {/* ─── Stat Cards ─── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:28 }}>
        {stats.map(({ label, value, color }) => (
          <div key={label} style={{
            background:T.surface, border:`1px solid ${T.border}`,
            borderRadius:12, padding:"18px 20px"
          }}>
            <div style={{ fontSize:11, fontWeight:700, color:T.muted,
              textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:8 }}>
              {label}
            </div>
            <div style={{ fontFamily:T.mono, fontSize:26, fontWeight:800, color, letterSpacing:"-0.5px" }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* ─── Integrations Grid ─── */}
      <h2 style={{ fontFamily:T.display, fontSize:17, fontWeight:800, color:T.text,
        margin:"0 0 14px", letterSpacing:"-0.2px" }}>
        Integrations
      </h2>
      <div style={{
        display:"grid",
        gridTemplateColumns:"repeat(7, 1fr)",
        gap:10, marginBottom:32
      }}>
        {INTEGRATIONS.map(intg => (
          <div key={intg.id} style={{
            background:T.surface, border:`1px solid ${T.border}`,
            borderRadius:10, padding:"14px 12px",
            display:"flex", flexDirection:"column", alignItems:"center", gap:6,
            cursor:"pointer", transition:"all 0.15s", position:"relative",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderHi; e.currentTarget.style.background = T.surface2; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border;   e.currentTarget.style.background = T.surface;  }}
          >
            {/* Status dot */}
            <div style={{
              position:"absolute", top:8, right:8,
              width:7, height:7, borderRadius:"50%",
              background: intg.status === "warning" ? T.amber : T.green,
              boxShadow: `0 0 6px ${intg.status === "warning" ? T.amber : T.green}`,
            }}/>

            <div style={{ fontSize:26, lineHeight:1 }}>{intg.icon}</div>
            <div style={{ fontSize:12, fontWeight:700, color:T.text, textAlign:"center" }}>
              {intg.name}
            </div>
            <div style={{ fontSize:10, color:T.muted, textAlign:"center", fontFamily:T.mono }}>
              {intg.ctls ? `${intg.ctls} ctls` : "—"}
            </div>
            <div style={{ fontSize:10, color:T.muted, textAlign:"center" }}>
              {intg.lastScan}
            </div>
          </div>
        ))}
      </div>

      {/* ─── Tabs: Scan & Fix / AI Policies / Evidence ─── */}
      <div style={{ display:"flex", gap:0, borderBottom:`1px solid ${T.border}`, marginBottom:20 }}>
        {[
          { id:"scan",     label:"Scan & Fix",   Icon:Zap },
          { id:"policies", label:"AI Policies",  Icon:FileText },
          { id:"evidence", label:"Evidence",     Icon:Shield },
          { id:"log",      label:"Automation log", Icon:Clock },
        ].map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setTab(id)} style={{
            display:"flex", alignItems:"center", gap:7, padding:"10px 18px",
            background:"none", border:"none",
            borderBottom: tab===id ? `2px solid ${T.accent}` : "2px solid transparent",
            color: tab===id ? T.accent : T.muted,
            fontFamily:T.body, fontSize:13, fontWeight:600, cursor:"pointer",
            transition:"all 0.15s", marginBottom:-1,
          }}>
            <Icon size={13}/>{label}
          </button>
        ))}
      </div>

      {/* ═══ SCAN & FIX TAB ═══ */}
      {tab === "scan" && (
        <>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
            <button onClick={() => setShowRemediable(!showRemediable)} style={{
              padding:"6px 14px", borderRadius:20, fontSize:12, fontWeight:600,
              background: showRemediable ? T.accent : T.surface,
              border: showRemediable ? `1px solid ${T.accent}` : `1px solid ${T.border}`,
              color: showRemediable ? "#fff" : T.muted2, cursor:"pointer", transition:"all 0.15s"
            }}>
              Show remediable only
            </button>
            <span style={{ fontSize:12, color:T.muted, fontFamily:T.mono }}>
              {visibleControls.length} controls
            </span>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {visibleControls.map((ctrl, i) => (
              <div key={i} style={{
                background:T.surface, border:`1px solid ${T.border}`,
                borderRadius:10, padding:"14px 18px",
                display:"flex", alignItems:"center", gap:14,
                transition:"all 0.12s",
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(139,92,246,0.15)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
              >
                {/* Provider badge */}
                <div style={{
                  background:T.surface2, border:`1px solid ${T.border}`,
                  borderRadius:7, padding:"5px 10px",
                  display:"flex", alignItems:"center", gap:5, flexShrink:0
                }}>
                  <span style={{ fontSize:14 }}>{ctrl.provIcon}</span>
                  <span style={{ fontSize:11, fontWeight:700, color:T.muted2 }}>{ctrl.provider}</span>
                  <span style={{ fontSize:10, color:T.muted, fontFamily:T.mono }}>{ctrl.id}</span>
                </div>

                {/* Control info */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:3 }}>
                    {ctrl.name}
                  </div>
                  <div style={{ fontSize:12, color:T.muted }}>
                    {ctrl.desc}
                  </div>
                </div>

                {/* Risk + Status + Fix */}
                <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
                  <RiskBadge risk={ctrl.risk}/>
                  <StatusBadge status={ctrl.status}/>
                  {ctrl.status !== "Passing" && (
                    <button style={{
                      display:"flex", alignItems:"center", gap:5,
                      padding:"7px 14px",
                      background:"linear-gradient(135deg, #7c3aed, #8b5cf6)",
                      border:"none", borderRadius:8, color:"#fff",
                      fontSize:12, fontWeight:700, cursor:"pointer",
                    }}>
                      <Zap size={11}/> Fix
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ═══ AUTOMATION LOG TAB ═══ */}
      {tab === "log" && (
        <div style={{
          background:T.surface, border:`1px solid ${T.border}`,
          borderRadius:14, overflow:"hidden"
        }}>
          {/* Table header */}
          <div style={{
            display:"grid",
            gridTemplateColumns:"90px 140px 1fr 90px 100px 90px",
            padding:"10px 20px",
            borderBottom:`1px solid ${T.border}`,
            background:T.surface2
          }}>
            {["TIME","INTEGRATION","EVENT","CONTROLS","DURATION","STATUS"].map(h => (
              <div key={h} style={{
                fontSize:10, fontWeight:700, color:T.muted,
                textTransform:"uppercase", letterSpacing:"0.1em"
              }}>{h}</div>
            ))}
          </div>

          {LOG_ENTRIES.map((entry, i) => (
            <div key={i} style={{
              display:"grid",
              gridTemplateColumns:"90px 140px 1fr 90px 100px 90px",
              padding:"14px 20px",
              borderBottom: i < LOG_ENTRIES.length-1 ? `1px solid ${T.border}` : "none",
              alignItems:"center",
              transition:"background 0.12s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div style={{ fontFamily:T.mono, fontSize:12, color:T.muted }}>
                {entry.time}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                <span style={{ fontSize:14 }}>{entry.icon}</span>
                <span style={{ fontSize:13, fontWeight:600, color:T.text }}>{entry.integration}</span>
              </div>
              <div style={{ fontSize:12, color:T.muted2, paddingRight:16 }}>{entry.event}</div>
              <div style={{ fontFamily:T.mono, fontSize:13, fontWeight:700, color:T.accent2 }}>
                {entry.ctls}
              </div>
              <div style={{ fontFamily:T.mono, fontSize:12, color:T.muted }}>{entry.duration}</div>
              <div><StatusBadge status={entry.status}/></div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ AI POLICIES TAB ═══ */}
      {tab === "policies" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
          {[
            { title:"Access Control Policy",        desc:"Generated from ISO 27001 A.9 + SOC 2 CC6", icon:"🔐", status:"Ready" },
            { title:"Incident Response Policy",     desc:"Generated from CERT-In + ISO 27001 A.16",  icon:"🚨", status:"Ready" },
            { title:"Data Retention Policy",        desc:"Generated from DPDP Act + ISO 27001 A.8",  icon:"🗄️", status:"Ready" },
            { title:"Vendor Risk Policy",           desc:"Generated from ISO 27001 A.15 + SOC 2 CC9",icon:"🤝", status:"Ready" },
            { title:"Business Continuity Policy",   desc:"Generated from ISO 27001 A.17",            icon:"♻️", status:"Draft" },
            { title:"Cryptography Policy",          desc:"Generated from ISO 27001 A.10",            icon:"🔑", status:"Draft" },
          ].map((p, i) => (
            <div key={i} style={{
              background:T.surface, border:`1px solid ${T.border}`,
              borderRadius:12, padding:"18px 20px",
              cursor:"pointer", transition:"all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderHi; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border;   }}
            >
              <div style={{ fontSize:24, marginBottom:10 }}>{p.icon}</div>
              <div style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:6 }}>{p.title}</div>
              <div style={{ fontSize:11, color:T.muted, marginBottom:12 }}>{p.desc}</div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{
                  fontSize:10, fontWeight:700,
                  color: p.status === "Ready" ? T.green : T.amber,
                  background: p.status === "Ready" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
                  padding:"2px 8px", borderRadius:4
                }}>{p.status}</span>
                <button style={{
                  fontSize:11, fontWeight:700, color:T.accent2,
                  background:"none", border:`1px solid ${T.borderHi}`,
                  borderRadius:6, padding:"4px 12px", cursor:"pointer"
                }}>Generate</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ EVIDENCE TAB ═══ */}
      {tab === "evidence" && (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {CONTROLS.map((ctrl, i) => (
            <div key={i} style={{
              background:T.surface, border:`1px solid ${T.border}`,
              borderRadius:10, padding:"13px 18px",
              display:"flex", alignItems:"center", gap:14,
            }}>
              <span style={{ fontSize:16 }}>{ctrl.provIcon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:700, color:T.text }}>{ctrl.name}</div>
                <div style={{ fontSize:11, color:T.muted, fontFamily:T.mono }}>{ctrl.id}</div>
              </div>
              <button style={{
                fontSize:11, fontWeight:700, color:T.green,
                background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.2)",
                borderRadius:6, padding:"5px 12px", cursor:"pointer"
              }}>Collect</button>
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

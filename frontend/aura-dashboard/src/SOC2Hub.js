import { useState } from "react";
import {
  Award, RefreshCw, Download, Shield, Layers, ListChecks,
  ClipboardCheck, Zap, CircleCheck, CircleDot, Circle, CalendarClock,
} from "lucide-react";

const API = "https://web-production-320c3.up.railway.app";

/* ─── Theme tokens (aligned with App.js design system) ─────────────── */
const T = {
  accent: "#7c3aed",
  accent2: "#8b5cf6",
  pink: "#db2777",
  ink: "#1a0a3a",
  muted: "#a89dc8",
  text2: "#6b5b9e",
  green: "#16a34a",
  amber: "#d97706",
  red: "#e11d48",
  border: "rgba(124,58,237,.1)",
  borderHi: "rgba(124,58,237,.22)",
  card: "#fff",
  mono: "'JetBrains Mono',ui-monospace,monospace",
  display: "'Syne',sans-serif",
};

const TSC = {
  CC: { name: "Common Criteria (Security)", color: "#7c3aed", controls: 33, desc: "Core security controls covering access, operations, and change management" },
  A:  { name: "Availability", color: "#0891b2", controls: 4, desc: "System availability commitments and SLA management" },
  C:  { name: "Confidentiality", color: "#16a34a", controls: 2, desc: "Protection of confidential information" },
  PI: { name: "Processing Integrity", color: "#d97706", controls: 4, desc: "System processing is complete, valid, accurate, timely, and authorized" },
  P:  { name: "Privacy", color: "#db2777", controls: 8, desc: "Personal information collection, use, retention, and disposal" },
};

const DEMO_CONTROLS = [
  { id: "CC1.1", tsc: "CC", name: "COSO Principles — Control Environment", status: "IMPLEMENTED", evidence: 3, owner: "CISO", automated: true },
  { id: "CC1.2", tsc: "CC", name: "Board oversight of security", status: "IMPLEMENTED", evidence: 2, owner: "CEO", automated: false },
  { id: "CC1.3", tsc: "CC", name: "Organizational structure and reporting", status: "IMPLEMENTED", evidence: 2, owner: "CISO", automated: false },
  { id: "CC2.1", tsc: "CC", name: "COSO Principles — Communication", status: "IMPLEMENTED", evidence: 2, owner: "CISO", automated: false },
  { id: "CC2.2", tsc: "CC", name: "Internal communication of security information", status: "IN_PROGRESS", evidence: 1, owner: "CISO", automated: false },
  { id: "CC2.3", tsc: "CC", name: "External communication of commitments", status: "IMPLEMENTED", evidence: 1, owner: "Legal", automated: false },
  { id: "CC3.1", tsc: "CC", name: "Risk assessment objectives", status: "IMPLEMENTED", evidence: 2, owner: "CISO", automated: false },
  { id: "CC3.2", tsc: "CC", name: "Risk identification and analysis", status: "IN_PROGRESS", evidence: 1, owner: "CISO", automated: false },
  { id: "CC3.3", tsc: "CC", name: "Fraud risk assessment", status: "NOT_STARTED", evidence: 0, owner: "CISO", automated: false },
  { id: "CC4.1", tsc: "CC", name: "Control monitoring activities", status: "IMPLEMENTED", evidence: 3, owner: "Security", automated: true },
  { id: "CC4.2", tsc: "CC", name: "Evaluation and communication of deficiencies", status: "IN_PROGRESS", evidence: 1, owner: "CISO", automated: false },
  { id: "CC5.1", tsc: "CC", name: "Control activities to mitigate risks", status: "IMPLEMENTED", evidence: 2, owner: "CISO", automated: true },
  { id: "CC5.2", tsc: "CC", name: "Technology controls", status: "IMPLEMENTED", evidence: 4, owner: "CTO", automated: true },
  { id: "CC5.3", tsc: "CC", name: "Policies and procedures deployment", status: "IN_PROGRESS", evidence: 1, owner: "CISO", automated: false },
  { id: "CC6.1", tsc: "CC", name: "Logical access security — credentials & MFA", status: "IMPLEMENTED", evidence: 4, owner: "IT", automated: true },
  { id: "CC6.2", tsc: "CC", name: "Authentication prior to access", status: "IMPLEMENTED", evidence: 3, owner: "IT", automated: true },
  { id: "CC6.3", tsc: "CC", name: "Access management — authorization", status: "IN_PROGRESS", evidence: 2, owner: "IT", automated: true },
  { id: "CC6.4", tsc: "CC", name: "Restricting physical access", status: "IMPLEMENTED", evidence: 2, owner: "Facilities", automated: false },
  { id: "CC6.5", tsc: "CC", name: "Termination of access", status: "IMPLEMENTED", evidence: 2, owner: "HR", automated: true },
  { id: "CC6.6", tsc: "CC", name: "Network security & unauthorized access", status: "IN_PROGRESS", evidence: 2, owner: "IT", automated: true },
  { id: "CC6.7", tsc: "CC", name: "Transmission and disclosure restrictions", status: "IMPLEMENTED", evidence: 2, owner: "IT", automated: true },
  { id: "CC6.8", tsc: "CC", name: "Unauthorized software prevention", status: "IN_PROGRESS", evidence: 1, owner: "IT", automated: true },
  { id: "CC7.1", tsc: "CC", name: "Vulnerability and threat detection", status: "IN_PROGRESS", evidence: 2, owner: "Security", automated: true },
  { id: "CC7.2", tsc: "CC", name: "Incident monitoring procedures", status: "IMPLEMENTED", evidence: 2, owner: "Security", automated: true },
  { id: "CC7.3", tsc: "CC", name: "Security event evaluation", status: "IN_PROGRESS", evidence: 1, owner: "Security", automated: false },
  { id: "CC7.4", tsc: "CC", name: "Incident response process", status: "IN_PROGRESS", evidence: 1, owner: "CISO", automated: false },
  { id: "CC7.5", tsc: "CC", name: "Incident recovery and communication", status: "NOT_STARTED", evidence: 0, owner: "CISO", automated: false },
  { id: "CC8.1", tsc: "CC", name: "Change management process", status: "IMPLEMENTED", evidence: 3, owner: "CTO", automated: true },
  { id: "CC9.1", tsc: "CC", name: "Risk mitigation by management", status: "IN_PROGRESS", evidence: 1, owner: "CISO", automated: false },
  { id: "CC9.2", tsc: "CC", name: "Vendor and business partner risk", status: "IN_PROGRESS", evidence: 2, owner: "Procurement", automated: false },
  { id: "A1.1", tsc: "A", name: "Availability — capacity planning", status: "IMPLEMENTED", evidence: 2, owner: "CTO", automated: true },
  { id: "A1.2", tsc: "A", name: "Availability — recovery objectives (RTO/RPO)", status: "IN_PROGRESS", evidence: 1, owner: "CTO", automated: false },
  { id: "A1.3", tsc: "A", name: "Backup and recovery testing", status: "IN_PROGRESS", evidence: 1, owner: "IT", automated: true },
  { id: "C1.1", tsc: "C", name: "Confidentiality — identification and handling", status: "IMPLEMENTED", evidence: 2, owner: "CISO", automated: false },
  { id: "C1.2", tsc: "C", name: "Confidential information disposal", status: "IN_PROGRESS", evidence: 1, owner: "IT", automated: false },
  { id: "P1.1", tsc: "P", name: "Privacy — notice and communication", status: "IMPLEMENTED", evidence: 2, owner: "Legal", automated: false },
  { id: "P2.1", tsc: "P", name: "Privacy — consent and choice", status: "IMPLEMENTED", evidence: 1, owner: "Legal", automated: false },
  { id: "P3.1", tsc: "P", name: "Privacy — collection limitation", status: "IN_PROGRESS", evidence: 1, owner: "Engineering", automated: false },
  { id: "P4.1", tsc: "P", name: "Privacy — data use limitation", status: "IN_PROGRESS", evidence: 1, owner: "Legal", automated: false },
  { id: "P5.1", tsc: "P", name: "Privacy — access and correction", status: "NOT_STARTED", evidence: 0, owner: "Engineering", automated: false },
];

const STATUS = {
  IMPLEMENTED: { color: "#16a34a", bg: "rgba(22,163,74,.08)", label: "Implemented", Icon: CircleCheck },
  IN_PROGRESS: { color: "#d97706", bg: "rgba(217,119,6,.08)", label: "In Progress", Icon: CircleDot },
  NOT_STARTED: { color: "#e11d48", bg: "rgba(225,29,72,.06)", label: "Not Started", Icon: Circle },
};

function ScoreRing({ score, size = 120 }) {
  const r = 42, circ = 2 * Math.PI * r, offset = circ - (score / 100) * circ;
  const color = score >= 80 ? T.green : score >= 60 ? T.amber : T.red;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(124,58,237,.1)" strokeWidth="7" />
      <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="7"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform="rotate(-90 50 50)" style={{ transition: "stroke-dashoffset 1.2s ease" }} />
      <text x="50" y="47" textAnchor="middle" fontSize="20" fontWeight="800" fontFamily={T.display} fill={color}>{score}%</text>
      <text x="50" y="61" textAnchor="middle" fontSize="7.5" letterSpacing="0.5" fill={T.muted} fontFamily="'DM Sans',sans-serif">AUDIT READY</text>
    </svg>
  );
}

export default function SOC2Hub({ token, tenantId }) {
  const [tab, setTab] = useState("overview");
  const [tscFilter, setTscFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expanded, setExpanded] = useState({});

  const implemented = DEMO_CONTROLS.filter(c => c.status === "IMPLEMENTED").length;
  const inProgress = DEMO_CONTROLS.filter(c => c.status === "IN_PROGRESS").length;
  const notStarted = DEMO_CONTROLS.filter(c => c.status === "NOT_STARTED").length;
  const total = DEMO_CONTROLS.length;
  const score = Math.round(total > 0 ? (implemented / total) * 100 : 0);
  const automated = DEMO_CONTROLS.filter(c => c.automated && c.status === "IMPLEMENTED").length;

  const filtered = DEMO_CONTROLS.filter(c =>
    (!tscFilter || c.tsc === tscFilter) && (!statusFilter || c.status === statusFilter));

  const TABS = [
    { id: "overview", label: "Overview", Icon: Layers },
    { id: "controls", label: "Controls", Icon: ListChecks },
    { id: "tsc", label: "TSC Breakdown", Icon: Shield },
    { id: "readiness", label: "Audit Readiness", Icon: ClipboardCheck },
  ];

  const cardBase = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 16 };

  return (
    <div style={{ padding: "28px 32px", fontFamily: "'DM Sans',sans-serif" }}>
      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg,#7c3aed,#db2777)", borderRadius: 7, padding: "4px 11px", fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: ".3px" }}>
              <Award size={12} /> SOC 2 TYPE II
            </span>
            <span style={{ background: "rgba(22,163,74,.1)", color: T.green, border: "1px solid rgba(22,163,74,.2)", borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>On Track</span>
          </div>
          <h2 style={{ fontFamily: T.display, fontSize: 25, fontWeight: 800, color: T.ink, marginBottom: 4, letterSpacing: "-.3px" }}>SOC 2 Certification Hub</h2>
          <p style={{ color: T.muted, fontSize: 13 }}>Trust Services Criteria (AICPA) · 5 TSC categories · {total} controls · audit-ready in ~4 weeks</p>
        </div>
        <button
          onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
          onMouseLeave={e => e.currentTarget.style.transform = "none"}
          style={{ padding: "10px 18px", background: "linear-gradient(135deg,#7c3aed,#db2777)", border: "none", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 16px rgba(124,58,237,.28)", transition: "transform .15s" }}>
          <Download size={14} /> Download Report
        </button>
      </div>

      {/* ── Tab bar ── */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24, borderBottom: `1px solid ${T.border}`, paddingBottom: 0 }}>
        {TABS.map(({ id, label, Icon }) => {
          const on = tab === id;
          return (
            <button key={id} onClick={() => setTab(id)}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 16px", border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: on ? T.accent : T.text2, borderBottom: `2px solid ${on ? T.accent : "transparent"}`, marginBottom: -1, transition: "color .15s" }}>
              <Icon size={15} /> {label}
            </button>
          );
        })}
      </div>

      {/* ════════ OVERVIEW ════════ */}
      {tab === "overview" && (
        <div>
          {/* Hero: ring + stats */}
          <div style={{ ...cardBase, display: "grid", gridTemplateColumns: "auto 1fr 1fr 1fr 1fr", gap: 20, marginBottom: 18, padding: 26, alignItems: "center" }}>
            <div style={{ paddingRight: 24, borderRight: `1px solid ${T.border}` }}>
              <ScoreRing score={score} />
            </div>
            {[
              { label: "Implemented", value: implemented, color: T.green },
              { label: "In Progress", value: inProgress, color: T.amber },
              { label: "Not Started", value: notStarted, color: T.red },
              { label: "Auto-Monitored", value: automated, color: T.accent },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: T.display, fontSize: 38, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: ".5px", marginTop: 6 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* TSC mini cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14, marginBottom: 18 }}>
            {Object.entries(TSC).map(([key, tsc]) => {
              const tscControls = DEMO_CONTROLS.filter(c => c.tsc === key);
              const done = tscControls.filter(c => c.status === "IMPLEMENTED").length;
              const pct = tscControls.length > 0 ? Math.round(done / tscControls.length * 100) : 0;
              return (
                <div key={key} onClick={() => { setTab("controls"); setTscFilter(key); }}
                  style={{ background: T.card, border: `1px solid ${tsc.color}20`, borderRadius: 14, padding: "18px 16px", cursor: "pointer", transition: "all .2s", position: "relative", overflow: "hidden" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = `${tsc.color}45`; e.currentTarget.style.boxShadow = `0 6px 18px ${tsc.color}1a`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = `${tsc.color}20`; e.currentTarget.style.boxShadow = "none"; }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${tsc.color},${tsc.color}50)` }} />
                  <div style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 800, color: tsc.color, marginBottom: 4 }}>{key}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.ink, marginBottom: 10, lineHeight: 1.3, minHeight: 28 }}>{tsc.name}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: T.muted }}>{done}/{tscControls.length}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: tsc.color }}>{pct}%</span>
                  </div>
                  <div style={{ height: 4, background: `${tsc.color}15`, borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: tsc.color, borderRadius: 2, transition: "width 1s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* 4-week sprint */}
          <div style={{ background: "linear-gradient(135deg,rgba(124,58,237,.06),rgba(219,39,119,.03))", border: `1px solid ${T.borderHi}`, borderRadius: 16, padding: 22 }}>
            <h4 style={{ fontFamily: T.display, fontSize: 15, fontWeight: 700, color: T.ink, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <CalendarClock size={16} color={T.accent} /> SOC 2 Type II — 4-week sprint plan
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
              {[
                { week: "Week 1", title: "Scoping & Readiness", tasks: ["Define TSC scope", "Connect integrations", "Run gap analysis", "Assign control owners"], done: true },
                { week: "Week 2", title: "Evidence Collection", tasks: ["Auto-pull from AWS/Okta/GitHub", "Upload manual evidence", "Complete policy templates", "Employee training records"], done: true },
                { week: "Week 3", title: "Control Testing", tasks: ["Internal control tests", "Remediate failures", "Vendor security reviews", "Management review meeting"], done: false },
                { week: "Week 4", title: "Audit Execution", tasks: ["Auditor portal access", "Evidence Q&A", "Final report review", "SOC 2 Type II issued"], done: false },
              ].map(w => (
                <div key={w.week} style={{ background: w.done ? "rgba(22,163,74,.04)" : "#fff", border: `1px solid ${w.done ? "rgba(22,163,74,.2)" : T.border}`, borderRadius: 12, padding: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 700, color: w.done ? T.green : T.accent, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 6 }}>
                    {w.week} {w.done && <CircleCheck size={12} />}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 10 }}>{w.title}</div>
                  {w.tasks.map((t, i) => (
                    <div key={i} style={{ fontSize: 11, color: T.text2, display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 5 }}>
                      {w.done ? <CircleCheck size={12} color={T.green} style={{ flexShrink: 0, marginTop: 1 }} /> : <Circle size={12} color={T.muted} style={{ flexShrink: 0, marginTop: 1 }} />}
                      {t}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════════ CONTROLS ════════ */}
      {tab === "controls" && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
            {["", "CC", "A", "C", "PI", "P"].map(t => (
              <button key={t} onClick={() => setTscFilter(t)}
                style={{ padding: "5px 13px", borderRadius: 100, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid", borderColor: tscFilter === t ? "rgba(124,58,237,.4)" : "rgba(124,58,237,.12)", background: tscFilter === t ? "rgba(124,58,237,.1)" : "#fff", color: tscFilter === t ? T.accent : T.text2 }}>
                {t || "All TSC"}
              </button>
            ))}
            <div style={{ width: 1, height: 20, background: "rgba(124,58,237,.12)", margin: "0 4px" }} />
            {["", "IMPLEMENTED", "IN_PROGRESS", "NOT_STARTED"].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                style={{ padding: "5px 13px", borderRadius: 100, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid", borderColor: statusFilter === s ? "rgba(124,58,237,.4)" : "rgba(124,58,237,.12)", background: statusFilter === s ? "rgba(124,58,237,.1)" : "#fff", color: statusFilter === s ? T.accent : T.text2 }}>
                {s ? STATUS[s]?.label : "All Status"}
              </button>
            ))}
            <span style={{ marginLeft: "auto", fontSize: 12, color: T.muted }}>{filtered.length} controls</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {filtered.map(c => {
              const st = STATUS[c.status] || STATUS.NOT_STARTED;
              const tscCfg = TSC[c.tsc] || { color: T.accent };
              const StIcon = st.Icon;
              return (
                <div key={c.id} onClick={() => setExpanded(e => ({ ...e, [c.id]: !e[c.id] }))}
                  style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 11, padding: "12px 16px", cursor: "pointer", transition: "border-color .15s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(124,58,237,.25)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontFamily: T.mono, fontSize: 11, color: tscCfg.color, minWidth: 50, fontWeight: 700 }}>{c.id}</span>
                    <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: T.ink }}>{c.name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {c.automated && <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 9, background: "rgba(124,58,237,.08)", color: T.accent, borderRadius: 4, padding: "2px 6px", fontWeight: 700 }}><Zap size={9} /> AUTO</span>}
                      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5, background: st.bg, color: st.color, borderRadius: 100, padding: "4px 11px", fontSize: 11, fontWeight: 700, minWidth: 116 }}>
                        <StIcon size={12} /> {st.label}
                      </span>
                    </div>
                  </div>
                  {expanded[c.id] && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px dashed rgba(124,58,237,.12)", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                      <div><div style={{ fontSize: 10, color: T.muted, marginBottom: 3, textTransform: "uppercase", letterSpacing: ".4px" }}>Owner</div><div style={{ fontSize: 13, color: T.ink, fontWeight: 500 }}>{c.owner}</div></div>
                      <div><div style={{ fontSize: 10, color: T.muted, marginBottom: 3, textTransform: "uppercase", letterSpacing: ".4px" }}>Evidence</div><div style={{ fontSize: 13, color: T.ink, fontWeight: 500 }}>{c.evidence} items</div></div>
                      <div><div style={{ fontSize: 10, color: T.muted, marginBottom: 3, textTransform: "uppercase", letterSpacing: ".4px" }}>Monitoring</div><div style={{ fontSize: 13, color: c.automated ? T.accent : T.muted, fontWeight: 500 }}>{c.automated ? "Automated" : "Manual"}</div></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ════════ TSC BREAKDOWN (newly wired) ════════ */}
      {tab === "tsc" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {Object.entries(TSC).map(([key, tsc]) => {
            const tscControls = DEMO_CONTROLS.filter(c => c.tsc === key);
            const done = tscControls.filter(c => c.status === "IMPLEMENTED").length;
            const prog = tscControls.filter(c => c.status === "IN_PROGRESS").length;
            const pct = tscControls.length > 0 ? Math.round(done / tscControls.length * 100) : 0;
            return (
              <div key={key} style={{ ...cardBase, padding: 22, borderLeft: `3px solid ${tsc.color}`, borderRadius: 14 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <span style={{ fontFamily: T.mono, fontSize: 16, fontWeight: 800, color: tsc.color }}>{key}</span>
                      <span style={{ fontFamily: T.display, fontSize: 16, fontWeight: 700, color: T.ink }}>{tsc.name}</span>
                    </div>
                    <p style={{ fontSize: 12.5, color: T.text2, lineHeight: 1.5, maxWidth: 520 }}>{tsc.desc}</p>
                  </div>
                  <div style={{ textAlign: "right", minWidth: 90 }}>
                    <div style={{ fontFamily: T.display, fontSize: 30, fontWeight: 800, color: tsc.color, lineHeight: 1 }}>{pct}%</div>
                    <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>{done} of {tscControls.length} done</div>
                  </div>
                </div>
                <div style={{ height: 6, background: `${tsc.color}15`, borderRadius: 3, overflow: "hidden", margin: "16px 0 12px" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: tsc.color, borderRadius: 3, transition: "width 1s ease" }} />
                </div>
                <div style={{ display: "flex", gap: 18, fontSize: 12, color: T.text2 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><CircleCheck size={13} color={T.green} /> {done} implemented</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><CircleDot size={13} color={T.amber} /> {prog} in progress</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Circle size={13} color={T.muted} /> {tscControls.length - done - prog} not started</span>
                  <button onClick={() => { setTab("controls"); setTscFilter(key); }}
                    style={{ marginLeft: "auto", background: "none", border: "none", color: tsc.color, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                    View controls →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ════════ AUDIT READINESS ════════ */}
      {tab === "readiness" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={{ ...cardBase, padding: 22 }}>
            <h4 style={{ fontFamily: T.display, fontSize: 15, fontWeight: 700, color: T.ink, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <ClipboardCheck size={16} color={T.accent} /> Audit readiness checklist
            </h4>
            {[
              { item: "System Description document", done: true },
              { item: "All TSC criteria mapped to controls", done: true },
              { item: "90-day observation period started", done: true },
              { item: "Evidence collection automated", done: true },
              { item: "Policy library complete", done: false },
              { item: "Employee training completed", done: false },
              { item: "Vendor security reviews done", done: false },
              { item: "Penetration test completed", done: false },
              { item: "Management review conducted", done: false },
              { item: "Auditor portal configured", done: true },
            ].map((item, i, arr) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: i < arr.length - 1 ? "1px solid rgba(124,58,237,.05)" : "none" }}>
                {item.done
                  ? <CircleCheck size={18} color={T.green} style={{ flexShrink: 0 }} />
                  : <Circle size={18} color={T.muted} style={{ flexShrink: 0 }} />}
                <span style={{ fontSize: 13, color: item.done ? T.ink : T.muted, fontWeight: item.done ? 500 : 400 }}>{item.item}</span>
              </div>
            ))}
          </div>
          <div>
            <div style={{ background: "linear-gradient(135deg,#2d0a5a,#7c3aed)", borderRadius: 16, padding: 24, marginBottom: 14, color: "#fff" }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: "rgba(255,255,255,.7)" }}>Estimated audit date</div>
              <div style={{ fontFamily: T.display, fontSize: 30, fontWeight: 800, marginBottom: 8 }}>June 2026</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.65)" }}>~4 weeks away at current pace</div>
            </div>
            <div style={{ background: T.card, border: "1px solid rgba(225,29,72,.15)", borderRadius: 16, padding: 20 }}>
              <h4 style={{ fontFamily: T.display, fontSize: 14, fontWeight: 700, color: T.ink, marginBottom: 12 }}>Blockers to fix first</h4>
              {[
                { control: "CC7.5", issue: "No incident recovery runbook documented" },
                { control: "CC3.3", issue: "Fraud risk assessment not completed" },
                { control: "P5.1", issue: "User data access request process missing" },
              ].map((b, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10, padding: "10px 12px", background: "rgba(225,29,72,.03)", borderRadius: 9, border: "1px solid rgba(225,29,72,.1)" }}>
                  <span style={{ fontFamily: T.mono, fontSize: 10, color: T.red, fontWeight: 700, minWidth: 40 }}>{b.control}</span>
                  <span style={{ fontSize: 12, color: T.text2, lineHeight: 1.5 }}>{b.issue}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

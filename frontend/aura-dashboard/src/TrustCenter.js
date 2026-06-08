import { useState } from "react";
import { Globe, Share2, Download, CheckCircle, AlertCircle, Clock, Copy, ExternalLink, Shield, Zap, Lock, Activity } from "lucide-react";

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

const FRAMEWORKS = [
  {
    name: "ISO 27001", pct: 84, color: T.purple,
    status: "Certified", statusColor: T.green,
    auditor: "BSI Group India", certified: "2023-09-12",
  },
  {
    name: "SOC 2 Type II", pct: 91, color: T.green,
    status: "Certified", statusColor: T.green,
    auditor: "Deloitte India", certified: "2023-11-01",
  },
  {
    name: "RBI Cybersecurity", pct: 73, color: T.blue,
    status: "Audit-ready", statusColor: T.blue,
    auditor: null, certified: null,
  },
  {
    name: "CERT-In", pct: 68, color: T.amber,
    status: "In progress", statusColor: T.amber,
    auditor: null, certified: null,
  },
  {
    name: "DPDP Act 2023", pct: 56, color: T.red,
    status: "In progress", statusColor: T.red,
    auditor: null, certified: null,
  },
];

const SECURITY_OVERVIEW = [
  {
    icon: "🔐", title: "Encryption", status: "Good", statusColor: T.green,
    desc: "AES-256 at rest · TLS 1.3 in transit · HSTS enabled",
  },
  {
    icon: "🛡️", title: "Access control", status: "Good", statusColor: T.green,
    desc: "SSO + MFA enforced · RBAC · Zero-trust architecture",
  },
  {
    icon: "⚡", title: "Availability", status: "Good", statusColor: T.green,
    desc: "99.98% uptime SLA · Multi-AZ deployment · Auto-failover",
  },
  {
    icon: "🔍", title: "Vulnerability mgmt", status: "Review", statusColor: T.amber,
    desc: "Weekly Tenable scans · Critical patches in 24h",
  },
  {
    icon: "🚨", title: "Incident response", status: "Good", statusColor: T.green,
    desc: "24/7 SOC · CERT-In reporting · 6h SLA for P0",
  },
  {
    icon: "🇮🇳", title: "Data residency", status: "Good", statusColor: T.green,
    desc: "All data stored in India (Mumbai) · DPDP compliant",
  },
];

const DOCUMENTS = [
  { type: "PDF",  title: "Security whitepaper",         desc: "Technical overview of AURA's security controls and architecture",           size: "2.4 MB",  restricted: false },
  { type: "PDF",  title: "SOC 2 Type II report",        desc: "Full audit report — request via NDA",                                       size: null,      restricted: true  },
  { type: "PDF",  title: "ISO 27001 certificate",       desc: "Current certificate valid through Sep 2025",                                size: "148 KB",  restricted: false },
  { type: "PDF",  title: "DPDP compliance statement",   desc: "Our statement of compliance with DPDP Act 2023",                           size: "380 KB",  restricted: false },
  { type: "PDF",  title: "Penetration test summary",    desc: "Q4 2023 pentest executive summary (Cobalt Strike)",                        size: "1.1 MB",  restricted: false },
  { type: "DOCX", title: "Data processing addendum",   desc: "DPA for enterprise customers under DPDP/GDPR",                             size: "240 KB",  restricted: false },
];

function FrameworkCard({ fw }) {
  return (
    <div style={{
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderRadius: 14,
      padding: "22px 20px",
      position: "relative",
      overflow: "hidden",
      transition: "all 0.15s",
      cursor: "default",
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = `${fw.color}40`; e.currentTarget.style.background = T.surface2; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.surface; }}
    >
      {/* Left color bar */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0,
        width: 3, background: fw.color, borderRadius: "14px 0 0 14px",
      }} />

      {/* Top row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `${fw.color}18`,
          border: `1px solid ${fw.color}30`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Shield size={16} color={fw.color} />
        </div>
        {fw.status && (
          <span style={{
            fontSize: 10, fontWeight: 700,
            color: fw.statusColor,
            background: `${fw.statusColor}18`,
            border: `1px solid ${fw.statusColor}30`,
            padding: "2px 9px", borderRadius: 6,
            display: "flex", alignItems: "center", gap: 4,
          }}>
            <CheckCircle size={9} />
            {fw.status}
          </span>
        )}
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 10 }}>{fw.name}</div>

      {/* Big percentage */}
      <div style={{ fontSize: 32, fontWeight: 900, color: fw.color, fontFamily: T.mono, letterSpacing: "-1px", marginBottom: 10 }}>
        {fw.pct}%
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, marginBottom: 12, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${fw.pct}%`,
          background: `linear-gradient(90deg, ${fw.color}80, ${fw.color})`,
          borderRadius: 2,
        }} />
      </div>

      {/* Footer */}
      {fw.auditor ? (
        <div>
          <div style={{ fontSize: 11, color: T.muted }}>Auditor: {fw.auditor}</div>
          <div style={{ fontSize: 11, color: T.muted }}>Certified: {fw.certified}</div>
        </div>
      ) : (
        <div style={{ fontSize: 11, color: T.muted }}>{fw.status}</div>
      )}
    </div>
  );
}

export default function TrustCenter({ token, tenantId }) {
  const [copied, setCopied] = useState(false);
  const trustUrl = `https://www.auragrc.in/trust/tenant_democorp001`;

  const copyLink = () => {
    navigator.clipboard.writeText(trustUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.text, fontFamily: T.body, padding: "28px 32px", overflowY: "auto" }}>

      {/* ─── Header ─── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontFamily: T.display, fontSize: 26, fontWeight: 800, color: T.text, letterSpacing: "-0.5px" }}>
            Trust Center
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: T.muted }}>
            Public-facing compliance status and security documentation
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{
            display: "flex", alignItems: "center", gap: 7, padding: "10px 18px",
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 10, color: T.muted2, fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>
            <Globe size={14} /> View public page
          </button>
          <button style={{
            display: "flex", alignItems: "center", gap: 7, padding: "10px 18px",
            background: "linear-gradient(135deg, #7c3aed, #8b5cf6)",
            border: "none", borderRadius: 10, color: "#fff",
            fontSize: 13, fontWeight: 700, cursor: "pointer",
            boxShadow: "0 4px 20px rgba(139,92,246,0.35)",
          }}>
            <Share2 size={14} /> Share trust center
          </button>
        </div>
      </div>

      {/* ─── System status banner ─── */}
      <div style={{
        background: T.surface, border: `1px solid rgba(16,185,129,0.25)`,
        borderRadius: 12, padding: "14px 20px",
        display: "flex", alignItems: "center", gap: 12,
        marginBottom: 28,
      }}>
        <div style={{ width: 9, height: 9, borderRadius: "50%", background: T.green, boxShadow: `0 0 8px ${T.green}`, flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: T.green, flex: 1 }}>All systems operational</span>
        <span style={{ fontSize: 12, color: T.muted }}>API · Dashboard · Evidence collector · SSH scanner · Last checked: just now</span>
        <div style={{ display: "flex", gap: 24 }}>
          {[{ label: "Uptime", val: "99.98%" }, { label: "Avg response", val: "84ms" }, { label: "Incidents (30d)", val: "0" }].map(({ label, val }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: T.text, fontFamily: T.mono }}>{val}</div>
              <div style={{ fontSize: 10, color: T.muted }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Compliance Status ─── */}
      <h2 style={{ fontFamily: T.display, fontSize: 17, fontWeight: 800, color: T.text, margin: "0 0 16px", letterSpacing: "-0.2px" }}>
        Compliance status
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 32 }}>
        {FRAMEWORKS.map(fw => <FrameworkCard key={fw.name} fw={fw} />)}
      </div>

      {/* ─── Security Overview ─── */}
      <h2 style={{ fontFamily: T.display, fontSize: 17, fontWeight: 800, color: T.text, margin: "0 0 16px", letterSpacing: "-0.2px" }}>
        Security overview
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 32 }}>
        {SECURITY_OVERVIEW.map(item => (
          <div key={item.title} style={{
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 12, padding: "18px 20px",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = T.surface2}
          onMouseLeave={e => e.currentTarget.style.background = T.surface}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <span style={{ fontSize: 22 }}>{item.icon}</span>
              <span style={{
                fontSize: 10, fontWeight: 700,
                color: item.statusColor,
                background: `${item.statusColor}18`,
                border: `1px solid ${item.statusColor}30`,
                padding: "2px 9px", borderRadius: 6,
                display: "flex", alignItems: "center", gap: 4,
              }}>
                {item.status === "Good" ? <CheckCircle size={9} /> : <AlertCircle size={9} />}
                {item.status}
              </span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 6 }}>{item.title}</div>
            <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.5 }}>{item.desc}</div>
          </div>
        ))}
      </div>

      {/* ─── Security Documentation ─── */}
      <h2 style={{ fontFamily: T.display, fontSize: 17, fontWeight: 800, color: T.text, margin: "0 0 16px", letterSpacing: "-0.2px" }}>
        Security documentation
      </h2>
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: 14, overflow: "hidden", marginBottom: 32,
      }}>
        {DOCUMENTS.map((doc, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 16,
            padding: "16px 20px",
            borderBottom: i < DOCUMENTS.length - 1 ? `1px solid ${T.border}` : "none",
            transition: "background 0.12s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            {/* File type badge */}
            <div style={{
              width: 44, height: 44, borderRadius: 10, flexShrink: 0,
              background: doc.type === "PDF" ? "rgba(239,68,68,0.12)" : "rgba(59,130,246,0.12)",
              border: `1px solid ${doc.type === "PDF" ? "rgba(239,68,68,0.2)" : "rgba(59,130,246,0.2)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 800, fontFamily: T.mono,
              color: doc.type === "PDF" ? T.red : T.blue,
            }}>
              {doc.type}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 2 }}>{doc.title}</div>
              <div style={{ fontSize: 11, color: T.muted }}>{doc.desc}</div>
            </div>

            {/* Size / Restricted */}
            {doc.restricted ? (
              <span style={{
                fontSize: 11, fontWeight: 600, color: T.muted,
                background: T.surface2, border: `1px solid ${T.border}`,
                padding: "3px 10px", borderRadius: 6,
              }}>Restricted</span>
            ) : (
              <span style={{ fontSize: 12, color: T.muted, fontFamily: T.mono }}>{doc.size}</span>
            )}

            {/* Download */}
            <button style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 16px",
              background: T.surface2, border: `1px solid ${T.border}`,
              borderRadius: 8, color: T.text,
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              transition: "all 0.15s", flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderHi; e.currentTarget.style.color = T.accent2; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.text; }}
            >
              <Download size={13} /> Download
            </button>
          </div>
        ))}
      </div>

      {/* ─── Public Trust Center Link ─── */}
      <div style={{
        background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(139,92,246,0.08))",
        border: `1px solid rgba(139,92,246,0.25)`,
        borderRadius: 14, padding: "20px 24px",
        display: "flex", alignItems: "center", gap: 16,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 4, fontFamily: T.display }}>
            🔒 Demo Corporation Trust Center
          </div>
          <div style={{ fontSize: 12, color: T.muted }}>
            Share this link with customers to prove your compliance posture
          </div>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: T.surface, border: `1px solid ${T.border}`,
          borderRadius: 8, padding: "8px 14px",
        }}>
          <span style={{ fontSize: 12, color: T.muted2, fontFamily: T.mono }}>{trustUrl}</span>
        </div>
        <button
          onClick={copyLink}
          style={{
            display: "flex", alignItems: "center", gap: 7, padding: "10px 18px",
            background: copied ? T.green : "linear-gradient(135deg, #7c3aed, #8b5cf6)",
            border: "none", borderRadius: 10, color: "#fff",
            fontSize: 13, fontWeight: 700, cursor: "pointer",
            boxShadow: "0 4px 20px rgba(139,92,246,0.3)",
            transition: "all 0.2s", flexShrink: 0,
          }}
        >
          <Copy size={13} /> {copied ? "Copied!" : "Copy Link"}
        </button>
      </div>
    </div>
  );
}

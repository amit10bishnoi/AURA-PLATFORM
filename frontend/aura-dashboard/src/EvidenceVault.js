import { useState, useRef } from "react";
import {
  Upload, Search, CheckCircle, AlertCircle, XCircle,
  FileText, Download, Eye, Plus, RefreshCw
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
};

const FW_COLORS = {
  "SOC 2":    { bg:"rgba(16,185,129,0.12)",  text:"#34d399", border:"rgba(16,185,129,0.2)"  },
  "ISO 27001":{ bg:"rgba(139,92,246,0.15)",  text:"#a78bfa", border:"rgba(139,92,246,0.25)" },
  "CERT-In":  { bg:"rgba(245,158,11,0.12)",  text:"#fbbf24", border:"rgba(245,158,11,0.2)"  },
  "DPDP":     { bg:"rgba(244,114,182,0.12)", text:"#f472b6", border:"rgba(244,114,182,0.2)" },
  "RBI":      { bg:"rgba(59,130,246,0.12)",  text:"#60a5fa", border:"rgba(59,130,246,0.2)"  },
};

const EVIDENCE = [
  { id:"EV-001", file:"okta_mfa_coverage_report.pdf",   type:"Auto",   fw:"SOC 2",     control:"CC6.1",  uploaded:"2024-01-10", expiry:"2024-07-10", size:"284 KB", status:"Valid"    },
  { id:"EV-002", file:"aws_iam_policy_export.json",      type:"Auto",   fw:"ISO 27001", control:"AC-1.1", uploaded:"2024-01-10", expiry:"2024-04-10", size:"1.2 MB", status:"Valid"    },
  { id:"EV-003", file:"penetration_test_report_q4.pdf",  type:"Manual", fw:"CERT-In",   control:"IR-3.1", uploaded:"2023-12-15", expiry:"2024-06-15", size:"4.8 MB", status:"Valid"    },
  { id:"EV-004", file:"data_flow_diagram_v2.png",         type:"Manual", fw:"DPDP",      control:"DP-4.1", uploaded:"2024-01-08", expiry:"2025-01-08", size:"892 KB", status:"Valid"    },
  { id:"EV-005", file:"crowdstrike_edr_config.json",      type:"Auto",   fw:"ISO 27001", control:"IR-3.2", uploaded:"2024-01-10", expiry:"2024-03-10", size:"156 KB", status:"Expiring" },
  { id:"EV-006", file:"rbi_cyber_framework_gap.xlsx",     type:"Manual", fw:"RBI",       control:"CC-2.1", uploaded:"2023-11-20", expiry:"2024-01-20", size:"320 KB", status:"Expired"  },
  { id:"EV-007", file:"splunk_siem_alert_log.csv",        type:"Auto",   fw:"SOC 2",     control:"CC7.2",  uploaded:"2024-01-09", expiry:"2024-07-09", size:"2.1 MB", status:"Valid"    },
  { id:"EV-008", file:"github_branch_protection.json",    type:"Auto",   fw:"SOC 2",     control:"CC8.1",  uploaded:"2024-01-10", expiry:"2024-04-10", size:"48 KB",  status:"Valid"    },
  { id:"EV-009", file:"vulnerability_scan_report.html",   type:"Auto",   fw:"ISO 27001", control:"CR-2.3", uploaded:"2024-01-07", expiry:"2024-02-07", size:"3.4 MB", status:"Expiring" },
  { id:"EV-010", file:"consent_manager_audit_log.csv",    type:"Auto",   fw:"DPDP",      control:"DP-4.3", uploaded:"2024-01-10", expiry:"2025-01-10", size:"678 KB", status:"Valid"    },
];

function TypeBadge({ type }) {
  const isAuto = type === "Auto";
  return (
    <span style={{
      fontSize:10, fontWeight:700,
      color: isAuto ? T.blue : T.muted2,
      background: isAuto ? "rgba(59,130,246,0.12)" : "rgba(148,163,184,0.1)",
      border: isAuto ? "1px solid rgba(59,130,246,0.2)" : "1px solid rgba(148,163,184,0.15)",
      borderRadius:4, padding:"2px 8px", fontFamily:T.mono
    }}>
      {type}
    </span>
  );
}

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

function StatusCell({ status, expiry }) {
  const map = {
    Valid:    { color:"#10B981", icon:<CheckCircle size={13}/> },
    Expiring: { color:"#F59E0B", icon:<AlertCircle size={13}/> },
    Expired:  { color:"#EF4444", icon:<XCircle size={13}/> },
  };
  const c = map[status] || map.Valid;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:5 }}>
      <span style={{ color:c.color }}>{c.icon}</span>
      <span style={{
        fontSize:12, fontWeight:600, color:c.color,
        fontFamily: status === "Expiring" || status === "Expired" ? T.mono : T.body
      }}>
        {status === "Expiring" ? expiry : status === "Expired" ? expiry : status}
      </span>
    </div>
  );
}

export default function EvidenceVault({ token, tenantId }) {
  const [fwFilter, setFwFilter]   = useState("All");
  const [search, setSearch]       = useState("");
  const [dragOver, setDragOver]   = useState(false);
  const [evidence, setEvidence]   = useState(EVIDENCE);
  const fileRef = useRef();

  const stats = [
    { label:"Total evidence",  value:evidence.length, color:T.purple },
    { label:"Auto-collected",  value:evidence.filter(e=>e.type==="Auto").length,   color:T.blue  },
    { label:"Manual uploads",  value:evidence.filter(e=>e.type==="Manual").length, color:T.green },
    { label:"Expiring in 30d", value:evidence.filter(e=>e.status==="Expiring").length, color:T.amber },
  ];

  const fwOptions = ["All","ISO 27001","SOC 2","RBI","CERT-In","DPDP"];

  const visible = evidence
    .filter(e => fwFilter === "All" || e.fw === fwFilter)
    .filter(e => !search || e.file.toLowerCase().includes(search.toLowerCase()) || e.control.toLowerCase().includes(search.toLowerCase()));

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    // In production: upload to API
  };

  return (
    <div style={{ background:T.bg, minHeight:"100vh", color:T.text, fontFamily:T.body, padding:"28px 32px" }}>

      {/* ─── Header ─── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
        marginBottom:24, flexWrap:"wrap", gap:16 }}>
        <div>
          <h1 style={{ margin:"0 0 4px", fontFamily:T.display, fontSize:24, fontWeight:800,
            color:T.text, letterSpacing:"-0.4px" }}>
            Evidence Vault
          </h1>
          <p style={{ margin:0, fontSize:13, color:T.muted }}>
            {evidence.filter(e=>e.status==="Valid").length} valid · {evidence.filter(e=>e.status==="Expiring").length} expiring · {evidence.filter(e=>e.status==="Expired").length} expired
          </p>
        </div>
        <button onClick={() => fileRef.current?.click()} style={{
          display:"flex", alignItems:"center", gap:7, padding:"10px 20px",
          background:"linear-gradient(135deg, #7c3aed, #8b5cf6)",
          border:"none", borderRadius:10, color:"#fff",
          fontSize:13, fontWeight:700, cursor:"pointer",
          boxShadow:"0 4px 16px rgba(139,92,246,0.3)"
        }}>
          <Plus size={14}/> Upload evidence
        </button>
        <input ref={fileRef} type="file" style={{ display:"none" }} multiple/>
      </div>

      {/* ─── Stat Cards ─── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
        {stats.map(({ label, value, color }) => (
          <div key={label} style={{
            background:T.surface, border:`1px solid ${T.border}`,
            borderRadius:12, padding:"16px 20px"
          }}>
            <div style={{ fontSize:11, fontWeight:700, color:T.muted,
              textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:6 }}>
              {label}
            </div>
            <div style={{ fontFamily:T.mono, fontSize:28, fontWeight:800, color }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* ─── Drop Zone ─── */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        style={{
          border: dragOver ? `2px dashed ${T.accent}` : `2px dashed ${T.border}`,
          borderRadius:12, padding:"32px 20px",
          display:"flex", flexDirection:"column", alignItems:"center", gap:8,
          cursor:"pointer", marginBottom:20, transition:"all 0.2s",
          background: dragOver ? "rgba(139,92,246,0.05)" : "transparent",
        }}
      >
        <Upload size={24} color={dragOver ? T.accent : T.muted}/>
        <div style={{ fontSize:13, color: dragOver ? T.accent2 : T.muted2, fontWeight:500 }}>
          Drag & drop evidence files here, or click to browse
        </div>
        <div style={{ fontSize:11, color:T.muted }}>
          PDF, CSV, JSON, XLSX, PNG accepted · Max 50MB per file
        </div>
      </div>

      {/* ─── Filters + Search ─── */}
      <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap", alignItems:"center" }}>
        {fwOptions.map(fw => (
          <button key={fw} onClick={() => setFwFilter(fw)} style={{
            padding:"6px 14px", borderRadius:20, fontSize:12, fontWeight:600,
            background: fwFilter===fw ? T.accent : T.surface,
            border: fwFilter===fw ? `1px solid ${T.accent}` : `1px solid ${T.border}`,
            color: fwFilter===fw ? "#fff" : T.muted2,
            cursor:"pointer", transition:"all 0.15s"
          }}>{fw}</button>
        ))}
        <div style={{
          marginLeft:"auto", display:"flex", alignItems:"center", gap:8,
          background:T.surface, border:`1px solid ${T.border}`,
          borderRadius:8, padding:"7px 12px", flex:"0 0 220px"
        }}>
          <Search size={13} color={T.muted}/>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search evidence..."
            style={{ background:"none", border:"none", outline:"none",
              color:T.text, fontSize:12, width:"100%", fontFamily:T.body }}
          />
        </div>
      </div>

      {/* ─── Table ─── */}
      <div style={{
        background:T.surface, border:`1px solid ${T.border}`,
        borderRadius:14, overflow:"hidden"
      }}>
        {/* Header */}
        <div style={{
          display:"grid",
          gridTemplateColumns:"70px 32px 1fr 70px 110px 90px 100px 100px 70px 90px",
          padding:"10px 18px",
          borderBottom:`1px solid ${T.border}`,
          background:T.surface2
        }}>
          {["ID","","FILE NAME","TYPE","FRAMEWORK","CONTROL","UPLOADED","EXPIRY","SIZE","STATUS"].map(h => (
            <div key={h} style={{
              fontSize:10, fontWeight:700, color:T.muted,
              textTransform:"uppercase", letterSpacing:"0.09em"
            }}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        {visible.map((ev, i) => (
          <div key={ev.id} style={{
            display:"grid",
            gridTemplateColumns:"70px 32px 1fr 70px 110px 90px 100px 100px 70px 90px",
            padding:"13px 18px",
            borderBottom: i < visible.length-1 ? `1px solid ${T.border}` : "none",
            alignItems:"center",
            transition:"background 0.1s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            {/* ID */}
            <div style={{ fontFamily:T.mono, fontSize:11, color:T.muted, fontWeight:600 }}>
              {ev.id}
            </div>

            {/* File icon */}
            <div><FileText size={14} color={T.muted}/></div>

            {/* File name */}
            <div style={{ fontSize:12, fontWeight:600, color:T.text, paddingRight:12,
              whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
              {ev.file}
            </div>

            {/* Type */}
            <div><TypeBadge type={ev.type}/></div>

            {/* Framework */}
            <div><FwBadge fw={ev.fw}/></div>

            {/* Control */}
            <div style={{ fontFamily:T.mono, fontSize:11, color:T.accent2, fontWeight:700 }}>
              {ev.control}
            </div>

            {/* Uploaded */}
            <div style={{ fontFamily:T.mono, fontSize:11, color:T.muted }}>{ev.uploaded}</div>

            {/* Expiry */}
            <div style={{
              fontFamily:T.mono, fontSize:11,
              color: ev.status === "Expiring" ? T.amber : ev.status === "Expired" ? T.red : T.muted
            }}>
              {ev.expiry}
            </div>

            {/* Size */}
            <div style={{ fontFamily:T.mono, fontSize:11, color:T.muted }}>{ev.size}</div>

            {/* Status */}
            <div><StatusCell status={ev.status} expiry={ev.expiry}/></div>
          </div>
        ))}

        {visible.length === 0 && (
          <div style={{ padding:"40px", textAlign:"center", color:T.muted }}>
            No evidence matches the current filters.
          </div>
        )}
      </div>
    </div>
  );
}

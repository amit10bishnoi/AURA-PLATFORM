import { useState, useEffect, useCallback } from "react";
import {
  Clock, Search, Filter, Download, RefreshCw, User, Shield,
  AlertTriangle, CheckCircle, XCircle, AlertCircle, Activity,
  ChevronDown, Eye, Zap, Globe, Terminal, FileCheck, Users
} from "lucide-react";

const API = "http://localhost:8000";

const ACTION_ICONS = {
  CONTROL_UPDATED:       { icon: Shield,      color: "#60A5FA" },
  EVIDENCE_UPLOADED:     { icon: FileCheck,   color: "#34D399" },
  RISK_SCAN_COMPLETED:   { icon: Activity,    color: "#A78BFA" },
  INTEGRATION_CONNECTED: { icon: Zap,         color: "#FBBF24" },
  USER_INVITED:          { icon: Users,       color: "#F9A8D4" },
  REPORT_EXPORTED:       { icon: Download,    color: "#6EE7B7" },
  ALERT_TRIGGERED:       { icon: AlertTriangle, color: "#F87171" },
  LOGIN:                 { icon: User,        color: "#94A3B8" },
  TRUST_CENTER_UPDATED:  { icon: Globe,       color: "#7DD3FC" },
  DEFAULT:               { icon: Terminal,    color: "#94A3B8" },
};

const STATUS_CONFIG = {
  SUCCESS: { color: "#34D399", bg: "rgba(52,211,153,.12)", label: "Success" },
  FAILURE: { color: "#F87171", bg: "rgba(248,113,113,.12)", label: "Failure" },
  WARNING: { color: "#FBBF24", bg: "rgba(251,191,36,.12)",  label: "Warning" },
};

const CATEGORIES = ["All", "Compliance", "Evidence", "Risk", "Integration", "User"];
const STATUSES   = ["All", "SUCCESS", "FAILURE", "WARNING"];
const FRAMEWORKS = ["All", "SOC2", "HIPAA", "GDPR", "PCI_DSS", "NIST_CSF", "ISO27001", "DPDP", "RBI"];

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60)   return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

function exportCSV(logs) {
  const headers = ["Time","User","Action","Category","Framework","Resource","Status"];
  const rows = logs.map(l => [
    new Date(l.created_at).toLocaleString(), l.user_name, l.action,
    l.category, l.framework||"", l.resource||"", l.status
  ]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = `audit-logs-${Date.now()}.csv`; a.click();
  URL.revokeObjectURL(url);
}

export default function AuditLogs({ token, tenantId }) {
  const [logs,     setLogs]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [category, setCategory] = useState("All");
  const [status,   setStatus]   = useState("All");
  const [framework,setFramework]= useState("All");
  const [expanded, setExpanded] = useState(null);
  const [stats,    setStats]    = useState({ total:0, success:0, failure:0, warning:0 });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ tenant_id: tenantId || "demo", limit: 100 });
      if (category  !== "All") params.set("category",  category);
      if (status    !== "All") params.set("status",    status);
      if (framework !== "All") params.set("framework", framework);
      if (search)               params.set("search",   search);

      const res  = await fetch(`${API}/api/audit-logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const list = data.logs || [];
      setLogs(list);
      setStats({
        total:   list.length,
        success: list.filter(l => l.status === "SUCCESS").length,
        failure: list.filter(l => l.status === "FAILURE").length,
        warning: list.filter(l => l.status === "WARNING").length,
      });
    } catch (e) {
      // Use built-in demo data from backend
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [token, tenantId, category, status, framework, search]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const getIcon = (action) => {
    const cfg = ACTION_ICONS[action] || ACTION_ICONS.DEFAULT;
    const Icon = cfg.icon;
    return <Icon size={15} color={cfg.color} />;
  };

  return (
    <div style={{ padding: "28px 32px", minHeight: "100vh", background: "transparent" }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28 }}>
        <div>
          <h2 style={{ margin:0, fontSize:22, fontWeight:700, color:"#F1F5F9", display:"flex", alignItems:"center", gap:10 }}>
            <Clock size={22} color="#60A5FA" /> Audit Logs
          </h2>
          <p style={{ margin:"6px 0 0", color:"#64748B", fontSize:13 }}>
            Full activity trail across your compliance platform
          </p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={fetchLogs} style={btnStyle("#1E293B","#334155")}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => exportCSV(logs)} style={btnStyle("#1E3A5F","#2563EB")}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
        {[
          { label:"Total Events",  value:stats.total,   color:"#60A5FA", icon:<Activity size={16}/> },
          { label:"Successful",    value:stats.success, color:"#34D399", icon:<CheckCircle size={16}/> },
          { label:"Failures",      value:stats.failure, color:"#F87171", icon:<XCircle size={16}/> },
          { label:"Warnings",      value:stats.warning, color:"#FBBF24", icon:<AlertCircle size={16}/> },
        ].map(s => (
          <div key={s.label} style={{ background:"#0F172A", border:"1px solid #1E293B", borderRadius:12, padding:"16px 18px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <span style={{ color:"#64748B", fontSize:12 }}>{s.label}</span>
              <span style={{ color:s.color }}>{s.icon}</span>
            </div>
            <div style={{ fontSize:26, fontWeight:700, color:s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
        <div style={{ position:"relative", flex:1, minWidth:200 }}>
          <Search size={14} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#475569" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search actions, users, resources…"
            style={{ width:"100%", background:"#0F172A", border:"1px solid #1E293B", borderRadius:8,
                     padding:"9px 12px 9px 34px", color:"#F1F5F9", fontSize:13, boxSizing:"border-box" }}
          />
        </div>
        {[
          { label:"Category", value:category, setter:setCategory, options:CATEGORIES },
          { label:"Status",   value:status,   setter:setStatus,   options:STATUSES },
          { label:"Framework",value:framework, setter:setFramework,options:FRAMEWORKS },
        ].map(f => (
          <select key={f.label} value={f.value} onChange={e => f.setter(e.target.value)}
            style={{ background:"#0F172A", border:"1px solid #1E293B", borderRadius:8,
                     padding:"9px 14px", color:"#94A3B8", fontSize:13, cursor:"pointer" }}>
            {f.options.map(o => <option key={o}>{o}</option>)}
          </select>
        ))}
      </div>

      {/* Log Table */}
      <div style={{ background:"#0F172A", border:"1px solid #1E293B", borderRadius:14, overflow:"hidden" }}>
        {/* Table header */}
        <div style={{ display:"grid", gridTemplateColumns:"180px 1fr 130px 110px 110px 90px 60px",
                      padding:"12px 16px", borderBottom:"1px solid #1E293B",
                      color:"#475569", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" }}>
          <span>Time</span><span>Action & Resource</span><span>User</span>
          <span>Category</span><span>Framework</span><span>Status</span><span></span>
        </div>

        {loading ? (
          <div style={{ padding:40, textAlign:"center", color:"#475569" }}>
            <RefreshCw size={20} style={{ animation:"spin 1s linear infinite" }} />
            <div style={{ marginTop:8, fontSize:13 }}>Loading audit logs…</div>
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding:40, textAlign:"center", color:"#475569", fontSize:13 }}>
            No audit logs found matching your filters.
          </div>
        ) : (
          logs.map(log => {
            const sc  = STATUS_CONFIG[log.status] || STATUS_CONFIG.SUCCESS;
            const isExp = expanded === log.id;
            return (
              <div key={log.id}>
                <div
                  onClick={() => setExpanded(isExp ? null : log.id)}
                  style={{ display:"grid", gridTemplateColumns:"180px 1fr 130px 110px 110px 90px 60px",
                           padding:"13px 16px", borderBottom:"1px solid #0D1B2E",
                           cursor:"pointer", transition:"background .15s",
                           background: isExp ? "#0D1B2E" : "transparent" }}
                  onMouseEnter={e => { if (!isExp) e.currentTarget.style.background="#0D1B2E"; }}
                  onMouseLeave={e => { if (!isExp) e.currentTarget.style.background="transparent"; }}
                >
                  <span style={{ color:"#475569", fontSize:12, display:"flex", alignItems:"center", gap:6 }}>
                    <Clock size={11} /> {timeAgo(log.created_at)}
                  </span>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:2 }}>
                      {getIcon(log.action)}
                      <span style={{ color:"#E2E8F0", fontSize:13, fontWeight:500 }}>
                        {log.action.replace(/_/g, " ")}
                      </span>
                    </div>
                    {log.resource && (
                      <span style={{ color:"#475569", fontSize:11 }}>{log.resource}</span>
                    )}
                  </div>
                  <div>
                    <div style={{ color:"#CBD5E1", fontSize:12, fontWeight:500 }}>{log.user_name}</div>
                    <div style={{ color:"#475569", fontSize:11 }}>{log.user_email}</div>
                  </div>
                  <span style={{ fontSize:11, color:"#64748B", alignSelf:"center" }}>{log.category}</span>
                  <span style={{ fontSize:11, color:"#64748B", alignSelf:"center" }}>{log.framework || "—"}</span>
                  <span style={{ alignSelf:"center" }}>
                    <span style={{ background:sc.bg, color:sc.color, borderRadius:6,
                                   padding:"3px 8px", fontSize:11, fontWeight:600 }}>
                      {log.status}
                    </span>
                  </span>
                  <span style={{ color:"#475569", alignSelf:"center", textAlign:"center" }}>
                    <ChevronDown size={14} style={{ transform: isExp ? "rotate(180deg)" : "none", transition:".2s" }} />
                  </span>
                </div>
                {isExp && (
                  <div style={{ background:"#060E1C", padding:"14px 20px", borderBottom:"1px solid #0D1B2E" }}>
                    <div style={{ display:"flex", gap:24, flexWrap:"wrap" }}>
                      <div>
                        <div style={{ color:"#475569", fontSize:11, marginBottom:4 }}>IP ADDRESS</div>
                        <div style={{ color:"#94A3B8", fontSize:13 }}>{log.ip_address || "—"}</div>
                      </div>
                      <div>
                        <div style={{ color:"#475569", fontSize:11, marginBottom:4 }}>TIMESTAMP</div>
                        <div style={{ color:"#94A3B8", fontSize:13 }}>{new Date(log.created_at).toLocaleString()}</div>
                      </div>
                      {log.detail && Object.keys(log.detail).length > 0 && (
                        <div>
                          <div style={{ color:"#475569", fontSize:11, marginBottom:4 }}>DETAILS</div>
                          <div style={{ color:"#94A3B8", fontSize:13 }}>
                            {Object.entries(log.detail).map(([k,v]) => (
                              <span key={k} style={{ marginRight:12 }}>
                                <span style={{ color:"#60A5FA" }}>{k}:</span> {JSON.stringify(v)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

function btnStyle(bg, border) {
  return {
    display:"flex", alignItems:"center", gap:6, padding:"9px 14px",
    background:bg, border:`1px solid ${border}`, borderRadius:8,
    color:"#94A3B8", fontSize:13, cursor:"pointer"
  };
}

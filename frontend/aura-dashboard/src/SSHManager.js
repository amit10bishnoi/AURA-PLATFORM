import { useState } from "react";
import {
  Terminal, Plus, RefreshCw, CheckCircle, AlertCircle,
  XCircle, Server, Wifi, Shield, X, Eye, EyeOff
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

const SERVERS = [
  { id:"srv-01", name:"prod-api-01",    ip:"10.0.1.10",  env:"Production",  os:"Ubuntu 22.04",    lastScan:"5m ago",  status:"Healthy"  },
  { id:"srv-02", name:"prod-api-02",    ip:"10.0.1.11",  env:"Production",  os:"Ubuntu 22.04",    lastScan:"5m ago",  status:"Warning"  },
  { id:"srv-03", name:"prod-db-01",     ip:"10.0.1.20",  env:"Production",  os:"Ubuntu 20.04",    lastScan:"8m ago",  status:"Healthy"  },
  { id:"srv-04", name:"staging-app-01", ip:"10.0.2.10",  env:"Staging",     os:"Debian 11",       lastScan:"1h ago",  status:"Healthy"  },
  { id:"srv-05", name:"bastion-host",   ip:"52.68.12.45", env:"Production", os:"Amazon Linux 2",  lastScan:"10m ago", status:"Critical" },
  { id:"srv-06", name:"dev-worker-01",  ip:"10.0.3.10",  env:"Development", os:"Ubuntu 22.04",    lastScan:"2h ago",  status:"Healthy"  },
];

const ENV_COLORS = {
  Production:  { bg:"rgba(239,68,68,0.12)",   text:"#EF4444",  border:"rgba(239,68,68,0.2)"   },
  Staging:     { bg:"rgba(245,158,11,0.12)",  text:"#F59E0B",  border:"rgba(245,158,11,0.2)"  },
  Development: { bg:"rgba(16,185,129,0.12)",  text:"#10B981",  border:"rgba(16,185,129,0.2)"  },
};

const STATUS_MAP = {
  Healthy:  { color:"#10B981", icon:<CheckCircle size={13}/>, dot:"#10B981" },
  Warning:  { color:"#F59E0B", icon:<AlertCircle size={13}/>, dot:"#F59E0B" },
  Critical: { color:"#EF4444", icon:<XCircle size={13}/>,     dot:"#EF4444" },
};

function EnvBadge({ env }) {
  const c = ENV_COLORS[env] || ENV_COLORS.Development;
  return (
    <span style={{
      background:c.bg, color:c.text, border:`1px solid ${c.border}`,
      borderRadius:6, padding:"3px 10px", fontSize:11, fontWeight:700, fontFamily:T.mono
    }}>
      {env}
    </span>
  );
}

function StatusBadge({ status }) {
  const c = STATUS_MAP[status] || STATUS_MAP.Healthy;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
      <span style={{ color:c.color, display:"flex" }}>{c.icon}</span>
      <span style={{ fontSize:13, fontWeight:600, color:c.color }}>{status}</span>
    </div>
  );
}

const EMPTY_SERVER = { name:"", ip:"", env:"Production", os:"Ubuntu 22.04", port:"22", user:"root" };

export default function SSHManager({ token, tenantId }) {
  const [servers, setServers] = useState(SERVERS);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm]       = useState(EMPTY_SERVER);
  const [scanning, setScanning] = useState(null);
  const [showKey, setShowKey] = useState(false);

  const handleScanAll = () => {
    servers.forEach((_, i) => {
      setTimeout(() => setScanning(i), i * 300);
      setTimeout(() => setScanning(null), i * 300 + 1500);
    });
  };

  const handleScan = (id) => {
    setScanning(id);
    setTimeout(() => setScanning(null), 1800);
  };

  const handleAdd = (e) => {
    e.preventDefault();
    const newServer = {
      ...form,
      id: `srv-0${servers.length+1}`,
      lastScan:"Never",
      status:"Healthy",
    };
    setServers(prev => [...prev, newServer]);
    setShowAdd(false);
    setForm(EMPTY_SERVER);
  };

  const healthy  = servers.filter(s => s.status === "Healthy").length;
  const warning  = servers.filter(s => s.status === "Warning").length;
  const critical = servers.filter(s => s.status === "Critical").length;

  return (
    <div style={{ background:T.bg, minHeight:"100vh", color:T.text, fontFamily:T.body, padding:"28px 32px" }}>

      {/* ─── Header ─── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
        marginBottom:24, flexWrap:"wrap", gap:16 }}>
        <div>
          <h1 style={{ margin:"0 0 4px", fontFamily:T.display, fontSize:24, fontWeight:800,
            color:T.text, letterSpacing:"-0.4px", display:"flex", alignItems:"center", gap:10 }}>
            <Terminal size={22} color={T.accent}/> SSH Manager
          </h1>
          <p style={{ margin:0, fontSize:13, color:T.muted }}>
            {servers.length} servers · {healthy} healthy · {critical > 0 ? `${critical} critical` : "0 critical"}
          </p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={handleScanAll} style={{
            display:"flex", alignItems:"center", gap:7, padding:"10px 18px",
            background:T.surface, border:`1px solid ${T.border}`,
            borderRadius:10, color:T.muted2, fontSize:13, fontWeight:600, cursor:"pointer",
            transition:"all 0.15s"
          }}>
            <RefreshCw size={13}/> Scan all servers
          </button>
          <button onClick={() => setShowAdd(true)} style={{
            display:"flex", alignItems:"center", gap:7, padding:"10px 20px",
            background:"linear-gradient(135deg, #7c3aed, #8b5cf6)",
            border:"none", borderRadius:10, color:"#fff",
            fontSize:13, fontWeight:700, cursor:"pointer",
            boxShadow:"0 4px 16px rgba(139,92,246,0.3)"
          }}>
            <Plus size={13}/> Add server
          </button>
        </div>
      </div>

      {/* ─── Status Summary ─── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:24 }}>
        {[
          { label:"Total Servers",  value:servers.length, color:T.accent2 },
          { label:"Healthy",        value:healthy,         color:T.green  },
          { label:"Warning",        value:warning,         color:T.amber  },
          { label:"Critical",       value:critical,        color:T.red    },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background:T.surface, border:`1px solid ${T.border}`,
            borderRadius:12, padding:"16px 20px",
            borderTop:`2px solid ${color}40`
          }}>
            <div style={{ fontFamily:T.mono, fontSize:26, fontWeight:800, color }}>{value}</div>
            <div style={{ fontSize:11, color:T.muted, fontWeight:600, marginTop:3,
              textTransform:"uppercase", letterSpacing:"0.08em" }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* ─── Server Table ─── */}
      <div style={{
        background:T.surface, border:`1px solid ${T.border}`,
        borderRadius:14, overflow:"hidden"
      }}>
        {/* Table header */}
        <div style={{
          display:"grid",
          gridTemplateColumns:"28px 200px 140px 130px 160px 120px 130px 160px",
          padding:"10px 20px",
          borderBottom:`1px solid ${T.border}`,
          background:T.surface2,
        }}>
          {["","SERVER","IP ADDRESS","ENVIRONMENT","OS","LAST SCAN","STATUS","ACTIONS"].map(h => (
            <div key={h} style={{
              fontSize:10, fontWeight:700, color:T.muted,
              textTransform:"uppercase", letterSpacing:"0.1em"
            }}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        {servers.map((srv, i) => {
          const isScanning = scanning === srv.id;
          return (
            <div key={srv.id} style={{
              display:"grid",
              gridTemplateColumns:"28px 200px 140px 130px 160px 120px 130px 160px",
              padding:"16px 20px",
              borderBottom: i < servers.length-1 ? `1px solid ${T.border}` : "none",
              alignItems:"center",
              transition:"background 0.12s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              {/* Terminal icon */}
              <div style={{ color:T.muted, display:"flex" }}>
                <Terminal size={14}/>
              </div>

              {/* Server name */}
              <div style={{ fontFamily:T.mono, fontSize:13, fontWeight:700, color:T.text }}>
                {srv.name}
              </div>

              {/* IP */}
              <div style={{ fontFamily:T.mono, fontSize:12, color:T.muted2 }}>{srv.ip}</div>

              {/* Environment */}
              <div><EnvBadge env={srv.env}/></div>

              {/* OS */}
              <div style={{ fontSize:12, color:T.muted2 }}>{srv.os}</div>

              {/* Last scan */}
              <div style={{ fontSize:12, color:T.muted, fontFamily:T.mono }}>{srv.lastScan}</div>

              {/* Status */}
              <div>
                {isScanning
                  ? <div style={{ display:"flex", alignItems:"center", gap:6, color:T.accent }}>
                      <RefreshCw size={13} style={{ animation:"spin 1s linear infinite" }}/>
                      <span style={{ fontSize:12, fontWeight:600 }}>Scanning</span>
                    </div>
                  : <StatusBadge status={srv.status}/>}
              </div>

              {/* Actions */}
              <div style={{ display:"flex", gap:7 }}>
                <button
                  onClick={() => handleScan(srv.id)}
                  style={{
                    padding:"6px 14px", borderRadius:7, fontSize:12, fontWeight:600,
                    background:T.surface2, border:`1px solid ${T.border}`,
                    color:T.muted2, cursor:"pointer", transition:"all 0.15s"
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderHi; e.currentTarget.style.color = T.text; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border;   e.currentTarget.style.color = T.muted2; }}
                >
                  Scan
                </button>
                <button style={{
                  padding:"6px 14px", borderRadius:7, fontSize:12, fontWeight:600,
                  background:T.surface2, border:`1px solid ${T.border}`,
                  color:T.muted2, cursor:"pointer", transition:"all 0.15s"
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderHi; e.currentTarget.style.color = T.text; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.border;   e.currentTarget.style.color = T.muted2; }}
                >
                  Connect
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══ Add Server Modal ═══ */}
      {showAdd && (
        <div style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,0.75)",
          backdropFilter:"blur(4px)", display:"flex",
          alignItems:"center", justifyContent:"center",
          zIndex:1000, padding:20
        }}>
          <div style={{
            background:T.surface, border:`1px solid ${T.borderHi}`,
            borderRadius:16, padding:28, width:"100%", maxWidth:480
          }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
              <h3 style={{ margin:0, fontFamily:T.display, fontSize:18, fontWeight:800, color:T.text,
                display:"flex", alignItems:"center", gap:8 }}>
                <Terminal size={18} color={T.accent}/> Add server
              </h3>
              <button onClick={() => setShowAdd(false)} style={{
                background:"none", border:"none", color:T.muted, cursor:"pointer", padding:4
              }}>
                <X size={17}/>
              </button>
            </div>

            <form onSubmit={handleAdd}>
              {/* Name + IP row */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
                {[
                  { field:"name", label:"Server Name", placeholder:"prod-api-01" },
                  { field:"ip",   label:"IP Address",  placeholder:"10.0.1.10" },
                ].map(({ field, label, placeholder }) => (
                  <div key={field}>
                    <label style={{ display:"block", fontSize:11, fontWeight:700, color:T.muted,
                      textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>
                      {label}
                    </label>
                    <input required type="text" value={form[field]} placeholder={placeholder}
                      onChange={e => setForm(f => ({ ...f, [field]:e.target.value }))}
                      style={{ width:"100%", padding:"10px 13px",
                        background:T.surface2, border:`1px solid ${T.border}`,
                        borderRadius:8, color:T.text, fontSize:13, outline:"none",
                        boxSizing:"border-box", fontFamily:T.mono
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Environment + OS */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
                <div>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:T.muted,
                    textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>Environment</label>
                  <select value={form.env} onChange={e => setForm(f => ({ ...f, env:e.target.value }))}
                    style={{ width:"100%", padding:"10px 13px",
                      background:T.surface2, border:`1px solid ${T.border}`,
                      borderRadius:8, color:T.text, fontSize:13, outline:"none" }}>
                    <option>Production</option>
                    <option>Staging</option>
                    <option>Development</option>
                  </select>
                </div>
                <div>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:T.muted,
                    textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>OS</label>
                  <select value={form.os} onChange={e => setForm(f => ({ ...f, os:e.target.value }))}
                    style={{ width:"100%", padding:"10px 13px",
                      background:T.surface2, border:`1px solid ${T.border}`,
                      borderRadius:8, color:T.text, fontSize:13, outline:"none" }}>
                    <option>Ubuntu 22.04</option>
                    <option>Ubuntu 20.04</option>
                    <option>Debian 11</option>
                    <option>Amazon Linux 2</option>
                    <option>CentOS 8</option>
                  </select>
                </div>
              </div>

              {/* Port + Username */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
                {[
                  { field:"port", label:"SSH Port", placeholder:"22" },
                  { field:"user", label:"Username",  placeholder:"root" },
                ].map(({ field, label, placeholder }) => (
                  <div key={field}>
                    <label style={{ display:"block", fontSize:11, fontWeight:700, color:T.muted,
                      textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>
                      {label}
                    </label>
                    <input type="text" value={form[field]} placeholder={placeholder}
                      onChange={e => setForm(f => ({ ...f, [field]:e.target.value }))}
                      style={{ width:"100%", padding:"10px 13px",
                        background:T.surface2, border:`1px solid ${T.border}`,
                        borderRadius:8, color:T.text, fontSize:13, outline:"none",
                        boxSizing:"border-box", fontFamily:T.mono
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Auth method */}
              <div style={{ marginBottom:20 }}>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:T.muted,
                  textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>
                  SSH Private Key
                </label>
                <div style={{ position:"relative" }}>
                  <textarea
                    placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
                    rows={3}
                    style={{
                      width:"100%", padding:"10px 40px 10px 13px",
                      background:T.surface2, border:`1px solid ${T.border}`,
                      borderRadius:8, color:T.text, fontSize:12, outline:"none",
                      fontFamily:T.mono, resize:"none", boxSizing:"border-box",
                      filter: showKey ? "none" : "blur(3px)",
                    }}
                  />
                  <button type="button" onClick={() => setShowKey(!showKey)} style={{
                    position:"absolute", top:10, right:10,
                    background:"none", border:"none", color:T.muted, cursor:"pointer"
                  }}>
                    {showKey ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>
              </div>

              <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
                <button type="button" onClick={() => setShowAdd(false)} style={{
                  padding:"10px 18px", background:T.surface2, border:`1px solid ${T.border}`,
                  borderRadius:8, color:T.muted2, fontSize:13, fontWeight:600, cursor:"pointer"
                }}>
                  Cancel
                </button>
                <button type="submit" style={{
                  padding:"10px 22px",
                  background:"linear-gradient(135deg, #7c3aed, #8b5cf6)",
                  border:"none", borderRadius:8, color:"#fff",
                  fontSize:13, fontWeight:700, cursor:"pointer",
                }}>
                  Add server
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

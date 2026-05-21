import { useState, useEffect, useCallback } from "react";
import { Activity, RefreshCw, CheckCircle, XCircle, AlertTriangle, Bell, Clock, Play, Shield } from "lucide-react";
const API = "http://localhost:8000";

const SEV_COLOR = { CRITICAL:"#ef4444", HIGH:"#f97316", MEDIUM:"#f59e0b", LOW:"#10b981" };
const FW_COLOR = { SOC2:"#3b82f6", ISO27001:"#8b5cf6", RBI:"#f97316", DPDP:"#10b981" };

const sty = {
  card:{background:"#111827",border:"1px solid rgba(139,92,246,0.08)",borderRadius:14,padding:"20px 22px",marginBottom:12},
  btnPrimary:{display:"flex",alignItems:"center",gap:6,padding:"8px 18px",background:"linear-gradient(135deg,#7c3aed,#6d28d9)",border:"none",borderRadius:9,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"},
  btnGhost:{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",background:"rgba(139,92,246,0.08)",border:"1px solid rgba(139,92,246,0.2)",borderRadius:9,color:"#a78bfa",fontSize:13,fontWeight:600,cursor:"pointer"},
};

export default function ContinuousMonitoring({token, tenantId}) {
  const [data, setData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [tab, setTab] = useState("checks");
  const [filterFw, setFilterFw] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  const h = {Authorization:`Bearer ${token}`};
  const tid = tenantId||"demo";

  const load = useCallback(async()=>{
    setLoading(true);
    try {
      const [r, a, hist] = await Promise.all([
        fetch(`${API}/api/checks/latest?tenant_id=${tid}`,{headers:h}).then(x=>x.json()),
        fetch(`${API}/api/checks/alerts?tenant_id=${tid}`,{headers:h}).then(x=>x.json()),
        fetch(`${API}/api/checks/history?tenant_id=${tid}`,{headers:h}).then(x=>x.json()),
      ]);
      setData(r); setAlerts(a.alerts||[]); setHistory(hist.history||[]);
    } catch(e) { console.error(e); }
    setLoading(false);
  },[token,tenantId]);

  useEffect(()=>{ load(); const iv=setInterval(load,60000); return()=>clearInterval(iv); },[load]);

  const runChecks = async()=>{
    setRunning(true);
    try {
      const r = await fetch(`${API}/api/checks/run?tenant_id=${tid}`,{method:"POST",headers:h}).then(x=>x.json());
      setData(r);
      await load();
    } catch(e){ console.error(e); }
    setRunning(false);
  };

  const ackAlert = async(id)=>{
    await fetch(`${API}/api/checks/alerts/${id}/acknowledge`,{method:"POST",headers:h});
    setAlerts(a=>a.filter(x=>x.id!==id));
  };

  const results = data?.results||[];
  const summary = data?.summary||{};
  const filtered = results.filter(r=>(filterFw==="All"||r.framework===filterFw)&&(filterStatus==="All"||r.status===filterStatus));

  const unackAlerts = alerts.filter(a=>!a.acknowledged);

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:800,color:"#e2e8f0",display:"flex",alignItems:"center",gap:10,margin:0}}><Activity size={20} color="#10b981"/>Continuous Compliance Monitoring</h2>
          <p style={{color:"#475569",fontSize:13,marginTop:4}}>Automated checks run every hour · {results.length} controls monitored across 4 frameworks</p>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={load} style={sty.btnGhost}><RefreshCw size={13}/>Refresh</button>
          <button onClick={runChecks} disabled={running} style={sty.btnPrimary}>
            {running?<><RefreshCw size={13} style={{animation:"spin 1s linear infinite"}}/>Running checks...</>:<><Play size={13}/>Run Now</>}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:20}}>
        {[
          {l:"Overall Score",v:`${summary.score||0}%`,c:summary.score>=80?"#10b981":summary.score>=60?"#f59e0b":"#ef4444"},
          {l:"Passed",v:summary.passed||0,c:"#10b981"},
          {l:"Failed",v:summary.failed||0,c:"#ef4444"},
          {l:"Critical Failures",v:summary.critical_failures||0,c:"#ef4444"},
          {l:"Active Alerts",v:unackAlerts.length,c:"#f97316"},
        ].map(st=>(
          <div key={st.l} style={{background:"#111827",border:"1px solid rgba(139,92,246,0.08)",borderRadius:12,padding:"16px 18px",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:st.c}}/>
            <div style={{fontSize:22,fontWeight:800,color:st.c}}>{st.v}</div>
            <div style={{fontSize:11,color:"#475569",textTransform:"uppercase",letterSpacing:".5px",marginTop:2}}>{st.l}</div>
          </div>
        ))}
      </div>

      {/* Framework scores */}
      {summary.by_framework&&(
        <div style={sty.card}>
          <div style={{fontSize:14,fontWeight:700,color:"#e2e8f0",marginBottom:14}}>Score by Framework</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
            {Object.entries(summary.by_framework).map(([fw,s])=>(
              <div key={fw} style={{background:"#1a2235",borderRadius:10,padding:"14px 16px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <span style={{fontSize:12,fontWeight:700,color:FW_COLOR[fw]||"#8b5cf6"}}>{fw}</span>
                  <span style={{fontSize:14,fontWeight:800,color:s.score>=80?"#10b981":s.score>=60?"#f59e0b":"#ef4444"}}>{s.score}%</span>
                </div>
                <div style={{background:"rgba(255,255,255,0.06)",borderRadius:4,height:6,overflow:"hidden"}}>
                  <div style={{width:`${s.score}%`,height:"100%",background:FW_COLOR[fw]||"#8b5cf6",borderRadius:4,transition:"width 1s"}}/>
                </div>
                <div style={{fontSize:10,color:"#475569",marginTop:6}}>{s.passed}/{s.total} passing</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{display:"flex",gap:6,marginBottom:16}}>
        {[["checks",`✅ Checks (${results.length})`],["alerts",`🔔 Alerts (${unackAlerts.length})`],["history","📈 History"]].map(([id,lbl])=>(
          <button key={id} onClick={()=>setTab(id)} style={{padding:"8px 18px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",border:"1px solid",borderColor:tab===id?"rgba(139,92,246,0.35)":"rgba(139,92,246,0.1)",background:tab===id?"rgba(139,92,246,0.12)":"transparent",color:tab===id?"#a78bfa":"#475569"}}>{lbl}</button>
        ))}
      </div>

      {/* Checks tab */}
      {tab==="checks"&&(
        <div>
          <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
            {["All","SOC2","ISO27001","RBI","DPDP"].map(fw=>(
              <button key={fw} onClick={()=>setFilterFw(fw)} style={{padding:"5px 12px",borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer",border:"1px solid",borderColor:filterFw===fw?"rgba(139,92,246,0.35)":"rgba(139,92,246,0.1)",background:filterFw===fw?"rgba(139,92,246,0.12)":"transparent",color:filterFw===fw?"#a78bfa":"#475569"}}>{fw}</button>
            ))}
            <div style={{marginLeft:"auto",display:"flex",gap:6}}>
              {["All","PASS","FAIL"].map(s=>(
                <button key={s} onClick={()=>setFilterStatus(s)} style={{padding:"5px 12px",borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer",border:"1px solid",borderColor:filterStatus===s?"rgba(139,92,246,0.35)":"rgba(139,92,246,0.1)",background:filterStatus===s?"rgba(139,92,246,0.12)":"transparent",color:filterStatus===s?"#a78bfa":"#475569"}}>{s}</button>
              ))}
            </div>
          </div>
          {loading?<div style={{textAlign:"center",padding:60,color:"#475569"}}><RefreshCw size={20} style={{animation:"spin 1s linear infinite"}}/></div>:(
            <div>
              {filtered.map(r=>{
                const sc = SEV_COLOR[r.severity]||"#8b5cf6";
                const fw_c = FW_COLOR[r.framework]||"#8b5cf6";
                return(
                  <div key={r.check_id} style={{background:"#111827",border:`1px solid ${r.status==="PASS"?"rgba(16,185,129,0.1)":"rgba(239,68,68,0.15)"}`,borderRadius:12,padding:"14px 18px",marginBottom:8,display:"flex",alignItems:"center",gap:14}}>
                    <div style={{flexShrink:0}}>
                      {r.status==="PASS"?<CheckCircle size={20} color="#10b981"/>:<XCircle size={20} color="#ef4444"/>}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                        <span style={{fontSize:13,fontWeight:600,color:"#e2e8f0"}}>{r.name}</span>
                        <span style={{background:`${fw_c}20`,color:fw_c,borderRadius:100,padding:"1px 8px",fontSize:10,fontWeight:700}}>{r.framework}</span>
                        <span style={{background:`${sc}15`,color:sc,borderRadius:100,padding:"1px 8px",fontSize:10,fontWeight:700}}>{r.severity}</span>
                        <span style={{fontSize:10,color:"#475569"}}>{r.control}</span>
                      </div>
                      <div style={{fontSize:11,color:"#64748b"}}>{r.details}</div>
                      {r.remediation&&<div style={{fontSize:11,color:"#a78bfa",marginTop:4}}>💡 {r.remediation}</div>}
                    </div>
                    <div style={{fontSize:10,color:"#475569",flexShrink:0,textAlign:"right"}}>
                      <div>{new Date(r.checked_at).toLocaleTimeString("en-IN")}</div>
                      <div style={{color:r.status==="PASS"?"#10b981":"#ef4444",fontWeight:700,marginTop:2}}>{r.status}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Alerts tab */}
      {tab==="alerts"&&(
        <div>
          {alerts.length===0&&<div style={{...sty.card,textAlign:"center",padding:60,color:"#475569"}}><Bell size={32} style={{opacity:.3,margin:"0 auto 12px"}}/><p>No alerts — all checks passing.</p></div>}
          {alerts.map(a=>(
            <div key={a.id} style={{background:"#111827",border:`1px solid ${a.acknowledged?"rgba(139,92,246,0.08)":"rgba(239,68,68,0.2)"}`,borderRadius:12,padding:"16px 18px",marginBottom:8,display:"flex",alignItems:"flex-start",gap:14,opacity:a.acknowledged?0.5:1}}>
              <AlertTriangle size={18} color={SEV_COLOR[a.severity]||"#f97316"} style={{flexShrink:0,marginTop:2}}/>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                  <span style={{background:`${SEV_COLOR[a.severity]||"#f97316"}20`,color:SEV_COLOR[a.severity]||"#f97316",borderRadius:100,padding:"2px 10px",fontSize:10,fontWeight:700}}>{a.severity}</span>
                  <span style={{fontSize:13,fontWeight:600,color:"#e2e8f0"}}>{a.title}</span>
                </div>
                <div style={{fontSize:11,color:"#475569"}}>{a.framework} · {a.control} · {new Date(a.created_at).toLocaleString("en-IN")}</div>
              </div>
              {!a.acknowledged&&<button onClick={()=>ackAlert(a.id)} style={{padding:"6px 12px",background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:8,color:"#10b981",fontSize:11,cursor:"pointer",flexShrink:0}}>Acknowledge</button>}
              {a.acknowledged&&<span style={{fontSize:10,color:"#475569",flexShrink:0}}>Acknowledged</span>}
            </div>
          ))}
        </div>
      )}

      {/* History tab */}
      {tab==="history"&&(
        <div style={sty.card}>
          <div style={{fontSize:14,fontWeight:700,color:"#e2e8f0",marginBottom:14}}>Check Run History</div>
          {history.length===0&&<div style={{textAlign:"center",padding:40,color:"#475569"}}>No history yet — run checks to see trend</div>}
          {history.map((h,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:14,padding:"10px 0",borderBottom:"1px solid rgba(139,92,246,0.06)"}}>
              <Clock size={14} color="#475569" style={{flexShrink:0}}/>
              <div style={{flex:1,fontSize:12,color:"#e2e8f0"}}>{new Date(h.run_at).toLocaleString("en-IN")}</div>
              <div style={{display:"flex",gap:16,fontSize:12}}>
                <span style={{color:"#10b981"}}>✓ {h.passed}</span>
                <span style={{color:"#ef4444"}}>✗ {h.failed}</span>
                <span style={{color:h.score>=80?"#10b981":h.score>=60?"#f59e0b":"#ef4444",fontWeight:700}}>{h.score}%</span>
              </div>
              <div style={{width:100,height:4,background:"rgba(255,255,255,0.06)",borderRadius:2,overflow:"hidden"}}>
                <div style={{width:`${h.score}%`,height:"100%",background:h.score>=80?"#10b981":h.score>=60?"#f59e0b":"#ef4444",borderRadius:2}}/>
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

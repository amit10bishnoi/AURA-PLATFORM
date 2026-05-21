import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, RefreshCw, Plus, X, Shield, TrendingUp, TrendingDown, Zap } from "lucide-react";
const API = "http://localhost:8000";
const SEV = { CRITICAL:{c:"#ef4444",bg:"rgba(239,68,68,0.1)"}, HIGH:{c:"#f97316",bg:"rgba(249,115,22,0.1)"}, MEDIUM:{c:"#f59e0b",bg:"rgba(245,158,11,0.1)"}, LOW:{c:"#10b981",bg:"rgba(16,185,129,0.1)"} };
const STATUS = { OPEN:{c:"#ef4444",l:"Open"}, IN_PROGRESS:{c:"#f59e0b",l:"In Progress"}, ACCEPTED:{c:"#8b5cf6",l:"Accepted"}, CLOSED:{c:"#10b981",l:"Closed"} };

const s = {
  wrap:{padding:"0"},
  hdr:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24},
  h2:{fontSize:20,fontWeight:800,color:"#e2e8f0",display:"flex",alignItems:"center",gap:10,margin:0},
  sub:{color:"#475569",fontSize:13,marginTop:4},
  btnRow:{display:"flex",gap:10},
  btnGhost:{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",background:"rgba(139,92,246,0.08)",border:"1px solid rgba(139,92,246,0.2)",borderRadius:9,color:"#a78bfa",fontSize:13,fontWeight:600,cursor:"pointer"},
  btnPrimary:{display:"flex",alignItems:"center",gap:6,padding:"8px 18px",background:"linear-gradient(135deg,#7c3aed,#6d28d9)",border:"none",borderRadius:9,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 14px rgba(124,58,237,0.3)"},
  statGrid:{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:20},
  statCard:{background:"#111827",border:"1px solid rgba(139,92,246,0.1)",borderRadius:12,padding:"16px 18px",position:"relative",overflow:"hidden"},
  statTop:{position:"absolute",top:0,left:0,right:0,height:3},
  statVal:{fontSize:22,fontWeight:800,marginBottom:2},
  statLbl:{fontSize:11,color:"#475569",textTransform:"uppercase",letterSpacing:".6px"},
  tabBar:{display:"flex",gap:6,marginBottom:20},
  tab:(active)=>({padding:"8px 18px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",border:"1px solid",borderColor:active?"rgba(139,92,246,0.35)":"rgba(139,92,246,0.1)",background:active?"rgba(139,92,246,0.12)":"transparent",color:active?"#a78bfa":"#475569"}),
  riskCard:{background:"#111827",border:"1px solid rgba(139,92,246,0.08)",borderRadius:12,padding:"16px 20px",marginBottom:8,display:"flex",alignItems:"flex-start",gap:14},
  riskIcon:(col)=>({width:36,height:36,borderRadius:8,background:col+"20",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}),
  badge:(c,bg)=>({background:bg,color:c,borderRadius:100,padding:"3px 10px",fontSize:11,fontWeight:700,display:"inline-block"}),
  modal:{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(4px)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20},
  modalBox:{background:"#111827",border:"1px solid rgba(139,92,246,0.2)",borderRadius:16,padding:28,width:"100%",maxWidth:480},
  field:{marginBottom:16},
  lbl:{display:"block",fontSize:11,fontWeight:700,color:"#94a3b8",marginBottom:6,textTransform:"uppercase",letterSpacing:".5px"},
  input:{width:"100%",background:"#1a2235",border:"1px solid rgba(139,92,246,0.15)",borderRadius:9,padding:"10px 14px",color:"#e2e8f0",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"},
};

export default function RiskRegister({token,tenantId}) {
  const [risks,setRisks]=useState([]);
  const [score,setScore]=useState(null);
  const [trends,setTrends]=useState([]);
  const [incidents,setIncidents]=useState([]);
  const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState("register");
  const [showAdd,setShowAdd]=useState(false);
  const [form,setForm]=useState({title:"",category:"Technical",likelihood:3,impact:3,owner:"CISO",description:""});

  const load=useCallback(async()=>{
    setLoading(true);
    try {
      const h={Authorization:`Bearer ${token}`};
      const tid=tenantId||"demo";
      const [r,sc,tr,inc]=await Promise.all([
        fetch(`${API}/api/risk/register?tenant_id=${tid}`,{headers:h}).then(x=>x.json()),
        fetch(`${API}/api/risk/score?tenant_id=${tid}`,{headers:h}).then(x=>x.json()),
        fetch(`${API}/api/risk/trends?tenant_id=${tid}`,{headers:h}).then(x=>x.json()),
        fetch(`${API}/api/risk/incidents?tenant_id=${tid}`,{headers:h}).then(x=>x.json()),
      ]);
      setRisks(r.risks||[]); setScore(sc); setTrends(tr.trends||[]); setIncidents(inc.incidents||[]);
    } catch(e){console.error(e);}
    setLoading(false);
  },[token,tenantId]);

  useEffect(()=>{load();},[load]);

  const addRisk=async()=>{
    try {
      await fetch(`${API}/api/risk/register?tenant_id=${tenantId||"demo"}`,{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify(form)});
      setShowAdd(false); setForm({title:"",category:"Technical",likelihood:3,impact:3,owner:"CISO",description:""}); load();
    } catch{alert("Failed to add risk");}
  };

  const getSev=score=>score>=16?"CRITICAL":score>=10?"HIGH":score>=5?"MEDIUM":"LOW";
  const maxTrend=Math.max(...trends.map(t=>t.score),1);

  const statCards=[
    {l:"Risk Score",v:score?`${score.score}/100`:"—",c:score?.color||"#8b5cf6"},
    {l:"Open Risks",v:score?.open_risks??0,c:"#ef4444"},
    {l:"Critical",v:score?.critical_risks??0,c:"#ef4444"},
    {l:"High Risks",v:score?.high_risks??0,c:"#f97316"},
    {l:"Financial Exposure",v:score?`₹${score.total_exposure_cr}Cr`:"—",c:"#8b5cf6"},
  ];

  return (
    <div style={s.wrap}>
      <div style={s.hdr}>
        <div>
          <h2 style={s.h2}><AlertTriangle size={20} color="#ef4444"/>Risk Register & Incident Tracker</h2>
          <p style={s.sub}>FAIR-based risk quantification · Financial impact in ₹Cr · RBI & CERT-In incident reporting</p>
        </div>
        <div style={s.btnRow}>
          <button onClick={load} style={s.btnGhost}><RefreshCw size={13}/>Refresh</button>
          <button onClick={()=>setShowAdd(true)} style={s.btnPrimary}><Plus size={13}/>Add Risk</button>
        </div>
      </div>

      <div style={s.statGrid}>
        {statCards.map(st=>(
          <div key={st.l} style={s.statCard}>
            <div style={{...s.statTop,background:st.c}}/>
            <div style={{...s.statVal,color:st.c}}>{st.v}</div>
            <div style={s.statLbl}>{st.l}</div>
          </div>
        ))}
      </div>

      <div style={s.tabBar}>
        {[["register","📋 Risk Register"],["incidents","🚨 Incidents"],["trends","📈 Trends"]].map(([id,lbl])=>(
          <button key={id} onClick={()=>setTab(id)} style={s.tab(tab===id)}>{lbl}</button>
        ))}
      </div>

      {loading ? (
        <div style={{textAlign:"center",padding:60,color:"#475569"}}><RefreshCw size={20} style={{animation:"spin 1s linear infinite"}}/><p style={{marginTop:12}}>Loading risks…</p></div>
      ) : (
        <>
          {tab==="register" && (
            <div>
              {risks.length===0 && <div style={{textAlign:"center",padding:60,color:"#475569"}}><Shield size={32} style={{opacity:.3}}/><p style={{marginTop:12}}>No risks yet. Add your first risk above.</p></div>}
              {risks.map(r=>{
                const sv=getSev(r.inherent_score); const sc_cfg=SEV[sv]||SEV.LOW; const st_cfg=STATUS[r.status]||STATUS.OPEN;
                return (
                  <div key={r.id} style={s.riskCard}>
                    <div style={s.riskIcon(sc_cfg.c)}><AlertTriangle size={16} color={sc_cfg.c}/></div>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                        <span style={{fontFamily:"monospace",fontSize:10,color:"#475569"}}>{r.id}</span>
                        <span style={{fontSize:14,fontWeight:600,color:"#e2e8f0"}}>{r.title}</span>
                      </div>
                      <div style={{display:"flex",gap:14,flexWrap:"wrap",fontSize:12,color:"#64748b"}}>
                        <span>Category: {r.category}</span>
                        <span>Owner: {r.owner}</span>
                        <span style={{color:"#f97316"}}>₹{(r.financial_impact_inr/10000000).toFixed(1)}Cr exposure</span>
                        {(r.framework_refs||[]).map(f=>(
                          <span key={f} style={{background:"rgba(139,92,246,0.1)",color:"#a78bfa",borderRadius:4,padding:"1px 7px",fontSize:10,fontWeight:600}}>{f}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
                      <span style={s.badge(sc_cfg.c,sc_cfg.bg)}>{sv}</span>
                      <span style={{background:st_cfg.c+"20",color:st_cfg.c,borderRadius:100,padding:"2px 10px",fontSize:10,fontWeight:600}}>{st_cfg.l}</span>
                      <span style={{fontSize:10,color:"#475569"}}>Score: {r.inherent_score}/25</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab==="incidents" && (
            <div>
              {incidents.length===0 && <div style={{textAlign:"center",padding:60,color:"#475569"}}><Zap size={32} style={{opacity:.3}}/><p style={{marginTop:12}}>No incidents recorded.</p></div>}
              {incidents.map(inc=>{
                const sc_cfg=SEV[inc.severity]||SEV.MEDIUM;
                return (
                  <div key={inc.id} style={{...s.riskCard,flexDirection:"column",gap:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <div>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                          <span style={{fontFamily:"monospace",fontSize:10,color:"#475569"}}>{inc.id}</span>
                          <span style={{fontSize:14,fontWeight:600,color:"#e2e8f0"}}>{inc.title}</span>
                          {inc.data_breach && <span style={{background:"rgba(239,68,68,0.1)",color:"#ef4444",borderRadius:4,padding:"1px 8px",fontSize:9,fontWeight:700}}>DATA BREACH</span>}
                        </div>
                        <div style={{fontSize:12,color:"#475569"}}>{inc.category} · {new Date(inc.detected_at).toLocaleString("en-IN")}</div>
                      </div>
                      <div style={{display:"flex",gap:8,alignItems:"center"}}>
                        <span style={s.badge(sc_cfg.c,sc_cfg.bg)}>{inc.severity}</span>
                        <span style={{fontSize:11,color:inc.status==="RESOLVED"?"#10b981":inc.status==="CONTAINED"?"#f59e0b":"#ef4444",fontWeight:600}}>{inc.status}</span>
                      </div>
                    </div>
                    <p style={{fontSize:12,color:"#64748b",margin:0,lineHeight:1.6}}>{inc.description}</p>
                    <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                      {[["reported_to_rbi","RBI"],["reported_to_cert_in","CERT-In"]].map(([k,lbl])=>(
                        <span key={k} style={{fontSize:11,padding:"3px 10px",borderRadius:6,background:inc[k]?"rgba(16,185,129,0.1)":"rgba(239,68,68,0.08)",color:inc[k]?"#10b981":"#ef4444",fontWeight:600}}>
                          {inc[k]?`✓ ${lbl} Reported`:`⚠ ${lbl}: Not Reported`}
                        </span>
                      ))}
                      {inc.affected_users>0 && <span style={{fontSize:11,color:"#f97316",fontWeight:600}}>{inc.affected_users} users affected</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab==="trends" && (
            <div style={{background:"#111827",border:"1px solid rgba(139,92,246,0.1)",borderRadius:14,padding:24}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
                <div>
                  <div style={{fontSize:15,fontWeight:700,color:"#e2e8f0",marginBottom:4}}>30-Day Risk Score Trend</div>
                  <div style={{fontSize:12,color:"#475569"}}>Current: {trends[trends.length-1]?.score} · 30 days ago: {trends[0]?.score}</div>
                </div>
                {trends.length>1 && (
                  trends[trends.length-1]?.score < trends[0]?.score
                    ? <div style={{display:"flex",alignItems:"center",gap:6,color:"#10b981",fontWeight:700,fontSize:13}}><TrendingDown size={16}/>Improving</div>
                    : <div style={{display:"flex",alignItems:"center",gap:6,color:"#ef4444",fontWeight:700,fontSize:13}}><TrendingUp size={16}/>Increasing</div>
                )}
              </div>
              <div style={{display:"flex",alignItems:"flex-end",gap:2,height:140}}>
                {trends.map((t,i)=>{
                  const h=Math.round(t.score/maxTrend*100);
                  const color=t.score>=80?"#10b981":t.score>=60?"#f59e0b":"#ef4444";
                  return (
                    <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center"}}>
                      <div style={{flex:1,display:"flex",alignItems:"flex-end",width:"100%"}}>
                        <div style={{width:"100%",height:`${h}%`,background:color,borderRadius:"2px 2px 0 0",opacity:.8,minHeight:4}}/>
                      </div>
                      {i%7===0 && <div style={{fontSize:7,color:"#475569",marginTop:4,transform:"rotate(-30deg)",whiteSpace:"nowrap"}}>{t.date?.slice(5)}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {showAdd && (
        <div style={s.modal} onClick={e=>e.target===e.currentTarget&&setShowAdd(false)}>
          <div style={s.modalBox}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h3 style={{margin:0,color:"#e2e8f0",fontSize:16,fontWeight:700}}>Add New Risk</h3>
              <button onClick={()=>setShowAdd(false)} style={{background:"none",border:"none",color:"#475569",cursor:"pointer"}}><X size={18}/></button>
            </div>
            {[["Title","text","title","e.g. Unencrypted S3 bucket"],["Owner","text","owner","e.g. CISO, DevOps"]].map(([lbl,type,key,ph])=>(
              <div key={key} style={s.field}>
                <label style={s.lbl}>{lbl}</label>
                <input type={type} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})} placeholder={ph} style={s.input}/>
              </div>
            ))}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
              <div style={s.field}>
                <label style={s.lbl}>Category</label>
                <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} style={s.input}>
                  {["Technical","Operational","Compliance","Third-Party","Physical"].map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={s.field}>
                <label style={s.lbl}>Likelihood (1–5)</label>
                <input type="number" min={1} max={5} value={form.likelihood} onChange={e=>setForm({...form,likelihood:+e.target.value})} style={s.input}/>
              </div>
              <div style={s.field}>
                <label style={s.lbl}>Impact (1–5)</label>
                <input type="number" min={1} max={5} value={form.impact} onChange={e=>setForm({...form,impact:+e.target.value})} style={s.input}/>
              </div>
            </div>
            <div style={s.field}>
              <label style={s.lbl}>Description</label>
              <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={3} style={{...s.input,resize:"vertical"}} placeholder="Describe the risk…"/>
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:4}}>
              <button onClick={()=>setShowAdd(false)} style={{...s.btnGhost,color:"#475569"}}>Cancel</button>
              <button onClick={addRisk} style={s.btnPrimary}>Add Risk</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

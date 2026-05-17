import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, RefreshCw, Plus, TrendingDown, TrendingUp, Shield, X } from "lucide-react";
const API = "http://localhost:8000";
const SEV_COLOR = {CRITICAL:"#e11d48",HIGH:"#ea580c",MEDIUM:"#d97706",LOW:"#16a34a"};
const STATUS_CFG = {OPEN:{color:"#e11d48",label:"Open"},IN_PROGRESS:{color:"#d97706",label:"In Progress"},ACCEPTED:{color:"#7c3aed",label:"Accepted"},CLOSED:{color:"#16a34a",label:"Closed"}};
export default function RiskRegister({token,tenantId}){
  const[risks,setRisks]=useState([]);
  const[score,setScore]=useState(null);
  const[trends,setTrends]=useState([]);
  const[incidents,setIncidents]=useState([]);
  const[loading,setLoading]=useState(true);
  const[tab,setTab]=useState("register");
  const[showAdd,setShowAdd]=useState(false);
  const[form,setForm]=useState({title:"",category:"Technical",likelihood:3,impact:3,owner:"CISO",description:""});
  const fetch_=useCallback(async()=>{
    setLoading(true);
    try{
      const[rRes,sRes,tRes,iRes]=await Promise.all([
        fetch(`${API}/api/risk/register?tenant_id=${tenantId||"demo"}`,{headers:{Authorization:`Bearer ${token}`}}),
        fetch(`${API}/api/risk/score?tenant_id=${tenantId||"demo"}`,{headers:{Authorization:`Bearer ${token}`}}),
        fetch(`${API}/api/risk/trends?tenant_id=${tenantId||"demo"}`,{headers:{Authorization:`Bearer ${token}`}}),
        fetch(`${API}/api/risk/incidents?tenant_id=${tenantId||"demo"}`,{headers:{Authorization:`Bearer ${token}`}}),
      ]);
      const rData=await rRes.json();const sData=await sRes.json();const tData=await tRes.json();const iData=await iRes.json();
      setRisks(rData.risks||[]);setScore(sData);setTrends(tData.trends||[]);setIncidents(iData.incidents||[]);
    }catch(e){console.error(e);}
    setLoading(false);
  },[token,tenantId]);
  useEffect(()=>{fetch_();},[fetch_]);
  const addRisk=async()=>{
    try{await fetch(`${API}/api/risk/register?tenant_id=${tenantId||"demo"}`,{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify(form)});setShowAdd(false);setForm({title:"",category:"Technical",likelihood:3,impact:3,owner:"CISO",description:""});fetch_();}catch(e){alert("Failed");}};
  const getSeverity=score=>score>=16?"CRITICAL":score>=10?"HIGH":score>=5?"MEDIUM":"LOW";
  const tabBtn=(id,label)=>(<button onClick={()=>setTab(id)} style={{padding:"8px 18px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",border:"1px solid",borderColor:tab===id?"rgba(124,58,237,.3)":"rgba(124,58,237,.1)",background:tab===id?"rgba(124,58,237,.1)":"#fff",color:tab===id?"#7c3aed":"#6b5b9e"}}>{label}</button>);
  const maxTrend=Math.max(...trends.map(t=>t.score),1);
  return(<div style={{padding:"28px 32px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
      <div><h2 style={{fontFamily:"'Syne',sans-serif",fontSize:24,fontWeight:800,color:"#1a0a3a",display:"flex",alignItems:"center",gap:10,marginBottom:4}}><AlertTriangle size={22} color="#e11d48"/>Risk Register & Incident Tracker</h2><p style={{color:"#a89dc8",fontSize:13}}>FAIR-based risk quantification · Financial impact estimation · RBI & CERT-In incident reporting</p></div>
      <div style={{display:"flex",gap:10}}><button onClick={fetch_} style={{padding:"9px 16px",background:"#fff",border:"1px solid rgba(124,58,237,.15)",borderRadius:9,color:"#7c3aed",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}><RefreshCw size={14}/>Refresh</button><button onClick={()=>setShowAdd(true)} style={{padding:"9px 18px",background:"linear-gradient(135deg,#7c3aed,#db2777)",border:"none",borderRadius:9,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:8}}><Plus size={14}/>Add Risk</button></div>
    </div>
    {score&&(<div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:14,marginBottom:20}}>{[{label:"Risk Score",value:`${score.score}/100`,color:score.color},{label:"Open Risks",value:score.open_risks,color:"#e11d48"},{label:"Critical",value:score.critical_risks,color:"#e11d48"},{label:"High Risks",value:score.high_risks,color:"#ea580c"},{label:"Financial Exposure",value:`₹${score.total_exposure_cr}Cr`,color:"#7c3aed"}].map(s=>(<div key={s.label} style={{background:"#fff",border:"1px solid rgba(124,58,237,.08)",borderRadius:12,padding:"16px 20px",position:"relative",overflow:"hidden"}}><div style={{position:"absolute",top:0,left:0,right:0,height:3,background:s.color}}/><div style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:s.color,marginBottom:4}}>{s.value}</div><div style={{fontSize:11,color:"#a89dc8",textTransform:"uppercase",letterSpacing:".5px"}}>{s.label}</div></div>))}</div>)}
    <div style={{display:"flex",gap:8,marginBottom:20}}>{tabBtn("register","📋 Risk Register")}{tabBtn("incidents","🚨 Incidents")}{tabBtn("trends","📈 Risk Trends")}</div>
    {loading?(<div style={{textAlign:"center",padding:60,color:"#a89dc8"}}><RefreshCw size={20} style={{animation:"spin 1s linear infinite"}}/></div>):(
    <>
    {tab==="register"&&(<div style={{display:"flex",flexDirection:"column",gap:8}}>{risks.map(r=>{const sev=getSeverity(r.inherent_score);const sc=STATUS_CFG[r.status]||STATUS_CFG.OPEN;return(<div key={r.id} style={{background:"#fff",border:`1px solid ${SEV_COLOR[sev]}20`,borderRadius:12,padding:"16px 20px"}}><div style={{display:"flex",alignItems:"flex-start",gap:12}}><div style={{width:36,height:36,borderRadius:8,background:`${SEV_COLOR[sev]}12`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><AlertTriangle size={16} color={SEV_COLOR[sev]}/></div><div style={{flex:1}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"#a89dc8"}}>{r.id}</span><span style={{fontSize:14,fontWeight:600,color:"#1a0a3a"}}>{r.title}</span></div><div style={{display:"flex",gap:12,flexWrap:"wrap"}}><span style={{fontSize:11,color:"#6b5b9e"}}>Category: {r.category}</span><span style={{fontSize:11,color:"#6b5b9e"}}>Owner: {r.owner}</span><span style={{fontSize:11,color:"#ea580c"}}>₹{(r.financial_impact_inr/10000000).toFixed(1)}Cr exposure</span>{(r.framework_refs||[]).map(f=>(<span key={f} style={{fontSize:9,background:"rgba(124,58,237,.08)",color:"#7c3aed",borderRadius:4,padding:"1px 6px",fontWeight:600}}>{f}</span>))}</div></div><div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}><span style={{background:`${SEV_COLOR[sev]}14`,color:SEV_COLOR[sev],borderRadius:100,padding:"3px 10px",fontSize:11,fontWeight:700}}>{sev}</span><span style={{background:sc.color+"14",color:sc.color,borderRadius:100,padding:"2px 8px",fontSize:10,fontWeight:600}}>{sc.label}</span><span style={{fontSize:10,color:"#a89dc8"}}>Score: {r.inherent_score}/25</span></div></div></div>);})}
    </div>)}
    {tab==="incidents"&&(<div style={{display:"flex",flexDirection:"column",gap:10}}>{incidents.map(inc=>{const sevColor=SEV_COLOR[inc.severity]||"#d97706";return(<div key={inc.id} style={{background:"#fff",border:`1px solid ${sevColor}20`,borderRadius:12,padding:"18px 20px"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}><div><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"#a89dc8"}}>{inc.id}</span><span style={{fontSize:14,fontWeight:600,color:"#1a0a3a"}}>{inc.title}</span>{inc.data_breach&&<span style={{background:"rgba(225,29,72,.1)",color:"#e11d48",borderRadius:4,padding:"1px 8px",fontSize:9,fontWeight:700}}>DATA BREACH</span>}</div><div style={{fontSize:12,color:"#a89dc8"}}>{inc.category} · {new Date(inc.detected_at).toLocaleString("en-IN")}</div></div><div style={{display:"flex",flex:"column",gap:6,alignItems:"flex-end"}}><span style={{background:`${sevColor}14`,color:sevColor,borderRadius:100,padding:"3px 10px",fontSize:11,fontWeight:700}}>{inc.severity}</span><span style={{fontSize:10,color:inc.status==="RESOLVED"?"#16a34a":inc.status==="CONTAINED"?"#d97706":"#e11d48",fontWeight:600}}>{inc.status}</span></div></div><div style={{fontSize:12,color:"#6b5b9e",marginBottom:10,lineHeight:1.5}}>{inc.description}</div><div style={{display:"flex",gap:12}}><span style={{fontSize:11,padding:"3px 10px",borderRadius:6,background:inc.reported_to_rbi?"rgba(22,163,74,.1)":"rgba(225,29,72,.08)",color:inc.reported_to_rbi?"#16a34a":"#e11d48",fontWeight:600}}>{inc.reported_to_rbi?"✓ RBI Reported":"⚠ RBI: Not Reported"}</span><span style={{fontSize:11,padding:"3px 10px",borderRadius:6,background:inc.reported_to_cert_in?"rgba(22,163,74,.1)":"rgba(225,29,72,.08)",color:inc.reported_to_cert_in?"#16a34a":"#e11d48",fontWeight:600}}>{inc.reported_to_cert_in?"✓ CERT-In Reported":"⚠ CERT-In: Not Reported"}</span>{inc.affected_users>0&&<span style={{fontSize:11,color:"#ea580c",fontWeight:600}}>{inc.affected_users} users affected</span>}</div></div>);})}
    </div>)}
    {tab==="trends"&&(<div>
      <div style={{background:"#fff",border:"1px solid rgba(124,58,237,.1)",borderRadius:14,padding:22}}>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:700,color:"#1a0a3a",marginBottom:4}}>30-Day Risk Score Trend</div>
        <div style={{fontSize:12,color:"#a89dc8",marginBottom:16}}>Current: {trends[trends.length-1]?.score} · 30 days ago: {trends[0]?.score}</div>
        <div style={{display:"flex",alignItems:"flex-end",gap:2,height:120}}>
          {trends.map((t,i)=>{const h=Math.round(t.score/maxTrend*100);const color=t.score>=80?"#16a34a":t.score>=60?"#d97706":"#e11d48";return(<div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center"}}>
            <div style={{flex:1,display:"flex",alignItems:"flex-end",width:"100%"}}><div style={{width:"100%",height:`${h}%`,background:color,borderRadius:"2px 2px 0 0",opacity:.8,minHeight:4}}/></div>
            {i%7===0&&<div style={{fontSize:7,color:"#a89dc8",marginTop:4,transform:"rotate(-30deg)"}}>{t.date.slice(5)}</div>}
          </div>);})}
        </div>
      </div>
    </div>)}
    </>)}
    {showAdd&&(<div style={{position:"fixed",inset:0,background:"rgba(26,10,58,.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>e.target===e.currentTarget&&setShowAdd(false)}>
      <div style={{background:"#fff",borderRadius:16,padding:28,width:480}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}><h3 style={{fontFamily:"'Syne',sans-serif",fontSize:17,fontWeight:700,color:"#1a0a3a"}}>Add New Risk</h3><button onClick={()=>setShowAdd(false)} style={{background:"none",border:"none",cursor:"pointer",color:"#a89dc8"}}><X size={18}/></button></div>
        {[{label:"Risk Title *",key:"title",type:"text",placeholder:"e.g. Weak password policy on AWS IAM"},{label:"Owner",key:"owner",type:"text",placeholder:"e.g. CISO, IT, Legal"}].map(f=>(<label key={f.key} style={{display:"block",marginBottom:14}}><div style={{fontSize:11,fontWeight:600,color:"#6b5b9e",marginBottom:5,textTransform:"uppercase",letterSpacing:".5px"}}>{f.label}</div><input type={f.type} value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} placeholder={f.placeholder} style={{width:"100%",background:"rgba(124,58,237,.04)",border:"1px solid rgba(124,58,237,.15)",borderRadius:8,padding:"9px 12px",color:"#1a0a3a",fontSize:13,boxSizing:"border-box",outline:"none"}}/></label>))}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:16}}>
          <label><div style={{fontSize:11,fontWeight:600,color:"#6b5b9e",marginBottom:5,textTransform:"uppercase",letterSpacing:".5px"}}>Category</div><select value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))} style={{width:"100%",background:"rgba(124,58,237,.04)",border:"1px solid rgba(124,58,237,.15)",borderRadius:8,padding:"9px 12px",color:"#1a0a3a",fontSize:13}}>{["Technical","Regulatory","Operational","Third Party","Compliance"].map(c=>(<option key={c}>{c}</option>))}</select></label>
          <label><div style={{fontSize:11,fontWeight:600,color:"#6b5b9e",marginBottom:5,textTransform:"uppercase",letterSpacing:".5px"}}>Likelihood (1-5)</div><input type="number" min={1} max={5} value={form.likelihood} onChange={e=>setForm(p=>({...p,likelihood:parseInt(e.target.value)}))} style={{width:"100%",background:"rgba(124,58,237,.04)",border:"1px solid rgba(124,58,237,.15)",borderRadius:8,padding:"9px 12px",color:"#1a0a3a",fontSize:13}}/></label>
          <label><div style={{fontSize:11,fontWeight:600,color:"#6b5b9e",marginBottom:5,textTransform:"uppercase",letterSpacing:".5px"}}>Impact (1-5)</div><input type="number" min={1} max={5} value={form.impact} onChange={e=>setForm(p=>({...p,impact:parseInt(e.target.value)}))} style={{width:"100%",background:"rgba(124,58,237,.04)",border:"1px solid rgba(124,58,237,.15)",borderRadius:8,padding:"9px 12px",color:"#1a0a3a",fontSize:13}}/></label>
        </div>
        <div style={{background:"rgba(124,58,237,.04)",borderRadius:8,padding:"10px 12px",marginBottom:16,fontSize:12,color:"#6b5b9e"}}>Risk Score: <strong style={{color:SEV_COLOR[form.likelihood*form.impact>=16?"CRITICAL":form.likelihood*form.impact>=10?"HIGH":form.likelihood*form.impact>=5?"MEDIUM":"LOW"]}}>{form.likelihood*form.impact}/25 — {form.likelihood*form.impact>=16?"CRITICAL":form.likelihood*form.impact>=10?"HIGH":form.likelihood*form.impact>=5?"MEDIUM":"LOW"}</strong></div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><button onClick={()=>setShowAdd(false)} style={{padding:"9px 20px",background:"#fff",border:"1px solid rgba(124,58,237,.2)",borderRadius:8,color:"#6b5b9e",fontSize:13,cursor:"pointer"}}>Cancel</button><button onClick={addRisk} style={{padding:"9px 20px",background:"linear-gradient(135deg,#7c3aed,#db2777)",border:"none",borderRadius:8,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>Add Risk</button></div>
      </div>
    </div>)}
    <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
  </div>);}

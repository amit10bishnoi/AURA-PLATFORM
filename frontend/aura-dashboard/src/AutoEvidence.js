import { useState, useEffect, useCallback } from "react";
import { Zap, RefreshCw, CheckCircle, XCircle, AlertTriangle, Download, Play } from "lucide-react";
const API="http://localhost:8000";
const INT_COLORS={aws:"#FF9900",okta:"#00297A",github:"#E2E8F0",jira:"#0052CC",crowdstrike:"#E31B23",datadog:"#632CA6"};
const STATUS_CFG={PASS:{color:"#34D399",icon:CheckCircle,label:"Pass"},FAIL:{color:"#F87171",icon:XCircle,label:"Fail"},WARNING:{color:"#FBBF24",icon:AlertTriangle,label:"Warning"}};
function btn(bg,border){return{display:"flex",alignItems:"center",gap:6,padding:"9px 14px",background:bg,border:`1px solid ${border}`,borderRadius:8,color:"#94A3B8",fontSize:13,cursor:"pointer"};}
export default function AutoEvidence({token,tenantId}){
const[integrations,setIntegrations]=useState([]);
const[evidence,setEvidence]=useState([]);
const[loading,setLoading]=useState(true);
const[pulling,setPulling]=useState({});
const[pullingAll,setPullingAll]=useState(false);
const[filterStatus,setFilterStatus]=useState("All");
const[stats,setStats]=useState({});
const fetch_=useCallback(async()=>{
setLoading(true);
try{
const[iRes,eRes]=await Promise.all([fetch(`${API}/api/auto-evidence/integrations?tenant_id=${tenantId||"demo"}`,{headers:{Authorization:`Bearer ${token}`}}),fetch(`${API}/api/auto-evidence/evidence?tenant_id=${tenantId||"demo"}`,{headers:{Authorization:`Bearer ${token}`}})]);
const iData=await iRes.json();const eData=await eRes.json();
setIntegrations(iData.integrations||[]);
const ev=eData.evidence||[];
setEvidence(ev);
setStats({total:ev.length,pass:ev.filter(e=>e.status==="PASS").length,fail:ev.filter(e=>e.status==="FAIL").length,warning:ev.filter(e=>e.status==="WARNING").length});
}catch{setIntegrations([]);}finally{setLoading(false);}
},[token,tenantId]);
useEffect(()=>{fetch_();},[fetch_]);
const pullOne=async(id)=>{
setPulling(p=>({...p,[id]:true}));
try{
const res=await fetch(`${API}/api/auto-evidence/pull/${id}?tenant_id=${tenantId||"demo"}`,{method:"POST",headers:{Authorization:`Bearer ${token}`}});
const data=await res.json();
setEvidence(prev=>[...(data.evidence||[]),...prev.filter(e=>e.integration!==id)]);
alert(`✅ Pulled ${data.summary?.total||0} items from ${id}`);
fetch_();
}catch{alert("Pull failed");}finally{setPulling(p=>({...p,[id]:false}));}};
const pullAll=async()=>{
setPullingAll(true);
try{
const res=await fetch(`${API}/api/auto-evidence/pull-all?tenant_id=${tenantId||"demo"}`,{method:"POST",headers:{Authorization:`Bearer ${token}`}});
const data=await res.json();
alert(`✅ Pulled ${data.summary?.total||0} items from all integrations`);
fetch_();
}catch{alert("Pull all failed");}finally{setPullingAll(false);}};
const filtered=filterStatus==="All"?evidence:evidence.filter(e=>e.status===filterStatus);
return(<div style={{padding:"28px 32px"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28}}>
<div><h2 style={{margin:0,fontSize:22,fontWeight:700,color:"#F1F5F9",display:"flex",alignItems:"center",gap:10}}><Zap size={22} color="#FBBF24"/>Auto Evidence Collection</h2><p style={{margin:"6px 0 0",color:"#64748B",fontSize:13}}>Automatically pull compliance evidence from connected integrations</p></div>
<div style={{display:"flex",gap:10}}><button onClick={fetch_} style={btn("#1E293B","#334155")}><RefreshCw size={14}/>Refresh</button><button onClick={pullAll} disabled={pullingAll} style={btn("#1C3A2A","#16A34A")}><Play size={14}/>{pullingAll?"Pulling…":"Pull All"}</button></div>
</div>
<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24}}>
{[{label:"Total Evidence",value:stats.total,color:"#60A5FA"},{label:"Passing",value:stats.pass,color:"#34D399"},{label:"Failing",value:stats.fail,color:"#F87171"},{label:"Warnings",value:stats.warning,color:"#FBBF24"}].map(s=>(<div key={s.label} style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:12,padding:"16px 18px"}}><div style={{color:"#64748B",fontSize:12,marginBottom:8}}>{s.label}</div><div style={{fontSize:26,fontWeight:700,color:s.color}}>{s.value||0}</div></div>))}
</div>
<h3 style={{color:"#64748B",fontSize:12,textTransform:"uppercase",letterSpacing:".05em",marginBottom:12}}>Connected Integrations</h3>
<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:28}}>
{integrations.map(int=>{const color=INT_COLORS[int.id]||"#60A5FA";return(<div key={int.id} style={{background:"#0F172A",border:`1px solid ${color}30`,borderRadius:12,padding:16}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
<div><div style={{color,fontSize:14,fontWeight:700}}>{int.name}</div><div style={{color:"#475569",fontSize:11,marginTop:2}}>Last: {int.last_pull?new Date(int.last_pull).toLocaleDateString("en-IN",{day:"2-digit",month:"short"}):"Never"}</div></div>
<span style={{background:"rgba(52,211,153,.1)",color:"#34D399",borderRadius:5,padding:"2px 7px",fontSize:11}}>● Live</span>
</div>
<div style={{display:"flex",gap:8,marginBottom:12}}>
<span style={{color:"#34D399",fontSize:12}}>✓ {int.pass_count}</span>
{int.fail_count>0&&<span style={{color:"#F87171",fontSize:12}}>✗ {int.fail_count}</span>}
{int.warning_count>0&&<span style={{color:"#FBBF24",fontSize:12}}>⚠ {int.warning_count}</span>}
</div>
<button onClick={()=>pullOne(int.id)} disabled={pulling[int.id]} style={{width:"100%",background:`${color}18`,border:`1px solid ${color}40`,borderRadius:8,padding:"8px",color,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
{pulling[int.id]?<><RefreshCw size={13} style={{animation:"spin 1s linear infinite"}}/>Pulling…</>:<><Download size={13}/>Pull Evidence</>}
</button>
</div>);})}
</div>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
<h3 style={{color:"#64748B",fontSize:12,textTransform:"uppercase",letterSpacing:".05em",margin:0}}>Evidence Items ({filtered.length})</h3>
<select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:8,padding:"7px 12px",color:"#94A3B8",fontSize:12,cursor:"pointer"}}>{["All","PASS","FAIL","WARNING"].map(o=><option key={o}>{o}</option>)}</select>
</div>
{loading?<div style={{textAlign:"center",padding:40,color:"#475569"}}><RefreshCw size={20} style={{animation:"spin 1s linear infinite"}}/></div>:(
<div style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:14,overflow:"hidden"}}>
<div style={{display:"grid",gridTemplateColumns:"1fr 100px 100px 100px 130px",padding:"12px 16px",borderBottom:"1px solid #1E293B",color:"#475569",fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:".05em"}}><span>Evidence Item</span><span>Control</span><span>Framework</span><span>Status</span><span>Pulled</span></div>
{filtered.map((e,i)=>{const sc=STATUS_CFG[e.status]||STATUS_CFG.PASS;const Icon=sc.icon;const intColor=INT_COLORS[e.integration]||"#60A5FA";return(<div key={i} style={{display:"grid",gridTemplateColumns:"1fr 100px 100px 100px 130px",padding:"13px 16px",borderBottom:"1px solid #0D1B2E"}} onMouseEnter={ev=>ev.currentTarget.style.background="#0D1B2E"} onMouseLeave={ev=>ev.currentTarget.style.background="transparent"}>
<div><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}><span style={{background:`${intColor}18`,color:intColor,borderRadius:4,padding:"1px 6px",fontSize:10,fontWeight:600}}>{e.integration?.toUpperCase()}</span><span style={{color:"#E2E8F0",fontSize:13,fontWeight:500}}>{e.name}</span></div><div style={{color:"#475569",fontSize:11}}>{e.description}</div>{e.status!=="PASS"&&e.remediation&&<div style={{color:"#FBBF24",fontSize:11,marginTop:4}}>💡 {e.remediation}</div>}</div>
<span style={{color:"#64748B",fontSize:12,alignSelf:"center"}}>{e.control}</span>
<span style={{color:"#64748B",fontSize:12,alignSelf:"center"}}>{e.framework}</span>
<span style={{alignSelf:"center"}}><span style={{background:`${sc.color}18`,color:sc.color,borderRadius:5,padding:"2px 8px",fontSize:11,fontWeight:600,display:"inline-flex",alignItems:"center",gap:4}}><Icon size={10}/>{sc.label}</span></span>
<span style={{color:"#475569",fontSize:11,alignSelf:"center"}}>{e.pulled_at?new Date(e.pulled_at).toLocaleDateString("en-IN",{day:"2-digit",month:"short"}):"—"}</span>
</div>);})}
{filtered.length===0&&<div style={{textAlign:"center",padding:40,color:"#475569",fontSize:13}}>No evidence. Pull from integrations above.</div>}
</div>)}
<style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
</div>);}

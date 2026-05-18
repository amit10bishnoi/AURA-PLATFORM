import { useState, useEffect, useCallback } from "react";
import { Activity, RefreshCw, CheckCircle, XCircle, AlertTriangle, Play, Bell } from "lucide-react";
const API="http://localhost:8001";
const STATUS_CFG={PASS:{color:"#34D399",bg:"rgba(52,211,153,.12)",icon:CheckCircle},FAIL:{color:"#F87171",bg:"rgba(248,113,113,.12)",icon:XCircle},WARNING:{color:"#FBBF24",bg:"rgba(251,191,36,.12)",icon:AlertTriangle}};
const SEVERITY_CFG={CRITICAL:{color:"#EF4444"},HIGH:{color:"#F87171"},MEDIUM:{color:"#FBBF24"},LOW:{color:"#94A3B8"}};
const INT_COLORS={aws:"#FF9900",okta:"#00297A",github:"#E2E8F0",jira:"#0052CC",crowdstrike:"#E31B23",datadog:"#632CA6"};
const CATEGORIES=["All","Access Control","Cloud Security","Audit Logging","Vulnerability Management","Threat Detection","Endpoint Security","Availability","Data Security","Change Management"];
const FRAMEWORKS=["All","SOC2","HIPAA","GDPR","PCI_DSS","NIST_CSF"];
function btn(bg,border){return{display:"flex",alignItems:"center",gap:6,padding:"9px 14px",background:bg,border:`1px solid ${border}`,borderRadius:8,color:"#94A3B8",fontSize:13,cursor:"pointer"};}
function MiniBar({data}){const max=Math.max(...data.map(d=>d.total),1);return(<div style={{display:"flex",alignItems:"flex-end",gap:2,height:40}}>{data.slice(-24).map((d,i)=>{const h=Math.max(4,(d.total/max)*40);return(<div key={i} style={{flex:1,height:40,display:"flex",alignItems:"flex-end"}}><div title={`${d.time}: ${d.pass}P ${d.fail}F ${d.warning}W`} style={{width:"100%",height:h,borderRadius:2,background:d.fail>0?"#F87171":d.warning>0?"#FBBF24":"#34D399",opacity:.8}}/></div>);})}</div>);}
export default function ContinuousMonitoring({token,tenantId}){
const[checks,setChecks]=useState([]);
const[alerts,setAlerts]=useState([]);
const[timeline,setTimeline]=useState([]);
const[loading,setLoading]=useState(true);
const[running,setRunning]=useState(false);
const[summary,setSummary]=useState({});
const[filterCat,setFilterCat]=useState("All");
const[filterFw,setFilterFw]=useState("All");
const[filterStatus,setFilterStatus]=useState("All");
const[lastRun,setLastRun]=useState(null);
const fetch_=useCallback(async()=>{
setLoading(true);
try{
const p=new URLSearchParams({tenant_id:tenantId||"demo"});
if(filterCat!=="All")p.set("category",filterCat);
if(filterFw!=="All")p.set("framework",filterFw);
if(filterStatus!=="All")p.set("status",filterStatus);
const[cRes,aRes,tRes]=await Promise.all([fetch(`${API}/api/monitoring/checks?${p}`,{headers:{Authorization:`Bearer ${token}`}}),fetch(`${API}/api/monitoring/alerts?tenant_id=${tenantId||"demo"}`,{headers:{Authorization:`Bearer ${token}`}}),fetch(`${API}/api/monitoring/timeline?tenant_id=${tenantId||"demo"}`,{headers:{Authorization:`Bearer ${token}`}})]);
const cData=await cRes.json();const aData=await aRes.json();const tData=await tRes.json();
setChecks(cData.checks||[]);setSummary(cData.summary||{});setAlerts(aData.alerts||[]);setTimeline(tData.timeline||[]);
}catch{setChecks([]);}finally{setLoading(false);}
},[token,tenantId,filterCat,filterFw,filterStatus]);
useEffect(()=>{fetch_();},[fetch_]);
const runChecks=async()=>{
setRunning(true);
try{await fetch(`${API}/api/monitoring/checks/run?tenant_id=${tenantId||"demo"}`,{method:"POST",headers:{Authorization:`Bearer ${token}`}});setLastRun(new Date().toLocaleTimeString());setTimeout(()=>{fetch_();setRunning(false);},2000);}catch{setRunning(false);}};
const resolveAlert=async(id)=>{
try{await fetch(`${API}/api/monitoring/alerts/${id}`,{method:"PATCH",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify({status:"RESOLVED"})});setAlerts(a=>a.map(x=>x.id===id?{...x,status:"RESOLVED"}:x));}catch{}};
const openAlerts=alerts.filter(a=>a.status==="OPEN");
return(<div style={{padding:"28px 32px"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28}}>
<div><h2 style={{margin:0,fontSize:22,fontWeight:700,color:"#F1F5F9",display:"flex",alignItems:"center",gap:10}}><Activity size={22} color="#34D399"/>Continuous Monitoring<span style={{width:8,height:8,borderRadius:"50%",background:"#34D399",display:"inline-block",marginLeft:4,animation:"pulse 2s infinite"}}/></h2><p style={{margin:"6px 0 0",color:"#64748B",fontSize:13}}>Real-time compliance checks{lastRun&&<span style={{marginLeft:8,color:"#475569"}}>· Last run: {lastRun}</span>}</p></div>
<div style={{display:"flex",gap:10}}><button onClick={fetch_} style={btn("#1E293B","#334155")}><RefreshCw size={14}/>Refresh</button><button onClick={runChecks} disabled={running} style={btn("#0D2818","#16A34A")}><Play size={14}/>{running?"Running…":"Run Checks"}</button></div>
</div>
<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24}}>
{[{label:"Passing",value:summary.pass,color:"#34D399"},{label:"Failing",value:summary.fail,color:"#F87171"},{label:"Warnings",value:summary.warning,color:"#FBBF24"},{label:"Open Alerts",value:openAlerts.length,color:"#EF4444"}].map(s=>(<div key={s.label} style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:12,padding:"16px 18px"}}><div style={{color:"#64748B",fontSize:12,marginBottom:8}}>{s.label}</div><div style={{fontSize:26,fontWeight:700,color:s.color}}>{s.value||0}</div></div>))}
</div>
{timeline.length>0&&(<div style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:14,padding:"20px 24px",marginBottom:24}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><h4 style={{margin:0,color:"#94A3B8",fontSize:12,textTransform:"uppercase",letterSpacing:".05em"}}>Last 24 Hours</h4><div style={{display:"flex",gap:12}}>{[{c:"#34D399",l:"Pass"},{c:"#F87171",l:"Fail"},{c:"#FBBF24",l:"Warn"}].map(x=><span key={x.l} style={{display:"flex",alignItems:"center",gap:4,color:"#64748B",fontSize:11}}><div style={{width:8,height:8,borderRadius:2,background:x.c}}/>{x.l}</span>)}</div></div>
<MiniBar data={timeline}/>
<div style={{display:"flex",justifyContent:"space-between",marginTop:4}}><span style={{color:"#334155",fontSize:10}}>24h ago</span><span style={{color:"#334155",fontSize:10}}>Now</span></div>
</div>)}
{openAlerts.length>0&&(<div style={{background:"rgba(239,68,68,.05)",border:"1px solid rgba(239,68,68,.2)",borderRadius:14,padding:"16px 20px",marginBottom:24}}>
<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}><Bell size={15} color="#F87171"/><h4 style={{margin:0,color:"#F87171",fontSize:13,fontWeight:600}}>Open Alerts ({openAlerts.length})</h4></div>
{openAlerts.map(a=>{const sc=SEVERITY_CFG[a.severity]||SEVERITY_CFG.MEDIUM;const intColor=INT_COLORS[a.integration]||"#60A5FA";return(<div key={a.id} style={{background:"#0F172A",borderRadius:10,padding:"12px 14px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
<div><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><span style={{background:`${sc.color}18`,color:sc.color,borderRadius:5,padding:"2px 7px",fontSize:11,fontWeight:600}}>{a.severity}</span><span style={{background:`${intColor}18`,color:intColor,borderRadius:4,padding:"1px 6px",fontSize:10}}>{a.integration?.toUpperCase()}</span><span style={{color:"#E2E8F0",fontSize:13,fontWeight:500}}>{a.title}</span></div><div style={{color:"#64748B",fontSize:12}}>{a.message}</div></div>
<button onClick={()=>resolveAlert(a.id)} style={{background:"none",border:"1px solid #334155",borderRadius:6,padding:"4px 10px",color:"#34D399",cursor:"pointer",fontSize:11,flexShrink:0,marginLeft:12}}>Resolve</button>
</div>);})}
</div>)}
<div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
{[{value:filterCat,setter:setFilterCat,options:CATEGORIES},{value:filterFw,setter:setFilterFw,options:FRAMEWORKS},{value:filterStatus,setter:setFilterStatus,options:["All","PASS","FAIL","WARNING"]}].map((f,i)=>(<select key={i} value={f.value} onChange={e=>f.setter(e.target.value)} style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:8,padding:"9px 14px",color:"#94A3B8",fontSize:13,cursor:"pointer"}}>{f.options.map(o=><option key={o}>{o}</option>)}</select>))}
</div>
{loading?<div style={{textAlign:"center",padding:40,color:"#475569"}}><RefreshCw size={20} style={{animation:"spin 1s linear infinite"}}/></div>:(
<div style={{display:"flex",flexDirection:"column",gap:8}}>
{checks.map(check=>{const sc=STATUS_CFG[check.status]||STATUS_CFG.PASS;const Icon=sc.icon;const intColor=INT_COLORS[check.integration]||"#60A5FA";return(<div key={check.id} style={{background:"#0F172A",border:`1px solid ${check.status==="FAIL"?"rgba(248,113,113,.3)":check.status==="WARNING"?"rgba(251,191,36,.2)":"#1E293B"}`,borderRadius:12,padding:"14px 18px"}}>
<div style={{display:"grid",gridTemplateColumns:"auto 1fr auto auto auto",gap:12,alignItems:"center"}}>
<div style={{background:sc.bg,borderRadius:8,padding:8}}><Icon size={15} color={sc.color}/></div>
<div><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}><span style={{color:"#E2E8F0",fontSize:13,fontWeight:500}}>{check.name}</span><span style={{background:`${intColor}18`,color:intColor,borderRadius:4,padding:"1px 6px",fontSize:10}}>{check.integration?.toUpperCase()}</span></div><div style={{color:"#64748B",fontSize:12}}>{check.details}</div>{check.status!=="PASS"&&check.remediation&&<div style={{color:"#FBBF24",fontSize:11,marginTop:4}}>💡 {check.remediation}</div>}</div>
<span style={{color:"#475569",fontSize:11,whiteSpace:"nowrap"}}>{check.category}</span>
<span style={{color:"#475569",fontSize:11,whiteSpace:"nowrap"}}>{check.framework}</span>
<div style={{textAlign:"right"}}><div style={{color:"#475569",fontSize:10}}>{check.frequency}</div><div style={{color:"#334155",fontSize:10}}>{check.last_checked?new Date(check.last_checked).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}):"—"}</div></div>
</div>
</div>);})}
</div>)}
<style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
</div>);}

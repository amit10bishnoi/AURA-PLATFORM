import { useState, useEffect, useCallback } from "react";
import { Bell, CheckCircle, AlertTriangle, Info, XCircle, RefreshCw, Check, Settings, ChevronRight } from "lucide-react";
const API="http://localhost:8000";
const TYPE_CFG={ALERT:{color:"#F87171",bg:"rgba(248,113,113,.12)",icon:XCircle},WARNING:{color:"#FBBF24",bg:"rgba(251,191,36,.12)",icon:AlertTriangle},INFO:{color:"#60A5FA",bg:"rgba(96,165,250,.12)",icon:Info},SUCCESS:{color:"#34D399",bg:"rgba(52,211,153,.12)",icon:CheckCircle}};
const CATEGORIES=["All","Compliance","Risk","Evidence","Policy","Vendor","System"];
const CHANNEL_COLORS={in_app:"#60A5FA",email:"#34D399",slack:"#A78BFA"};
function timeAgo(iso){const d=(Date.now()-new Date(iso))/1000;if(d<60)return`${Math.floor(d)}s ago`;if(d<3600)return`${Math.floor(d/60)}m ago`;if(d<86400)return`${Math.floor(d/3600)}h ago`;return`${Math.floor(d/86400)}d ago`;}
function btn(bg,border){return{display:"flex",alignItems:"center",gap:6,padding:"9px 14px",background:bg,border:`1px solid ${border}`,borderRadius:8,color:"#94A3B8",fontSize:13,cursor:"pointer"};}
export default function Notifications({token,tenantId}){
const[notifs,setNotifs]=useState([]);
const[rules,setRules]=useState([]);
const[loading,setLoading]=useState(true);
const[tab,setTab]=useState("notifications");
const[filterCat,setFilterCat]=useState("All");
const[filterRead,setFilterRead]=useState("All");
const[unread,setUnread]=useState(0);
const fetch_=useCallback(async()=>{
setLoading(true);
try{
const p=new URLSearchParams({tenant_id:tenantId||"demo"});
if(filterCat!=="All")p.set("category",filterCat);
if(filterRead==="Unread")p.set("is_read","false");
if(filterRead==="Read")p.set("is_read","true");
const[nRes,rRes]=await Promise.all([fetch(`${API}/api/notifications?${p}`,{headers:{Authorization:`Bearer ${token}`}}),fetch(`${API}/api/notifications/rules?tenant_id=${tenantId||"demo"}`,{headers:{Authorization:`Bearer ${token}`}})]);
const nData=await nRes.json();const rData=await rRes.json();
setNotifs(nData.notifications||[]);setUnread(nData.unread||0);setRules(rData.rules||[]);
}catch{setNotifs([]);}finally{setLoading(false);}
},[token,tenantId,filterCat,filterRead]);
useEffect(()=>{fetch_();},[fetch_]);
const markRead=async(id)=>{try{await fetch(`${API}/api/notifications/${id}/read`,{method:"PATCH",headers:{Authorization:`Bearer ${token}`}});setNotifs(n=>n.map(x=>x.id===id?{...x,is_read:true}:x));setUnread(u=>Math.max(0,u-1));}catch{}};
const markAllRead=async()=>{try{await fetch(`${API}/api/notifications/read-all?tenant_id=${tenantId||"demo"}`,{method:"PATCH",headers:{Authorization:`Bearer ${token}`}});setNotifs(n=>n.map(x=>({...x,is_read:true})));setUnread(0);}catch{}};
const toggleRule=async(id,enabled)=>{try{await fetch(`${API}/api/notifications/rules/${id}?tenant_id=${tenantId||"demo"}`,{method:"PATCH",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify({enabled})});setRules(r=>r.map(x=>x.id===id?{...x,enabled}:x));}catch{}};
return(<div style={{padding:"28px 32px"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28}}>
<div><h2 style={{margin:0,fontSize:22,fontWeight:700,color:"#F1F5F9",display:"flex",alignItems:"center",gap:10}}><Bell size={22} color="#FBBF24"/>Notifications{unread>0&&<span style={{background:"#EF4444",color:"#fff",borderRadius:10,padding:"2px 8px",fontSize:12,fontWeight:700}}>{unread}</span>}</h2><p style={{margin:"6px 0 0",color:"#64748B",fontSize:13}}>Alerts, warnings, and compliance notifications</p></div>
<div style={{display:"flex",gap:10}}>
<button onClick={fetch_} style={btn("#1E293B","#334155")}><RefreshCw size={14}/>Refresh</button>
{unread>0&&<button onClick={markAllRead} style={btn("#1C3A2A","#16A34A")}><Check size={14}/>Mark All Read</button>}
<button onClick={()=>setTab(tab==="notifications"?"settings":"notifications")} style={btn(tab==="settings"?"#1E3A5F":"#1E293B",tab==="settings"?"#2563EB":"#334155")}><Settings size={14}/>{tab==="settings"?"← Back":"Alert Settings"}</button>
</div>
</div>
{tab==="notifications"?(
<>
<div style={{display:"flex",gap:10,marginBottom:20}}>
{[{value:filterCat,setter:setFilterCat,options:CATEGORIES},{value:filterRead,setter:setFilterRead,options:["All","Unread","Read"]}].map((f,i)=>(<select key={i} value={f.value} onChange={e=>f.setter(e.target.value)} style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:8,padding:"9px 14px",color:"#94A3B8",fontSize:13,cursor:"pointer"}}>{f.options.map(o=><option key={o}>{o}</option>)}</select>))}
</div>
{loading?<div style={{textAlign:"center",padding:60,color:"#475569"}}><RefreshCw size={20} style={{animation:"spin 1s linear infinite"}}/></div>:(
<div style={{display:"flex",flexDirection:"column",gap:8}}>
{notifs.map(n=>{const tc=TYPE_CFG[n.type]||TYPE_CFG.INFO;const Icon=tc.icon;return(<div key={n.id} onClick={()=>!n.is_read&&markRead(n.id)} style={{background:n.is_read?"#0F172A":"#0D1B2E",border:`1px solid ${n.is_read?"#1E293B":tc.color+"40"}`,borderRadius:12,padding:"14px 16px",cursor:n.is_read?"default":"pointer",display:"flex",gap:14,alignItems:"flex-start"}}>
<div style={{background:tc.bg,borderRadius:8,padding:8,flexShrink:0}}><Icon size={16} color={tc.color}/></div>
<div style={{flex:1}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
<div style={{color:n.is_read?"#94A3B8":"#E2E8F0",fontSize:13,fontWeight:n.is_read?400:600}}>{n.title}</div>
<div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0,marginLeft:12}}><span style={{color:"#475569",fontSize:11}}>{timeAgo(n.created_at)}</span>{!n.is_read&&<div style={{width:8,height:8,borderRadius:"50%",background:tc.color}}/>}</div>
</div>
<div style={{color:"#64748B",fontSize:12,lineHeight:1.5,marginBottom:8}}>{n.message}</div>
<div style={{display:"flex",alignItems:"center",gap:8}}>
<span style={{background:"rgba(148,163,184,.1)",color:"#64748B",borderRadius:5,padding:"2px 7px",fontSize:11}}>{n.category}</span>
{n.action_label&&<span style={{color:"#60A5FA",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>{n.action_label}<ChevronRight size={11}/></span>}
</div>
</div>
</div>);})}
{notifs.length===0&&<div style={{textAlign:"center",padding:60,color:"#475569"}}><Bell size={40} style={{opacity:.3,marginBottom:12}}/><div style={{fontSize:14}}>No notifications.</div></div>}
</div>)}
</>
):(
<div style={{display:"flex",flexDirection:"column",gap:10}}>
<div style={{color:"#64748B",fontSize:13,marginBottom:8}}>Configure which alerts you receive and through which channels.</div>
{rules.map(r=>(<div key={r.id} style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:12,padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
<div><div style={{color:"#E2E8F0",fontSize:13,fontWeight:500,marginBottom:4}}>{r.name}</div><div style={{display:"flex",gap:6,alignItems:"center"}}>{(r.channels||[]).map(c=><span key={c} style={{background:`${CHANNEL_COLORS[c]||"#94A3B8"}18`,color:CHANNEL_COLORS[c]||"#94A3B8",borderRadius:5,padding:"2px 7px",fontSize:11}}>{c}</span>)}{r.threshold&&<span style={{color:"#475569",fontSize:11}}>· {r.threshold} days before</span>}</div></div>
<div onClick={()=>toggleRule(r.id,!r.enabled)} style={{width:44,height:24,borderRadius:12,background:r.enabled?"#16A34A":"#334155",cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}><div style={{position:"absolute",top:3,left:r.enabled?22:3,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left .2s"}}/></div>
</div>))}
</div>
)}
<style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
</div>);}

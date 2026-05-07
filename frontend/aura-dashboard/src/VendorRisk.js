import { useState, useEffect, useCallback } from "react";
import { Building2, Plus, Search, RefreshCw, Send, Trash2, ChevronRight, X, Save, Mail } from "lucide-react";
const API="http://localhost:8000";
const RISK_CFG={LOW:{color:"#34D399",bg:"rgba(52,211,153,.12)",label:"Low"},MEDIUM:{color:"#FBBF24",bg:"rgba(251,191,36,.12)",label:"Medium"},HIGH:{color:"#F87171",bg:"rgba(248,113,113,.12)",label:"High"},CRITICAL:{color:"#EF4444",bg:"rgba(239,68,68,.18)",label:"Critical"}};
const Q_CFG={NOT_SENT:{color:"#94A3B8",label:"Not Sent"},SENT:{color:"#60A5FA",label:"Sent"},COMPLETED:{color:"#34D399",label:"Completed"},OVERDUE:{color:"#F87171",label:"Overdue"}};
const CATEGORIES=["All","SaaS","Infrastructure","Professional Services","Hardware"];
const RISK_LEVELS=["All","LOW","MEDIUM","HIGH","CRITICAL"];
const STATUSES=["All","ACTIVE","UNDER_REVIEW","OFFBOARDED"];
const EMPTY={name:"",category:"SaaS",website:"",contact_email:"",risk_score:0,risk_level:"LOW",data_access:[],frameworks:[],notes:""};
const DATA_TYPES=["Customer PII","Employee PII","Financial Data","Payment Data","Health Data","Identity","Infrastructure","Source Code","Analytics","Backups"];
const FW_OPTIONS=["SOC2","HIPAA","GDPR","PCI_DSS","NIST_CSF","ISO27001"];
function btn(bg,border){return{display:"flex",alignItems:"center",gap:6,padding:"9px 14px",background:bg,border:`1px solid ${border}`,borderRadius:8,color:"#94A3B8",fontSize:13,cursor:"pointer"};}
function Tag({color,children}){return <span style={{background:`${color}18`,color,borderRadius:5,padding:"2px 7px",fontSize:11,fontWeight:500}}>{children}</span>;}
function RiskBar({score}){const color=score>=80?"#EF4444":score>=60?"#F87171":score>=40?"#FBBF24":"#34D399";return(<div style={{display:"flex",alignItems:"center",gap:8}}><div style={{flex:1,height:6,background:"#1E293B",borderRadius:3,overflow:"hidden"}}><div style={{width:`${score}%`,height:"100%",background:color,borderRadius:3}}/></div><span style={{color,fontSize:12,fontWeight:600,minWidth:28}}>{score}</span></div>);}
export default function VendorRisk({token,tenantId}){
const[vendors,setVendors]=useState([]);
const[loading,setLoading]=useState(true);
const[search,setSearch]=useState("");
const[filterCat,setFilterCat]=useState("All");
const[filterRisk,setFilterRisk]=useState("All");
const[filterStatus,setFilterStatus]=useState("All");
const[selected,setSelected]=useState(null);
const[showCreate,setShowCreate]=useState(false);
const[form,setForm]=useState(EMPTY);
const[saving,setSaving]=useState(false);
const[stats,setStats]=useState({});
const fetch_=useCallback(async()=>{
setLoading(true);
try{
const p=new URLSearchParams({tenant_id:tenantId||"demo"});
if(filterCat!=="All")p.set("category",filterCat);
if(filterRisk!=="All")p.set("risk_level",filterRisk);
if(filterStatus!=="All")p.set("status",filterStatus);
if(search)p.set("search",search);
const res=await fetch(`${API}/api/vendors?${p}`,{headers:{Authorization:`Bearer ${token}`}});
const data=await res.json();
const list=data.vendors||[];
setVendors(list);
setStats({total:list.length,critical:list.filter(v=>v.risk_level==="CRITICAL").length,high:list.filter(v=>v.risk_level==="HIGH").length,overdue:list.filter(v=>v.questionnaire_status==="OVERDUE").length});
}catch{setVendors([]);}finally{setLoading(false);}
},[token,tenantId,filterCat,filterRisk,filterStatus,search]);
useEffect(()=>{fetch_();},[fetch_]);
const saveVendor=async()=>{
if(!form.name)return alert("Vendor name required.");
setSaving(true);
try{await fetch(`${API}/api/vendors?tenant_id=${tenantId||"demo"}`,{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify(form)});setShowCreate(false);setForm(EMPTY);fetch_();}catch{alert("Save failed");}finally{setSaving(false);}};
const sendQuestionnaire=async(id)=>{try{await fetch(`${API}/api/vendors/${id}/questionnaire`,{method:"PATCH",headers:{Authorization:`Bearer ${token}`}});fetch_();}catch{alert("Failed");}};
const deleteVendor=async(id)=>{if(!window.confirm("Remove this vendor?"))return;try{await fetch(`${API}/api/vendors/${id}`,{method:"DELETE",headers:{Authorization:`Bearer ${token}`}});setSelected(null);fetch_();}catch{alert("Failed");}};
const toggleArr=(key,val)=>setForm(f=>({...f,[key]:f[key].includes(val)?f[key].filter(x=>x!==val):[...f[key],val]}));
if(selected){
const rc=RISK_CFG[selected.risk_level]||RISK_CFG.LOW;
const qc=Q_CFG[selected.questionnaire_status]||Q_CFG.NOT_SENT;
return(<div style={{padding:"28px 32px"}}>
<button onClick={()=>setSelected(null)} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:"#64748B",fontSize:13,cursor:"pointer",marginBottom:20,padding:0}}><ChevronRight size={14} style={{transform:"rotate(180deg)"}}/>Back to Vendors</button>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
<div>
<div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}><Tag color={rc.color}>{rc.label} Risk</Tag><Tag color={qc.color}>Q: {qc.label}</Tag><Tag color="#60A5FA">{selected.category}</Tag></div>
<h2 style={{margin:0,fontSize:22,fontWeight:700,color:"#F1F5F9"}}>{selected.name}</h2>
{selected.website&&<div style={{color:"#60A5FA",fontSize:13}}>{selected.website}</div>}
</div>
<div style={{display:"flex",gap:8}}>
{selected.questionnaire_status==="NOT_SENT"&&<button onClick={()=>sendQuestionnaire(selected.id)} style={btn("#1E3A5F","#2563EB")}><Send size={14}/>Send Questionnaire</button>}
<button onClick={()=>deleteVendor(selected.id)} style={btn("#3B0F0F","#DC2626")}><Trash2 size={14}/></button>
</div>
</div>
<div style={{display:"grid",gridTemplateColumns:"1fr 280px",gap:20}}>
<div style={{display:"flex",flexDirection:"column",gap:16}}>
<div style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:14,padding:24}}>
<h4 style={{margin:"0 0 16px",color:"#94A3B8",fontSize:12,textTransform:"uppercase"}}>Risk Score</h4>
<RiskBar score={selected.risk_score}/>
<p style={{color:"#64748B",fontSize:13,marginTop:12}}>{selected.notes||"No notes."}</p>
</div>
<div style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:14,padding:24}}>
<h4 style={{margin:"0 0 12px",color:"#94A3B8",fontSize:12,textTransform:"uppercase"}}>Data Access</h4>
<div style={{display:"flex",flexWrap:"wrap",gap:8}}>{(selected.data_access||[]).map(d=><Tag key={d} color="#F87171">{d}</Tag>)}</div>
</div>
</div>
<div style={{display:"flex",flexDirection:"column",gap:14}}>
{selected.contact_email&&<div style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:12,padding:16}}><h4 style={{margin:"0 0 10px",color:"#475569",fontSize:11,textTransform:"uppercase"}}>Contact</h4><div style={{display:"flex",alignItems:"center",gap:6,color:"#94A3B8",fontSize:13}}><Mail size={13}/>{selected.contact_email}</div></div>}
<div style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:12,padding:16}}><h4 style={{margin:"0 0 10px",color:"#475569",fontSize:11,textTransform:"uppercase"}}>Certifications</h4><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{(selected.frameworks||[]).map(f=><Tag key={f} color="#60A5FA">{f}</Tag>)}</div></div>
<div style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:12,padding:16}}><h4 style={{margin:"0 0 10px",color:"#475569",fontSize:11,textTransform:"uppercase"}}>Review Dates</h4>
{[{label:"Last Reviewed",val:selected.last_reviewed},{label:"Next Review",val:selected.next_review}].map(d=>(<div key={d.label} style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{color:"#475569",fontSize:12}}>{d.label}</span><span style={{color:"#94A3B8",fontSize:12}}>{d.val?new Date(d.val).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}):"—"}</span></div>))}</div>
</div>
</div>
</div>);}
return(<div style={{padding:"28px 32px"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28}}>
<div><h2 style={{margin:0,fontSize:22,fontWeight:700,color:"#F1F5F9",display:"flex",alignItems:"center",gap:10}}><Building2 size={22} color="#FBBF24"/>Vendor Risk</h2><p style={{margin:"6px 0 0",color:"#64748B",fontSize:13}}>Assess and monitor third-party vendor risk</p></div>
<div style={{display:"flex",gap:10}}><button onClick={fetch_} style={btn("#1E293B","#334155")}><RefreshCw size={14}/>Refresh</button><button onClick={()=>{setForm(EMPTY);setShowCreate(true);}} style={btn("#422006","#D97706")}><Plus size={14}/>Add Vendor</button></div>
</div>
<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24}}>
{[{label:"Total Vendors",value:stats.total,color:"#60A5FA"},{label:"Critical Risk",value:stats.critical,color:"#EF4444"},{label:"High Risk",value:stats.high,color:"#F87171"},{label:"Overdue Q'naires",value:stats.overdue,color:"#FBBF24"}].map(s=>(<div key={s.label} style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:12,padding:"16px 18px"}}><div style={{color:"#64748B",fontSize:12,marginBottom:8}}>{s.label}</div><div style={{fontSize:26,fontWeight:700,color:s.color}}>{s.value||0}</div></div>))}
</div>
<div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}}>
<div style={{position:"relative",flex:1,minWidth:200}}><Search size={14} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#475569"}}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search vendors…" style={{width:"100%",background:"#0F172A",border:"1px solid #1E293B",borderRadius:8,padding:"9px 12px 9px 34px",color:"#F1F5F9",fontSize:13,boxSizing:"border-box"}}/></div>
{[{value:filterCat,setter:setFilterCat,options:CATEGORIES},{value:filterRisk,setter:setFilterRisk,options:RISK_LEVELS},{value:filterStatus,setter:setFilterStatus,options:STATUSES}].map((f,i)=>(<select key={i} value={f.value} onChange={e=>f.setter(e.target.value)} style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:8,padding:"9px 14px",color:"#94A3B8",fontSize:13,cursor:"pointer"}}>{f.options.map(o=><option key={o}>{o}</option>)}</select>))}
</div>
{loading?<div style={{textAlign:"center",padding:60,color:"#475569"}}><RefreshCw size={20} style={{animation:"spin 1s linear infinite"}}/></div>:(
<div style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:14,overflow:"hidden"}}>
<div style={{display:"grid",gridTemplateColumns:"200px 110px 1fr 130px 140px 50px",padding:"12px 16px",borderBottom:"1px solid #1E293B",color:"#475569",fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:".05em"}}><span>Vendor</span><span>Category</span><span>Risk Score</span><span>Data Access</span><span>Questionnaire</span><span></span></div>
{vendors.map(v=>{const rc=RISK_CFG[v.risk_level]||RISK_CFG.LOW;const qc=Q_CFG[v.questionnaire_status]||Q_CFG.NOT_SENT;return(<div key={v.id} style={{display:"grid",gridTemplateColumns:"200px 110px 1fr 130px 140px 50px",padding:"14px 16px",borderBottom:"1px solid #0D1B2E",cursor:"pointer",transition:"background .15s"}} onClick={()=>setSelected(v)} onMouseEnter={e=>e.currentTarget.style.background="#0D1B2E"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
<div><div style={{color:"#E2E8F0",fontSize:13,fontWeight:600}}>{v.name}</div><div style={{color:"#475569",fontSize:11}}>{v.website}</div></div>
<span style={{color:"#64748B",fontSize:12,alignSelf:"center"}}>{v.category}</span>
<div style={{alignSelf:"center",paddingRight:20}}><RiskBar score={v.risk_score}/></div>
<div style={{alignSelf:"center",display:"flex",flexWrap:"wrap",gap:4}}>{(v.data_access||[]).slice(0,2).map(d=><span key={d} style={{background:"rgba(248,113,113,.1)",color:"#F87171",borderRadius:4,padding:"1px 5px",fontSize:10}}>{d}</span>)}{(v.data_access||[]).length>2&&<span style={{color:"#475569",fontSize:10}}>+{v.data_access.length-2}</span>}</div>
<span style={{alignSelf:"center"}}><span style={{background:qc.bg||"rgba(148,163,184,.1)",color:qc.color,borderRadius:6,padding:"3px 8px",fontSize:11,fontWeight:600}}>{qc.label}</span></span>
<span style={{alignSelf:"center"}}><ChevronRight size={14} color="#334155"/></span>
</div>);})}
{vendors.length===0&&<div style={{textAlign:"center",padding:40,color:"#475569",fontSize:13}}>No vendors found.</div>}
</div>)}
{showCreate&&(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>e.target===e.currentTarget&&setShowCreate(false)}>
<div style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:16,padding:28,width:520,maxHeight:"90vh",overflowY:"auto"}}>
<div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}><h3 style={{margin:0,color:"#F1F5F9",fontSize:17}}>Add Vendor</h3><button onClick={()=>setShowCreate(false)} style={{background:"none",border:"none",color:"#475569",cursor:"pointer"}}><X size={18}/></button></div>
{[{label:"Vendor Name *",key:"name"},{label:"Website",key:"website"},{label:"Contact Email",key:"contact_email"}].map(f=>(<label key={f.key} style={{display:"block",marginBottom:14}}><div style={{color:"#64748B",fontSize:12,marginBottom:5}}>{f.label}</div><input value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})} style={{width:"100%",background:"#1E293B",border:"1px solid #334155",borderRadius:8,padding:"9px 12px",color:"#F1F5F9",fontSize:13,boxSizing:"border-box"}}/></label>))}
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
<label><div style={{color:"#64748B",fontSize:12,marginBottom:5}}>Category</div><select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} style={{width:"100%",background:"#1E293B",border:"1px solid #334155",borderRadius:8,padding:"9px 12px",color:"#F1F5F9",fontSize:13}}>{["SaaS","Infrastructure","Professional Services","Hardware"].map(o=><option key={o}>{o}</option>)}</select></label>
<label><div style={{color:"#64748B",fontSize:12,marginBottom:5}}>Risk Level</div><select value={form.risk_level} onChange={e=>setForm({...form,risk_level:e.target.value})} style={{width:"100%",background:"#1E293B",border:"1px solid #334155",borderRadius:8,padding:"9px 12px",color:"#F1F5F9",fontSize:13}}>{["LOW","MEDIUM","HIGH","CRITICAL"].map(o=><option key={o}>{o}</option>)}</select></label>
</div>
<label style={{display:"block",marginBottom:14}}><div style={{color:"#64748B",fontSize:12,marginBottom:8}}>Data Access</div><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{DATA_TYPES.map(d=><button key={d} onClick={()=>toggleArr("data_access",d)} style={{padding:"3px 10px",borderRadius:5,fontSize:11,cursor:"pointer",border:form.data_access.includes(d)?"1px solid #EF4444":"1px solid #334155",background:form.data_access.includes(d)?"rgba(239,68,68,.15)":"#1E293B",color:form.data_access.includes(d)?"#F87171":"#64748B"}}>{d}</button>)}</div></label>
<label style={{display:"block",marginBottom:14}}><div style={{color:"#64748B",fontSize:12,marginBottom:8}}>Certifications</div><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{FW_OPTIONS.map(f=><button key={f} onClick={()=>toggleArr("frameworks",f)} style={{padding:"3px 10px",borderRadius:5,fontSize:11,cursor:"pointer",border:form.frameworks.includes(f)?"1px solid #3B82F6":"1px solid #334155",background:form.frameworks.includes(f)?"rgba(59,130,246,.15)":"#1E293B",color:form.frameworks.includes(f)?"#60A5FA":"#64748B"}}>{f}</button>)}</div></label>
<label style={{display:"block",marginBottom:20}}><div style={{color:"#64748B",fontSize:12,marginBottom:5}}>Notes</div><textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} rows={3} style={{width:"100%",background:"#1E293B",border:"1px solid #334155",borderRadius:8,padding:"9px 12px",color:"#F1F5F9",fontSize:13,resize:"vertical",boxSizing:"border-box"}}/></label>
<div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><button onClick={()=>setShowCreate(false)} style={btn("#1E293B","#334155")}>Cancel</button><button onClick={saveVendor} disabled={saving} style={btn("#422006","#D97706")}>{saving?"Saving…":<><Save size={14}/>Add Vendor</>}</button></div>
</div></div>)}
<style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
</div>);}

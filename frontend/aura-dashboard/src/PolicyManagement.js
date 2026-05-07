import { useState, useEffect, useCallback } from "react";
import { FileText, Plus, Search, RefreshCw, CheckCircle, Clock, XCircle, AlertCircle, Edit2, Trash2, Download, Shield, ChevronRight, X, Save, Send, RotateCcw } from "lucide-react";
const API="http://localhost:8000";
const STATUS_CFG={APPROVED:{color:"#34D399",bg:"rgba(52,211,153,.12)",label:"Approved",icon:CheckCircle},REVIEW:{color:"#60A5FA",bg:"rgba(96,165,250,.12)",label:"In Review",icon:Clock},DRAFT:{color:"#94A3B8",bg:"rgba(148,163,184,.12)",label:"Draft",icon:Edit2},EXPIRED:{color:"#F87171",bg:"rgba(248,113,113,.12)",label:"Expired",icon:AlertCircle}};
const CATEGORY_COLORS={Security:"#F87171",Privacy:"#A78BFA",IT:"#60A5FA",Compliance:"#34D399",HR:"#FBBF24"};
const FRAMEWORKS=["All","SOC2","HIPAA","GDPR","PCI_DSS","NIST_CSF","ISO27001","DPDP","RBI"];
const STATUSES=["All","APPROVED","REVIEW","DRAFT","EXPIRED"];
const CATEGORIES=["All","Security","Privacy","IT","Compliance","HR"];
const CAT_OPTIONS=["Security","Privacy","IT","Compliance","HR"];
const FW_OPTIONS=["SOC2","HIPAA","GDPR","PCI_DSS","NIST_CSF","ISO27001","DPDP","RBI"];
function daysUntil(iso){if(!iso)return null;return Math.floor((new Date(iso)-Date.now())/86400000);}
function fmtDate(iso){if(!iso)return"—";return new Date(iso).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});}
const EMPTY={title:"",description:"",content:"",category:"Security",version:"1.0",owner:"",frameworks:[],controls:[]};
function btn(bg,border){return{display:"flex",alignItems:"center",gap:6,padding:"9px 14px",background:bg,border:`1px solid ${border}`,borderRadius:8,color:"#94A3B8",fontSize:13,cursor:"pointer"};}
function SideCard({title,children}){return(<div style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:12,padding:16}}><h4 style={{margin:"0 0 12px",color:"#475569",fontSize:11,textTransform:"uppercase",letterSpacing:".05em"}}>{title}</h4>{children}</div>);}
export default function PolicyManagement({token,tenantId}){
const[policies,setPolicies]=useState([]);
const[loading,setLoading]=useState(true);
const[search,setSearch]=useState("");
const[filterCat,setFilterCat]=useState("All");
const[filterSt,setFilterSt]=useState("All");
const[filterFw,setFilterFw]=useState("All");
const[selected,setSelected]=useState(null);
const[editing,setEditing]=useState(false);
const[showCreate,setShowCreate]=useState(false);
const[form,setForm]=useState(EMPTY);
const[saving,setSaving]=useState(false);
const[stats,setStats]=useState({});
const fetchPolicies=useCallback(async()=>{
setLoading(true);
try{
const p=new URLSearchParams({tenant_id:tenantId||"demo"});
if(filterCat!=="All")p.set("category",filterCat);
if(filterSt!=="All")p.set("status",filterSt);
if(filterFw!=="All")p.set("framework",filterFw);
if(search)p.set("search",search);
const res=await fetch(`${API}/api/policies?${p}`,{headers:{Authorization:`Bearer ${token}`}});
const data=await res.json();
const list=data.policies||[];
setPolicies(list);
setStats({total:list.length,approved:list.filter(p=>p.status==="APPROVED").length,review:list.filter(p=>p.status==="REVIEW").length,draft:list.filter(p=>p.status==="DRAFT").length,expired:list.filter(p=>p.status==="EXPIRED").length});
}catch{setPolicies([]);}finally{setLoading(false);}
},[token,tenantId,filterCat,filterSt,filterFw,search]);
useEffect(()=>{fetchPolicies();},[fetchPolicies]);
const savePolicy=async()=>{
if(!form.title||!form.owner)return alert("Title and Owner are required.");
setSaving(true);
try{
const url=editing&&selected?`${API}/api/policies/${selected.id}`:`${API}/api/policies?tenant_id=${tenantId||"demo"}`;
const method=editing&&selected?"PUT":"POST";
await fetch(url,{method,headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify(form)});
setShowCreate(false);setEditing(false);setSelected(null);setForm(EMPTY);fetchPolicies();
}catch{alert("Save failed");}finally{setSaving(false);}};
const updateStatus=async(id,status)=>{
try{await fetch(`${API}/api/policies/${id}/status?status=${status}&approved_by=Current+User`,{method:"PATCH",headers:{Authorization:`Bearer ${token}`}});fetchPolicies();if(selected?.id===id)setSelected(p=>({...p,status}));}catch{alert("Update failed");}};
const deletePolicy=async(id)=>{
if(!window.confirm("Delete this policy?"))return;
try{await fetch(`${API}/api/policies/${id}`,{method:"DELETE",headers:{Authorization:`Bearer ${token}`}});setSelected(null);fetchPolicies();}catch{alert("Delete failed");}};
const exportPolicy=(p)=>{
const text=`${p.title}\nVersion: ${p.version} | Status: ${p.status} | Owner: ${p.owner}\nFrameworks: ${p.frameworks?.join(", ")}\n\n${p.description}\n\n${p.content}`;
const blob=new Blob([text],{type:"text/plain"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`${p.title.replace(/\s+/g,"-")}.txt`;a.click();URL.revokeObjectURL(url);};
const openEdit=(p)=>{setForm({title:p.title,description:p.description||"",content:p.content||"",category:p.category,version:p.version,owner:p.owner,frameworks:p.frameworks||[],controls:p.controls||[]});setEditing(true);setShowCreate(true);};
const toggleFw=(fw)=>setForm(f=>({...f,frameworks:f.frameworks.includes(fw)?f.frameworks.filter(x=>x!==fw):[...f.frameworks,fw]}));
if(selected){
const sc=STATUS_CFG[selected.status]||STATUS_CFG.DRAFT;
const StatusIcon=sc.icon;
const reviewDays=daysUntil(selected.review_date);
return(<div style={{padding:"28px 32px"}}>
<button onClick={()=>setSelected(null)} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:"#64748B",fontSize:13,cursor:"pointer",marginBottom:20,padding:0}}>
<ChevronRight size={14} style={{transform:"rotate(180deg)"}}/>Back to Policies</button>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
<div>
<div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
<span style={{background:`${CATEGORY_COLORS[selected.category]}18`,color:CATEGORY_COLORS[selected.category],borderRadius:6,padding:"3px 10px",fontSize:12,fontWeight:600}}>{selected.category}</span>
<span style={{background:sc.bg,color:sc.color,borderRadius:6,padding:"3px 10px",fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:4}}><StatusIcon size={11}/>{sc.label}</span>
<span style={{color:"#475569",fontSize:12}}>v{selected.version}</span>
</div>
<h2 style={{margin:0,fontSize:22,fontWeight:700,color:"#F1F5F9"}}>{selected.title}</h2>
<p style={{margin:"6px 0 0",color:"#64748B",fontSize:13}}>Owner: {selected.owner}</p>
</div>
<div style={{display:"flex",gap:8}}>
<button onClick={()=>exportPolicy(selected)} style={btn("#1E293B","#334155")}><Download size={14}/>Export</button>
<button onClick={()=>openEdit(selected)} style={btn("#1E3A5F","#2563EB")}><Edit2 size={14}/>Edit</button>
{selected.status==="DRAFT"&&<button onClick={()=>updateStatus(selected.id,"REVIEW")} style={btn("#1C3A2A","#16A34A")}><Send size={14}/>Submit for Review</button>}
{selected.status==="REVIEW"&&<button onClick={()=>updateStatus(selected.id,"APPROVED")} style={btn("#1C3A2A","#16A34A")}><CheckCircle size={14}/>Approve</button>}
{selected.status==="EXPIRED"&&<button onClick={()=>updateStatus(selected.id,"REVIEW")} style={btn("#1E293B","#334155")}><RotateCcw size={14}/>Re-activate</button>}
<button onClick={()=>deletePolicy(selected.id)} style={btn("#3B0F0F","#DC2626")}><Trash2 size={14}/></button>
</div>
</div>
<div style={{display:"grid",gridTemplateColumns:"1fr 280px",gap:20}}>
<div>
<div style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:14,padding:24,marginBottom:16}}>
<h4 style={{margin:"0 0 12px",color:"#94A3B8",fontSize:12,textTransform:"uppercase",letterSpacing:".05em"}}>Description</h4>
<p style={{color:"#CBD5E1",fontSize:14,lineHeight:1.7,margin:0}}>{selected.description||"No description provided."}</p>
</div>
<div style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:14,padding:24}}>
<h4 style={{margin:"0 0 16px",color:"#94A3B8",fontSize:12,textTransform:"uppercase",letterSpacing:".05em"}}>Policy Content</h4>
<pre style={{color:"#CBD5E1",fontSize:13,lineHeight:1.8,margin:0,whiteSpace:"pre-wrap",fontFamily:"'SF Mono',Consolas,monospace"}}>{selected.content||"No content yet."}</pre>
</div>
</div>
<div style={{display:"flex",flexDirection:"column",gap:14}}>
<SideCard title="Frameworks"><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{(selected.frameworks||[]).map(f=>(<span key={f} style={{background:"rgba(59,130,246,.15)",color:"#60A5FA",borderRadius:6,padding:"3px 8px",fontSize:12}}>{f}</span>))}</div></SideCard>
<SideCard title="Linked Controls"><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{(selected.controls||[]).length>0?(selected.controls||[]).map(c=>(<span key={c} style={{background:"rgba(99,102,241,.15)",color:"#818CF8",borderRadius:6,padding:"3px 8px",fontSize:12}}>{c}</span>)):<span style={{color:"#475569",fontSize:13}}>None linked</span>}</div></SideCard>
<SideCard title="Dates">{[{label:"Effective Date",value:fmtDate(selected.effective_date)},{label:"Review Date",value:fmtDate(selected.review_date),warn:reviewDays!==null&&reviewDays<30},{label:"Last Updated",value:fmtDate(selected.updated_at)}].map(d=>(<div key={d.label} style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><span style={{color:"#475569",fontSize:12}}>{d.label}</span><span style={{color:d.warn?"#FBBF24":"#94A3B8",fontSize:12,fontWeight:d.warn?600:400}}>{d.value}{d.warn&&reviewDays>=0?` (${reviewDays}d)`:""}</span></div>))}</SideCard>
{selected.approved_by&&<SideCard title="Approved By"><span style={{color:"#94A3B8",fontSize:13}}>{selected.approved_by}</span></SideCard>}
</div>
</div>
</div>);}
return(<div style={{padding:"28px 32px"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28}}>
<div>
<h2 style={{margin:0,fontSize:22,fontWeight:700,color:"#F1F5F9",display:"flex",alignItems:"center",gap:10}}><FileText size={22} color="#A78BFA"/>Policy Management</h2>
<p style={{margin:"6px 0 0",color:"#64748B",fontSize:13}}>Create, manage, and track approval of compliance policies</p>
</div>
<div style={{display:"flex",gap:10}}>
<button onClick={fetchPolicies} style={btn("#1E293B","#334155")}><RefreshCw size={14}/>Refresh</button>
<button onClick={()=>{setForm(EMPTY);setEditing(false);setShowCreate(true);}} style={btn("#2E1065","#7C3AED")}><Plus size={14}/>New Policy</button>
</div>
</div>
<div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:24}}>
{[{label:"Total",value:stats.total,color:"#60A5FA"},{label:"Approved",value:stats.approved,color:"#34D399"},{label:"In Review",value:stats.review,color:"#60A5FA"},{label:"Draft",value:stats.draft,color:"#94A3B8"},{label:"Expired",value:stats.expired,color:"#F87171"}].map(s=>(<div key={s.label} style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:12,padding:"14px 16px"}}><div style={{color:"#64748B",fontSize:11,marginBottom:6}}>{s.label}</div><div style={{fontSize:24,fontWeight:700,color:s.color}}>{s.value||0}</div></div>))}
</div>
<div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}}>
<div style={{position:"relative",flex:1,minWidth:200}}>
<Search size={14} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#475569"}}/>
<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search policies…" style={{width:"100%",background:"#0F172A",border:"1px solid #1E293B",borderRadius:8,padding:"9px 12px 9px 34px",color:"#F1F5F9",fontSize:13,boxSizing:"border-box"}}/>
</div>
{[{value:filterCat,setter:setFilterCat,options:CATEGORIES},{value:filterSt,setter:setFilterSt,options:STATUSES},{value:filterFw,setter:setFilterFw,options:FRAMEWORKS}].map((f,i)=>(<select key={i} value={f.value} onChange={e=>f.setter(e.target.value)} style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:8,padding:"9px 14px",color:"#94A3B8",fontSize:13,cursor:"pointer"}}>{f.options.map(o=><option key={o}>{o}</option>)}</select>))}
</div>
{loading?(<div style={{textAlign:"center",padding:60,color:"#475569"}}><RefreshCw size={20} style={{animation:"spin 1s linear infinite"}}/><div style={{marginTop:8,fontSize:13}}>Loading policies…</div></div>):(
<div style={{display:"flex",flexDirection:"column",gap:10}}>
{policies.map(p=>{
const sc=STATUS_CFG[p.status]||STATUS_CFG.DRAFT;const StatusIcon=sc.icon;const catColor=CATEGORY_COLORS[p.category]||"#94A3B8";const rd=daysUntil(p.review_date);
return(<div key={p.id} onClick={()=>setSelected(p)} style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:12,padding:"16px 20px",cursor:"pointer",transition:"border-color .15s",display:"grid",gridTemplateColumns:"1fr auto",alignItems:"center",gap:16}} onMouseEnter={e=>e.currentTarget.style.borderColor="#334155"} onMouseLeave={e=>e.currentTarget.style.borderColor="#1E293B"}>
<div>
<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
<span style={{background:`${catColor}18`,color:catColor,borderRadius:5,padding:"2px 8px",fontSize:11,fontWeight:600}}>{p.category}</span>
<span style={{background:sc.bg,color:sc.color,borderRadius:5,padding:"2px 8px",fontSize:11,fontWeight:600,display:"inline-flex",alignItems:"center",gap:3}}><StatusIcon size={10}/>{sc.label}</span>
<span style={{color:"#475569",fontSize:11}}>v{p.version}</span>
{rd!==null&&rd<30&&rd>=0&&<span style={{color:"#FBBF24",fontSize:11}}>⚠ Review in {rd}d</span>}
{rd!==null&&rd<0&&<span style={{color:"#F87171",fontSize:11}}>⚠ Review overdue</span>}
</div>
<div style={{color:"#E2E8F0",fontSize:14,fontWeight:600,marginBottom:4}}>{p.title}</div>
<div style={{color:"#475569",fontSize:12}}>Owner: {p.owner}{p.frameworks?.length>0&&<span style={{marginLeft:12}}>{p.frameworks.map(f=>(<span key={f} style={{background:"rgba(59,130,246,.1)",color:"#60A5FA",borderRadius:4,padding:"1px 6px",fontSize:11,marginRight:4}}>{f}</span>))}</span>}</div>
</div>
<div style={{display:"flex",alignItems:"center",gap:10}}>
<span style={{color:"#475569",fontSize:12}}>Updated {fmtDate(p.updated_at)}</span>
<ChevronRight size={16} color="#334155"/>
</div>
</div>);})}
{policies.length===0&&<div style={{textAlign:"center",padding:60,color:"#475569"}}><FileText size={40} style={{opacity:.3,marginBottom:12}}/><div style={{fontSize:14}}>No policies found. Create your first policy.</div></div>}
</div>)}
{showCreate&&(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>e.target===e.currentTarget&&setShowCreate(false)}>
<div style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:16,padding:28,width:640,maxHeight:"90vh",overflowY:"auto"}}>
<div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}>
<h3 style={{margin:0,color:"#F1F5F9",fontSize:17}}>{editing?"Edit Policy":"New Policy"}</h3>
<button onClick={()=>setShowCreate(false)} style={{background:"none",border:"none",color:"#475569",cursor:"pointer"}}><X size={18}/></button>
</div>
{[{label:"Policy Title *",key:"title"},{label:"Owner *",key:"owner"},{label:"Version",key:"version"}].map(f=>(<label key={f.key} style={{display:"block",marginBottom:14}}><div style={{color:"#64748B",fontSize:12,marginBottom:5}}>{f.label}</div><input value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})} style={{width:"100%",background:"#1E293B",border:"1px solid #334155",borderRadius:8,padding:"9px 12px",color:"#F1F5F9",fontSize:13,boxSizing:"border-box"}}/></label>))}
<label style={{display:"block",marginBottom:14}}><div style={{color:"#64748B",fontSize:12,marginBottom:5}}>Category</div><select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} style={{width:"100%",background:"#1E293B",border:"1px solid #334155",borderRadius:8,padding:"9px 12px",color:"#F1F5F9",fontSize:13}}>{CAT_OPTIONS.map(o=><option key={o}>{o}</option>)}</select></label>
<label style={{display:"block",marginBottom:14}}><div style={{color:"#64748B",fontSize:12,marginBottom:8}}>Frameworks</div><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{FW_OPTIONS.map(fw=>(<button key={fw} onClick={()=>toggleFw(fw)} style={{padding:"4px 12px",borderRadius:6,fontSize:12,cursor:"pointer",border:form.frameworks.includes(fw)?"1px solid #3B82F6":"1px solid #334155",background:form.frameworks.includes(fw)?"rgba(59,130,246,.15)":"#1E293B",color:form.frameworks.includes(fw)?"#60A5FA":"#64748B"}}>{fw}</button>))}</div></label>
<label style={{display:"block",marginBottom:14}}><div style={{color:"#64748B",fontSize:12,marginBottom:5}}>Description</div><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={2} style={{width:"100%",background:"#1E293B",border:"1px solid #334155",borderRadius:8,padding:"9px 12px",color:"#F1F5F9",fontSize:13,resize:"vertical",boxSizing:"border-box"}}/></label>
<label style={{display:"block",marginBottom:20}}><div style={{color:"#64748B",fontSize:12,marginBottom:5}}>Policy Content</div><textarea value={form.content} onChange={e=>setForm({...form,content:e.target.value})} rows={8} placeholder="Write your policy content here…" style={{width:"100%",background:"#1E293B",border:"1px solid #334155",borderRadius:8,padding:"9px 12px",color:"#F1F5F9",fontSize:13,resize:"vertical",boxSizing:"border-box",fontFamily:"monospace"}}/></label>
<div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
<button onClick={()=>setShowCreate(false)} style={btn("#1E293B","#334155")}>Cancel</button>
<button onClick={savePolicy} disabled={saving} style={btn("#2E1065","#7C3AED")}>{saving?"Saving…":<><Save size={14}/>{editing?"Save Changes":"Create Policy"}</>}</button>
</div>
</div>
</div>)}
<style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
</div>);}

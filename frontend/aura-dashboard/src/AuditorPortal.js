import { useState, useEffect, useCallback } from "react";
import { Shield, Plus, RefreshCw, CheckCircle, Clock, AlertTriangle, XCircle, MessageSquare, ChevronRight, X, Send, Building } from "lucide-react";
const API="http://localhost:8000";
const STATUS_CFG={APPROVED:{color:"#34D399",bg:"rgba(52,211,153,.12)",label:"Approved",icon:CheckCircle},IN_REVIEW:{color:"#60A5FA",bg:"rgba(96,165,250,.12)",label:"In Review",icon:Clock},NEEDS_EVIDENCE:{color:"#F87171",bg:"rgba(248,113,113,.12)",label:"Needs Evidence",icon:AlertTriangle},NOT_STARTED:{color:"#94A3B8",bg:"rgba(148,163,184,.12)",label:"Not Started",icon:XCircle}};
const ROOM_STATUS={IN_PROGRESS:{color:"#60A5FA",label:"In Progress"},PENDING:{color:"#FBBF24",label:"Pending"},COMPLETED:{color:"#34D399",label:"Completed"},CLOSED:{color:"#94A3B8",label:"Closed"}};
function btn(bg,border){return{display:"flex",alignItems:"center",gap:6,padding:"9px 14px",background:bg,border:`1px solid ${border}`,borderRadius:8,color:"#94A3B8",fontSize:13,cursor:"pointer"};}
function fmtDate(iso){if(!iso)return"—";return new Date(iso).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});}
const EMPTY={name:"",framework:"SOC2",auditor_firm:"",auditor_name:"",auditor_email:"",period_start:"",period_end:"",due_date:""};
export default function AuditorPortal({token,tenantId}){
const[rooms,setRooms]=useState([]);
const[loading,setLoading]=useState(true);
const[selected,setSelected]=useState(null);
const[items,setItems]=useState([]);
const[comments,setComments]=useState([]);
const[stats,setStats]=useState({});
const[showCreate,setShowCreate]=useState(false);
const[form,setForm]=useState(EMPTY);
const[saving,setSaving]=useState(false);
const[selectedItem,setSelectedItem]=useState(null);
const[newComment,setNewComment]=useState("");
const[filterStatus,setFilterStatus]=useState("All");
const fetch_=useCallback(async()=>{
setLoading(true);
try{const res=await fetch(`${API}/api/auditor/rooms?tenant_id=${tenantId||"demo"}`,{headers:{Authorization:`Bearer ${token}`}});const data=await res.json();setRooms(data.rooms||[]);}catch{setRooms([]);}finally{setLoading(false);}
},[token,tenantId]);
useEffect(()=>{fetch_();},[fetch_]);
const loadRoom=async(room)=>{
setSelected(room);
try{
const[iRes,sRes]=await Promise.all([fetch(`${API}/api/auditor/rooms/${room.id}/items`,{headers:{Authorization:`Bearer ${token}`}}),fetch(`${API}/api/auditor/rooms/${room.id}/stats`,{headers:{Authorization:`Bearer ${token}`}})]);
const iData=await iRes.json();const sData=await sRes.json();
setItems(iData.items||[]);setStats(sData);
}catch{setItems([]);}};
const loadComments=async(item)=>{
setSelectedItem(item);
try{const res=await fetch(`${API}/api/auditor/rooms/${selected.id}/comments?control_id=${item.control_id}`,{headers:{Authorization:`Bearer ${token}`}});const data=await res.json();setComments(data.comments||[]);}catch{setComments([]);}};
const addComment=async()=>{
if(!newComment.trim())return;
try{const res=await fetch(`${API}/api/auditor/rooms/${selected.id}/comments`,{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify({control_id:selectedItem?.control_id,author:"Amit Shah",author_type:"internal",message:newComment})});const data=await res.json();setComments(c=>[...c,data.comment]);setNewComment("");}catch{alert("Failed");}};
const createRoom=async()=>{
if(!form.name||!form.auditor_email)return alert("Name and auditor email required.");
setSaving(true);
try{const res=await fetch(`${API}/api/auditor/rooms?tenant_id=${tenantId||"demo"}`,{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify(form)});const data=await res.json();setShowCreate(false);setForm(EMPTY);alert(`✅ Audit room created! Portal link:\n${data.portal_link}`);fetch_();}catch{alert("Failed");}finally{setSaving(false);}};
const filteredItems=filterStatus==="All"?items:items.filter(i=>i.status===filterStatus);
if(selected){
const rs=ROOM_STATUS[selected.status]||ROOM_STATUS.PENDING;
return(<div style={{padding:"28px 32px"}}>
<button onClick={()=>{setSelected(null);setSelectedItem(null);}} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:"#64748B",fontSize:13,cursor:"pointer",marginBottom:20,padding:0}}><ChevronRight size={14} style={{transform:"rotate(180deg)"}}/>Back to Audit Rooms</button>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
<div>
<div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}><span style={{background:`${rs.color}18`,color:rs.color,borderRadius:6,padding:"3px 10px",fontSize:12,fontWeight:600}}>{rs.label}</span><span style={{color:"#475569",fontSize:12}}>{selected.framework}</span></div>
<h2 style={{margin:0,fontSize:22,fontWeight:700,color:"#F1F5F9"}}>{selected.name}</h2>
<div style={{color:"#64748B",fontSize:13,marginTop:4}}><Building size={12} style={{marginRight:4,verticalAlign:"middle"}}/>{selected.auditor_firm} · {selected.auditor_name} · {selected.auditor_email}</div>
</div>
<div style={{textAlign:"right"}}><div style={{color:"#64748B",fontSize:12,marginBottom:4}}>Period: {fmtDate(selected.period_start)} → {fmtDate(selected.period_end)}</div><div style={{color:"#FBBF24",fontSize:12}}>Due: {fmtDate(selected.due_date)}</div></div>
</div>
<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24}}>
{[{label:"Approved",value:stats.approved,color:"#34D399"},{label:"In Review",value:stats.in_review,color:"#60A5FA"},{label:"Needs Evidence",value:stats.needs_evidence,color:"#F87171"},{label:"Not Started",value:stats.not_started,color:"#94A3B8"}].map(s=>(<div key={s.label} style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:12,padding:"14px 16px"}}><div style={{color:"#64748B",fontSize:11,marginBottom:6}}>{s.label}</div><div style={{fontSize:24,fontWeight:700,color:s.color}}>{s.value||0}</div></div>))}
</div>
<div style={{display:"grid",gridTemplateColumns:selectedItem?"1fr 360px":"1fr",gap:16}}>
<div>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
<h3 style={{margin:0,color:"#64748B",fontSize:12,textTransform:"uppercase",letterSpacing:".05em"}}>Controls ({filteredItems.length})</h3>
<select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:8,padding:"7px 12px",color:"#94A3B8",fontSize:12,cursor:"pointer"}}>{["All","APPROVED","IN_REVIEW","NEEDS_EVIDENCE","NOT_STARTED"].map(o=><option key={o}>{o}</option>)}</select>
</div>
<div style={{display:"flex",flexDirection:"column",gap:8}}>
{filteredItems.map(item=>{const sc=STATUS_CFG[item.status]||STATUS_CFG.NOT_STARTED;const Icon=sc.icon;const priColor=item.priority==="CRITICAL"?"#EF4444":item.priority==="HIGH"?"#F87171":item.priority==="MEDIUM"?"#FBBF24":"#94A3B8";return(<div key={item.id} onClick={()=>loadComments(item)} style={{background:selectedItem?.id===item.id?"#0D1B2E":"#0F172A",border:`1px solid ${selectedItem?.id===item.id?sc.color+"60":"#1E293B"}`,borderRadius:12,padding:"14px 16px",cursor:"pointer"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
<div style={{flex:1}}>
<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><span style={{background:sc.bg,color:sc.color,borderRadius:5,padding:"2px 7px",fontSize:11,fontWeight:600,display:"inline-flex",alignItems:"center",gap:3}}><Icon size={10}/>{sc.label}</span><span style={{color:priColor,fontSize:11,fontWeight:600}}>{item.priority}</span><span style={{color:"#475569",fontSize:11}}>{item.control_id}</span></div>
<div style={{color:"#E2E8F0",fontSize:13,fontWeight:500,marginBottom:4}}>{item.control_name}</div>
{item.auditor_comment&&<div style={{color:"#64748B",fontSize:12,fontStyle:"italic"}}>"{item.auditor_comment}"</div>}
{item.internal_note&&<div style={{color:"#FBBF24",fontSize:11,marginTop:4}}>📝 {item.internal_note}</div>}
</div>
<div style={{display:"flex",alignItems:"center",gap:6,marginLeft:12}}><span style={{color:"#475569",fontSize:11}}>{item.evidence_count} files</span><MessageSquare size={13} color="#334155"/></div>
</div>
</div>);})}
</div>
</div>
{selectedItem&&(<div style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:14,padding:20,display:"flex",flexDirection:"column",maxHeight:"70vh"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><div><div style={{color:"#E2E8F0",fontSize:14,fontWeight:600}}>{selectedItem.control_name}</div><div style={{color:"#475569",fontSize:12}}>{selectedItem.control_id}</div></div><button onClick={()=>setSelectedItem(null)} style={{background:"none",border:"none",color:"#475569",cursor:"pointer"}}><X size={16}/></button></div>
<div style={{flex:1,overflowY:"auto",marginBottom:16}}>
{comments.length===0?<div style={{color:"#475569",fontSize:13,textAlign:"center",padding:20}}>No comments yet.</div>:
comments.map(c=>(<div key={c.id} style={{marginBottom:12,display:"flex",gap:8,flexDirection:c.author_type==="auditor"?"row":"row-reverse"}}>
<div style={{width:28,height:28,borderRadius:"50%",background:c.author_type==="auditor"?"rgba(96,165,250,.2)":"rgba(52,211,153,.2)",display:"flex",alignItems:"center",justifyContent:"center",color:c.author_type==="auditor"?"#60A5FA":"#34D399",fontSize:11,fontWeight:700,flexShrink:0}}>{c.author[0]}</div>
<div style={{background:c.author_type==="auditor"?"#0D1B2E":"#0D2818",borderRadius:10,padding:"8px 12px",maxWidth:"80%"}}>
<div style={{color:c.author_type==="auditor"?"#60A5FA":"#34D399",fontSize:11,fontWeight:600,marginBottom:4}}>{c.author}</div>
<div style={{color:"#CBD5E1",fontSize:12,lineHeight:1.5}}>{c.message}</div>
<div style={{color:"#475569",fontSize:10,marginTop:4}}>{new Date(c.created_at).toLocaleString("en-IN",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</div>
</div>
</div>))}
</div>
<div style={{display:"flex",gap:8}}><input value={newComment} onChange={e=>setNewComment(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addComment()} placeholder="Reply to auditor…" style={{flex:1,background:"#1E293B",border:"1px solid #334155",borderRadius:8,padding:"8px 12px",color:"#F1F5F9",fontSize:12}}/><button onClick={addComment} style={{background:"#1E3A5F",border:"1px solid #2563EB",borderRadius:8,padding:"8px 12px",color:"#60A5FA",cursor:"pointer"}}><Send size={13}/></button></div>
</div>)}
</div>
</div>);}
return(<div style={{padding:"28px 32px"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28}}>
<div><h2 style={{margin:0,fontSize:22,fontWeight:700,color:"#F1F5F9",display:"flex",alignItems:"center",gap:10}}><Shield size={22} color="#A78BFA"/>Auditor Portal</h2><p style={{margin:"6px 0 0",color:"#64748B",fontSize:13}}>Manage external audit engagements and auditor collaboration</p></div>
<div style={{display:"flex",gap:10}}><button onClick={fetch_} style={btn("#1E293B","#334155")}><RefreshCw size={14}/>Refresh</button><button onClick={()=>setShowCreate(true)} style={btn("#1C1033","#7C3AED")}><Plus size={14}/>New Audit Room</button></div>
</div>
{loading?<div style={{textAlign:"center",padding:60,color:"#475569"}}><RefreshCw size={20} style={{animation:"spin 1s linear infinite"}}/></div>:(
<div style={{display:"flex",flexDirection:"column",gap:12}}>
{rooms.map(room=>{const rs=ROOM_STATUS[room.status]||ROOM_STATUS.PENDING;const progress=room.progress||0;const progressColor=progress>=80?"#34D399":progress>=50?"#60A5FA":"#FBBF24";return(<div key={room.id} onClick={()=>loadRoom(room)} style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:14,padding:"20px 24px",cursor:"pointer",transition:"border-color .15s"}} onMouseEnter={e=>e.currentTarget.style.borderColor="#334155"} onMouseLeave={e=>e.currentTarget.style.borderColor="#1E293B"}>
<div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:16,alignItems:"start"}}>
<div>
<div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}><span style={{background:`${rs.color}18`,color:rs.color,borderRadius:6,padding:"3px 10px",fontSize:12,fontWeight:600}}>{rs.label}</span><span style={{color:"#475569",fontSize:12}}>{room.framework}</span></div>
<div style={{color:"#E2E8F0",fontSize:16,fontWeight:700,marginBottom:4}}>{room.name}</div>
<div style={{color:"#64748B",fontSize:13,marginBottom:12}}>{room.auditor_firm} · {room.auditor_name}</div>
<div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}><div style={{flex:1,height:6,background:"#1E293B",borderRadius:3,overflow:"hidden"}}><div style={{width:`${progress}%`,height:"100%",background:progressColor,borderRadius:3}}/></div><span style={{color:progressColor,fontSize:12,fontWeight:600,minWidth:35}}>{progress}%</span></div>
<div style={{display:"flex",gap:16}}><span style={{color:"#64748B",fontSize:12}}>Controls: {room.controls_reviewed}/{room.controls_total}</span><span style={{color:"#64748B",fontSize:12}}>Evidence: {room.evidence_provided}/{room.evidence_requested}</span><span style={{color:"#FBBF24",fontSize:12}}>Due: {fmtDate(room.due_date)}</span></div>
</div>
<ChevronRight size={20} color="#334155"/>
</div>
</div>);})}
{rooms.length===0&&<div style={{textAlign:"center",padding:60,color:"#475569"}}><Shield size={40} style={{opacity:.3,marginBottom:12}}/><div style={{fontSize:14}}>No audit rooms yet.</div></div>}
</div>)}
{showCreate&&(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>e.target===e.currentTarget&&setShowCreate(false)}>
<div style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:16,padding:28,width:500,maxHeight:"90vh",overflowY:"auto"}}>
<div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}><h3 style={{margin:0,color:"#F1F5F9",fontSize:17}}>Create Audit Room</h3><button onClick={()=>setShowCreate(false)} style={{background:"none",border:"none",color:"#475569",cursor:"pointer"}}><X size={18}/></button></div>
{[{label:"Audit Name *",key:"name"},{label:"Auditor Firm",key:"auditor_firm"},{label:"Auditor Name",key:"auditor_name"},{label:"Auditor Email *",key:"auditor_email"}].map(f=>(<label key={f.key} style={{display:"block",marginBottom:14}}><div style={{color:"#64748B",fontSize:12,marginBottom:5}}>{f.label}</div><input value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})} style={{width:"100%",background:"#1E293B",border:"1px solid #334155",borderRadius:8,padding:"9px 12px",color:"#F1F5F9",fontSize:13,boxSizing:"border-box"}}/></label>))}
<label style={{display:"block",marginBottom:14}}><div style={{color:"#64748B",fontSize:12,marginBottom:5}}>Framework</div><select value={form.framework} onChange={e=>setForm({...form,framework:e.target.value})} style={{width:"100%",background:"#1E293B",border:"1px solid #334155",borderRadius:8,padding:"9px 12px",color:"#F1F5F9",fontSize:13}}>{["SOC2","ISO27001","HIPAA","PCI_DSS","GDPR"].map(o=><option key={o}>{o}</option>)}</select></label>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:20}}>{[{label:"Period Start",key:"period_start"},{label:"Period End",key:"period_end"},{label:"Due Date",key:"due_date"}].map(f=>(<label key={f.key}><div style={{color:"#64748B",fontSize:12,marginBottom:5}}>{f.label}</div><input type="date" value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})} style={{width:"100%",background:"#1E293B",border:"1px solid #334155",borderRadius:8,padding:"9px 12px",color:"#F1F5F9",fontSize:13,boxSizing:"border-box"}}/></label>))}</div>
<div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><button onClick={()=>setShowCreate(false)} style={btn("#1E293B","#334155")}>Cancel</button><button onClick={createRoom} disabled={saving} style={btn("#1C1033","#7C3AED")}>{saving?"Creating…":<><Shield size={14}/>Create & Invite</>}</button></div>
</div></div>)}
<style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
</div>);}

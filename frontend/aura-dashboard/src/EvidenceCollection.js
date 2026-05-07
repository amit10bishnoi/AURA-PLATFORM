import { useState, useEffect, useCallback, useRef } from "react";
import { FileCheck, Upload, Search, RefreshCw, CheckCircle, XCircle, Clock, AlertCircle, Trash2, FileText, Image, Code2, File, Shield, Plus } from "lucide-react";

const API = "http://localhost:8000";
const STATUS_CFG = {
  APPROVED:       { color:"#34D399", bg:"rgba(52,211,153,.12)",  label:"Approved",       icon:CheckCircle },
  PENDING_REVIEW: { color:"#FBBF24", bg:"rgba(251,191,36,.12)",  label:"Pending Review", icon:Clock },
  REJECTED:       { color:"#F87171", bg:"rgba(248,113,113,.12)", label:"Rejected",        icon:XCircle },
  EXPIRED:        { color:"#94A3B8", bg:"rgba(148,163,184,.12)", label:"Expired",         icon:AlertCircle },
};
const CATEGORY_CFG = {
  Policy:     { color:"#60A5FA", icon:FileText },
  Report:     { color:"#A78BFA", icon:FileCheck },
  Screenshot: { color:"#34D399", icon:Image },
  Config:     { color:"#FBBF24", icon:Code2 },
  Other:      { color:"#94A3B8", icon:File },
};
const FILE_TYPE_COLORS = { pdf:"#F87171", png:"#34D399", jpg:"#34D399", docx:"#60A5FA", json:"#FBBF24", xlsx:"#34D399", csv:"#A78BFA" };
const FRAMEWORKS = ["All","SOC2","HIPAA","GDPR","PCI_DSS","NIST_CSF","ISO27001","DPDP","RBI"];
const STATUSES   = ["All","APPROVED","PENDING_REVIEW","REJECTED","EXPIRED"];
const CATEGORIES = ["All","Policy","Report","Screenshot","Config","Other"];

function formatSize(kb) { if(!kb)return"—"; return kb>1024?`${(kb/1024).toFixed(1)} MB`:`${kb} KB`; }
function daysUntil(iso) { if(!iso)return null; return Math.floor((new Date(iso)-Date.now())/86400000); }
function Tag({color,children}){ return <span style={{background:`${color}18`,color,borderRadius:5,padding:"2px 7px",fontSize:11,fontWeight:500}}>{children}</span>; }
function IconBtn({color,onClick,title,children}){ return <button onClick={onClick} title={title} style={{background:"transparent",border:`1px solid ${color}30`,borderRadius:6,padding:"4px 7px",color,cursor:"pointer",display:"flex",alignItems:"center"}}>{children}</button>; }
function btn(bg,border){ return {display:"flex",alignItems:"center",gap:6,padding:"9px 14px",background:bg,border:`1px solid ${border}`,borderRadius:8,color:"#94A3B8",fontSize:13,cursor:"pointer"}; }

export default function EvidenceCollection({ token, tenantId }) {
  const [evidence,setEvidence]=useState([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState("");
  const [framework,setFramework]=useState("All");
  const [status,setStatus]=useState("All");
  const [category,setCategory]=useState("All");
  const [showUpload,setShowUpload]=useState(false);
  const [uploading,setUploading]=useState(false);
  const [stats,setStats]=useState({});
  const fileRef=useRef();
  const [form,setForm]=useState({name:"",framework:"SOC2",category:"Policy",control_id:"",control_name:"",description:""});

  const fetchEvidence=useCallback(async()=>{
    setLoading(true);
    try{
      const p=new URLSearchParams({tenant_id:tenantId||"demo"});
      if(framework!=="All")p.set("framework",framework);
      if(status!=="All")p.set("status",status);
      if(category!=="All")p.set("category",category);
      if(search)p.set("search",search);
      const res=await fetch(`${API}/api/evidence?${p}`,{headers:{Authorization:`Bearer ${token}`}});
      const data=await res.json();
      const list=data.evidence||[];
      setEvidence(list);
      setStats({total:list.length,approved:list.filter(e=>e.status==="APPROVED").length,pending:list.filter(e=>e.status==="PENDING_REVIEW").length,rejected:list.filter(e=>e.status==="REJECTED").length});
    }catch{setEvidence([]);}finally{setLoading(false);}
  },[token,tenantId,framework,status,category,search]);

  useEffect(()=>{fetchEvidence();},[fetchEvidence]);

  const handleUpload=async()=>{
    if(!form.name)return;
    setUploading(true);
    try{
      const fd=new FormData();
      fd.append("tenant_id",tenantId||"demo");
      fd.append("uploaded_by","Current User");
      Object.entries(form).forEach(([k,v])=>v&&fd.append(k,v));
      if(fileRef.current?.files[0])fd.append("file",fileRef.current.files[0]);
      await fetch(`${API}/api/evidence`,{method:"POST",headers:{Authorization:`Bearer ${token}`},body:fd});
      setShowUpload(false);
      setForm({name:"",framework:"SOC2",category:"Policy",control_id:"",control_name:"",description:""});
      fetchEvidence();
    }catch{alert("Upload failed");}finally{setUploading(false);}
  };

  const updateStatus=async(id,newStatus)=>{
    try{await fetch(`${API}/api/evidence/${id}/status?status=${newStatus}&reviewed_by=Current+User`,{method:"PATCH",headers:{Authorization:`Bearer ${token}`}});fetchEvidence();}catch{alert("Update failed");}
  };
  const deleteEvidence=async(id)=>{
    if(!window.confirm("Delete this evidence?"))return;
    try{await fetch(`${API}/api/evidence/${id}`,{method:"DELETE",headers:{Authorization:`Bearer ${token}`}});fetchEvidence();}catch{alert("Delete failed");}
  };

  return (
    <div style={{padding:"28px 32px",minHeight:"100vh"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28}}>
        <div>
          <h2 style={{margin:0,fontSize:22,fontWeight:700,color:"#F1F5F9",display:"flex",alignItems:"center",gap:10}}>
            <FileCheck size={22} color="#34D399"/> Evidence Collection
          </h2>
          <p style={{margin:"6px 0 0",color:"#64748B",fontSize:13}}>Upload and manage compliance evidence linked to controls</p>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={fetchEvidence} style={btn("#1E293B","#334155")}><RefreshCw size={14}/> Refresh</button>
          <button onClick={()=>setShowUpload(true)} style={btn("#14532D","#16A34A")}><Plus size={14}/> Upload Evidence</button>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24}}>
        {[{label:"Total Evidence",value:stats.total,color:"#60A5FA"},{label:"Approved",value:stats.approved,color:"#34D399"},{label:"Pending Review",value:stats.pending,color:"#FBBF24"},{label:"Rejected",value:stats.rejected,color:"#F87171"}].map(s=>(
          <div key={s.label} style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:12,padding:"16px 18px"}}>
            <div style={{color:"#64748B",fontSize:12,marginBottom:8}}>{s.label}</div>
            <div style={{fontSize:26,fontWeight:700,color:s.color}}>{s.value||0}</div>
          </div>
        ))}
      </div>

      <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}}>
        <div style={{position:"relative",flex:1,minWidth:200}}>
          <Search size={14} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#475569"}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search evidence name or control…"
            style={{width:"100%",background:"#0F172A",border:"1px solid #1E293B",borderRadius:8,padding:"9px 12px 9px 34px",color:"#F1F5F9",fontSize:13,boxSizing:"border-box"}}/>
        </div>
        {[{value:framework,setter:setFramework,options:FRAMEWORKS},{value:status,setter:setStatus,options:STATUSES},{value:category,setter:setCategory,options:CATEGORIES}].map((f,i)=>(
          <select key={i} value={f.value} onChange={e=>f.setter(e.target.value)}
            style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:8,padding:"9px 14px",color:"#94A3B8",fontSize:13,cursor:"pointer"}}>
            {f.options.map(o=><option key={o}>{o}</option>)}
          </select>
        ))}
      </div>

      {loading?(<div style={{textAlign:"center",padding:60,color:"#475569"}}><RefreshCw size={20} style={{animation:"spin 1s linear infinite"}}/><div style={{marginTop:8,fontSize:13}}>Loading evidence…</div></div>):(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(320px,1fr))",gap:16}}>
          {evidence.map(e=>{
            const sc=STATUS_CFG[e.status]||STATUS_CFG.PENDING_REVIEW;
            const cc=CATEGORY_CFG[e.category]||CATEGORY_CFG.Other;
            const CatIcon=cc.icon; const StatusIcon=sc.icon;
            const expDays=daysUntil(e.expires_at);
            const ftColor=FILE_TYPE_COLORS[e.file_type]||"#94A3B8";
            return(
              <div key={e.id} style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:14,padding:18,transition:"border-color .2s"}}
                onMouseEnter={ev=>ev.currentTarget.style.borderColor="#334155"}
                onMouseLeave={ev=>ev.currentTarget.style.borderColor="#1E293B"}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{background:`${cc.color}18`,borderRadius:8,padding:7}}><CatIcon size={15} color={cc.color}/></div>
                    <div>
                      <div style={{color:"#E2E8F0",fontSize:13,fontWeight:600,lineHeight:1.3}}>{e.name}</div>
                      <div style={{color:"#475569",fontSize:11,marginTop:2}}>{e.category}</div>
                    </div>
                  </div>
                  <span style={{background:sc.bg,color:sc.color,borderRadius:6,padding:"3px 8px",fontSize:11,fontWeight:600,display:"flex",alignItems:"center",gap:4,whiteSpace:"nowrap"}}>
                    <StatusIcon size={10}/> {sc.label}
                  </span>
                </div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
                  <Tag color="#3B82F6">{e.framework}</Tag>
                  {e.control_id&&<Tag color="#6366F1">{e.control_id}</Tag>}
                  {e.file_type&&<Tag color={ftColor}>.{e.file_type} · {formatSize(e.file_size_kb)}</Tag>}
                </div>
                {e.control_name&&<div style={{color:"#475569",fontSize:12,marginBottom:10}}><Shield size={10} style={{marginRight:4,verticalAlign:"middle"}}/>{e.control_name}</div>}
                {e.description&&<div style={{color:"#64748B",fontSize:12,marginBottom:12,lineHeight:1.5,borderLeft:"2px solid #1E293B",paddingLeft:10}}>{e.description}</div>}
                {expDays!==null&&<div style={{fontSize:11,color:expDays<30?"#F87171":"#475569",marginBottom:10}}>{expDays<0?`⚠ Expired ${Math.abs(expDays)} days ago`:expDays<30?`⚠ Expires in ${expDays} days`:`✓ Valid for ${expDays} days`}</div>}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",borderTop:"1px solid #1E293B",paddingTop:12,marginTop:4}}>
                  <div style={{color:"#475569",fontSize:11}}>By {e.uploaded_by}{e.reviewed_by&&<span style={{color:"#334155"}}> · ✓ {e.reviewed_by}</span>}</div>
                  <div style={{display:"flex",gap:6}}>
                    {e.status==="PENDING_REVIEW"&&<><IconBtn color="#34D399" onClick={()=>updateStatus(e.id,"APPROVED")} title="Approve"><CheckCircle size={13}/></IconBtn><IconBtn color="#F87171" onClick={()=>updateStatus(e.id,"REJECTED")} title="Reject"><XCircle size={13}/></IconBtn></>}
                    <IconBtn color="#F87171" onClick={()=>deleteEvidence(e.id)} title="Delete"><Trash2 size={13}/></IconBtn>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading&&evidence.length===0&&<div style={{textAlign:"center",padding:60,color:"#475569"}}><FileCheck size={40} style={{opacity:.3,marginBottom:12}}/><div style={{fontSize:14}}>No evidence found. Upload your first piece of evidence.</div></div>}

      {showUpload&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>e.target===e.currentTarget&&setShowUpload(false)}>
          <div style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:16,padding:28,width:480,maxHeight:"90vh",overflowY:"auto"}}>
            <h3 style={{margin:"0 0 20px",color:"#F1F5F9",fontSize:17}}>Upload Evidence</h3>
            {[{label:"Evidence Name *",key:"name"},{label:"Control ID",key:"control_id"},{label:"Control Name",key:"control_name"}].map(f=>(
              <label key={f.key} style={{display:"block",marginBottom:14}}>
                <div style={{color:"#64748B",fontSize:12,marginBottom:5}}>{f.label}</div>
                <input value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})}
                  style={{width:"100%",background:"#1E293B",border:"1px solid #334155",borderRadius:8,padding:"9px 12px",color:"#F1F5F9",fontSize:13,boxSizing:"border-box"}}/>
              </label>
            ))}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
              {[{label:"Framework",key:"framework",options:FRAMEWORKS.slice(1)},{label:"Category",key:"category",options:CATEGORIES.slice(1)}].map(f=>(
                <label key={f.key}>
                  <div style={{color:"#64748B",fontSize:12,marginBottom:5}}>{f.label}</div>
                  <select value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})}
                    style={{width:"100%",background:"#1E293B",border:"1px solid #334155",borderRadius:8,padding:"9px 12px",color:"#F1F5F9",fontSize:13}}>
                    {f.options.map(o=><option key={o}>{o}</option>)}
                  </select>
                </label>
              ))}
            </div>
            <label style={{display:"block",marginBottom:14}}>
              <div style={{color:"#64748B",fontSize:12,marginBottom:5}}>Description</div>
              <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={3}
                style={{width:"100%",background:"#1E293B",border:"1px solid #334155",borderRadius:8,padding:"9px 12px",color:"#F1F5F9",fontSize:13,resize:"vertical",boxSizing:"border-box"}}/>
            </label>
            <label style={{display:"block",marginBottom:20}}>
              <div style={{color:"#64748B",fontSize:12,marginBottom:5}}>File (optional)</div>
              <input ref={fileRef} type="file" style={{color:"#94A3B8",fontSize:13}}/>
            </label>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button onClick={()=>setShowUpload(false)} style={btn("#1E293B","#334155")}>Cancel</button>
              <button onClick={handleUpload} disabled={uploading} style={btn("#14532D","#16A34A")}>{uploading?"Uploading…":<><Upload size={14}/> Upload</>}</button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

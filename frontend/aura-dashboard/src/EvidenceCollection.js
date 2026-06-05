import { useState, useEffect, useCallback, useRef } from "react";
import { FileCheck, Upload, Search, RefreshCw, CheckCircle, XCircle, Clock, AlertCircle, FileText, Plus, Send, Bell, Users, AlertTriangle } from "lucide-react";
const API = "https://web-production-320c3.up.railway.app";

const STATUS_CFG = {
  APPROVED:       {c:"#10b981", bg:"rgba(16,185,129,0.1)",  l:"Approved",       i:<CheckCircle size={11}/>},
  PENDING_REVIEW: {c:"#f59e0b", bg:"rgba(245,158,11,0.1)",  l:"Pending Review", i:<Clock size={11}/>},
  REJECTED:       {c:"#ef4444", bg:"rgba(239,68,68,0.1)",   l:"Rejected",       i:<XCircle size={11}/>},
  EXPIRED:        {c:"#94a3b8", bg:"rgba(148,163,184,0.1)", l:"Expired",        i:<AlertCircle size={11}/>},
  REQUESTED:      {c:"#8b5cf6", bg:"rgba(139,92,246,0.1)",  l:"Requested",      i:<Send size={11}/>},
};
const FW_COLOR = {SOC2:"#3b82f6",ISO27001:"#8b5cf6",RBI:"#f97316",DPDP:"#10b981"};
const TEAM_MEMBERS = ["CISO","DevOps Lead","Security Engineer","Compliance Manager","IT Admin","Legal Counsel","DPO"];

const sty = {
  hdr:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24},
  h2:{fontSize:20,fontWeight:800,color:"#e2e8f0",display:"flex",alignItems:"center",gap:10,margin:0},
  sub:{color:"#475569",fontSize:13,marginTop:4},
  btnPrimary:{display:"flex",alignItems:"center",gap:6,padding:"8px 18px",background:"linear-gradient(135deg,#7c3aed,#6d28d9)",border:"none",borderRadius:9,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"},
  btnGhost:{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",background:"rgba(139,92,246,0.08)",border:"1px solid rgba(139,92,246,0.2)",borderRadius:9,color:"#a78bfa",fontSize:13,fontWeight:600,cursor:"pointer"},
  btnSuccess:{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:8,color:"#10b981",fontSize:12,cursor:"pointer"},
  card:{background:"#111827",border:"1px solid rgba(139,92,246,0.08)",borderRadius:12,padding:"18px 20px",marginBottom:8},
  modal:{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(4px)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20},
  modalBox:{background:"#111827",border:"1px solid rgba(139,92,246,0.2)",borderRadius:16,padding:28,width:"100%",maxWidth:500,maxHeight:"90vh",overflowY:"auto"},
  inp:{width:"100%",background:"#1a2235",border:"1px solid rgba(139,92,246,0.15)",borderRadius:8,padding:"9px 12px",color:"#e2e8f0",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"},
  lbl:{display:"block",fontSize:10,fontWeight:700,color:"#94a3b8",marginBottom:5,textTransform:"uppercase",letterSpacing:".5px"},
  field:{marginBottom:14},
};

// Demo evidence requests generated from failed checks
const DEMO_REQUESTS = [
  {id:"req_001",control_id:"CC7.1",control_name:"System Monitoring",framework:"SOC2",description:"Upload CloudWatch dashboard screenshots showing alerts configured for Q3 2025",assigned_to:"DevOps Lead",deadline:"2025-06-30",status:"REQUESTED",priority:"HIGH",created_at:new Date(Date.now()-3*86400000).toISOString()},
  {id:"req_002",control_id:"CC6.1",control_name:"MFA Enforcement",framework:"SOC2",description:"Export Okta MFA enrollment report showing 100% coverage",assigned_to:"IT Admin",deadline:"2025-06-25",status:"PENDING_REVIEW",priority:"CRITICAL",created_at:new Date(Date.now()-5*86400000).toISOString()},
  {id:"req_003",control_id:"Section 6",control_name:"Consent Management",framework:"DPDP",description:"Screenshot of consent checkbox implementation on signup and data collection forms",assigned_to:"DPO",deadline:"2025-07-15",status:"REQUESTED",priority:"CRITICAL",created_at:new Date(Date.now()-1*86400000).toISOString()},
  {id:"req_004",control_id:"A.8.8",control_name:"Patch Management",framework:"ISO27001",description:"Export patch compliance report from Intune/JAMF showing 95%+ compliance",assigned_to:"DevOps Lead",deadline:"2025-06-28",status:"REQUESTED",priority:"HIGH",created_at:new Date(Date.now()-2*86400000).toISOString()},
  {id:"req_005",control_id:"Cyber-Security.3.1",control_name:"VAPT Report",framework:"RBI",description:"Upload latest VAPT report from CERT-In empanelled auditor",assigned_to:"CISO",deadline:"2025-07-01",status:"PENDING_REVIEW",priority:"HIGH",created_at:new Date(Date.now()-7*86400000).toISOString()},
];

const DEMO_EVIDENCE = [
  {id:"ev_001",name:"MFA Enrollment Report - May 2025",framework:"SOC2",control_id:"CC6.1",control_name:"MFA Enforcement",category:"Report",status:"APPROVED",file_type:"pdf",size_kb:245,uploaded_by:"IT Admin",approved_by:"CISO",uploaded_at:new Date(Date.now()-10*86400000).toISOString(),expires_at:new Date(Date.now()+355*86400000).toISOString()},
  {id:"ev_002",name:"CloudWatch Dashboard Screenshot",framework:"SOC2",control_id:"CC7.1",control_name:"System Monitoring",category:"Screenshot",status:"PENDING_REVIEW",file_type:"png",size_kb:890,uploaded_by:"DevOps Lead",uploaded_at:new Date(Date.now()-2*86400000).toISOString(),expires_at:new Date(Date.now()+363*86400000).toISOString()},
  {id:"ev_003",name:"ISO 27001 Risk Assessment 2025",framework:"ISO27001",control_id:"A.5.9",control_name:"Risk Assessment",category:"Report",status:"APPROVED",file_type:"docx",size_kb:1240,uploaded_by:"CISO",approved_by:"Board",uploaded_at:new Date(Date.now()-30*86400000).toISOString(),expires_at:new Date(Date.now()+335*86400000).toISOString()},
  {id:"ev_004",name:"Penetration Test Report Q1 2025",framework:"SOC2",control_id:"CC7.2",control_name:"Vulnerability Management",category:"Report",status:"APPROVED",file_type:"pdf",size_kb:3200,uploaded_by:"Security Engineer",approved_by:"CISO",uploaded_at:new Date(Date.now()-45*86400000).toISOString(),expires_at:new Date(Date.now()+12*86400000).toISOString()},
  {id:"ev_005",name:"DPDP Consent Implementation Screenshot",framework:"DPDP",control_id:"Section 6",control_name:"Consent Management",category:"Screenshot",status:"REJECTED",file_type:"png",size_kb:450,uploaded_by:"DPO",uploaded_at:new Date(Date.now()-5*86400000).toISOString(),expires_at:null,rejection_reason:"Screenshot too small — please upload full-page capture showing consent checkbox and privacy notice"},
];

export default function EvidenceCollection({token, tenantId}) {
  const [evidence, setEvidence] = useState(DEMO_EVIDENCE);
  const [requests, setRequests] = useState(DEMO_REQUESTS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterFw, setFilterFw] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [tab, setTab] = useState("evidence");
  const [showUpload, setShowUpload] = useState(false);
  const [showRequest, setShowRequest] = useState(false);
  const [form, setForm] = useState({name:"",framework:"SOC2",control_id:"",control_name:"",category:"Report",description:""});
  const [reqForm, setReqForm] = useState({control_id:"",control_name:"",framework:"SOC2",description:"",assigned_to:"CISO",deadline:"",priority:"HIGH"});
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async()=>{
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/evidence?tenant_id=${tenantId||"demo"}`,{headers:{Authorization:`Bearer ${token}`}});
      if(res.ok){const d=await res.json();if(d.evidence?.length>0)setEvidence(d.evidence);}
    } catch{}
    setLoading(false);
  },[token,tenantId]);

  useEffect(()=>{load();},[load]);

  const uploadEvidence = async()=>{
    setUploading(true);
    const newEv = {
      id:`ev_${Date.now()}`, ...form,
      status:"PENDING_REVIEW", file_type:"pdf", size_kb:Math.floor(Math.random()*2000+100),
      uploaded_by:"Current User", uploaded_at:new Date().toISOString(),
      expires_at:new Date(Date.now()+365*86400000).toISOString(),
    };
    setEvidence(prev=>[newEv,...prev]);
    setShowUpload(false);
    setForm({name:"",framework:"SOC2",control_id:"",control_name:"",category:"Report",description:""});
    setUploading(false);
  };

  const createRequest = ()=>{
    const newReq = {
      id:`req_${Date.now()}`, ...reqForm,
      status:"REQUESTED", created_at:new Date().toISOString(),
    };
    setRequests(prev=>[newReq,...prev]);
    setShowRequest(false);
    setReqForm({control_id:"",control_name:"",framework:"SOC2",description:"",assigned_to:"CISO",deadline:"",priority:"HIGH"});
    alert(`Evidence request sent to ${reqForm.assigned_to}!`);
  };

  const approveEvidence = (id)=>{
    setEvidence(prev=>prev.map(e=>e.id===id?{...e,status:"APPROVED",approved_by:"CISO"}:e));
  };

  const fulfillRequest = (id)=>{
    setRequests(prev=>prev.map(r=>r.id===id?{...r,status:"PENDING_REVIEW"}:r));
    setShowUpload(true);
  };

  const filteredEv = evidence.filter(e=>
    (filterFw==="All"||e.framework===filterFw) &&
    (filterStatus==="All"||e.status===filterStatus) &&
    (search===""||e.name.toLowerCase().includes(search.toLowerCase())||e.control_id.toLowerCase().includes(search.toLowerCase()))
  );
  const pendingRequests = requests.filter(r=>r.status==="REQUESTED").length;
  const expiringSoon = evidence.filter(e=>e.expires_at&&new Date(e.expires_at)-Date.now()<30*86400000&&e.status==="APPROVED").length;

  return(
    <div>
      <div style={sty.hdr}>
        <div>
          <h2 style={sty.h2}><FileCheck size={20} color="#8b5cf6"/>Evidence Collection</h2>
          <p style={sty.sub}>Upload, manage, and track compliance evidence linked to controls</p>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>setShowRequest(true)} style={sty.btnGhost}><Send size={13}/>Request Evidence</button>
          <button onClick={()=>setShowUpload(true)} style={sty.btnPrimary}><Upload size={13}/>Upload Evidence</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:20}}>
        {[
          {l:"Total Evidence",v:evidence.length,c:"#8b5cf6"},
          {l:"Approved",v:evidence.filter(e=>e.status==="APPROVED").length,c:"#10b981"},
          {l:"Pending Review",v:evidence.filter(e=>e.status==="PENDING_REVIEW").length,c:"#f59e0b"},
          {l:"Expiring Soon",v:expiringSoon,c:"#ef4444"},
          {l:"Evidence Requests",v:pendingRequests,c:"#f97316"},
        ].map(st=>(
          <div key={st.l} style={{background:"#111827",border:"1px solid rgba(139,92,246,0.08)",borderRadius:12,padding:"16px 18px",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:st.c}}/>
            <div style={{fontSize:22,fontWeight:800,color:st.c}}>{st.v}</div>
            <div style={{fontSize:11,color:"#475569",textTransform:"uppercase",letterSpacing:".5px",marginTop:2}}>{st.l}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:6,marginBottom:16}}>
        {[["evidence",`📁 Evidence (${evidence.length})`],["requests",`📨 Requests (${pendingRequests} pending)`],["expiring","⏰ Expiring Soon"]].map(([id,lbl])=>(
          <button key={id} onClick={()=>setTab(id)} style={{padding:"8px 18px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",border:"1px solid",borderColor:tab===id?"rgba(139,92,246,0.35)":"rgba(139,92,246,0.1)",background:tab===id?"rgba(139,92,246,0.12)":"transparent",color:tab===id?"#a78bfa":"#475569"}}>{lbl}</button>
        ))}
      </div>

      {/* Evidence tab */}
      {tab==="evidence"&&(
        <div>
          <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(139,92,246,0.1)",borderRadius:9,padding:"0 12px",height:36,flex:1,minWidth:200}}>
              <Search size={13} color="#475569"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search evidence…" style={{background:"none",border:"none",outline:"none",fontSize:13,color:"#e2e8f0",width:"100%",fontFamily:"inherit"}}/>
            </div>
            {[["All","SOC2","ISO27001","RBI","DPDP"],["All","APPROVED","PENDING_REVIEW","REJECTED","EXPIRED"]].map((opts,oi)=>(
              <select key={oi} value={oi===0?filterFw:filterStatus} onChange={e=>oi===0?setFilterFw(e.target.value):setFilterStatus(e.target.value)} style={{background:"#111827",border:"1px solid rgba(139,92,246,0.15)",borderRadius:8,padding:"6px 12px",color:"#94a3b8",fontSize:13,outline:"none"}}>
                {opts.map(o=><option key={o}>{o}</option>)}
              </select>
            ))}
          </div>
          {filteredEv.map(e=>{
            const sc=STATUS_CFG[e.status]||STATUS_CFG.PENDING_REVIEW;
            const fwc=FW_COLOR[e.framework]||"#8b5cf6";
            const daysLeft=e.expires_at?Math.ceil((new Date(e.expires_at)-Date.now())/86400000):null;
            return(
              <div key={e.id} style={sty.card}>
                <div style={{display:"flex",alignItems:"flex-start",gap:14}}>
                  <div style={{width:40,height:40,borderRadius:10,background:"rgba(139,92,246,0.1)",border:"1px solid rgba(139,92,246,0.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <FileText size={18} color="#8b5cf6"/>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
                      <span style={{fontSize:14,fontWeight:600,color:"#e2e8f0"}}>{e.name}</span>
                      <span style={{background:sc.bg,color:sc.c,borderRadius:100,padding:"2px 10px",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",gap:4}}>{sc.i}{sc.l}</span>
                      <span style={{background:`${fwc}20`,color:fwc,borderRadius:100,padding:"2px 8px",fontSize:10,fontWeight:700}}>{e.framework}</span>
                      <span style={{background:"rgba(139,92,246,0.08)",color:"#8b5cf6",borderRadius:4,padding:"1px 6px",fontSize:10,fontFamily:"monospace"}}>{e.control_id}</span>
                    </div>
                    <div style={{fontSize:12,color:"#475569",marginBottom:4}}>
                      {e.category} · {e.file_type?.toUpperCase()} · {e.size_kb>1024?`${(e.size_kb/1024).toFixed(1)}MB`:`${e.size_kb}KB`} · Uploaded by {e.uploaded_by}
                    </div>
                    {e.rejection_reason&&<div style={{fontSize:11,color:"#ef4444",background:"rgba(239,68,68,0.06)",borderRadius:6,padding:"4px 10px",marginTop:4}}>❌ {e.rejection_reason}</div>}
                    {daysLeft!==null&&daysLeft<30&&<div style={{fontSize:11,color:daysLeft<7?"#ef4444":"#f59e0b",marginTop:4}}>⏰ Expires in {daysLeft} days</div>}
                  </div>
                  <div style={{display:"flex",gap:8,flexShrink:0}}>
                    {e.status==="PENDING_REVIEW"&&<button onClick={()=>approveEvidence(e.id)} style={sty.btnSuccess}><CheckCircle size={12}/>Approve</button>}
                    <button style={{...sty.btnGhost,padding:"6px 12px",fontSize:12}}><FileText size={12}/>View</button>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredEv.length===0&&<div style={{...sty.card,textAlign:"center",padding:60,color:"#475569"}}><FileCheck size={32} style={{opacity:.3,margin:"0 auto 12px"}}/><p>No evidence found. Upload evidence or request it from your team.</p></div>}
        </div>
      )}

      {/* Requests tab */}
      {tab==="requests"&&(
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{fontSize:13,color:"#475569"}}>Evidence requests sent to team members — track who needs to upload what</div>
            <button onClick={()=>setShowRequest(true)} style={sty.btnPrimary}><Plus size={13}/>New Request</button>
          </div>
          {requests.map(r=>{
            const priC=r.priority==="CRITICAL"?"#ef4444":r.priority==="HIGH"?"#f97316":"#f59e0b";
            const sc=STATUS_CFG[r.status]||STATUS_CFG.REQUESTED;
            const fwc=FW_COLOR[r.framework]||"#8b5cf6";
            const overdue=r.deadline&&new Date(r.deadline)<new Date();
            return(
              <div key={r.id} style={{...sty.card,borderColor:overdue?"rgba(239,68,68,0.2)":"rgba(139,92,246,0.08)"}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:14}}>
                  <div style={{width:36,height:36,borderRadius:9,background:`${priC}15`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <AlertTriangle size={16} color={priC}/>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
                      <span style={{fontSize:13,fontWeight:700,color:"#e2e8f0"}}>{r.control_id} — {r.control_name}</span>
                      <span style={{background:sc.bg,color:sc.c,borderRadius:100,padding:"2px 10px",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",gap:4}}>{sc.i}{sc.l}</span>
                      <span style={{background:`${fwc}20`,color:fwc,borderRadius:100,padding:"2px 8px",fontSize:10,fontWeight:700}}>{r.framework}</span>
                      <span style={{background:`${priC}15`,color:priC,borderRadius:100,padding:"2px 8px",fontSize:10,fontWeight:700}}>{r.priority}</span>
                    </div>
                    <div style={{fontSize:12,color:"#64748b",marginBottom:6,lineHeight:1.5}}>{r.description}</div>
                    <div style={{display:"flex",gap:16,fontSize:11,color:"#475569"}}>
                      <span style={{display:"flex",alignItems:"center",gap:4}}><Users size={11}/>Assigned to: <strong style={{color:"#e2e8f0"}}>{r.assigned_to}</strong></span>
                      <span style={{display:"flex",alignItems:"center",gap:4,color:overdue?"#ef4444":"#475569"}}><Clock size={11}/>{overdue?"OVERDUE":"Due:"} {r.deadline}</span>
                    </div>
                  </div>
                  {r.status==="REQUESTED"&&(
                    <button onClick={()=>fulfillRequest(r.id)} style={sty.btnPrimary}><Upload size={12}/>Upload Evidence</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Expiring tab */}
      {tab==="expiring"&&(
        <div>
          <div style={{fontSize:13,color:"#475569",marginBottom:14}}>Evidence expiring within 30 days — renew or upload updated versions</div>
          {evidence.filter(e=>e.expires_at&&new Date(e.expires_at)-Date.now()<30*86400000).map(e=>{
            const daysLeft=Math.ceil((new Date(e.expires_at)-Date.now())/86400000);
            const color=daysLeft<7?"#ef4444":daysLeft<14?"#f97316":"#f59e0b";
            return(
              <div key={e.id} style={{...sty.card,borderColor:`${color}30`}}>
                <div style={{display:"flex",alignItems:"center",gap:14}}>
                  <div style={{width:40,height:40,borderRadius:10,background:`${color}15`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <Bell size={18} color={color}/>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:600,color:"#e2e8f0",marginBottom:4}}>{e.name}</div>
                    <div style={{fontSize:12,color:"#475569"}}>{e.framework} · {e.control_id} · Expires {new Date(e.expires_at).toLocaleDateString("en-IN")}</div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontSize:18,fontWeight:800,color}}>{daysLeft}</div>
                    <div style={{fontSize:10,color:"#475569"}}>days left</div>
                  </div>
                  <button onClick={()=>setShowUpload(true)} style={sty.btnGhost}><RefreshCw size={12}/>Renew</button>
                </div>
              </div>
            );
          })}
          {expiringSoon===0&&<div style={{...sty.card,textAlign:"center",padding:60,color:"#475569"}}><CheckCircle size={32} style={{opacity:.3,margin:"0 auto 12px"}}/><p>No evidence expiring soon.</p></div>}
        </div>
      )}

      {/* Upload modal */}
      {showUpload&&(
        <div style={sty.modal} onClick={e=>e.target===e.currentTarget&&setShowUpload(false)}>
          <div style={sty.modalBox}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h3 style={{margin:0,color:"#e2e8f0",fontSize:16,fontWeight:700}}>Upload Evidence</h3>
              <button onClick={()=>setShowUpload(false)} style={{background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:18}}>✕</button>
            </div>
            <div style={{border:"2px dashed rgba(139,92,246,0.3)",borderRadius:10,padding:"24px",textAlign:"center",marginBottom:16,cursor:"pointer"}} onClick={()=>fileRef.current?.click()}>
              <Upload size={28} color="#8b5cf6" style={{margin:"0 auto 8px"}}/>
              <div style={{fontSize:13,color:"#e2e8f0",fontWeight:600}}>Click to upload or drag & drop</div>
              <div style={{fontSize:11,color:"#475569",marginTop:4}}>PDF, PNG, DOCX, XLSX up to 50MB</div>
              <input ref={fileRef} type="file" style={{display:"none"}}/>
            </div>
            {[["Evidence Name","text","name","e.g. MFA Enrollment Report May 2025"],["Control ID","text","control_id","e.g. CC6.1"],["Control Name","text","control_name","e.g. MFA Enforcement"],["Description","text","description","What does this evidence prove?"]].map(([l,t,k,ph])=>(
              <div key={k} style={sty.field}>
                <label style={sty.lbl}>{l}</label>
                <input type={t} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} placeholder={ph} style={sty.inp}/>
              </div>
            ))}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
              <div><label style={sty.lbl}>Framework</label>
                <select value={form.framework} onChange={e=>setForm(f=>({...f,framework:e.target.value}))} style={sty.inp}>
                  {["SOC2","ISO27001","RBI","DPDP"].map(fw=><option key={fw}>{fw}</option>)}
                </select>
              </div>
              <div><label style={sty.lbl}>Category</label>
                <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} style={sty.inp}>
                  {["Report","Screenshot","Policy","Config","Certificate","Other"].map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button onClick={()=>setShowUpload(false)} style={{...sty.btnGhost,color:"#475569"}}>Cancel</button>
              <button onClick={uploadEvidence} disabled={uploading} style={sty.btnPrimary}>{uploading?"Uploading…":"Upload Evidence"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Request Evidence modal */}
      {showRequest&&(
        <div style={sty.modal} onClick={e=>e.target===e.currentTarget&&setShowRequest(false)}>
          <div style={sty.modalBox}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h3 style={{margin:0,color:"#e2e8f0",fontSize:16,fontWeight:700}}>Request Evidence from Team</h3>
              <button onClick={()=>setShowRequest(false)} style={{background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:18}}>✕</button>
            </div>
            <div style={{background:"rgba(139,92,246,0.06)",border:"1px solid rgba(139,92,246,0.15)",borderRadius:10,padding:"10px 14px",fontSize:12,color:"#a78bfa",marginBottom:16}}>
              The assigned team member will be notified to upload the required evidence.
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {[["Control ID","text","control_id","e.g. CC7.1"],["Control Name","text","control_name","e.g. System Monitoring"]].map(([l,t,k,ph])=>(
                <div key={k} style={sty.field}>
                  <label style={sty.lbl}>{l}</label>
                  <input type={t} value={reqForm[k]} onChange={e=>setReqForm(f=>({...f,[k]:e.target.value}))} placeholder={ph} style={sty.inp}/>
                </div>
              ))}
            </div>
            <div style={sty.field}>
              <label style={sty.lbl}>Evidence Required</label>
              <textarea value={reqForm.description} onChange={e=>setReqForm(f=>({...f,description:e.target.value}))} placeholder="Describe exactly what evidence is needed and why…" rows={3} style={{...sty.inp,resize:"vertical"}}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:16}}>
              <div><label style={sty.lbl}>Framework</label>
                <select value={reqForm.framework} onChange={e=>setReqForm(f=>({...f,framework:e.target.value}))} style={sty.inp}>
                  {["SOC2","ISO27001","RBI","DPDP"].map(fw=><option key={fw}>{fw}</option>)}
                </select>
              </div>
              <div><label style={sty.lbl}>Assign To</label>
                <select value={reqForm.assigned_to} onChange={e=>setReqForm(f=>({...f,assigned_to:e.target.value}))} style={sty.inp}>
                  {TEAM_MEMBERS.map(m=><option key={m}>{m}</option>)}
                </select>
              </div>
              <div><label style={sty.lbl}>Priority</label>
                <select value={reqForm.priority} onChange={e=>setReqForm(f=>({...f,priority:e.target.value}))} style={sty.inp}>
                  {["CRITICAL","HIGH","MEDIUM","LOW"].map(p=><option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div style={sty.field}>
              <label style={sty.lbl}>Deadline</label>
              <input type="date" value={reqForm.deadline} onChange={e=>setReqForm(f=>({...f,deadline:e.target.value}))} style={sty.inp}/>
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button onClick={()=>setShowRequest(false)} style={{...sty.btnGhost,color:"#475569"}}>Cancel</button>
              <button onClick={createRequest} style={sty.btnPrimary}><Send size={13}/>Send Request</button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

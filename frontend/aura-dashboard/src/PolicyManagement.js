import { useState, useEffect, useCallback } from "react";
import { FileText, Plus, RefreshCw, X, CheckCircle, Clock, AlertCircle, Search, Download, BookOpen } from "lucide-react";
const API = "http://localhost:8000";

const STATUS_CFG = {
  DRAFT:        {c:"#94a3b8",bg:"rgba(148,163,184,0.1)",l:"Draft",       i:<Clock size={12}/>},
  UNDER_REVIEW: {c:"#f59e0b",bg:"rgba(245,158,11,0.1)", l:"Under Review",i:<Clock size={12}/>},
  APPROVED:     {c:"#10b981",bg:"rgba(16,185,129,0.1)", l:"Approved",    i:<CheckCircle size={12}/>},
  EXPIRED:      {c:"#ef4444",bg:"rgba(239,68,68,0.1)",  l:"Expired",     i:<AlertCircle size={12}/>},
};

// 40+ Policy Templates
const POLICY_TEMPLATES = [
  // Security
  {id:"t1", name:"Information Security Policy",       category:"Security",   frameworks:["ISO27001","SOC2"],      desc:"Master policy covering all information security controls and responsibilities",          pages:8},
  {id:"t2", name:"Access Control Policy",             category:"Security",   frameworks:["ISO27001","SOC2"],      desc:"Rules governing who can access systems, data and facilities",                           pages:5},
  {id:"t3", name:"Password Policy",                   category:"Security",   frameworks:["ISO27001","SOC2"],      desc:"Password complexity, rotation, and management requirements",                            pages:3},
  {id:"t4", name:"Encryption Policy",                 category:"Security",   frameworks:["ISO27001","SOC2","PCI"],desc:"Standards for encrypting data at rest and in transit",                                  pages:4},
  {id:"t5", name:"Network Security Policy",           category:"Security",   frameworks:["ISO27001","RBI"],       desc:"Firewall rules, network segmentation, and monitoring requirements",                     pages:6},
  {id:"t6", name:"Vulnerability Management Policy",   category:"Security",   frameworks:["ISO27001","SOC2","RBI"],desc:"Processes for identifying, assessing, and remediating vulnerabilities",                 pages:5},
  {id:"t7", name:"Patch Management Policy",           category:"Security",   frameworks:["ISO27001","SOC2"],      desc:"Timelines and procedures for applying security patches",                                pages:4},
  {id:"t8", name:"Endpoint Security Policy",          category:"Security",   frameworks:["ISO27001","SOC2"],      desc:"Requirements for securing laptops, mobiles, and workstations",                          pages:4},
  {id:"t9", name:"Cloud Security Policy",             category:"Security",   frameworks:["ISO27001","SOC2","RBI"],desc:"Security controls for cloud infrastructure and services",                               pages:6},
  {id:"t10",name:"Penetration Testing Policy",        category:"Security",   frameworks:["ISO27001","RBI","PCI"], desc:"Frequency, scope, and reporting requirements for penetration tests",                    pages:3},
  // Privacy
  {id:"t11",name:"Privacy Policy (DPDP Act 2023)",    category:"Privacy",    frameworks:["DPDP"],                 desc:"India-specific privacy policy compliant with DPDP Act 2023 — public facing",              pages:7},
  {id:"t12",name:"Data Protection Policy",            category:"Privacy",    frameworks:["DPDP","ISO27001"],      desc:"Internal policy for handling personal data and sensitive information",                   pages:6},
  {id:"t13",name:"Data Retention & Deletion Policy",  category:"Privacy",    frameworks:["DPDP","ISO27001"],      desc:"How long data is kept and how it is securely deleted",                                  pages:4},
  {id:"t14",name:"Consent Management Policy",         category:"Privacy",    frameworks:["DPDP"],                 desc:"Procedures for obtaining, recording, and withdrawing user consent",                      pages:4},
  {id:"t15",name:"Data Subject Rights Policy",        category:"Privacy",    frameworks:["DPDP"],                 desc:"Handling access, correction, erasure, and portability requests",                        pages:5},
  {id:"t16",name:"Cross-Border Data Transfer Policy", category:"Privacy",    frameworks:["DPDP","ISO27001"],      desc:"Rules for transferring personal data outside India",                                    pages:3},
  {id:"t17",name:"Cookie Policy",                     category:"Privacy",    frameworks:["DPDP"],                 desc:"Disclosure of cookies and tracking technologies used on websites",                      pages:3},
  {id:"t18",name:"Data Breach Response Policy",       category:"Privacy",    frameworks:["DPDP","ISO27001","RBI"],desc:"Steps to detect, report, and respond to personal data breaches",                       pages:5},
  // Operations
  {id:"t19",name:"Incident Response Policy",          category:"Operations", frameworks:["ISO27001","SOC2","RBI"],desc:"Procedures for detecting, reporting, and managing security incidents",                  pages:7},
  {id:"t20",name:"Business Continuity Policy",        category:"Operations", frameworks:["ISO27001","SOC2","RBI"],desc:"Plans to maintain operations during and after disruptions",                             pages:8},
  {id:"t21",name:"Disaster Recovery Policy",          category:"Operations", frameworks:["ISO27001","SOC2","RBI"],desc:"Technical procedures for recovering systems after a disaster",                          pages:6},
  {id:"t22",name:"Change Management Policy",          category:"Operations", frameworks:["ISO27001","SOC2"],      desc:"Controls for managing changes to systems and infrastructure",                            pages:5},
  {id:"t23",name:"Backup Policy",                     category:"Operations", frameworks:["ISO27001","SOC2"],      desc:"Frequency, retention, and testing of data backups",                                    pages:3},
  {id:"t24",name:"Asset Management Policy",           category:"Operations", frameworks:["ISO27001"],             desc:"Inventory, classification, and disposal of information assets",                         pages:4},
  {id:"t25",name:"Physical Security Policy",          category:"Operations", frameworks:["ISO27001","SOC2"],      desc:"Controls for physical access to offices and data centers",                              pages:4},
  {id:"t26",name:"Logging & Monitoring Policy",       category:"Operations", frameworks:["ISO27001","SOC2","RBI"],desc:"Requirements for audit logging, monitoring, and log retention",                        pages:4},
  // HR
  {id:"t27",name:"Acceptable Use Policy",             category:"HR",         frameworks:["ISO27001","SOC2"],      desc:"Rules for acceptable use of company IT systems and data",                               pages:4},
  {id:"t28",name:"Security Awareness Training Policy",category:"HR",         frameworks:["ISO27001","SOC2"],      desc:"Requirements for employee security training and awareness",                              pages:3},
  {id:"t29",name:"Clean Desk Policy",                 category:"HR",         frameworks:["ISO27001"],             desc:"Requirements for securing physical workspaces and documents",                           pages:2},
  {id:"t30",name:"BYOD Policy",                       category:"HR",         frameworks:["ISO27001","SOC2"],      desc:"Rules for using personal devices for work purposes",                                   pages:4},
  {id:"t31",name:"Remote Work Security Policy",       category:"HR",         frameworks:["ISO27001","SOC2"],      desc:"Security requirements for employees working from home",                                 pages:4},
  {id:"t32",name:"Disciplinary Policy (Security)",    category:"HR",         frameworks:["ISO27001"],             desc:"Consequences for violating information security policies",                              pages:3},
  // Legal & Compliance
  {id:"t33",name:"RBI Cybersecurity Framework Policy",category:"Compliance", frameworks:["RBI"],                  desc:"Policy aligning with RBI Cybersecurity Framework for banks/NBFCs",                      pages:10},
  {id:"t34",name:"Vendor/Third-Party Security Policy",category:"Compliance", frameworks:["ISO27001","SOC2"],      desc:"Security requirements for vendors and third-party service providers",                   pages:5},
  {id:"t35",name:"Software Development Security Policy",category:"Compliance",frameworks:["ISO27001","SOC2"],     desc:"Secure coding standards and SSDLC requirements",                                       pages:6},
  {id:"t36",name:"Cryptography Policy",               category:"Compliance", frameworks:["ISO27001","PCI"],       desc:"Approved cryptographic algorithms and key management",                                  pages:4},
  {id:"t37",name:"Supplier Security Policy",          category:"Compliance", frameworks:["ISO27001"],             desc:"Security assessment and monitoring of suppliers and partners",                          pages:4},
  {id:"t38",name:"Risk Management Policy",            category:"Compliance", frameworks:["ISO27001","SOC2"],      desc:"Framework for identifying, assessing, and treating information security risks",           pages:6},
  {id:"t39",name:"Audit & Review Policy",             category:"Compliance", frameworks:["ISO27001","SOC2"],      desc:"Schedule and procedures for internal and external security audits",                      pages:3},
  {id:"t40",name:"CERT-In Incident Reporting Policy", category:"Compliance", frameworks:["RBI","DPDP"],           desc:"Procedures for reporting incidents to CERT-In within 6 hours as mandated",               pages:3},
];

const FW_COLORS = {ISO27001:"#8b5cf6",SOC2:"#3b82f6",RBI:"#f97316",DPDP:"#10b981",PCI:"#06b6d4"};
const CATS = ["All","Security","Privacy","Operations","HR","Compliance"];
const EMPTY = {name:"",category:"Security",owner:"CISO",version:"1.0",description:"",review_period_days:365,frameworks:[]};

const sty = {
  hdr:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24},
  h2:{fontSize:20,fontWeight:800,color:"#e2e8f0",display:"flex",alignItems:"center",gap:10,margin:0},
  sub:{color:"#475569",fontSize:13,marginTop:4},
  btnGhost:{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",background:"rgba(139,92,246,0.08)",border:"1px solid rgba(139,92,246,0.2)",borderRadius:9,color:"#a78bfa",fontSize:13,fontWeight:600,cursor:"pointer"},
  btnPrimary:{display:"flex",alignItems:"center",gap:6,padding:"8px 18px",background:"linear-gradient(135deg,#7c3aed,#6d28d9)",border:"none",borderRadius:9,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"},
  btnSuccess:{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:8,color:"#10b981",fontSize:12,fontWeight:600,cursor:"pointer"},
  card:{background:"#111827",border:"1px solid rgba(139,92,246,0.08)",borderRadius:12,padding:"18px 20px",marginBottom:8},
  modal:{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(4px)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20},
  modalBox:{background:"#111827",border:"1px solid rgba(139,92,246,0.2)",borderRadius:16,padding:28,width:"100%",maxWidth:520,maxHeight:"92vh",overflowY:"auto"},
  inp:{width:"100%",background:"#1a2235",border:"1px solid rgba(139,92,246,0.15)",borderRadius:8,padding:"9px 12px",color:"#e2e8f0",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"},
  lbl:{display:"block",fontSize:10,fontWeight:700,color:"#94a3b8",marginBottom:5,textTransform:"uppercase",letterSpacing:".5px"},
};

function downloadPolicyDoc(template, orgName) {
  const w = window.open("","_blank");
  if(!w) return alert("Allow popups to download policy documents.");
  const fwBadges = template.frameworks.map(f=>`<span style="background:${FW_COLORS[f]||"#8b5cf6"}20;color:${FW_COLORS[f]||"#8b5cf6"};border-radius:4px;padding:2px 8px;font-size:11px;font-weight:700;margin-right:4px">${f}</span>`).join("");
  const today = new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"});
  const sections = {
    "1. Purpose": `This ${template.name} establishes the requirements and responsibilities for ${orgName} with respect to ${template.desc.toLowerCase()}. This policy applies to all employees, contractors, consultants, and third parties who access ${orgName} systems and data.`,
    "2. Scope": `This policy applies to all information systems, networks, and data owned or managed by ${orgName}, including cloud-hosted systems, on-premises infrastructure, and third-party services. It covers all personnel with access to ${orgName} information assets.`,
    "3. Policy Statement": `${orgName} is committed to protecting the confidentiality, integrity, and availability of its information assets. All personnel must comply with this policy and report any suspected violations to the Information Security team.`,
    "4. Roles & Responsibilities": `<strong>CISO:</strong> Overall accountability for this policy and annual review.<br><strong>IT/Security Team:</strong> Implementation, monitoring, and enforcement.<br><strong>Department Heads:</strong> Ensuring team compliance.<br><strong>All Employees:</strong> Understanding and adhering to this policy.`,
    "5. Requirements": `Detailed requirements for ${template.name.toLowerCase()} are outlined in the associated procedures and standards documents. Key requirements include regular review cycles (every ${template.pages * 45} days), documented evidence of compliance, and escalation procedures for non-compliance.`,
    "6. Compliance & Enforcement": `Non-compliance with this policy may result in disciplinary action up to and including termination of employment or contract. ${orgName} reserves the right to monitor systems for compliance with this policy.`,
    "7. Review & Updates": `This policy will be reviewed annually or following significant changes to the business or threat landscape. The CISO is responsible for initiating and approving updates.`,
    "8. References": `${template.frameworks.map(f=>`${f} Framework`).join(", ")} | ${orgName} Information Security Management System | Related Procedures and Standards`,
  };
  const sectionsHTML = Object.entries(sections).map(([title,content])=>`
    <div style="margin-bottom:24px">
      <h3 style="color:#1e293b;font-size:15px;font-weight:700;border-left:4px solid #7c3aed;padding-left:12px;margin-bottom:8px">${title}</h3>
      <p style="color:#334155;font-size:13px;line-height:1.7;margin:0">${content}</p>
    </div>`).join("");
  const html = `<!DOCTYPE html><html><head><title>${template.name}</title><style>body{font-family:'Segoe UI',Arial,sans-serif;max-width:800px;margin:0 auto;padding:40px;color:#1e293b}@media print{.no-print{display:none}}</style></head><body>
  <div style="background:linear-gradient(135deg,#0f172a,#1e293b);color:#fff;padding:36px;border-radius:12px;margin-bottom:32px">
    <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">POLICY DOCUMENT</div>
    <h1 style="margin:0 0 8px;font-size:26px">${template.name}</h1>
    <div style="color:#94a3b8;font-size:13px;margin-bottom:12px">${orgName} · Version 1.0 · ${today}</div>
    <div>${fwBadges}</div>
  </div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:28px;font-size:13px">
    <tr><td style="padding:8px 12px;background:#f8fafc;font-weight:600;width:160px">Document Owner</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">Chief Information Security Officer (CISO)</td></tr>
    <tr><td style="padding:8px 12px;background:#f8fafc;font-weight:600">Classification</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">Internal — Confidential</td></tr>
    <tr><td style="padding:8px 12px;background:#f8fafc;font-weight:600">Review Cycle</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">Annual</td></tr>
    <tr><td style="padding:8px 12px;background:#f8fafc;font-weight:600">Frameworks</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">${template.frameworks.join(", ")}</td></tr>
    <tr><td style="padding:8px 12px;background:#f8fafc;font-weight:600">Effective Date</td><td style="padding:8px 12px">${today}</td></tr>
  </table>
  ${sectionsHTML}
  <div style="margin-top:40px;padding-top:20px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:12px;color:#94a3b8">
    <span>${orgName} — ${template.name} v1.0</span><span>Generated by AURA GRC Platform · ${today}</span>
  </div>
  <script>window.onload=()=>{setTimeout(()=>window.print(),500);}</script>
  </body></html>`;
  w.document.write(html);
  w.document.close();
}

export default function PolicyManagement({token, tenantId}) {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("policies");
  const [tmplSearch, setTmplSearch] = useState("");
  const [tmplCat, setTmplCat] = useState("All");

  const load = useCallback(async()=>{
    setLoading(true);
    try{
      const p = new URLSearchParams({tenant_id:tenantId||"demo"});
      if(filterCat!=="All") p.set("category",filterCat);
      if(filterStatus!=="All") p.set("status",filterStatus);
      if(search) p.set("search",search);
      const res = await fetch(`${API}/api/policies?tenant_id=${tenantId||'tenant_533ed68d0977'}&${p}`,{headers:{Authorization:`Bearer ${token}`}});
      const d = await res.json();
      setPolicies(d.policies||[]);
    }catch{setPolicies([]);}
    setLoading(false);
  },[token,tenantId,filterCat,filterStatus,search]);

  useEffect(()=>{load();},[load]);

  const save = async()=>{
    if(!form.name) return alert("Policy name required");
    setSaving(true);
    try{
      await fetch(`${API}/api/policies?tenant_id=${tenantId||"tenant_533ed68d0977"}`,{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify(form)});
      setShowAdd(false);setForm(EMPTY);load();
    }catch{alert("Save failed");}
    setSaving(false);
  };

  const approve = async(id)=>{
    try{await fetch(`${API}/api/policies/${id}/approve`,{method:"PATCH",headers:{Authorization:`Bearer ${token}`}});load();}
    catch{alert("Failed");}
  };

  const applyTemplate = (template) => {
    setForm({
      name: template.name,
      category: template.category,
      owner: "CISO",
      version: "1.0",
      description: template.desc,
      review_period_days: 365,
      frameworks: template.frameworks,
    });
    setShowTemplates(false);
    setShowAdd(true);
  };

  const counts = {
    total:policies.length,
    approved:policies.filter(p=>p.status==="APPROVED").length,
    review:policies.filter(p=>p.status==="UNDER_REVIEW").length,
    expired:policies.filter(p=>p.status==="EXPIRED").length,
  };

  const filteredTemplates = POLICY_TEMPLATES.filter(t=>
    (tmplCat==="All"||t.category===tmplCat) &&
    (tmplSearch===""||t.name.toLowerCase().includes(tmplSearch.toLowerCase())||t.desc.toLowerCase().includes(tmplSearch.toLowerCase()))
  );

  return(
    <div>
      <div style={sty.hdr}>
        <div>
          <h2 style={sty.h2}><FileText size={20} color="#8b5cf6"/>Policy Management</h2>
          <p style={sty.sub}>Create, version, and track approval of all compliance policies · 40+ templates included</p>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={load} style={sty.btnGhost}><RefreshCw size={13}/>Refresh</button>
          <button onClick={()=>setShowTemplates(true)} style={{...sty.btnGhost,color:"#10b981",borderColor:"rgba(16,185,129,0.2)"}}><BookOpen size={13}/>Templates Library</button>
          <button onClick={()=>setShowAdd(true)} style={sty.btnPrimary}><Plus size={13}/>New Policy</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:6,marginBottom:20}}>
        {[["policies",`📋 My Policies (${policies.length})`],["templates",`📚 Templates (${POLICY_TEMPLATES.length})`]].map(([id,lbl])=>(
          <button key={id} onClick={()=>setTab(id)} style={{padding:"8px 18px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",border:"1px solid",borderColor:tab===id?"rgba(139,92,246,0.35)":"rgba(139,92,246,0.1)",background:tab===id?"rgba(139,92,246,0.12)":"transparent",color:tab===id?"#a78bfa":"#475569"}}>{lbl}</button>
        ))}
      </div>

      {tab==="policies"&&(
        <>
          {/* Stats */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
            {[{l:"Total",v:counts.total,c:"#8b5cf6"},{l:"Approved",v:counts.approved,c:"#10b981"},{l:"Under Review",v:counts.review,c:"#f59e0b"},{l:"Expired",v:counts.expired,c:"#ef4444"}].map(st=>(
              <div key={st.l} style={{background:"#111827",border:"1px solid rgba(139,92,246,0.08)",borderRadius:12,padding:"16px 18px",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:st.c}}/>
                <div style={{fontSize:24,fontWeight:800,color:st.c}}>{st.v}</div>
                <div style={{fontSize:11,color:"#475569",textTransform:"uppercase",letterSpacing:".5px",marginTop:2}}>{st.l}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{display:"flex",gap:10,marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(139,92,246,0.1)",borderRadius:9,padding:"0 12px",height:36,flex:1}}>
              <Search size={13} color="#475569"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search policies…" style={{background:"none",border:"none",outline:"none",fontSize:13,color:"#e2e8f0",width:"100%",fontFamily:"inherit"}}/>
            </div>
            {[["All","Security","Privacy","Operations","HR","Legal"],["All","DRAFT","UNDER_REVIEW","APPROVED","EXPIRED"]].map((opts,oi)=>(
              <select key={oi} value={oi===0?filterCat:filterStatus} onChange={e=>oi===0?setFilterCat(e.target.value):setFilterStatus(e.target.value)} style={{background:"#111827",border:"1px solid rgba(139,92,246,0.15)",borderRadius:8,padding:"6px 12px",color:"#94a3b8",fontSize:13,outline:"none"}}>
                {opts.map(o=><option key={o}>{o}</option>)}
              </select>
            ))}
          </div>

          {loading?<div style={{textAlign:"center",padding:60,color:"#475569"}}><RefreshCw size={20} style={{animation:"spin 1s linear infinite"}}/></div>:(
            <div>
              {policies.length===0&&(
                <div style={{...sty.card,textAlign:"center",padding:60}}>
                  <FileText size={32} color="#475569" style={{opacity:.3,margin:"0 auto 12px"}}/>
                  <p style={{color:"#475569",margin:"0 0 16px"}}>No policies yet.</p>
                  <button onClick={()=>setShowTemplates(true)} style={{...sty.btnSuccess,margin:"0 auto"}}><BookOpen size={13}/>Browse 40+ Templates</button>
                </div>
              )}
              {policies.map(p=>{
                const sc=STATUS_CFG[p.status]||STATUS_CFG.DRAFT;
                const daysLeft=p.next_review_date?Math.ceil((new Date(p.next_review_date)-new Date())/86400000):null;
                return(
                  <div key={p.id} style={sty.card}>
                    <div style={{display:"flex",alignItems:"flex-start",gap:14}}>
                      <div style={{width:40,height:40,borderRadius:10,background:"rgba(139,92,246,0.1)",border:"1px solid rgba(139,92,246,0.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <FileText size={18} color="#8b5cf6"/>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
                          <span style={{fontSize:14,fontWeight:600,color:"#e2e8f0"}}>{p.name}</span>
                          <span style={{background:sc.bg,color:sc.c,borderRadius:100,padding:"2px 10px",fontSize:11,fontWeight:600,display:"flex",alignItems:"center",gap:4}}>{sc.i}{sc.l}</span>
                          <span style={{background:"rgba(139,92,246,0.08)",color:"#8b5cf6",borderRadius:6,padding:"2px 8px",fontSize:10,fontWeight:600}}>v{p.version}</span>
                        </div>
                        <div style={{fontSize:12,color:"#475569",marginBottom:6}}>
                          {p.category} · Owner: {p.owner}
                          {daysLeft!==null&&<span style={{marginLeft:12,color:daysLeft<30?"#ef4444":daysLeft<90?"#f59e0b":"#10b981"}}>Review in {daysLeft} days</span>}
                        </div>
                        {(p.framework_refs||[]).length>0&&(
                          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                            {p.framework_refs.map(f=><span key={f} style={{background:`${FW_COLORS[f]||"#8b5cf6"}15`,color:FW_COLORS[f]||"#8b5cf6",borderRadius:4,padding:"1px 7px",fontSize:10,fontWeight:600}}>{f}</span>)}
                          </div>
                        )}
                      </div>
                      <div style={{display:"flex",gap:8,flexShrink:0}}>
                        <button onClick={()=>{const t=POLICY_TEMPLATES.find(t=>t.name===p.name)||{name:p.name,frameworks:p.framework_refs||[],desc:p.description||"",pages:5};downloadPolicyDoc(t,"Demo Corp");}} style={sty.btnGhost}><Download size={12}/>PDF</button>
                        {p.status!=="APPROVED"&&<button onClick={()=>approve(p.id)} style={sty.btnSuccess}><CheckCircle size={12}/>Approve</button>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab==="templates"&&(
        <div>
          <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(139,92,246,0.1)",borderRadius:9,padding:"0 12px",height:36,flex:1,minWidth:200}}>
              <Search size={13} color="#475569"/>
              <input value={tmplSearch} onChange={e=>setTmplSearch(e.target.value)} placeholder="Search 40+ policy templates…" style={{background:"none",border:"none",outline:"none",fontSize:13,color:"#e2e8f0",width:"100%",fontFamily:"inherit"}}/>
            </div>
            {CATS.map(cat=>(
              <button key={cat} onClick={()=>setTmplCat(cat)} style={{padding:"6px 14px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",border:"1px solid",borderColor:tmplCat===cat?"rgba(139,92,246,0.35)":"rgba(139,92,246,0.1)",background:tmplCat===cat?"rgba(139,92,246,0.12)":"transparent",color:tmplCat===cat?"#a78bfa":"#475569"}}>{cat}</button>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:10}}>
            {filteredTemplates.map(t=>(
              <div key={t.id} style={{background:"#111827",border:"1px solid rgba(139,92,246,0.08)",borderRadius:12,padding:"16px 18px"}}>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:8}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#e2e8f0",lineHeight:1.3,flex:1,marginRight:8}}>{t.name}</div>
                  <span style={{background:"rgba(139,92,246,0.08)",color:"#8b5cf6",borderRadius:6,padding:"2px 8px",fontSize:10,fontWeight:600,flexShrink:0}}>{t.pages}p</span>
                </div>
                <div style={{fontSize:11,color:"#64748b",marginBottom:10,lineHeight:1.5}}>{t.desc}</div>
                <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:12}}>
                  {t.frameworks.map(f=><span key={f} style={{background:`${FW_COLORS[f]||"#8b5cf6"}15`,color:FW_COLORS[f]||"#8b5cf6",borderRadius:4,padding:"1px 7px",fontSize:10,fontWeight:700}}>{f}</span>)}
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>downloadPolicyDoc(t,"Demo Corp")} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:5,padding:"7px",background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:8,color:"#10b981",fontSize:11,fontWeight:600,cursor:"pointer"}}><Download size={11}/>Download PDF</button>
                  <button onClick={()=>applyTemplate(t)} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:5,padding:"7px",background:"linear-gradient(135deg,#7c3aed,#6d28d9)",border:"none",borderRadius:8,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}><Plus size={11}/>Use Template</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Templates modal (from Policies tab) */}
      {showTemplates&&(
        <div style={sty.modal} onClick={e=>e.target===e.currentTarget&&setShowTemplates(false)}>
          <div style={{...sty.modalBox,maxWidth:700}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <h3 style={{margin:0,color:"#e2e8f0",fontSize:16,fontWeight:700}}>Policy Templates Library — {POLICY_TEMPLATES.length} templates</h3>
              <button onClick={()=>setShowTemplates(false)} style={{background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:18}}>✕</button>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
              {CATS.map(cat=>(
                <button key={cat} onClick={()=>setTmplCat(cat)} style={{padding:"5px 12px",borderRadius:7,fontSize:11,fontWeight:600,cursor:"pointer",border:"1px solid",borderColor:tmplCat===cat?"rgba(139,92,246,0.35)":"rgba(139,92,246,0.1)",background:tmplCat===cat?"rgba(139,92,246,0.12)":"transparent",color:tmplCat===cat?"#a78bfa":"#475569"}}>{cat}</button>
              ))}
            </div>
            <div style={{maxHeight:480,overflowY:"auto",display:"flex",flexDirection:"column",gap:8}}>
              {filteredTemplates.map(t=>(
                <div key={t.id} style={{background:"#1a2235",border:"1px solid rgba(139,92,246,0.08)",borderRadius:10,padding:"12px 16px",display:"flex",alignItems:"center",gap:12}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:"#e2e8f0",marginBottom:3}}>{t.name}</div>
                    <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                      {t.frameworks.map(f=><span key={f} style={{background:`${FW_COLORS[f]||"#8b5cf6"}15`,color:FW_COLORS[f]||"#8b5cf6",borderRadius:4,padding:"1px 6px",fontSize:9,fontWeight:700}}>{f}</span>)}
                      <span style={{fontSize:9,color:"#475569",marginLeft:4}}>{t.pages} pages · {t.category}</span>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:6,flexShrink:0}}>
                    <button onClick={()=>downloadPolicyDoc(t,"Demo Corp")} style={{display:"flex",alignItems:"center",gap:4,padding:"6px 10px",background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:7,color:"#10b981",fontSize:11,cursor:"pointer"}}><Download size={10}/>PDF</button>
                    <button onClick={()=>applyTemplate(t)} style={{display:"flex",alignItems:"center",gap:4,padding:"6px 10px",background:"linear-gradient(135deg,#7c3aed,#6d28d9)",border:"none",borderRadius:7,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}><Plus size={10}/>Use</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* New Policy Modal */}
      {showAdd&&(
        <div style={sty.modal} onClick={e=>e.target===e.currentTarget&&setShowAdd(false)}>
          <div style={sty.modalBox}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <h3 style={{margin:0,color:"#e2e8f0",fontSize:16,fontWeight:700}}>New Policy</h3>
              <button onClick={()=>setShowAdd(false)} style={{background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:18}}>✕</button>
            </div>
            <div style={{marginBottom:14}}><label style={sty.lbl}>Policy Name</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Information Security Policy" style={sty.inp}/></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div style={{marginBottom:14}}><label style={sty.lbl}>Category</label><select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} style={sty.inp}>{["Security","Privacy","Operations","HR","Legal","Compliance"].map(c=><option key={c}>{c}</option>)}</select></div>
              <div style={{marginBottom:14}}><label style={sty.lbl}>Owner</label><input value={form.owner} onChange={e=>setForm({...form,owner:e.target.value})} placeholder="CISO" style={sty.inp}/></div>
              <div style={{marginBottom:14}}><label style={sty.lbl}>Version</label><input value={form.version} onChange={e=>setForm({...form,version:e.target.value})} placeholder="1.0" style={sty.inp}/></div>
              <div style={{marginBottom:14}}><label style={sty.lbl}>Review Period (days)</label><input type="number" value={form.review_period_days} onChange={e=>setForm({...form,review_period_days:+e.target.value})} style={sty.inp}/></div>
            </div>
            <div style={{marginBottom:14}}><label style={sty.lbl}>Description</label><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={3} style={{...sty.inp,resize:"vertical"}} placeholder="What does this policy cover?"/></div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button onClick={()=>setShowAdd(false)} style={{...sty.btnGhost,color:"#475569"}}>Cancel</button>
              <button onClick={save} disabled={saving} style={sty.btnPrimary}>{saving?"Saving…":"Create Policy"}</button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

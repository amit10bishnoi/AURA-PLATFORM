import { useState, useEffect, useCallback } from "react";
import { Lock, RefreshCw, AlertTriangle, ChevronRight, Plus, Clock } from "lucide-react";
const API = "http://localhost:8000";
const STATUS = { IMPLEMENTED:{color:"#16a34a",bg:"rgba(22,163,74,.08)",label:"Implemented",icon:"✓"}, IN_PROGRESS:{color:"#d97706",bg:"rgba(217,119,6,.08)",label:"In Progress",icon:"◔"}, NOT_STARTED:{color:"#e11d48",bg:"rgba(225,29,72,.08)",label:"Not Started",icon:"○"} };
function ScoreRing({score,size=100}){const r=40,circ=2*Math.PI*r,offset=circ-(score/100)*circ,color=score>=60?"#d97706":score>=80?"#16a34a":"#e11d48";return(<svg width={size} height={size} viewBox="0 0 100 100"><circle cx="50" cy="50" r={r} fill="none" stroke="rgba(124,58,237,.1)" strokeWidth="8"/><circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 50 50)" style={{transition:"stroke-dashoffset 1.2s"}}/><text x="50" y="47" textAnchor="middle" fontSize="18" fontWeight="800" fontFamily="'Syne',sans-serif" fill={color}>{score}%</text><text x="50" y="60" textAnchor="middle" fontSize="7" fill="#a89dc8">DPDP READY</text></svg>);}
export default function DPDPHub({token,tenantId}){
  const[tab,setTab]=useState("overview");
  const[obligations,setObligations]=useState([]);
  const[summary,setSummary]=useState(null);
  const[readiness,setReadiness]=useState(null);
  const[consent,setConsent]=useState(null);
  const[dsr,setDsr]=useState(null);
  const[dataCategories,setDataCategories]=useState([]);
  const[loading,setLoading]=useState(true);
  const fetch_=useCallback(async()=>{
    setLoading(true);
    try{
      const[oRes,rRes,cRes,dsrRes,dcRes]=await Promise.all([
        fetch(`${API}/api/dpdp/obligations?tenant_id=${tenantId||"demo"}`,{headers:{Authorization:`Bearer ${token}`}}),
        fetch(`${API}/api/dpdp/readiness?tenant_id=${tenantId||"demo"}`,{headers:{Authorization:`Bearer ${token}`}}),
        fetch(`${API}/api/dpdp/consent?tenant_id=${tenantId||"demo"}`,{headers:{Authorization:`Bearer ${token}`}}),
        fetch(`${API}/api/dpdp/dsr?tenant_id=${tenantId||"demo"}`,{headers:{Authorization:`Bearer ${token}`}}),
        fetch(`${API}/api/dpdp/data-categories?tenant_id=${tenantId||"demo"}`,{headers:{Authorization:`Bearer ${token}`}}),
      ]);
      const oData=await oRes.json();const rData=await rRes.json();const cData=await cRes.json();const dsrData=await dsrRes.json();const dcData=await dcRes.json();
      setObligations(oData.obligations||[]);setSummary(oData.summary||{});setReadiness(rData);setConsent(cData);setDsr(dsrData);setDataCategories(dcData.categories||[]);
    }catch(e){console.error(e);}
    setLoading(false);
  },[token,tenantId]);
  useEffect(()=>{fetch_();},[fetch_]);
  const tabBtn=(id,label)=>(<button onClick={()=>setTab(id)} style={{padding:"8px 18px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",border:"1px solid",borderColor:tab===id?"rgba(124,58,237,.3)":"rgba(124,58,237,.1)",background:tab===id?"rgba(124,58,237,.1)":"#fff",color:tab===id?"#7c3aed":"#6b5b9e"}}>{label}</button>);
  const SENS_COLOR = {"CRITICAL":"#e11d48","HIGH":"#ea580c","MEDIUM":"#d97706","LOW":"#16a34a"};
  return(<div style={{padding:"28px 32px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
      <div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
          <div style={{background:"linear-gradient(135deg,#7c3aed,#db2777)",borderRadius:8,padding:"4px 12px",fontSize:11,fontWeight:700,color:"#fff"}}>DPDP ACT 2023</div>
          <div style={{background:"rgba(225,29,72,.1)",color:"#e11d48",border:"1px solid rgba(225,29,72,.2)",borderRadius:6,padding:"3px 10px",fontSize:11,fontWeight:700}}>Deadline: May 2027</div>
        </div>
        <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:24,fontWeight:800,color:"#1a0a3a",marginBottom:4}}>DPDP Privacy Management</h2>
        <p style={{color:"#a89dc8",fontSize:13}}>Digital Personal Data Protection Act 2023 · Consent Management · Data Principal Rights · Breach Notification</p>
      </div>
      <button onClick={fetch_} style={{padding:"9px 16px",background:"#fff",border:"1px solid rgba(124,58,237,.15)",borderRadius:9,color:"#7c3aed",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}><RefreshCw size={14}/>Refresh</button>
    </div>
    <div style={{background:"rgba(225,29,72,.04)",border:"1px solid rgba(225,29,72,.15)",borderRadius:12,padding:"12px 18px",marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}><AlertTriangle size={16} color="#e11d48"/><span style={{fontSize:13,color:"#1a0a3a"}}><strong>Maximum penalty: Rs 250 Crore per violation.</strong> Rules enforced from May 2027. Start compliance now.</span></div>
      <span style={{fontSize:12,fontWeight:700,color:"#e11d48"}}>~104 weeks left</span>
    </div>
    <div style={{display:"flex",gap:8,marginBottom:24}}>{tabBtn("overview","🔒 Overview")}{tabBtn("obligations","📋 Obligations")}{tabBtn("consent","✅ Consent")}{tabBtn("dsr","📬 Data Requests")}{tabBtn("data","🗂️ Data Inventory")}</div>
    {loading?(<div style={{textAlign:"center",padding:60,color:"#a89dc8"}}><RefreshCw size={20} style={{animation:"spin 1s linear infinite"}}/></div>):(
    <>
    {tab==="overview"&&readiness&&summary&&(<div>
      <div style={{display:"grid",gridTemplateColumns:"auto 1fr 1fr 1fr 1fr",gap:20,marginBottom:24,background:"#fff",border:"1px solid rgba(124,58,237,.1)",borderRadius:18,padding:28,alignItems:"center"}}>
        <div style={{paddingRight:24,borderRight:"1px solid rgba(124,58,237,.08)"}}><ScoreRing score={readiness.score||0}/></div>
        {[{label:"Implemented",value:summary.implemented||0,color:"#16a34a"},{label:"In Progress",value:summary.in_progress||0,color:"#d97706"},{label:"Not Started",value:summary.not_started||0,color:"#e11d48"},{label:"Max Penalty",value:"₹250Cr",color:"#e11d48"}].map(s=>(<div key={s.label} style={{textAlign:"center"}}><div style={{fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:800,color:s.color,lineHeight:1}}>{s.value}</div><div style={{fontSize:11,color:"#a89dc8",textTransform:"uppercase",letterSpacing:".5px",marginTop:4}}>{s.label}</div></div>))}
      </div>
      {dsr&&<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>{[{label:"Pending DSRs",value:dsr.pending,color:"#d97706"},{label:"Overdue DSRs",value:dsr.overdue,color:"#e11d48"},{label:"SLA Window",value:"48 hrs",color:"#7c3aed"},{label:"Consent Withdrawals",value:consent?.total_withdrawals||0,color:"#ea580c"}].map(s=>(<div key={s.label} style={{background:"#fff",border:"1px solid rgba(124,58,237,.08)",borderRadius:12,padding:"16px 20px",position:"relative",overflow:"hidden"}}><div style={{position:"absolute",top:0,left:0,right:0,height:3,background:s.color}}/><div style={{fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:800,color:s.color}}>{s.value}</div><div style={{fontSize:11,color:"#a89dc8",textTransform:"uppercase",letterSpacing:".5px"}}>{s.label}</div></div>))}</div>}
      {readiness.critical_gaps?.length>0&&(<div style={{background:"rgba(225,29,72,.04)",border:"1px solid rgba(225,29,72,.15)",borderRadius:14,padding:20}}><div style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700,color:"#1a0a3a",marginBottom:14}}>🚨 Critical DPDP Gaps — High Penalty Risk</div>{readiness.critical_gaps.map(g=>(<div key={g.id} style={{background:"#fff",border:"1px solid rgba(225,29,72,.1)",borderRadius:8,padding:"12px 16px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div><div style={{fontSize:12,fontWeight:600,color:"#1a0a3a",marginBottom:2}}>{g.obligation}</div><div style={{fontSize:10,color:"#a89dc8"}}>{g.id} · Penalty: {g.penalty}</div></div><button onClick={()=>setTab("obligations")} style={{padding:"4px 10px",background:"rgba(225,29,72,.08)",border:"1px solid rgba(225,29,72,.2)",borderRadius:6,color:"#e11d48",fontSize:11,fontWeight:600,cursor:"pointer",flexShrink:0,marginLeft:12}}>Fix →</button></div>))}
      </div>)}
    </div>)}
    {tab==="obligations"&&(<div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {obligations.map(o=>{const st=STATUS[o.status]||STATUS.NOT_STARTED;return(<div key={o.id} style={{background:"#fff",border:"1px solid rgba(124,58,237,.08)",borderRadius:10,padding:"14px 18px",transition:"border-color .15s"}} onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(124,58,237,.2)"} onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(124,58,237,.08)"}><div style={{display:"flex",alignItems:"flex-start",gap:12}}><span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"#a89dc8",minWidth:70,flexShrink:0}}>{o.id}</span><div style={{flex:1}}><div style={{fontSize:13,fontWeight:500,color:"#1a0a3a",marginBottom:4}}>{o.obligation}</div><div style={{display:"flex",gap:10}}><span style={{fontSize:10,color:"#7c3aed",fontWeight:600}}>{o.section}</span><span style={{fontSize:10,color:"#e11d48"}}>Penalty: {o.penalty}</span><span style={{fontSize:10,color:"#a89dc8"}}>Owner: {o.owner}</span></div></div><span style={{background:st.bg,color:st.color,borderRadius:100,padding:"3px 10px",fontSize:11,fontWeight:700,minWidth:90,textAlign:"center",flexShrink:0}}>{st.icon} {st.label}</span></div></div>);})}
      </div>
    </div>)}
    {tab==="consent"&&consent&&(<div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>{[{label:"Total Data Principals",value:consent.total_data_principals?.toLocaleString("en-IN"),color:"#7c3aed"},{label:"Consent Withdrawals",value:consent.total_withdrawals,color:"#ea580c"},{label:"Withdrawal Rate",value:`${consent.withdrawal_rate}%`,color:consent.withdrawal_rate>5?"#e11d48":"#16a34a"}].map(s=>(<div key={s.label} style={{background:"#fff",border:"1px solid rgba(124,58,237,.08)",borderRadius:12,padding:"16px 20px"}}><div style={{fontFamily:"'Syne',sans-serif",fontSize:26,fontWeight:800,color:s.color}}>{s.value}</div><div style={{fontSize:11,color:"#a89dc8",textTransform:"uppercase",letterSpacing:".5px"}}>{s.label}</div></div>))}</div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>{consent.records?.map(r=>(<div key={r.id} style={{background:"#fff",border:`1px solid ${r.status==="REVIEW_NEEDED"?"rgba(217,119,6,.2)":"rgba(124,58,237,.08)"}`,borderRadius:12,padding:"16px 20px"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}><div><div style={{fontSize:14,fontWeight:600,color:"#1a0a3a",marginBottom:2}}>{r.purpose}</div><div style={{fontSize:11,color:"#a89dc8"}}>Active since: {new Date(r.consent_date).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</div></div><span style={{background:r.status==="ACTIVE"?"rgba(22,163,74,.1)":"rgba(217,119,6,.1)",color:r.status==="ACTIVE"?"#16a34a":"#d97706",borderRadius:100,padding:"3px 10px",fontSize:11,fontWeight:700}}>{r.status==="ACTIVE"?"Active":"Review Needed"}</span></div><div style={{display:"flex",gap:20}}><span style={{fontSize:12,color:"#6b5b9e"}}>{r.data_principals?.toLocaleString("en-IN")} principals</span><span style={{fontSize:12,color:"#ea580c"}}>{r.withdrawal_requests} withdrawals</span></div></div>))}
      </div>
    </div>)}
    {tab==="dsr"&&dsr&&(<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontSize:13,color:"#6b5b9e"}}>{dsr.pending} pending requests · SLA: {dsr.sla_hours} hours · {dsr.overdue} overdue</div>
        <button style={{padding:"8px 16px",background:"linear-gradient(135deg,#7c3aed,#db2777)",border:"none",borderRadius:8,color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}><Plus size={12}/>New Request</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>{dsr.requests?.map(r=>{const overdue=r.status==="PENDING"&&r.deadline<new Date().toISOString();const hoursLeft=Math.round((new Date(r.deadline)-new Date())/3600000);return(<div key={r.id} style={{background:"#fff",border:`1px solid ${overdue?"rgba(225,29,72,.2)":"rgba(124,58,237,.08)"}`,borderRadius:12,padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"#a89dc8"}}>{r.id}</span><span style={{fontSize:13,fontWeight:600,color:"#1a0a3a"}}>{r.type}</span>{overdue&&<span style={{background:"rgba(225,29,72,.1)",color:"#e11d48",borderRadius:4,padding:"1px 6px",fontSize:9,fontWeight:700}}>OVERDUE</span>}</div><div style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:"#a89dc8"}}><Clock size={11}/>{overdue?"Overdue":`${Math.max(0,hoursLeft)}h remaining`}</div></div><span style={{background:STATUS[r.status]?.bg||"#f5f3ff",color:STATUS[r.status]?.color||"#7c3aed",borderRadius:100,padding:"4px 12px",fontSize:11,fontWeight:700}}>{STATUS[r.status]?.icon||"○"} {r.status}</span></div>);})}
      </div>
    </div>)}
    {tab==="data"&&(<div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>{dataCategories.map(dc=>(<div key={dc.id} style={{background:"#fff",border:`1px solid ${dc.status==="NEEDS_ATTENTION"?"rgba(225,29,72,.2)":dc.status==="REVIEW_NEEDED"?"rgba(217,119,6,.2)":"rgba(124,58,237,.08)"}`,borderRadius:12,padding:"18px 20px"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}><div><div style={{fontSize:14,fontWeight:700,color:"#1a0a3a",marginBottom:2}}>{dc.category}</div><div style={{fontSize:11,color:"#a89dc8"}}>{dc.examples}</div></div><div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{background:`${SENS_COLOR[dc.sensitivity]}14`,color:SENS_COLOR[dc.sensitivity],borderRadius:6,padding:"2px 8px",fontSize:10,fontWeight:700}}>{dc.sensitivity}</span><span style={{background:dc.status==="MAPPED"?"rgba(22,163,74,.1)":dc.status==="REVIEW_NEEDED"?"rgba(217,119,6,.1)":"rgba(225,29,72,.1)",color:dc.status==="MAPPED"?"#16a34a":dc.status==="REVIEW_NEEDED"?"#d97706":"#e11d48",borderRadius:100,padding:"3px 10px",fontSize:11,fontWeight:700}}>{dc.status.replace("_"," ")}</span></div></div><div style={{display:"flex",gap:16}}><span style={{fontSize:11,color:"#6b5b9e"}}>Volume: {dc.volume_estimate}</span><span style={{fontSize:11,color:"#6b5b9e"}}>Retention: {dc.retention_policy}</span><span style={{fontSize:11,color:"#6b5b9e"}}>Basis: {dc.legal_basis}</span></div></div>))}
      </div>
    </div>)}
    </>)}
    <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
  </div>);}

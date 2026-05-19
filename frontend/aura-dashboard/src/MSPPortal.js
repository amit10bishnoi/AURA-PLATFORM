import { useState, useEffect, useCallback } from "react";
import { Building2, Plus, RefreshCw, X, Globe, Users, TrendingUp, DollarSign, Settings, ChevronLeft, Check, Palette } from "lucide-react";
const API = "http://localhost:8001";

const sty = {
  hdr:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24},
  h2:{fontSize:20,fontWeight:800,color:"#e2e8f0",display:"flex",alignItems:"center",gap:10,margin:0},
  sub:{color:"#475569",fontSize:13,marginTop:4},
  btnGhost:{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",background:"rgba(139,92,246,0.08)",border:"1px solid rgba(139,92,246,0.2)",borderRadius:9,color:"#a78bfa",fontSize:13,fontWeight:600,cursor:"pointer"},
  btnPrimary:{display:"flex",alignItems:"center",gap:6,padding:"8px 18px",background:"linear-gradient(135deg,#7c3aed,#6d28d9)",border:"none",borderRadius:9,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"},
  card:{background:"#111827",border:"1px solid rgba(139,92,246,0.08)",borderRadius:14,padding:"20px 22px",marginBottom:10},
  modal:{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(4px)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20},
  modalBox:{background:"#111827",border:"1px solid rgba(139,92,246,0.2)",borderRadius:16,padding:28,width:"100%",maxWidth:520,maxHeight:"90vh",overflowY:"auto"},
  field:{marginBottom:14},
  lbl:{display:"block",fontSize:10,fontWeight:700,color:"#94a3b8",marginBottom:5,textTransform:"uppercase",letterSpacing:".5px"},
  inp:{width:"100%",background:"#1a2235",border:"1px solid rgba(139,92,246,0.15)",borderRadius:8,padding:"9px 12px",color:"#e2e8f0",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"},
};

function StatCard({icon,label,value,sub,color="#8b5cf6"}){
  return(
    <div style={{background:"#111827",border:"1px solid rgba(139,92,246,0.08)",borderRadius:14,padding:"18px 20px",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:color}}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div>
          <div style={{fontSize:24,fontWeight:800,color,marginBottom:2}}>{value}</div>
          <div style={{fontSize:11,color:"#475569",textTransform:"uppercase",letterSpacing:".5px"}}>{label}</div>
          {sub&&<div style={{fontSize:11,color:"#64748b",marginTop:4}}>{sub}</div>}
        </div>
        <div style={{color,opacity:.5}}>{icon}</div>
      </div>
    </div>
  );
}

function PlanCard({plan, selected, onSelect}){
  return(
    <div onClick={()=>onSelect(plan.id)} style={{background:selected===plan.id?"rgba(139,92,246,0.1)":"#1a2235",border:`1px solid ${selected===plan.id?"rgba(139,92,246,0.4)":"rgba(139,92,246,0.1)"}`,borderRadius:12,padding:"18px 16px",cursor:"pointer",transition:"all .2s",position:"relative"}}>
      {plan.popular&&<div style={{position:"absolute",top:-10,left:"50%",transform:"translateX(-50%)",background:"#db2777",color:"#fff",borderRadius:100,padding:"2px 12px",fontSize:10,fontWeight:700,whiteSpace:"nowrap"}}>MOST POPULAR</div>}
      <div style={{fontSize:13,fontWeight:700,color:plan.color,marginBottom:4}}>{plan.name}</div>
      <div style={{fontSize:12,color:"#475569",marginBottom:12}}>Up to {plan.max_clients} clients · {Math.round(plan.revenue_share*100)}% rev share</div>
      {plan.features.map(f=>(
        <div key={f} style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
          <Check size={11} color="#10b981"/>
          <span style={{fontSize:11,color:"#94a3b8"}}>{f}</span>
        </div>
      ))}
    </div>
  );
}

export default function MSPPortal({token, tenantId}){
  const [tab, setTab] = useState("partners");
  const [dashboard, setDashboard] = useState(null);
  const [partners, setPartners] = useState([]);
  const [plans, setPlans] = useState([]);
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({brand_name:"",contact_name:"",contact_email:"",custom_domain:"",brand_primary:"#7c3aed",brand_secondary:"#db2777",plan:"growth",industries:[]});

  const load = useCallback(async()=>{
    setLoading(true);
    try{
      const h={Authorization:`Bearer ${token}`};
      const tid=tenantId||"demo";
      const [d,p,pl,r]=await Promise.all([
        fetch(`${API}/api/msp/dashboard?tenant_id=${tid}`,{headers:h}).then(x=>x.json()),
        fetch(`${API}/api/msp/partners?tenant_id=${tid}`,{headers:h}).then(x=>x.json()),
        fetch(`${API}/api/msp/plans`,{headers:h}).then(x=>x.json()),
        fetch(`${API}/api/msp/revenue?tenant_id=${tid}`,{headers:h}).then(x=>x.json()),
      ]);
      setDashboard(d); setPartners(p.partners||[]); setPlans(pl.plans||[]); setRevenue(r);
    }catch(e){console.error(e);}
    setLoading(false);
  },[token,tenantId]);

  useEffect(()=>{load();},[load]);

  const createPartner = async()=>{
    try{
      const res=await fetch(`${API}/api/msp/partners?tenant_id=${tenantId||"demo"}`,{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify(form)});
      const data=await res.json();
      setShowAdd(false);
      load();
      if(data.setup_link) alert(`✅ Partner created!\n\nSetup link:\n${data.setup_link}`);
    }catch{alert("Failed to create partner");}
  };

  const toggleIndustry = (ind)=>setForm(f=>({...f,industries:f.industries.includes(ind)?f.industries.filter(x=>x!==ind):[...f.industries,ind]}));

  if(selected){
    const p=partners.find(x=>x.id===selected);
    if(!p) return null;
    return(
      <div>
        <button onClick={()=>setSelected(null)} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:"#475569",fontSize:13,cursor:"pointer",marginBottom:20,padding:0}}><ChevronLeft size={14}/>Back to Partners</button>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
          <div style={{...sty.card,gridColumn:"1/-1"}}>
            <div style={{display:"flex",alignItems:"center",gap:16}}>
              <div style={{width:56,height:56,borderRadius:14,background:`linear-gradient(135deg,${p.brand_primary},${p.brand_secondary})`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <Building2 size={24} color="#fff"/>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:20,fontWeight:800,color:"#e2e8f0",marginBottom:4}}>{p.brand_name}</div>
                <div style={{fontSize:12,color:"#475569"}}>{p.contact_email} · {p.custom_domain}</div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <span style={{background:p.status==="active"?"rgba(16,185,129,0.1)":"rgba(245,158,11,0.1)",color:p.status==="active"?"#10b981":"#f59e0b",borderRadius:100,padding:"4px 12px",fontSize:11,fontWeight:700,textTransform:"uppercase"}}>{p.status}</span>
                <span style={{background:"rgba(139,92,246,0.1)",color:"#a78bfa",borderRadius:100,padding:"4px 12px",fontSize:11,fontWeight:700,textTransform:"uppercase"}}>{p.plan}</span>
              </div>
            </div>
          </div>
          {[
            {label:"Active Clients",value:p.active_clients,max:p.max_clients,color:"#3b82f6"},
            {label:"Monthly Revenue",value:`₹${(p.monthly_revenue/1000).toFixed(0)}K`,color:"#10b981"},
            {label:"Rev Share",value:`${Math.round(p.revenue_share*100)}%`,color:"#f97316"},
            {label:"Joined",value:new Date(p.joined).toLocaleDateString("en-IN"),color:"#8b5cf6"},
          ].map(st=>(
            <div key={st.label} style={{background:"#111827",border:"1px solid rgba(139,92,246,0.08)",borderRadius:12,padding:"16px 18px"}}>
              <div style={{fontSize:22,fontWeight:800,color:st.color}}>{st.value}{st.max?<span style={{fontSize:14,color:"#475569",fontWeight:400}}>/{st.max}</span>:""}</div>
              <div style={{fontSize:11,color:"#475569",textTransform:"uppercase",letterSpacing:".5px",marginTop:2}}>{st.label}</div>
            </div>
          ))}
        </div>
        <div style={sty.card}>
          <div style={{fontSize:14,fontWeight:700,color:"#e2e8f0",marginBottom:16,display:"flex",alignItems:"center",gap:8}}><Palette size={16} color="#8b5cf6"/>Brand Preview</div>
          <div style={{background:`linear-gradient(135deg,${p.brand_primary}22,${p.brand_secondary}11)`,border:`1px solid ${p.brand_primary}33`,borderRadius:12,padding:20}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
              <div style={{width:36,height:36,borderRadius:9,background:`linear-gradient(135deg,${p.brand_primary},${p.brand_secondary})`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <Building2 size={16} color="#fff"/>
              </div>
              <div style={{fontSize:16,fontWeight:800,color:"#e2e8f0"}}>{p.brand_name}</div>
            </div>
            <div style={{fontSize:12,color:"#64748b",marginBottom:8}}>Client portal URL: <span style={{color:p.brand_primary}}>{p.custom_domain||"app.aura.io"}</span></div>
            <div style={{display:"flex",gap:8}}>
              <div style={{width:24,height:24,borderRadius:6,background:p.brand_primary}}/>
              <div style={{width:24,height:24,borderRadius:6,background:p.brand_secondary}}/>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return(
    <div>
      <div style={sty.hdr}>
        <div>
          <h2 style={sty.h2}><Building2 size={20} color="#8b5cf6"/>MSP White-Label Portal</h2>
          <p style={sty.sub}>Manage partner firms · White-label branding · Revenue tracking · Client workspaces</p>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={load} style={sty.btnGhost}><RefreshCw size={13}/>Refresh</button>
          <button onClick={()=>setShowAdd(true)} style={sty.btnPrimary}><Plus size={13}/>Onboard Partner</button>
        </div>
      </div>

      {/* Stats */}
      {dashboard&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
          <StatCard icon={<Building2 size={20}/>} label="MSP Partners" value={dashboard.stats.total_partners} sub={`${dashboard.stats.active_partners} active`} color="#8b5cf6"/>
          <StatCard icon={<Users size={20}/>} label="Client Workspaces" value={dashboard.stats.total_client_workspaces} color="#3b82f6"/>
          <StatCard icon={<TrendingUp size={20}/>} label="Avg Compliance" value={`${dashboard.stats.avg_client_compliance_score}%`} color="#10b981"/>
          <StatCard icon={<DollarSign size={20}/>} label="Monthly Revenue" value={`₹${(revenue?.total_platform_revenue/1000||0).toFixed(0)}K`} sub="platform total" color="#f97316"/>
        </div>
      )}

      {/* Tabs */}
      <div style={{display:"flex",gap:6,marginBottom:20}}>
        {[["partners","🏢 Partners"],["revenue","💰 Revenue"],["plans","📋 Plans"]].map(([id,lbl])=>(
          <button key={id} onClick={()=>setTab(id)} style={{padding:"8px 18px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",border:"1px solid",borderColor:tab===id?"rgba(139,92,246,0.35)":"rgba(139,92,246,0.1)",background:tab===id?"rgba(139,92,246,0.12)":"transparent",color:tab===id?"#a78bfa":"#475569"}}>{lbl}</button>
        ))}
      </div>

      {/* Partners tab */}
      {tab==="partners"&&(
        <div>
          {partners.length===0&&<div style={{...sty.card,textAlign:"center",padding:60,color:"#475569"}}><Building2 size={32} style={{opacity:.3,margin:"0 auto 12px"}}/><p>No MSP partners yet. Onboard your first partner above.</p></div>}
          {partners.map(p=>(
            <div key={p.id} style={{...sty.card,display:"flex",alignItems:"center",gap:16,cursor:"pointer"}} onClick={()=>setSelected(p.id)}>
              <div style={{width:44,height:44,borderRadius:12,background:`linear-gradient(135deg,${p.brand_primary},${p.brand_secondary})`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <Building2 size={20} color="#fff"/>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                  <span style={{fontSize:14,fontWeight:700,color:"#e2e8f0"}}>{p.brand_name}</span>
                  <span style={{background:p.status==="active"?"rgba(16,185,129,0.1)":"rgba(245,158,11,0.1)",color:p.status==="active"?"#10b981":"#f59e0b",borderRadius:100,padding:"2px 8px",fontSize:10,fontWeight:700}}>{p.status}</span>
                  <span style={{background:"rgba(139,92,246,0.08)",color:"#a78bfa",borderRadius:100,padding:"2px 8px",fontSize:10,fontWeight:600}}>{p.plan}</span>
                </div>
                <div style={{fontSize:12,color:"#475569"}}>{p.contact_email} · {p.custom_domain||"No custom domain"}</div>
              </div>
              <div style={{display:"flex",gap:24,flexShrink:0,textAlign:"center"}}>
                <div><div style={{fontSize:16,fontWeight:700,color:"#3b82f6"}}>{p.active_clients}/{p.max_clients}</div><div style={{fontSize:10,color:"#475569"}}>Clients</div></div>
                <div><div style={{fontSize:16,fontWeight:700,color:"#10b981"}}>₹{(p.monthly_revenue/1000).toFixed(0)}K</div><div style={{fontSize:10,color:"#475569"}}>Revenue</div></div>
                <div><div style={{fontSize:16,fontWeight:700,color:"#f97316"}}>{Math.round(p.revenue_share*100)}%</div><div style={{fontSize:10,color:"#475569"}}>Rev Share</div></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Revenue tab */}
      {tab==="revenue"&&revenue&&(
        <div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:20}}>
            {[
              {l:"Total Platform Revenue",v:`₹${(revenue.total_platform_revenue/1000).toFixed(0)}K/mo`,c:"#8b5cf6"},
              {l:"AURA Net Revenue",v:`₹${(revenue.aura_revenue/1000).toFixed(0)}K/mo`,c:"#10b981"},
              {l:"Partner Payouts",v:`₹${(revenue.partner_payouts/1000).toFixed(0)}K/mo`,c:"#f97316"},
            ].map(st=>(
              <div key={st.l} style={{background:"#111827",border:"1px solid rgba(139,92,246,0.08)",borderRadius:14,padding:"20px",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:st.c}}/>
                <div style={{fontSize:24,fontWeight:800,color:st.c,marginBottom:4}}>{st.v}</div>
                <div style={{fontSize:11,color:"#475569",textTransform:"uppercase",letterSpacing:".5px"}}>{st.l}</div>
              </div>
            ))}
          </div>
          <div style={sty.card}>
            <div style={{fontSize:14,fontWeight:700,color:"#e2e8f0",marginBottom:16}}>Revenue by Partner</div>
            {revenue.by_partner.map(p=>(
              <div key={p.name} style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                <div style={{flex:1,fontSize:13,color:"#e2e8f0"}}>{p.name}</div>
                <div style={{width:200,height:6,background:"rgba(255,255,255,0.06)",borderRadius:3,overflow:"hidden"}}>
                  <div style={{width:`${(p.revenue/revenue.total_platform_revenue)*100}%`,height:"100%",background:"linear-gradient(90deg,#8b5cf6,#3b82f6)",borderRadius:3}}/>
                </div>
                <div style={{fontSize:13,fontWeight:700,color:"#10b981",minWidth:70,textAlign:"right"}}>₹{(p.revenue/1000).toFixed(0)}K</div>
                <div style={{fontSize:11,color:"#475569",minWidth:60,textAlign:"right"}}>→ ₹{(p.share/1000).toFixed(0)}K</div>
              </div>
            ))}
          </div>
          <div style={sty.card}>
            <div style={{fontSize:14,fontWeight:700,color:"#e2e8f0",marginBottom:16}}>Revenue by Plan</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
              {Object.entries(revenue.by_plan).map(([plan,rev])=>(
                <div key={plan} style={{background:"rgba(139,92,246,0.05)",border:"1px solid rgba(139,92,246,0.1)",borderRadius:10,padding:"14px 16px",textAlign:"center"}}>
                  <div style={{fontSize:18,fontWeight:800,color:"#a78bfa"}}>₹{(rev/1000).toFixed(0)}K</div>
                  <div style={{fontSize:11,color:"#475569",textTransform:"uppercase",letterSpacing:".5px",marginTop:4}}>{plan}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Plans tab */}
      {tab==="plans"&&(
        <div>
          <p style={{color:"#64748b",fontSize:13,marginBottom:20}}>MSP partners choose a plan that determines how many client workspaces they can manage and their revenue share percentage.</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
            {plans.map(plan=>(
              <div key={plan.id} style={{background:"#111827",border:`1px solid ${plan.color}33`,borderRadius:14,padding:"24px 20px",position:"relative"}}>
                {plan.popular&&<div style={{position:"absolute",top:-10,left:"50%",transform:"translateX(-50%)",background:"#db2777",color:"#fff",borderRadius:100,padding:"3px 14px",fontSize:10,fontWeight:700}}>MOST POPULAR</div>}
                <div style={{fontSize:16,fontWeight:800,color:plan.color,marginBottom:4}}>{plan.name}</div>
                <div style={{fontSize:13,color:"#475569",marginBottom:16}}>Up to {plan.max_clients} clients · {Math.round(plan.revenue_share*100)}% rev share</div>
                {plan.features.map(f=>(
                  <div key={f} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                    <Check size={12} color="#10b981"/>
                    <span style={{fontSize:12,color:"#94a3b8"}}>{f}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Partner Modal */}
      {showAdd&&(
        <div style={sty.modal} onClick={e=>e.target===e.currentTarget&&setShowAdd(false)}>
          <div style={sty.modalBox}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h3 style={{margin:0,color:"#e2e8f0",fontSize:16,fontWeight:700}}>Onboard MSP Partner</h3>
              <button onClick={()=>setShowAdd(false)} style={{background:"none",border:"none",color:"#475569",cursor:"pointer"}}><X size={18}/></button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div style={{...sty.field,gridColumn:"1/-1"}}>
                <label style={sty.lbl}>Brand / Company Name</label>
                <input value={form.brand_name} onChange={e=>setForm({...form,brand_name:e.target.value})} placeholder="SecureShield Compliance" style={sty.inp}/>
              </div>
              <div style={sty.field}>
                <label style={sty.lbl}>Contact Name</label>
                <input value={form.contact_name} onChange={e=>setForm({...form,contact_name:e.target.value})} placeholder="Rahul Sharma" style={sty.inp}/>
              </div>
              <div style={sty.field}>
                <label style={sty.lbl}>Contact Email</label>
                <input type="email" value={form.contact_email} onChange={e=>setForm({...form,contact_email:e.target.value})} placeholder="rahul@firm.in" style={sty.inp}/>
              </div>
              <div style={{...sty.field,gridColumn:"1/-1"}}>
                <label style={sty.lbl}>Custom Domain (optional)</label>
                <input value={form.custom_domain} onChange={e=>setForm({...form,custom_domain:e.target.value})} placeholder="compliance.theirfirm.in" style={sty.inp}/>
              </div>
              <div style={sty.field}>
                <label style={sty.lbl}>Primary Brand Color</label>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <input type="color" value={form.brand_primary} onChange={e=>setForm({...form,brand_primary:e.target.value})} style={{width:40,height:36,borderRadius:8,border:"1px solid rgba(139,92,246,0.2)",cursor:"pointer",padding:2}}/>
                  <input value={form.brand_primary} onChange={e=>setForm({...form,brand_primary:e.target.value})} style={{...sty.inp,flex:1}}/>
                </div>
              </div>
              <div style={sty.field}>
                <label style={sty.lbl}>Secondary Brand Color</label>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <input type="color" value={form.brand_secondary} onChange={e=>setForm({...form,brand_secondary:e.target.value})} style={{width:40,height:36,borderRadius:8,border:"1px solid rgba(139,92,246,0.2)",cursor:"pointer",padding:2}}/>
                  <input value={form.brand_secondary} onChange={e=>setForm({...form,brand_secondary:e.target.value})} style={{...sty.inp,flex:1}}/>
                </div>
              </div>
            </div>
            <div style={sty.field}>
              <label style={sty.lbl}>MSP Plan</label>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                {plans.map(plan=><PlanCard key={plan.id} plan={plan} selected={form.plan} onSelect={p=>setForm({...form,plan:p})}/>)}
              </div>
            </div>
            <div style={sty.field}>
              <label style={sty.lbl}>Target Industries</label>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {["Fintech","Banking","SaaS","Healthcare","Insurance","NBFC","IT Services","Manufacturing"].map(ind=>(
                  <button key={ind} onClick={()=>toggleIndustry(ind)} style={{padding:"4px 10px",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer",border:"1px solid",borderColor:form.industries.includes(ind)?"#8b5cf6":"rgba(139,92,246,0.15)",background:form.industries.includes(ind)?"rgba(139,92,246,0.15)":"transparent",color:form.industries.includes(ind)?"#a78bfa":"#475569"}}>{ind}</button>
                ))}
              </div>
            </div>
            {/* Brand preview */}
            <div style={{background:`linear-gradient(135deg,${form.brand_primary}22,${form.brand_secondary}11)`,border:`1px solid ${form.brand_primary}33`,borderRadius:10,padding:14,marginBottom:16}}>
              <div style={{fontSize:11,color:"#475569",marginBottom:8}}>Brand Preview</div>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:32,height:32,borderRadius:8,background:`linear-gradient(135deg,${form.brand_primary},${form.brand_secondary})`,display:"flex",alignItems:"center",justifyContent:"center"}}><Building2 size={14} color="#fff"/></div>
                <span style={{fontSize:14,fontWeight:700,color:"#e2e8f0"}}>{form.brand_name||"Partner Brand"}</span>
              </div>
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button onClick={()=>setShowAdd(false)} style={{...sty.btnGhost,color:"#475569"}}>Cancel</button>
              <button onClick={createPartner} style={sty.btnPrimary}><Plus size={13}/>Onboard Partner</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

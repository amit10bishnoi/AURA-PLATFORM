import { useState } from 'react';

const T = {
  bg:'#09090F', surface:'#0E0E18', card:'#13131C', border:'rgba(255,255,255,0.08)',
  purple:'#7c3aed', purpleL:'#a78bfa', text:'#FFFFFF', muted:'#9CA3AF', faint:'#374151',
  green:'#10B981', amber:'#F59E0B', red:'#EF4444', blue:'#60A5FA',
  mono:"'JetBrains Mono',ui-monospace,monospace", body:"'DM Sans',system-ui,sans-serif",
  syne:"'Syne',sans-serif",
};

const FW_FILTERS = [
  {key:'all',    label:'All',       color:'#a78bfa'},
  {key:'iso',    label:'ISO 27001', color:'#a78bfa'},
  {key:'soc2',   label:'SOC 2',     color:'#34D399'},
  {key:'rbi',    label:'RBI',       color:'#60A5FA'},
  {key:'certin', label:'CERT-In',   color:'#FBBF24'},
  {key:'dpdp',   label:'DPDP',      color:'#F472B6'},
];

const RISK_COLORS = {Critical:'#EF4444', High:'#F59E0B', Medium:'#60A5FA', Low:'#10B981'};
const FW_COLORS   = {'ISO 27001':'#a78bfa','SOC 2':'#34D399','RBI':'#60A5FA','CERT-In':'#FBBF24','DPDP':'#F472B6'};
const STATUS_DOTS = {pass:'#10B981', partial:'#F59E0B', fail:'#EF4444'};

const CATEGORIES = [
  {id:'ac', name:'Access Control', count:4, controls:[
    {id:'AC-1.1', title:'User access provisioning policy',         fw:'ISO 27001', risk:'High',     status:'pass',    action:'View'},
    {id:'AC-1.2', title:'Privileged access management',            fw:'SOC 2',    risk:'Critical', status:'fail',    action:'Fix'},
    {id:'AC-1.3', title:'Multi-factor authentication enforcement',  fw:'RBI',      risk:'High',     status:'pass',    action:'View'},
    {id:'AC-1.4', title:'Session timeout policy',                  fw:'ISO 27001',risk:'Medium',   status:'partial', action:'Review'},
  ]},
  {id:'cr', name:'Cryptography', count:3, controls:[
    {id:'CR-1.1', title:'Encryption at rest — AES-256',            fw:'ISO 27001', risk:'Critical', status:'pass',    action:'View'},
    {id:'CR-1.2', title:'TLS 1.3 enforced on all services',        fw:'SOC 2',    risk:'High',     status:'pass',    action:'View'},
    {id:'CR-1.3', title:'Key rotation schedule documented',        fw:'DPDP',     risk:'Medium',   status:'fail',    action:'Fix'},
  ]},
  {id:'ir', name:'Incident Response', count:2, controls:[
    {id:'IR-1.1', title:'Incident response plan — signed off',     fw:'CERT-In',  risk:'High',     status:'partial', action:'Review'},
    {id:'IR-1.2', title:'24/7 SOC coverage verified',              fw:'RBI',      risk:'High',     status:'pass',    action:'View'},
  ]},
  {id:'dp', name:'Data Protection', count:3, controls:[
    {id:'DP-1.1', title:'Data residency — Mumbai confirmed',       fw:'DPDP',     risk:'Critical', status:'pass',    action:'View'},
    {id:'DP-1.2', title:'Personal data inventory complete',        fw:'DPDP',     risk:'Critical', status:'fail',    action:'Fix'},
    {id:'DP-1.3', title:'Consent management system live',          fw:'DPDP',     risk:'High',     status:'partial', action:'Review'},
  ]},
];

/* ─── Donut ring ─────────────────────────────────────────────────────────── */
function DonutRing({pct=50, pass=6, partial=3, fail=3}) {
  const r = 52, cx = 72, cy = 72, circ = 2*Math.PI*r;
  const passArc  = (pass/(pass+partial+fail)) * circ;
  const partArc  = (partial/(pass+partial+fail)) * circ;
  const failArc  = (fail/(pass+partial+fail)) * circ;
  let offset = 0;
  const arc = (len, color) => {
    const el = <circle key={color} cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="10"
      strokeDasharray={`${len} ${circ}`} strokeDashoffset={-offset} strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}/>;
    offset += len;
    return el;
  };
  return (
    <svg width={144} height={144} viewBox="0 0 144 144">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10"/>
      {arc(passArc, '#10B981')}
      {arc(partArc, '#F59E0B')}
      {arc(failArc, '#EF4444')}
      <text x={cx} y={cy-8} textAnchor="middle" fill="white" style={{fontSize:24,fontWeight:700,fontFamily:T.mono}}>{pct}%</text>
      <text x={cx} y={cy+12} textAnchor="middle" fill="#9CA3AF" style={{fontSize:11,fontFamily:T.body}}>posture</text>
    </svg>
  );
}

export default function ComplianceHub({token, tenantId}) {
  const [fwFilter, setFwFilter] = useState('all');
  const [expanded, setExpanded] = useState({ac:true, cr:false, ir:false, dp:false});

  const allControls = CATEGORIES.flatMap(c => c.controls);
  const passing  = allControls.filter(c => c.status==='pass').length;
  const partial  = allControls.filter(c => c.status==='partial').length;
  const failing  = allControls.filter(c => c.status==='fail').length;
  const pct      = Math.round((passing/allControls.length)*100);

  const getActionStyle = (action) => ({
    background: action==='Fix' ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)',
    border: `1px solid ${action==='Fix' ? 'rgba(239,68,68,0.4)' : T.border}`,
    color: action==='Fix' ? '#EF4444' : T.text,
    borderRadius:6, padding:'3px 10px', fontSize:11, cursor:'pointer', fontFamily:T.body,
  });

  return (
    <div style={{background:T.bg, minHeight:'100%', fontFamily:T.body, color:T.text, padding:'24px'}}>

      {/* ── Header ── */}
      <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24}}>
        <div style={{display:'flex', alignItems:'center', gap:20}}>
          <DonutRing pct={pct} pass={passing} partial={partial} fail={failing}/>
          <div>
            <h1 style={{fontFamily:T.syne, fontSize:24, fontWeight:800, margin:'0 0 6px', letterSpacing:'-.4px'}}>Compliance Hub</h1>
            <div style={{display:'flex', gap:16, marginBottom:6}}>
              <span style={{fontSize:12}}><span style={{color:T.green}}>●</span> Passing: {passing}</span>
              <span style={{fontSize:12}}><span style={{color:T.amber}}>●</span> Partial: {partial}</span>
              <span style={{fontSize:12}}><span style={{color:T.red}}>●</span> Failing: {failing}</span>
            </div>
            <div style={{fontSize:12, color:T.muted}}>{allControls.length} total controls across 5 frameworks</div>
          </div>
        </div>
        <div style={{display:'flex', gap:8}}>
          <button style={{background:T.purple, border:'none', borderRadius:8, padding:'9px 18px', fontSize:13, color:'white', cursor:'pointer', fontWeight:500, fontFamily:T.body}}>
            Run scan
          </button>
          <button style={{background:'transparent', border:`1px solid ${T.border}`, borderRadius:8, padding:'9px 18px', fontSize:13, color:T.text, cursor:'pointer', fontFamily:T.body}}>
            Export report
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div style={{display:'flex', gap:8, marginBottom:20, flexWrap:'wrap', alignItems:'center'}}>
        {FW_FILTERS.map(f => {
          const on = fwFilter===f.key;
          return (
            <button key={f.key} onClick={() => setFwFilter(f.key)} style={{
              padding:'5px 14px', borderRadius:100, fontSize:12, cursor:'pointer', fontFamily:T.body,
              background: on ? `${f.color}20` : 'transparent',
              border:`1px solid ${on ? f.color+'60' : T.border}`,
              color: on ? f.color : T.muted, fontWeight: on ? 500 : 400,
              transition:'all .15s',
            }}>{f.label}</button>
          );
        })}
        <div style={{marginLeft:'auto', display:'flex', alignItems:'center', gap:6, background:T.surface, borderRadius:8, padding:'6px 12px', border:`1px solid ${T.border}`}}>
          <svg width="13" height="13" fill="none" stroke={T.muted} strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input placeholder="Search controls..." style={{background:'transparent', border:'none', outline:'none', fontSize:12, color:T.text, fontFamily:T.body, width:140}} readOnly/>
        </div>
      </div>

      {/* ── Control categories ── */}
      <div style={{display:'flex', flexDirection:'column', gap:8}}>
        {CATEGORIES.map(cat => {
          const isOpen = expanded[cat.id];
          const catControls = fwFilter==='all' ? cat.controls :
            cat.controls.filter(c => c.fw.toLowerCase().includes(fwFilter==='iso'?'iso':fwFilter==='soc2'?'soc':fwFilter));
          if (catControls.length===0 && fwFilter!=='all') return null;

          const catPass = catControls.filter(c=>c.status==='pass').length;
          const catPart = catControls.filter(c=>c.status==='partial').length;
          const catFail = catControls.filter(c=>c.status==='fail').length;

          return (
            <div key={cat.id} style={{background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, overflow:'hidden'}}>
              <div onClick={() => setExpanded(e=>({...e,[cat.id]:!e[cat.id]}))} style={{
                display:'flex', alignItems:'center', padding:'12px 16px', cursor:'pointer',
              }}>
                <svg width="14" height="14" fill="none" stroke={T.muted} strokeWidth="2" viewBox="0 0 24 24" style={{transform:isOpen?'rotate(90deg)':'none',transition:'transform .15s',marginRight:10}}>
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
                <span style={{fontSize:14, fontWeight:500, color:T.text, flex:1}}>{cat.name}</span>
                <div style={{display:'flex', gap:8, marginRight:12}}>
                  <span style={{fontSize:11, color:T.green}}>{catPass} Passing</span>
                  {catPart>0 && <span style={{fontSize:11, color:T.amber}}>{catPart} Partial</span>}
                  {catFail>0 && <span style={{fontSize:11, color:T.red}}>{catFail} Failing</span>}
                </div>
                <span style={{fontSize:11, color:T.muted, background:'rgba(255,255,255,0.06)', borderRadius:4, padding:'2px 8px', fontFamily:T.mono}}>{catControls.length}</span>
              </div>
              {isOpen && (
                <div style={{borderTop:`1px solid ${T.border}`}}>
                  {catControls.map((ctrl, i) => (
                    <div key={ctrl.id} style={{
                      display:'flex', alignItems:'center', padding:'10px 16px 10px 38px',
                      borderTop: i>0 ? `1px solid rgba(255,255,255,0.04)` : 'none',
                      gap:10,
                    }}>
                      <div style={{width:7, height:7, borderRadius:'50%', background:STATUS_DOTS[ctrl.status], flexShrink:0}}/>
                      <span style={{fontSize:12, color:T.muted, fontFamily:T.mono, minWidth:60}}>{ctrl.id}</span>
                      <span style={{fontSize:13, color:T.text, flex:1}}>{ctrl.title}</span>
                      <span style={{fontSize:11, fontWeight:500, color:FW_COLORS[ctrl.fw]||T.muted,
                        background:`${FW_COLORS[ctrl.fw]||'#666'}1E`, padding:'2px 8px', borderRadius:4}}>{ctrl.fw}</span>
                      <span style={{fontSize:11, fontWeight:500, color:RISK_COLORS[ctrl.risk]||T.muted,
                        background:`${RISK_COLORS[ctrl.risk]||'#666'}18`, padding:'2px 8px', borderRadius:4}}>{ctrl.risk}</span>
                      <button style={getActionStyle(ctrl.action)}>{ctrl.action}</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

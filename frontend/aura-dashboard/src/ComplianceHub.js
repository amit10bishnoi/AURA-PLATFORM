import { useState, useMemo } from 'react';

/* ─── Brand ─────────────────────────────────────────────────────────────── */
const T = {
  bg:'#09090F', surface:'#0E0E18', card:'#13131C', cardHi:'#18182A',
  border:'rgba(255,255,255,0.08)', borderHi:'rgba(255,255,255,0.14)',
  purple:'#7c3aed', purpleL:'#a78bfa', text:'#ECEEFF', muted:'#9CA3AF', faint:'#374151',
  green:'#10B981', amber:'#F59E0B', red:'#EF4444', blue:'#60A5FA',
  mono:"'JetBrains Mono',ui-monospace,monospace",
  body:"'DM Sans',system-ui,sans-serif", syne:"'Syne',sans-serif",
};
const FW_COLOR = {
  'ISO 27001':'#a78bfa','SOC 2':'#34D399','RBI':'#60A5FA','CERT-In':'#FBBF24','DPDP':'#F472B6',
};
const STATUS_COLOR = { pass:T.green, partial:T.amber, fail:T.red };
const STATUS_LABEL = { pass:'Passing', partial:'Partial', fail:'Failing' };
const RISK_COLOR   = { Critical:T.red, High:T.amber, Medium:T.blue, Low:T.green };
const ACTION_STYLE = (a) => ({
  background: a==='Fix' ? 'rgba(239,68,68,0.15)' : a==='Review' ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.07)',
  border:`1px solid ${a==='Fix'?'rgba(239,68,68,0.4)':a==='Review'?'rgba(245,158,11,0.35)':T.border}`,
  color: a==='Fix' ? T.red : a==='Review' ? T.amber : T.text,
  borderRadius:6, padding:'4px 12px', fontSize:12, cursor:'pointer', fontFamily:T.body,
  fontWeight:500, transition:'all .12s',
});

/* ─── Control data — matches Figma exactly ──────────────────────────────── */
const CONTROLS = [
  /* Access Control */
  { id:'AC-1.1', title:'User access provisioning policy',         cat:'Access Control',  fw:'ISO 27001', risk:'High',     status:'pass',
    desc:'Formal process for granting, modifying, and revoking user access to information systems.',
    evidence:['okta_provisioning_log.csv','access_policy_v3.pdf'],
    steps:['Document provisioning workflow','Review quarterly access logs','Implement role-based access control'], action:'View' },
  { id:'AC-1.2', title:'Privileged access management',            cat:'Access Control',  fw:'SOC 2',    risk:'Critical', status:'fail',
    desc:'Controls over privileged accounts including creation, monitoring, and periodic review.',
    evidence:[],
    steps:['Deploy PAM solution (CyberArk/HashiCorp Vault)','Rotate all privileged credentials','Enable MFA for all admin accounts'], action:'Fix' },
  { id:'AC-1.3', title:'Multi-factor authentication enforcement',  cat:'Access Control',  fw:'RBI',      risk:'High',     status:'pass',
    desc:'MFA required for all remote access and privileged account usage.',
    evidence:['okta_mfa_report.pdf','mfa_coverage_screenshot.png'],
    steps:['Enable MFA on all admin accounts','Enforce MFA for remote access','Document MFA exceptions process'], action:'View' },
  { id:'AC-1.4', title:'Session timeout policy',                  cat:'Access Control',  fw:'ISO 27001', risk:'Medium',   status:'partial',
    desc:'Automatic session termination after defined period of inactivity to prevent unauthorized access.',
    evidence:['session_config_screenshot.png'],
    steps:['Set 15-min timeout for admin sessions','Configure user session timeout','Document and test timeout enforcement'], action:'Review' },
  /* Cryptography */
  { id:'CR-2.1', title:'Encryption at rest',                      cat:'Cryptography',    fw:'DPDP',     risk:'Critical', status:'pass',
    desc:'All personal data and sensitive information encrypted at rest using AES-256.',
    evidence:['aws_encryption_report.json','db_encryption_config.pdf'],
    steps:['Enable AES-256 encryption on all databases','Verify backup encryption','Audit encryption key management'], action:'View' },
  { id:'CR-2.2', title:'TLS 1.2+ enforcement',                    cat:'Cryptography',    fw:'SOC 2',    risk:'High',     status:'pass',
    desc:'All data in transit protected using TLS 1.2 or higher encryption protocols.',
    evidence:['ssl_scan_report.pdf','nginx_tls_config.txt'],
    steps:['Disable TLS 1.0 and 1.1','Enable HSTS headers','Verify certificate chain validity'], action:'View' },
  { id:'CR-2.3', title:'Key management lifecycle',                 cat:'Cryptography',    fw:'RBI',      risk:'High',     status:'fail',
    desc:'Formal key management process covering generation, storage, rotation, and destruction.',
    evidence:[],
    steps:['Define key rotation schedule (90 days)','Implement HSM for key storage','Document key custodian responsibilities'], action:'Fix' },
  /* Incident Response */
  { id:'IR-3.1', title:'Incident response plan',                   cat:'Incident Response',fw:'CERT-In',  risk:'Critical', status:'partial',
    desc:'Documented IR plan with defined roles, escalation paths, and CERT-In reporting within 6 hours.',
    evidence:['ir_plan_draft_v2.pdf'],
    steps:['Finalize IR plan and get CISO sign-off','Conduct tabletop exercise','Register with CERT-In portal'], action:'Review' },
  { id:'IR-3.2', title:'Security incident logging',                cat:'Incident Response',fw:'ISO 27001', risk:'High',    status:'pass',
    desc:'All security incidents logged with timestamp, severity, and resolution details in SIEM.',
    evidence:['siem_incident_log.csv'],
    steps:['Configure SIEM alerting','Review log retention policy','Test incident logging workflow'], action:'View' },
  /* Data Protection */
  { id:'DP-4.1', title:'Personal data inventory',                  cat:'Data Protection', fw:'DPDP',     risk:'Critical', status:'fail',
    desc:'Complete inventory of all personal data processed, stored, and transmitted across systems.',
    evidence:[],
    steps:['Run automated data discovery scan','Map data flows across systems','Document data categories and purposes'], action:'Fix' },
  { id:'DP-4.2', title:'Data retention and deletion',              cat:'Data Protection', fw:'DPDP',     risk:'High',     status:'partial',
    desc:'Defined retention periods for all data categories with automated deletion processes.',
    evidence:['retention_policy_v1.pdf'],
    steps:['Define retention schedule per data type','Implement automated deletion','Test deletion and verify no recovery possible'], action:'Review' },
  { id:'DP-4.3', title:'Consent management',                       cat:'Data Protection', fw:'DPDP',     risk:'Critical', status:'pass',
    desc:'System to collect, record, and withdraw consent for personal data processing.',
    evidence:['consent_db_schema.pdf','consent_api_spec.json'],
    steps:['Implement consent capture UI','Build consent withdrawal API','Audit existing data for consent records'], action:'View' },
];
const CATS = ['Access Control','Cryptography','Incident Response','Data Protection'];
const FW_PILLS = [
  {k:'all',       label:'All',       c:'#a78bfa'},
  {k:'ISO 27001', label:'ISO 27001', c:'#a78bfa'},
  {k:'SOC 2',     label:'SOC 2',     c:'#34D399'},
  {k:'RBI',       label:'RBI',       c:'#60A5FA'},
  {k:'CERT-In',   label:'CERT-In',   c:'#FBBF24'},
  {k:'DPDP',      label:'DPDP',      c:'#F472B6'},
];

/* ─── Donut ring ─────────────────────────────────────────────────────────── */
function Donut({pass,partial,fail}) {
  const total=pass+partial+fail, r=52, cx=70, cy=70, circ=2*Math.PI*r;
  const segs=[
    {len:(pass/total)*circ,  color:T.green},
    {len:(partial/total)*circ,color:T.amber},
    {len:(fail/total)*circ,  color:T.red},
  ];
  let off=0;
  return (
    <svg width={140} height={140} viewBox="0 0 140 140" style={{flexShrink:0}}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10}/>
      {segs.map((s,i)=>{
        const el=(
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={10}
            strokeDasharray={`${s.len} ${circ}`} strokeDashoffset={-off}
            strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}/>
        );
        off+=s.len; return el;
      })}
      <text x={cx} y={cy-8} textAnchor="middle" fill={T.text}
        style={{fontSize:22,fontWeight:700,fontFamily:T.mono}}>{Math.round(pass/total*100)}%</text>
      <text x={cx} y={cy+10} textAnchor="middle" fill={T.muted}
        style={{fontSize:10,fontFamily:T.body}}>posture</text>
    </svg>
  );
}

/* ─── File icon ─────────────────────────────────────────────────────────── */
function FileIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="1.5" style={{flexShrink:0}}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  );
}

/* ─── Detail panel ───────────────────────────────────────────────────────── */
function DetailPanel({ctrl, onClose}) {
  if (!ctrl) return null;
  const fc = FW_COLOR[ctrl.fw]||T.purpleL;
  const rc = RISK_COLOR[ctrl.risk]||T.amber;
  const sc = STATUS_COLOR[ctrl.status];
  return (
    <div style={{
      width:340, flexShrink:0, background:T.card, borderLeft:`1px solid ${T.border}`,
      display:'flex', flexDirection:'column', height:'100%', overflow:'hidden',
      animation:'dp-in .2s ease-out',
    }}>
      <style>{`@keyframes dp-in{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}`}</style>
      {/* Header */}
      <div style={{padding:'20px 20px 16px', borderBottom:`1px solid ${T.border}`, flexShrink:0}}>
        <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8}}>
          <div>
            <div style={{fontSize:11, color:T.muted, fontFamily:T.mono, marginBottom:4}}>{ctrl.id}</div>
            <div style={{fontSize:15, fontWeight:600, color:T.text, lineHeight:1.3}}>{ctrl.title}</div>
          </div>
          <button onClick={onClose} style={{
            background:'none', border:'none', cursor:'pointer', color:T.muted, padding:4, flexShrink:0,
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        {/* Badges */}
        <div style={{display:'flex', gap:6, marginTop:10, flexWrap:'wrap'}}>
          <span style={{fontSize:11, fontWeight:600, color:fc, background:`${fc}1A`, padding:'3px 8px', borderRadius:4}}>{ctrl.fw}</span>
          <span style={{fontSize:11, fontWeight:600, color:rc, background:`${rc}1A`, padding:'3px 8px', borderRadius:4}}>{ctrl.risk} risk</span>
          <span style={{fontSize:11, fontWeight:600, color:sc, background:`${sc}1A`, padding:'3px 8px', borderRadius:4}}>{STATUS_LABEL[ctrl.status]}</span>
        </div>
      </div>
      {/* Body */}
      <div style={{flex:1, overflowY:'auto', padding:'0 20px 20px'}}>
        {/* Description */}
        <div style={{padding:'16px 0 12px', borderBottom:`1px solid ${T.border}`}}>
          <div style={{fontSize:10, textTransform:'uppercase', letterSpacing:'1px', color:T.faint, marginBottom:8, fontWeight:600}}>Description</div>
          <p style={{fontSize:13, color:T.muted, lineHeight:1.65, margin:0}}>{ctrl.desc}</p>
        </div>
        {/* Evidence */}
        <div style={{padding:'14px 0 12px', borderBottom:`1px solid ${T.border}`}}>
          <div style={{fontSize:10, textTransform:'uppercase', letterSpacing:'1px', color:T.faint, marginBottom:8, fontWeight:600}}>
            Evidence ({ctrl.evidence.length})
          </div>
          {ctrl.evidence.length===0 ? (
            <div style={{
              background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)',
              borderRadius:8, padding:'16px', textAlign:'center',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={T.red} strokeWidth="1.5" style={{margin:'0 auto 6px', display:'block'}}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <div style={{fontSize:12, color:T.red}}>No evidence collected</div>
            </div>
          ) : ctrl.evidence.map((e,i)=>(
            <div key={i} style={{
              display:'flex', alignItems:'center', gap:8,
              background:T.cardHi, border:`1px solid ${T.border}`, borderRadius:7,
              padding:'10px 12px', marginBottom:6,
            }}>
              <FileIcon/>
              <span style={{fontSize:12, color:T.text, fontFamily:T.mono}}>{e}</span>
            </div>
          ))}
        </div>
        {/* Remediation steps */}
        <div style={{padding:'14px 0 16px'}}>
          <div style={{fontSize:10, textTransform:'uppercase', letterSpacing:'1px', color:T.faint, marginBottom:10, fontWeight:600}}>Remediation steps</div>
          {ctrl.steps.map((step,i)=>(
            <div key={i} style={{display:'flex', gap:10, marginBottom:10, alignItems:'flex-start'}}>
              <div style={{
                width:20, height:20, borderRadius:5, background:'rgba(124,58,237,0.15)',
                border:'1px solid rgba(124,58,237,0.3)', display:'flex', alignItems:'center',
                justifyContent:'center', flexShrink:0,
              }}>
                <span style={{fontSize:10, color:T.purpleL, fontFamily:T.mono, fontWeight:700}}>{String(i+1).padStart(2,'0')}</span>
              </div>
              <span style={{fontSize:13, color:T.muted, lineHeight:1.5}}>{step}</span>
            </div>
          ))}
        </div>
      </div>
      {/* AI Fix button */}
      <div style={{padding:'12px 20px 16px', borderTop:`1px solid ${T.border}`, flexShrink:0}}>
        <button style={{
          width:'100%', background:T.purple, border:'none', borderRadius:8,
          padding:'12px', fontSize:14, fontWeight:600, color:'white',
          cursor:'pointer', fontFamily:T.body, display:'flex', alignItems:'center', justifyContent:'center', gap:8,
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="white" style={{flexShrink:0}}>
            <path d="M12 2L9.29 9.29 2 12l7.29 2.71L12 22l2.71-7.29L22 12l-7.29-2.71L12 2z"/>
          </svg>
          AI Fix — Generate remediation
        </button>
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function ComplianceHub({token, tenantId}) {
  const [fw, setFw]       = useState('all');
  const [selected, setSel]= useState(null);
  const [expanded, setExp]= useState({
    'Access Control':true, 'Cryptography':false, 'Incident Response':false, 'Data Protection':false,
  });
  const [search, setSearch]= useState('');

  const filtered = useMemo(()=>{
    return CONTROLS.filter(c=>{
      const fwMatch = fw==='all' || c.fw===fw;
      const srMatch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.id.toLowerCase().includes(search.toLowerCase());
      return fwMatch && srMatch;
    });
  }, [fw, search]);

  const passing  = CONTROLS.filter(c=>c.status==='pass').length;
  const partial  = CONTROLS.filter(c=>c.status==='partial').length;
  const failing  = CONTROLS.filter(c=>c.status==='fail').length;

  const toggle = (cat) => setExp(e=>({...e,[cat]:!e[cat]}));

  return (
    <div style={{
      display:'flex', height:'100vh', overflow:'hidden',
      background:T.bg, fontFamily:T.body, color:T.text,
    }}>
      <style>{`
        .ctrl-row:hover { background: rgba(255,255,255,0.03) !important; }
        .pill-btn:hover { opacity:.85; }
        .act-btn:hover { opacity:.8; }
        * { box-sizing:border-box; }
      `}</style>

      {/* ── Main content ── */}
      <div style={{flex:1, overflow:'auto', padding:'24px'}}>

        {/* Header */}
        <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24}}>
          <div style={{display:'flex', alignItems:'center', gap:20}}>
            <Donut pass={passing} partial={partial} fail={failing}/>
            <div>
              <h1 style={{fontFamily:T.syne, fontSize:24, fontWeight:800, margin:'0 0 6px', letterSpacing:'-.4px', color:T.text}}>
                Compliance Hub
              </h1>
              <div style={{display:'flex', gap:16, marginBottom:6, flexWrap:'wrap'}}>
                <span style={{fontSize:13, color:T.muted}}>
                  <span style={{color:T.green, fontWeight:600}}>● </span>Passing: <b style={{color:T.text}}>{passing}</b>
                </span>
                <span style={{fontSize:13, color:T.muted}}>
                  <span style={{color:T.amber, fontWeight:600}}>● </span>Partial: <b style={{color:T.text}}>{partial}</b>
                </span>
                <span style={{fontSize:13, color:T.muted}}>
                  <span style={{color:T.red, fontWeight:600}}>● </span>Failing: <b style={{color:T.text}}>{failing}</b>
                </span>
              </div>
              <div style={{fontSize:12, color:T.faint}}>{CONTROLS.length} total controls across 5 frameworks</div>
            </div>
          </div>
          <div style={{display:'flex', gap:8, flexShrink:0}}>
            <button style={{
              background:T.purple, border:'none', borderRadius:8, padding:'9px 18px',
              fontSize:13, color:'white', cursor:'pointer', fontWeight:500, fontFamily:T.body,
              display:'flex', alignItems:'center', gap:6,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              Run scan
            </button>
            <button style={{
              background:'transparent', border:`1px solid ${T.border}`, borderRadius:8,
              padding:'9px 18px', fontSize:13, color:T.text, cursor:'pointer', fontFamily:T.body,
            }}>Export report</button>
          </div>
        </div>

        {/* Filter pills + search */}
        <div style={{display:'flex', gap:6, marginBottom:20, flexWrap:'wrap', alignItems:'center'}}>
          {FW_PILLS.map(p=>{
            const on = fw===p.k;
            return (
              <button key={p.k} className="pill-btn" onClick={()=>{setFw(p.k);setSel(null);}} style={{
                padding:'5px 14px', borderRadius:100, fontSize:12, cursor:'pointer', fontFamily:T.body,
                background: on ? `${p.c}22` : 'transparent',
                border:`1px solid ${on ? p.c+'70' : T.border}`,
                color: on ? p.c : T.muted, fontWeight: on ? 600 : 400, transition:'all .12s',
              }}>{p.label}</button>
            );
          })}
          {/* Search */}
          <div style={{
            marginLeft:'auto', display:'flex', alignItems:'center', gap:7,
            background:T.surface, borderRadius:8, padding:'7px 12px', border:`1px solid ${T.border}`,
          }}>
            <svg width="13" height="13" fill="none" stroke={T.muted} strokeWidth="1.5" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search controls..."
              style={{
                background:'transparent', border:'none', outline:'none',
                fontSize:12, color:T.text, fontFamily:T.body, width:140,
              }}/>
          </div>
        </div>

        {/* Control categories */}
        <div style={{display:'flex', flexDirection:'column', gap:8}}>
          {CATS.map(cat=>{
            const catCtrls = filtered.filter(c=>c.cat===cat);
            if (catCtrls.length===0) return null;
            const isOpen = expanded[cat];
            const cPass  = catCtrls.filter(c=>c.status==='pass').length;
            const cPart  = catCtrls.filter(c=>c.status==='partial').length;
            const cFail  = catCtrls.filter(c=>c.status==='fail').length;
            return (
              <div key={cat} style={{background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, overflow:'hidden'}}>
                {/* Category header */}
                <div onClick={()=>toggle(cat)} style={{
                  display:'flex', alignItems:'center', padding:'12px 16px', cursor:'pointer',
                  userSelect:'none',
                }}>
                  <svg width="14" height="14" fill="none" stroke={T.muted} strokeWidth="2" viewBox="0 0 24 24"
                    style={{marginRight:10, transition:'transform .15s', transform:isOpen?'rotate(90deg)':'none', flexShrink:0}}>
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                  <span style={{fontSize:14, fontWeight:500, color:T.text, flex:1}}>{cat}</span>
                  <div style={{display:'flex', gap:10, alignItems:'center', marginRight:12}}>
                    {cPass>0 && <span style={{fontSize:11, color:T.green}}>{cPass} Passing</span>}
                    {cPart>0 && <span style={{fontSize:11, color:T.amber}}>{cPart} Partial</span>}
                    {cFail>0 && <span style={{fontSize:11, color:T.red}}>{cFail} Failing</span>}
                  </div>
                  <span style={{
                    fontSize:11, color:T.muted, background:'rgba(255,255,255,0.06)',
                    borderRadius:4, padding:'2px 8px', fontFamily:T.mono,
                  }}>{catCtrls.length}</span>
                </div>
                {/* Control rows */}
                {isOpen && (
                  <div style={{borderTop:`1px solid ${T.border}`}}>
                    {catCtrls.map((ctrl,i)=>{
                      const fc = FW_COLOR[ctrl.fw]||T.purpleL;
                      const rc = RISK_COLOR[ctrl.risk]||T.amber;
                      const isSelected = selected?.id===ctrl.id;
                      return (
                        <div key={ctrl.id} className="ctrl-row" onClick={()=>setSel(isSelected?null:ctrl)} style={{
                          display:'flex', alignItems:'center', padding:'10px 16px 10px 38px',
                          borderTop: i>0 ? `1px solid rgba(255,255,255,0.04)` : 'none',
                          gap:10, cursor:'pointer', transition:'background .1s',
                          background: isSelected ? 'rgba(124,58,237,0.06)' : 'transparent',
                        }}>
                          <div style={{
                            width:7, height:7, borderRadius:'50%',
                            background:STATUS_COLOR[ctrl.status], flexShrink:0,
                          }}/>
                          <span style={{fontSize:12, color:T.faint, fontFamily:T.mono, minWidth:52, flexShrink:0}}>{ctrl.id}</span>
                          <span style={{fontSize:13, color:T.text, flex:1}}>{ctrl.title}</span>
                          <span style={{
                            fontSize:11, fontWeight:600, color:fc, background:`${fc}1A`,
                            padding:'2px 8px', borderRadius:4, flexShrink:0,
                          }}>{ctrl.fw}</span>
                          <span style={{
                            fontSize:11, fontWeight:600, color:rc, background:`${rc}1A`,
                            padding:'2px 8px', borderRadius:4, flexShrink:0,
                          }}>{ctrl.risk}</span>
                          <button className="act-btn" onClick={e=>{e.stopPropagation();setSel(ctrl);}}
                            style={{...ACTION_STYLE(ctrl.action), flexShrink:0}}>
                            {ctrl.action}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length===0 && (
            <div style={{textAlign:'center', padding:'48px', color:T.muted}}>
              No controls match this filter.
            </div>
          )}
        </div>
      </div>

      {/* ── Detail panel ── */}
      {selected && <DetailPanel ctrl={selected} onClose={()=>setSel(null)}/>}
    </div>
  );
}

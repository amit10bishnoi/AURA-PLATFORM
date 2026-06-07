import {
  LayoutDashboard, ShieldCheck, AlertTriangle, Zap, FolderOpen,
  Terminal, Globe, Shield, Award, ShieldAlert, Lock, Sparkles,
  Search,
} from 'lucide-react';

const SECTIONS = [
  { title:'Overview', items:[
    { id:'overview',     label:'Overview',      Icon:LayoutDashboard },
  ]},
  { title:'Compliance', items:[
    { id:'soc2',         label:'Compliance Hub', Icon:ShieldCheck },
  ]},
  { title:'Risk', items:[
    { id:'risk-register',label:'Risk Register',  Icon:AlertTriangle },
  ]},
  { title:'Operations', items:[
    { id:'automation',   label:'Automation',     Icon:Zap       },
    { id:'evidence',     label:'Evidence Vault',  Icon:FolderOpen},
    { id:'ssh',          label:'SSH Manager',    Icon:Terminal  },
  ]},
  { title:'Trust', items:[
    { id:'trustcenter', label:'Trust Center',   Icon:Globe     },
    { id:'ai-assistant', label:'AI Assistant',   Icon:Sparkles  },
  ]},
];

const FW_ITEMS = [
  { id:'iso27001',  label:'ISO 27001',  color:'#a78bfa' },
  { id:'soc2',      label:'SOC 2',      color:'#34D399' },
  { id:'rbi',       label:'RBI Cyber',  color:'#60A5FA' },
  { id:'certin',    label:'CERT-In',    color:'#FBBF24' },
  { id:'dpdp',      label:'DPDP Act',   color:'#F472B6' },
];

export default function DarkSidebar({ activeTab, onTabChange, tenantId, userEmail }) {
  return (
    <div style={{
      width:220, minWidth:220, height:'100vh', position:'sticky', top:0,
      background:'#0D0D1C',
      borderRight:'1px solid rgba(255,255,255,0.06)',
      display:'flex', flexDirection:'column',
      fontFamily:"'DM Sans',system-ui,sans-serif",
      overflowY:'auto', flexShrink:0,
    }}>

      {/* Logo */}
      <div style={{
        padding:'16px 16px 14px',
        borderBottom:'1px solid rgba(255,255,255,0.06)',
        display:'flex', alignItems:'center', gap:10, flexShrink:0,
      }}>
        <div style={{
          width:32, height:32, borderRadius:8, background:'#7c3aed',
          display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
        }}>
          <span style={{fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:800, color:'white'}}>A</span>
        </div>
        <span style={{fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, color:'#ECEEFF', letterSpacing:'-.4px'}}>
          AURA
        </span>
      </div>

      {/* Nav */}
      <div style={{flex:1, paddingTop:8, overflow:'auto'}}>
        {SECTIONS.map(sec => (
          <div key={sec.title} style={{marginBottom:2}}>
            <div style={{
              padding:'7px 16px 4px', fontSize:9, color:'#1E1E32',
              textTransform:'uppercase', letterSpacing:'1px', fontWeight:600,
            }}>{sec.title}</div>

            {sec.items.map(({id, label, Icon}) => {
              const active = activeTab === id;
              return (
                <button key={id} onClick={() => onTabChange(id)} style={{
                  width:'100%', display:'flex', alignItems:'center', gap:8,
                  padding:`7px 16px 7px ${active?'14px':'16px'}`,
                  background: active ? 'rgba(124,58,237,0.16)' : 'transparent',
                  border:'none', borderLeft:`2px solid ${active ? '#7c3aed' : 'transparent'}`,
                  cursor:'pointer', color: active ? '#a78bfa' : '#4A4A68',
                  fontSize:13, fontFamily:"'DM Sans',system-ui,sans-serif",
                  fontWeight: active ? 500 : 400, textAlign:'left',
                  transition:'all .12s ease', boxSizing:'border-box',
                }}>
                  <Icon size={14} color={active ? '#a78bfa' : '#3A3A58'} style={{flexShrink:0}}/>
                  {label}
                </button>
              );
            })}
          </div>
        ))}

        {/* Frameworks section */}
        <div style={{marginBottom:2}}>
          <div style={{
            padding:'7px 16px 4px', fontSize:9, color:'#1E1E32',
            textTransform:'uppercase', letterSpacing:'1px', fontWeight:600,
          }}>Frameworks</div>

          {FW_ITEMS.map(({id, label, color}) => {
            const active = activeTab === id;
            return (
              <button key={id} onClick={() => onTabChange(id)} style={{
                width:'100%', display:'flex', alignItems:'center', gap:8,
                padding:`7px 16px 7px ${active?'14px':'16px'}`,
                background: active ? `${color}18` : 'transparent',
                border:'none', borderLeft:`2px solid ${active ? color : 'transparent'}`,
                cursor:'pointer', color: active ? color : '#4A4A68',
                fontSize:13, fontFamily:"'DM Sans',system-ui,sans-serif",
                fontWeight: active ? 500 : 400, textAlign:'left',
                transition:'all .12s ease', boxSizing:'border-box',
              }}>
                <div style={{
                  width:6, height:6, borderRadius:2,
                  background: active ? color : `${color}60`, flexShrink:0,
                }}/>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding:'12px 16px', borderTop:'1px solid rgba(255,255,255,0.06)', flexShrink:0,
      }}>
        <div style={{display:'flex', alignItems:'center', gap:6, marginBottom:6}}>
          <div style={{width:6, height:6, borderRadius:'50%', background:'#10B981', animation:'sb-pulse 2s infinite'}}/>
          <span style={{fontSize:10, color:'#10B981', fontFamily:"'JetBrains Mono',monospace"}}>
            All systems live
          </span>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <div style={{
            width:26, height:26, borderRadius:'50%', background:'#7c3aed',
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
          }}>
            <span style={{fontSize:11, fontWeight:600, color:'white'}}>R</span>
          </div>
          <div>
            <div style={{fontSize:12, color:'#ECEEFF', fontWeight:500}}>
              {tenantId === 'democorp' ? 'Rahul Sharma' : (tenantId || 'Rahul Sharma')}
            </div>
            <div style={{fontSize:10, color:'#3A3A55'}}>CISO</div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes sb-pulse { 0%,100%{opacity:1}50%{opacity:.3} }
        button:hover { opacity:.85 !important; }
      `}</style>
    </div>
  );
}

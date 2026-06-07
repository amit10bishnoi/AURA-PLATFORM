import {
  LayoutDashboard, Sparkles, Zap,
  Shield, Award, ShieldAlert, Lock, ClipboardList,
  AlertTriangle, FileBarChart, Building2,
  FileCheck, FileText, AlertCircle, CheckSquare, Activity, Radio,
  BarChart2, ShieldCheck, Terminal, Users,
} from 'lucide-react';

/* ─── Nav structure ──────────────────────────────────────────────────────────── */
const SECTIONS = [
  {
    title: 'Overview',
    items: [
      { id:'overview',     label:'Dashboard',      Icon:LayoutDashboard  },
      { id:'ai-assistant', label:'AI Copilot',      Icon:Sparkles         },
      { id:'automation',   label:'Automation Hub',  Icon:Zap              },
    ],
  },
  {
    title: 'Compliance',
    items: [
      { id:'iso27001',   label:'ISO 27001',     Icon:Shield,      color:'#a78bfa' },
      { id:'soc2',       label:'SOC 2',         Icon:Award,       color:'#34D399' },
      { id:'rbi',        label:'RBI',           Icon:ShieldAlert, color:'#60A5FA' },
      { id:'dpdp',       label:'DPDP',          Icon:Lock,        color:'#F472B6' },
      { id:'compliance', label:'Framework Map', Icon:ClipboardList              },
    ],
  },
  {
    title: 'Risk',
    items: [
      { id:'risk-register', label:'Risk Register',   Icon:AlertTriangle },
      { id:'assessment',    label:'Assessments',      Icon:FileBarChart  },
      { id:'vendors',       label:'Third-Party Risk', Icon:Building2     },
    ],
  },
  {
    title: 'Operations',
    items: [
      { id:'evidence',    label:'Evidence',       Icon:FileCheck    },
      { id:'policies',    label:'Policies',       Icon:FileText     },
      { id:'audit',       label:'Incidents',      Icon:AlertCircle  },
      { id:'checklist',   label:'Controls',       Icon:CheckSquare  },
      { id:'test-engine', label:'Live Checks',    Icon:Activity     },
      { id:'monitoring',  label:'Monitoring',     Icon:Radio        },
      { id:'ssh',         label:'SSH Servers',    Icon:Terminal     },
    ],
  },
  {
    title: 'Trust',
    items: [
      { id:'trust-center', label:'Trust Center',   Icon:ShieldCheck },
      { id:'executive',    label:'Executive View', Icon:BarChart2   },
      { id:'auditor',      label:'Auditor Portal', Icon:FileCheck   },
      { id:'msp-portal',   label:'MSP Portal',     Icon:Building2   },
    ],
  },
];

/* ─── Sidebar component ──────────────────────────────────────────────────────── */
export default function DarkSidebar({ activeTab, onTabChange, tenantId, userEmail, role }) {
  return (
    <div style={{
      width: 220,
      minWidth: 220,
      background: '#0D0D1C',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      fontFamily: "'DM Sans',sans-serif",
      overflowY: 'auto',
      height: '100%',
    }}>

      {/* ── Logo ── */}
      <div style={{
        padding: '16px 16px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexShrink: 0,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          background: '#7c3aed',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Shield size={14} color="#fff"/>
        </div>
        <span style={{
          fontFamily: "'Syne',sans-serif",
          fontSize: 17, fontWeight: 800,
          color: '#ECEEFF', letterSpacing: '-0.4px',
        }}>AURA</span>
      </div>

      {/* ── Nav ── */}
      <div style={{ flex: 1, paddingTop: 8, overflow: 'auto' }}>
        {SECTIONS.map(sec => (
          <div key={sec.title} style={{ marginBottom: 2 }}>

            {/* Section label */}
            <div style={{
              padding: '8px 16px 4px',
              fontSize: 9,
              color: '#1E1E32',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontWeight: 600,
            }}>
              {sec.title}
            </div>

            {/* Nav items */}
            {sec.items.map(({ id, label, Icon, color }) => {
              const active = activeTab === id;
              const activeColor = color || '#a78bfa';
              return (
                <button key={id} onClick={() => onTabChange(id)} style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: `7px 16px 7px ${active ? '14px' : '16px'}`,
                  background: active ? 'rgba(124,58,237,0.14)' : 'transparent',
                  border: 'none',
                  borderLeft: `2px solid ${active ? activeColor : 'transparent'}`,
                  cursor: 'pointer',
                  color: active ? activeColor : '#4A4A68',
                  fontSize: 12,
                  fontFamily: "'DM Sans',sans-serif",
                  fontWeight: active ? 500 : 400,
                  textAlign: 'left',
                  transition: 'all 0.12s ease',
                  boxSizing: 'border-box',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.color = '#7070A0'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.color = '#4A4A68'; e.currentTarget.style.background = 'transparent'; }}}
                >
                  <Icon
                    size={14}
                    color={active ? activeColor : (color ? `${color}60` : '#3A3A58')}
                    style={{ flexShrink: 0 }}
                  />
                  {label}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* ── Footer / tenant info ── */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4,
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#10B981', flexShrink: 0,
          }}/>
          <span style={{ fontSize: 10, color: '#10B981', fontFamily: "'JetBrains Mono',monospace" }}>
            Live
          </span>
        </div>
        <div style={{ fontSize: 11, color: '#3A3A55', fontFamily: "'JetBrains Mono',monospace", marginBottom: 1 }}>
          {tenantId || 'democorp'}
        </div>
        <div style={{ fontSize: 11, color: '#252540' }}>
          {userEmail || 'ciso@democorp.com'}
        </div>
      </div>
    </div>
  );
}
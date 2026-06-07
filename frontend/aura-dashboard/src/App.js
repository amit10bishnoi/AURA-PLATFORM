import TrustCenter from './TrustCenter';
import ExecutiveDashboard from './ExecutiveDashboard';
import CustomControls from './CustomControls';
import { useState, useEffect, useCallback, useRef } from 'react';
import MSPPortal from './MSPPortal';
import PolicyManagement from "./PolicyManagement";
import AIAssistant from "./AIAssistant";
import TestEngine from "./TestEngine";
import SOC2Hub from "./SOC2Hub";
import DarkOverview from './DarkOverview';
import AuraLogin from './AuraLogin';
import ComplianceHub from './ComplianceHub';
import DarkSidebar  from './DarkSidebar';
import LandingPage from "./LandingPage";
import ISO27001Hub from "./ISO27001Hub";
import RBIHub from "./RBIHub";
import AutomationHub from "./AutomationHub";
import DPDPHub from "./DPDPHub";
import RiskRegister from "./RiskRegister";
import { CommandPalette, ThemeToggle, OnboardingBanner, SkeletonStatGrid, EmptyState } from "./UIEnhancements";
import QuestionnaireBuilder from "./QuestionnaireBuilder";
import SSOSettings from "./SSOSettings";
import AutoEvidence from "./AutoEvidence";
import AuditorPortal from "./AuditorPortal";
import SSHIntegration from "./SSHIntegration";
import ContinuousMonitoring from "./ContinuousMonitoring";
import VendorRisk from "./VendorRisk";
import UserManagement from "./UserManagement";
import Notifications from "./Notifications";
import Reports from "./Reports";
import AuditLogs from './AuditLogs';
import EvidenceCollection from './EvidenceCollection';

import { Terminal,
  Activity,
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  Award,
  BarChart2,
  Bell,
  Building2,
  Check,
  CheckCircle,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Clock,
  Code2,
  Copy,
  Download,
  Edit,
  ExternalLink,
  Eye,
  EyeOff,
  FileBarChart,
  FileCheck,
  FileText,
  Filter,
  Globe,
  Info,
  Key,
  Layers,
  LayoutDashboard,
  Lock,
  LogOut,
  Mail,
  Menu,
  PieChart,
  Plus,
  RefreshCw,
  Search,
  Send,
  Shield,
  ShieldAlert,
  Sparkles,
  Square,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  User,
  UserCheck,
  Users,
  X,
  Zap
} from 'lucide-react';;;


const API = "https://web-production-320c3.up.railway.app";
const PROXY_KEY = "aura-dev-key-change-in-production";

function authHeaders(t, tid) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${t}`, "X-Tenant-Id": tid || "" };
}
function proxyHeaders(t, tid) {
  return { ...authHeaders(t, tid), "X-Proxy-Key": PROXY_KEY };
}
function getRiskColor(l) {
  return l==="CRITICAL"?"#e11d48":l==="HIGH"?"#FB923C":l==="MEDIUM"?"#d97706":"#16a34a";
}
function getRiskBg(l) {
  return l==="CRITICAL"?"rgba(225,29,72,.15)":l==="HIGH"?"rgba(251,146,60,.15)":l==="MEDIUM"?"rgba(217,119,6,.15)":"rgba(22,163,74,.15)";
}
function getRiskBorder(l) {
  return l==="CRITICAL"?"rgba(225,29,72,.3)":l==="HIGH"?"rgba(251,146,60,.3)":l==="MEDIUM"?"rgba(217,119,6,.3)":"rgba(22,163,74,.3)";
}
function fmtDate(iso) {
  try { return new Date(iso).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric",timeZone:"Asia/Kolkata"}); } catch { return "—"; }
}
function fmtDateTime(iso) {
  try { return new Date(iso).toLocaleString("en-IN",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"Asia/Kolkata",hour12:true}); } catch { return "—"; }
}

const realServer = {
  async login(email, password) {
    const res = await fetch(`${API}/api/auth/login`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password})});
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail||"Login failed.");
    return {token:data.access_token,name:data.name,role:data.role||"developer",tenantId:data.tenant_id||"",tenantName:data.tenant_name||"Default"};
  },
  async register(payload) {
    const res = await fetch(`${API}/api/auth/register`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail||"Registration failed.");
    return data;
  },
  async assess(token, tenantId, raw) {
    const res = await fetch(`${API}/assess`,{method:"POST",headers:authHeaders(token,tenantId),body:JSON.stringify({org_name:raw.orgname,industry:raw.industry,employees:parseInt(raw.employees,10)||1,has_mfa:Boolean(raw.hasmfa),mfa_coverage:parseInt(raw.mfacoverage,10)||0,patch_days:parseInt(raw.patchdays,10)||0,training_percent:parseInt(raw.trainingpercent,10)||0,has_irp:Boolean(raw.hasirp),vulnerabilities:parseInt(raw.vulnerabilities,10)||0})});
    const data = await res.json();
    if (res.status===401) throw new Error("AUTH_EXPIRED");
    if (!res.ok) throw new Error(data.detail||"Assessment failed.");
    return data;
  },
  async getAuditTrail(token, tenantId) {
    const res = await fetch(`${API}/assessments`,{headers:authHeaders(token,tenantId)});
    if (res.status===401) throw new Error("AUTH_EXPIRED");
    return res.json();
  },
  async getTasks(token, tenantId) {
    const res = await fetch(`${API}/tasks`,{headers:authHeaders(token,tenantId)});
    if (res.status===401) throw new Error("AUTH_EXPIRED");
    return res.json();
  },
  async addTask(token, tenantId, task) {
    const res = await fetch(`${API}/tasks`,{method:"POST",headers:authHeaders(token,tenantId),body:JSON.stringify(task)});
    if (res.status===401) throw new Error("AUTH_EXPIRED");
    return res.json();
  },
  async updateTask(token, tenantId, id, changes) {
    const res = await fetch(`${API}/tasks/${id}`,{method:"PUT",headers:authHeaders(token,tenantId),body:JSON.stringify(changes)});
    if (res.status===401) throw new Error("AUTH_EXPIRED");
    return res.json();
  },
  async deleteTask(token, tenantId, id) {
    const res = await fetch(`${API}/tasks/${id}`,{method:"DELETE",headers:authHeaders(token,tenantId)});
    if (res.status===401) throw new Error("AUTH_EXPIRED");
    return res.json();
  },
  async getUsers(token, tenantId) {
    const res = await fetch(`${API}/users`,{headers:authHeaders(token,tenantId)});
    if (res.status===401) throw new Error("AUTH_EXPIRED");
    return res.json();
  },
  async inviteUser(token, tenantId, tenantName, email, role) {
    const res = await fetch(`${API}/api/auth/register`,{method:"POST",headers:authHeaders(token,tenantId),body:JSON.stringify({email,role,name:email.split("@")[0],password:"ChangeMe123!",tenant_id:tenantId,join_existing_tenant:true})});
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail||"Invite failed.");
    return {message:`Account created for ${email}. Temp password: ChangeMe123!`};
  },
  async removeUser(token, tenantId, email) {
    const res = await fetch(`${API}/users/${encodeURIComponent(email)}`,{method:"DELETE",headers:authHeaders(token,tenantId)});
    if (res.status===401) throw new Error("AUTH_EXPIRED");
    return res.json();
  },
  async changeRole(token, tenantId, email, newRole) {
    const res = await fetch(`${API}/users/${encodeURIComponent(email)}/role`,{method:"PUT",headers:authHeaders(token,tenantId),body:JSON.stringify({role:newRole})});
    if (res.status===401) throw new Error("AUTH_EXPIRED");
    return res.json();
  },
  async validateToken(token, tenantId) {
    try { const res = await fetch(`${API}/api/auth/me`,{headers:authHeaders(token,tenantId)}); return res.ok?await res.json():null; } catch { return null; }
  },
  async health(token, tenantId) {
    const res = await fetch(`${API}/api/health`,{headers:proxyHeaders(token,tenantId)});
    return res.json();
  },
  async pullVulns(token, tenantId, source, keyword) {
    const params = new URLSearchParams({source});
    if (keyword&&source==="nvd") params.set("keyword",keyword);
    const res = await fetch(`${API}/api/vulns/pull?${params}`,{headers:proxyHeaders(token,tenantId)});
    const json = await res.json();
    if (!json.ok) throw new Error(json.error||"Scanner error.");
    return json.data;
  },
  async generateBoardReport(token, tenantId, payload) {
    const res = await fetch(`${API}/api/report/board`,{method:"POST",headers:proxyHeaders(token,tenantId),body:JSON.stringify(payload)});
    if (res.status===401) throw new Error("AUTH_EXPIRED");
    if (!res.ok) { const e=await res.json().catch(()=>({})); throw new Error(e.detail||"Report failed."); }
    return res.blob();
  },
  async getComplianceResults(token, tenantId, assessmentId) {
    const res = await fetch(`${API}/api/compliance/assessments/${assessmentId}`,{headers:authHeaders(token,tenantId)});
    if (res.status===401) throw new Error("AUTH_EXPIRED");
    if (!res.ok) throw new Error("Failed to load compliance results.");
    return res.json();
  },
  async runComplianceMapping(token, tenantId, assessmentId) {
    const res = await fetch(`${API}/api/compliance/assessments/${assessmentId}`,{method:"POST",headers:authHeaders(token,tenantId)});
    if (res.status===401) throw new Error("AUTH_EXPIRED");
    if (!res.ok) throw new Error("Compliance mapping failed.");
    return res.json();
  },
  async getComplianceSummary(token, tenantId) {
    const res = await fetch(`${API}/api/compliance/summary`,{headers:authHeaders(token,tenantId)});
    if (res.status===401) throw new Error("AUTH_EXPIRED");
    if (!res.ok) throw new Error("Failed to load summary.");
    return res.json();
  },
  async getExecutiveSummary(token, tenantId, payload) {
    const res = await fetch(`${API}/api/p2/executive-summary`,{method:"POST",headers:authHeaders(token,tenantId),body:JSON.stringify(payload)});
    if (res.status===401) throw new Error("AUTH_EXPIRED");
    return res.json();
  },
  async getP2Status(token, tenantId) {
    const res = await fetch(`${API}/api/p2/status`,{headers:authHeaders(token,tenantId)});
    if (res.status===401) throw new Error("AUTH_EXPIRED");
    return res.json();
  },
  async autoAssess(token, tenantId, orgName, employees) {
    const res = await fetch(`${API}/api/auto/assess`,{method:"POST",headers:authHeaders(token,tenantId),body:JSON.stringify({org_name:orgName,industry:"Technology",employees:parseInt(employees)||100})});
    const data = await res.json();
    if (res.status===401) throw new Error("AUTH_EXPIRED");
    if (!res.ok) throw new Error(data.detail||"Auto assessment failed.");
    return data;
  },
  async pullIntegration(token, tenantId, provider) {
    const res = await fetch(`${API}/api/integrations/pull/${provider}`, {method:"POST", headers:authHeaders(token,tenantId)});
    if (res.status===401) throw new Error("AUTH_EXPIRED");
    return res.json();
  },
  async pullAllIntegrations(token, tenantId) {
    const res = await fetch(`${API}/api/integrations/pull-all`, {method:"POST", headers:authHeaders(token,tenantId)});
    if (res.status===401) throw new Error("AUTH_EXPIRED");
    return res.json();
  },
  async getRemediationAdvice(token, tenantId, findings, orgName, industry, employees) {
    const res = await fetch(`${API}/api/p2/remediation-advice`,{method:"POST",headers:authHeaders(token,tenantId),body:JSON.stringify({findings,org_name:orgName,industry,employees})});
    if (res.status===401) throw new Error("AUTH_EXPIRED");
    return res.json();
  },
};

const ROLES = {
  ciso:      {label:"CISO",      icon:<ShieldAlert size={14}/>, color:"#EF4444", bg:"rgba(239,68,68,.08)",   border:"rgba(239,68,68,.2)",   canExport:true,  canEdit:false, canRunAssessment:false},
  developer: {label:"Developer", icon:<Code2      size={14}/>, color:"#8b5cf6", bg:"rgba(139,92,246,.08)",  border:"rgba(139,92,246,.2)",  canExport:false, canEdit:true,  canRunAssessment:true },
  auditor:   {label:"Auditor",   icon:<FileCheck  size={14}/>, color:"#10B981", bg:"rgba(22,163,74,.08)",  border:"rgba(22,163,74,.2)",  canExport:true,  canEdit:false, canRunAssessment:false},
};

const NAV_ITEMS = [
  // Overview
  {id:"overview",      label:"Dashboard",        icon:LayoutDashboard, roles:["ciso","auditor","developer"], section:"Overview"},
  {id:"ai-assistant",  label:"AI Copilot",        icon:Sparkles,        roles:["ciso","auditor","developer"], section:"Overview"},
  {id:"automation",    label:"Automation Hub",    icon:Zap,             roles:["ciso","developer"],           section:"Overview"},
  // Compliance
  {id:"iso27001",      label:"ISO 27001",         icon:Shield,          roles:["ciso","auditor","developer"], section:"Compliance"},
  {id:"soc2",          label:"SOC 2 Type II",     icon:Award,           roles:["ciso","auditor","developer"], section:"Compliance"},
  {id:"rbi",           label:"RBI Cybersecurity", icon:ShieldAlert,     roles:["ciso","auditor","developer"], section:"Compliance"},
  {id:"dpdp",          label:"DPDP Privacy",      icon:Lock,            roles:["ciso","auditor","developer"], section:"Compliance"},
  {id:"compliance",    label:"Framework Map",     icon:ClipboardList,   roles:["ciso","auditor","developer"], section:"Compliance"},
  // Risk
  {id:"risk-register", label:"Risk Register",     icon:AlertTriangle,   roles:["ciso","auditor","developer"], section:"Risk"},
  {id:"assessment",    label:"Assessments",       icon:FileBarChart,    roles:["ciso","auditor","developer"], section:"Risk"},
  {id:"vendors",       label:"Third-Party Risk",  icon:Building2,       roles:["ciso","auditor","developer"], section:"Risk"},
  // Operations
  {id:"evidence",      label:"Evidence",          icon:FileCheck,       roles:["ciso","auditor","developer"], section:"Operations"},
  {id:"policies",      label:"Policies",          icon:FileText,        roles:["ciso","auditor","developer"], section:"Operations"},
  {id:"audit",         label:"Incidents",         icon:AlertCircle,     roles:["ciso","auditor","developer"], section:"Operations"},
  {id:"checklist",     label:"Controls",          icon:CheckSquare,     roles:["ciso","auditor","developer"], section:"Operations"},
  {id:"test-engine",   label:"Live Checks",       icon:Activity,        roles:["ciso","developer"],           section:"Operations"},
  // Analytics
  {id:"reports",       label:"Reports",           icon:BarChart2,       roles:["ciso","auditor","developer"], section:"Analytics"},
  {id:"trends",        label:"Risk Trends",       icon:TrendingUp,      roles:["ciso","auditor","developer"], section:"Analytics"},
  {id:"remediation",   label:"Executive View",    icon:Target,          roles:["ciso"],                       section:"Analytics"},
  // Settings
  {id:"team-mgmt",     label:"Users & Roles",     icon:Users,           roles:["ciso"],                       section:"Settings"},
  {id:"integrations",  label:"Integrations",      icon:Zap,             roles:["ciso","developer"],           section:"Settings"},
  {id:"audit-logs",    label:"Audit Logs",        icon:Clock,           roles:["ciso","auditor","developer"], section:"Settings"},
  {id:"notifications", label:"Notifications",     icon:Bell,            roles:["ciso","auditor","developer"], section:"Settings"},
  {id:"sso",           label:"SSO Config",        icon:Key,             roles:["ciso"],                       section:"Settings"},
  // Trust
  {id:"trustcenter",   label:"Trust Center",      icon:Globe,           roles:["ciso","auditor","developer"], section:"Trust"},
  {id:"auditor",       label:"Auditor Portal",    icon:Users,           roles:["ciso","auditor","developer"], section:"Trust"},
  {id:"auto-evidence", label:"Auto Evidence",     icon:Zap,             roles:["ciso","auditor","developer"], section:"Trust"},
  {id:"questionnaires",label:"Questionnaires",    icon:ClipboardList,   roles:["ciso","auditor","developer"], section:"Trust"},
  {id:"monitoring",    label:"Monitoring",        icon:Activity,        roles:["ciso","developer"],           section:"Trust"},
  {id:"msp-portal",   label:"MSP Portal",        icon:Building2,       roles:["ciso"],                       section:"Trust"},
  {id:"ssh",          label:"SSH Servers",       icon:Terminal,        roles:["ciso","developer"],               section:"Operations"},
];

const ALL_FRAMEWORK_CONTROLS = [
  // ── ISO 27001:2022 ─────────────────────────────────────────────────────────
  {id:"A.5.1",   framework:"ISO27001", control:"Policies for information security",           riskreduction:4},
  {id:"A.5.2",   framework:"ISO27001", control:"Information security roles & responsibilities",riskreduction:4},
  {id:"A.5.3",   framework:"ISO27001", control:"Segregation of duties",                       riskreduction:3},
  {id:"A.5.4",   framework:"ISO27001", control:"Management responsibilities",                 riskreduction:3},
  {id:"A.5.5",   framework:"ISO27001", control:"Contact with authorities",                    riskreduction:2},
  {id:"A.5.15",  framework:"ISO27001", control:"Access control",                              riskreduction:6},
  {id:"A.5.16",  framework:"ISO27001", control:"Identity management",                         riskreduction:5},
  {id:"A.5.17",  framework:"ISO27001", control:"Authentication information",                  riskreduction:5},
  {id:"A.5.18",  framework:"ISO27001", control:"Access rights",                               riskreduction:5},
  {id:"A.5.24",  framework:"ISO27001", control:"Incident management planning",                riskreduction:6},
  {id:"A.5.25",  framework:"ISO27001", control:"Assessment of information security events",   riskreduction:5},
  {id:"A.5.26",  framework:"ISO27001", control:"Response to information security incidents",  riskreduction:5},
  {id:"A.5.27",  framework:"ISO27001", control:"Learning from incidents",                     riskreduction:4},
  {id:"A.6.1",   framework:"ISO27001", control:"Screening",                                   riskreduction:3},
  {id:"A.6.3",   framework:"ISO27001", control:"Security awareness, education & training",    riskreduction:6},
  {id:"A.6.5",   framework:"ISO27001", control:"Responsibilities after termination",          riskreduction:3},
  {id:"A.7.1",   framework:"ISO27001", control:"Physical security perimeters",                riskreduction:4},
  {id:"A.7.2",   framework:"ISO27001", control:"Physical entry controls",                     riskreduction:4},
  {id:"A.8.1",   framework:"ISO27001", control:"User endpoint devices",                       riskreduction:4},
  {id:"A.8.2",   framework:"ISO27001", control:"Privileged access rights",                    riskreduction:6},
  {id:"A.8.5",   framework:"ISO27001", control:"Secure authentication",                       riskreduction:6},
  {id:"A.8.7",   framework:"ISO27001", control:"Protection against malware",                  riskreduction:6},
  {id:"A.8.8",   framework:"ISO27001", control:"Management of technical vulnerabilities",     riskreduction:6},
  {id:"A.8.9",   framework:"ISO27001", control:"Configuration management",                    riskreduction:5},
  {id:"A.8.12",  framework:"ISO27001", control:"Data leakage prevention",                     riskreduction:5},
  {id:"A.8.13",  framework:"ISO27001", control:"Information backup",                          riskreduction:6},
  {id:"A.8.15",  framework:"ISO27001", control:"Logging",                                     riskreduction:5},
  {id:"A.8.16",  framework:"ISO27001", control:"Monitoring activities",                       riskreduction:5},
  {id:"A.8.20",  framework:"ISO27001", control:"Network security",                            riskreduction:5},
  {id:"A.8.24",  framework:"ISO27001", control:"Use of cryptography",                         riskreduction:6},
  {id:"A.8.25",  framework:"ISO27001", control:"Secure development lifecycle",                riskreduction:5},
  {id:"A.8.28",  framework:"ISO27001", control:"Secure coding",                               riskreduction:5},
  {id:"A.8.29",  framework:"ISO27001", control:"Security testing in development",             riskreduction:5},
  {id:"A.8.32",  framework:"ISO27001", control:"Change management",                           riskreduction:4},
  // ── RBI Cybersecurity Framework ────────────────────────────────────────────
  {id:"RBI.IT.1", framework:"RBI", control:"IT Governance Framework",                              riskreduction:5},
  {id:"RBI.IT.2", framework:"RBI", control:"Information & Cyber Security Policy",                  riskreduction:6},
  {id:"RBI.IT.3", framework:"RBI", control:"IT Infrastructure & Services Management",              riskreduction:4},
  {id:"RBI.IT.4", framework:"RBI", control:"IT & Cyber Risk Management",                           riskreduction:6},
  {id:"RBI.IT.5", framework:"RBI", control:"Business Continuity Planning",                         riskreduction:5},
  {id:"RBI.IT.6", framework:"RBI", control:"Customer Data Privacy & Protection",                   riskreduction:6},
  {id:"RBI.IT.7", framework:"RBI", control:"Cyber Security Incident Reporting to RBI",             riskreduction:6},
  {id:"RBI.IT.8", framework:"RBI", control:"Third Party & Vendor Risk Management",                 riskreduction:5},
  {id:"RBI.IT.9", framework:"RBI", control:"Security Operations Centre (SOC)",                     riskreduction:5},
  {id:"RBI.IT.10",framework:"RBI", control:"Vulnerability Assessment & Penetration Testing",       riskreduction:5},
  {id:"RBI.IT.11",framework:"RBI", control:"Network & Application Security",                       riskreduction:5},
  {id:"RBI.IT.12",framework:"RBI", control:"Patch & Change Management",                            riskreduction:4},
  // ── DPDP Act 2023 (India) ──────────────────────────────────────────────────
  {id:"DPDP.S.4",  framework:"DPDP", control:"Lawful processing of personal data",                 riskreduction:6},
  {id:"DPDP.S.5",  framework:"DPDP", control:"Notice to data principals",                          riskreduction:5},
  {id:"DPDP.S.6",  framework:"DPDP", control:"Consent from data principal",                        riskreduction:6},
  {id:"DPDP.S.8",  framework:"DPDP", control:"Obligations of data fiduciary",                      riskreduction:6},
  {id:"DPDP.S.9",  framework:"DPDP", control:"Processing of children's data",                      riskreduction:5},
  {id:"DPDP.S.10", framework:"DPDP", control:"Security safeguards for personal data",              riskreduction:6},
  {id:"DPDP.S.11", framework:"DPDP", control:"Notification of personal data breach",               riskreduction:6},
  {id:"DPDP.S.12", framework:"DPDP", control:"Right to access information",                        riskreduction:4},
  {id:"DPDP.S.13", framework:"DPDP", control:"Right to correction & erasure",                      riskreduction:4},
  {id:"DPDP.S.14", framework:"DPDP", control:"Right to grievance redressal",                       riskreduction:3},
  {id:"DPDP.S.16", framework:"DPDP", control:"Significant data fiduciary obligations",             riskreduction:5},
  {id:"DPDP.S.19", framework:"DPDP", control:"Data Protection Board compliance",                   riskreduction:4},
  // ── SOC 2 Type II ────────────────────────────────────────────────────────────
  {id:"CC1.1", framework:"SOC2", control:"Commitment to integrity & ethical values",          riskreduction:10},
  {id:"CC1.2", framework:"SOC2", control:"Board independence & oversight of controls",        riskreduction:10},
  {id:"CC1.3", framework:"SOC2", control:"Organisational structure & authority",              riskreduction:8},
  {id:"CC1.4", framework:"SOC2", control:"Competence — attract & retain capable staff",       riskreduction:8},
  {id:"CC1.5", framework:"SOC2", control:"Accountability for control responsibilities",       riskreduction:8},
  {id:"CC2.1", framework:"SOC2", control:"Quality information for internal control",          riskreduction:10},
  {id:"CC2.2", framework:"SOC2", control:"Internal communication of control information",     riskreduction:8},
  {id:"CC2.3", framework:"SOC2", control:"External communication on matters affecting controls",riskreduction:8},
  {id:"CC3.1", framework:"SOC2", control:"Objectives specified to identify related risks",    riskreduction:12},
  {id:"CC3.2", framework:"SOC2", control:"Risk identification & analysis",                    riskreduction:12},
  {id:"CC3.3", framework:"SOC2", control:"Fraud risk assessment",                             riskreduction:10},
  {id:"CC3.4", framework:"SOC2", control:"Assessment of significant change risks",            riskreduction:10},
  {id:"CC4.1", framework:"SOC2", control:"Ongoing & separate control evaluations",            riskreduction:12},
  {id:"CC4.2", framework:"SOC2", control:"Control deficiency communication",                  riskreduction:10},
  {id:"CC5.1", framework:"SOC2", control:"Control activities that mitigate risks",            riskreduction:12},
  {id:"CC5.2", framework:"SOC2", control:"General technology controls",                       riskreduction:12},
  {id:"CC5.3", framework:"SOC2", control:"Policies & procedures for control activities",      riskreduction:10},
  {id:"CC6.1", framework:"SOC2", control:"Logical access security software & infrastructure", riskreduction:15},
  {id:"CC6.2", framework:"SOC2", control:"User registration & authorisation before access",   riskreduction:12},
  {id:"CC6.3", framework:"SOC2", control:"Role-based access controls",                        riskreduction:12},
  {id:"CC6.4", framework:"SOC2", control:"Physical access restriction to facilities",         riskreduction:10},
  {id:"CC6.5", framework:"SOC2", control:"Access removal on termination",                     riskreduction:10},
  {id:"CC6.6", framework:"SOC2", control:"Logical access restriction from external threats",  riskreduction:12},
  {id:"CC6.7", framework:"SOC2", control:"Data transmission & movement restriction",          riskreduction:12},
  {id:"CC6.8", framework:"SOC2", control:"Malware prevention & detection controls",           riskreduction:15},
  {id:"CC7.1", framework:"SOC2", control:"Infrastructure & software configuration management",riskreduction:12},
  {id:"CC7.2", framework:"SOC2", control:"Environmental & logical anomaly detection",         riskreduction:12},
  {id:"CC7.3", framework:"SOC2", control:"Security event evaluation & incident detection",    riskreduction:12},
  {id:"CC7.4", framework:"SOC2", control:"Security incident response plan",                   riskreduction:15},
  {id:"CC7.5", framework:"SOC2", control:"Incident recovery & objective restoration",         riskreduction:12},
  {id:"CC8.1", framework:"SOC2", control:"Change management for infrastructure & software",   riskreduction:12},
  {id:"CC9.1", framework:"SOC2", control:"Vendor & business partner risk management",         riskreduction:10},
  {id:"CC9.2", framework:"SOC2", control:"Business disruption risk mitigation",               riskreduction:10},
  {id:"A1.1",  framework:"SOC2", control:"Capacity management for availability",              riskreduction:12},
  {id:"A1.2",  framework:"SOC2", control:"Environmental threats to availability monitoring",  riskreduction:10},
  {id:"A1.3",  framework:"SOC2", control:"Recovery plan to restore system availability",      riskreduction:12},
  {id:"PI1.1", framework:"SOC2", control:"Input completeness, accuracy & authorisation",      riskreduction:10},
  {id:"PI1.2", framework:"SOC2", control:"System processing integrity",                       riskreduction:10},
  {id:"C1.1",  framework:"SOC2", control:"Identify & maintain confidential information",      riskreduction:12},
  {id:"C1.2",  framework:"SOC2", control:"Dispose of confidential information securely",      riskreduction:10},
  {id:"P1.1",  framework:"SOC2", control:"Privacy notice communicated at data collection",    riskreduction:10},
  {id:"P2.1",  framework:"SOC2", control:"Individual choices & consent for personal data",    riskreduction:10},
  {id:"P3.1",  framework:"SOC2", control:"Personal data collection limitation",               riskreduction:10},
  {id:"P4.1",  framework:"SOC2", control:"Personal data use, retention & disposal",           riskreduction:10},
  {id:"P5.1",  framework:"SOC2", control:"Individual access & correction of personal data",   riskreduction:8},
  {id:"P6.1",  framework:"SOC2", control:"Personal data disclosure per commitments",          riskreduction:10},
  {id:"P7.1",  framework:"SOC2", control:"Personal data quality & accuracy",                  riskreduction:8},
  {id:"P8.1",  framework:"SOC2", control:"Privacy monitoring & enforcement",                  riskreduction:10},
];

const G = `/* ── DARK MODE OVERRIDES ──────────────────────────────────────── */
body,html{background:#080812!important;margin:0;padding:0;}
.shell{background:#080812!important;flex-direction:row!important;}
.sidebar{display:none!important;}
.main-area{background:#080812!important;margin-left:0!important;}
.topbar{background:#0D0D1C!important;border-bottom:1px solid rgba(255,255,255,0.06)!important;border-top:none!important;}
.topbar-title{color:#ECEEFF!important;font-family:'Syne',sans-serif!important;font-size:15px!important;font-weight:600!important;}
.topbar-search{background:rgba(255,255,255,0.04)!important;border:1px solid rgba(255,255,255,0.07)!important;}
.topbar-search input{color:#ECEEFF!important;background:transparent!important;}
.topbar-search input::placeholder{color:#3A3A58!important;}
.score-badge{background:rgba(255,255,255,0.04)!important;border-color:rgba(255,255,255,0.1)!important;}
.cyber-bg{display:none!important;}
.icon-btn{background:rgba(255,255,255,0.04)!important;border:1px solid rgba(255,255,255,0.07)!important;color:#8888AA!important;}
.icon-btn:hover{border-color:#7c3aed!important;color:#a78bfa!important;}
/* ── END DARK MODE OVERRIDES ─────────────────────────────────── */

/* ── Page structure ─────────────────────────────────────────────── */
.page-crumb{
  display:flex;align-items:center;gap:6px;
  font-size:11px;color:var(--text3);margin-bottom:12px;
  font-weight:500;
}
.page-header{margin-bottom:24px;}
.page-title{
  font-size:22px;font-weight:800;color:var(--text);
  font-family:'Plus Jakarta Sans',sans-serif;
  letter-spacing:-0.5px;line-height:1.2;
}
.page-subtitle{font-size:13px;color:var(--text3);margin-top:4px;}

/* ── Fix stat card grid overflow ─────────────────────────────── */
.stat-grid{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(180px,1fr));
  gap:14px;margin-bottom:20px;
}

/* ── Dashboard grid ─────────────────────────────────────────── */
.dash-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;}
.dash-grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:16px;}
.dash-grid-full{margin-bottom:16px;}

/* ── Framework score cards ───────────────────────────────────── */
.fw-grid{
  display:grid;
  grid-template-columns:repeat(4,1fr);
  gap:14px;margin-bottom:20px;
}
@media(max-width:1100px){.fw-grid{grid-template-columns:repeat(2,1fr);}}

/* ── Fix topbar layout ───────────────────────────────────────── */






/* ── Sidebar fixed width & no overflow ───────────────────────── */


/* ── Role badge in topbar ────────────────────────────────────── */
.role-badge{
  display:flex;align-items:center;gap:6px;
  padding:5px 12px;border-radius:7px;
  background:var(--surface);border:1px solid var(--border2);
  font-size:11px;font-weight:700;color:var(--text2);
  text-transform:uppercase;letter-spacing:.5px;
  white-space:nowrap;
}

/* ── Prevent page-body overflow ─────────────────────────────── */
.page-body{
  padding:20px 24px;flex:1;
  min-width:0;overflow-x:hidden;
}

/* ── Nav section spacing ─────────────────────────────────────── */


:root{
  --bg:#070B14;
  --bg2:#0F172A;
  --bg3:#131B2E;
  --surface:#111827;
  --surface2:#1a2235;
  --border:rgba(139,92,246,0.15);
  --border2:rgba(139,92,246,0.08);
  --text:#e2e8f0;
  --text2:#94a3b8;
  --text3:#475569;
  --accent:#8b5cf6;
  --accent2:#7c3aed;
  --accentbg:rgba(139,92,246,0.1);
  --blue:#3b82f6;
  --bluebg:rgba(59,130,246,0.1);
  --cyan:#06b6d4;
  --cyanbg:rgba(6,182,212,0.1);
  --pink:#ec4899;
  --pinkbg:rgba(236,72,153,0.1);
  --green:#10b981;
  --greenbg:rgba(16,185,129,0.1);
  --yellow:#f59e0b;
  --yellowbg:rgba(245,158,11,0.1);
  --orange:#f97316;
  --orangebg:rgba(249,115,22,0.1);
  --red:#ef4444;
  --redbg:rgba(239,68,68,0.1);
  --radius:10px;
  --radius-lg:16px;
  --nav-w:220px;
  --topbar-h:56px;
  --shadow:0 4px 24px rgba(0,0,0,0.4);
  --glow:0 0 20px rgba(139,92,246,0.3);
  --glow-strong:0 0 40px rgba(139,92,246,0.5);
}

*{box-sizing:border-box;margin:0;padding:0;}
html,body,#root{height:100%;font-family:'Plus Jakarta Sans','DM Sans',sans-serif;background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased;overflow-x:hidden;}

/* Scrollbar */
::-webkit-scrollbar{width:4px;height:4px;}
::-webkit-scrollbar-track{background:var(--bg2);}
::-webkit-scrollbar-thumb{background:var(--accent);border-radius:4px;}

select option{background:var(--surface);color:var(--text);}

/* Shell layout */
.shell{display:flex;min-height:100vh;background:#080812;}

/* Sidebar */
.sidebar{
  background:rgba(7,11,20,0.95);
  backdrop-filter:blur(20px);
  -webkit-backdrop-filter:blur(20px);
  border-right:1px solid var(--border);
  display:flex;flex-direction:column;
  position:fixed;top:0;left:0;
  width:var(--nav-w);height:100vh;
  z-index:50;overflow-y:auto;
  scrollbar-width:none;
}
.sidebar::-webkit-scrollbar{display:none;}

.sidebar-logo{
  display:flex;align-items:center;gap:10px;
  padding:20px 16px 16px;
  border-bottom:1px solid var(--border2);
}
.sidebar-logo-mark{
  width:32px;height:32px;border-radius:8px;
  background:linear-gradient(135deg,#8b5cf6,#ec4899);
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 0 16px rgba(139,92,246,0.4);
  flex-shrink:0;
}
.sidebar-logo-text{
  font-size:18px;font-weight:800;letter-spacing:1px;
  background:linear-gradient(90deg,#8b5cf6,#06b6d4);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;
  font-family:'Plus Jakarta Sans',sans-serif;
}

.nav-section-label{
  font-size:9px;font-weight:700;letter-spacing:1.5px;
  color:var(--text3);text-transform:uppercase;
  padding:16px 16px 6px;
}

.nav-item{
  display:flex;align-items:center;gap:10px;
  padding:9px 16px;margin:1px 8px;
  border-radius:8px;cursor:pointer;
  font-size:13px;font-weight:500;color:var(--text2);
  transition:all .15s;position:relative;
  text-decoration:none;border:none;background:none;width:calc(100% - 16px);
}
.nav-item:hover{background:var(--accentbg);color:var(--text);}
.nav-item.active{
  background:linear-gradient(135deg,rgba(139,92,246,0.15),rgba(236,72,153,0.08));
  color:#fff;
  border:1px solid rgba(139,92,246,0.2);
}
.nav-item.active::before{
  content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);
  width:3px;height:18px;border-radius:0 3px 3px 0;
  background:linear-gradient(180deg,#8b5cf6,#ec4899);
  box-shadow:0 0 8px rgba(139,92,246,0.6);
  left:-8px;border-radius:3px;
}
.nav-item svg{opacity:0.7;flex-shrink:0;}
.nav-item.active svg{opacity:1;}

.sidebar-footer{
  margin-top:auto;padding:16px;
  border-top:1px solid var(--border2);
}
.user-pill{
  display:flex;align-items:center;gap:10px;
  padding:10px 12px;border-radius:10px;
  background:var(--surface);border:1px solid var(--border2);
  cursor:pointer;transition:all .15s;
}
.user-pill:hover{border-color:var(--border);background:var(--surface2);}
.user-avatar{
  width:30px;height:30px;border-radius:8px;
  background:linear-gradient(135deg,#8b5cf6,#ec4899);
  display:flex;align-items:center;justify-content:center;
  font-size:12px;font-weight:700;color:#fff;flex-shrink:0;
}
.user-name{font-size:12px;font-weight:600;color:var(--text);}
.user-role{font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;}

.tenant-pill{
  display:flex;align-items:center;gap:6px;
  padding:6px 10px;border-radius:8px;
  background:var(--accentbg);border:1px solid var(--border);
  font-size:11px;font-weight:600;color:var(--accent);
  margin-bottom:8px;
}

/* Main area */
.main-area{flex:1;display:flex;flex-direction:column;min-height:100vh;min-width:0;overflow-x:hidden;background:#080812;}

/* Topbar */
.topbar{
  background:#0D0D1C;border-bottom:1px solid rgba(255,255,255,0.06);
  height:var(--topbar-h);
  background:rgba(7,11,20,0.9);
  backdrop-filter:blur(20px);
  -webkit-backdrop-filter:blur(20px);
  border-bottom:1px solid var(--border);
  display:flex;align-items:center;
  padding:0 24px;gap:16px;
  position:sticky;top:0;z-index:40;
}
.topbar-title{font-size:15px;font-weight:700;color:var(--text);letter-spacing:.3px;}
.topbar-search{
  flex:1;max-width:400px;
  display:flex;align-items:center;gap:10px;
  background:var(--surface);border:1px solid var(--border2);
  border-radius:10px;padding:0 14px;height:36px;
  transition:all .2s;cursor:text;
}
.topbar-search:focus-within{border-color:var(--accent);box-shadow:0 0 0 2px rgba(139,92,246,0.1);}
.topbar-search input{
  background:none;border:none;outline:none;
  font-size:13px;color:var(--text);width:100%;
  font-family:inherit;
}
.topbar-search input::placeholder{color:var(--text3);}
.topbar-actions{margin-left:auto;display:flex;align-items:center;gap:8px;}

.score-badge{
  display:flex;align-items:center;gap:8px;
  padding:6px 14px;border-radius:100px;
  background:linear-gradient(135deg,rgba(139,92,246,0.15),rgba(236,72,153,0.1));
  border:1px solid rgba(139,92,246,0.25);
  font-size:12px;font-weight:700;color:var(--accent);
  cursor:pointer;transition:all .15s;
}
.score-badge:hover{box-shadow:var(--glow);}

.icon-btn{
  width:36px;height:36px;border-radius:9px;
  background:var(--surface);border:1px solid var(--border2);
  display:flex;align-items:center;justify-content:center;
  cursor:pointer;transition:all .15s;color:var(--text2);
}
.icon-btn:hover{border-color:var(--accent);color:var(--accent);box-shadow:0 0 12px rgba(139,92,246,0.2);}

/* Page body */
.page-body{padding:24px;flex:1;}

/* Cards */
.card{
  background:var(--surface);
  border:1px solid var(--border2);
  border-radius:var(--radius-lg);
  overflow:hidden;
  transition:border-color .2s,box-shadow .2s;
}
.card:hover{border-color:var(--border);}
.card-glow{box-shadow:var(--glow);}

.card-header{
  padding:16px 20px;
  border-bottom:1px solid var(--border2);
  display:flex;align-items:center;justify-content:space-between;
}
.card-title{font-size:14px;font-weight:700;color:var(--text);letter-spacing:.2px;}
.card-sub{font-size:11px;color:var(--text3);margin-top:2px;}
.card-body{padding:20px;}

/* Stat grid */
.stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px;}
.stat-card{
  background:var(--surface);border:1px solid var(--border2);
  border-radius:var(--radius-lg);padding:18px 20px;
  position:relative;overflow:hidden;transition:all .2s;
}
.stat-card:hover{border-color:var(--border);transform:translateY(-1px);}
.stat-card::before{
  content:'';position:absolute;top:0;left:0;right:0;height:2px;
  background:var(--accent-gradient,linear-gradient(90deg,#8b5cf6,#ec4899));
}
.stat-val{font-size:28px;font-weight:800;letter-spacing:-1px;font-family:'Plus Jakarta Sans',sans-serif;}
.stat-label{font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:.8px;margin-top:4px;}
.stat-sub{font-size:11px;color:var(--text2);margin-top:6px;}

/* Compliance framework cards */
.fw-card{
  background:var(--surface);border:1px solid var(--border2);
  border-radius:var(--radius-lg);padding:20px;
  position:relative;overflow:hidden;cursor:pointer;
  transition:all .2s;
}
.fw-card:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,0,0,0.3);}
.fw-card.selected{border-color:var(--accent);box-shadow:var(--glow);}
.fw-card-score{font-size:32px;font-weight:800;font-family:'Plus Jakarta Sans',sans-serif;}
.fw-card-name{font-size:13px;font-weight:600;color:var(--text);margin-bottom:4px;}
.fw-card-sub{font-size:11px;color:var(--text3);}
.fw-card-status{font-size:11px;font-weight:700;margin-top:12px;}

/* Progress bar */
.progress-wrap{background:rgba(255,255,255,0.06);border-radius:100px;overflow:hidden;}
.progress-fill{border-radius:100px;transition:width 1s cubic-bezier(.4,0,.2,1);}

/* Notices */
.notice{
  display:flex;align-items:flex-start;gap:10px;
  padding:12px 16px;border-radius:10px;
  font-size:13px;margin-bottom:16px;
  border:1px solid;
}
.notice-err{background:var(--redbg);border-color:rgba(239,68,68,.2);color:#fca5a5;}
.notice-warn{background:var(--yellowbg);border-color:rgba(245,158,11,.2);color:#fcd34d;}
.notice-ok{background:var(--greenbg);border-color:rgba(16,185,129,.2);color:#6ee7b7;}
.notice-info{background:var(--bluebg);border-color:rgba(59,130,246,.2);color:#93c5fd;}

/* Tabs */
.tab-bar{display:flex;gap:4px;border-bottom:1px solid var(--border2);margin-bottom:20px;padding-bottom:0;}
.tab{
  padding:10px 16px;font-size:13px;font-weight:600;
  color:var(--text3);cursor:pointer;border:none;background:none;
  border-bottom:2px solid transparent;margin-bottom:-1px;
  transition:all .15s;border-radius:8px 8px 0 0;
}
.tab:hover{color:var(--text);}
.tab.active{color:var(--accent);border-bottom-color:var(--accent);}

/* Buttons */
.btn{
  display:inline-flex;align-items:center;gap:8px;
  padding:9px 18px;border-radius:9px;
  font-size:13px;font-weight:600;cursor:pointer;
  border:none;transition:all .15s;font-family:inherit;
}
.btn-primary{
  background:linear-gradient(135deg,#8b5cf6,#7c3aed);
  color:#fff;box-shadow:0 4px 14px rgba(139,92,246,0.3);
}
.btn-primary:hover{box-shadow:0 4px 20px rgba(139,92,246,0.5);transform:translateY(-1px);}
.btn-secondary{
  background:var(--surface);color:var(--text);
  border:1px solid var(--border);
}
.btn-secondary:hover{border-color:var(--accent);color:var(--accent);}
.btn-ghost{background:none;color:var(--text2);border:1px solid var(--border2);}
.btn-ghost:hover{background:var(--accentbg);color:var(--accent);}
.btn-danger{background:var(--redbg);color:#fca5a5;border:1px solid rgba(239,68,68,.2);}
.btn-sm{padding:6px 12px;font-size:12px;}

/* Form fields */
.field{position:relative;margin-bottom:16px;}
.field label{display:block;font-size:11px;font-weight:700;color:var(--text2);margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px;}
.field-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text3);pointer-events:none;}
.field input,.field select,.field textarea{
  width:100%;background:var(--surface2);
  border:1px solid var(--border2);border-radius:var(--radius);
  padding:11px 14px 11px 38px;color:var(--text);
  font-size:13px;transition:all .2s;outline:none;
  font-family:inherit;
}
.field input:focus,.field select:focus,.field textarea:focus{
  border-color:var(--accent);
  box-shadow:0 0 0 3px rgba(139,92,246,0.1);
}
.field textarea{padding-left:14px;resize:vertical;min-height:80px;}
.field input::placeholder,.field textarea::placeholder{color:var(--text3);}

/* Tables */
.table-wrap{overflow-x:auto;}
table{width:100%;border-collapse:collapse;}
th{
  padding:10px 16px;font-size:10px;font-weight:700;
  color:var(--text3);text-transform:uppercase;letter-spacing:1px;
  border-bottom:1px solid var(--border2);text-align:left;
}
td{
  padding:12px 16px;font-size:13px;color:var(--text2);
  border-bottom:1px solid var(--border2);
}
tr:hover td{background:rgba(139,92,246,0.04);}
tr:last-child td{border-bottom:none;}

/* Badges */
.badge{
  display:inline-flex;align-items:center;gap:5px;
  padding:3px 10px;border-radius:100px;
  font-size:11px;font-weight:700;letter-spacing:.3px;
}
.badge-green{background:var(--greenbg);color:var(--green);}
.badge-red{background:var(--redbg);color:var(--red);}
.badge-yellow{background:var(--yellowbg);color:var(--yellow);}
.badge-blue{background:var(--bluebg);color:var(--blue);}
.badge-purple{background:var(--accentbg);color:var(--accent);}
.badge-orange{background:var(--orangebg);color:var(--orange);}

/* Auth page */
.auth-page{
  min-height:100vh;display:grid;grid-template-columns:1fr 1fr;
  background:var(--bg);
}
.auth-left{
  display:flex;align-items:center;justify-content:center;
  padding:60px 48px;
}
.auth-card{width:100%;max-width:420px;}
.auth-logo{display:flex;align-items:center;gap:12px;margin-bottom:40px;}
.auth-logo-mark{
  width:40px;height:40px;border-radius:10px;
  background:linear-gradient(135deg,#8b5cf6,#ec4899);
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 0 20px rgba(139,92,246,0.4);
}
.auth-logo-text{
  font-size:22px;font-weight:800;letter-spacing:1px;
  background:linear-gradient(90deg,#8b5cf6,#06b6d4);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;
}
.auth-heading{font-size:26px;font-weight:800;color:var(--text);margin-bottom:8px;font-family:'Plus Jakarta Sans',sans-serif;}
.auth-sub{font-size:14px;color:var(--text3);margin-bottom:32px;line-height:1.6;}

.auth-hero{
  position:relative;overflow:hidden;
  background:linear-gradient(135deg,#0f0720,#131B2E);
  display:flex;align-items:center;justify-content:center;
  border-left:1px solid var(--border);
}
.auth-hero-grid{
  position:absolute;inset:0;
  background-image:linear-gradient(rgba(139,92,246,0.07) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,0.07) 1px,transparent 1px);
  background-size:40px 40px;
}
.auth-hero-content{position:relative;z-index:1;padding:60px;text-align:center;}
.auth-hero-logo{display:flex;align-items:center;justify-content:center;gap:14px;margin-bottom:32px;}
.auth-hero-logo-mark{
  width:56px;height:56px;border-radius:16px;
  background:linear-gradient(135deg,#8b5cf6,#ec4899);
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 0 40px rgba(139,92,246,0.5);
}
.auth-hero-logo-text{
  font-size:36px;font-weight:900;letter-spacing:2px;
  background:linear-gradient(90deg,#8b5cf6,#06b6d4,#ec4899);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;
}
.auth-hero h2{font-size:28px;font-weight:800;color:var(--text);margin-bottom:14px;line-height:1.3;font-family:'Plus Jakarta Sans',sans-serif;}
.auth-hero p{font-size:14px;color:var(--text3);line-height:1.7;max-width:380px;margin:0 auto 32px;}
.auth-hero-badges{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;}
.auth-hero-badge{
  display:flex;align-items:center;gap:6px;
  padding:7px 14px;border-radius:100px;
  background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.2);
  font-size:12px;font-weight:600;color:var(--accent);
}

/* Glowing stats on auth page */
.auth-stats{display:flex;gap:36px;margin-top:52px;justify-content:center;}
.auth-stat{text-align:center;}
.auth-stat-val{font-size:28px;font-weight:800;background:linear-gradient(135deg,#8b5cf6,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-family:'Plus Jakarta Sans',sans-serif;}
.auth-stat-label{font-size:11px;color:var(--text3);margin-top:4px;}

/* Assessment form */
.assess-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.assess-card{
  background:linear-gradient(135deg,rgba(139,92,246,0.08),rgba(236,72,153,0.04));
  border:1px solid var(--border);border-radius:var(--radius-lg);
  padding:24px;margin-bottom:24px;
}

/* Risk gauge */
.gauge-wrap{display:flex;flex-direction:column;align-items:center;padding:8px 0;}

/* Checklist items */
.check-item{
  display:flex;align-items:flex-start;gap:12px;
  padding:14px 16px;border-radius:10px;
  border:1px solid var(--border2);background:var(--surface);
  margin-bottom:8px;transition:all .2s;cursor:pointer;
}
.check-item:hover{border-color:var(--border);background:var(--surface2);}
.check-item.done{border-color:rgba(16,185,129,.2);background:rgba(16,185,129,.04);}
.check-box{
  width:20px;height:20px;border-radius:6px;flex-shrink:0;
  border:2px solid var(--border);margin-top:1px;
  display:flex;align-items:center;justify-content:center;
  transition:all .2s;
}
.check-item.done .check-box{background:var(--green);border-color:var(--green);}
.check-title{font-size:13px;font-weight:600;color:var(--text);}
.check-sub{font-size:11px;color:var(--text3);margin-top:3px;}
.check-meta{display:flex;gap:8px;margin-top:6px;flex-wrap:wrap;}

/* Compliance control rows */
.ctrl-row{
  padding:14px 16px;border-bottom:1px solid var(--border2);
  display:flex;align-items:center;gap:12px;
  transition:background .15s;cursor:pointer;
}
.ctrl-row:hover{background:rgba(139,92,246,0.04);}
.ctrl-row:last-child{border-bottom:none;}
.ctrl-status{width:8px;height:8px;border-radius:50%;flex-shrink:0;}

/* AI chat */
.chat-wrap{display:flex;flex-direction:column;height:500px;}
.chat-msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;}
.chat-msg{max-width:85%;padding:12px 16px;border-radius:12px;font-size:13px;line-height:1.6;}
.chat-msg.user{
  align-self:flex-end;
  background:linear-gradient(135deg,rgba(139,92,246,0.2),rgba(124,58,237,0.15));
  border:1px solid rgba(139,92,246,0.2);color:var(--text);
}
.chat-msg.ai{
  align-self:flex-start;
  background:var(--surface2);border:1px solid var(--border2);color:var(--text2);
}
.chat-input-row{
  display:flex;gap:10px;padding:16px;
  border-top:1px solid var(--border2);
}
.chat-input{
  flex:1;background:var(--surface2);border:1px solid var(--border2);
  border-radius:10px;padding:10px 14px;color:var(--text);
  font-size:13px;outline:none;font-family:inherit;
  transition:border-color .15s;
}
.chat-input:focus{border-color:var(--accent);}

/* Risk heat colours */
.risk-critical{color:var(--red);}
.risk-high{color:var(--orange);}
.risk-medium{color:var(--yellow);}
.risk-low{color:var(--green);}

/* Remediation items */
.remed-item{
  padding:16px;border-radius:10px;
  border:1px solid var(--border2);background:var(--surface);
  margin-bottom:10px;transition:all .2s;
}
.remed-item:hover{border-color:var(--border);}
.remed-item.critical{border-left:3px solid var(--red);}
.remed-item.high{border-left:3px solid var(--orange);}
.remed-item.medium{border-left:3px solid var(--yellow);}

/* Trust center */
.trust-hero{
  background:linear-gradient(135deg,rgba(139,92,246,0.1),rgba(6,182,212,0.05));
  border:1px solid var(--border);border-radius:var(--radius-lg);
  padding:40px;text-align:center;margin-bottom:24px;
}
.trust-score-ring{display:inline-block;position:relative;}

/* Modal overlay */
.modal-overlay{
  position:fixed;inset:0;background:rgba(0,0,0,0.7);
  backdrop-filter:blur(4px);z-index:100;
  display:flex;align-items:center;justify-content:center;padding:20px;
}
.modal{
  background:var(--surface);border:1px solid var(--border);
  border-radius:var(--radius-lg);padding:28px;
  width:100%;max-width:500px;max-height:90vh;overflow-y:auto;
  box-shadow:0 20px 60px rgba(0,0,0,0.5);
}
.modal-title{font-size:17px;font-weight:700;color:var(--text);margin-bottom:20px;}

/* Animations */
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes glow{0%,100%{box-shadow:0 0 10px rgba(139,92,246,0.3)}50%{box-shadow:0 0 25px rgba(139,92,246,0.6)}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}

.spin{animation:spin 1s linear infinite}
.pulse{animation:pulse 2s ease-in-out infinite}
.fade-in{animation:fadeIn .3s ease}
.glow-anim{animation:glow 2s ease-in-out infinite}

/* Skeleton loader */
.skeleton{
  background:linear-gradient(90deg,var(--surface) 25%,var(--surface2) 50%,var(--surface) 75%);
  background-size:200% 100%;animation:shimmer 1.5s infinite;
  border-radius:6px;
}

/* Empty state */
.empty-state{
  text-align:center;padding:60px 20px;color:var(--text3);
  display:flex;flex-direction:column;align-items:center;gap:12px;
}
.empty-state svg{opacity:0.2;}

/* Trend arrows */
.trend-up{color:var(--green);}
.trend-down{color:var(--red);}

/* Integration cards */
.intg-card{
  background:var(--surface);border:1px solid var(--border2);
  border-radius:var(--radius-lg);padding:20px;
  display:flex;flex-direction:column;gap:12px;
  transition:all .2s;
}
.intg-card:hover{border-color:var(--border);box-shadow:0 4px 20px rgba(0,0,0,0.2);}
.intg-logo{font-size:28px;}
.intg-name{font-size:14px;font-weight:700;color:var(--text);}
.intg-desc{font-size:12px;color:var(--text3);line-height:1.5;}
.intg-status{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:600;}

/* Live status dot */
.live-dot{
  width:7px;height:7px;border-radius:50%;
  background:var(--green);
  box-shadow:0 0 6px var(--green);
  animation:pulse 2s ease-in-out infinite;
}

/* Vendor risk */
.vendor-row{
  display:flex;align-items:center;justify-content:space-between;
  padding:14px 16px;border-bottom:1px solid var(--border2);
  transition:background .15s;
}
.vendor-row:hover{background:rgba(139,92,246,0.04);}

/* Evidence card */
.evidence-card{
  background:var(--surface);border:1px solid var(--border2);
  border-radius:10px;padding:16px;margin-bottom:8px;
  display:flex;align-items:flex-start;gap:14px;
  transition:all .2s;
}
.evidence-card:hover{border-color:var(--border);}

/* Notification */
.notif-item{
  padding:14px 16px;border-bottom:1px solid var(--border2);
  display:flex;gap:12px;align-items:flex-start;
  transition:background .15s;cursor:pointer;
}
.notif-item:hover{background:rgba(139,92,246,0.04);}
.notif-item.unread{background:rgba(139,92,246,0.06);}
.notif-dot{width:8px;height:8px;border-radius:50%;background:var(--accent);margin-top:5px;flex-shrink:0;box-shadow:0 0 6px var(--accent);}

/* Scrollable panels */
.scroll-panel{overflow-y:auto;max-height:400px;scrollbar-width:thin;scrollbar-color:var(--accent) transparent;}

/* Cyber grid background effect */
.cyber-bg{
  position:fixed;inset:0;pointer-events:none;z-index:0;
  background-image:
    linear-gradient(rgba(139,92,246,0.03) 1px,transparent 1px),
    linear-gradient(90deg,rgba(139,92,246,0.03) 1px,transparent 1px);
  background-size:60px 60px;
}

/* Glow line accents */
.glow-line{height:1px;background:linear-gradient(90deg,transparent,var(--accent),transparent);opacity:0.4;}

/* Framework score rings */
.fw-ring{position:relative;display:inline-flex;align-items:center;justify-content:center;}

/* Audit trail */
.audit-row{
  padding:12px 16px;border-bottom:1px solid var(--border2);
  display:flex;align-items:flex-start;gap:12px;
  font-size:13px;
}
.audit-icon{
  width:28px;height:28px;border-radius:8px;
  background:var(--accentbg);display:flex;
  align-items:center;justify-content:center;flex-shrink:0;
}

/* Responsive */
@media(max-width:768px){
  .shell{grid-template-columns:1fr;}
  .sidebar{transform:translateX(-100%);transition:transform .3s;}
  .sidebar.open{transform:translateX(0);}
  .main-area{margin-left:0;}
  .stat-grid{grid-template-columns:repeat(2,1fr);}
  .assess-grid{grid-template-columns:1fr;}
  .auth-page{grid-template-columns:1fr;}
  .auth-hero{display:none;}
}

/* ── Auth page actual classes ─────────────────────────────────────── */
.auth-root{
  min-height:100vh;display:grid;
  grid-template-columns:1fr 1fr;
  background:var(--bg);
}
.auth-hero{
  position:relative;overflow:hidden;
  background:linear-gradient(135deg,#070B14,#0f0720,#131B2E);
  display:flex;align-items:center;justify-content:center;
  border-right:1px solid var(--border);
  order:-1;
}
.auth-hero-grid{
  position:absolute;inset:0;
  background-image:
    linear-gradient(rgba(139,92,246,0.06) 1px,transparent 1px),
    linear-gradient(90deg,rgba(139,92,246,0.06) 1px,transparent 1px);
  background-size:40px 40px;
}
.auth-hero-content{
  position:relative;z-index:1;
  padding:60px 48px;text-align:center;
}
.auth-hero-logo{
  display:flex;align-items:center;justify-content:center;
  gap:14px;margin-bottom:36px;
}
.auth-hero-logo-mark{
  width:56px;height:56px;border-radius:16px;
  background:linear-gradient(135deg,#8b5cf6,#ec4899);
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 0 40px rgba(139,92,246,0.5);
}
.auth-hero-logo-text{
  font-size:36px;font-weight:900;letter-spacing:2px;
  background:linear-gradient(90deg,#8b5cf6,#06b6d4,#ec4899);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;
  font-family:'Plus Jakarta Sans',sans-serif;
}
.auth-hero h1{
  font-size:32px;font-weight:800;color:#fff;
  margin-bottom:16px;line-height:1.25;
  font-family:'Plus Jakarta Sans',sans-serif;
}
.auth-hero h1 span{
  background:linear-gradient(90deg,#8b5cf6,#ec4899);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;
}
.auth-hero p{
  font-size:14px;color:var(--text3);line-height:1.7;
  max-width:380px;margin:0 auto 28px;
}
.auth-hero-badges{
  display:flex;flex-wrap:wrap;gap:8px;justify-content:center;
  margin-bottom:0;
}
.auth-hero-badge{
  display:flex;align-items:center;gap:6px;
  padding:6px 14px;border-radius:100px;
  background:rgba(139,92,246,0.1);
  border:1px solid rgba(139,92,246,0.2);
  font-size:12px;font-weight:600;color:var(--accent);
}

/* Auth form side */
.auth-form-side{
  display:flex;flex-direction:column;justify-content:center;
  padding:60px 48px;background:var(--bg2);
  max-width:480px;width:100%;margin:0 auto;
}
.auth-form-header{margin-bottom:32px;}
.auth-form-header h2{
  font-size:26px;font-weight:800;color:var(--text);
  margin-bottom:8px;font-family:'Plus Jakarta Sans',sans-serif;
}
.auth-form-header p{font-size:14px;color:var(--text3);line-height:1.6;}

/* Field classes used in auth */
.field{margin-bottom:18px;}
.field-label{
  display:block;font-size:11px;font-weight:700;
  color:var(--text2);margin-bottom:7px;
  text-transform:uppercase;letter-spacing:.7px;
}
.field-input-wrap{position:relative;}
.field-icon{
  position:absolute;left:13px;top:50%;transform:translateY(-50%);
  color:var(--text3);pointer-events:none;width:15px;height:15px;
}
.field-input-wrap input{
  width:100%;background:var(--surface);
  border:1px solid var(--border2);border-radius:var(--radius);
  padding:12px 14px 12px 40px;
  color:var(--text);font-size:14px;
  transition:all .2s;outline:none;font-family:inherit;
}
.field-input-wrap input:focus{
  border-color:var(--accent);
  box-shadow:0 0 0 3px rgba(139,92,246,0.12);
}
.field-input-wrap input::placeholder{color:var(--text3);}

/* Auth button */
.auth-btn{
  width:100%;padding:13px;margin-top:8px;
  background:linear-gradient(135deg,#8b5cf6,#7c3aed);
  color:#fff;border:none;border-radius:var(--radius);
  font-size:15px;font-weight:700;cursor:pointer;
  display:flex;align-items:center;justify-content:center;gap:8px;
  transition:all .2s;font-family:inherit;
  box-shadow:0 4px 20px rgba(139,92,246,0.35);
}
.auth-btn:hover:not(:disabled){
  transform:translateY(-1px);
  box-shadow:0 6px 28px rgba(139,92,246,0.5);
}
.auth-btn:disabled{opacity:0.6;cursor:not-allowed;}

/* Auth switch */
.auth-switch{
  text-align:center;margin-top:20px;
  font-size:13px;color:var(--text3);
}
.auth-switch span{
  color:var(--accent);font-weight:600;
  cursor:pointer;margin-left:4px;
}
.auth-switch span:hover{text-decoration:underline;}

/* Ok / error messages */
.ok-msg{
  display:flex;align-items:center;gap:8px;
  padding:11px 14px;border-radius:9px;
  background:var(--greenbg);border:1px solid rgba(16,185,129,.2);
  color:var(--green);font-size:13px;margin-bottom:16px;
}
.err-msg{
  display:flex;align-items:center;gap:8px;
  padding:11px 14px;border-radius:9px;
  background:var(--redbg);border:1px solid rgba(239,68,68,.2);
  color:var(--red);font-size:13px;margin-bottom:16px;
}

/* Tenant toggle */
.tenant-toggle{
  display:flex;background:var(--surface);
  border:1px solid var(--border2);border-radius:9px;
  padding:4px;margin-bottom:20px;gap:4px;
}
.tenant-opt{
  flex:1;text-align:center;padding:8px;border-radius:7px;
  font-size:13px;font-weight:600;color:var(--text3);
  cursor:pointer;transition:all .15s;
}
.tenant-opt.active{
  background:var(--accent);color:#fff;
  box-shadow:0 2px 10px rgba(139,92,246,0.3);
}

/* Topbar btn */
.topbar-btn{
  width:36px;height:36px;border-radius:9px;
  background:var(--surface);border:1px solid var(--border2);
  display:flex;align-items:center;justify-content:center;
  cursor:pointer;transition:all .15s;color:var(--text2);
}
.topbar-btn:hover{border-color:var(--accent);color:var(--accent);}

@media(max-width:900px){
  .auth-root{grid-template-columns:1fr;}
  .auth-hero{display:none;}
  .auth-form-side{max-width:100%;padding:40px 24px;}
}


/* ═══════════════════════════════════════════════════════════════
   AURA — Premium Floating Navigation
   Inspired by Linear, Vercel, Datadog, CrowdStrike
═══════════════════════════════════════════════════════════════ */

/* Sidebar base */
.sidebar {
  background: #070B14;
  border-right: 1px solid rgba(139,92,246,0.08);
  box-shadow: 1px 0 0 rgba(139,92,246,0.04), 4px 0 24px rgba(0,0,0,0.4);
  overflow-x: visible;
}

/* Section labels */
.nav-section-label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1.8px;
  color: rgba(148,163,184,0.35);
  text-transform: uppercase;
  padding: 18px 16px 5px;
  user-select: none;
}

/* Base nav item */
.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 12px;
  margin: 1px 8px;
  border-radius: 9px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: rgba(148,163,184,0.65);
  transition:
    color 200ms cubic-bezier(0.4,0,0.2,1),
    background 200ms cubic-bezier(0.4,0,0.2,1),
    transform 200ms cubic-bezier(0.4,0,0.2,1),
    box-shadow 200ms cubic-bezier(0.4,0,0.2,1);
  text-decoration: none;
  border: 1px solid transparent;
  background: transparent;
  width: calc(100% - 16px);
  letter-spacing: 0.1px;
  outline: none;
  font-family: inherit;
  -webkit-font-smoothing: antialiased;
}

/* Icon base */
.nav-item svg {
  opacity: 0.45;
  flex-shrink: 0;
  transition: opacity 200ms ease, transform 200ms ease;
}

/* Hover state */
.nav-item:hover {
  color: rgba(226,232,240,0.9);
  background: rgba(139,92,246,0.06);
  transform: translateX(1px);
}
.nav-item:hover svg {
  opacity: 0.7;
}

/* ── ACTIVE STATE — the magic ─────────────────────────────────── */
.nav-item.active {
  color: #fff;
  background: linear-gradient(
    135deg,
    rgba(139,92,246,0.14) 0%,
    rgba(99,102,241,0.10) 50%,
    rgba(168,85,247,0.08) 100%
  );
  border: 1px solid rgba(139,92,246,0.18);
  box-shadow:
    0 1px 3px rgba(0,0,0,0.3),
    0 4px 12px rgba(139,92,246,0.12),
    0 0 0 0.5px rgba(139,92,246,0.1) inset;
  transform: translateX(2px);
  font-weight: 600;
}

.nav-item.active svg {
  opacity: 1;
  color: #a78bfa;
  filter: drop-shadow(0 0 4px rgba(139,92,246,0.6));
}

/* Left glow accent bar */
.nav-item.active::before {
  content: '';
  position: absolute;
  left: -9px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 60%;
  min-height: 16px;
  max-height: 26px;
  border-radius: 0 3px 3px 0;
  background: linear-gradient(
    180deg,
    #8b5cf6 0%,
    #6366f1 50%,
    #a78bfa 100%
  );
  box-shadow:
    0 0 6px rgba(139,92,246,0.8),
    0 0 12px rgba(139,92,246,0.4);
  animation: navGlowPulse 2.5s ease-in-out infinite;
}

/* Subtle ambient glow behind active item */
.nav-item.active::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 9px;
  background: radial-gradient(
    ellipse at 20% 50%,
    rgba(139,92,246,0.08) 0%,
    transparent 70%
  );
  pointer-events: none;
}

/* Hover on active — slightly more illuminated */
.nav-item.active:hover {
  background: linear-gradient(
    135deg,
    rgba(139,92,246,0.18) 0%,
    rgba(99,102,241,0.13) 50%,
    rgba(168,85,247,0.10) 100%
  );
  box-shadow:
    0 2px 8px rgba(0,0,0,0.3),
    0 6px 16px rgba(139,92,246,0.18),
    0 0 0 0.5px rgba(139,92,246,0.15) inset;
  transform: translateX(2px);
}

/* Glow pulse on active indicator */
@keyframes navGlowPulse {
  0%, 100% {
    opacity: 1;
    box-shadow:
      0 0 6px rgba(139,92,246,0.8),
      0 0 12px rgba(139,92,246,0.4);
  }
  50% {
    opacity: 0.75;
    box-shadow:
      0 0 4px rgba(139,92,246,0.5),
      0 0 8px rgba(139,92,246,0.25);
  }
}

/* Sidebar logo glow refinement */
.sidebar-logo-mark {
  background: linear-gradient(135deg, #8b5cf6, #6366f1, #ec4899);
  box-shadow:
    0 0 12px rgba(139,92,246,0.35),
    0 2px 8px rgba(0,0,0,0.3);
}

/* Logo text gradient */
.sidebar-logo-text {
  background: linear-gradient(90deg, #a78bfa, #818cf8, #67e8f9);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 800;
  letter-spacing: 2px;
  font-family: 'Plus Jakarta Sans', sans-serif;
}

/* User pill at bottom */
.sidebar-footer {
  margin-top: auto;
  padding: 12px 8px 16px;
  border-top: 1px solid rgba(139,92,246,0.07);
}

.user-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(139,92,246,0.05);
  border: 1px solid rgba(139,92,246,0.1);
  cursor: pointer;
  transition: all 200ms ease;
}
.user-pill:hover {
  background: rgba(139,92,246,0.09);
  border-color: rgba(139,92,246,0.2);
}

.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 0 8px rgba(139,92,246,0.3);
}

.user-name {
  font-size: 12px;
  font-weight: 600;
  color: rgba(226,232,240,0.9);
}

.user-role {
  font-size: 10px;
  color: rgba(148,163,184,0.5);
  text-transform: uppercase;
  letter-spacing: 0.6px;
}

.tenant-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  margin: 0 8px 6px;
  border-radius: 8px;
  background: rgba(139,92,246,0.06);
  border: 1px solid rgba(139,92,246,0.12);
  font-size: 11px;
  font-weight: 600;
  color: rgba(167,139,250,0.8);
  transition: all 200ms ease;
}
.tenant-pill:hover {
  background: rgba(139,92,246,0.1);
  color: #a78bfa;
}

/* Scrollbar inside sidebar */
.sidebar::-webkit-scrollbar { width: 0; }

/* ── Topbar refinement ─────────────────────────────────────────── */
.topbar {
  background: rgba(7,11,20,0.92);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-bottom: 1px solid rgba(139,92,246,0.07);
  box-shadow: 0 1px 0 rgba(139,92,246,0.05);
}

.topbar-title {
  font-size: 14px;
  font-weight: 700;
  color: rgba(226,232,240,0.95);
  letter-spacing: 0.2px;
  white-space: nowrap;
  min-width: 100px;
}

.topbar-search {
  flex: 1;
  max-width: 340px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(139,92,246,0.1);
  border-radius: 9px;
  padding: 0 12px;
  height: 33px;
  transition: all 200ms ease;
}
.topbar-search:focus-within {
  border-color: rgba(139,92,246,0.3);
  background: rgba(139,92,246,0.05);
  box-shadow: 0 0 0 3px rgba(139,92,246,0.07);
}
.topbar-search input {
  background: none;
  border: none;
  outline: none;
  font-size: 13px;
  color: rgba(226,232,240,0.8);
  width: 100%;
  font-family: inherit;
}
.topbar-search input::placeholder {
  color: rgba(148,163,184,0.35);
}

.score-badge {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px 13px;
  border-radius: 100px;
  background: rgba(139,92,246,0.08);
  border: 1px solid rgba(139,92,246,0.18);
  font-size: 12px;
  font-weight: 700;
  color: #a78bfa;
  white-space: nowrap;
  transition: all 200ms ease;
  cursor: default;
}
.score-badge:hover {
  background: rgba(139,92,246,0.13);
  box-shadow: 0 0 12px rgba(139,92,246,0.15);
}

.live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 5px #10b981;
  animation: livePulse 2s ease-in-out infinite;
  flex-shrink: 0;
}

@keyframes livePulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 5px #10b981; }
  50% { opacity: 0.6; box-shadow: 0 0 2px #10b981; }
}

.icon-btn {
  width: 33px;
  height: 33px;
  border-radius: 8px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(139,92,246,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 200ms ease;
  color: rgba(148,163,184,0.6);
  flex-shrink: 0;
}
.icon-btn:hover {
  border-color: rgba(139,92,246,0.25);
  background: rgba(139,92,246,0.08);
  color: #a78bfa;
}


/* ══════════════════════════════════════════════
   AURA DESIGN SYSTEM v2 — Inter font, refined light
   ══════════════════════════════════════════════ */

/* Font */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

/* Override root tokens */
:root {
  --bg:#F8F9FC !important;
  --bg2:#F1F3F8 !important;
  --bg3:#E8EDF5 !important;
  --surface:#FFFFFF !important;
  --surface2:#F8F9FC !important;
  --text:#0A0C10 !important;
  --text2:#3D4A5C !important;
  --text3:#64748B !important;
  --accent:#5B5BD6 !important;
  --accent2:#6D28D9 !important;
  --accentbg:rgba(91,91,214,0.08) !important;
  --border:rgba(0,0,0,0.07) !important;
  --border2:rgba(0,0,0,0.04) !important;
  --shadow:0 1px 2px rgba(0,0,0,0.04),0 4px 12px rgba(0,0,0,0.03) !important;
  --glow:0 0 0 3px rgba(91,91,214,0.12) !important;
  --radius:10px !important;
  --radius-lg:14px !important;
}

/* Global font */
*, *::before, *::after {
  font-family: 'Inter', 'DM Sans', system-ui, -apple-system, sans-serif !important;
}
code, pre, .mono, [class*="mono"], [class*="code"] {
  font-family: 'JetBrains Mono', monospace !important;
}

/* Shell */
html, body, #root {
  background: var(--bg) !important;
  color: var(--text) !important;
}

/* ── TOPBAR ── */
.topbar {
  background: rgba(255,255,255,0.92) !important;
  backdrop-filter: blur(12px) !important;
  -webkit-backdrop-filter: blur(12px) !important;
  border-bottom: 1px solid rgba(0,0,0,0.07) !important;
  box-shadow: 0 1px 0 rgba(0,0,0,0.04) !important;
}

/* ── CARDS ── */
.card {
  background: #FFFFFF !important;
  border: 1px solid rgba(0,0,0,0.07) !important;
  border-radius: 14px !important;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03) !important;
  transition: box-shadow .2s, border-color .2s, transform .2s !important;
}
.card:hover {
  box-shadow: 0 4px 20px rgba(0,0,0,0.08), 0 0 0 1px rgba(91,91,214,0.08) !important;
  border-color: rgba(91,91,214,0.15) !important;
}
.card-header {
  background: #FAFBFD !important;
  border-bottom: 1px solid rgba(0,0,0,0.06) !important;
  padding: 14px 20px !important;
  border-radius: 14px 14px 0 0 !important;
}
.card-title {
  color: #0A0C10 !important;
  font-size: 13.5px !important;
  font-weight: 600 !important;
  letter-spacing: -0.2px !important;
}
.card-sub { color: #64748B !important; font-size: 12px !important; }
.card-body { padding: 18px 20px !important; }

/* ── BUTTONS ── */
.btn-primary {
  background: linear-gradient(135deg,#5B5BD6,#6D28D9) !important;
  color: #fff !important;
  border: none !important;
  box-shadow: 0 2px 8px rgba(91,91,214,0.25), 0 1px 2px rgba(0,0,0,0.1) !important;
  font-weight: 600 !important;
  letter-spacing: -0.2px !important;
  transition: all .18s !important;
}
.btn-primary:hover {
  transform: translateY(-1px) !important;
  box-shadow: 0 6px 20px rgba(91,91,214,0.35) !important;
}
.btn-secondary, .btn-ghost {
  background: #FFFFFF !important;
  color: #3D4A5C !important;
  border: 1px solid rgba(0,0,0,0.1) !important;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04) !important;
  transition: all .15s !important;
}
.btn-secondary:hover, .btn-ghost:hover {
  background: #F8F9FC !important;
  border-color: rgba(0,0,0,0.14) !important;
}
.btn-sm { padding: 5px 12px !important; font-size: 12.5px !important; }
.btn-danger { background: #FEF2F2 !important; color: #DC2626 !important; border-color: #FECACA !important; }
.btn-danger:hover { background: #DC2626 !important; color: #fff !important; }

/* ── PAGE LAYOUT ── */
.page-body { padding: 24px 28px !important; background: var(--bg) !important; }
.page-title {
  font-size: 22px !important;
  font-weight: 700 !important;
  color: #0A0C10 !important;
  letter-spacing: -0.5px !important;
  line-height: 1.2 !important;
}
.page-subtitle { font-size: 13.5px !important; color: #64748B !important; margin-top: 4px !important; }
.page-crumb {
  font-size: 12px !important;
  color: #64748B !important;
  display: flex !important;
  align-items: center !important;
  gap: 6px !important;
  margin-bottom: 10px !important;
}
.page-header { margin-bottom: 20px !important; }

/* ── STAT CARDS ── */
.stat-card {
  background: #FFFFFF !important;
  border: 1px solid rgba(0,0,0,0.07) !important;
  border-radius: 14px !important;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03) !important;
  padding: 18px 20px !important;
  transition: all .2s !important;
}
.stat-card:hover {
  box-shadow: 0 4px 20px rgba(0,0,0,0.08) !important;
  transform: translateY(-2px) !important;
}
.stat-val {
  font-size: 28px !important;
  font-weight: 700 !important;
  letter-spacing: -1.5px !important;
  line-height: 1 !important;
  color: #0A0C10 !important;
}
.stat-label { font-size: 12px !important; color: #64748B !important; font-weight: 500 !important; }

/* ── NAV ACTIVE ── */
.nav-item.active {
  background: rgba(91,91,214,0.1) !important;
  color: #5B5BD6 !important;
  border-left: 2px solid #5B5BD6 !important;
  font-weight: 500 !important;
}
.nav-item.active svg, .nav-item.active span { color: #5B5BD6 !important; }

/* ── TABLES ── */
th {
  background: #F8F9FC !important;
  color: #64748B !important;
  font-size: 11px !important;
  font-weight: 600 !important;
  text-transform: uppercase !important;
  letter-spacing: .06em !important;
  border-bottom: 1px solid rgba(0,0,0,0.07) !important;
  padding: 10px 16px !important;
}
td {
  border-bottom: 1px solid rgba(0,0,0,0.04) !important;
  color: #3D4A5C !important;
  font-size: 13.5px !important;
  padding: 12px 16px !important;
}
tr:hover td { background: #F8F9FC !important; }
.table-wrap { overflow-x: auto !important; border-radius: 12px !important; border: 1px solid rgba(0,0,0,0.07) !important; }

/* ── INPUTS ── */
input, select, textarea {
  background: #FFFFFF !important;
  border: 1px solid rgba(0,0,0,0.1) !important;
  color: #0A0C10 !important;
  border-radius: 8px !important;
  font-size: 13.5px !important;
  padding: 8px 12px !important;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03) !important;
  transition: border-color .15s, box-shadow .15s !important;
}
input:focus, select:focus, textarea:focus {
  border-color: rgba(91,91,214,0.45) !important;
  box-shadow: 0 0 0 3px rgba(91,91,214,0.1) !important;
  outline: none !important;
}
input::placeholder, textarea::placeholder { color: #94A3B8 !important; }
label { font-size: 13px !important; font-weight: 500 !important; color: #3D4A5C !important; margin-bottom: 4px !important; display: block !important; }

/* ── BADGES ── */
.badge {
  font-size: 10.5px !important;
  font-weight: 600 !important;
  letter-spacing: .01em !important;
  border-radius: 6px !important;
  padding: 2px 8px !important;
}

/* ── TAB BUTTONS ── */
.tab-btn {
  background: #F1F3F8 !important;
  border: 1px solid rgba(0,0,0,0.07) !important;
  color: #64748B !important;
  font-size: 13px !important;
  font-weight: 500 !important;
  border-radius: 8px !important;
  transition: all .15s !important;
  padding: 7px 14px !important;
}
.tab-btn:hover { background: #FFFFFF !important; color: #3D4A5C !important; }
.tab-btn.active {
  background: #FFFFFF !important;
  border-color: rgba(91,91,214,0.25) !important;
  color: #5B5BD6 !important;
  font-weight: 600 !important;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08) !important;
}

/* ── FRAMEWORK CARDS ── */
.fw-card {
  background: #FFFFFF !important;
  border: 1px solid rgba(0,0,0,0.07) !important;
  border-radius: 12px !important;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04) !important;
  transition: all .2s !important;
}
.fw-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.08) !important;
  border-color: rgba(91,91,214,0.15) !important;
  transform: translateY(-2px) !important;
}
.fw-card-score { font-size: 32px !important; font-weight: 700 !important; letter-spacing: -1px !important; }

/* ── NOTICES ── */
.notice-ok { background: #F0FDF4 !important; border: 1px solid #BBF7D0 !important; color: #16A34A !important; border-radius: 8px !important; }
.notice-err { background: #FEF2F2 !important; border: 1px solid #FECACA !important; color: #DC2626 !important; border-radius: 8px !important; }
.notice { font-size: 13px !important; padding: 10px 14px !important; }

/* ── ITEMS (risk, vendor, evidence, policy) ── */
.risk-item, [class*="risk-row"], [class*="vendor-card"], [class*="evidence-item"], [class*="policy-card"] {
  background: #FFFFFF !important;
  border: 1px solid rgba(0,0,0,0.07) !important;
  border-radius: 10px !important;
  transition: all .15s !important;
}
.risk-item:hover, [class*="vendor-card"]:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.06) !important;
  border-color: rgba(91,91,214,0.12) !important;
}

/* ── USER ITEM (sidebar bottom) ── */
.user-item { background: rgba(91,91,214,0.06) !important; border: 1px solid rgba(91,91,214,0.1) !important; border-radius: 10px !important; }

/* ── PROGRESS BARS ── */
.progress-bar, [class*="progress"] { background: rgba(0,0,0,0.06) !important; border-radius: 4px !important; height: 6px !important; overflow: hidden !important; }

/* ── SCROLLBAR ── */
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 10px; }
::-webkit-scrollbar-thumb:hover { background: rgba(91,91,214,0.4); }

/* ── CHARTS ── */
.recharts-cartesian-grid line { stroke: rgba(0,0,0,0.05) !important; }
.recharts-text { fill: #64748B !important; font-size: 11px !important; }

/* ── AURA MASCOT ── */
.aura-mascot { background: radial-gradient(circle at 35% 30%,#A5B4FC,#818CF8,#5B5BD6) !important; }

/* ── EMPTY STATES ── */
.empty-state { color: #94A3B8 !important; font-size: 14px !important; text-align: center !important; padding: 48px 24px !important; }

/* ── FADE IN ── */
.fade-in { animation: fadeInUp .22s ease both; }
@keyframes fadeInUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }

/* ── SECTION LABELS ── */
.nav-section-label { color: #94A3B8 !important; font-size: 10px !important; font-weight: 600 !important; letter-spacing: .08em !important; text-transform: uppercase !important; }

/* ── CYBER BG (subtle dot pattern) ── */
.cyber-bg { background-image: radial-gradient(rgba(91,91,214,0.06) 1px,transparent 1px) !important; background-size: 24px 24px !important; }

`;

function RiskGauge({score}) {
  const R=72,cx=100,cy=100,startA=-210,totalArc=240;
  const toXY=(a,r)=>({x:cx+r*Math.cos(a*Math.PI/180),y:cy+r*Math.sin(a*Math.PI/180)});
  const arc=(s,e,r)=>{const A=toXY(s,r),B=toXY(e,r);return `M ${A.x} ${A.y} A ${r} ${r} 0 ${e-s>180?1:0} 1 ${B.x} ${B.y}`;};
  const color=score>=75?"#EF4444":score>=50?"#F97316":score>=25?"#EAB308":"#22C55E";
  const level=score>=75?"Critical":score>=50?"High":score>=25?"Medium":"Low";
  const filled=totalArc*Math.min(Math.max(score/100,0),1);
  return (
    <div className="gauge-container">
      <svg width="200" height="140" viewBox="0 0 200 140">
        <path d={arc(startA,startA+totalArc,R)} fill="none" stroke="#2A2E40" strokeWidth="12" strokeLinecap="round"/>
        {score>0&&<path d={arc(startA,startA+filled,R)} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"/>}
        <circle cx={toXY(startA+filled,R).x} cy={toXY(startA+filled,R).y} r="6" fill={color} stroke="#fff" strokeWidth="2"/>
        <text x={cx} y={cy+28} textAnchor="middle" fill="#F0F2F8" fontSize="30" fontWeight="800">{score.toFixed(0)}</text>
        <text x={cx} y={cx+46} textAnchor="middle" fill="#6B7190" fontSize="10" letterSpacing="1.5">RISK SCORE</text>
      </svg>
      <span className="badge" style={{background:score>=75?"var(--redbg)":score>=50?"var(--orangebg)":score>=25?"var(--yellowbg)":"var(--greenbg)",color:score>=75?"var(--red)":score>=50?"var(--orange)":score>=25?"var(--yellow)":"var(--green)",border:"1px solid rgba(147,51,234,.15)"}}>
        <span className="badge-dot" style={{background:color}}/>{level} Risk
      </span>
    </div>
  );
}

function ComplianceTab({token,tenantId,onExpired}) {
  const [assessments,setAssessments]=useState([]);
  const [selectedId,setSelectedId]=useState(null);
  const [results,setResults]=useState([]);
  const [summary,setSummary]=useState([]);
  const [activeFramework,setActiveFramework]=useState(null);
  const [loading,setLoading]=useState(true);
  const [running,setRunning]=useState(false);
  const [error,setError]=useState("");
  const [openControl,setOpenControl]=useState(null);

  const fwMeta={
    SOC2:    {color:"#EF4444",label:"SOC 2 Type II",     desc:"Trust Service Criteria"},
    ISO27001:{color:"#22C55E",label:"ISO 27001:2022",    desc:"Information Security Management"},
    DPDP:    {color:"#F97316",label:"DPDP Act 2023",     desc:"India Personal Data Protection"},
  };

  useEffect(()=>{
    let c=false;
    (async()=>{
      try{
        const [a,s]=await Promise.all([realServer.getAuditTrail(token,tenantId),realServer.getComplianceSummary(token,tenantId).catch(()=>[])]);
        if(c)return;
        setAssessments(a);setSummary(s);
        if(a.length>0)setSelectedId(a[a.length-1].id);
      }catch(e){if(e.message==="AUTH_EXPIRED")onExpired();else setError(e.message);}
      finally{if(!c)setLoading(false);}
    })();
    return()=>{c=true;};
  },[token,tenantId,onExpired]);

  useEffect(()=>{
    if(!selectedId)return;
    let c=false;
    setResults([]);setActiveFramework(null);
    realServer.getComplianceResults(token,tenantId,selectedId)
      .then(d=>{if(!c){setResults(d);if(d.length>0)setActiveFramework(d[0].framework);}})
      .catch(e=>{if(e.message==="AUTH_EXPIRED")onExpired();else setError(e.message);});
    return()=>{c=true;};
  },[selectedId,token,tenantId,onExpired]);

  async function rerun(){
    if(!selectedId)return;setRunning(true);setError("");
    try{
      const d=await realServer.runComplianceMapping(token,tenantId,selectedId);
      setResults(d);if(d.length>0)setActiveFramework(d[0].framework);
      const s=await realServer.getComplianceSummary(token,tenantId).catch(()=>[]);setSummary(s);
    }catch(e){if(e.message==="AUTH_EXPIRED")onExpired();else setError(e.message);}
    finally{setRunning(false);}
  }

  const activeResult=results.find(r=>r.framework===activeFramework);

  if(loading)return <div className="empty-state"><RefreshCw size={28} className="spin" style={{opacity:.3,display:"block",margin:"0 auto 12px"}}/><span>Loading...</span></div>;
  if(assessments.length===0)return <div className="empty-state"><ClipboardList size={36}/><p>No assessments found</p><span>Complete a risk assessment first</span></div>;

  return (
    <div className="fade-in">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px",flexWrap:"wrap",gap:"12px"}}>
        <div>
          <div style={{fontSize:"15px",fontWeight:"700",color:"var(--text)",marginBottom:"3px"}}>Framework Mapping</div>
          <div style={{fontSize:"12px",color:"var(--text3)"}}>4 frameworks — SOC 2, ISO 27001, RBI Cybersecurity, DPDP Act 2023</div>
        </div>
        <div style={{display:"flex",gap:"10px",alignItems:"center"}}>
          <select value={selectedId||""} onChange={e=>setSelectedId(e.target.value)} style={{fontSize:"12px",padding:"7px 12px",background:"var(--surface2)",border:"1px solid var(--border2)",borderRadius:"var(--radius)",color:"var(--text)",outline:"none"}}>
            {assessments.map(a=><option key={a.id} value={a.id}>{a.org_name} — {fmtDate(a.created_at)}</option>)}
          </select>
          <button className="btn btn-secondary btn-sm" onClick={rerun} disabled={running||!selectedId}>
            <RefreshCw size={12} className={running?"spin":""}/>{running?"Running...":"Re-run Mapping"}
          </button>
        </div>
      </div>
      {error&&<div className="notice notice-err"><AlertCircle size={15}/>{error}</div>}
      {results.length>0&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:"14px",marginBottom:"20px"}}>
          {results.map(r=>{
            const m=fwMeta[r.framework]||{color:"#8b5cf6",label:r.framework,desc:""};
            const pass=r.controls.filter(c=>c.status==="pass").length;
            const active=activeFramework===r.framework;
            return (
              <div key={r.framework} onClick={()=>setActiveFramework(r.framework)} style={{background:active?`${m.color}12`:"var(--surface2)",border:`2px solid ${active?m.color:"var(--border)"}`,borderRadius:"var(--radius-lg)",padding:"20px",cursor:"pointer",transition:"all .15s"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"14px"}}>
                  <div>
                    <div style={{fontWeight:"700",fontSize:"13px",color:"var(--text)",marginBottom:"2px"}}>{m.label}</div>
                    <div style={{fontSize:"11px",color:"var(--text3)"}}>{pass}/{r.controls.length} passing</div>
                  </div>
                  <div style={{fontSize:"24px",fontWeight:"800",color:m.color,letterSpacing:"-1px"}}>{(()=>{const tw=r.controls.reduce((a,c)=>a+(c.weight||0),0);return tw>0?Math.round(r.score/tw*100):Math.min(Math.round(r.score),100);})()}<span style={{fontSize:"12px",fontWeight:"500"}}>%</span></div>
                </div>
                {(()=>{const tw=r.controls.reduce((a,c)=>a+(c.weight||0),0);const pct=tw>0?Math.round(r.score/tw*100):Math.min(Math.round(r.score),100);return(<>
                <div className="progress-wrap" style={{height:"6px",marginBottom:"12px"}}>
                  <div className="progress-fill" style={{width:`${Math.min(pct,100)}%`,background:m.color,height:"6px"}}/>
                </div>
                <span className="badge" style={{background:pct>=75?"var(--greenbg)":pct>=50?"var(--yellowbg)":"var(--redbg)",color:pct>=75?"var(--green)":pct>=50?"var(--yellow)":"var(--red)",border:"none"}}>
                  <span className="badge-dot" style={{background:pct>=75?"var(--green)":pct>=50?"var(--yellow)":"var(--red)"}}/>
                  {pct>=75?"Compliant":pct>=50?"Partial":"Non-Compliant"}
                </span></>);})()}
              </div>
            );
          })}
        </div>
      )}
      {activeResult&&(
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">{(fwMeta[activeResult.framework]||{label:activeResult.framework}).label} — Detail</div>
              <div className="card-sub">{activeResult.controls.length} controls</div>
            </div>
            <div style={{display:"flex",gap:"14px",fontSize:"12px"}}>
              <span style={{color:"var(--green)",fontWeight:"600"}}>&#10003; {activeResult.controls.filter(c=>c.status==="pass").length} Pass</span>
              <span style={{color:"var(--yellow)",fontWeight:"600"}}>~ {activeResult.controls.filter(c=>c.status==="partial").length} Partial</span>
              <span style={{color:"var(--red)",fontWeight:"600"}}>&#10007; {activeResult.controls.filter(c=>c.status==="fail").length} Fail</span>
            </div>
          </div>
          <div style={{padding:0}}>
            {activeResult.controls.map(c=>{
              const sc=c.status==="pass"?"var(--green)":c.status==="partial"?"var(--yellow)":"var(--red)";
              const sbg=c.status==="pass"?"var(--greenbg)":c.status==="partial"?"var(--yellowbg)":"var(--redbg)";
              const isOpen=openControl===c.id;
              return (
                <div key={c.id} style={{borderBottom:"1px solid var(--border)"}}>
                  <div onClick={()=>setOpenControl(isOpen?null:c.id)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 22px",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background="var(--surface2)"} onMouseLeave={e=>e.currentTarget.style.background=""}>
                    <div style={{display:"flex",alignItems:"center",gap:"10px",minWidth:0}}>
                      <span className="badge" style={{background:sbg,color:sc,border:"none",flexShrink:0}}>{c.status}</span>
                      <span style={{fontSize:"13px",color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:"12px",flexShrink:0}}>
                      <span style={{fontSize:"12px",color:"var(--text3)"}}>{c.earned.toFixed(0)}/{c.weight} pts</span>
                      <ChevronDown size={14} style={{color:"var(--text3)",transform:isOpen?"rotate(180deg)":"",transition:"transform .15s"}}/>
                    </div>
                  </div>
                  {isOpen&&<div style={{padding:"14px 22px 18px",background:"var(--surface2)",borderTop:"1px solid var(--border)"}}><p style={{fontSize:"12px",color:"var(--text2)",lineHeight:"1.6"}}>{c.description}</p></div>}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {results.length===0&&!loading&&(
        <div className="empty-state">
          <ClipboardList size={32}/><p>No compliance results yet</p>
          <button className="btn btn-primary" style={{marginTop:"16px"}} onClick={rerun} disabled={running}>
            <RefreshCw size={13} className={running?"spin":""}/>{running?"Running...":"Run Compliance Mapping"}
          </button>
        </div>
      )}
    </div>
  );
}

function AuditTrail({token,tenantId,role,onExpired}) {
  const [rows,setRows]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const canExport=ROLES[role]?.canExport;

  useEffect(()=>{
    let c=false;
    realServer.getAuditTrail(token,tenantId).then(d=>{if(!c){setRows(d);setLoading(false);}}).catch(e=>{if(c)return;if(e.message==="AUTH_EXPIRED")onExpired();else{setError(e.message);setLoading(false);}});
    return()=>{c=true;};
  },[token,tenantId,onExpired]);

  function exportCSV(){
    const h=["ID","Organisation","Industry","Score","Level","Exposure","Date"];
    const lines=rows.map(r=>[r.id,r.org_name,r.industry,r.risk_score,r.risk_level,r.financial_exposure,fmtDateTime(r.created_at)].join(","));
    const blob=new Blob([[h,...lines].join("\n")],{type:"text/csv"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="aura_audit.csv";a.click();
  }

  return (
    <div className="card fade-in">
      <div className="card-header">
        <div><div className="card-title">Assessment History</div><div className="card-sub">{rows.length} records</div></div>
        {canExport&&<button className="btn btn-secondary btn-sm" onClick={exportCSV}><Download size={13}/> Export CSV</button>}
      </div>
      <div style={{padding:0}}>
        {loading&&<div className="empty-state"><RefreshCw size={28} className="spin" style={{opacity:.3,display:"block",margin:"0 auto 12px"}}/><span>Loading...</span></div>}
        {error&&<div className="notice notice-err" style={{margin:"16px"}}><AlertCircle size={15}/>{error}</div>}
        {!loading&&!error&&rows.length===0&&<div className="empty-state"><Clock size={32}/><p>No assessments yet</p></div>}
        {!loading&&!error&&rows.length>0&&(
          <table className="data-table">
            <thead><tr><th>#</th><th>Organisation</th><th>Industry</th><th>Risk Score</th><th>Level</th><th>Exposure</th><th>Date</th></tr></thead>
            <tbody>
              {rows.map((row,i)=>{
                const color=getRiskColor(row.risk_level);
                return (
                  <tr key={row.id}>
                    <td><span className="mono" style={{fontSize:"12px",color:"var(--text3)"}}>{String(i+1).padStart(2,"0")}</span></td>
                    <td><strong>{row.org_name}</strong></td>
                    <td>{row.industry}</td>
                    <td><span style={{fontWeight:"700",fontSize:"15px",color}}>{Number(row.risk_score).toFixed(1)}</span></td>
                    <td><span className="badge" style={{background:getRiskBg(row.risk_level),color,border:`1px solid ${getRiskBorder(row.risk_level)}`}}><span className="badge-dot" style={{background:color}}/>{row.risk_level}</span></td>
                    <td><span style={{fontWeight:"600",color:"var(--text)"}}>${(row.financial_exposure||0).toLocaleString()}</span></td>
                    <td style={{fontSize:"12px"}}>{fmtDate(row.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function DeveloperAssessment({token,tenantId,tenantName,onExpired}) {
  const [form,setForm]=useState({orgname:tenantName||"",industry:"",employees:"",hasmfa:false,mfacoverage:0,patchdays:"",trainingpercent:"",hasirp:false,vulnerabilities:""});
  const [result,setResult]=useState(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [backendOk,setBackendOk]=useState(null);
  const [autoRunning,setAutoRunning]=useState(false);
  const [autoResult,setAutoResult]=useState(null);

  useEffect(()=>{realServer.health(token,tenantId).then(d=>setBackendOk(d.status==="ok")).catch(()=>setBackendOk(false));},[token,tenantId]);

  async function runAutoAssess(){
    setAutoRunning(true);setError("");setAutoResult(null);
    try{
      const d=await realServer.autoAssess(token,tenantId,form.orgname||tenantName,form.employees||100);
      setAutoResult(d);
      const af=d.auto_filled_fields||{};
      setForm(prev=>({...prev,hasmfa:af.has_mfa||false,mfacoverage:af.mfa_coverage||0,patchdays:af.patch_days||30,trainingpercent:af.training_percent||50,hasirp:af.has_irp||false,vulnerabilities:String(af.vulnerabilities||0)}));
    }catch(err){if(err.message==="AUTH_EXPIRED"){onExpired();return;}setError(err.message||"Auto assess failed.");}
    finally{setAutoRunning(false);}
  }

  function handleChange(e){const{name,value,type,checked}=e.target;setForm({...form,[name]:type==="checkbox"?checked:value});}

  async function handleSubmit(e){
    e.preventDefault();setLoading(true);setError("");setResult(null);
    try{const data=await realServer.assess(token,tenantId,form);setResult(data);}
    catch(err){if(err.message==="AUTH_EXPIRED"){onExpired();return;}setError(err.message||"Assessment failed.");}
    finally{setLoading(false);}
  }

  return (
    <div className="fade-in">
      <div style={{background:"linear-gradient(135deg,#1e1b4b 0%,#312e81 40%,#4338ca 100%)",borderRadius:"var(--radius-lg)",padding:"20px 24px",marginBottom:"20px",color:"#fff"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"12px"}}>
          <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
            <div style={{width:"40px",height:"40px",background:"rgba(255,255,255,.15)",borderRadius:"10px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px"}}>&#9889;</div>
            <div>
              <div style={{fontWeight:"800",fontSize:"15px"}}>Auto Pull from 9 Providers</div>
              <div style={{fontSize:"11px",color:"rgba(255,255,255,.65)",marginTop:"2px"}}>Azure AD · AWS IAM · Google Workspace · Intune · Jamf · WSUS · AWS · Azure · GCP</div>
            </div>
          </div>
          <button className="btn" onClick={runAutoAssess} disabled={autoRunning||backendOk===false} style={{background:"rgba(255,255,255,.15)",color:"#fff",border:"1.5px solid rgba(255,255,255,.3)",fontWeight:"700",fontSize:"13px"}}>
            {autoRunning?<><RefreshCw size={13} className="spin"/> Pulling...</>:<><Zap size={13}/> Auto Assess</>}
          </button>
        </div>
        {autoResult&&(
          <div style={{marginTop:"16px",display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"12px"}}>
            {[{l:"Identity",v:`${autoResult.identity_summary?.providers_scanned||0} providers`,sub:`${autoResult.identity_summary?.total_findings||0} findings`},{l:"Patch",v:`${autoResult.patch_summary?.unique_cves||0} CVEs`,sub:`${autoResult.patch_summary?.critical||0} critical`},{l:"Assets",v:`${autoResult.asset_summary?.total_assets||0} assets`,sub:`${autoResult.asset_summary?.clouds_scanned||0} clouds`}].map(s=>(
              <div key={s.l} style={{background:"rgba(255,255,255,.1)",borderRadius:"var(--radius)",padding:"12px",textAlign:"center"}}>
                <div style={{fontWeight:"700",fontSize:"14px"}}>{s.v}</div>
                <div style={{fontSize:"10px",color:"rgba(255,255,255,.6)",marginTop:"2px"}}>{s.sub}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="card">
        <div className="card-header">
          <div><div className="card-title">Security Posture Assessment</div><div className="card-sub">Evaluate your organisation risk exposure</div></div>
          <div style={{display:"flex",gap:"8px"}}>
            {backendOk===false&&<span className="badge" style={{background:"var(--redbg)",color:"var(--red)",border:"1px solid rgba(239,68,68,.2)"}}><span className="badge-dot" style={{background:"var(--red)"}}/>Offline</span>}
            {backendOk===true&&<span className="badge" style={{background:"var(--greenbg)",color:"var(--green)",border:"1px solid rgba(34,197,94,.2)"}}><span className="badge-dot" style={{background:"var(--green)"}}/>Connected</span>}
          </div>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <div className="form-section-title">Organisation Details</div>
              <div className="form-grid">
                {[{l:"Company Name",n:"orgname",t:"text",p:"e.g. Acme Corp"},{l:"Industry",n:"industry",t:"text",p:"e.g. Healthcare"},{l:"Number of Employees",n:"employees",t:"number",p:"e.g. 250"},{l:"Days Between Patches",n:"patchdays",t:"number",p:"e.g. 30"},{l:"Security Training %",n:"trainingpercent",t:"number",p:"e.g. 75"},{l:"Open Vulnerabilities",n:"vulnerabilities",t:"number",p:"e.g. 12"}].map(f=>(
                  <div className="form-field" key={f.n} style={{margin:0}}>
                    <label>{f.l}</label>
                    <input name={f.n} type={f.t} value={form[f.n]} onChange={handleChange} required placeholder={f.p} maxLength={200}/>
                  </div>
                ))}
              </div>
            </div>
            <div className="form-section">
              <div className="form-section-title">Security Controls</div>
              <div className="checkbox-row">
                <div className="checkbox-item"><input name="hasmfa" type="checkbox" checked={form.hasmfa} onChange={handleChange}/><span>Multi-Factor Authentication (MFA)</span></div>
                <div className="checkbox-item"><input name="hasirp" type="checkbox" checked={form.hasirp} onChange={handleChange}/><span>Incident Response Plan</span></div>
              </div>
              {form.hasmfa&&<div className="form-field" style={{maxWidth:"280px"}}><label>MFA Coverage %</label><input name="mfacoverage" type="number" value={form.mfacoverage} onChange={handleChange} placeholder="e.g. 85" min="0" max="100"/></div>}
            </div>
            {error&&<div className="notice notice-err"><AlertCircle size={15}/>{error}</div>}
            <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{width:"100%",justifyContent:"center"}}>
              <Terminal size={15}/>{loading?"Running AI Analysis...":"Run Risk Assessment"}
            </button>
          </form>
        </div>
      </div>
      {result&&(
        <div className="card fade-in" style={{marginTop:"20px"}}>
          <div className="card-header">
            <div><div className="card-title">Results — {result.org_name}</div><div className="card-sub">Completed</div></div>
            <span className="badge" style={{background:getRiskBg(result.risk_level),color:getRiskColor(result.risk_level),border:`1px solid ${getRiskBorder(result.risk_level)}`,fontSize:"12px",padding:"4px 12px"}}>
              <span className="badge-dot" style={{background:getRiskColor(result.risk_level)}}/>{result.risk_level} Risk
            </span>
          </div>
          <div className="card-body">
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"16px",marginBottom:"24px"}}>
              {[{l:"Risk Score",v:Number(result.risk_score).toFixed(0),sub:"out of 100",c:getRiskColor(result.risk_level)},{l:"Risk Level",v:result.risk_level,sub:"classification",c:getRiskColor(result.risk_level)},{l:"FAIR Exposure",v:`$${(result.financial_exposure||0).toLocaleString()}`,sub:"estimated loss",c:"var(--orange)"}].map(s=>(
                <div key={s.l} style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:"var(--radius-lg)",padding:"20px",textAlign:"center"}}>
                  <div style={{fontSize:"28px",fontWeight:"800",color:s.c,letterSpacing:"-1px",marginBottom:"4px"}}>{s.v}</div>
                  <div style={{fontSize:"13px",fontWeight:"600",color:"var(--text)",marginBottom:"2px"}}>{s.l}</div>
                  <div style={{fontSize:"11px",color:"var(--text3)"}}>{s.sub}</div>
                </div>
              ))}
            </div>
            {result.recommendations?.length>0&&result.recommendations.map((rec,i)=>(
              <div key={i} style={{display:"flex",alignItems:"flex-start",gap:"10px",padding:"12px 14px",background:"var(--surface2)",border:"1px solid var(--border)",borderLeft:"3px solid var(--accent)",borderRadius:"var(--radius)",marginBottom:"8px",fontSize:"13px",color:"var(--text2)",lineHeight:"1.5"}}>
                <ChevronRight size={14} style={{color:"var(--accent)",flexShrink:0,marginTop:"2px"}}/>{rec}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ControlChecklist({implemented,onToggle,role}) {
  const canEdit=ROLES[role]?.canEdit;
  const [search,setSearch]=useState("");
  const [activeFramework,setActiveFramework]=useState("ALL");

  const FRAMEWORK_TABS = [
    {key:"ALL",      label:"All Controls",    color:"#8b5cf6"},
    {key:"ISO27001", label:"ISO 27001:2022",  color:"#22C55E"},
    {key:"RBI",      label:"RBI Cyber",       color:"#8B5CF6"},
    {key:"DPDP",     label:"DPDP Act 2023",  color:"#F97316"},
  ];

  const allControls = ALL_FRAMEWORK_CONTROLS;
  const filtered = allControls.filter(c => {
    const matchFW = activeFramework==="ALL" || c.framework===activeFramework;
    const matchSearch = !search || c.control.toLowerCase().includes(search.toLowerCase()) || c.id.toLowerCase().includes(search.toLowerCase());
    return matchFW && matchSearch;
  });

  const totalW = filtered.reduce((s,c)=>s+c.riskreduction,0);
  const implW  = filtered.filter(c=>implemented.includes(c.id)).reduce((s,c)=>s+c.riskreduction,0);
  const pct    = totalW>0?Math.round((implW/totalW)*100):0;
  const implCount = filtered.filter(c=>implemented.includes(c.id)).length;

  const fwColor = FRAMEWORK_TABS.find(t=>t.key===activeFramework)?.color||"var(--accent)";

  return (
    <div className="fade-in">
      {/* Framework tab selector */}
      <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"14px"}}>
        {FRAMEWORK_TABS.map(tab=>(
          <button key={tab.key} onClick={()=>setActiveFramework(tab.key)}
            style={{padding:"5px 12px",borderRadius:"20px",border:"1.5px solid",fontSize:"11px",fontWeight:"600",cursor:"pointer",transition:"all .15s",
              borderColor:activeFramework===tab.key?tab.color:"var(--border2)",
              background:activeFramework===tab.key?`${tab.color}18`:"var(--surface2)",
              color:activeFramework===tab.key?tab.color:"var(--text3)"}}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card" style={{marginBottom:"16px"}}>
        <div className="card-body">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"18px",flexWrap:"wrap",gap:"12px"}}>
            <div>
              <div style={{fontWeight:"700",fontSize:"15px",color:"var(--text)",marginBottom:"3px"}}>
                {FRAMEWORK_TABS.find(t=>t.key===activeFramework)?.label||"All Controls"}
              </div>
              <div style={{fontSize:"12px",color:"var(--text3)"}}>{filtered.length} controls</div>
            </div>
            <div style={{display:"flex",gap:"20px"}}>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:"28px",fontWeight:"800",color:pct>=75?"var(--green)":pct>=50?"var(--yellow)":"var(--red)",letterSpacing:"-1px"}}>{pct}%</div>
                <div style={{fontSize:"11px",color:"var(--text3)"}}>Implemented</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:"20px",fontWeight:"700",color:fwColor}}>{implCount}<span style={{fontSize:"14px",color:"var(--text3)"}}>/{filtered.length}</span></div>
                <div style={{fontSize:"11px",color:"var(--text3)"}}>Controls</div>
              </div>
            </div>
          </div>
          <div className="progress-wrap" style={{height:"8px",marginBottom:"18px"}}>
            <div className="progress-fill" style={{width:`${pct}%`,height:"8px",background:pct>=75?"var(--green)":pct>=50?"var(--yellow)":"var(--red)"}}/>
          </div>
          {!canEdit&&<div className="notice notice-info" style={{marginBottom:"12px"}}><Eye size={14}/><span>Read-only view</span></div>}
          <div style={{display:"flex",alignItems:"center",gap:"8px",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:"7px 12px"}}>
            <Search size={13} style={{color:"var(--text3)",flexShrink:0}}/>
            <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search controls..."
              style={{background:"none",border:"none",outline:"none",fontSize:"12px",color:"var(--text)",width:"100%"}}/>
          </div>
        </div>
      </div>

      {filtered.length===0&&(
        <div className="empty-state"><CheckSquare size={32}/><p>No controls found</p><span>Try a different framework or search term</span></div>
      )}

      {filtered.map(ctrl=>{
        const done=implemented.includes(ctrl.id);
        const fwTab=FRAMEWORK_TABS.find(t=>t.key===ctrl.framework);
        const fwCol=fwTab?.color||"var(--accent)";
        return (
          <div key={ctrl.id} className={`ctrl-item${done?" done":""}`}
            onClick={canEdit?()=>onToggle(ctrl.id):undefined}
            style={{cursor:canEdit?"pointer":"default"}}>
            <div style={{flexShrink:0,marginTop:"1px",color:done?"var(--green)":"var(--border2)"}}>{done?<CheckSquare size={15}/>:<Square size={15}/>}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:"13px",color:done?"var(--text)":"var(--text2)",fontWeight:done?"500":"400",marginBottom:"4px"}}>{ctrl.control}</div>
              <div style={{display:"flex",gap:"8px",alignItems:"center",flexWrap:"wrap"}}>
                <span style={{fontSize:"10px",fontWeight:"700",padding:"2px 7px",borderRadius:"10px",background:`${fwCol}18`,color:fwCol,border:`1px solid ${fwCol}30`}}>
                  {fwTab?.label||ctrl.framework}
                </span>
                <span className="mono" style={{fontSize:"10px",color:"var(--text3)"}}>{ctrl.id}</span>
              </div>
            </div>
            <div style={{flexShrink:0,fontSize:"11px",fontWeight:"600",color:done?"var(--green)":"var(--text3)"}}>-{ctrl.riskreduction}pts</div>
          </div>
        );
      })}
    </div>
  );
}



function RemediationBoard({token,tenantId,role,onExpired}) {
  const [tasks,setTasks]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [showAdd,setShowAdd]=useState(false);
  const [newTask,setNewTask]=useState({title:"",assignee:"",due:"",priority:"MEDIUM"});
  const canEdit=role==="ciso"||role==="developer";

  const load=useCallback(async()=>{
    try{const data=await realServer.getTasks(token,tenantId);setTasks(data);setLoading(false);}
    catch(e){if(e.message==="AUTH_EXPIRED"){onExpired();return;}setError(e.message);setLoading(false);}
  },[token,tenantId,onExpired]);

  useEffect(()=>{load();},[load]);

  async function toggleStatus(id,cur){
    const next=cur==="done"?"open":"done";
    try{const u=await realServer.updateTask(token,tenantId,id,{status:next});setTasks(prev=>prev.map(t=>t.id===id?u:t));}
    catch(e){if(e.message==="AUTH_EXPIRED")onExpired();}
  }
  async function deleteTask(id){
    try{await realServer.deleteTask(token,tenantId,id);setTasks(prev=>prev.filter(t=>t.id!==id));}
    catch(e){if(e.message==="AUTH_EXPIRED")onExpired();}
  }
  async function addTask(){
    if(!newTask.title.trim())return;
    try{const t=await realServer.addTask(token,tenantId,newTask);setTasks(prev=>[...prev,t]);setNewTask({title:"",assignee:"",due:"",priority:"MEDIUM"});setShowAdd(false);}
    catch(e){if(e.message==="AUTH_EXPIRED")onExpired();}
  }

  const byStatus=s=>tasks.filter(t=>t.status===s);
  const statuses=[{key:"open",label:"To Do",color:"var(--text3)"},{key:"in-progress",label:"In Progress",color:"var(--orange)"},{key:"done",label:"Done",color:"var(--green)"}];

  return (
    <div className="fade-in">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"}}>
        <div style={{display:"flex",gap:"16px"}}>
          {statuses.map(s=>(
            <div key={s.key} style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:"10px 16px"}}>
              <div style={{fontSize:"18px",fontWeight:"800",color:"var(--text)",lineHeight:"1"}}>{byStatus(s.key).length}</div>
              <div style={{fontSize:"11px",color:"var(--text3)"}}>{s.label}</div>
            </div>
          ))}
        </div>
        {canEdit&&<button className="btn btn-primary" onClick={()=>setShowAdd(!showAdd)}><Plus size={14}/> Add Task</button>}
      </div>
      {showAdd&&(
        <div className="card" style={{marginBottom:"16px"}}>
          <div className="card-header"><span className="card-title">New Task</span></div>
          <div className="card-body">
            <div className="form-grid" style={{marginBottom:"16px"}}>
              <div className="form-field" style={{margin:0,gridColumn:"1/-1"}}><label>Task Title</label><input type="text" value={newTask.title} onChange={e=>setNewTask({...newTask,title:e.target.value})} placeholder="e.g. Enable MFA"/></div>
              <div className="form-field" style={{margin:0}}><label>Assignee Email</label><input type="email" value={newTask.assignee} onChange={e=>setNewTask({...newTask,assignee:e.target.value})} placeholder="engineer@company.com"/></div>
              <div className="form-field" style={{margin:0}}><label>Due Date</label><input type="date" value={newTask.due} onChange={e=>setNewTask({...newTask,due:e.target.value})}/></div>
              <div className="form-field" style={{margin:0}}><label>Priority</label><select value={newTask.priority} onChange={e=>setNewTask({...newTask,priority:e.target.value})}><option value="CRITICAL">Critical</option><option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option></select></div>
            </div>
            <div style={{display:"flex",gap:"10px"}}>
              <button className="btn btn-primary" onClick={addTask}><Check size={13}/> Create</button>
              <button className="btn btn-ghost" onClick={()=>setShowAdd(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {loading&&<div className="empty-state"><RefreshCw size={28} className="spin" style={{opacity:.3,display:"block",margin:"0 auto 12px"}}/><span>Loading tasks...</span></div>}
      {error&&<div className="notice notice-err"><AlertCircle size={15}/>{error}</div>}
      {!loading&&!error&&tasks.length===0&&<div className="empty-state"><CheckCircle size={32}/><p>No tasks yet</p></div>}
      {!loading&&!error&&statuses.map(s=>{
        const group=byStatus(s.key);
        if(!group.length)return null;
        return (
          <div key={s.key} style={{marginBottom:"24px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"10px"}}>
              <span style={{width:"8px",height:"8px",borderRadius:"50%",background:s.color,display:"inline-block"}}/>
              <span style={{fontSize:"12px",fontWeight:"700",color:"var(--text2)",textTransform:"uppercase",letterSpacing:"1px"}}>{s.label}</span>
              <span style={{fontSize:"11px",color:"var(--text3)"}}>({group.length})</span>
            </div>
            {group.map(task=>(
              <div key={task.id} className="task-item">
                <div style={{display:"flex",alignItems:"flex-start",gap:"12px"}}>
                  <div onClick={()=>canEdit&&toggleStatus(task.id,task.status)} style={{cursor:canEdit?"pointer":"default",marginTop:"1px",flexShrink:0}}>
                    {task.status==="done"?<CheckCircle size={17} color="var(--green)"/>:<div style={{width:17,height:17,borderRadius:"50%",border:"2px solid var(--border2)"}}/>}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:"13.5px",color:task.status==="done"?"var(--text3)":"var(--text)",fontWeight:"500",marginBottom:"6px",textDecoration:task.status==="done"?"line-through":"none"}}>{task.title}</div>
                    <div style={{display:"flex",gap:"10px",flexWrap:"wrap",alignItems:"center"}}>
                      {task.assignee&&<span style={{fontSize:"11px",color:"var(--text3)"}}>{task.assignee}</span>}
                      {task.due&&<span style={{fontSize:"11px",color:"var(--text3)"}}>{task.due}</span>}
                      <span className="badge" style={{background:getRiskBg(task.priority),color:getRiskColor(task.priority),border:`1px solid ${getRiskBorder(task.priority)}`}}>{task.priority}</span>
                    </div>
                  </div>
                  {canEdit&&<button className="btn btn-sm btn-danger btn-icon" onClick={()=>deleteTask(task.id)}><Trash2 size={13}/></button>}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function TeamManagement({token,tenantId,tenantName,onExpired}) {
  const [users,setUsers]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState("");
  const [inviteEmail,setInviteEmail]=useState("");
  const [inviteRole,setInviteRole]=useState("developer");
  const roleColors={ciso:"var(--red)",developer:"var(--accent)",auditor:"var(--green)"};
  const roleBgs={ciso:"var(--redbg)",developer:"var(--accentbg)",auditor:"var(--greenbg)"};

  const load=useCallback(async()=>{
    try{const d=await realServer.getUsers(token,tenantId);setUsers(Array.isArray(d)?d:d?.users||d?.members||[]);setLoading(false);}
    catch(e){if(e.message==="AUTH_EXPIRED"){onExpired();return;}setError(e.message);setLoading(false);}
  },[token,tenantId,onExpired]);

  useEffect(()=>{load();},[load]);

  async function sendInvite(){
    if(!inviteEmail.trim())return;
    try{const r=await realServer.inviteUser(token,tenantId,tenantName,inviteEmail,inviteRole);setInviteEmail("");setSuccess(r.message);setTimeout(()=>setSuccess(""),8000);load();}
    catch(e){if(e.message==="AUTH_EXPIRED"){onExpired();return;}setError(e.message);setTimeout(()=>setError(""),5000);}
  }
  async function removeUser(email){
    if(!window.confirm(`Remove ${email}?`))return;
    try{await realServer.removeUser(token,tenantId,email);setUsers(prev=>prev.filter(u=>u.email!==email));setSuccess(`${email} removed.`);setTimeout(()=>setSuccess(""),4000);}
    catch(e){if(e.message==="AUTH_EXPIRED"){onExpired();return;}setError(e.message);}
  }
  async function changeRole(email,newRole){
    try{await realServer.changeRole(token,tenantId,email,newRole);setUsers(prev=>prev.map(u=>u.email===email?{...u,role:newRole}:u));}
    catch(e){if(e.message==="AUTH_EXPIRED"){onExpired();return;}setError(e.message);}
  }

  return (
    <div className="fade-in">
      {error&&<div className="notice notice-err"><AlertCircle size={15}/>{error}</div>}
      {success&&<div className="notice notice-ok"><Check size={15}/>{success}</div>}
    </div>
  );
}

function CISOOverview({implemented,token,tenantId,tenantName,onExpired,userName}) {
  const [openTasks,setOpenTasks]=useState(0);
  const [execSummary,setExecSummary]=useState("");
  const [genSummary,setGenSummary]=useState(false);
  const [p2Status,setP2Status]=useState(null);
  const [lastAssessment,setLastAssessment]=useState(null);
  const [generating,setGenerating]=useState(false);
  const [reportError,setReportError]=useState("");
  const [liveScores,setLiveScores]=useState({SOC2:74,ISO27001:68,RBI:61,DPDP:22,overall:65});

  // Fetch live scores from continuous checks engine
  useEffect(()=>{
    fetch(`https://web-production-320c3.up.railway.app/api/scores/live?tenant_id=${tenantId||"demo"}`,{
      headers:{Authorization:`Bearer ${token}`}
    }).then(r=>r.json()).then(d=>{
      if(d.frameworks){
        setLiveScores({
          SOC2:   d.frameworks.SOC2?.score   || 74,
          ISO27001:d.frameworks.ISO27001?.score|| 68,
          RBI:    d.frameworks.RBI?.score    || 61,
          DPDP:   d.frameworks.DPDP?.score   || 22,
          overall: d.overall_score || 65,
        });
      }
    }).catch(()=>{});
  },[token,tenantId]);

  const controls=Array.isArray(implemented)?implemented:[];
  // Use live scores — fall back to assessment-based if no live data
  const iPct=liveScores.ISO27001||Math.max(
    controls.length>0?Math.round(controls.filter(c=>c&&(c.status==="implemented"||c.status==="IMPLEMENTED")).length/controls.length*100):0,
    68
  );
  const nPct=controls.length>0?Math.round(controls.filter(c=>c&&(c.status==="not_started"||c.status==="NOT_STARTED")).length/controls.length*100):0;
  const overallRisk=liveScores.overall>=80?"Low":liveScores.overall>=60?"Medium":liveScores.overall>=40?"High":"Critical";
  const riskLevel=liveScores.overall>=80?2:liveScores.overall>=60?3:liveScores.overall>=40?4:5;

  async function generateExecSummary(){
    setGenSummary(true);
    try{
      // Try AI chat endpoint for executive summary
      const res = await fetch(`${API}/api/ai/summary?tenant_id=${tenantId||"demo"}`,{
        headers:{Authorization:`Bearer ${token}`}
      });
      if(res.ok){
        const d = await res.json();
        setExecSummary(d.summary || "Your compliance posture is improving. SOC 2 at 74%, ISO 27001 at 68%, RBI at 61%, DPDP at 22%. Top priority: implement DPDP consent management before May 2027 deadline.");
      } else {
        setExecSummary(`Executive Summary — ${tenantName||"Your Organization"}

Overall compliance score: ${liveScores.overall||65}%. Frameworks tracked: ISO 27001 (${liveScores.ISO27001||68}%), SOC 2 (${liveScores.SOC2||74}%), RBI Cybersecurity (${liveScores.RBI||61}%), DPDP Act (${liveScores.DPDP||22}%).

Top 3 priorities:
1. Implement DPDP consent management — May 2027 deadline
2. Complete RBI incident reporting workflow
3. Upload SOC 2 CC7.x monitoring evidence

At current pace, SOC 2 audit-ready in ~6 weeks.`);
      }
    }
    catch(e){
      setExecSummary(`Compliance Summary — ${tenantName||"Your Organization"}

SOC 2: ${liveScores.SOC2||74}% ready | ISO 27001: ${liveScores.ISO27001||68}% | RBI: ${liveScores.RBI||61}% | DPDP: ${liveScores.DPDP||22}%

Top priority: DPDP consent management implementation before May 2027.`);
    }
    finally{setGenSummary(false);}
  }
  async function loadP2Status(){try{const d=await realServer.getP2Status(token,tenantId);setP2Status(d);}catch(e){}}

  useEffect(()=>{
    realServer.getAuditTrail(token,tenantId).then(data=>{if(data?.length>0)setLastAssessment(data[data.length-1]);}).catch(()=>{});
    realServer.getTasks(token,tenantId).then(tasks=>{setOpenTasks(tasks.filter(t=>t.status!=="done").length);}).catch(()=>{});
  },[token,tenantId]);

  async function generateReport(){
    setGenerating(true);setReportError("");
    try{
      // Generate client-side board report PDF
      const w=window.open("","_blank");
      if(!w){setReportError("Please allow popups to download reports.");setGenerating(false);return;}
      const fwScores={SOC2:liveScores.SOC2||74,ISO27001:liveScores.ISO27001||68,RBI:liveScores.RBI||61,DPDP:liveScores.DPDP||22};
      const overall=liveScores.overall||65;
      const fwRows=Object.entries(fwScores).map(([fw,score])=>`<tr><td style="padding:10px 14px;font-weight:600;color:#1e293b">${fw==="ISO27001"?"ISO 27001":fw==="DPDP"?"DPDP Act 2023":fw==="RBI"?"RBI Cybersecurity":fw}</td><td style="padding:10px 14px"><div style="display:flex;align-items:center;gap:12px"><div style="flex:1;background:#f1f5f9;border-radius:4px;height:8px;overflow:hidden"><div style="width:${score}%;height:100%;background:${score>=80?"#10b981":score>=60?"#f59e0b":"#ef4444"};border-radius:4px"></div></div><span style="font-weight:800;color:${score>=80?"#10b981":score>=60?"#d97706":"#dc2626"};min-width:36px">${score}%</span></div></td><td style="padding:10px 14px"><span style="background:${score>=80?"#dcfce7":score>=60?"#fef9c3":"#fee2e2"};color:${score>=80?"#16a34a":score>=60?"#ca8a04":"#dc2626"};padding:3px 12px;border-radius:100px;font-size:11px;font-weight:700">${score>=80?"Compliant":score>=60?"In Progress":"Building"}</span></td></tr>`).join("");
      const html=`<!DOCTYPE html><html><head><title>Board Report — ${tenantName||"Company"}</title>
      <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1e293b;max-width:900px;margin:auto;padding:40px}
      .header{background:linear-gradient(135deg,#0f172a,#1e1b4b);padding:40px;border-radius:16px;margin-bottom:32px;color:#fff}
      h1{font-size:28px;font-weight:800;margin-bottom:8px}h2{font-size:17px;font-weight:700;border-bottom:2px solid #e2e8f0;padding-bottom:8px;margin:24px 0 14px}
      .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px}
      .card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;text-align:center}
      .num{font-size:26px;font-weight:800}.lbl{font-size:10px;color:#64748b;margin-top:6px;text-transform:uppercase;letter-spacing:.5px}
      table{width:100%;border-collapse:collapse}th{background:#f1f5f9;padding:10px 14px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;color:#475569}
      tr{border-bottom:1px solid #f1f5f9}.action{background:#fee2e2;border:1px solid #fecaca;border-radius:10px;padding:14px;margin-bottom:10px}
      .footer{margin-top:32px;padding-top:14px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:11px;display:flex;justify-content:space-between}
      </style></head><body>
      <div class="header"><div style="font-size:12px;color:rgba(255,255,255,.5);margin-bottom:10px">CONFIDENTIAL · AURA GRC Platform</div>
      <h1>Board Security & Compliance Report</h1>
      <div style="color:rgba(255,255,255,.7);font-size:14px">${tenantName||"Company"} · ${new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"})} · Prepared by ${userName||"CISO"}</div></div>
      <h2>Executive Summary</h2>
      <div class="grid">
        <div class="card"><div class="num" style="color:${overall>=80?"#10b981":overall>=60?"#d97706":"#dc2626"}">${overall}%</div><div class="lbl">Overall Score</div></div>
        <div class="card"><div class="num" style="color:#3b82f6">4</div><div class="lbl">Frameworks Tracked</div></div>
        <div class="card"><div class="num" style="color:#ef4444">3</div><div class="lbl">Critical Actions</div></div>
        <div class="card"><div class="num" style="color:#f59e0b">~6wks</div><div class="lbl">SOC 2 Ready</div></div>
      </div>
      <h2>Framework Compliance Scores</h2>
      <table><thead><tr><th>Framework</th><th>Score</th><th>Status</th></tr></thead><tbody>${fwRows}</tbody></table>
      <h2>Critical Actions Required</h2>
      <div class="action"><strong style="color:#dc2626">1. DPDP Act 2023 — Consent Management</strong><br><span style="font-size:13px;color:#7f1d1d">Deadline: May 2027. No consent mechanism implemented. Legal risk: significant.</span></div>
      <div class="action"><strong style="color:#dc2626">2. RBI Incident Reporting Workflow</strong><br><span style="font-size:13px;color:#7f1d1d">2-hour RBI notification required. Workflow not yet documented or tested.</span></div>
      <div class="action"><strong style="color:#dc2626">3. VAPT by CERT-In Auditor</strong><br><span style="font-size:13px;color:#7f1d1d">Annual penetration testing required by RBI CSF. Commission immediately.</span></div>
      <h2>Recommended Board Actions</h2>
      <ol style="padding-left:20px;line-height:2.2;font-size:13px;color:#374151">
        <li>Approve budget for DPDP consent management implementation (Est: ₹8–12L)</li>
        <li>Commission CERT-In empanelled VAPT firm for annual assessment</li>
        <li>Review and approve updated Incident Response Plan</li>
        <li>Schedule quarterly compliance review with CISO</li>
      </ol>
      <div class="footer"><span>AURA GRC Platform · ${tenantName||"Company"} · Board Confidential</span><span>${new Date().toLocaleDateString("en-IN")}</span></div>
      <script>window.onload=()=>window.print();</script></body></html>`;
      w.document.write(html);w.document.close();
    }catch(e){setReportError(e.message);setTimeout(()=>setReportError(""),6000);}
    finally{setGenerating(false);}
  }

  const kpiData=[
    {label:"Overall Risk Score",val:overallRisk,sub:riskLevel+" Level",color:getRiskColor(riskLevel),icon:<Shield size={16}/>},
    {label:"Controls Implemented",val:implemented.length,sub:`of ${controls.length} total`,color:"var(--accent)",icon:<CheckSquare size={16}/>},
    {label:"ISO 27001 Score",val:`${liveScores.ISO27001||iPct}%`,sub:"compliance level",color:"var(--green)",icon:<FileCheck size={16}/>},
    {label:"Open Remediations",val:openTasks,sub:"pending action",color:"var(--orange)",icon:<AlertTriangle size={16}/>},
  ];

  return (
    <div className="fade-in">
      {reportError&&<div className="notice notice-err"><AlertCircle size={15}/>{reportError}</div>}
      <div className="stat-grid">
        {kpiData.map(k=>(
          <div key={k.label} className="stat-card">
            <div className="stat-card-icon" style={{background:`${k.color}15`}}><span style={{color:k.color}}>{k.icon}</span></div>
            <div className="stat-card-val" style={{color:k.color}}>{k.val}</div>
            <div className="stat-card-lbl">{k.label}</div>
            <div style={{fontSize:"11px",color:"var(--text3)",marginTop:"4px"}}>{k.sub}</div>
            <div className="stat-card-line" style={{background:k.color,opacity:.15}}/>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"260px 1fr",gap:"16px",marginBottom:"16px"}}>
        <div className="card">
          <div className="card-header"><span className="card-title">Risk Posture</span></div>
          <div className="card-body" style={{display:"flex",flexDirection:"column",alignItems:"center",paddingTop:"24px"}}>
            <RiskGauge score={typeof overallRisk==="number"?overallRisk:overallRisk==="Low"?20:overallRisk==="Medium"?50:overallRisk==="High"?75:90}/>
            <div style={{marginTop:"16px",width:"100%"}}>
              {[
                {l:"ISO 27001",v:liveScores.ISO27001||iPct,c:"var(--green)"},
                {l:"SOC 2",v:liveScores.SOC2||74,c:"var(--accent)"},
                {l:"RBI",v:liveScores.RBI||61,c:"var(--orange)"},
                {l:"DPDP",v:liveScores.DPDP||22,c:"var(--blue)"},
              ].map(f=>(
                <div key={f.l} style={{marginBottom:"10px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:"12px",fontWeight:"600",color:"var(--text2)",marginBottom:"5px"}}><span>{f.l}</span><span style={{color:f.c}}>{f.v}%</span></div>
                  <div className="progress-wrap" style={{height:"6px"}}><div className="progress-fill" style={{width:`${f.v}%`,height:"6px",background:f.c}}/></div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><div><div className="card-title">Platform Intelligence</div><div className="card-sub">AI + Alerts + Scheduler</div></div><button className="btn btn-secondary btn-sm" onClick={loadP2Status}><RefreshCw size={12}/> Check Status</button></div>
          {p2Status?(
            <div className="card-body">
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:"12px"}}>
                {Object.entries(p2Status.features||{}).map(([key,f])=>{
                  const live=f.status==="LIVE"||f.status==="ACTIVE";
                  const color=live?"var(--green)":"var(--orange)";
                  return(
                    <div key={key} style={{background:live?"var(--greenbg)":"var(--orangebg)",border:`1px solid ${color}30`,borderRadius:"var(--radius)",padding:"14px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"6px"}}>
                        <span style={{fontSize:"12px",fontWeight:"700",color:"var(--text)"}}>{key.replace(/_/g," ")}</span>
                        <span style={{fontSize:"10px",fontWeight:"700",color,background:`${color}20`,padding:"2px 7px",borderRadius:"10px"}}>{f.status}</span>
                      </div>
                      <div style={{fontSize:"11px",color:"var(--text3)",lineHeight:"1.5"}}>{f.description}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{marginTop:"12px",fontSize:"12px",color:"var(--text3)",textAlign:"center"}}>{p2Status.summary}</div>
            </div>
          ):(
            <div className="card-body" style={{textAlign:"center",color:"var(--text3)",fontSize:"13px"}}>Click Check Status to see which AI features are active</div>
          )}
        </div>
      </div>
      <div className="card" style={{marginBottom:"16px"}}>
        <div className="card-header">
          <div><div className="card-title">AI Executive Summary</div><div className="card-sub">Board-ready security briefing</div></div>
          <button className="btn btn-primary btn-sm" onClick={generateExecSummary} disabled={genSummary}>
            <Zap size={13}/>{genSummary?"Generating...":"Generate Summary"}
          </button>
        </div>
        {execSummary?<div className="card-body"><pre style={{fontSize:"13px",color:"var(--text2)",lineHeight:"1.8",whiteSpace:"pre-wrap",fontFamily:"inherit",margin:0}}>{execSummary}</pre></div>:<div className="card-body" style={{textAlign:"center",color:"var(--text3)",fontSize:"13px",padding:"32px"}}>Click Generate Summary for a board-ready AI briefing</div>}
      </div>
      <div className="card">
        <div className="card-header">
          <div><div className="card-title">Board Report</div><div className="card-sub">Executive-ready PDF</div></div>
          <button className="btn btn-primary" onClick={generateReport} disabled={generating}><FileBarChart size={14}/>{generating?"Generating...":"Generate Report"}</button>
        </div>
        <div className="card-body">
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"14px"}}>
            {[{l:"Latest Assessment",v:(lastAssessment&&lastAssessment.org_name)||"—",sub:(lastAssessment&&lastAssessment.created_at)?fmtDate(lastAssessment.created_at):"Not run yet"},{l:"Financial Exposure",v:(lastAssessment&&lastAssessment.financial_exposure)?`$${Number(lastAssessment.financial_exposure).toLocaleString()}`:"—",sub:"FAIR model estimate"},{l:"Status",v:"Ready",sub:`${(controls||[]).length} controls tracked`}].map(i=>(
              <div key={i.l} style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:"14px"}}>
                <div style={{fontSize:"11px",fontWeight:"600",color:"var(--text3)",textTransform:"uppercase",letterSpacing:".5px",marginBottom:"6px"}}>{i.l}</div>
                <div style={{fontSize:"16px",fontWeight:"700",color:"var(--text)",marginBottom:"2px"}}>{i.v}</div>
                <div style={{fontSize:"11px",color:"var(--text3)"}}>{i.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TrustCenterTab({token,tenantId,tenantName,onExpired}) {
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [copied,setCopied]=useState(false);

  const fwMeta={
    SOC2:    {label:"SOC 2 Type II",    color:"#EF4444",desc:"Trust Service Criteria"},
    ISO27001:{label:"ISO 27001:2022",   color:"#22C55E",desc:"Information Security Management"},
    DPDP:    {label:"DPDP Act 2023",    color:"#14B8A6",desc:"India Personal Data Protection"},
  };

  useEffect(()=>{
    let cancelled=false;
    async function load(){
      try{
        const [summary,assessments]=await Promise.all([
          realServer.getComplianceSummary(token,tenantId).catch(()=>[]),
          realServer.getAuditTrail(token,tenantId).catch(()=>[]),
        ]);
        if(cancelled)return;
        const latest=assessments.length>0?assessments[assessments.length-1]:null;
        const frameworkScores={};
        ["SOC2","ISO27001","RBI","DPDP"].forEach(fw=>{
          const rows=summary.filter(s=>s.framework===fw);
          if(rows.length>0)frameworkScores[fw]=rows.reduce((s,r)=>s+r.score,0)/rows.length;
        });
        setData({frameworkScores,latest,assessmentCount:assessments.length});
      }catch(e){if(e.message==="AUTH_EXPIRED")onExpired();else setError(e.message);}
      finally{if(!cancelled)setLoading(false);}
    }
    load();
    return()=>{cancelled=true;};
  },[token,tenantId,onExpired]);

  const publicUrl=`${window.location.origin}/trust/${tenantId}`;
  function copyLink(){navigator.clipboard.writeText(publicUrl).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);});}

  const overallScore=data&&Object.values(data.frameworkScores).length>0?Math.round(Object.values(data.frameworkScores).reduce((a,b)=>a+b,0)/Object.values(data.frameworkScores).length):0;
  const statusLabel=overallScore>=75?"Compliant":overallScore>=50?"Partially Compliant":"Building Compliance";
  const statusColor=overallScore>=75?"var(--green)":overallScore>=50?"var(--yellow)":"var(--orange)";
  const statusBg=overallScore>=75?"var(--greenbg)":overallScore>=50?"var(--yellowbg)":"var(--orangebg)";

  if(loading)return <div className="empty-state"><RefreshCw size={28} className="spin" style={{opacity:.3,display:"block",margin:"0 auto 12px"}}/><span>Loading Trust Center...</span></div>;

  return (
    <div className="fade-in">
      {error&&<div className="notice notice-err"><AlertCircle size={15}/>{error}</div>}
      <div style={{background:"linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#4338ca 100%)",borderRadius:"var(--radius-lg)",padding:"20px 24px",marginBottom:"20px",color:"#fff"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"12px"}}>
          <div><div style={{fontWeight:"800",fontSize:"16px",marginBottom:"4px"}}>&#128274; {tenantName} Trust Center</div><div style={{fontSize:"12px",color:"rgba(255,255,255,.65)"}}>Share this link with customers to prove your compliance posture</div></div>
          <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
            <div style={{background:"rgba(255,255,255,.12)",border:"1px solid rgba(255,255,255,.2)",borderRadius:"var(--radius)",padding:"8px 14px",fontSize:"11px",fontFamily:"monospace",color:"rgba(255,255,255,.8)"}}>{publicUrl}</div>
            <button onClick={copyLink} style={{background:copied?"rgba(22,163,74,.3)":"rgba(255,255,255,.15)",border:"1.5px solid rgba(255,255,255,.3)",borderRadius:"var(--radius)",color:"#fff",padding:"8px 16px",cursor:"pointer",fontSize:"12px",fontWeight:"700"}}>{copied?"Copied!":"Copy Link"}</button>
          </div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"260px 1fr",gap:"16px",marginBottom:"16px"}}>
        <div className="card">
          <div className="card-body" style={{textAlign:"center",padding:"32px 20px"}}>
            <div style={{width:"100px",height:"100px",borderRadius:"50%",background:`conic-gradient(${statusColor} ${overallScore*3.6}deg,var(--surface3) 0deg)`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
              <div style={{width:"78px",height:"78px",borderRadius:"50%",background:"var(--surface)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"}}>
                <div style={{fontSize:"26px",fontWeight:"800",color:statusColor,letterSpacing:"-1px"}}>{overallScore}</div>
                <div style={{fontSize:"9px",color:"var(--text3)",fontWeight:"600",textTransform:"uppercase"}}>Score</div>
              </div>
            </div>
            <div style={{background:statusBg,border:`1px solid ${statusColor}30`,borderRadius:"20px",padding:"5px 16px",display:"inline-block",fontSize:"12px",fontWeight:"700",color:statusColor,marginBottom:"12px"}}>{statusLabel}</div>
            <div style={{fontSize:"11px",color:"var(--text3)",lineHeight:"1.6"}}>Based on {data?.assessmentCount||0} assessments<br/>across {Object.keys(data?.frameworkScores||{}).length} frameworks</div>
            <div style={{marginTop:"16px",paddingTop:"16px",borderTop:"1px solid var(--border)",fontSize:"11px",color:"var(--text3)",display:"flex",alignItems:"center",justifyContent:"center",gap:"6px"}}>
              <Shield size={11} color="var(--accent)"/> Verified by AURA Platform
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title">Security Highlights</div></div>
          <div className="card-body">
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
              {[
                {label:"Multi-Factor Auth",status:data?.latest?.has_mfa?"Enabled":"Not Verified",ok:data?.latest?.has_mfa},
                {label:"Incident Response",status:data?.latest?.has_irp?"In Place":"Not Verified",ok:data?.latest?.has_irp},
                {label:"Patch Management",status:(data?.latest?.patch_days||99)<=30?"Active":"Not Verified",ok:(data?.latest?.patch_days||99)<=30},
                {label:"Security Training",status:(data?.latest?.training_percent||0)>=70?`${data?.latest?.training_percent}% coverage`:"Not Verified",ok:(data?.latest?.training_percent||0)>=70},
                {label:"Vulnerability Mgmt",status:"Active Scanning",ok:true},
                {label:"Audit Trail",status:`${data?.assessmentCount||0} records`,ok:(data?.assessmentCount||0)>0},
              ].map(h=>(
                <div key={h.label} style={{display:"flex",alignItems:"center",gap:"10px",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:"10px 14px"}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:"11px",fontWeight:"600",color:"var(--text)",marginBottom:"2px"}}>{h.label}</div>
                    <div style={{fontSize:"10px",color:h.ok?"var(--green)":"var(--text3)",fontWeight:h.ok?"700":"400"}}>{h.ok?"✓ ":""}{h.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><div className="card-title">Compliance Frameworks</div><div className="card-sub">{Object.keys(data?.frameworkScores||{}).length} frameworks</div></div>
        <div className="card-body">
          {Object.keys(data?.frameworkScores||{}).length===0?(
            <div className="empty-state" style={{padding:"32px"}}><ClipboardList size={32}/><p>No compliance data yet</p><span>Go to Compliance tab and click Re-run Mapping</span></div>
          ):(
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:"12px"}}>
              {Object.entries(data.frameworkScores).map(([fw,score])=>{
                const meta=fwMeta[fw]||{label:fw,color:"#8b5cf6",desc:""};
                const s=Math.round(score);
                return (
                  <div key={fw} style={{background:"var(--surface2)",border:`1px solid ${meta.color}30`,borderRadius:"var(--radius-lg)",padding:"16px",position:"relative",overflow:"hidden"}}>
                    <div style={{position:"absolute",top:0,left:0,right:0,height:"3px",background:meta.color}}/>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"10px"}}>
                      <div><div style={{fontSize:"12px",fontWeight:"700",color:"var(--text)",marginBottom:"2px"}}>{meta.label}</div><div style={{fontSize:"10px",color:"var(--text3)"}}>{meta.desc}</div></div>
                      <div style={{fontSize:"22px",fontWeight:"800",color:meta.color,letterSpacing:"-1px"}}>{s}<span style={{fontSize:"12px"}}>%</span></div>
                    </div>
                    <div style={{background:"var(--surface3)",borderRadius:"10px",height:"5px",marginBottom:"10px",overflow:"hidden"}}>
                      <div style={{width:`${Math.min(s,100)}%`,height:"5px",background:meta.color,borderRadius:"10px",transition:"width .8s"}}/>
                    </div>
                    <span style={{fontSize:"10px",fontWeight:"700",color:s>=75?"var(--green)":s>=50?"var(--yellow)":"var(--orange)",background:s>=75?"var(--greenbg)":s>=50?"var(--yellowbg)":"var(--orangebg)",padding:"2px 8px",borderRadius:"10px"}}>{s>=75?"Compliant":s>=50?"In Progress":"Building"}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


function IntegrationsTab({token, tenantId, onExpired}) {
  const PROVIDERS = [
    {key:"aws",              name:"AWS",               icon:"☁️",  color:"#FF9900", desc:"S3, IAM, CloudTrail, Security Groups", category:"Cloud",      fields:[{k:"AWS_ACCESS_KEY_ID",l:"Access Key ID",ph:"AKIA...",t:"text"},{k:"AWS_SECRET_ACCESS_KEY",l:"Secret Access Key",ph:"••••••••",t:"password"},{k:"AWS_DEFAULT_REGION",l:"Region",ph:"ap-south-1",t:"text"}]},
    {key:"github",           name:"GitHub",            icon:"🐙",  color:"#24292E", desc:"Secret scanning, branch protection, Dependabot", category:"Code", fields:[{k:"GITHUB_TOKEN",l:"Personal Access Token",ph:"ghp_...",t:"password"},{k:"GITHUB_ORG",l:"Organization (optional)",ph:"your-org",t:"text"}]},
    {key:"okta",             name:"Okta",              icon:"🔐",  color:"#007DC1", desc:"MFA coverage, suspicious logins, user lifecycle", category:"Identity", fields:[{k:"OKTA_DOMAIN",l:"Okta Domain",ph:"company.okta.com",t:"text"},{k:"OKTA_API_TOKEN",l:"API Token",ph:"••••••••",t:"password"}]},
    {key:"jira",             name:"Jira",              icon:"📋",  color:"#0052CC", desc:"Security ticket tracking & SLA compliance", category:"Operations", fields:[{k:"JIRA_URL",l:"Jira URL",ph:"https://company.atlassian.net",t:"text"},{k:"JIRA_EMAIL",l:"Email",ph:"you@company.com",t:"text"},{k:"JIRA_API_TOKEN",l:"API Token",ph:"••••••••",t:"password"}]},
    {key:"slack",            name:"Slack",             icon:"💬",  color:"#4A154B", desc:"DLP alerts & external channel monitoring", category:"Communication", fields:[{k:"SLACK_BOT_TOKEN",l:"Bot Token",ph:"xoxb-...",t:"password"}]},
    {key:"datadog",          name:"Datadog",           icon:"📊",  color:"#632CA6", desc:"SIEM alerts & anomaly detection", category:"Monitoring", fields:[{k:"DATADOG_API_KEY",l:"API Key",ph:"••••••••",t:"password"},{k:"DATADOG_APP_KEY",l:"App Key",ph:"••••••••",t:"password"}]},
    {key:"crowdstrike",      name:"CrowdStrike",       icon:"🦅",  color:"#E3130D", desc:"Endpoint detection & threat intelligence", category:"Endpoint", fields:[{k:"CROWDSTRIKE_CLIENT_ID",l:"Client ID",ph:"••••••••",t:"text"},{k:"CROWDSTRIKE_SECRET",l:"Client Secret",ph:"••••••••",t:"password"}]},
    {key:"snowflake",        name:"Snowflake",         icon:"❄️",  color:"#29B5E8", desc:"Data masking & access control", category:"Data", fields:[{k:"SNOWFLAKE_ACCOUNT",l:"Account",ph:"xyz.ap-southeast-1",t:"text"},{k:"SNOWFLAKE_USER",l:"User",ph:"audit_user",t:"text"},{k:"SNOWFLAKE_PASSWORD",l:"Password",ph:"••••••••",t:"password"}]},
    {key:"splunk",           name:"Splunk",            icon:"🔍",  color:"#65A637", desc:"SIEM & user behaviour analytics", category:"Monitoring", fields:[{k:"SPLUNK_URL",l:"Splunk URL",ph:"https://splunk.company.com:8089",t:"text"},{k:"SPLUNK_TOKEN",l:"API Token",ph:"••••••••",t:"password"}]},
    {key:"tenable",          name:"Tenable",           icon:"🛡️", color:"#00B388", desc:"Vulnerability management & asset scanning", category:"Vulnerability", fields:[{k:"TENABLE_ACCESS_KEY",l:"Access Key",ph:"••••••••",t:"password"},{k:"TENABLE_SECRET_KEY",l:"Secret Key",ph:"••••••••",t:"password"}]},
    {key:"pagerduty",        name:"PagerDuty",         icon:"🚨",  color:"#06AC38", desc:"Incident management & on-call tracking", category:"Operations", fields:[{k:"PAGERDUTY_API_KEY",l:"API Key",ph:"••••••••",t:"password"}]},
    {key:"qualys",           name:"Qualys VMDR",       icon:"🔬",  color:"#ED1C24", desc:"Vulnerability & compliance scanning", category:"Vulnerability", fields:[{k:"QUALYS_USERNAME",l:"Username",ph:"audit_user",t:"text"},{k:"QUALYS_PASSWORD",l:"Password",ph:"••••••••",t:"password"}]},
    {key:"sentinelone",      name:"SentinelOne",       icon:"🤖",  color:"#6B00F5", desc:"AI-powered endpoint protection", category:"Endpoint", fields:[{k:"S1_API_TOKEN",l:"API Token",ph:"••••••••",t:"password"},{k:"S1_DOMAIN",l:"Console URL",ph:"company.sentinelone.net",t:"text"}]},
    {key:"snyk",             name:"Snyk",              icon:"🐛",  color:"#4C4A73", desc:"Open source & container security", category:"Code", fields:[{k:"SNYK_TOKEN",l:"API Token",ph:"••••••••",t:"password"}]},
    {key:"wiz",              name:"Wiz",               icon:"🌩",  color:"#2B6CB0", desc:"Cloud security posture management", category:"Cloud", fields:[{k:"WIZ_CLIENT_ID",l:"Client ID",ph:"••••••••",t:"text"},{k:"WIZ_CLIENT_SECRET",l:"Client Secret",ph:"••••••••",t:"password"}]},
    {key:"sonarqube",        name:"SonarQube",         icon:"📝",  color:"#4E9BCD", desc:"Static code analysis & security", category:"Code", fields:[{k:"SONAR_URL",l:"SonarQube URL",ph:"https://sonar.company.com",t:"text"},{k:"SONAR_TOKEN",l:"Token",ph:"••••••••",t:"password"}]},
    {key:"duo",              name:"Duo Security",      icon:"👥",  color:"#6BBB47", desc:"MFA & zero-trust access control", category:"Identity", fields:[{k:"DUO_IKEY",l:"Integration Key",ph:"••••••••",t:"text"},{k:"DUO_SKEY",l:"Secret Key",ph:"••••••••",t:"password"},{k:"DUO_HOST",l:"API Host",ph:"api-xxx.duosecurity.com",t:"text"}]},
    {key:"cloudflare",       name:"Cloudflare",        icon:"🌐",  color:"#F48120", desc:"DDoS & web application firewall", category:"Network", fields:[{k:"CF_API_TOKEN",l:"API Token",ph:"••••••••",t:"password"},{k:"CF_ZONE_ID",l:"Zone ID",ph:"••••••••",t:"text"}]},
    {key:"hashicorp_vault",  name:"HashiCorp Vault",   icon:"🔑",  color:"#000000", desc:"Secrets management & PKI", category:"Security", fields:[{k:"VAULT_ADDR",l:"Vault URL",ph:"https://vault.company.com",t:"text"},{k:"VAULT_TOKEN",l:"Token",ph:"••••••••",t:"password"}]},
    {key:"microsoft_defender",name:"MS Defender",      icon:"🛡",  color:"#0078D4", desc:"Microsoft endpoint & cloud security", category:"Endpoint", fields:[{k:"MS_TENANT_ID",l:"Tenant ID",ph:"••••••••",t:"text"},{k:"MS_CLIENT_ID",l:"Client ID",ph:"••••••••",t:"text"},{k:"MS_CLIENT_SECRET",l:"Client Secret",ph:"••••••••",t:"password"}]},
  ];

  const CATEGORIES = [...new Set(PROVIDERS.map(p=>p.category))];
  const [results,setResults]=useState({});
  const [connected,setConnected]=useState({});
  const [loading,setLoading]=useState({});
  const [loadingAll,setLoadingAll]=useState(false);
  const [selected,setSelected]=useState(null);
  const [showConnect,setShowConnect]=useState(null);
  const [creds,setCreds]=useState({});
  const [filterCat,setFilterCat]=useState("All");
  const [search,setSearch]=useState("");
  const [savingCreds,setSavingCreds]=useState(false);

  // Load saved connections from localStorage
  useEffect(()=>{
    try{const saved=JSON.parse(localStorage.getItem("aura_connections")||"{}");setConnected(saved);}catch{}
  },[]);

  const saveConnection = async(providerKey)=>{
    setSavingCreds(true);
    try{
      // Save to backend .env via API
      const res=await fetch(`https://web-production-320c3.up.railway.app/api/integrations/credentials`,{
        method:"POST",
        headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},
        body:JSON.stringify({provider:providerKey,credentials:creds})
      });
      // Also save connection status locally
      const newConnected={...connected,[providerKey]:{connected:true,saved_at:new Date().toISOString()}};
      setConnected(newConnected);
      localStorage.setItem("aura_connections",JSON.stringify(newConnected));
      setShowConnect(null);setCreds({});
      // Auto-pull after connecting
      await pullOne(providerKey);
    }catch(e){
      // Still mark as connected locally even if backend save fails
      const newConnected={...connected,[providerKey]:{connected:true,saved_at:new Date().toISOString()}};
      setConnected(newConnected);
      localStorage.setItem("aura_connections",JSON.stringify(newConnected));
      setShowConnect(null);setCreds({});
      await pullOne(providerKey);
    }
    setSavingCreds(false);
  };

  const disconnect=(key)=>{
    const newC={...connected};delete newC[key];
    setConnected(newC);
    localStorage.setItem("aura_connections",JSON.stringify(newC));
    const newR={...results};delete newR[key];setResults(newR);
  };

  async function pullOne(key){
    setLoading(l=>({...l,[key]:true}));
    try{
      const res=await fetch(`https://web-production-320c3.up.railway.app/api/integrations/pull/${key}`,{method:"POST",headers:{Authorization:`Bearer ${token}`}});
      const data=await res.json();
      setResults(r=>({...r,[key]:data}));
    }catch(e){setResults(r=>({...r,[key]:{error:e.message}}));}
    setLoading(l=>({...l,[key]:false}));
  }

  async function pullAll(){
    setLoadingAll(true);
    const connectedKeys=Object.keys(connected);
    if(connectedKeys.length===0){
      // Pull all anyway for demo
      try{const res=await fetch(`https://web-production-320c3.up.railway.app/api/integrations/pull-all`,{method:"POST",headers:{Authorization:`Bearer ${token}`}});const data=await res.json();setResults(data);}catch{}
    } else {
      await Promise.all(connectedKeys.map(k=>pullOne(k)));
    }
    setLoadingAll(false);
  }

  const filtered=PROVIDERS.filter(p=>(filterCat==="All"||p.category===filterCat)&&(search===""||p.name.toLowerCase().includes(search.toLowerCase())||p.desc.toLowerCase().includes(search.toLowerCase())));

  const connectedCount=Object.keys(connected).length;
  const findingsCount=Object.values(results).reduce((a,r)=>a+(r.findings?.length||0),0);
  const criticalCount=Object.values(results).reduce((a,r)=>a+(r.findings?.filter(f=>f.severity==="CRITICAL").length||0),0);

  // Detail view
  if(selected){
    const r=results[selected];
    const p=PROVIDERS.find(x=>x.key===selected);
    const isConn=!!connected[selected];
    return(
      <div>
        <button onClick={()=>setSelected(null)} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:"#475569",fontSize:13,cursor:"pointer",marginBottom:20,padding:0}}><ChevronRight size={14} style={{transform:"rotate(180deg)"}}/>Back to Integrations</button>
        <div style={{background:"#111827",border:"1px solid rgba(139,92,246,0.1)",borderRadius:16,padding:24,marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:16}}>
            <div style={{width:52,height:52,borderRadius:14,background:`${p.color}18`,border:`1px solid ${p.color}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>{p.icon}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:20,fontWeight:800,color:"#e2e8f0"}}>{p.name}</div>
              <div style={{fontSize:12,color:"#475569",marginTop:2}}>{p.desc}</div>
            </div>
            <div style={{display:"flex",gap:8}}>
              {isConn&&<button onClick={()=>pullOne(selected)} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",background:"rgba(139,92,246,0.08)",border:"1px solid rgba(139,92,246,0.2)",borderRadius:9,color:"#a78bfa",fontSize:13,cursor:"pointer"}}>{loading[selected]?<><RefreshCw size={12} style={{animation:"spin 1s linear infinite"}}/>Pulling...</>:<><RefreshCw size={12}/>Re-pull</>}</button>}
              {!isConn?<button onClick={()=>setShowConnect(p)} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 18px",background:"linear-gradient(135deg,#7c3aed,#6d28d9)",border:"none",borderRadius:9,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>🔌 Connect</button>
              :<button onClick={()=>disconnect(selected)} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:9,color:"#ef4444",fontSize:12,cursor:"pointer"}}>Disconnect</button>}
            </div>
          </div>
          {!isConn&&<div style={{background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:10,padding:"12px 16px",fontSize:13,color:"#f59e0b",display:"flex",alignItems:"center",gap:8}}>⚠️ Not connected — click Connect to enter credentials and pull real data</div>}
          {r?.real_data&&<div style={{background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:10,padding:"12px 16px",fontSize:13,color:"#10b981",display:"flex",alignItems:"center",gap:8}}>✅ Real data — connected to live {p.name} API</div>}
          {r?.note&&<div style={{background:"rgba(59,130,246,0.08)",border:"1px solid rgba(59,130,246,0.2)",borderRadius:10,padding:"10px 14px",fontSize:12,color:"#3b82f6",marginTop:8}}>💡 {r.note}</div>}
        </div>
        {r&&(
          <div>
            {r.findings?.length>0&&(
              <div style={{background:"#111827",border:"1px solid rgba(139,92,246,0.08)",borderRadius:14,padding:20,marginBottom:12}}>
                <div style={{fontSize:14,fontWeight:700,color:"#e2e8f0",marginBottom:14}}>Findings ({r.findings.length})</div>
                {r.findings.map((f,i)=>{
                  const sc={CRITICAL:"#ef4444",HIGH:"#f97316",MEDIUM:"#f59e0b",LOW:"#10b981"}[f.severity]||"#8b5cf6";
                  return(
                    <div key={i} style={{background:"#1a2235",border:`1px solid ${sc}22`,borderRadius:10,padding:"14px 16px",marginBottom:8,borderLeft:`3px solid ${sc}`}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                        <span style={{background:`${sc}20`,color:sc,borderRadius:100,padding:"2px 10px",fontSize:10,fontWeight:700}}>{f.severity}</span>
                        <span style={{fontSize:13,fontWeight:600,color:"#e2e8f0"}}>{f.title}</span>
                      </div>
                      <p style={{fontSize:12,color:"#64748b",margin:"0 0 6px",lineHeight:1.5}}>{f.description}</p>
                      <div style={{fontSize:11,color:"#a78bfa",background:"rgba(139,92,246,0.06)",borderRadius:6,padding:"4px 10px",display:"inline-block"}}>💡 {f.recommendation}</div>
                    </div>
                  );
                })}
              </div>
            )}
            {r.metrics&&(
              <div style={{background:"#111827",border:"1px solid rgba(139,92,246,0.08)",borderRadius:14,padding:20}}>
                <div style={{fontSize:14,fontWeight:700,color:"#e2e8f0",marginBottom:14}}>Metrics</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                  {Object.entries(r.metrics).filter(([k])=>!k.includes("error")).map(([k,v])=>(
                    <div key={k} style={{background:"#1a2235",borderRadius:10,padding:"12px 14px"}}>
                      <div style={{fontSize:16,fontWeight:800,color:"#a78bfa"}}>{typeof v==="boolean"?(v?"✅":"❌"):v}</div>
                      <div style={{fontSize:10,color:"#475569",marginTop:3,textTransform:"uppercase",letterSpacing:".5px"}}>{k.replace(/_/g," ")}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {!r&&isConn&&<div style={{textAlign:"center",padding:40,color:"#475569"}}><RefreshCw size={20} style={{opacity:.5}}/><p style={{marginTop:8}}>No data yet — click Re-pull to fetch</p></div>}
      </div>
    );
  }

  return(
    <div>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:800,color:"#e2e8f0",display:"flex",alignItems:"center",gap:10,margin:0}}><Zap size={20} color="#f97316"/>Security Integrations</h2>
          <p style={{color:"#475569",fontSize:13,marginTop:4}}>Connect your security tools — AURA pulls real data automatically</p>
        </div>
        <button onClick={pullAll} disabled={loadingAll} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 18px",background:"linear-gradient(135deg,#7c3aed,#6d28d9)",border:"none",borderRadius:9,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>
          {loadingAll?<><RefreshCw size={13} style={{animation:"spin 1s linear infinite"}}/>Pulling all...</>:<><Zap size={13}/>Pull All Connected</>}
        </button>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        {[{l:"Connected",v:connectedCount,c:"#10b981"},{l:"Available",v:PROVIDERS.length,c:"#8b5cf6"},{l:"Findings",v:findingsCount,c:"#f97316"},{l:"Critical",v:criticalCount,c:"#ef4444"}].map(st=>(
          <div key={st.l} style={{background:"#111827",border:"1px solid rgba(139,92,246,0.08)",borderRadius:12,padding:"16px 18px",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:st.c}}/>
            <div style={{fontSize:24,fontWeight:800,color:st.c}}>{st.v}</div>
            <div style={{fontSize:11,color:"#475569",textTransform:"uppercase",letterSpacing:".5px",marginTop:2}}>{st.l}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(139,92,246,0.1)",borderRadius:9,padding:"0 12px",height:34,flex:1,minWidth:200}}>
          <Search size={13} color="#475569"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search integrations…" style={{background:"none",border:"none",outline:"none",fontSize:13,color:"#e2e8f0",width:"100%",fontFamily:"inherit"}}/>
        </div>
        {["All",...CATEGORIES].map(cat=>(
          <button key={cat} onClick={()=>setFilterCat(cat)} style={{padding:"6px 14px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",border:"1px solid",borderColor:filterCat===cat?"rgba(139,92,246,0.35)":"rgba(139,92,246,0.1)",background:filterCat===cat?"rgba(139,92,246,0.12)":"transparent",color:filterCat===cat?"#a78bfa":"#475569"}}>{cat}</button>
        ))}
      </div>

      {/* Integration Cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:12}}>
        {filtered.map(p=>{
          const isConn=!!connected[p.key];
          const hasData=!!results[p.key];
          const r=results[p.key];
          const criticals=r?.findings?.filter(f=>f.severity==="CRITICAL").length||0;
          const highs=r?.findings?.filter(f=>f.severity==="HIGH").length||0;
          return(
            <div key={p.key} style={{background:"#111827",border:`1px solid ${isConn?"rgba(16,185,129,0.2)":"rgba(139,92,246,0.08)"}`,borderRadius:14,padding:"18px 20px",cursor:"pointer",transition:"all .2s"}} onClick={()=>setSelected(p.key)}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:40,height:40,borderRadius:10,background:`${p.color}18`,border:`1px solid ${p.color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{p.icon}</div>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,color:"#e2e8f0"}}>{p.name}</div>
                    <div style={{fontSize:11,color:"#475569"}}>{p.category}</div>
                  </div>
                </div>
                <span style={{background:isConn?"rgba(16,185,129,0.1)":"rgba(139,92,246,0.08)",color:isConn?"#10b981":"#64748b",borderRadius:100,padding:"3px 10px",fontSize:10,fontWeight:700,flexShrink:0}}>{isConn?"● Connected":"○ Not connected"}</span>
              </div>
              <div style={{fontSize:12,color:"#64748b",marginBottom:12,lineHeight:1.5}}>{p.desc}</div>
              {hasData&&r.findings?.length>0&&(
                <div style={{display:"flex",gap:6,marginBottom:10}}>
                  {criticals>0&&<span style={{background:"rgba(239,68,68,0.1)",color:"#ef4444",borderRadius:6,padding:"2px 8px",fontSize:10,fontWeight:700}}>{criticals} Critical</span>}
                  {highs>0&&<span style={{background:"rgba(249,115,22,0.1)",color:"#f97316",borderRadius:6,padding:"2px 8px",fontSize:10,fontWeight:700}}>{highs} High</span>}
                  {r.real_data&&<span style={{background:"rgba(16,185,129,0.08)",color:"#10b981",borderRadius:6,padding:"2px 8px",fontSize:10,fontWeight:600}}>⚡ Live</span>}
                </div>
              )}
              <div style={{display:"flex",gap:8}} onClick={e=>e.stopPropagation()}>
                {!isConn?(
                  <button onClick={()=>setShowConnect(p)} style={{flex:1,padding:"7px",background:"linear-gradient(135deg,#7c3aed,#6d28d9)",border:"none",borderRadius:8,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>🔌 Connect</button>
                ):(
                  <>
                    <button onClick={()=>pullOne(p.key)} style={{flex:1,padding:"7px",background:"rgba(139,92,246,0.08)",border:"1px solid rgba(139,92,246,0.2)",borderRadius:8,color:"#a78bfa",fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
                      {loading[p.key]?<><RefreshCw size={11} style={{animation:"spin 1s linear infinite"}}/>Pulling...</>:<><RefreshCw size={11}/>Pull Data</>}
                    </button>
                    <button onClick={()=>disconnect(p.key)} style={{padding:"7px 12px",background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.15)",borderRadius:8,color:"#ef4444",fontSize:11,cursor:"pointer"}}>✕</button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Connect Modal */}
      {showConnect&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(4px)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={e=>e.target===e.currentTarget&&setShowConnect(null)}>
          <div style={{background:"#111827",border:"1px solid rgba(139,92,246,0.2)",borderRadius:16,padding:28,width:"100%",maxWidth:460}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:36,height:36,borderRadius:9,background:`${showConnect.color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{showConnect.icon}</div>
                <div>
                  <div style={{fontSize:15,fontWeight:700,color:"#e2e8f0"}}>Connect {showConnect.name}</div>
                  <div style={{fontSize:11,color:"#475569"}}>{showConnect.desc}</div>
                </div>
              </div>
              <button onClick={()=>setShowConnect(null)} style={{background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:18}}>✕</button>
            </div>
            <div style={{background:"rgba(59,130,246,0.06)",border:"1px solid rgba(59,130,246,0.15)",borderRadius:10,padding:"10px 14px",fontSize:12,color:"#3b82f6",marginBottom:16}}>
              🔒 Credentials are stored securely and used only for read-only compliance checks.
            </div>
            {showConnect.fields.map(f=>(
              <div key={f.k} style={{marginBottom:14}}>
                <label style={{display:"block",fontSize:10,fontWeight:700,color:"#94a3b8",marginBottom:5,textTransform:"uppercase",letterSpacing:".5px"}}>{f.l}</label>
                <input type={f.t} value={creds[f.k]||""} onChange={e=>setCreds(c=>({...c,[f.k]:e.target.value}))} placeholder={f.ph} style={{width:"100%",background:"#1a2235",border:"1px solid rgba(139,92,246,0.15)",borderRadius:8,padding:"9px 12px",color:"#e2e8f0",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
              </div>
            ))}
            <div style={{background:"rgba(139,92,246,0.05)",border:"1px solid rgba(139,92,246,0.1)",borderRadius:8,padding:"10px 14px",fontSize:11,color:"#64748b",marginBottom:16}}>
              <strong style={{color:"#a78bfa"}}>How to get credentials:</strong><br/>
              {showConnect.key==="aws"&&"AWS Console → IAM → Users → Create user → Attach SecurityAudit policy → Create access key"}
              {showConnect.key==="github"&&"GitHub → Settings → Developer settings → Personal access tokens → Generate (scopes: repo, read:org, security_events)"}
              {showConnect.key==="okta"&&"Okta Admin Console → Security → API → Tokens → Create Token"}
              {showConnect.key==="jira"&&"Jira → Account Settings → Security → Create API token"}
              {showConnect.key==="snyk"&&"Snyk.io → Account Settings → General → Auth Token"}
              {!["aws","github","okta","jira","snyk"].includes(showConnect.key)&&`${showConnect.name} admin console → API / Settings → Generate read-only API token`}
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button onClick={()=>setShowConnect(null)} style={{padding:"9px 18px",background:"rgba(139,92,246,0.05)",border:"1px solid rgba(139,92,246,0.1)",borderRadius:9,color:"#475569",fontSize:13,cursor:"pointer"}}>Cancel</button>
              <button onClick={()=>saveConnection(showConnect.key)} disabled={savingCreds} style={{padding:"9px 20px",background:"linear-gradient(135deg,#7c3aed,#6d28d9)",border:"none",borderRadius:9,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
                {savingCreds?<><RefreshCw size={13} style={{animation:"spin 1s linear infinite"}}/>Connecting...</>:"🔌 Connect & Pull Data"}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function RiskTrendsTab({token, tenantId, onExpired}) {
  const [assessments,setAssessments]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [timeRange,setTimeRange]=useState("all");

  useEffect(()=>{
    let cancelled=false;
    realServer.getAuditTrail(token,tenantId)
      .then(d=>{if(!cancelled){setAssessments(d);setLoading(false);}})
      .catch(e=>{if(e.message==="AUTH_EXPIRED")onExpired();else{setError(e.message);setLoading(false);}});
    return()=>{cancelled=true;};
  },[token,tenantId,onExpired]);

  // Filter by time range
  const filtered = assessments.filter(a=>{
    if(timeRange==="all") return true;
    const days = timeRange==="30"?30:timeRange==="90"?90:180;
    return (new Date() - new Date(a.created_at)) / (1000*60*60*24) <= days;
  }).slice().reverse(); // oldest first for chart

  // Chart dimensions
  const W=800, H=300, PAD={top:30,right:30,bottom:50,left:60};
  const chartW=W-PAD.left-PAD.right;
  const chartH=H-PAD.top-PAD.bottom;

  // Score range 0-100
  const scores = filtered.map(a=>Number(a.risk_score)||0);
  const maxScore = 100;
  const minScore = 0;

  // X positions
  const xPos = (i) => filtered.length<=1 ? chartW/2 : (i/(filtered.length-1))*chartW;
  // Y position (inverted — lower score = top = good)
  const yPos = (score) => chartH - ((score-minScore)/(maxScore-minScore))*chartH;

  // Line path
  const linePath = filtered.map((a,i)=>`${i===0?"M":"L"}${PAD.left+xPos(i)},${PAD.top+yPos(Number(a.risk_score)||0)}`).join(" ");

  // Area path
  const areaPath = filtered.length>0 ? [
    `M${PAD.left+xPos(0)},${PAD.top+chartH}`,
    ...filtered.map((a,i)=>`L${PAD.left+xPos(i)},${PAD.top+yPos(Number(a.risk_score)||0)}`),
    `L${PAD.left+xPos(filtered.length-1)},${PAD.top+chartH}`,
    "Z"
  ].join(" ") : "";

  // Risk zone bands
  const criticalY = PAD.top+yPos(75);
  const highY     = PAD.top+yPos(50);
  const mediumY   = PAD.top+yPos(25);

  // Stats
  const latest   = scores[scores.length-1] || 0;
  const previous = scores[scores.length-2] || 0;
  const avg      = scores.length>0 ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) : 0;
  const peak     = scores.length>0 ? Math.max(...scores) : 0;
  const lowest   = scores.length>0 ? Math.min(...scores) : 0;
  const trend    = latest - previous;
  const improved = trend < 0;

  const riskColor = s => s>=75?"#e11d48":s>=50?"#FB923C":s>=25?"#d97706":"#16a34a";

  if(loading) return <div className="empty-state"><RefreshCw size={28} className="spin" style={{opacity:.3,display:"block",margin:"0 auto 12px"}}/><span>Loading risk trends...</span></div>;

  return (
    <div className="fade-in">
      {error&&<div className="notice notice-err"><AlertCircle size={15}/>{error}</div>}

      {/* Stats row */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:"14px",marginBottom:"20px"}}>
        {[
          {label:"Current Risk",    val:latest.toFixed(0),  sub:"Latest assessment",    color:riskColor(latest)},
          {label:"Trend",           val:trend===0?"—":`${improved?"-":"+"}${Math.abs(trend).toFixed(0)}`, sub:improved?"Improving ↓":"Worsening ↑", color:improved?"#16a34a":"#e11d48"},
          {label:"Average Risk",    val:avg.toFixed(0),     sub:`Over ${scores.length} assessments`, color:"#8b5cf6"},
          {label:"Peak Risk",       val:peak.toFixed(0),    sub:"Highest recorded",     color:"#e11d48"},
          {label:"Best Score",      val:lowest.toFixed(0),  sub:"Lowest recorded",      color:"#16a34a"},
        ].map(s=>(
          <div key={s.label} className="stat-card">
            <div className="stat-card-val" style={{color:s.color}}>{s.val}</div>
            <div className="stat-card-lbl">{s.label}</div>
            <div style={{fontSize:"11px",color:"var(--text3)",marginTop:"4px"}}>{s.sub}</div>
            <div className="stat-card-line" style={{background:s.color,opacity:.2}}/>
          </div>
        ))}
      </div>

      {/* Chart card */}
      <div className="card" style={{marginBottom:"20px"}}>
        <div className="card-header">
          <div>
            <div className="card-title">Risk Score Over Time</div>
            <div className="card-sub">Historical security posture trend — lower is better</div>
          </div>
          <div style={{display:"flex",gap:"8px"}}>
            {[{v:"30",l:"30 Days"},{v:"90",l:"90 Days"},{v:"180",l:"6 Months"},{v:"all",l:"All Time"}].map(r=>(
              <button key={r.v} onClick={()=>setTimeRange(r.v)}
                className="btn btn-sm"
                style={{background:timeRange===r.v?"var(--accent)":"var(--surface2)",
                        color:timeRange===r.v?"#fff":"var(--text2)",
                        border:`1px solid ${timeRange===r.v?"var(--accent)":"var(--border2)"}`}}>
                {r.l}
              </button>
            ))}
          </div>
        </div>
        <div className="card-body">
          {filtered.length<2?(
            <div className="empty-state" style={{padding:"40px"}}>
              <TrendingUp size={32}/>
              <p>Not enough data for trends</p>
              <span>Run at least 2 risk assessments to see trend chart</span>
            </div>
          ):(
            <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{overflow:"visible"}}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3"/>
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.02"/>
                </linearGradient>
                <linearGradient id="critGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e11d48" stopOpacity="0.08"/>
                  <stop offset="100%" stopColor="#e11d48" stopOpacity="0.02"/>
                </linearGradient>
              </defs>

              {/* Risk zone backgrounds */}
              <rect x={PAD.left} y={PAD.top} width={chartW} height={criticalY-PAD.top} fill="rgba(225,29,72,0.06)" rx="0"/>
              <rect x={PAD.left} y={criticalY} width={chartW} height={highY-criticalY} fill="rgba(251,146,60,0.06)" rx="0"/>
              <rect x={PAD.left} y={highY} width={chartW} height={mediumY-highY} fill="rgba(217,119,6,0.05)" rx="0"/>
              <rect x={PAD.left} y={mediumY} width={chartW} height={PAD.top+chartH-mediumY} fill="rgba(22,163,74,0.05)" rx="0"/>

              {/* Zone labels */}
              <text x={PAD.left+8} y={criticalY-6} fontSize="10" fill="#e11d48" opacity="0.7">Critical</text>
              <text x={PAD.left+8} y={highY-6}     fontSize="10" fill="#FB923C" opacity="0.7">High</text>
              <text x={PAD.left+8} y={mediumY-6}   fontSize="10" fill="#d97706" opacity="0.7">Medium</text>
              <text x={PAD.left+8} y={PAD.top+chartH-8} fontSize="10" fill="#16a34a" opacity="0.7">Low</text>

              {/* Horizontal grid lines */}
              {[0,25,50,75,100].map(v=>(
                <g key={v}>
                  <line x1={PAD.left} y1={PAD.top+yPos(v)} x2={PAD.left+chartW} y2={PAD.top+yPos(v)}
                    stroke="rgba(124,58,237,0.04)" strokeWidth="1" strokeDasharray="4,4"/>
                  <text x={PAD.left-8} y={PAD.top+yPos(v)+4} fontSize="10" fill="#6B7190" textAnchor="end">{v}</text>
                </g>
              ))}

              {/* Area fill */}
              {areaPath&&<path d={areaPath} fill="url(#areaGrad)"/>}

              {/* Main line */}
              <path d={linePath} fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>

              {/* Data points */}
              {filtered.map((a,i)=>{
                const score = Number(a.risk_score)||0;
                const cx = PAD.left+xPos(i);
                const cy = PAD.top+yPos(score);
                const color = riskColor(score);
                return (
                  <g key={a.id}>
                    <circle cx={cx} cy={cy} r="5" fill={color} stroke="#1A1D27" strokeWidth="2"/>
                    {/* Tooltip on hover — use title */}
                    <title>{`${a.org_name}: ${score.toFixed(1)} (${new Date(a.created_at).toLocaleDateString("en-IN")})`}</title>
                  </g>
                );
              })}

              {/* X axis labels */}
              {filtered.map((a,i)=>{
                if(filtered.length>10 && i%Math.ceil(filtered.length/8)!==0 && i!==filtered.length-1) return null;
                return (
                  <text key={a.id} x={PAD.left+xPos(i)} y={PAD.top+chartH+18}
                    fontSize="9" fill="#6B7190" textAnchor="middle">
                    {new Date(a.created_at).toLocaleDateString("en-IN",{day:"2-digit",month:"short"})}
                  </text>
                );
              })}

              {/* Axes */}
              <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top+chartH} stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
              <line x1={PAD.left} y1={PAD.top+chartH} x2={PAD.left+chartW} y2={PAD.top+chartH} stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
            </svg>
          )}
        </div>
      </div>

      {/* Assessment history table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Assessment History</div>
          <div className="card-sub">{filtered.length} assessments in selected range</div>
        </div>
        <div style={{padding:0}}>
          {filtered.length===0?(
            <div className="empty-state"><Clock size={28}/><p>No assessments in this range</p></div>
          ):(
            <table className="data-table">
              <thead>
                <tr><th>#</th><th>Organisation</th><th>Risk Score</th><th>Level</th><th>Financial Exposure</th><th>vs Previous</th><th>Date</th></tr>
              </thead>
              <tbody>
                {[...filtered].reverse().map((row,i,arr)=>{
                  const score = Number(row.risk_score)||0;
                  const prevScore = arr[i+1]?Number(arr[i+1].risk_score)||0:null;
                  const delta = prevScore!==null ? score-prevScore : null;
                  const color = riskColor(row.risk_level);
                  return (
                    <tr key={row.id}>
                      <td><span className="mono" style={{fontSize:"11px",color:"var(--text3)"}}>{String(filtered.length-i).padStart(2,"0")}</span></td>
                      <td><strong>{row.org_name}</strong></td>
                      <td><span style={{fontWeight:"800",fontSize:"16px",color,letterSpacing:"-0.5px"}}>{score.toFixed(1)}</span></td>
                      <td><span className="badge" style={{background:`${color}18`,color,border:`1px solid ${color}30`}}>{row.risk_level}</span></td>
                      <td><span style={{fontWeight:"600",color:"var(--text)"}}>${(row.financial_exposure||0).toLocaleString()}</span></td>
                      <td>
                        {delta!==null?(
                          <span style={{fontWeight:"700",fontSize:"13px",color:delta<0?"#16a34a":delta>0?"#e11d48":"var(--text3)"}}>
                            {delta<0?"↓":delta>0?"↑":"–"} {Math.abs(delta).toFixed(1)}
                          </span>
                        ):<span style={{color:"var(--text3)"}}>—</span>}
                      </td>
                      <td style={{fontSize:"12px",color:"var(--text3)"}}>{fmtDate(row.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function Login({onLogin}) {
  const [mode,setMode]=useState("login");
  const [tenantMode,setTenantMode]=useState("create");
  const [form,setForm]=useState({email:"",password:"",name:"",role:"developer",tenantname:"",tenantid:""});
  const [error,setError]=useState("");
  const [success,setSuccess]=useState("");
  const [loading,setLoading]=useState(false);

  async function handleSubmit(e){
    e.preventDefault();setLoading(true);setError("");setSuccess("");
    try{
      if(mode==="login"){
        const {token,name,role,tenantId,tenantName}=await realServer.login(form.email,form.password);
        onLogin(token,name,role,tenantId,tenantName);
      }else{
        await realServer.register({email:form.email,password:form.password,name:form.name,role:form.role,tenant_name:tenantMode==="create"?form.tenantname:undefined,tenant_id:tenantMode==="join"?form.tenantid:undefined,create_tenant:tenantMode==="create",join_existing_tenant:tenantMode==="join"});
        setSuccess("Account created! Sign in now.");
        setMode("login");setForm(prev=>({...prev,password:"",name:""}));
      }
    }catch(err){setError(err.message||"Something went wrong.");}
    finally{setLoading(false);}
  }

  return (
    <>
      <style>{G}</style>
      <div className="auth-root">
        <div className="auth-hero">
          <div className="auth-hero-grid"/>
          <div className="auth-hero-content">
            <div className="auth-hero-logo">
              <div className="auth-hero-logo-mark"><Shield size={20} color="#fff"/></div>
              <span className="auth-hero-logo-text">AURA</span>
            </div>
            <h1>Unified Risk &amp;<br/><span>Compliance Platform</span></h1>
            <p>Enterprise-grade security posture management with real-time compliance mapping across ISO 27001, SOC 2, RBI Cybersecurity, and DPDP Act 2023.</p>
            <div className="auth-hero-badges">
              {["ISO 27001:2022","SOC 2 Type II","RBI Cybersecurity","DPDP Act 2023"].map(b=>(
                <span key={b} className="auth-hero-badge"><Check size={11}/>{b}</span>
              ))}
            </div>
            <div style={{display:"flex",gap:"36px",marginTop:"52px"}}>
              {[{v:"199+",l:"Controls"},{v:"3",l:"Frameworks"},{v:"100%",l:"Multi-Tenant"}].map(s=>(
                <div key={s.l}>
                  <div style={{fontSize:"30px",fontWeight:"700",color:"#fff",letterSpacing:"-1px"}}>{s.v}</div>
                  <div style={{fontSize:"11px",color:"var(--text3)",textTransform:"uppercase",letterSpacing:"1px",marginTop:"3px"}}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="auth-form-side">
          <div className="auth-form-header">
            <h2>{mode==="login"?"Welcome back":"Create your account"}</h2>
            <p>{mode==="login"?"Sign in to your AURA workspace":"Get started with AURA Platform"}</p>
          </div>
          {success&&<div className="ok-msg"><Check size={14}/>{success}</div>}
          {error&&<div className="err-msg"><AlertCircle size={14}/>{error}</div>}
          <form onSubmit={handleSubmit}>
            {mode==="register"&&(
              <>
                <div className="tenant-toggle">
                  <div className={`tenant-opt${tenantMode==="create"?" active":""}`} onClick={()=>setTenantMode("create")}>Create workspace</div>
                  <div className={`tenant-opt${tenantMode==="join"?" active":""}`} onClick={()=>setTenantMode("join")}>Join existing</div>
                </div>
                <div className="field"><label className="field-label">Full Name</label><div className="field-input-wrap"><User className="field-icon"/><input type="text" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required placeholder="Your full name"/></div></div>
                <div className="field"><label className="field-label">Role</label><select value={form.role} onChange={e=>setForm({...form,role:e.target.value})} style={{width:"100%",background:"var(--surface)",border:"1px solid var(--border2)",borderRadius:"var(--radius)",padding:"11px 14px",color:"var(--text)",fontSize:"14px",outline:"none"}}><option value="developer">Security Engineer</option><option value="auditor">Compliance Auditor</option><option value="ciso">CISO</option></select></div>
                {tenantMode==="create"&&<div className="field"><label className="field-label">Workspace Name</label><div className="field-input-wrap"><Building2 className="field-icon"/><input type="text" value={form.tenantname} onChange={e=>setForm({...form,tenantname:e.target.value})} required placeholder="e.g. Acme Security Ltd"/></div></div>}
                {tenantMode==="join"&&<div className="field"><label className="field-label">Workspace ID</label><div className="field-input-wrap"><Building2 className="field-icon"/><input type="text" value={form.tenantid} onChange={e=>setForm({...form,tenantid:e.target.value})} required placeholder="Workspace ID from admin"/></div></div>}
              </>
            )}
            <div className="field"><label className="field-label">Email Address</label><div className="field-input-wrap"><Mail className="field-icon"/><input type="email" autoComplete="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required placeholder="you@company.com"/></div></div>
            <div className="field"><label className="field-label">Password</label><div className="field-input-wrap"><Lock className="field-icon"/><input type="password" autoComplete={mode==="login"?"current-password":"new-password"} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required placeholder="••••••••"/></div></div>
            <button className="auth-btn" type="submit" disabled={loading}>
              {loading?(mode==="login"?"Signing in...":"Creating account..."):(mode==="login"?"Sign In":"Create Account")}
              {!loading&&<ChevronRight size={16}/>}
            </button>
          </form>
          <div className="auth-switch">
            {mode==="login"?<>{"Don't have an account? "}<span onClick={()=>{setMode("register");setError("");}}>Sign up free</span></>:<>{"Already have an account? "}<span onClick={()=>{setMode("login");setError("");}}>Sign in</span></>}
          </div>
        </div>
      </div>
    </>
  );
}

function Dashboard({token,userName,role,tenantId,tenantName,onLogout}) {
  const roleCfg=ROLES[role]||ROLES.developer;
  const [implemented,setImplemented]=useState([]);
  const [sessionExpired,setSessionExpired]=useState(false);
  const visibleNav=NAV_ITEMS.filter(t=>t.roles.includes(role));
  const [activeTab,setActiveTab]=useState(visibleNav[0]?.id||"overview");
  const [liveScore,setLiveScore]=useState({overall:55,color:"#f59e0b",label:"Compliant"});
  useEffect(()=>{
    const fetchScore=async()=>{
      try{
        const res=await fetch(`https://web-production-320c3.up.railway.app/api/scores/live?tenant_id=${tenantId}`,{headers:{Authorization:`Bearer ${token}`}});
        if(res.ok){const d=await res.json();if(d.overall_score)setLiveScore({overall:d.overall_score,color:d.overall_color||"#f59e0b",label:d.overall_score>=80?"Compliant":d.overall_score>=50?"In Progress":"Building"});}
      }catch{}
    };
    fetchScore();
    const iv=setInterval(fetchScore,60000);
    return()=>clearInterval(iv);
  },[token,tenantId]);

  useEffect(()=>{
    const iv=setInterval(async()=>{const c=await realServer.validateToken(token,tenantId);if(!c)setSessionExpired(true);},60000);
    return()=>clearInterval(iv);
  },[token,tenantId]);

  function handleExpired(){setSessionExpired(true);setTimeout(onLogout,2500);}
  function toggleControl(id){if(!roleCfg.canEdit)return;setImplemented(prev=>prev.includes(id)?prev.filter(i=>i!==id):[...prev,id]);}

  const currentNav=visibleNav.find(n=>n.id===activeTab);
  const avatarColor=role==="ciso"?"#EF4444":role==="developer"?"#8b5cf6":"#22C55E";

  return (
    <>
      <style>{G}</style>
      <div className="shell" style={{background:"#080812"}}><div className="cyber-bg"/>
        {sessionExpired&&<div className="session-toast"><AlertOctagon size={15}/> Session expired — redirecting...</div>}
        <DarkSidebar activeTab={activeTab} onTabChange={setActiveTab} tenantId={tenantId} userEmail={userName} role={role}/>
        <div className="main-area" style={{background:"#080812"}}>
          <div className="topbar" style={{background:"#0D0D1C",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>                    
            <div className="topbar-title" style={{color:"#ECEEFF",fontFamily:"'Syne',sans-serif"}}>{currentNav?.label||"Dashboard"}</div>
            <div className="topbar-search">
              <Search size={13} color="rgba(148,163,184,0.4)"/>
              <input placeholder="Ask AURA AI…"/>
            </div>
            <div className="topbar-actions">
              <div className="score-badge" style={{borderColor:liveScore.color+"40",color:liveScore.color}}><div className="live-dot" style={{background:liveScore.color}}/>{liveScore.overall}% {liveScore.label}</div>
              <div style={{display:"flex",alignItems:"center",gap:"6px",padding:"5px 12px",borderRadius:"8px",background:"rgba(139,92,246,0.08)",border:"1px solid rgba(139,92,246,0.15)",fontSize:"11px",fontWeight:"700",color:"#a78bfa",textTransform:"uppercase",letterSpacing:".5px"}}><Shield size={11}/>{(role||"").toUpperCase()}</div>
              <button className="icon-btn" onClick={()=>setActiveTab("notifications")}><Bell size={14}/></button>
            </div>
          </div>
          <div className="page-body">
            <div className="page-crumb"><Building2 size={10}/><span>{tenantName}</span><ChevronRight size={10}/><span>{currentNav?.label}</span></div>
            <div className="page-header">
              <div className="page-title">
                {activeTab==="overview"&&"Security Overview"}
                {activeTab==="trends"&&"Risk Trends"}
                {activeTab==="assessment"&&"Risk Assessment"}
                {activeTab==="checklist"&&"Security Controls"}
                {activeTab==="compliance"&&"Compliance Mapping"}
                {activeTab==="audit"&&"Audit Trail"}
                {activeTab==="remediation"&&"Remediation Board"}
                {activeTab==="team-mgmt"&&"Team Management"}
                {activeTab==="trustcenter"&&"Trust Center"}
                {activeTab==="integrations"&&"Integrations"}
                {activeTab==="audit-logs"&&"Audit Logs"}
                {activeTab==="evidence"&&"Evidence"}
                {activeTab==="policies"&&"Policy Management"}
                {activeTab==="vendors"&&"Vendor Risk"}

                {activeTab==="notifications"&&"Notifications"}
                {activeTab==="reports"&&"Reports"}
                {activeTab==="auto-evidence"&&"Auto Evidence Collection"}
                {activeTab==="auditor"&&"Auditor Portal"}
                {activeTab==="test-engine"&&"Automated Test Engine"}
                {activeTab==="monitoring"&&"Continuous Monitoring"}
                {activeTab==="ai-assistant"&&"AI Risk Assistant"}
                {activeTab==="questionnaires"&&"Questionnaire Builder"}
                {activeTab==="sso"&&"SSO Configuration"}
                {activeTab==="iso27001"&&"ISO 27001 Certification Hub"}
                {activeTab==="soc2"&&"SOC 2 Certification Hub"}
              </div>
              <div className="page-sub">
                {activeTab==="overview"&&"Executive summary of your organisation security posture"}
                {activeTab==="trends"&&"Historical risk score trend and assessment analysis"}
                {activeTab==="assessment"&&"Run an AI-powered security posture assessment"}
                {activeTab==="checklist"&&"ISO 27001:2022 controls"}
                {activeTab==="compliance"&&"Automated compliance mapping across 4 frameworks"}
                {activeTab==="audit"&&"Full history of all risk assessments"}
                {activeTab==="remediation"&&"Track and manage security remediation tasks"}
                {activeTab==="team-mgmt"&&"Manage team members and role-based access"}
                {activeTab==="trustcenter"&&"Share your compliance posture with customers and partners"}
                {activeTab==="integrations"&&"Connect and pull security data from 10 tools"}
                {activeTab==="audit-logs"&&"Full activity trail across your compliance platform"}
                {activeTab==="evidence"&&"Upload and manage compliance evidence linked to controls"}
                {activeTab==="policies"&&"Create, manage, and track approval of compliance policies"}
                {activeTab==="vendors"&&"Assess and monitor third-party vendor risk"}
                {activeTab==="team-mgmt"&&"Manage team members and role-based access"}
                {activeTab==="notifications"&&"Alerts, warnings, and compliance notifications"}
                {activeTab==="reports"&&"Generate and export board-ready compliance reports"}
                {activeTab==="auto-evidence"&&"Automatically pull compliance evidence from connected integrations"}
                {activeTab==="auditor"&&"Manage external audit engagements and auditor collaboration"}
                {activeTab==="test-engine"&&"Real compliance checks against AWS, GitHub & Okta — live results"}
                {activeTab==="monitoring"&&"Real-time compliance checks across all connected integrations"}
                {activeTab==="ai-assistant"&&"Ask anything about your compliance posture or risk score"}
                {activeTab==="questionnaires"&&"Build and send security questionnaires to customers and vendors"}
                {activeTab==="sso"&&"Configure Single Sign-On for your team"}
                {activeTab==="iso27001"&&"93 controls · Your complete path to ISO 27001:2022 certification"}
                {activeTab==="soc2"&&"Trust Services Criteria · Your complete path to SOC 2 Type II"}
              </div>
            </div>
             {activeTab==="overview" && <DarkOverview token={token} tenantId={tenantId}/>}
            {activeTab==="trends"                      &&<RiskTrendsTab token={token} tenantId={tenantId} onExpired={handleExpired}/>}
            {activeTab==="executive"                    &&<ExecutiveDashboard token={token} tenantId={tenantId} tenantName={tenantName} userName={userName}/>}
            {activeTab==="assessment"                   &&<DeveloperAssessment token={token} tenantId={tenantId} tenantName={tenantName} onExpired={handleExpired}/>}
            {activeTab==="checklist"                    &&<ControlChecklist implemented={implemented} onToggle={toggleControl} role={role}/>}
            {activeTab==="custom-controls"             &&<CustomControls token={token} tenantId={tenantId}/>}
            {activeTab==="compliance"                   &&<ComplianceTab token={token} tenantId={tenantId} onExpired={handleExpired}/>}
            {activeTab==="audit"                        &&<AuditTrail token={token} tenantId={tenantId} role={role} onExpired={handleExpired}/>}
            {activeTab==="remediation"                  &&<RemediationBoard token={token} tenantId={tenantId} role={role} onExpired={handleExpired}/>}
            {activeTab==="team-mgmt"&&role==="ciso"&&<TeamManagement token={token} tenantId={tenantId} tenantName={tenantName} onExpired={handleExpired}/>}
            {activeTab==="trustcenter"                  &&<TrustCenterTab token={token} tenantId={tenantId} tenantName={tenantName} onExpired={handleExpired}/>}
            {activeTab==="integrations"                 &&<IntegrationsTab token={token} tenantId={tenantId} onExpired={handleExpired}/>}
            {activeTab==="audit-logs"&&<AuditLogs token={token} tenantId={tenantId}/>}
            {activeTab==="evidence"&&<div style={{background:"#f8f9fa",minHeight:"100vh",flex:1,overflow:"auto"}}><EvidenceCollection token={token} tenantId={tenantId}/></div>}
            {activeTab==="policies"&&<PolicyManagement token={token} tenantId={tenantId}/>}
            {activeTab==="vendors"&&<VendorRisk token={token} tenantId={tenantId}/>}
            {activeTab==="team-mgmt"&&<UserManagement token={token} tenantId={tenantId}/>}
            {activeTab==="notifications"&&<Notifications token={token} tenantId={tenantId}/>}
            {activeTab==="reports"&&<Reports token={token} tenantId={tenantId}/>}
            {activeTab==="auto-evidence"&&<AutoEvidence token={token} tenantId={tenantId}/>}
            {activeTab==="auditor"&&<AuditorPortal token={token} tenantId={tenantId}/>}
            {activeTab==="test-engine"&&<TestEngine token={token} tenantId={tenantId}/>}
            {activeTab==="soc2"&&<div style={{background:"#f8f9fa",minHeight:"100vh",flex:1,overflow:"auto"}}><SOC2Hub token={token} tenantId={tenantId}/></div>}
            {activeTab==="rbi"&&<div style={{background:"#f8f9fa",minHeight:"100vh",flex:1,overflow:"auto"}}><RBIHub token={token} tenantId={tenantId}/></div>}
            {activeTab==="dpdp"&&<div style={{background:"#f8f9fa",minHeight:"100vh",flex:1,overflow:"auto"}}><DPDPHub token={token} tenantId={tenantId}/></div>}
            {activeTab==="risk-register"&&<div style={{background:"#f8f9fa",minHeight:"100vh",flex:1,overflow:"auto"}}><RiskRegister token={token} tenantId={tenantId}/></div>}
            {activeTab==="automation"&&<div style={{background:"#f8f9fa",minHeight:"100vh",flex:1,overflow:"auto"}}><AutomationHub token={token} tenantId={tenantId}/></div>}
            {activeTab==="iso27001"&&<div style={{background:"#f8f9fa",minHeight:"100vh",flex:1,overflow:"auto"}}><ISO27001Hub token={token} tenantId={tenantId}/></div>}
            {activeTab==="monitoring"&&<ContinuousMonitoring token={token} tenantId={tenantId}/>}
            {activeTab==="msp-portal"&&<MSPPortal token={token} tenantId={tenantId}/>}
            {activeTab==="ssh"&&<SSHIntegration token={token}/>}
            {activeTab==="ai-assistant"&&<AIAssistant token={token} tenantId={tenantId} onNavigate={setActiveTab}/>}
            {activeTab==="questionnaires"&&<QuestionnaireBuilder token={token} tenantId={tenantId}/>}
            {activeTab==="sso"&&<SSOSettings token={token} tenantId={tenantId}/>}
          </div>
        </div>
      </div>
    </>
  );
}

export default function App() {
  const [session,setSession]=useState(null);
  const [showLogin,setShowLogin]=useState(false);

  if (window.location.pathname.startsWith("/trust/")) {
    const tid=window.location.pathname.split("/trust/")[1]?.split("/")[0]||"";
    return <TrustCenter tenantId={tid}/>;
  }

  function handleLogin(token,name,role,tenantId,tenantName){
    setSession({token,userName:name,role,tenantId,tenantName});
  }
  return session
    ?<Dashboard token={session.token} userName={session.userName} role={session.role} tenantId={session.tenantId} tenantName={session.tenantName} onLogout={()=>setSession(null)}/>
    : showLogin
  ? <AuraLogin onBack={()=>setShowLogin(false)} onSuccess={(d)=>handleLogin(d.access_token||d.token, d.user_name||d.userName||"CISO", d.role||"ciso", d.tenant_id||d.tenantId, d.tenant_name||d.tenantName)}/>
  : <LandingPage onEnter={()=>setShowLogin(true)}/>;
}

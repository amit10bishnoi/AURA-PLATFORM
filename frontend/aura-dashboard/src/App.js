import TrustCenter from './TrustCenter';
import PolicyManagement from "./PolicyManagement";
import AutoEvidence from "./AutoEvidence";
import AuditorPortal from "./AuditorPortal";
import ContinuousMonitoring from "./ContinuousMonitoring";
import VendorRisk from "./VendorRisk";
import UserManagement from "./UserManagement";
import Notifications from "./Notifications";
import Reports from "./Reports";
import AuditLogs from './AuditLogs';
import EvidenceCollection from './EvidenceCollection';
import { useState, useEffect, useCallback } from "react";
import {
  Shield, AlertTriangle, LogOut, ChevronRight, Lock, Mail, User,
  Download, CheckSquare, Square, ClipboardList, Clock,
  Eye, Code2, FileCheck, TrendingUp, ShieldAlert, Terminal,
  AlertOctagon, Users, Plus, Trash2, Send, CheckCircle,
  RefreshCw, FileBarChart, Building2, Bell, Search, ChevronDown,
  LayoutDashboard, Zap, Globe, AlertCircle, Check, Filter,
  FileText,
  Activity,
} from "lucide-react";

const API = "http://localhost:8000";
const PROXY_KEY = "aura-dev-key-change-in-production";

function authHeaders(t, tid) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${t}`, "X-Tenant-Id": tid || "" };
}
function proxyHeaders(t, tid) {
  return { ...authHeaders(t, tid), "X-Proxy-Key": PROXY_KEY };
}
function getRiskColor(l) {
  return l==="CRITICAL"?"#F87171":l==="HIGH"?"#FB923C":l==="MEDIUM"?"#FBBF24":"#34D399";
}
function getRiskBg(l) {
  return l==="CRITICAL"?"rgba(248,113,113,.15)":l==="HIGH"?"rgba(251,146,60,.15)":l==="MEDIUM"?"rgba(251,191,36,.15)":"rgba(52,211,153,.15)";
}
function getRiskBorder(l) {
  return l==="CRITICAL"?"rgba(248,113,113,.3)":l==="HIGH"?"rgba(251,146,60,.3)":l==="MEDIUM"?"rgba(251,191,36,.3)":"rgba(52,211,153,.3)";
}
function fmtDate(iso) {
  try { return new Date(iso).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric",timeZone:"Asia/Kolkata"}); } catch { return "—"; }
}
function fmtDateTime(iso) {
  try { return new Date(iso).toLocaleString("en-IN",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"Asia/Kolkata",hour12:true}); } catch { return "—"; }
}

const realServer = {
  async login(email, password) {
    const res = await fetch(`${API}/login`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password})});
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail||"Login failed.");
    return {token:data.access_token,name:data.name,role:data.role||"developer",tenantId:data.tenant_id||"",tenantName:data.tenant_name||"Default"};
  },
  async register(payload) {
    const res = await fetch(`${API}/register`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
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
    const res = await fetch(`${API}/register`,{method:"POST",headers:authHeaders(token,tenantId),body:JSON.stringify({email,role,name:email.split("@")[0],password:"ChangeMe123!",tenant_id:tenantId,join_existing_tenant:true})});
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
    try { const res = await fetch(`${API}/me`,{headers:authHeaders(token,tenantId)}); return res.ok?await res.json():null; } catch { return null; }
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
  developer: {label:"Developer", icon:<Code2      size={14}/>, color:"#6366F1", bg:"rgba(99,102,241,.08)",  border:"rgba(99,102,241,.2)",  canExport:false, canEdit:true,  canRunAssessment:true },
  auditor:   {label:"Auditor",   icon:<FileCheck  size={14}/>, color:"#10B981", bg:"rgba(16,185,129,.08)",  border:"rgba(16,185,129,.2)",  canExport:true,  canEdit:false, canRunAssessment:false},
};

const NAV_ITEMS = [
  {id:"overview",    label:"Overview",        icon:LayoutDashboard, roles:["ciso"]},
  {id:"trends",      label:"Risk Trends",     icon:TrendingUp,      roles:["ciso","auditor"]},
  {id:"assessment",  label:"Risk Assessment", icon:Shield,          roles:["developer"]},
  {id:"checklist",   label:"Controls",        icon:CheckSquare,     roles:["developer"]},
  {id:"compliance",  label:"Compliance",      icon:ClipboardList,   roles:["ciso","auditor","developer"]},
  {id:"audit",       label:"Audit Trail",     icon:Clock,           roles:["ciso","auditor"]},
  {id:"remediation", label:"Remediation",     icon:CheckCircle,     roles:["ciso","developer"]},
  {id:"users",       label:"Team",            icon:Users,           roles:["ciso"]},
  {id:"trustcenter",   label:"Trust Center",    icon:Globe,           roles:["ciso","auditor"]},
  {id:"integrations",  label:"Integrations",    icon:Zap,             roles:["ciso","developer"]},
  {id:"audit-logs",  label:"Audit Logs",       icon:Clock,           roles:["ciso","auditor","developer"]},
  {id:"evidence",    label:"Evidence",          icon:FileCheck,       roles:["ciso","auditor"]},
  {id:"policies",   label:"Policies",        icon:FileText,        roles:["ciso","auditor"]},
  {id:"vendors",       label:"Vendor Risk",   icon:Building2,    roles:["ciso","auditor"]},
  {id:"team-mgmt",      label:"Team",          icon:Users,        roles:["ciso","admin"]},
  {id:"notifications", label:"Notifications", icon:Bell,         roles:["ciso","auditor","developer","viewer"]},
  {id:"reports",       label:"Reports",       icon:FileBarChart, roles:["ciso","auditor"]},
  {id:"auto-evidence",  label:"Auto Evidence",    icon:Zap,          roles:["ciso","auditor"]},
  {id:"auditor",        label:"Auditor Portal",   icon:Shield,       roles:["ciso","auditor"]},
  {id:"monitoring",     label:"Monitoring",       icon:Activity,     roles:["ciso","developer"]},
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
  // ── NIST CSF v2.0 ──────────────────────────────────────────────────────────
  {id:"GV.OC-01",framework:"NIST_CSF", control:"Organisational cybersecurity mission understood",  riskreduction:3},
  {id:"GV.PO-01",framework:"NIST_CSF", control:"Cybersecurity policy established & communicated",  riskreduction:4},
  {id:"GV.PO-02",framework:"NIST_CSF", control:"Cybersecurity roles & responsibilities known",     riskreduction:3},
  {id:"GV.RM-01",framework:"NIST_CSF", control:"Risk management objectives established",           riskreduction:4},
  {id:"GV.RM-02",framework:"NIST_CSF", control:"Risk appetite & tolerance determined",             riskreduction:3},
  {id:"GV.RM-06",framework:"NIST_CSF", control:"Cybersecurity risk reported to leadership",        riskreduction:4},
  {id:"GV.RR-01",framework:"NIST_CSF", control:"Leadership accountable for cybersecurity",         riskreduction:4},
  {id:"GV.RR-02",framework:"NIST_CSF", control:"Roles & responsibilities established",             riskreduction:4},
  {id:"GV.SC-06",framework:"NIST_CSF", control:"Cybersecurity practices in supply chain",          riskreduction:4},
  {id:"ID.AM-01",framework:"NIST_CSF", control:"Hardware asset inventories maintained",            riskreduction:4},
  {id:"ID.AM-02",framework:"NIST_CSF", control:"Software asset inventories maintained",            riskreduction:4},
  {id:"ID.AM-07",framework:"NIST_CSF", control:"Data & service inventories maintained",            riskreduction:4},
  {id:"ID.RA-01",framework:"NIST_CSF", control:"Vulnerabilities identified & recorded",            riskreduction:5},
  {id:"ID.RA-02",framework:"NIST_CSF", control:"Cyber threat intelligence received",               riskreduction:4},
  {id:"ID.RA-05",framework:"NIST_CSF", control:"Threats & vulnerabilities prioritised",            riskreduction:5},
  {id:"PR.AA-01",framework:"NIST_CSF", control:"Identities & credentials managed",                riskreduction:5},
  {id:"PR.AA-03",framework:"NIST_CSF", control:"Users & hardware authenticated",                   riskreduction:6},
  {id:"PR.AA-05",framework:"NIST_CSF", control:"Access permissions managed & enforced",            riskreduction:6},
  {id:"PR.AT-01",framework:"NIST_CSF", control:"Users trained on cybersecurity risks",             riskreduction:6},
  {id:"PR.DS-01",framework:"NIST_CSF", control:"Data-at-rest protected",                          riskreduction:6},
  {id:"PR.DS-02",framework:"NIST_CSF", control:"Data-in-transit protected",                       riskreduction:6},
  {id:"PR.DS-11",framework:"NIST_CSF", control:"Backups created, protected & tested",             riskreduction:6},
  {id:"PR.IR-01",framework:"NIST_CSF", control:"Networks & environments protected",               riskreduction:5},
  {id:"PR.IR-04",framework:"NIST_CSF", control:"Adequate resource capacity maintained",           riskreduction:3},
  {id:"PR.PS-01",framework:"NIST_CSF", control:"Configuration management practices established",  riskreduction:5},
  {id:"PR.PS-02",framework:"NIST_CSF", control:"Software maintained & updated",                   riskreduction:5},
  {id:"PR.PS-04",framework:"NIST_CSF", control:"Logs generated & reviewed",                       riskreduction:5},
  {id:"DE.AE-02",framework:"NIST_CSF", control:"Potentially adverse events analysed",             riskreduction:4},
  {id:"DE.CM-01",framework:"NIST_CSF", control:"Networks monitored for adverse events",           riskreduction:5},
  {id:"DE.CM-09",framework:"NIST_CSF", control:"Computing hardware & software monitored",         riskreduction:5},
  {id:"RS.MA-01",framework:"NIST_CSF", control:"Incident response plan executed",                 riskreduction:6},
  {id:"RS.MA-02",framework:"NIST_CSF", control:"Incidents categorised & prioritised",             riskreduction:5},
  {id:"RS.CO-02",framework:"NIST_CSF", control:"Internal & external stakeholders notified",       riskreduction:4},
  {id:"RC.RP-01",framework:"NIST_CSF", control:"Recovery plan executed",                          riskreduction:5},
  // ── HIPAA ──────────────────────────────────────────────────────────────────
  {id:"HIPAA.164.308.a.1", framework:"HIPAA", control:"Security Management Process",              riskreduction:6},
  {id:"HIPAA.164.308.a.2", framework:"HIPAA", control:"Assigned Security Responsibility",         riskreduction:4},
  {id:"HIPAA.164.308.a.3", framework:"HIPAA", control:"Workforce Security",                       riskreduction:5},
  {id:"HIPAA.164.308.a.4", framework:"HIPAA", control:"Information Access Management",            riskreduction:6},
  {id:"HIPAA.164.308.a.5", framework:"HIPAA", control:"Security Awareness & Training",            riskreduction:5},
  {id:"HIPAA.164.308.a.6", framework:"HIPAA", control:"Security Incident Procedures",             riskreduction:6},
  {id:"HIPAA.164.308.a.7", framework:"HIPAA", control:"Contingency Plan",                         riskreduction:5},
  {id:"HIPAA.164.308.a.8", framework:"HIPAA", control:"Evaluation",                               riskreduction:4},
  {id:"HIPAA.164.310.a.1", framework:"HIPAA", control:"Facility Access Controls",                 riskreduction:4},
  {id:"HIPAA.164.310.b",   framework:"HIPAA", control:"Workstation Use Policy",                   riskreduction:3},
  {id:"HIPAA.164.310.c",   framework:"HIPAA", control:"Workstation Security",                     riskreduction:3},
  {id:"HIPAA.164.310.d.1", framework:"HIPAA", control:"Device & Media Controls",                  riskreduction:4},
  {id:"HIPAA.164.312.a.1", framework:"HIPAA", control:"Access Control — ePHI",                    riskreduction:6},
  {id:"HIPAA.164.312.b",   framework:"HIPAA", control:"Audit Controls",                           riskreduction:5},
  {id:"HIPAA.164.312.c.1", framework:"HIPAA", control:"Integrity Controls",                       riskreduction:5},
  {id:"HIPAA.164.312.d",   framework:"HIPAA", control:"Person or Entity Authentication",          riskreduction:6},
  {id:"HIPAA.164.312.e.1", framework:"HIPAA", control:"Transmission Security",                    riskreduction:6},
  // ── GDPR ───────────────────────────────────────────────────────────────────
  {id:"GDPR.Art.5",  framework:"GDPR", control:"Principles of data processing",                   riskreduction:5},
  {id:"GDPR.Art.6",  framework:"GDPR", control:"Lawfulness of processing",                        riskreduction:6},
  {id:"GDPR.Art.7",  framework:"GDPR", control:"Conditions for consent",                          riskreduction:5},
  {id:"GDPR.Art.12", framework:"GDPR", control:"Transparent information & communication",         riskreduction:4},
  {id:"GDPR.Art.13", framework:"GDPR", control:"Information to be provided — collection",         riskreduction:4},
  {id:"GDPR.Art.15", framework:"GDPR", control:"Right of access by the data subject",             riskreduction:4},
  {id:"GDPR.Art.17", framework:"GDPR", control:"Right to erasure (right to be forgotten)",        riskreduction:5},
  {id:"GDPR.Art.20", framework:"GDPR", control:"Right to data portability",                       riskreduction:3},
  {id:"GDPR.Art.25", framework:"GDPR", control:"Data protection by design & by default",          riskreduction:6},
  {id:"GDPR.Art.28", framework:"GDPR", control:"Processor obligations & contracts",               riskreduction:5},
  {id:"GDPR.Art.30", framework:"GDPR", control:"Records of processing activities",                riskreduction:4},
  {id:"GDPR.Art.32", framework:"GDPR", control:"Security of processing — technical measures",     riskreduction:6},
  {id:"GDPR.Art.33", framework:"GDPR", control:"Notification of breach to supervisory authority", riskreduction:6},
  {id:"GDPR.Art.35", framework:"GDPR", control:"Data protection impact assessment (DPIA)",        riskreduction:5},
  {id:"GDPR.Art.37", framework:"GDPR", control:"Data protection officer (DPO)",                   riskreduction:4},
  // ── PCI DSS v4.0 ───────────────────────────────────────────────────────────
  {id:"PCI.1",  framework:"PCI_DSS", control:"Install & maintain network security controls",       riskreduction:6},
  {id:"PCI.2",  framework:"PCI_DSS", control:"Apply secure configurations to all system components",riskreduction:6},
  {id:"PCI.3",  framework:"PCI_DSS", control:"Protect stored account data",                        riskreduction:6},
  {id:"PCI.4",  framework:"PCI_DSS", control:"Protect cardholder data with encryption in transit", riskreduction:6},
  {id:"PCI.5",  framework:"PCI_DSS", control:"Protect all systems against malware",                riskreduction:6},
  {id:"PCI.6",  framework:"PCI_DSS", control:"Develop & maintain secure systems & software",       riskreduction:5},
  {id:"PCI.7",  framework:"PCI_DSS", control:"Restrict access to cardholder data by need-to-know", riskreduction:6},
  {id:"PCI.8",  framework:"PCI_DSS", control:"Identify users & authenticate access to system components",riskreduction:6},
  {id:"PCI.9",  framework:"PCI_DSS", control:"Restrict physical access to cardholder data",        riskreduction:4},
  {id:"PCI.10", framework:"PCI_DSS", control:"Log & monitor all access to network & cardholder data",riskreduction:5},
  {id:"PCI.11", framework:"PCI_DSS", control:"Test security of systems & networks regularly",       riskreduction:5},
  {id:"PCI.12", framework:"PCI_DSS", control:"Support information security with policies & programs",riskreduction:4},
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

const G = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
:root{
  --bg:#0F1117;--surface:#1A1D27;--surface2:#222536;--surface3:#2A2E40;
  --border:rgba(255,255,255,.08);--border2:rgba(255,255,255,.14);
  --text:#F0F2F8;--text2:#9EA3B8;--text3:#6B7190;
  --accent:#6366F1;--accent2:#818CF8;--accentbg:rgba(99,102,241,.15);
  --red:#F87171;--redbg:rgba(248,113,113,.12);
  --orange:#FB923C;--orangebg:rgba(251,146,60,.12);
  --yellow:#FBBF24;--yellowbg:rgba(251,191,36,.12);
  --green:#34D399;--greenbg:rgba(52,211,153,.12);
  --blue:#60A5FA;--bluebg:rgba(96,165,250,.12);
  --nav-w:252px;--topbar-h:58px;--radius:8px;--radius-lg:12px;
  --shadow:0 1px 3px rgba(0,0,0,.4);
}
body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;-webkit-font-smoothing:antialiased;}
button,input,select,textarea{font-family:inherit;}
.auth-root{min-height:100vh;display:grid;grid-template-columns:1fr 1fr;background:var(--bg);}
@media(max-width:900px){.auth-root{grid-template-columns:1fr;}}
.auth-hero{background:linear-gradient(160deg,#0F1117 0%,#1A1D27 40%,#1e2035 100%);display:flex;flex-direction:column;justify-content:center;align-items:flex-start;padding:64px 56px;position:relative;overflow:hidden;border-right:1px solid var(--border);}
.auth-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 60% 20%,rgba(99,102,241,.18) 0%,transparent 60%),radial-gradient(circle at 20% 80%,rgba(52,211,153,.08) 0%,transparent 50%);}
.auth-hero-grid{position:absolute;inset:0;opacity:.04;background-image:linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px);background-size:48px 48px;}
.auth-hero-content{position:relative;z-index:1;}
.auth-hero-logo{display:flex;align-items:center;gap:12px;margin-bottom:56px;}
.auth-hero-logo-mark{width:44px;height:44px;background:linear-gradient(135deg,#6366F1,#818CF8);border-radius:12px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 24px rgba(99,102,241,.4);}
.auth-hero-logo-text{font-size:22px;font-weight:700;color:#fff;letter-spacing:-0.5px;}
.auth-hero h1{font-size:42px;font-weight:700;color:#fff;line-height:1.1;letter-spacing:-1.5px;margin-bottom:20px;}
.auth-hero h1 span{color:#818CF8;}
.auth-hero p{font-size:15px;color:var(--text3);line-height:1.75;max-width:380px;margin-bottom:44px;}
.auth-hero-badges{display:flex;flex-wrap:wrap;gap:8px;}
.auth-hero-badge{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:6px;padding:5px 12px;font-size:11px;font-weight:600;color:var(--text2);letter-spacing:.3px;}
.auth-hero-badge::before{content:'';width:6px;height:6px;border-radius:50%;background:var(--green);flex-shrink:0;}
.auth-form-side{display:flex;flex-direction:column;justify-content:center;padding:64px 56px;background:var(--bg);}
.auth-form-header{margin-bottom:36px;}
.auth-form-header h2{font-size:26px;font-weight:700;color:var(--text);letter-spacing:-0.5px;margin-bottom:6px;}
.auth-form-header p{font-size:14px;color:var(--text3);}
.field{margin-bottom:16px;}
.field-label{display:block;font-size:12px;font-weight:500;color:var(--text2);letter-spacing:.3px;margin-bottom:7px;}
.field-input-wrap{position:relative;}
.field-icon{position:absolute;left:13px;top:50%;transform:translateY(-50%);color:var(--text3);width:15px;height:15px;}
.field input,.field select{width:100%;background:var(--surface);border:1px solid var(--border2);border-radius:var(--radius);padding:11px 13px 11px 40px;color:var(--text);font-size:14px;transition:border-color .15s;outline:none;}
.field input:focus,.field select:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(99,102,241,.15);}
.field select{padding-left:13px;appearance:none;}
.field input::placeholder{color:var(--text3);}
.auth-btn{width:100%;padding:12px;background:var(--accent);color:#fff;border:none;border-radius:var(--radius);font-size:14px;font-weight:600;cursor:pointer;transition:all .15s;display:flex;align-items:center;justify-content:center;gap:8px;margin-top:8px;}
.auth-btn:hover{background:#4F52D6;}
.auth-btn:disabled{opacity:.5;cursor:not-allowed;}
.auth-switch{text-align:center;margin-top:20px;font-size:13px;color:var(--text3);}
.auth-switch span{color:var(--accent2);cursor:pointer;font-weight:500;}
.err-msg{background:var(--redbg);border:1px solid rgba(248,113,113,.25);border-radius:var(--radius);padding:10px 13px;font-size:13px;color:var(--red);margin-bottom:16px;display:flex;align-items:center;gap:8px;}
.ok-msg{background:var(--greenbg);border:1px solid rgba(52,211,153,.25);border-radius:var(--radius);padding:10px 13px;font-size:13px;color:var(--green);margin-bottom:16px;display:flex;align-items:center;gap:8px;}
.tenant-toggle{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px;}
.tenant-opt{padding:10px;border:1px solid var(--border2);border-radius:var(--radius);background:var(--surface);color:var(--text2);cursor:pointer;text-align:center;font-size:13px;font-weight:500;transition:all .15s;}
.tenant-opt.active{border-color:var(--accent);color:var(--accent2);background:var(--accentbg);}
.shell{display:grid;grid-template-columns:var(--nav-w) 1fr;min-height:100vh;}
.sidebar{background:var(--surface);border-right:1px solid var(--border);display:flex;flex-direction:column;position:fixed;top:0;left:0;width:var(--nav-w);height:100vh;z-index:50;overflow-y:auto;}
.sidebar-logo{padding:22px 20px 0;display:flex;align-items:center;gap:10px;margin-bottom:32px;}
.sidebar-logo-mark{width:32px;height:32px;background:linear-gradient(135deg,#6366F1,#818CF8);border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.sidebar-logo-text{font-size:17px;font-weight:700;color:var(--text);letter-spacing:-0.3px;}
.nav-section-label{font-size:10px;font-weight:600;color:var(--text3);letter-spacing:1.2px;text-transform:uppercase;padding:0 16px;margin-bottom:4px;margin-top:8px;}
.nav-item{display:flex;align-items:center;gap:9px;padding:8px 14px;margin:1px 8px;border-radius:var(--radius);cursor:pointer;font-size:13px;font-weight:400;color:var(--text2);transition:all .12s;border:none;background:none;width:calc(100% - 16px);text-align:left;}
.nav-item:hover{background:var(--surface2);color:var(--text);}
.nav-item.active{background:var(--accentbg);color:var(--accent2);font-weight:500;border:1px solid rgba(99,102,241,.2);}
.nav-item svg{width:15px;height:15px;flex-shrink:0;opacity:.75;}
.nav-item.active svg{opacity:1;}
.main-area{margin-left:var(--nav-w);display:flex;flex-direction:column;min-height:100vh;width:calc(100vw - var(--nav-w));min-width:0;overflow-x:hidden;}
.topbar{background:var(--surface);border-bottom:1px solid var(--border);height:var(--topbar-h);display:flex;align-items:center;justify-content:space-between;padding:0 28px;position:sticky;top:0;z-index:40;width:100%;}
.topbar-search{display:flex;align-items:center;gap:8px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);padding:7px 13px;font-size:12px;color:var(--text3);width:220px;}
.topbar-search input{background:none;border:none;outline:none;font-size:12px;color:var(--text);width:100%;}
.topbar-btn{width:34px;height:34px;border-radius:var(--radius);border:1px solid var(--border);background:var(--surface2);display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--text2);}
.org-chip{display:flex;align-items:center;gap:6px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);padding:5px 11px;font-size:12px;font-weight:500;color:var(--text2);}
.page-body{padding:28px;flex:1;min-width:0;overflow-x:hidden;box-sizing:border-box;}
.page-header{margin-bottom:24px;}
.page-title{font-size:20px;font-weight:600;color:var(--text);letter-spacing:-0.3px;margin-bottom:3px;}
.page-sub{font-size:12px;color:var(--text3);}
.page-crumb{font-size:11px;color:var(--text3);margin-bottom:8px;display:flex;align-items:center;gap:6px;}
.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);box-shadow:var(--shadow);}
.card-header{padding:16px 20px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}
.card-title{font-size:13px;font-weight:600;color:var(--text);}
.card-sub{font-size:11px;color:var(--text3);margin-top:2px;}
.card-body{padding:20px;}
.stat-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:18px;}
.stat-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:18px 20px;position:relative;overflow:hidden;}
.stat-card-icon{width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;margin-bottom:12px;}
.stat-card-val{font-size:24px;font-weight:700;color:var(--text);letter-spacing:-1px;line-height:1;margin-bottom:4px;}
.stat-card-lbl{font-size:11px;color:var(--text3);}
.stat-card-line{position:absolute;bottom:0;left:0;right:0;height:2px;}
.data-table{width:100%;border-collapse:collapse;}
.data-table th{font-size:10px;font-weight:600;letter-spacing:.6px;text-transform:uppercase;color:var(--text3);padding:10px 14px;text-align:left;border-bottom:1px solid var(--border);white-space:nowrap;}
.data-table td{padding:12px 14px;font-size:12px;color:var(--text2);border-bottom:1px solid var(--border);vertical-align:middle;}
.data-table tbody tr:last-child td{border-bottom:none;}
.data-table tbody tr:hover td{background:var(--surface2);}
.data-table td strong{color:var(--text);font-weight:500;}
.badge{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:4px;font-size:10px;font-weight:600;letter-spacing:.3px;}
.badge-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0;}
.btn{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:var(--radius);font-size:12px;font-weight:500;cursor:pointer;border:none;transition:all .15s;white-space:nowrap;}
.btn-primary{background:var(--accent);color:#fff;}
.btn-primary:hover{background:#4F52D6;}
.btn-secondary{background:var(--surface2);color:var(--text2);border:1px solid var(--border2);}
.btn-secondary:hover{background:var(--surface3);color:var(--text);}
.btn-danger{background:var(--redbg);color:var(--red);border:1px solid rgba(248,113,113,.2);}
.btn-ghost{background:transparent;color:var(--text2);border:1px solid transparent;}
.btn-ghost:hover{background:var(--surface2);}
.btn:disabled{opacity:.4;cursor:not-allowed;}
.btn-lg{padding:10px 20px;font-size:13px;border-radius:var(--radius-lg);}
.btn-sm{padding:4px 10px;font-size:11px;}
.btn-icon{padding:6px;}
.form-section{margin-bottom:24px;}
.form-section-title{font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--text3);margin-bottom:14px;padding-bottom:8px;border-bottom:1px solid var(--border);}
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
.form-field{margin-bottom:14px;}
.form-field label{display:block;font-size:11px;font-weight:500;color:var(--text2);margin-bottom:6px;}
.form-field input,.form-field select,.form-field textarea{width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:var(--radius);padding:9px 12px;color:var(--text);font-size:13px;outline:none;transition:border-color .15s;}
.form-field input:focus,.form-field select:focus{border-color:var(--accent);}
.form-field select{appearance:none;cursor:pointer;}
.form-field input::placeholder{color:var(--text3);}
.checkbox-row{display:flex;gap:20px;flex-wrap:wrap;margin-bottom:16px;}
.checkbox-item{display:flex;align-items:center;gap:8px;cursor:pointer;}
.checkbox-item input{width:14px;height:14px;accent-color:var(--accent);cursor:pointer;}
.checkbox-item span{font-size:12px;color:var(--text2);}
.progress-wrap{background:var(--surface3);border-radius:20px;overflow:hidden;}
.progress-fill{height:100%;border-radius:20px;transition:width .7s cubic-bezier(.4,0,.2,1);}
.notice{display:flex;align-items:flex-start;gap:10px;padding:11px 14px;border-radius:var(--radius);font-size:12px;border:1px solid;margin-bottom:14px;}
.notice-info{background:var(--accentbg);border-color:rgba(99,102,241,.25);color:var(--accent2);}
.notice-warn{background:var(--yellowbg);border-color:rgba(251,191,36,.25);color:var(--yellow);}
.notice-err{background:var(--redbg);border-color:rgba(248,113,113,.25);color:var(--red);}
.notice-ok{background:var(--greenbg);border-color:rgba(52,211,153,.25);color:var(--green);}
.empty-state{text-align:center;padding:48px 24px;color:var(--text3);}
.empty-state svg{margin:0 auto 12px;opacity:.2;display:block;}
.empty-state p{font-size:13px;margin-bottom:4px;font-weight:500;color:var(--text2);}
.empty-state span{font-size:11px;}
.spin{animation:spin .8s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
.fade-in{animation:fadeUp .2s ease forwards;}
@keyframes fadeUp{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
.mono{font-family:'JetBrains Mono',monospace;}
.session-toast{position:fixed;top:14px;right:14px;z-index:999;background:var(--red);color:#fff;border-radius:var(--radius-lg);padding:12px 16px;display:flex;align-items:center;gap:10px;font-size:12px;font-weight:600;}
.scanner-banner{background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-lg);padding:18px 22px;margin-bottom:18px;}
.ctrl-item{display:flex;align-items:flex-start;gap:10px;padding:10px 12px;margin-bottom:3px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);cursor:pointer;transition:all .12s;}
.ctrl-item:hover{border-color:var(--border2);background:var(--surface2);}
.ctrl-item.done{background:rgba(52,211,153,.06);border-color:rgba(52,211,153,.2);}
.task-item{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:13px 15px;margin-bottom:6px;transition:all .12s;}
.task-item:hover{border-color:var(--border2);}
.user-item{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--border);}
.user-item:last-child{border-bottom:none;}
.gauge-container{display:flex;flex-direction:column;align-items:center;}
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
      <span className="badge" style={{background:score>=75?"var(--redbg)":score>=50?"var(--orangebg)":score>=25?"var(--yellowbg)":"var(--greenbg)",color:score>=75?"var(--red)":score>=50?"var(--orange)":score>=25?"var(--yellow)":"var(--green)",border:"1px solid rgba(255,255,255,.1)"}}>
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
    NIST_CSF:{color:"#6366F1",label:"NIST CSF v2.0",     desc:"Cybersecurity Framework"},
    HIPAA:   {color:"#F59E0B",label:"HIPAA",              desc:"Health Data Protection"},
    GDPR:    {color:"#EC4899",label:"GDPR",               desc:"EU Data Protection"},
    PCI_DSS: {color:"#14B8A6",label:"PCI DSS v4.0",      desc:"Payment Card Industry"},
    RBI:     {color:"#8B5CF6",label:"RBI Cybersecurity", desc:"Reserve Bank of India"},
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
          <div style={{fontSize:"12px",color:"var(--text3)"}}>8 frameworks — SOC 2, ISO 27001, NIST CSF, HIPAA, GDPR, PCI DSS, RBI, DPDP</div>
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
            const m=fwMeta[r.framework]||{color:"#6366F1",label:r.framework,desc:""};
            const pass=r.controls.filter(c=>c.status==="pass").length;
            const active=activeFramework===r.framework;
            return (
              <div key={r.framework} onClick={()=>setActiveFramework(r.framework)} style={{background:active?`${m.color}12`:"var(--surface2)",border:`2px solid ${active?m.color:"var(--border)"}`,borderRadius:"var(--radius-lg)",padding:"20px",cursor:"pointer",transition:"all .15s"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"14px"}}>
                  <div>
                    <div style={{fontWeight:"700",fontSize:"13px",color:"var(--text)",marginBottom:"2px"}}>{m.label}</div>
                    <div style={{fontSize:"11px",color:"var(--text3)"}}>{pass}/{r.controls.length} passing</div>
                  </div>
                  <div style={{fontSize:"24px",fontWeight:"800",color:m.color,letterSpacing:"-1px"}}>{r.score.toFixed(0)}<span style={{fontSize:"12px",fontWeight:"500"}}>%</span></div>
                </div>
                <div className="progress-wrap" style={{height:"6px",marginBottom:"12px"}}>
                  <div className="progress-fill" style={{width:`${Math.min(r.score,100)}%`,background:m.color,height:"6px"}}/>
                </div>
                <span className="badge" style={{background:r.score>=75?"var(--greenbg)":r.score>=50?"var(--yellowbg)":"var(--redbg)",color:r.score>=75?"var(--green)":r.score>=50?"var(--yellow)":"var(--red)",border:"none"}}>
                  <span className="badge-dot" style={{background:r.score>=75?"var(--green)":r.score>=50?"var(--yellow)":"var(--red)"}}/>
                  {r.score>=75?"Compliant":r.score>=50?"Partial":"Non-Compliant"}
                </span>
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
    {key:"ALL",      label:"All Controls",    color:"#6366F1"},
    {key:"ISO27001", label:"ISO 27001:2022",  color:"#22C55E"},
    {key:"NIST_CSF", label:"NIST CSF v2.0",  color:"#6366F1"},
    {key:"HIPAA",    label:"HIPAA",           color:"#F59E0B"},
    {key:"GDPR",     label:"GDPR",            color:"#EC4899"},
    {key:"PCI_DSS",  label:"PCI DSS v4.0",   color:"#14B8A6"},
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
    try{const d=await realServer.getUsers(token,tenantId);setUsers(d);setLoading(false);}
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
      <div className="card" style={{marginBottom:"20px"}}>
        <div className="card-header"><span className="card-title">Invite Team Member</span></div>
        <div className="card-body">
          <div style={{display:"grid",gridTemplateColumns:"1fr auto auto",gap:"12px",alignItems:"flex-end"}}>
            <div className="form-field" style={{margin:0}}><label>Email</label><input type="email" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} placeholder="colleague@company.com"/></div>
            <div className="form-field" style={{margin:0}}><label>Role</label><select value={inviteRole} onChange={e=>setInviteRole(e.target.value)}><option value="developer">Developer</option><option value="auditor">Auditor</option><option value="ciso">CISO</option></select></div>
            <button className="btn btn-primary" onClick={sendInvite}><Send size={13}/> Invite</button>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><span className="card-title">Team Members</span><span className="badge" style={{background:"var(--accentbg)",color:"var(--accent)",border:"1px solid rgba(99,102,241,.2)"}}>{users.length} members</span></div>
        <div style={{padding:"0 22px"}}>
          {loading&&<div className="empty-state"><RefreshCw size={24} className="spin" style={{opacity:.3,display:"block",margin:"0 auto 10px"}}/><span>Loading...</span></div>}
          {users.map(u=>(
            <div key={u.email} className="user-item">
              <div style={{width:"38px",height:"38px",borderRadius:"50%",background:roleBgs[u.role]||"var(--accentbg)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:"700",fontSize:"14px",color:roleColors[u.role]||"var(--accent)",flexShrink:0}}>{(u.name||u.email)[0].toUpperCase()}</div>
              <div style={{flex:1}}><div style={{fontSize:"14px",fontWeight:"600",color:"var(--text)",marginBottom:"2px"}}>{u.name}</div><div style={{fontSize:"12px",color:"var(--text3)"}}>{u.email}</div></div>
              <select value={u.role} onChange={e=>changeRole(u.email,e.target.value)} style={{background:roleBgs[u.role]||"var(--accentbg)",border:"1.5px solid",borderColor:roleColors[u.role]||"var(--accent)",borderRadius:"var(--radius)",padding:"5px 10px",color:roleColors[u.role]||"var(--accent)",fontSize:"12px",fontWeight:"700",cursor:"pointer",outline:"none"}}>
                <option value="ciso">CISO</option><option value="developer">Developer</option><option value="auditor">Auditor</option>
              </select>
              <button className="btn btn-sm btn-danger btn-icon" onClick={()=>removeUser(u.email)}><Trash2 size={13}/></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CISOOverview({implemented,token,tenantId,tenantName,onExpired,userName}) {
  const controls=ALL_FRAMEWORK_CONTROLS;
  const iso=controls.filter(c=>c.framework==="ISO27001");
  const nist=controls.filter(c=>c.framework==="NIST_CSF");
  const nPct=nist.length?Math.round(nist.filter(c=>implemented.includes(c.id)).length/nist.length*100):0;
  const iPct=iso.length?Math.round(iso.filter(c=>implemented.includes(c.id)).length/iso.length*100):0;
  const overallRisk=Math.max(0,100-Math.round((nPct+iPct)/2));
  const riskLevel=overallRisk>=75?"CRITICAL":overallRisk>=50?"HIGH":overallRisk>=25?"MEDIUM":"LOW";
  const [generating,setGenerating]=useState(false);
  const [reportError,setReportError]=useState("");
  const [lastAssessment,setLastAssessment]=useState({});
  const [openTasks,setOpenTasks]=useState(0);
  const [execSummary,setExecSummary]=useState("");
  const [genSummary,setGenSummary]=useState(false);
  const [p2Status,setP2Status]=useState(null);

  async function generateExecSummary(){
    setGenSummary(true);
    try{const d=await realServer.getExecutiveSummary(token,tenantId,{org_name:tenantName,risk_score:overallRisk,risk_level:riskLevel,industry:"Technology",top_findings:[],implemented_controls:implemented.length,total_controls:controls.length});setExecSummary(d.executive_summary||"");}
    catch(e){console.error(e);}finally{setGenSummary(false);}
  }
  async function loadP2Status(){try{const d=await realServer.getP2Status(token,tenantId);setP2Status(d);}catch(e){}}

  useEffect(()=>{
    realServer.getAuditTrail(token,tenantId).then(data=>{if(data?.length>0)setLastAssessment(data[data.length-1]);}).catch(()=>{});
    realServer.getTasks(token,tenantId).then(tasks=>{setOpenTasks(tasks.filter(t=>t.status!=="done").length);}).catch(()=>{});
  },[token,tenantId]);

  async function generateReport(){
    setGenerating(true);setReportError("");
    try{
      const [historyData,tasksData]=await Promise.all([realServer.getAuditTrail(token,tenantId),realServer.getTasks(token,tenantId)]);
      const last=historyData.length>0?historyData[historyData.length-1]:{};
      const payload={org_name:last.org_name||tenantName||"My Organisation",tenant_name:tenantName,risk_score:overallRisk,nist_pct:nPct,iso_pct:iPct,implemented_controls:implemented.length,total_controls:controls.length,financial_exposure:last.financial_exposure||0,assessment_history:historyData,tasks:tasksData,generated_by:userName||"CISO"};
      const blob=await realServer.generateBoardReport(token,tenantId,payload);
      const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`AURA_Report_${new Date().toISOString().slice(0,10)}.pdf`;a.click();URL.revokeObjectURL(url);
    }catch(e){if(e.message==="AUTH_EXPIRED"){onExpired();return;}setReportError(e.message);setTimeout(()=>setReportError(""),6000);}
    finally{setGenerating(false);}
  }

  const kpiData=[
    {label:"Overall Risk Score",val:overallRisk,sub:riskLevel+" Level",color:getRiskColor(riskLevel),icon:<Shield size={16}/>},
    {label:"Controls Implemented",val:implemented.length,sub:`of ${controls.length} total`,color:"var(--accent)",icon:<CheckSquare size={16}/>},
    {label:"ISO 27001 Score",val:`${iPct}%`,sub:"compliance level",color:"var(--green)",icon:<FileCheck size={16}/>},
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
            <RiskGauge score={overallRisk}/>
            <div style={{marginTop:"16px",width:"100%"}}>
              {[{l:"NIST CSF",v:nPct,c:"var(--accent)"},{l:"ISO 27001",v:iPct,c:"var(--green)"}].map(f=>(
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
            {[{l:"Latest Assessment",v:lastAssessment.org_name||"—",sub:lastAssessment.created_at?fmtDate(lastAssessment.created_at):"Not run yet"},{l:"Financial Exposure",v:lastAssessment.financial_exposure?`$${Number(lastAssessment.financial_exposure).toLocaleString()}`:"—",sub:"FAIR model estimate"},{l:"Status",v:"Ready",sub:`${controls.length} controls tracked`}].map(i=>(
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
    NIST_CSF:{label:"NIST CSF v2.0",    color:"#6366F1",desc:"Cybersecurity Framework"},
    HIPAA:   {label:"HIPAA",            color:"#F59E0B",desc:"Health Data Protection"},
    GDPR:    {label:"GDPR",             color:"#3B82F6",desc:"EU Data Protection"},
    PCI_DSS: {label:"PCI DSS v4.0",     color:"#8B5CF6",desc:"Payment Card Industry"},
    RBI:     {label:"RBI Cybersecurity",color:"#EC4899",desc:"Reserve Bank of India"},
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
        ["SOC2","ISO27001","NIST_CSF","HIPAA","GDPR","PCI_DSS","RBI","DPDP"].forEach(fw=>{
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
            <button onClick={copyLink} style={{background:copied?"rgba(52,211,153,.3)":"rgba(255,255,255,.15)",border:"1.5px solid rgba(255,255,255,.3)",borderRadius:"var(--radius)",color:"#fff",padding:"8px 16px",cursor:"pointer",fontSize:"12px",fontWeight:"700"}}>{copied?"Copied!":"Copy Link"}</button>
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
                const meta=fwMeta[fw]||{label:fw,color:"#6366F1",desc:""};
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
    // ── Original 10 ──────────────────────────────────────────────────────────
    {key:"okta",             name:"Okta",              icon:"🔐", color:"#00297A", desc:"Identity & Access Management"},
    {key:"jira",             name:"Jira",              icon:"📋", color:"#0052CC", desc:"Security Ticket Tracking"},
    {key:"slack",            name:"Slack",             icon:"💬", color:"#4A154B", desc:"DLP & Communication Security"},
    {key:"datadog",          name:"Datadog",           icon:"📊", color:"#632CA6", desc:"SIEM & Monitoring"},
    {key:"crowdstrike",      name:"CrowdStrike",       icon:"🦅", color:"#E3130D", desc:"Endpoint Detection & Response"},
    {key:"github",           name:"GitHub",            icon:"🐙", color:"#24292E", desc:"Code & Secret Scanning"},
    {key:"snowflake",        name:"Snowflake",         icon:"❄️", color:"#29B5E8", desc:"Data Security & Masking"},
    {key:"splunk",           name:"Splunk",            icon:"🔍", color:"#65A637", desc:"SIEM & User Behaviour Analytics"},
    {key:"servicenow",       name:"ServiceNow",        icon:"⚙️", color:"#81B5A1", desc:"IT Risk & Incident Management"},
    {key:"tenable",          name:"Tenable",           icon:"🛡️", color:"#00B388", desc:"Vulnerability Management"},
    // ── New 20 ───────────────────────────────────────────────────────────────
    {key:"pagerduty",        name:"PagerDuty",         icon:"🚨", color:"#06AC38", desc:"Incident Management & Alerting"},
    {key:"qualys",           name:"Qualys VMDR",       icon:"🔬", color:"#ED1C24", desc:"Vulnerability Management"},
    {key:"sentinelone",      name:"SentinelOne",       icon:"🤖", color:"#6B00F5", desc:"AI-Powered EDR"},
    {key:"microsoft_defender",name:"MS Defender",      icon:"🛡", color:"#0078D4", desc:"Microsoft Endpoint Security"},
    {key:"cloudflare",       name:"Cloudflare",        icon:"🌐", color:"#F48120", desc:"DDoS & Web Application Firewall"},
    {key:"hashicorp_vault",  name:"HashiCorp Vault",   icon:"🔑", color:"#000000", desc:"Secrets Management"},
    {key:"elastic_security", name:"Elastic Security",  icon:"🔎", color:"#FEC514", desc:"SIEM & Threat Detection"},
    {key:"wiz",              name:"Wiz",               icon:"🌩", color:"#2B6CB0", desc:"Cloud Security Posture Management"},
    {key:"sonarqube",        name:"SonarQube",         icon:"📝", color:"#4E9BCD", desc:"Code Security & Quality"},
    {key:"rapid7",           name:"Rapid7 InsightVM",  icon:"🎯", color:"#E3170A", desc:"Vulnerability & Penetration Testing"},
    {key:"carbon_black",     name:"Carbon Black",      icon:"⚫", color:"#1A1A1A", desc:"VMware Endpoint Security"},
    {key:"trend_micro",      name:"Trend Micro",       icon:"📡", color:"#D71920", desc:"Threat Detection & Response"},
    {key:"lacework",         name:"Lacework",          icon:"🏔", color:"#00B4D8", desc:"Cloud Security & Compliance"},
    {key:"prisma_cloud",     name:"Prisma Cloud",      icon:"🔷", color:"#00C0E8", desc:"Palo Alto Cloud Security"},
    {key:"veracode",         name:"Veracode",          icon:"🧪", color:"#009BDE", desc:"Application Security Testing"},
    {key:"nessus",           name:"Nessus Pro",        icon:"🔭", color:"#00B388", desc:"Network Vulnerability Scanner"},
    {key:"duo",              name:"Duo Security",      icon:"👥", color:"#6BBB47", desc:"Multi-Factor Authentication"},
    {key:"snyk",             name:"Snyk",              icon:"🐛", color:"#4C4A73", desc:"Open Source Security"},
    {key:"beyondtrust",      name:"BeyondTrust",       icon:"🏰", color:"#E31837", desc:"Privileged Access Management"},
    {key:"darktrace",        name:"Darktrace",         icon:"🧠", color:"#6236FF", desc:"AI Cyber Defence"},
  ];

  const [results,setResults]=useState({});
  const [loading,setLoading]=useState({});
  const [loadingAll,setLoadingAll]=useState(false);
  const [selected,setSelected]=useState(null);
  const [error,setError]=useState("");

  async function pullOne(key) {
    setLoading(prev=>({...prev,[key]:true}));
    setError("");
    try {
      const d = await realServer.pullIntegration(token, tenantId, key);
      setResults(prev=>({...prev,[key]:d}));
      setSelected(key);
    } catch(e) {
      if(e.message==="AUTH_EXPIRED") onExpired();
      else setError(`${key}: ${e.message}`);
    } finally {
      setLoading(prev=>({...prev,[key]:false}));
    }
  }

  async function pullAll() {
    setLoadingAll(true); setError("");
    try {
      const d = await realServer.pullAllIntegrations(token, tenantId);
      setResults(d);
      setSelected(Object.keys(d)[0]);
    } catch(e) {
      if(e.message==="AUTH_EXPIRED") onExpired();
      else setError(e.message);
    } finally {
      setLoadingAll(false);}
  }

  const sevColor = s => s==="CRITICAL"?"#F87171":s==="HIGH"?"#FB923C":s==="MEDIUM"?"#FBBF24":"#34D399";
  const sevBg    = s => s==="CRITICAL"?"rgba(248,113,113,.12)":s==="HIGH"?"rgba(251,146,60,.12)":s==="MEDIUM"?"rgba(251,191,36,.12)":"rgba(52,211,153,.12)";

  const activeResult = selected ? results[selected] : null;
  const activeProvider = PROVIDERS.find(p=>p.key===selected);

  return (
    <div className="fade-in">
      {/* Pull All banner */}
      <div style={{background:"linear-gradient(135deg,#1e1b4b 0%,#312e81 40%,#4338ca 100%)",borderRadius:"var(--radius-lg)",padding:"20px 24px",marginBottom:"20px",color:"#fff"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"12px"}}>
          <div>
            <div style={{fontWeight:"800",fontSize:"16px",marginBottom:"4px"}}>⚡ 30 Security Tool Integrations</div>
            <div style={{fontSize:"12px",color:"rgba(255,255,255,.65)"}}>Okta · Jira · Slack · Datadog · CrowdStrike · GitHub · Tenable · PagerDuty · Qualys · SentinelOne · MS Defender · Cloudflare · Vault · Elastic · Wiz · SonarQube · Rapid7 · Snyk · Duo · Darktrace + more</div>
          </div>
          <button onClick={pullAll} disabled={loadingAll}
            style={{background:"rgba(255,255,255,.15)",border:"1.5px solid rgba(255,255,255,.3)",borderRadius:"var(--radius)",color:"#fff",padding:"10px 20px",cursor:"pointer",fontSize:"13px",fontWeight:"700",display:"flex",alignItems:"center",gap:"8px"}}>
            {loadingAll?<><RefreshCw size={14} className="spin"/> Pulling all...</>:<><Zap size={14}/> Pull All Integrations</>}
          </button>
        </div>
      </div>

      {error&&<div className="notice notice-err"><AlertCircle size={15}/>{error}</div>}

      {/* Provider grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:"12px",marginBottom:"20px"}}>
        {PROVIDERS.map(p=>{
          const r=results[p.key];
          const isLoading=loading[p.key];
          const isSelected=selected===p.key;
          return (
            <div key={p.key}
              style={{background:isSelected?`${p.color}18`:"var(--surface)",border:`2px solid ${isSelected?p.color:"var(--border)"}`,borderRadius:"var(--radius-lg)",padding:"16px",cursor:"pointer",transition:"all .15s",position:"relative"}}
              onClick={()=>r?setSelected(p.key):pullOne(p.key)}>
              <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"10px"}}>
                <span style={{fontSize:"22px"}}>{p.icon}</span>
                <div>
                  <div style={{fontWeight:"700",fontSize:"13px",color:"var(--text)"}}>{p.name}</div>
                  <div style={{fontSize:"10px",color:"var(--text3)"}}>{p.desc}</div>
                </div>
              </div>
              {r?(
                <div>
                  <div style={{fontSize:"10px",color:"var(--green)",fontWeight:"700",marginBottom:"4px"}}>✓ Connected</div>
                  <div style={{fontSize:"10px",color:"var(--text3)",lineHeight:"1.4"}}>{r.summary}</div>
                </div>
              ):(
                <button onClick={e=>{e.stopPropagation();pullOne(p.key);}} disabled={isLoading}
                  style={{width:"100%",padding:"6px",background:`${p.color}20`,border:`1px solid ${p.color}40`,borderRadius:"var(--radius)",color:p.color,fontSize:"11px",fontWeight:"700",cursor:"pointer",marginTop:"4px"}}>
                  {isLoading?<><RefreshCw size={11} className="spin"/> Pulling...</>:"Connect & Pull"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Detail panel */}
      {activeResult&&activeProvider&&(
        <div className="card fade-in">
          <div className="card-header">
            <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
              <span style={{fontSize:"24px"}}>{activeProvider.icon}</span>
              <div>
                <div className="card-title">{activeProvider.name} — Security Findings</div>
                <div className="card-sub">{activeResult.summary}</div>
              </div>
            </div>
            <div style={{display:"flex",gap:"8px"}}>
              <span className="badge" style={{background:"var(--greenbg)",color:"var(--green)",border:"1px solid rgba(52,211,153,.2)"}}>● Connected</span>
              <button className="btn btn-secondary btn-sm" onClick={()=>pullOne(activeProvider.key)} disabled={loading[activeProvider.key]}>
                <RefreshCw size={12} className={loading[activeProvider.key]?"spin":""}/> Refresh
              </button>
            </div>
          </div>
          <div className="card-body">
            {/* Metrics */}
            {activeResult.metrics&&(
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:"12px",marginBottom:"20px"}}>
                {Object.entries(activeResult.metrics).map(([k,v])=>(
                  <div key={k} style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:"12px",textAlign:"center"}}>
                    <div style={{fontSize:"20px",fontWeight:"800",color:activeProvider.color,letterSpacing:"-1px"}}>{typeof v==="number"?v.toLocaleString():v}</div>
                    <div style={{fontSize:"10px",color:"var(--text3)",marginTop:"3px",textTransform:"uppercase",letterSpacing:"0.5px"}}>{k.replace(/_/g," ")}</div>
                  </div>
                ))}
              </div>
            )}
            {/* Findings */}
            <div style={{fontWeight:"700",fontSize:"13px",color:"var(--text)",marginBottom:"12px"}}>Security Findings</div>
            {activeResult.findings?.map((f,i)=>(
              <div key={i} style={{display:"flex",alignItems:"flex-start",gap:"12px",padding:"14px",background:"var(--surface2)",border:"1px solid var(--border)",borderLeft:`4px solid ${sevColor(f.severity)}`,borderRadius:"var(--radius)",marginBottom:"10px"}}>
                <span className="badge" style={{background:sevBg(f.severity),color:sevColor(f.severity),border:"none",flexShrink:0,marginTop:"2px"}}>{f.severity}</span>
                <div>
                  <div style={{fontSize:"13px",fontWeight:"600",color:"var(--text)",marginBottom:"4px"}}>{f.title}</div>
                  <div style={{fontSize:"12px",color:"var(--text3)",marginBottom:"6px",lineHeight:"1.5"}}>{f.description}</div>
                  <div style={{fontSize:"12px",color:"var(--accent)",fontWeight:"500"}}>→ {f.recommendation}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!activeResult&&Object.keys(results).length===0&&(
        <div className="empty-state">
          <Zap size={36}/>
          <p>No integrations pulled yet</p>
          <span>Click "Connect & Pull" on any provider or "Pull All Integrations" to start</span>
        </div>
      )}
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

  const riskColor = s => s>=75?"#F87171":s>=50?"#FB923C":s>=25?"#FBBF24":"#34D399";

  if(loading) return <div className="empty-state"><RefreshCw size={28} className="spin" style={{opacity:.3,display:"block",margin:"0 auto 12px"}}/><span>Loading risk trends...</span></div>;

  return (
    <div className="fade-in">
      {error&&<div className="notice notice-err"><AlertCircle size={15}/>{error}</div>}

      {/* Stats row */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:"14px",marginBottom:"20px"}}>
        {[
          {label:"Current Risk",    val:latest.toFixed(0),  sub:"Latest assessment",    color:riskColor(latest)},
          {label:"Trend",           val:trend===0?"—":`${improved?"-":"+"}${Math.abs(trend).toFixed(0)}`, sub:improved?"Improving ↓":"Worsening ↑", color:improved?"#34D399":"#F87171"},
          {label:"Average Risk",    val:avg.toFixed(0),     sub:`Over ${scores.length} assessments`, color:"#6366F1"},
          {label:"Peak Risk",       val:peak.toFixed(0),    sub:"Highest recorded",     color:"#F87171"},
          {label:"Best Score",      val:lowest.toFixed(0),  sub:"Lowest recorded",      color:"#34D399"},
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
                  <stop offset="0%" stopColor="#6366F1" stopOpacity="0.3"/>
                  <stop offset="100%" stopColor="#6366F1" stopOpacity="0.02"/>
                </linearGradient>
                <linearGradient id="critGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F87171" stopOpacity="0.08"/>
                  <stop offset="100%" stopColor="#F87171" stopOpacity="0.02"/>
                </linearGradient>
              </defs>

              {/* Risk zone backgrounds */}
              <rect x={PAD.left} y={PAD.top} width={chartW} height={criticalY-PAD.top} fill="rgba(248,113,113,0.06)" rx="0"/>
              <rect x={PAD.left} y={criticalY} width={chartW} height={highY-criticalY} fill="rgba(251,146,60,0.06)" rx="0"/>
              <rect x={PAD.left} y={highY} width={chartW} height={mediumY-highY} fill="rgba(251,191,36,0.05)" rx="0"/>
              <rect x={PAD.left} y={mediumY} width={chartW} height={PAD.top+chartH-mediumY} fill="rgba(52,211,153,0.05)" rx="0"/>

              {/* Zone labels */}
              <text x={PAD.left+8} y={criticalY-6} fontSize="10" fill="#F87171" opacity="0.7">Critical</text>
              <text x={PAD.left+8} y={highY-6}     fontSize="10" fill="#FB923C" opacity="0.7">High</text>
              <text x={PAD.left+8} y={mediumY-6}   fontSize="10" fill="#FBBF24" opacity="0.7">Medium</text>
              <text x={PAD.left+8} y={PAD.top+chartH-8} fontSize="10" fill="#34D399" opacity="0.7">Low</text>

              {/* Horizontal grid lines */}
              {[0,25,50,75,100].map(v=>(
                <g key={v}>
                  <line x1={PAD.left} y1={PAD.top+yPos(v)} x2={PAD.left+chartW} y2={PAD.top+yPos(v)}
                    stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4,4"/>
                  <text x={PAD.left-8} y={PAD.top+yPos(v)+4} fontSize="10" fill="#6B7190" textAnchor="end">{v}</text>
                </g>
              ))}

              {/* Area fill */}
              {areaPath&&<path d={areaPath} fill="url(#areaGrad)"/>}

              {/* Main line */}
              <path d={linePath} fill="none" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>

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
                          <span style={{fontWeight:"700",fontSize:"13px",color:delta<0?"#34D399":delta>0?"#F87171":"var(--text3)"}}>
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
            <p>Enterprise-grade security posture management with real-time compliance mapping across ISO 27001, NIST CSF, and SOC 2.</p>
            <div className="auth-hero-badges">
              {["ISO 27001:2022","NIST CSF v2.0","SOC 2 Type II","FAIR Risk Model"].map(b=>(
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

  useEffect(()=>{
    const iv=setInterval(async()=>{const c=await realServer.validateToken(token,tenantId);if(!c)setSessionExpired(true);},60000);
    return()=>clearInterval(iv);
  },[token,tenantId]);

  function handleExpired(){setSessionExpired(true);setTimeout(onLogout,2500);}
  function toggleControl(id){if(!roleCfg.canEdit)return;setImplemented(prev=>prev.includes(id)?prev.filter(i=>i!==id):[...prev,id]);}

  const currentNav=visibleNav.find(n=>n.id===activeTab);
  const avatarColor=role==="ciso"?"#EF4444":role==="developer"?"#6366F1":"#22C55E";

  return (
    <>
      <style>{G}</style>
      <div className="shell">
        {sessionExpired&&<div className="session-toast"><AlertOctagon size={15}/> Session expired — redirecting...</div>}
        <div className="sidebar">
          <div className="sidebar-logo">
            <div className="sidebar-logo-mark"><Shield size={16} color="#fff"/></div>
            <div className="sidebar-logo-text">AURA</div>
          </div>
          <div className="nav-section-label">Navigation</div>
          {visibleNav.map(item=>{const Icon=item.icon;return(<button key={item.id} className={`nav-item${activeTab===item.id?" active":""}`} onClick={()=>setActiveTab(item.id)}><Icon size={16}/>{item.label}</button>);})}
          <div style={{marginTop:"auto"}}/>
          <div style={{padding:"8px 16px 12px",borderTop:"1px solid var(--border)",marginTop:"16px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px",padding:"8px",borderRadius:"var(--radius)",background:"var(--surface2)",marginBottom:"8px"}}>
              <div style={{width:"30px",height:"30px",borderRadius:"50%",background:`${avatarColor}15`,border:`2px solid ${avatarColor}30`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:"700",fontSize:"12px",color:avatarColor,flexShrink:0}}>{userName[0]?.toUpperCase()}</div>
              <div style={{flex:1,minWidth:0}}><div style={{fontSize:"12px",fontWeight:"600",color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{userName}</div><div style={{fontSize:"11px",color:"var(--text3)"}}>{roleCfg.label}</div></div>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={onLogout} title="Logout"><LogOut size={13}/></button>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:"6px",padding:"6px 8px",borderRadius:"var(--radius)",background:"var(--accentbg)",border:"1px solid rgba(99,102,241,.15)"}}>
              <Building2 size={11} color="var(--accent)"/>
              <span style={{fontSize:"11px",fontWeight:"600",color:"var(--accent)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{tenantName||"Workspace"}</span>
            </div>
          </div>
        </div>
        <div className="main-area">
          <div className="topbar">
            <div style={{display:"flex",alignItems:"center",gap:"16px"}}>
              <div style={{fontSize:"15px",fontWeight:"700",color:"var(--text)"}}>{currentNav?.label||"Dashboard"}</div>
              <div className="topbar-search"><Search size={13}/><input placeholder="Search anything..."/></div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
              <div className="org-chip"><Building2 size={12}/>{tenantName}</div>
              <span className="badge" style={{background:roleCfg.bg,color:roleCfg.color,border:`1px solid ${roleCfg.border}`,padding:"5px 12px",fontSize:"11px"}}>{roleCfg.icon}&nbsp;{roleCfg.label}</span>
              <button className="topbar-btn"><Bell size={15}/></button>
            </div>
          </div>
          <div className="page-body">
            <div className="page-crumb"><Building2 size={10}/> {tenantName} <ChevronRight size={10}/> {currentNav?.label}</div>
            <div className="page-header">
              <div className="page-title">
                {activeTab==="overview"&&"Security Overview"}
                {activeTab==="trends"&&"Risk Trends"}
                {activeTab==="assessment"&&"Risk Assessment"}
                {activeTab==="checklist"&&"Security Controls"}
                {activeTab==="compliance"&&"Compliance Mapping"}
                {activeTab==="audit"&&"Audit Trail"}
                {activeTab==="remediation"&&"Remediation Board"}
                {activeTab==="users"&&"Team Management"}
                {activeTab==="trustcenter"&&"Trust Center"}
                {activeTab==="integrations"&&"Integrations"}
                {activeTab==="audit-logs"&&"Audit Logs"}
                {activeTab==="evidence"&&"Evidence"}
                {activeTab==="policies"&&"Policy Management"}
                {activeTab==="vendors"&&"Vendor Risk"}
                {activeTab==="team-mgmt"&&"Team"}
                {activeTab==="notifications"&&"Notifications"}
                {activeTab==="reports"&&"Reports"}
            {activeTab==="auto-evidence"&&<AutoEvidence token={token} tenantId={tenantId}/>}
            {activeTab==="auditor"&&<AuditorPortal token={token} tenantId={tenantId}/>}
            {activeTab==="monitoring"&&<ContinuousMonitoring token={token} tenantId={tenantId}/>}
                {activeTab==="auto-evidence"&&"Auto Evidence Collection"}
                {activeTab==="auditor"&&"Auditor Portal"}
                {activeTab==="monitoring"&&"Continuous Monitoring"}
              </div>
              <div className="page-sub">
                {activeTab==="overview"&&"Executive summary of your organisation security posture"}
                {activeTab==="trends"&&"Historical risk score trend and assessment analysis"}
                {activeTab==="assessment"&&"Run an AI-powered security posture assessment"}
                {activeTab==="checklist"&&"ISO 27001:2022 and NIST CSF v2.0 controls"}
                {activeTab==="compliance"&&"Automated compliance mapping across 8 frameworks"}
                {activeTab==="audit"&&"Full history of all risk assessments"}
                {activeTab==="remediation"&&"Track and manage security remediation tasks"}
                {activeTab==="users"&&`Managing ${tenantName} workspace members`}
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
                {activeTab==="monitoring"&&"Real-time compliance checks across all connected integrations"}
              </div>
            </div>
            {activeTab==="overview"     &&role==="ciso"&&<CISOOverview implemented={implemented} token={token} tenantId={tenantId} tenantName={tenantName} onExpired={handleExpired} userName={userName}/>}
            {activeTab==="trends"                      &&<RiskTrendsTab token={token} tenantId={tenantId} onExpired={handleExpired}/>}
            {activeTab==="assessment"                   &&<DeveloperAssessment token={token} tenantId={tenantId} tenantName={tenantName} onExpired={handleExpired}/>}
            {activeTab==="checklist"                    &&<ControlChecklist implemented={implemented} onToggle={toggleControl} role={role}/>}
            {activeTab==="compliance"                   &&<ComplianceTab token={token} tenantId={tenantId} onExpired={handleExpired}/>}
            {activeTab==="audit"                        &&<AuditTrail token={token} tenantId={tenantId} role={role} onExpired={handleExpired}/>}
            {activeTab==="remediation"                  &&<RemediationBoard token={token} tenantId={tenantId} role={role} onExpired={handleExpired}/>}
            {activeTab==="users"        &&role==="ciso" &&<TeamManagement token={token} tenantId={tenantId} tenantName={tenantName} onExpired={handleExpired}/>}
            {activeTab==="trustcenter"                  &&<TrustCenterTab token={token} tenantId={tenantId} tenantName={tenantName} onExpired={handleExpired}/>}
            {activeTab==="integrations"                 &&<IntegrationsTab token={token} tenantId={tenantId} onExpired={handleExpired}/>}
            {activeTab==="audit-logs"&&<AuditLogs token={token} tenantId={tenantId}/>}
            {activeTab==="evidence"&&<EvidenceCollection token={token} tenantId={tenantId}/>}
            {activeTab==="policies"&&<PolicyManagement token={token} tenantId={tenantId}/>}
            {activeTab==="vendors"&&<VendorRisk token={token} tenantId={tenantId}/>}
            {activeTab==="team-mgmt"&&<UserManagement token={token} tenantId={tenantId}/>}
            {activeTab==="notifications"&&<Notifications token={token} tenantId={tenantId}/>}
            {activeTab==="reports"&&<Reports token={token} tenantId={tenantId}/>}
            {activeTab==="auto-evidence"&&<AutoEvidence token={token} tenantId={tenantId}/>}
            {activeTab==="auditor"&&<AuditorPortal token={token} tenantId={tenantId}/>}
            {activeTab==="monitoring"&&<ContinuousMonitoring token={token} tenantId={tenantId}/>}
          </div>
        </div>
      </div>
    </>
  );
}

export default function App() {
  const [session,setSession]=useState(null);

  if (window.location.pathname.startsWith("/trust/")) {
    const tid=window.location.pathname.split("/trust/")[1]?.split("/")[0]||"";
    return <TrustCenter tenantId={tid}/>;
  }

  function handleLogin(token,name,role,tenantId,tenantName){
    setSession({token,userName:name,role,tenantId,tenantName});
  }
  return session
    ?<Dashboard token={session.token} userName={session.userName} role={session.role} tenantId={session.tenantId} tenantName={session.tenantName} onLogout={()=>setSession(null)}/>
    :<Login onLogin={handleLogin}/>;
}

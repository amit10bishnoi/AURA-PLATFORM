from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime, timedelta
from typing import Optional
import json, secrets

router = APIRouter(prefix="/api/users", tags=["users"])
Base = declarative_base()

class TeamMember(Base):
    __tablename__ = "team_members"
    id           = Column(Integer, primary_key=True, index=True)
    tenant_id    = Column(String, index=True)
    name         = Column(String)
    email        = Column(String, index=True)
    role         = Column(String)
    status       = Column(String, default="INVITED")
    avatar_color = Column(String, default="#60A5FA")
    permissions  = Column(Text, nullable=True)
    last_login   = Column(DateTime, nullable=True)
    invited_by   = Column(String, nullable=True)
    invite_token = Column(String, nullable=True)
    mfa_enabled  = Column(Boolean, default=False)
    created_at   = Column(DateTime, default=datetime.utcnow)
    updated_at   = Column(DateTime, default=datetime.utcnow)

ROLE_PERMISSIONS = {
    "admin":     ["all"],
    "ciso":      ["compliance.read","compliance.write","risk.read","risk.write","users.read","reports.read","reports.write","policies.write","evidence.write","vendors.write","audit.read"],
    "auditor":   ["compliance.read","evidence.read","evidence.write","policies.read","audit.read","reports.read","vendors.read"],
    "developer": ["compliance.read","integrations.read","integrations.write","evidence.read","audit.read"],
    "viewer":    ["compliance.read","risk.read","reports.read"],
}
ROLE_COLORS = {"admin":"#F87171","ciso":"#A78BFA","auditor":"#60A5FA","developer":"#34D399","viewer":"#94A3B8"}
AVATAR_COLORS = ["#F87171","#FBBF24","#34D399","#60A5FA","#A78BFA","#F9A8D4","#6EE7B7","#93C5FD"]

def get_db():
    from database import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

DEMO_MEMBERS = [
    {"name":"Amit Shah","email":"amit@acme.com","role":"ciso","status":"ACTIVE","avatar_color":"#A78BFA","mfa_enabled":True,"last_login":(datetime.utcnow()-timedelta(hours=2)).isoformat(),"invited_by":"System"},
    {"name":"Priya Nair","email":"priya@acme.com","role":"auditor","status":"ACTIVE","avatar_color":"#60A5FA","mfa_enabled":True,"last_login":(datetime.utcnow()-timedelta(hours=8)).isoformat(),"invited_by":"Amit Shah"},
    {"name":"Riya Mehta","email":"riya@acme.com","role":"developer","status":"ACTIVE","avatar_color":"#34D399","mfa_enabled":False,"last_login":(datetime.utcnow()-timedelta(days=1)).isoformat(),"invited_by":"Amit Shah"},
    {"name":"Vikram Rao","email":"vikram@acme.com","role":"viewer","status":"ACTIVE","avatar_color":"#FBBF24","mfa_enabled":False,"last_login":(datetime.utcnow()-timedelta(days=3)).isoformat(),"invited_by":"Priya Nair"},
    {"name":"Sneha Patel","email":"sneha@acme.com","role":"auditor","status":"INVITED","avatar_color":"#F9A8D4","mfa_enabled":False,"last_login":None,"invited_by":"Amit Shah"},
    {"name":"Arjun Das","email":"arjun@acme.com","role":"developer","status":"INVITED","avatar_color":"#6EE7B7","mfa_enabled":False,"last_login":None,"invited_by":"Riya Mehta"},
    {"name":"Meera Iyer","email":"meera@acme.com","role":"viewer","status":"SUSPENDED","avatar_color":"#94A3B8","mfa_enabled":False,"last_login":(datetime.utcnow()-timedelta(days=30)).isoformat(),"invited_by":"Amit Shah"},
]

def _fmt(m,i=0):
    now=datetime.utcnow()
    role=m["role"]
    return {"id":i+1,"name":m["name"],"email":m["email"],"role":role,"status":m["status"],"avatar_color":m["avatar_color"],"mfa_enabled":m["mfa_enabled"],"last_login":m.get("last_login"),"invited_by":m.get("invited_by"),"permissions":ROLE_PERMISSIONS.get(role,[]),"role_color":ROLE_COLORS.get(role,"#94A3B8"),"created_at":(now-timedelta(days=i*10+5)).isoformat()}

@router.get("")
def get_members(tenant_id:str=Query(...),role:Optional[str]=Query(None),status:Optional[str]=Query(None),db:Session=Depends(get_db)):
    try:
        q=db.query(TeamMember).filter(TeamMember.tenant_id==tenant_id)
        if role: q=q.filter(TeamMember.role==role)
        if status: q=q.filter(TeamMember.status==status)
        items=q.all()
        return {"members":[{"id":m.id,"name":m.name,"email":m.email,"role":m.role,"status":m.status,"avatar_color":m.avatar_color,"mfa_enabled":m.mfa_enabled,"last_login":m.last_login.isoformat() if m.last_login else None,"invited_by":m.invited_by,"permissions":json.loads(m.permissions) if m.permissions else ROLE_PERMISSIONS.get(m.role,[]),"role_color":ROLE_COLORS.get(m.role,"#94A3B8"),"created_at":m.created_at.isoformat()} for m in items],"total":len(items)}
    except Exception:
        filtered=DEMO_MEMBERS[:]
        if role: filtered=[m for m in filtered if m["role"]==role]
        if status: filtered=[m for m in filtered if m["status"]==status]
        return {"members":[_fmt(m,i) for i,m in enumerate(filtered)],"total":len(filtered)}

@router.post("/invite")
def invite_member(body:dict,tenant_id:str=Query(...),db:Session=Depends(get_db)):
    try:
        token=secrets.token_urlsafe(32)
        role=body.get("role","viewer")
        m=TeamMember(tenant_id=tenant_id,name=body.get("name",""),email=body.get("email"),role=role,status="INVITED",invited_by=body.get("invited_by","Admin"),invite_token=token,avatar_color=AVATAR_COLORS[hash(body.get("email",""))%len(AVATAR_COLORS)],permissions=json.dumps(ROLE_PERMISSIONS.get(role,[])))
        db.add(m);db.commit();db.refresh(m)
        return {"message":"Invitation sent","id":m.id,"invite_token":token}
    except Exception:
        return {"message":"Demo mode","id":999}

@router.patch("/{member_id}/role")
def update_role(member_id:int,role:str=Query(...),db:Session=Depends(get_db)):
    try:
        m=db.query(TeamMember).filter(TeamMember.id==member_id).first()
        if not m: raise HTTPException(404,"Not found")
        m.role=role;m.permissions=json.dumps(ROLE_PERMISSIONS.get(role,[]));m.updated_at=datetime.utcnow()
        db.commit()
        return {"message":"Role updated"}
    except HTTPException: raise
    except Exception: return {"message":"Demo mode"}

@router.patch("/{member_id}/status")
def update_status(member_id:int,status:str=Query(...),db:Session=Depends(get_db)):
    try:
        m=db.query(TeamMember).filter(TeamMember.id==member_id).first()
        if not m: raise HTTPException(404,"Not found")
        m.status=status;m.updated_at=datetime.utcnow()
        db.commit()
        return {"message":"Status updated"}
    except HTTPException: raise
    except Exception: return {"message":"Demo mode"}

@router.delete("/{member_id}")
def remove_member(member_id:int,db:Session=Depends(get_db)):
    try:
        m=db.query(TeamMember).filter(TeamMember.id==member_id).first()
        if not m: raise HTTPException(404,"Not found")
        db.delete(m);db.commit()
        return {"message":"Member removed"}
    except HTTPException: raise
    except Exception: return {"message":"Demo mode"}

@router.get("/roles")
def get_roles():
    return {"roles":[
        {"id":"admin","label":"Admin","color":ROLE_COLORS["admin"],"permissions":ROLE_PERMISSIONS["admin"],"description":"Full platform access including user management"},
        {"id":"ciso","label":"CISO","color":ROLE_COLORS["ciso"],"permissions":ROLE_PERMISSIONS["ciso"],"description":"Full compliance and risk access"},
        {"id":"auditor","label":"Auditor","color":ROLE_COLORS["auditor"],"permissions":ROLE_PERMISSIONS["auditor"],"description":"Read/write evidence, policies, audit logs"},
        {"id":"developer","label":"Developer","color":ROLE_COLORS["developer"],"permissions":ROLE_PERMISSIONS["developer"],"description":"Integration and technical control access"},
        {"id":"viewer","label":"Viewer","color":ROLE_COLORS["viewer"],"permissions":ROLE_PERMISSIONS["viewer"],"description":"Read-only access to compliance status"},
    ]}

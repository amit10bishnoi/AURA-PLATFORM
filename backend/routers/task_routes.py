"""
Task routes — fully migrated to MongoDB/Motor
"""
from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel

from database import tasks, ist_now, gen_uuid
from routers.auth_routes import get_current_user, get_current_tenant_id

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "open"
    priority: str = "MEDIUM"
    assignee_email: Optional[str] = None
    due_date: Optional[str] = None
    source: str = "manual"


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assignee_email: Optional[str] = None
    due_date: Optional[str] = None


def _clean(doc: dict) -> dict:
    doc["id"] = str(doc.get("_id", doc.get("id", "")))
    doc.pop("_id", None)
    return doc


@router.get("")
async def list_tasks(
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    tenant_id: str = Depends(get_current_tenant_id),
):
    q: dict = {"tenant_id": tenant_id}
    if status:
        q["status"] = status
    if priority:
        q["priority"] = priority
    docs = await tasks().find(q).sort("created_at", -1).to_list(length=500)
    return [_clean(d) for d in docs]


@router.post("")
async def create_task(
    body: TaskCreate,
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: dict = Depends(get_current_user),
):
    uid = gen_uuid()
    doc = {
        "_id": uid,
        "id": uid,
        "tenant_id": tenant_id,
        "created_by": current_user["_id"],
        **body.model_dump(),
        "created_at": ist_now(),
        "updated_at": ist_now(),
    }
    await tasks().insert_one(doc)
    return _clean(doc)


@router.get("/{task_id}")
async def get_task(task_id: str, tenant_id: str = Depends(get_current_tenant_id)):
    doc = await tasks().find_one({"_id": task_id, "tenant_id": tenant_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Task not found")
    return _clean(doc)


@router.put("/{task_id}")
async def update_task(
    task_id: str,
    body: TaskUpdate,
    tenant_id: str = Depends(get_current_tenant_id),
):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="Nothing to update")
    updates["updated_at"] = ist_now()
    if updates.get("status") == "done":
        updates["completed_at"] = ist_now()
    result = await tasks().update_one(
        {"_id": task_id, "tenant_id": tenant_id}, {"$set": updates}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    doc = await tasks().find_one({"_id": task_id})
    return _clean(doc)


@router.delete("/{task_id}")
async def delete_task(task_id: str, tenant_id: str = Depends(get_current_tenant_id)):
    result = await tasks().delete_one({"_id": task_id, "tenant_id": tenant_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"deleted": True, "id": task_id}
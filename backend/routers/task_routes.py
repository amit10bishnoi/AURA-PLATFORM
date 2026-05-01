from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Task
from schemas import TaskCreate, TaskUpdate, TaskResponse, MessageResponse
from dependencies import get_current_user, CurrentUser

router = APIRouter(prefix="/tasks", tags=["Tasks"])


def _to_response(t: Task) -> TaskResponse:
    return TaskResponse(
        id=t.id,
        tenant_id=t.tenant_id,
        title=t.title,
        description=t.description,
        status=t.status,
        priority=t.priority,
        assignee=t.assignee_email,
        due=t.due_date.strftime("%Y-%m-%d") if t.due_date else None,
        source=t.source,
        created_at=t.created_at,
        updated_at=t.updated_at,
    )


@router.get("", response_model=List[TaskResponse])
async def list_tasks(current_user: CurrentUser = Depends(get_current_user),
                     db: Session = Depends(get_db)):
    tasks = db.query(Task).filter(
        Task.tenant_id == current_user.tenant_id
    ).order_by(Task.created_at.desc()).all()
    return [_to_response(t) for t in tasks]


@router.post("", response_model=TaskResponse)
async def create_task(data: TaskCreate,
                      current_user: CurrentUser = Depends(get_current_user),
                      db: Session = Depends(get_db)):
    if current_user.role == "auditor":
        raise HTTPException(status_code=403, detail="Auditors cannot create tasks")

    due = None
    if data.due:
        try: due = datetime.strptime(data.due, "%Y-%m-%d")
        except: pass

    t = Task(
        tenant_id=current_user.tenant_id,
        title=data.title,
        description=data.description,
        priority=data.priority,
        status="open",
        assignee_email=data.assignee,
        due_date=due,
        source="manual",
        created_by=current_user.id,
    )
    db.add(t)
    db.commit()
    db.refresh(t)
    return _to_response(t)


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(task_id: str, data: TaskUpdate,
                      current_user: CurrentUser = Depends(get_current_user),
                      db: Session = Depends(get_db)):
    if current_user.role == "auditor":
        raise HTTPException(status_code=403, detail="Auditors cannot modify tasks")

    t = db.query(Task).filter(
        Task.id == task_id,
        Task.tenant_id == current_user.tenant_id
    ).first()
    if not t:
        raise HTTPException(status_code=404, detail="Task not found")

    if data.title is not None:    t.title = data.title
    if data.description is not None: t.description = data.description
    if data.status is not None:
        t.status = data.status
        if data.status == "done": t.completed_at = datetime.utcnow()
    if data.priority is not None: t.priority = data.priority
    if data.assignee is not None: t.assignee_email = data.assignee
    if data.due is not None:
        try: t.due_date = datetime.strptime(data.due, "%Y-%m-%d")
        except: pass
    t.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(t)
    return _to_response(t)


@router.delete("/{task_id}", response_model=MessageResponse)
async def delete_task(task_id: str,
                      current_user: CurrentUser = Depends(get_current_user),
                      db: Session = Depends(get_db)):
    if current_user.role == "auditor":
        raise HTTPException(status_code=403, detail="Auditors cannot delete tasks")

    t = db.query(Task).filter(
        Task.id == task_id,
        Task.tenant_id == current_user.tenant_id
    ).first()
    if not t:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(t)
    db.commit()
    return MessageResponse(message="Task deleted")
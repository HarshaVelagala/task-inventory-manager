from bson import ObjectId
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional

from app.database import get_db
from app.schemas.task import TaskCreate, TaskUpdate, TaskOut, TaskStatus
from app.utils.deps import get_current_user, require_roles

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])


def _to_task_out(task: dict) -> TaskOut:
    return TaskOut(
        id=str(task["_id"]),
        title=task["title"],
        description=task.get("description", ""),
        status=task["status"],
        priority=task["priority"],
        due_date=task.get("due_date"),
        owner_id=task["owner_id"],
        assigned_to=task.get("assigned_to"),
        created_at=task["created_at"],
        updated_at=task["updated_at"],
    )


@router.post("/", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
async def create_task(payload: TaskCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    now = datetime.now(timezone.utc)

    task_doc = payload.model_dump()
    task_doc["status"] = payload.status.value
    task_doc["priority"] = payload.priority.value
    task_doc["owner_id"] = current_user["id"]
    task_doc["created_at"] = now
    task_doc["updated_at"] = now

    result = await db.tasks.insert_one(task_doc)
    task_doc["_id"] = result.inserted_id
    return _to_task_out(task_doc)


@router.get("/", response_model=List[TaskOut])
async def list_tasks(
    status_filter: Optional[TaskStatus] = Query(default=None, alias="status"),
    current_user: dict = Depends(get_current_user),
):
    db = get_db()

    # Admins/managers see everything; regular users see only their own or assigned tasks
    if current_user["role"] in ("admin", "manager"):
        query = {}
    else:
        query = {"$or": [{"owner_id": current_user["id"]}, {"assigned_to": current_user["id"]}]}

    if status_filter:
        query["status"] = status_filter.value

    tasks = await db.tasks.find(query).sort("created_at", -1).to_list(length=1000)
    return [_to_task_out(t) for t in tasks]


@router.get("/{task_id}", response_model=TaskOut)
async def get_task(task_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if not ObjectId.is_valid(task_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid task id")

    task = await db.tasks.find_one({"_id": ObjectId(task_id)})
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    _authorize_task_access(task, current_user)
    return _to_task_out(task)


@router.put("/{task_id}", response_model=TaskOut)
async def update_task(task_id: str, payload: TaskUpdate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if not ObjectId.is_valid(task_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid task id")

    task = await db.tasks.find_one({"_id": ObjectId(task_id)})
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    _authorize_task_access(task, current_user)

    update_data = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if "status" in update_data:
        update_data["status"] = update_data["status"].value if hasattr(update_data["status"], "value") else update_data["status"]
    if "priority" in update_data:
        update_data["priority"] = update_data["priority"].value if hasattr(update_data["priority"], "value") else update_data["priority"]
    update_data["updated_at"] = datetime.now(timezone.utc)

    await db.tasks.update_one({"_id": ObjectId(task_id)}, {"$set": update_data})
    updated_task = await db.tasks.find_one({"_id": ObjectId(task_id)})
    return _to_task_out(updated_task)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(task_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if not ObjectId.is_valid(task_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid task id")

    task = await db.tasks.find_one({"_id": ObjectId(task_id)})
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    _authorize_task_access(task, current_user, write=True)
    await db.tasks.delete_one({"_id": ObjectId(task_id)})


def _authorize_task_access(task: dict, current_user: dict, write: bool = False):
    if current_user["role"] in ("admin", "manager"):
        return
    if task["owner_id"] != current_user["id"] and task.get("assigned_to") != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this task")
    if write and task["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the owner can delete this task")

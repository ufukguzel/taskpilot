"""Task endpoints: CRUD, manual run, and run history."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from app import crud, models, scheduler, schemas
from app.auth import get_current_user
from app.database import get_db
from app.executor import execute_task

# All task endpoints require an authenticated user.
router = APIRouter(prefix="/api/tasks", tags=["tasks"], dependencies=[Depends(get_current_user)])


def _to_out(db: Session, task: models.Task) -> schemas.TaskOut:
    out = schemas.TaskOut.model_validate(task)
    run = crud.last_run(db, task.id)
    out.last_run = schemas.TaskRunOut.model_validate(run) if run else None
    return out


@router.get("", response_model=list[schemas.TaskOut])
def list_tasks(db: Session = Depends(get_db)) -> list[schemas.TaskOut]:
    return [_to_out(db, t) for t in crud.list_tasks(db)]


@router.post("", response_model=schemas.TaskOut, status_code=201)
def create_task(payload: schemas.TaskCreate, db: Session = Depends(get_db)) -> schemas.TaskOut:
    if payload.schedule and not scheduler.is_valid_cron(payload.schedule):
        raise HTTPException(422, detail=f"Invalid cron expression: {payload.schedule!r}")
    task = crud.create_task(db, payload)
    scheduler.sync_task(task)
    return _to_out(db, task)


@router.get("/{task_id}", response_model=schemas.TaskOut)
def get_task(task_id: int, db: Session = Depends(get_db)) -> schemas.TaskOut:
    task = crud.get_task(db, task_id)
    if not task:
        raise HTTPException(404, detail="Task not found")
    return _to_out(db, task)


@router.patch("/{task_id}", response_model=schemas.TaskOut)
def update_task(
    task_id: int, payload: schemas.TaskUpdate, db: Session = Depends(get_db)
) -> schemas.TaskOut:
    task = crud.get_task(db, task_id)
    if not task:
        raise HTTPException(404, detail="Task not found")
    if payload.schedule and not scheduler.is_valid_cron(payload.schedule):
        raise HTTPException(422, detail=f"Invalid cron expression: {payload.schedule!r}")
    task = crud.update_task(db, task, payload)
    scheduler.sync_task(task)
    return _to_out(db, task)


@router.delete("/{task_id}", status_code=204, response_class=Response)
def delete_task(task_id: int, db: Session = Depends(get_db)) -> Response:
    task = crud.get_task(db, task_id)
    if not task:
        raise HTTPException(404, detail="Task not found")
    scheduler.remove_task(task_id)
    crud.delete_task(db, task)
    return Response(status_code=204)


@router.post("/{task_id}/run", response_model=schemas.TaskRunOut)
def run_task_now(task_id: int, db: Session = Depends(get_db)) -> schemas.TaskRunOut:
    task = crud.get_task(db, task_id)
    if not task:
        raise HTTPException(404, detail="Task not found")
    run = execute_task(db, task, trigger="manual")
    return schemas.TaskRunOut.model_validate(run)


@router.get("/{task_id}/runs", response_model=list[schemas.TaskRunOut])
def task_runs(
    task_id: int, limit: int = Query(50, ge=1, le=200), db: Session = Depends(get_db)
) -> list[schemas.TaskRunOut]:
    task = crud.get_task(db, task_id)
    if not task:
        raise HTTPException(404, detail="Task not found")
    return [schemas.TaskRunOut.model_validate(r) for r in crud.list_runs(db, task_id, limit)]

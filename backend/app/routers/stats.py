"""Dashboard statistics endpoint."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import crud
from app.auth import get_current_user
from app.database import get_db

router = APIRouter(prefix="/api/stats", tags=["stats"], dependencies=[Depends(get_current_user)])


@router.get("")
def get_stats(db: Session = Depends(get_db)) -> dict[str, int]:
    return crud.stats(db)

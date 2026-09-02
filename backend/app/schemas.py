"""Pydantic schemas for request/response validation."""
from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, field_validator

TaskType = Literal["command", "http"]
HttpMethod = Literal["GET", "POST", "PUT", "DELETE", "PATCH"]


class TaskBase(BaseModel):
    name: str
    description: str | None = None
    task_type: TaskType = "command"
    command: str | None = None
    url: str | None = None
    http_method: HttpMethod = "GET"
    schedule: str | None = None
    enabled: bool = True

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("name cannot be blank")
        return v.strip()


class TaskCreate(TaskBase):
    """Payload for creating a task; enforces type-specific required fields."""

    def model_post_init(self, __context: object) -> None:  # noqa: D401
        if self.task_type == "command" and not (self.command and self.command.strip()):
            raise ValueError("command is required for command-type tasks")
        if self.task_type == "http" and not (self.url and self.url.strip()):
            raise ValueError("url is required for http-type tasks")


class TaskUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    task_type: TaskType | None = None
    command: str | None = None
    url: str | None = None
    http_method: HttpMethod | None = None
    schedule: str | None = None
    enabled: bool | None = None


class TaskRunOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_id: int
    status: str
    trigger: str
    output: str | None
    started_at: datetime
    finished_at: datetime | None


class TaskOut(TaskBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
    last_run: TaskRunOut | None = None


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class UserUpdate(BaseModel):
    email: EmailStr | None = None


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: EmailStr
    created_at: datetime
    updated_at: datetime
    created_by: UUID | None
    updated_by: UUID | None


class Token(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    user: UserRead

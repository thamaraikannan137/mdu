from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class EmployeeCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    job_title: str = Field(min_length=1, max_length=255)
    phone: str = Field(min_length=7, max_length=20, pattern=r"^\+?[0-9][0-9\s()-]{6,18}$")
    address: str = Field(min_length=1, max_length=255)
    city: str = Field(min_length=1, max_length=255)
    state: str = Field(min_length=1, max_length=255)
    country: str = Field(min_length=1, max_length=255)
    pincode: str = Field(pattern=r"^\d{6}$")


class EmployeeUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    email: EmailStr | None = None
    job_title: str | None = Field(default=None, min_length=1, max_length=255)
    phone: str | None = Field(default=None, min_length=7, max_length=20, pattern=r"^\+?[0-9][0-9\s()-]{6,18}$")
    address: str | None = Field(default=None, min_length=1, max_length=255)
    city: str | None = Field(default=None, min_length=1, max_length=255)
    state: str | None = Field(default=None, min_length=1, max_length=255)
    country: str | None = Field(default=None, min_length=1, max_length=255)
    pincode: str | None = Field(default=None, pattern=r"^\d{6}$")


class EmployeeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    email: EmailStr
    job_title: str
    phone: str
    address: str
    city: str
    state: str
    country: str
    pincode: str
    created_at: datetime
    updated_at: datetime
    created_by: UUID | None
    updated_by: UUID | None

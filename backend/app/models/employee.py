from uuid import UUID, uuid4

from sqlalchemy import String, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    job_title: Mapped[str] = mapped_column(String(255))
    phone: Mapped[str] = mapped_column(String(20))
    address: Mapped[str] = mapped_column(String(255))
    city: Mapped[str] = mapped_column(String(255))
    state: Mapped[str] = mapped_column(String(255))
    country: Mapped[str] = mapped_column(String(255))
    pincode: Mapped[str] = mapped_column(String(6))

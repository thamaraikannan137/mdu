from datetime import date, time
from uuid import UUID, uuid4

from sqlalchemy import Date, ForeignKey, Integer, String, Time, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.employee import Employee


class Attendance(Base):
    __tablename__ = "attendance_records"
    __table_args__ = (UniqueConstraint("employee_id", "work_date", name="attendance_records_employee_id_work_date_key"),)

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    employee_id: Mapped[UUID] = mapped_column(Uuid, ForeignKey("employees.id", ondelete="CASCADE"))
    work_date: Mapped[date] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(16))
    employee: Mapped[Employee] = relationship()
    punches: Mapped[list["AttendancePunch"]] = relationship(
        back_populates="attendance",
        cascade="all, delete-orphan",
        order_by="AttendancePunch.position",
    )

    @property
    def employee_name(self) -> str:
        return self.employee.name

    @property
    def spans(self) -> list["AttendancePunch"]:
        return list(self.punches)


class AttendancePunch(Base):
    __tablename__ = "attendance_punches"
    __table_args__ = (
        UniqueConstraint("attendance_id", "in_time", name="attendance_punches_attendance_id_in_time_key"),
    )

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    attendance_id: Mapped[UUID] = mapped_column(Uuid, ForeignKey("attendance_records.id", ondelete="CASCADE"))
    position: Mapped[int] = mapped_column(Integer)
    in_time: Mapped[time] = mapped_column(Time)
    out_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    attendance: Mapped[Attendance] = relationship(back_populates="punches")

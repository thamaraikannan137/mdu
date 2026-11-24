from datetime import UTC, date, datetime
from typing import Literal
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import contains_eager, selectinload

from app.models.attendance import Attendance, AttendancePunch
from app.models.employee import Employee
from app.schemas.attendance import AttendanceCreate, AttendanceDaySave, AttendanceSpan, AttendanceUpdate
from app.services.search import contains_pattern

AttendanceSort = Literal["work_date", "status", "employee_name"]
SortOrder = Literal["asc", "desc"]


class AttendanceNotFound(Exception):
    pass


class AttendanceEmployeeNotFound(Exception):
    pass


class AttendanceAlreadyMarked(Exception):
    pass


class AttendanceRangeInvalid(Exception):
    pass


def _records():
    return (
        select(Attendance)
        .join(Employee, Attendance.employee_id == Employee.id)
        .options(contains_eager(Attendance.employee), selectinload(Attendance.punches))
    )


def _punches(spans: list[AttendanceSpan], actor_id: UUID) -> list[AttendancePunch]:
    return [
        AttendancePunch(
            in_time=span.in_time,
            out_time=span.out_time,
            position=index,
            created_by=actor_id,
            updated_by=actor_id,
        )
        for index, span in enumerate(spans)
    ]


async def _require_employee(session: AsyncSession, employee_id: UUID) -> None:
    employee = await session.get(Employee, employee_id)
    if employee is None:
        raise AttendanceEmployeeNotFound


async def create_attendance(session: AsyncSession, data: AttendanceCreate, actor_id: UUID) -> Attendance:
    await _require_employee(session, data.employee_id)
    existing = await session.scalar(
        select(Attendance).where(Attendance.employee_id == data.employee_id, Attendance.work_date == data.work_date)
    )
    if existing is not None:
        raise AttendanceAlreadyMarked
    attendance = Attendance(
        employee_id=data.employee_id,
        work_date=data.work_date,
        status=data.status,
        created_by=actor_id,
        updated_by=actor_id,
        punches=_punches(data.spans, actor_id),
    )
    session.add(attendance)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise AttendanceAlreadyMarked
    return await get_attendance(session, attendance.id)


async def get_attendance(session: AsyncSession, attendance_id: UUID) -> Attendance:
    attendance = (
        await session.execute(_records().where(Attendance.id == attendance_id))
    ).unique().scalar_one_or_none()
    if attendance is None:
        raise AttendanceNotFound
    return attendance


async def update_attendance(
    session: AsyncSession,
    attendance: Attendance,
    data: AttendanceUpdate,
    actor_id: UUID,
) -> Attendance:
    changes = data.model_dump(exclude_unset=True)
    spans = data.spans if "spans" in data.model_fields_set else None
    changes.pop("spans", None)
    employee_id = changes.get("employee_id", attendance.employee_id)
    work_date = changes.get("work_date", attendance.work_date)
    if not isinstance(employee_id, UUID) or work_date is None:
        raise AttendanceEmployeeNotFound
    await _require_employee(session, employee_id)
    existing = await session.scalar(
        select(Attendance).where(
            Attendance.employee_id == employee_id,
            Attendance.work_date == work_date,
            Attendance.id != attendance.id,
        )
    )
    if existing is not None:
        raise AttendanceAlreadyMarked
    for key, value in changes.items():
        if value is None:
            continue
        setattr(attendance, key, value)
    attendance.updated_at = datetime.now(UTC)
    attendance.updated_by = actor_id
    if attendance.status == "absent":
        spans = []
    if spans is not None:
        attendance.punches.clear()
        await session.flush()
        attendance.punches.extend(_punches(spans, actor_id))
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise AttendanceAlreadyMarked
    return await get_attendance(session, attendance.id)


async def list_attendance(
    session: AsyncSession,
    *,
    limit: int,
    offset: int,
    q: str | None,
    sort: AttendanceSort,
    order: SortOrder,
) -> tuple[list[Attendance], int]:
    statement = _records()
    count = select(func.count()).select_from(Attendance).join(Employee, Attendance.employee_id == Employee.id)
    term = q.strip() if q else ""
    if term:
        pattern = contains_pattern(term)
        match = or_(
            Employee.name.ilike(pattern, escape="\\"),
            Attendance.status.ilike(pattern, escape="\\"),
        )
        statement = statement.where(match)
        count = count.where(match)
    column = {
        "work_date": Attendance.work_date,
        "status": Attendance.status,
        "employee_name": Employee.name,
    }[sort]
    direction = column.asc() if order == "asc" else column.desc()
    rows = (
        await session.scalars(statement.order_by(direction, Attendance.id.asc()).limit(limit).offset(offset))
    ).unique().all()
    total = await session.scalar(count)
    return list(rows), int(total or 0)


async def attendance_roster(session: AsyncSession, work_date: date) -> tuple[list[Employee], dict[UUID, Attendance]]:
    employees = list((await session.scalars(select(Employee).order_by(Employee.name.asc(), Employee.id.asc()))).all())
    marks = list(
        (
            await session.scalars(
                select(Attendance)
                .where(Attendance.work_date == work_date)
                .options(selectinload(Attendance.punches))
            )
        ).all()
    )
    return employees, {mark.employee_id: mark for mark in marks}


async def attendance_range(
    session: AsyncSession,
    start: date,
    end: date,
) -> tuple[list[Employee], list[Attendance]]:
    if end < start or (end - start).days > 41:
        raise AttendanceRangeInvalid
    employees = list((await session.scalars(select(Employee).order_by(Employee.name.asc(), Employee.id.asc()))).all())
    marks = list(
        (
            await session.scalars(
                select(Attendance)
                .where(Attendance.work_date >= start, Attendance.work_date <= end)
                .options(selectinload(Attendance.punches))
            )
        ).all()
    )
    return employees, marks


async def save_attendance_day(session: AsyncSession, data: AttendanceDaySave, actor_id: UUID) -> None:
    employee_ids = [mark.employee_id for mark in data.marks]
    found = set((await session.scalars(select(Employee.id).where(Employee.id.in_(employee_ids)))).all())
    if set(employee_ids) != found:
        raise AttendanceEmployeeNotFound
    existing = list(
        (
            await session.scalars(
                select(Attendance)
                .where(
                    Attendance.work_date == data.work_date,
                    Attendance.employee_id.in_(employee_ids),
                )
                .options(selectinload(Attendance.punches))
            )
        ).all()
    )
    by_employee = {row.employee_id: row for row in existing}
    now = datetime.now(UTC)
    for mark in data.marks:
        row = by_employee.get(mark.employee_id)
        if row is None:
            created = Attendance(
                employee_id=mark.employee_id,
                work_date=data.work_date,
                status=mark.status,
                created_by=actor_id,
                updated_by=actor_id,
                punches=_punches(mark.spans, actor_id),
            )
            session.add(created)
            by_employee[mark.employee_id] = created
            continue
        row.status = mark.status
        row.updated_at = now
        row.updated_by = actor_id
        row.punches.clear()
        await session.flush()
        row.punches.extend(_punches(mark.spans, actor_id))
    await session.commit()

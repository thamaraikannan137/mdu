from datetime import UTC, datetime
from typing import Literal
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.employee import Employee
from app.schemas.employee import EmployeeCreate, EmployeeUpdate
from app.services.search import contains_pattern

EmployeeSort = Literal["name", "email", "job_title", "phone", "city"]
SortOrder = Literal["asc", "desc"]


class EmployeeEmailAlreadyUsed(Exception):
    pass


class EmployeeNotFound(Exception):
    pass


async def create_employee(session: AsyncSession, data: EmployeeCreate, actor_id: UUID) -> Employee:
    existing = await session.scalar(select(Employee).where(Employee.email == data.email))
    if existing is not None:
        raise EmployeeEmailAlreadyUsed

    employee = Employee(
        name=data.name,
        email=data.email,
        job_title=data.job_title,
        phone=data.phone,
        address=data.address,
        city=data.city,
        state=data.state,
        country=data.country,
        pincode=data.pincode,
        created_by=actor_id,
        updated_by=actor_id,
    )
    session.add(employee)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise EmployeeEmailAlreadyUsed
    await session.refresh(employee)
    return employee


async def get_employee(session: AsyncSession, employee_id: UUID) -> Employee:
    employee = await session.get(Employee, employee_id)
    if employee is None:
        raise EmployeeNotFound
    return employee


async def update_employee(
    session: AsyncSession,
    employee: Employee,
    data: EmployeeUpdate,
    actor_id: UUID,
) -> Employee:
    changes = data.model_dump(exclude_unset=True)
    email = changes.get("email")
    if isinstance(email, str):
        existing = await session.scalar(
            select(Employee).where(Employee.email == email, Employee.id != employee.id)
        )
        if existing is not None:
            raise EmployeeEmailAlreadyUsed
    for key, value in changes.items():
        if value is None:
            continue
        setattr(employee, key, value)
    employee.updated_at = datetime.now(UTC)
    employee.updated_by = actor_id
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise EmployeeEmailAlreadyUsed
    await session.refresh(employee)
    return employee


async def list_employees(
    session: AsyncSession,
    *,
    limit: int,
    offset: int,
    q: str | None,
    sort: EmployeeSort,
    order: SortOrder,
) -> tuple[list[Employee], int]:
    statement = select(Employee)
    count = select(func.count()).select_from(Employee)
    term = q.strip() if q else ""
    if term:
        pattern = contains_pattern(term)
        match = or_(
            Employee.name.ilike(pattern, escape="\\"),
            Employee.email.ilike(pattern, escape="\\"),
            Employee.job_title.ilike(pattern, escape="\\"),
            Employee.phone.ilike(pattern, escape="\\"),
            Employee.city.ilike(pattern, escape="\\"),
            Employee.pincode.ilike(pattern, escape="\\"),
        )
        statement = statement.where(match)
        count = count.where(match)
    column = {
        "name": Employee.name,
        "email": Employee.email,
        "job_title": Employee.job_title,
        "phone": Employee.phone,
        "city": Employee.city,
    }[sort]
    direction = column.asc() if order == "asc" else column.desc()
    rows = (await session.scalars(statement.order_by(direction, Employee.id.asc()).limit(limit).offset(offset))).all()
    total = await session.scalar(count)
    return list(rows), int(total or 0)

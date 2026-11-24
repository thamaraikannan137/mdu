from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.employee import EmployeeCreate, EmployeeRead, EmployeeUpdate
from app.schemas.page import Page
from app.services.employees import (
    EmployeeEmailAlreadyUsed,
    EmployeeNotFound,
    EmployeeSort,
    SortOrder,
    create_employee,
    get_employee,
    list_employees,
    update_employee,
)

router = APIRouter(prefix="/employees", tags=["employees"])


@router.post("", response_model=EmployeeRead, status_code=201)
async def post_employee(
    data: EmployeeCreate,
    session: AsyncSession = Depends(get_db),
    current: User = Depends(get_current_user),
) -> EmployeeRead:
    try:
        employee = await create_employee(session, data, actor_id=current.id)
    except EmployeeEmailAlreadyUsed:
        raise HTTPException(status_code=409, detail="Email already used")
    return EmployeeRead.model_validate(employee)


@router.get("", response_model=Page[EmployeeRead])
async def get_employees(
    session: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    q: str | None = Query(default=None, max_length=200),
    sort: EmployeeSort = Query(default="name"),
    order: SortOrder = Query(default="asc"),
) -> Page[EmployeeRead]:
    rows, total = await list_employees(session, limit=limit, offset=offset, q=q, sort=sort, order=order)
    items = [EmployeeRead.model_validate(row) for row in rows]
    return Page(items=items, total=total, limit=limit, offset=offset)


@router.get("/{employee_id}", response_model=EmployeeRead)
async def get_employee_by_id(
    employee_id: UUID,
    session: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> EmployeeRead:
    try:
        employee = await get_employee(session, employee_id)
    except EmployeeNotFound:
        raise HTTPException(status_code=404, detail="Employee not found")
    return EmployeeRead.model_validate(employee)


@router.patch("/{employee_id}", response_model=EmployeeRead)
async def patch_employee(
    employee_id: UUID,
    data: EmployeeUpdate,
    session: AsyncSession = Depends(get_db),
    current: User = Depends(get_current_user),
) -> EmployeeRead:
    try:
        employee = await get_employee(session, employee_id)
        updated = await update_employee(session, employee, data, actor_id=current.id)
    except EmployeeNotFound:
        raise HTTPException(status_code=404, detail="Employee not found")
    except EmployeeEmailAlreadyUsed:
        raise HTTPException(status_code=409, detail="Email already used")
    return EmployeeRead.model_validate(updated)

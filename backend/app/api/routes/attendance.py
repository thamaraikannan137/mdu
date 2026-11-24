from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.attendance import (
    AttendanceCreate,
    AttendanceDaySave,
    AttendanceRange,
    AttendanceRangeDay,
    AttendanceRangeItem,
    AttendanceRead,
    AttendanceRoster,
    AttendanceRosterItem,
    AttendanceSpan,
    AttendanceUpdate,
)
from app.schemas.page import Page
from app.services.attendance import (
    AttendanceAlreadyMarked,
    AttendanceEmployeeNotFound,
    AttendanceNotFound,
    AttendanceRangeInvalid,
    AttendanceSort,
    SortOrder,
    attendance_range,
    attendance_roster,
    create_attendance,
    get_attendance,
    list_attendance,
    save_attendance_day,
    update_attendance,
)

router = APIRouter(prefix="/attendance", tags=["attendance"])


@router.post("", response_model=AttendanceRead, status_code=201)
async def post_attendance(
    data: AttendanceCreate,
    session: AsyncSession = Depends(get_db),
    current: User = Depends(get_current_user),
) -> AttendanceRead:
    try:
        attendance = await create_attendance(session, data, actor_id=current.id)
    except AttendanceEmployeeNotFound:
        raise HTTPException(status_code=404, detail="Employee not found")
    except AttendanceAlreadyMarked:
        raise HTTPException(status_code=409, detail="Attendance already marked for this employee on that date")
    return AttendanceRead.model_validate(attendance)


@router.get("", response_model=Page[AttendanceRead])
async def get_attendance_page(
    session: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    q: str | None = Query(default=None, max_length=200),
    sort: AttendanceSort = Query(default="work_date"),
    order: SortOrder = Query(default="desc"),
) -> Page[AttendanceRead]:
    rows, total = await list_attendance(session, limit=limit, offset=offset, q=q, sort=sort, order=order)
    items = [AttendanceRead.model_validate(row) for row in rows]
    return Page(items=items, total=total, limit=limit, offset=offset)


@router.get("/day", response_model=AttendanceRoster)
async def get_attendance_day(
    session: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
    work_date: date = Query(),
) -> AttendanceRoster:
    return await _roster(session, work_date)


@router.post("/day", response_model=AttendanceRoster, status_code=200)
async def post_attendance_day(
    data: AttendanceDaySave,
    session: AsyncSession = Depends(get_db),
    current: User = Depends(get_current_user),
) -> AttendanceRoster:
    try:
        await save_attendance_day(session, data, actor_id=current.id)
    except AttendanceEmployeeNotFound:
        raise HTTPException(status_code=404, detail="Employee not found")
    return await _roster(session, data.work_date)


@router.get("/range", response_model=AttendanceRange)
async def get_attendance_range(
    session: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
    start: date = Query(),
    end: date = Query(),
) -> AttendanceRange:
    try:
        employees, marks = await attendance_range(session, start, end)
    except AttendanceRangeInvalid:
        raise HTTPException(status_code=422, detail="Choose a week or a month")
    by_employee: dict[UUID, list] = {}
    for mark in marks:
        by_employee.setdefault(mark.employee_id, []).append(mark)
    items = []
    for employee in employees:
        rows = sorted(by_employee.get(employee.id, []), key=lambda row: row.work_date)
        items.append(
            AttendanceRangeItem(
                employee_id=employee.id,
                employee_name=employee.name,
                days=[
                    AttendanceRangeDay(
                        work_date=row.work_date,
                        status=row.status,
                        spans=[AttendanceSpan.model_validate(punch) for punch in row.spans],
                    )
                    for row in rows
                ],
            )
        )
    return AttendanceRange(start=start, end=end, items=items)


async def _roster(session: AsyncSession, work_date: date) -> AttendanceRoster:
    employees, marks = await attendance_roster(session, work_date)
    items = [
        AttendanceRosterItem(
            employee_id=employee.id,
            employee_name=employee.name,
            status=marks[employee.id].status if employee.id in marks else None,
            spans=[AttendanceSpan.model_validate(punch) for punch in marks[employee.id].spans]
            if employee.id in marks
            else [],
        )
        for employee in employees
    ]
    return AttendanceRoster(work_date=work_date, items=items)


@router.get("/{attendance_id}", response_model=AttendanceRead)
async def get_attendance_by_id(
    attendance_id: UUID,
    session: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> AttendanceRead:
    try:
        attendance = await get_attendance(session, attendance_id)
    except AttendanceNotFound:
        raise HTTPException(status_code=404, detail="Attendance not found")
    return AttendanceRead.model_validate(attendance)


@router.patch("/{attendance_id}", response_model=AttendanceRead)
async def patch_attendance(
    attendance_id: UUID,
    data: AttendanceUpdate,
    session: AsyncSession = Depends(get_db),
    current: User = Depends(get_current_user),
) -> AttendanceRead:
    try:
        attendance = await get_attendance(session, attendance_id)
        updated = await update_attendance(session, attendance, data, actor_id=current.id)
    except AttendanceNotFound:
        raise HTTPException(status_code=404, detail="Attendance not found")
    except AttendanceEmployeeNotFound:
        raise HTTPException(status_code=404, detail="Employee not found")
    except AttendanceAlreadyMarked:
        raise HTTPException(status_code=409, detail="Attendance already marked for this employee on that date")
    return AttendanceRead.model_validate(updated)

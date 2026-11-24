from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.page import Page
from app.schemas.user import UserRead, UserUpdate
from app.services.users import EmailAlreadyUsed, SortOrder, UserSort, list_users, update_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=Page[UserRead])
async def get_users(
    session: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    q: str | None = Query(default=None, max_length=200),
    sort: UserSort = Query(default="email"),
    order: SortOrder = Query(default="asc"),
) -> Page[UserRead]:
    rows, total = await list_users(session, limit=limit, offset=offset, q=q, sort=sort, order=order)
    items = [UserRead.model_validate(row) for row in rows]
    return Page(items=items, total=total, limit=limit, offset=offset)


@router.patch("/me", response_model=UserRead)
async def patch_me(
    data: UserUpdate,
    session: AsyncSession = Depends(get_db),
    current: User = Depends(get_current_user),
) -> UserRead:
    try:
        updated = await update_user(session, current, data, actor_id=current.id)
    except EmailAlreadyUsed:
        raise HTTPException(status_code=409, detail="Email already used")
    return UserRead.model_validate(updated)

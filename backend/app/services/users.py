from datetime import UTC, datetime
from typing import Literal
from uuid import UUID

from pwdlib import PasswordHash
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.services.search import contains_pattern

UserSort = Literal["email"]
SortOrder = Literal["asc", "desc"]

password_hash = PasswordHash.recommended()


class EmailAlreadyUsed(Exception):
    pass


class InvalidCredentials(Exception):
    pass


async def register(session: AsyncSession, data: UserCreate) -> User:
    existing = await session.scalar(select(User).where(User.email == data.email))
    if existing is not None:
        raise EmailAlreadyUsed

    user = User(email=data.email, password_hash=password_hash.hash(data.password))
    session.add(user)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise EmailAlreadyUsed
    await session.refresh(user)
    return user


async def update_user(session: AsyncSession, user: User, data: UserUpdate, actor_id: UUID) -> User:
    for key, value in data.model_dump(exclude_unset=True).items():
        if value is None:
            continue
        setattr(user, key, value)
    user.updated_at = datetime.now(UTC)
    user.updated_by = actor_id
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise EmailAlreadyUsed
    await session.refresh(user)
    return user


async def authenticate(session: AsyncSession, data: UserCreate) -> User:
    user = await session.scalar(select(User).where(User.email == data.email))
    if user is None or not password_hash.verify(data.password, user.password_hash):
        raise InvalidCredentials
    return user


async def list_users(
    session: AsyncSession,
    *,
    limit: int,
    offset: int,
    q: str | None,
    sort: UserSort,
    order: SortOrder,
) -> tuple[list[User], int]:
    statement = select(User)
    count = select(func.count()).select_from(User)
    term = q.strip() if q else ""
    if term:
        match = User.email.ilike(contains_pattern(term), escape="\\")
        statement = statement.where(match)
        count = count.where(match)
    direction = User.email.asc() if order == "asc" else User.email.desc()
    rows = (await session.scalars(statement.order_by(direction, User.id.asc()).limit(limit).offset(offset))).all()
    total = await session.scalar(count)
    return list(rows), int(total or 0)

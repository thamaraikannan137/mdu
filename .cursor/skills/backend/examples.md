# Backend examples

These pieces match the frontend login client: `POST /auth/login` with `email` and `password`, returning a bearer token and the user. Later requests send `Authorization: Bearer <access_token>`.

## Settings

`backend/app/core/config.py`

```python
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    cors_origin: str = "http://localhost:5173"
    jwt_secret: str
    access_token_minutes: int = 30


settings = Settings()
```

`backend/.env.example`

```
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/mdu
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=change-me
```

## Session

`backend/app/core/database.py`

```python
from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

engine = create_async_engine(settings.database_url)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def get_db() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
```

## Model

`backend/app/models/base.py`

```python
from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, MetaData, Uuid, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

convention = {"fk": "%(table_name)s_%(column_0_name)s_fkey"}


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=convention)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    created_by: Mapped[UUID | None] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    updated_by: Mapped[UUID | None] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
```

`backend/app/models/user.py`

```python
from uuid import UUID, uuid4

from sqlalchemy import String, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
```

## Schemas

`backend/app/schemas/user.py`

```python
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
```

## Service

`backend/app/services/users.py`

```python
from pwdlib import PasswordHash
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate

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
    await session.commit()
    await session.refresh(user)
    return user


async def update_user(session: AsyncSession, user: User, data: UserUpdate, actor_id: UUID) -> User:
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(user, key, value)
    user.updated_at = datetime.now(UTC)
    user.updated_by = actor_id
    await session.commit()
    await session.refresh(user)
    return user


async def authenticate(session: AsyncSession, data: UserCreate) -> User:
    user = await session.scalar(select(User).where(User.email == data.email))
    if user is None or not password_hash.verify(data.password, user.password_hash):
        raise InvalidCredentials
    return user
```

## Route

`backend/app/api/routes/auth.py`

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import create_access_token
from app.schemas.user import Token, UserCreate, UserRead
from app.services.users import InvalidCredentials, authenticate

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=Token)
async def login(data: UserCreate, session: AsyncSession = Depends(get_db)) -> Token:
    try:
        user = await authenticate(session, data)
    except InvalidCredentials:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return Token(access_token=create_access_token(user.id), user=UserRead.model_validate(user))
```

`list_users` and the user routes live on a users router. Register both routers with no extra prefix.

## Token and current user

`backend/app/core/security.py`

```python
from datetime import UTC, datetime, timedelta
from uuid import UUID

import jwt
from jwt.exceptions import InvalidTokenError

from app.core.config import settings


class InvalidToken(Exception):
    pass


def create_access_token(user_id: UUID) -> str:
    expires = datetime.now(UTC) + timedelta(minutes=settings.access_token_minutes)
    return jwt.encode({"sub": str(user_id), "exp": expires}, settings.jwt_secret, algorithm="HS256")


def read_user_id(token: str) -> UUID:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except InvalidTokenError as exc:
        raise InvalidToken from exc
    subject = payload.get("sub")
    if not isinstance(subject, str):
        raise InvalidToken
    return UUID(subject)
```

`backend/app/api/deps.py`

```python
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import InvalidToken, read_user_id
from app.models.user import User

bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    session: AsyncSession = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        user_id = read_user_id(credentials.credentials)
    except InvalidToken:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await session.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user
```

## Page and partial update

`backend/app/schemas/page.py`

```python
from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    items: list[T]
    total: int
    limit: int
    offset: int
```

`list_users` in `app/services/users.py`:

```python
from sqlalchemy import func, select


async def list_users(session: AsyncSession, *, limit: int, offset: int) -> tuple[list[User], int]:
    rows = (await session.scalars(select(User).limit(limit).offset(offset))).all()
    total = await session.scalar(select(func.count()).select_from(User))
    return list(rows), int(total or 0)
```

`backend/app/api/routes/users.py`

```python
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.page import Page
from app.schemas.user import UserRead, UserUpdate
from app.services.users import list_users, update_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=Page[UserRead])
async def get_users(
    session: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> Page[UserRead]:
    rows, total = await list_users(session, limit=limit, offset=offset)
    items = [UserRead.model_validate(row) for row in rows]
    return Page(items=items, total=total, limit=limit, offset=offset)


@router.patch("/me", response_model=UserRead)
async def patch_me(
    data: UserUpdate,
    session: AsyncSession = Depends(get_db),
    current: User = Depends(get_current_user),
) -> UserRead:
    updated = await update_user(session, current, data, actor_id=current.id)
    return UserRead.model_validate(updated)
```

## App entry

`backend/app/main.py`

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origin.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router)
```

`backend/app/api/router.py`

```python
from fastapi import APIRouter

from app.api.routes import auth, users

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
```

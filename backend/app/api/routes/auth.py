from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import create_access_token
from app.schemas.user import Token, UserCreate, UserRead
from app.services.users import EmailAlreadyUsed, InvalidCredentials, authenticate, register

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserRead, status_code=201)
async def register_user(data: UserCreate, session: AsyncSession = Depends(get_db)) -> UserRead:
    try:
        user = await register(session, data)
    except EmailAlreadyUsed:
        raise HTTPException(status_code=409, detail="Email already used")
    return UserRead.model_validate(user)


@router.post("/login", response_model=Token)
async def login(data: UserCreate, session: AsyncSession = Depends(get_db)) -> Token:
    try:
        user = await authenticate(session, data)
    except InvalidCredentials:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return Token(access_token=create_access_token(user.id), user=UserRead.model_validate(user))

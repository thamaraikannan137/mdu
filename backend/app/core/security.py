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

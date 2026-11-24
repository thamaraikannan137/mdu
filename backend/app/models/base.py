from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, MetaData, Uuid, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

convention = {
    "fk": "%(table_name)s_%(column_0_name)s_fkey",
}


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

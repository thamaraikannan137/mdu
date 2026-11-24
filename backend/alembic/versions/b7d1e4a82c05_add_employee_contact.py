"""add employee contact

Revision ID: b7d1e4a82c05
Revises: 06cea78d69bb
Create Date: 2026-11-24 23:37:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b7d1e4a82c05"
down_revision: Union[str, Sequence[str], None] = "06cea78d69bb"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    columns = [
        sa.Column("phone", sa.String(length=20), nullable=False, server_default=""),
        sa.Column("address", sa.String(length=255), nullable=False, server_default=""),
        sa.Column("city", sa.String(length=255), nullable=False, server_default=""),
        sa.Column("state", sa.String(length=255), nullable=False, server_default=""),
        sa.Column("country", sa.String(length=255), nullable=False, server_default=""),
        sa.Column("pincode", sa.String(length=6), nullable=False, server_default=""),
    ]
    for column in columns:
        op.add_column("employees", column)
        op.alter_column("employees", column.name, server_default=None)


def downgrade() -> None:
    for name in ("pincode", "country", "state", "city", "address", "phone"):
        op.drop_column("employees", name)

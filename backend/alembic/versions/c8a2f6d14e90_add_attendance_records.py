"""add attendance records

Revision ID: c8a2f6d14e90
Revises: b7d1e4a82c05
Create Date: 2026-11-24 23:51:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c8a2f6d14e90"
down_revision: Union[str, Sequence[str], None] = "b7d1e4a82c05"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "attendance_records",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("employee_id", sa.Uuid(), nullable=False),
        sa.Column("work_date", sa.Date(), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("created_by", sa.Uuid(), nullable=True),
        sa.Column("updated_by", sa.Uuid(), nullable=True),
        sa.ForeignKeyConstraint(
            ["employee_id"],
            ["employees.id"],
            name="attendance_records_employee_id_fkey",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["created_by"],
            ["users.id"],
            name="attendance_records_created_by_fkey",
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["updated_by"],
            ["users.id"],
            name="attendance_records_updated_by_fkey",
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("employee_id", "work_date", name="attendance_records_employee_id_work_date_key"),
    )


def downgrade() -> None:
    op.drop_table("attendance_records")

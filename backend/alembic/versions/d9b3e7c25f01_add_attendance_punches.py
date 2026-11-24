"""add attendance punches

Revision ID: d9b3e7c25f01
Revises: c8a2f6d14e90
Create Date: 2026-11-25 00:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d9b3e7c25f01"
down_revision: Union[str, Sequence[str], None] = "c8a2f6d14e90"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "attendance_punches",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("attendance_id", sa.Uuid(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("in_time", sa.Time(), nullable=False),
        sa.Column("out_time", sa.Time(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("created_by", sa.Uuid(), nullable=True),
        sa.Column("updated_by", sa.Uuid(), nullable=True),
        sa.ForeignKeyConstraint(
            ["attendance_id"],
            ["attendance_records.id"],
            name="attendance_punches_attendance_id_fkey",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["created_by"],
            ["users.id"],
            name="attendance_punches_created_by_fkey",
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["updated_by"],
            ["users.id"],
            name="attendance_punches_updated_by_fkey",
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("attendance_id", "in_time", name="attendance_punches_attendance_id_in_time_key"),
    )
    op.create_index("attendance_punches_attendance_id_idx", "attendance_punches", ["attendance_id"])


def downgrade() -> None:
    op.drop_index("attendance_punches_attendance_id_idx", table_name="attendance_punches")
    op.drop_table("attendance_punches")

"""initial postgresql schema

Revision ID: 20260627_0001
Revises:
Create Date: 2026-06-27

CRITICAL INTEGRATION NOTE FOR PORTING TO MENTOROS MONOREPO:
Migrations are linear and single-history in MentorOS. When this code is ported over,
DO NOT blindly copy this migration file. Instead, this Alembic migration MUST be
regenerated against MentorOS's latest main branch immediately before the PR is opened.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20260627_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


risk_band = sa.Enum("Green", "Amber", "Coral", name="risk_band")
meeting_status = sa.Enum("scheduled", "completed", "cancelled", name="meeting_status")


def upgrade() -> None:
    risk_band.create(op.get_bind(), checkfirst=True)
    meeting_status.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "mentors",
        sa.Column("mentor_id", sa.String(), nullable=False),
        sa.Column("mentor_name", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=True),
        sa.Column("department", sa.String(), nullable=False),
        sa.Column("designation", sa.String(), nullable=True),
        sa.Column("max", sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint("mentor_id"),
    )
    op.create_index(op.f("ix_mentors_mentor_id"), "mentors", ["mentor_id"], unique=False)

    op.create_table(
        "students",
        sa.Column("student_id", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=True),
        sa.Column("department", sa.String(), nullable=False),
        sa.Column("year", sa.String(), nullable=True),
        sa.Column("division", sa.String(), nullable=True),
        sa.Column("semester", sa.String(), nullable=True),
        sa.PrimaryKeyConstraint("student_id"),
    )
    op.create_index(op.f("ix_students_student_id"), "students", ["student_id"], unique=False)

    op.create_table(
        "allocations",
        sa.Column("student_id", sa.String(), nullable=False),
        sa.Column("mentor_id", sa.String(), nullable=False),
        sa.Column("assigned_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["mentor_id"], ["mentors.mentor_id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["student_id"], ["students.student_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("student_id"),
    )

    op.create_table(
        "score_data",
        sa.Column("student_id", sa.String(), nullable=False),
        sa.Column("attendance", sa.Float(), server_default=sa.text("0"), nullable=False),
        sa.Column("academic", sa.Float(), server_default=sa.text("0"), nullable=False),
        sa.Column("engagement", sa.Float(), server_default=sa.text("0"), nullable=False),
        sa.Column("placement", sa.Float(), server_default=sa.text("0"), nullable=False),
        sa.Column("score", sa.Float(), server_default=sa.text("0"), nullable=False),
        sa.Column("risk_band", risk_band, server_default=sa.text("'Coral'"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["student_id"], ["students.student_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("student_id"),
    )

    op.create_table(
        "meetings",
        sa.Column("meeting_id", sa.String(), nullable=False),
        sa.Column("mentor_id", sa.String(), nullable=False),
        sa.Column("student_id", sa.String(), nullable=False),
        sa.Column("date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("time", sa.String(), nullable=True),
        sa.Column("agenda", sa.String(), nullable=True),
        sa.Column("notes", sa.String(), nullable=True),
        sa.Column("status", meeting_status, server_default=sa.text("'scheduled'"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["mentor_id"], ["mentors.mentor_id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["student_id"], ["students.student_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("meeting_id"),
    )
    op.create_index(op.f("ix_meetings_meeting_id"), "meetings", ["meeting_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_meetings_meeting_id"), table_name="meetings")
    op.drop_table("meetings")
    op.drop_table("score_data")
    op.drop_table("allocations")
    op.drop_index(op.f("ix_students_student_id"), table_name="students")
    op.drop_table("students")
    op.drop_index(op.f("ix_mentors_mentor_id"), table_name="mentors")
    op.drop_table("mentors")
    meeting_status.drop(op.get_bind(), checkfirst=True)
    risk_band.drop(op.get_bind(), checkfirst=True)

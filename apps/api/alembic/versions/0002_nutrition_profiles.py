"""nutrition profiles + target overrides

Revision ID: 0002_nutrition_profiles
Revises: 0001_init_auth
Create Date: 2026-02-14

"""

from alembic import op
import sqlalchemy as sa


revision = "0002_nutrition_profiles"
down_revision = "0001_init_auth"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "nutrition_profiles",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("sex", sa.Text(), nullable=False),
        sa.Column("birth_date", sa.Date(), nullable=False),
        sa.Column("height_cm", sa.Integer(), nullable=False),
        sa.Column("weight_kg", sa.Numeric(5, 2), nullable=False),
        sa.Column("activity_level", sa.Text(), nullable=False),
        sa.Column("goal", sa.Text(), nullable=False, server_default="maintain"),
        sa.Column("override_kcal", sa.Integer(), nullable=True),
        sa.Column("override_protein_g", sa.Integer(), nullable=True),
        sa.Column("override_carbs_g", sa.Integer(), nullable=True),
        sa.Column("override_fat_g", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )

    op.create_unique_constraint(
        "uq_nutrition_profiles_tenant_user",
        "nutrition_profiles",
        ["tenant_id", "user_id"],
    )
    op.create_index("ix_nutrition_profiles_tenant_id", "nutrition_profiles", ["tenant_id"])
    op.create_index("ix_nutrition_profiles_user_id", "nutrition_profiles", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_nutrition_profiles_user_id", table_name="nutrition_profiles")
    op.drop_index("ix_nutrition_profiles_tenant_id", table_name="nutrition_profiles")
    op.drop_constraint("uq_nutrition_profiles_tenant_user", "nutrition_profiles", type_="unique")
    op.drop_table("nutrition_profiles")

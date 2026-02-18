"""weekly planning: templates and instances

Revision ID: 0004_weekly_planning
Revises: 0003_food_library
Create Date: 2026-02-15

"""

from alembic import op
import sqlalchemy as sa


revision = "0004_weekly_planning"
down_revision = "0003_food_library"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "week_plan_templates",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_week_plan_templates_tenant_id", "week_plan_templates", ["tenant_id"])
    op.create_index("ix_week_plan_templates_tenant_name", "week_plan_templates", ["tenant_id", "name"])

    op.create_table(
        "week_plan_template_items",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("week_plan_template_id", sa.Uuid(), nullable=False),
        sa.Column("day_key", sa.Text(), nullable=False),
        sa.Column("slot_key", sa.Text(), nullable=False),
        sa.Column("dish_template_id", sa.Uuid(), nullable=True),
        sa.Column("dish_template_name", sa.Text(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["week_plan_template_id"], ["week_plan_templates.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["dish_template_id"], ["dish_templates.id"], ondelete="SET NULL"),
        sa.UniqueConstraint("week_plan_template_id", "day_key", "slot_key", name="uq_week_plan_template_items_day_slot"),
    )
    op.create_index("ix_week_plan_template_items_tenant_id", "week_plan_template_items", ["tenant_id"])
    op.create_index("ix_week_plan_template_items_template_id", "week_plan_template_items", ["week_plan_template_id"])

    op.create_table(
        "week_plan_instances",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("template_id", sa.Uuid(), nullable=True),
        sa.Column("client_ref", sa.Text(), nullable=False),
        sa.Column("week_start_date", sa.Date(), nullable=False),
        sa.Column("template_name_snapshot", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["template_id"], ["week_plan_templates.id"], ondelete="SET NULL"),
        sa.UniqueConstraint("tenant_id", "client_ref", "week_start_date", name="uq_week_plan_instances_tenant_client_week"),
    )
    op.create_index("ix_week_plan_instances_tenant_id", "week_plan_instances", ["tenant_id"])
    op.create_index("ix_week_plan_instances_tenant_client_ref", "week_plan_instances", ["tenant_id", "client_ref"])
    op.create_index("ix_week_plan_instances_tenant_week_start_date", "week_plan_instances", ["tenant_id", "week_start_date"])

    op.create_table(
        "week_plan_instance_items",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("week_plan_instance_id", sa.Uuid(), nullable=False),
        sa.Column("source_template_item_id", sa.Uuid(), nullable=True),
        sa.Column("day_key", sa.Text(), nullable=False),
        sa.Column("slot_key", sa.Text(), nullable=False),
        sa.Column("dish_template_id", sa.Uuid(), nullable=True),
        sa.Column("dish_name", sa.Text(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["week_plan_instance_id"], ["week_plan_instances.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("week_plan_instance_id", "day_key", "slot_key", name="uq_week_plan_instance_items_day_slot"),
    )
    op.create_index("ix_week_plan_instance_items_tenant_id", "week_plan_instance_items", ["tenant_id"])
    op.create_index("ix_week_plan_instance_items_instance_id", "week_plan_instance_items", ["week_plan_instance_id"])


def downgrade() -> None:
    op.drop_index("ix_week_plan_instance_items_instance_id", table_name="week_plan_instance_items")
    op.drop_index("ix_week_plan_instance_items_tenant_id", table_name="week_plan_instance_items")
    op.drop_table("week_plan_instance_items")

    op.drop_index("ix_week_plan_instances_tenant_week_start_date", table_name="week_plan_instances")
    op.drop_index("ix_week_plan_instances_tenant_client_ref", table_name="week_plan_instances")
    op.drop_index("ix_week_plan_instances_tenant_id", table_name="week_plan_instances")
    op.drop_table("week_plan_instances")

    op.drop_index("ix_week_plan_template_items_template_id", table_name="week_plan_template_items")
    op.drop_index("ix_week_plan_template_items_tenant_id", table_name="week_plan_template_items")
    op.drop_table("week_plan_template_items")

    op.drop_index("ix_week_plan_templates_tenant_name", table_name="week_plan_templates")
    op.drop_index("ix_week_plan_templates_tenant_id", table_name="week_plan_templates")
    op.drop_table("week_plan_templates")

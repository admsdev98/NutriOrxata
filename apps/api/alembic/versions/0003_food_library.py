"""food library: ingredients + dish templates

Revision ID: 0003_food_library
Revises: 0002_nutrition_profiles
Create Date: 2026-02-14

"""

from alembic import op
import sqlalchemy as sa


revision = "0003_food_library"
down_revision = "0002_nutrition_profiles"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "ingredients",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("kcal_per_100g", sa.Numeric(7, 2), nullable=False),
        sa.Column("protein_g_per_100g", sa.Numeric(7, 2), nullable=False),
        sa.Column("carbs_g_per_100g", sa.Numeric(7, 2), nullable=False),
        sa.Column("fat_g_per_100g", sa.Numeric(7, 2), nullable=False),
        sa.Column("serving_size_g", sa.Numeric(7, 2), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_ingredients_tenant_id", "ingredients", ["tenant_id"])
    op.create_index("ix_ingredients_tenant_name", "ingredients", ["tenant_id", "name"])

    op.create_table(
        "dish_templates",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_dish_templates_tenant_id", "dish_templates", ["tenant_id"])
    op.create_index("ix_dish_templates_tenant_name", "dish_templates", ["tenant_id", "name"])

    op.create_table(
        "dish_template_items",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("dish_template_id", sa.Uuid(), nullable=False),
        sa.Column("ingredient_id", sa.Uuid(), nullable=False),
        sa.Column("quantity_g", sa.Numeric(8, 2), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["dish_template_id"], ["dish_templates.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["ingredient_id"], ["ingredients.id"], ondelete="RESTRICT"),
    )
    op.create_index("ix_dish_template_items_tenant_id", "dish_template_items", ["tenant_id"])
    op.create_index("ix_dish_template_items_template_id", "dish_template_items", ["dish_template_id"])
    op.create_index("ix_dish_template_items_ingredient_id", "dish_template_items", ["ingredient_id"])
    op.create_index(
        "ix_dish_template_items_tenant_ingredient_id",
        "dish_template_items",
        ["tenant_id", "ingredient_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_dish_template_items_tenant_ingredient_id", table_name="dish_template_items")
    op.drop_index("ix_dish_template_items_ingredient_id", table_name="dish_template_items")
    op.drop_index("ix_dish_template_items_template_id", table_name="dish_template_items")
    op.drop_index("ix_dish_template_items_tenant_id", table_name="dish_template_items")
    op.drop_table("dish_template_items")

    op.drop_index("ix_dish_templates_tenant_name", table_name="dish_templates")
    op.drop_index("ix_dish_templates_tenant_id", table_name="dish_templates")
    op.drop_table("dish_templates")

    op.drop_index("ix_ingredients_tenant_name", table_name="ingredients")
    op.drop_index("ix_ingredients_tenant_id", table_name="ingredients")
    op.drop_table("ingredients")

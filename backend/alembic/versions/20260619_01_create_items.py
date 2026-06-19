"""Create store items and item reviews.

Revision ID: 20260619_01
Revises: 20260607_01
"""
from typing import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260619_01"
down_revision: str | None = "20260607_01"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "items",
        sa.Column("id", sa.String(length=128), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("brand", sa.String(length=128), server_default="", nullable=False),
        sa.Column("category", sa.String(length=64), nullable=False),
        sa.Column("description", sa.Text(), server_default="", nullable=False),
        sa.Column("price", sa.Numeric(10, 2), nullable=False),
        sa.Column("original_price", sa.Numeric(10, 2), nullable=True),
        sa.Column("images", sa.JSON(), server_default="[]", nullable=False),
        sa.Column("available_sizes", sa.JSON(), server_default="[]", nullable=False),
        sa.Column("material", sa.String(length=128), server_default="", nullable=False),
        sa.Column("fit_type", sa.String(length=128), server_default="", nullable=False),
        sa.Column("gender", sa.String(length=64), server_default="", nullable=False),
        sa.Column("sport", sa.String(length=128), server_default="", nullable=False),
        sa.Column("league", sa.String(length=128), server_default="", nullable=False),
        sa.Column("team", sa.String(length=128), server_default="", nullable=False),
        sa.Column("jersey_number", sa.String(length=32), server_default="", nullable=False),
        sa.Column("specs", sa.JSON(), server_default="{}", nullable=False),
        sa.Column("stock_quantity", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("price >= 0", name="ck_items_price_non_negative"),
        sa.CheckConstraint("original_price IS NULL OR original_price >= price", name="ck_items_original_price_valid"),
        sa.CheckConstraint("stock_quantity >= 0", name="ck_items_stock_non_negative"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_items_category", "items", ["category"])

    op.create_table(
        "item_reviews",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("item_id", sa.String(length=128), nullable=False),
        sa.Column("customer_name", sa.String(length=128), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=160), server_default="", nullable=False),
        sa.Column("body", sa.Text(), server_default="", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("rating BETWEEN 1 AND 5", name="ck_item_reviews_rating_range"),
        sa.ForeignKeyConstraint(["item_id"], ["items.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_item_reviews_item_id", "item_reviews", ["item_id"])


def downgrade() -> None:
    op.drop_index("ix_item_reviews_item_id", table_name="item_reviews")
    op.drop_table("item_reviews")
    op.drop_index("ix_items_category", table_name="items")
    op.drop_table("items")

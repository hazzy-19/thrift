"""Create authenticated carts and cart items.

Revision ID: 20260607_01
Revises:
"""
from typing import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260607_01"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "carts",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=128), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_carts_user_id", "carts", ["user_id"], unique=True)
    op.create_table(
        "cart_items",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("cart_id", sa.String(length=36), nullable=False),
        sa.Column("product_id", sa.String(length=128), nullable=False),
        sa.Column("variant_id", sa.String(length=128), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("quantity > 0", name="ck_cart_item_quantity_positive"),
        sa.ForeignKeyConstraint(["cart_id"], ["carts.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("cart_id", "product_id", "variant_id", name="uq_cart_item_variant"),
    )


def downgrade() -> None:
    op.drop_table("cart_items")
    op.drop_index("ix_carts_user_id", table_name="carts")
    op.drop_table("carts")

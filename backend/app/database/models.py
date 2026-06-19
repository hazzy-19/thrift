import uuid
from datetime import datetime

from decimal import Decimal
from typing import Any

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, JSON, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Cart(Base):
    __tablename__ = "carts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(128), unique=True, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    items: Mapped[list["CartItem"]] = relationship(
        back_populates="cart", cascade="all, delete-orphan", lazy="selectin"
    )


class CartItem(Base):
    __tablename__ = "cart_items"
    __table_args__ = (
        UniqueConstraint("cart_id", "product_id", "variant_id", name="uq_cart_item_variant"),
        CheckConstraint("quantity > 0", name="ck_cart_item_quantity_positive"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    cart_id: Mapped[str] = mapped_column(ForeignKey("carts.id", ondelete="CASCADE"), nullable=False)
    product_id: Mapped[str] = mapped_column(String(128), nullable=False)
    variant_id: Mapped[str] = mapped_column(String(128), nullable=False, default="")
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    cart: Mapped[Cart] = relationship(back_populates="items")


class Item(Base):
    __tablename__ = "items"

    id: Mapped[str] = mapped_column(String(128), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    brand: Mapped[str] = mapped_column(String(128), nullable=False, default="")
    category: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    original_price: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    images: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    available_sizes: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    material: Mapped[str] = mapped_column(String(128), nullable=False, default="")
    fit_type: Mapped[str] = mapped_column(String(128), nullable=False, default="")
    gender: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    sport: Mapped[str] = mapped_column(String(128), nullable=False, default="")
    league: Mapped[str] = mapped_column(String(128), nullable=False, default="")
    team: Mapped[str] = mapped_column(String(128), nullable=False, default="")
    jersey_number: Mapped[str] = mapped_column(String(32), nullable=False, default="")
    specs: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    stock_quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    reviews: Mapped[list["ItemReview"]] = relationship(
        back_populates="item", cascade="all, delete-orphan", lazy="selectin"
    )


class ItemReview(Base):
    __tablename__ = "item_reviews"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    item_id: Mapped[str] = mapped_column(ForeignKey("items.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_name: Mapped[str] = mapped_column(String(128), nullable=False)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(160), nullable=False, default="")
    body: Mapped[str] = mapped_column(Text, nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    item: Mapped[Item] = relationship(back_populates="reviews")

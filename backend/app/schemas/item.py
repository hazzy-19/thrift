from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict


class ItemSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    brand: str
    category: str
    price: Decimal
    original_price: Decimal | None
    images: list[str]
    stock_quantity: int


class ItemReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    customer_name: str
    rating: int
    title: str
    body: str
    created_at: datetime


class ItemDetail(ItemSummary):
    description: str
    available_sizes: list[str]
    material: str
    fit_type: str
    gender: str
    sport: str
    league: str
    team: str
    jersey_number: str
    specs: dict[str, Any]
    reviews: list[ItemReviewResponse]
    suggested_items: list[ItemSummary]

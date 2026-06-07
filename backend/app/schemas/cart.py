from pydantic import BaseModel, Field, field_validator


class LocalCartItem(BaseModel):
    product_id: str = Field(min_length=1, max_length=128)
    variant_id: str = Field(default="", max_length=128)
    quantity: int = Field(ge=1, le=100)

    @field_validator("product_id", "variant_id")
    @classmethod
    def strip_identifiers(cls, value: str) -> str:
        return value.strip()

    @field_validator("product_id")
    @classmethod
    def require_product_id(cls, value: str) -> str:
        if not value:
            raise ValueError("product_id is required")
        return value


class MergeCartRequest(BaseModel):
    items: list[LocalCartItem] = Field(max_length=200)


class CartItemResponse(BaseModel):
    product_id: str
    variant_id: str
    quantity: int


class CartResponse(BaseModel):
    items: list[CartItemResponse]

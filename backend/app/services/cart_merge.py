from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models import Cart, CartItem
from app.schemas.cart import LocalCartItem


def merge_local_cart(
    *,
    authenticated_user_id: str,
    local_items: list[LocalCartItem],
    database: Session,
) -> Cart:
    """Merge browser-local cart items into the authenticated user's database cart."""
    cart = database.scalar(select(Cart).where(Cart.user_id == authenticated_user_id))

    if cart is None:
        cart = Cart(user_id=authenticated_user_id)
        database.add(cart)
        database.flush()

    existing = {(item.product_id, item.variant_id): item for item in cart.items}
    for local_item in local_items:
        key = (local_item.product_id, local_item.variant_id)
        if key in existing:
            existing[key].quantity += local_item.quantity
        else:
            item = CartItem(
                cart_id=cart.id,
                product_id=local_item.product_id,
                variant_id=local_item.variant_id,
                quantity=local_item.quantity,
            )
            database.add(item)
            cart.items.append(item)
            existing[key] = item

    database.commit()
    database.refresh(cart)
    return cart

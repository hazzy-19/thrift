from sqlalchemy import select
from sqlalchemy.orm import Session

from app.cache.guest_cart import GuestCartStore
from app.database.models import Cart, CartItem


def merge_guest_cart(
    *,
    guest_id: str,
    authenticated_user_id: str,
    database: Session,
    guest_carts: GuestCartStore,
) -> Cart:
    """Merge a Redis guest cart into the authenticated user's PostgreSQL cart."""
    guest_items = guest_carts.get(guest_id)
    cart = database.scalar(select(Cart).where(Cart.user_id == authenticated_user_id))

    if cart is None:
        cart = Cart(user_id=authenticated_user_id)
        database.add(cart)
        database.flush()

    existing = {(item.product_id, item.variant_id): item for item in cart.items}
    for guest_item in guest_items:
        key = (guest_item.product_id, guest_item.variant_id)
        if key in existing:
            existing[key].quantity += guest_item.quantity
        else:
            item = CartItem(
                cart_id=cart.id,
                product_id=guest_item.product_id,
                variant_id=guest_item.variant_id,
                quantity=guest_item.quantity,
            )
            database.add(item)
            cart.items.append(item)

    database.commit()
    guest_carts.delete(guest_id)
    return cart

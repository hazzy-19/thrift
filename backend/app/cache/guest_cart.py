import json
from dataclasses import asdict, dataclass

from redis import Redis

from app.config import get_app_settings


GUEST_CART_TTL_SECONDS = 60 * 60 * 24 * 30


@dataclass(frozen=True)
class GuestCartItem:
    product_id: str
    variant_id: str = ""
    quantity: int = 1

    def __post_init__(self) -> None:
        if not self.product_id.strip():
            raise ValueError("product_id is required.")
        if self.quantity <= 0:
            raise ValueError("quantity must be positive.")


class GuestCartStore:
    def __init__(self, redis_client: Redis | None = None) -> None:
        self.redis = redis_client or self._create_client()

    @staticmethod
    def _create_client() -> Redis:
        redis_url = get_app_settings().redis_url
        if not redis_url:
            raise RuntimeError("REDIS_URL is required before using guest carts.")
        return Redis.from_url(redis_url, decode_responses=True)

    @staticmethod
    def _key(guest_id: str) -> str:
        return f"guest-cart:{guest_id}"

    def get(self, guest_id: str) -> list[GuestCartItem]:
        raw = self.redis.get(self._key(guest_id))
        if not raw:
            return []
        return [GuestCartItem(**item) for item in json.loads(raw)]

    def save(self, guest_id: str, items: list[GuestCartItem]) -> None:
        self.redis.setex(
            self._key(guest_id),
            GUEST_CART_TTL_SECONDS,
            json.dumps([asdict(item) for item in items]),
        )

    def delete(self, guest_id: str) -> None:
        self.redis.delete(self._key(guest_id))

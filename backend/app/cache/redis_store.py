import json
from functools import lru_cache
from secrets import compare_digest
from typing import Any

from redis import Redis

from app.config import get_app_settings


@lru_cache
def get_redis_client() -> Redis | None:
    redis_url = get_app_settings().redis_url
    if not redis_url:
        return None
    return Redis.from_url(redis_url, decode_responses=True, socket_timeout=2)


class RedisTransientStore:
    """Namespaced Redis helpers for short-lived, non-cart data."""

    def __init__(self, redis_client: Redis | None = None) -> None:
        self.redis = redis_client or get_redis_client()

    def _require_redis(self) -> Redis:
        if self.redis is None:
            raise RuntimeError("REDIS_URL is required for transient Redis operations.")
        return self.redis

    def allow_request(self, key: str, limit: int, window_seconds: int) -> bool:
        redis = self._require_redis()
        namespaced_key = f"rate-limit:{key}"
        count = redis.incr(namespaced_key)
        if count == 1:
            redis.expire(namespaced_key, window_seconds)
        return count <= limit

    def save_otp(self, purpose: str, subject: str, otp: str, ttl_seconds: int = 300) -> None:
        self._require_redis().setex(f"otp:{purpose}:{subject}", ttl_seconds, otp)

    def consume_otp(self, purpose: str, subject: str, otp: str) -> bool:
        redis = self._require_redis()
        key = f"otp:{purpose}:{subject}"
        saved = redis.get(key)
        if saved is None or not compare_digest(saved, otp):
            return False
        redis.delete(key)
        return True

    def save_session(self, session_id: str, data: dict[str, Any], ttl_seconds: int) -> None:
        self._require_redis().setex(f"session:{session_id}", ttl_seconds, json.dumps(data))

    def get_session(self, session_id: str) -> dict[str, Any] | None:
        raw = self._require_redis().get(f"session:{session_id}")
        return json.loads(raw) if raw else None

    def cache_set(self, key: str, value: Any, ttl_seconds: int = 60) -> None:
        self._require_redis().setex(f"cache:{key}", ttl_seconds, json.dumps(value))

    def cache_get(self, key: str) -> Any | None:
        raw = self._require_redis().get(f"cache:{key}")
        return json.loads(raw) if raw else None

    def enqueue(self, queue_name: str, job: dict[str, Any]) -> None:
        self._require_redis().rpush(f"queue:{queue_name}", json.dumps(job))

    def dequeue(self, queue_name: str, timeout_seconds: int = 0) -> dict[str, Any] | None:
        result = self._require_redis().blpop(f"queue:{queue_name}", timeout=timeout_seconds)
        return json.loads(result[1]) if result else None

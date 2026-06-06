from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from pydantic import BaseModel
import os


WORKSPACE_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(WORKSPACE_ROOT / "server-secrets" / ".env.local")
configured_database_path = os.getenv("DATABASE_PATH", "").strip()


class Settings(BaseModel):
    telegram_bot_token: str = os.getenv("TELEGRAM_BOT_TOKEN", "")
    telegram_webhook_secret: str = os.getenv("TELEGRAM_WEBHOOK_SECRET", "")
    telegram_allowed_chat_ids: frozenset[int] = frozenset(
        int(chat_id.strip())
        for chat_id in os.getenv("TELEGRAM_ALLOWED_CHAT_IDS", "").split(",")
        if chat_id.strip()
    )
    frontend_origins: tuple[str, ...] = tuple(
        origin.strip()
        for origin in os.getenv("FRONTEND_ORIGINS", "http://localhost:5173").split(",")
        if origin.strip()
    )
    database_path: Path = Path(
        configured_database_path or WORKSPACE_ROOT / "backend" / "data" / "announcements.db"
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()

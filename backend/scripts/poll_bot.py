import asyncio
import sys
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.config import get_settings  # noqa: E402
from app.database import initialize_database  # noqa: E402
from app.models import TelegramUpdate  # noqa: E402
from app.telegram import process_telegram_update  # noqa: E402


async def poll_bot() -> None:
    settings = get_settings()
    if not settings.telegram_bot_token:
        raise RuntimeError("Set TELEGRAM_BOT_TOKEN first.")
    initialize_database()
    updates_url = f"https://api.telegram.org/bot{settings.telegram_bot_token}/getUpdates"
    offset = 0

    async with httpx.AsyncClient(timeout=40) as client:
        print("Telegram polling started. Press Ctrl+C to stop.")
        while True:
            response = await client.get(
                updates_url,
                params={"timeout": 30, "offset": offset, "allowed_updates": '["message"]'},
            )
            response.raise_for_status()

            for raw_update in response.json()["result"]:
                offset = raw_update["update_id"] + 1
                try:
                    process_telegram_update(
                        TelegramUpdate.model_validate(raw_update),
                        settings.telegram_allowed_chat_ids,
                    )
                except (PermissionError, ValueError) as error:
                    print(f"Ignored update {raw_update['update_id']}: {error}")


if __name__ == "__main__":
    try:
        asyncio.run(poll_bot())
    except KeyboardInterrupt:
        print("Telegram polling stopped.")

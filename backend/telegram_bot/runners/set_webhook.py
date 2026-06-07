import argparse
import asyncio

import httpx

from telegram_bot.config import get_settings


async def set_webhook(base_url: str) -> None:
    settings = get_settings()
    if not settings.telegram_bot_token or not settings.telegram_webhook_secret:
        raise RuntimeError("Set TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET first.")

    webhook_url = f"{base_url.rstrip('/')}/api/telegram/webhook"
    telegram_url = f"https://api.telegram.org/bot{settings.telegram_bot_token}/setWebhook"

    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.post(
            telegram_url,
            json={
                "url": webhook_url,
                "secret_token": settings.telegram_webhook_secret,
                "allowed_updates": ["message", "callback_query"],
                "drop_pending_updates": False,
            },
        )
        response.raise_for_status()
        print(response.json())


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("base_url", help="Public HTTPS backend URL")
    arguments = parser.parse_args()
    asyncio.run(set_webhook(arguments.base_url))

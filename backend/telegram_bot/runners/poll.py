import asyncio

from telegram_bot.bot import TelegramBot
from telegram_bot.config import get_settings
from telegram_bot.database import initialize_database


async def main() -> None:
    settings = get_settings()
    if not settings.telegram_bot_token:
        raise RuntimeError("Set TELEGRAM_BOT_TOKEN first.")

    initialize_database()
    bot = TelegramBot(settings.telegram_bot_token, settings.telegram_allowed_chat_ids)
    try:
        await bot.poll_forever()
    finally:
        await bot.close()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Telegram polling stopped.")

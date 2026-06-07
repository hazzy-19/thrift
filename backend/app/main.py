import asyncio
import logging
from contextlib import asynccontextmanager
from secrets import compare_digest

from fastapi import FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_app_settings
from telegram_bot.bot import TelegramBot
from telegram_bot.config import get_settings
from telegram_bot.database import initialize_database, list_announcements
from telegram_bot.models import AnnouncementsResponse, TelegramUpdate


logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)
settings = get_settings()
app_settings = get_app_settings()
telegram_bot: TelegramBot | None = None


@asynccontextmanager
async def lifespan(_: FastAPI):
    global telegram_bot
    initialize_database()
    polling_task: asyncio.Task[None] | None = None

    if settings.telegram_bot_token:
        telegram_bot = TelegramBot(settings.telegram_bot_token, settings.telegram_allowed_chat_ids)
        if settings.telegram_webhook_url:
            if not settings.telegram_webhook_secret:
                raise RuntimeError("TELEGRAM_WEBHOOK_SECRET is required in webhook mode.")
            await telegram_bot.set_webhook(
                f"{settings.telegram_webhook_url.rstrip('/')}/api/telegram/webhook",
                settings.telegram_webhook_secret,
            )
            logger.info("Telegram bot running in webhook mode")
        else:
            polling_task = asyncio.create_task(telegram_bot.poll_forever())
    else:
        logger.warning("TELEGRAM_BOT_TOKEN is empty; Telegram bot is disabled.")

    yield

    if polling_task:
        polling_task.cancel()
        await asyncio.gather(polling_task, return_exceptions=True)
    if telegram_bot:
        await telegram_bot.close()


app = FastAPI(title="Thrifter API", version="0.2.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(app_settings.frontend_origins),
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-Telegram-Bot-Api-Secret-Token"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/announcements", response_model=AnnouncementsResponse)
def announcements() -> dict[str, list[dict[str, object]]]:
    active = list_announcements(active_only=True)
    return {
        "announcements": [
            {"id": item["id"], "text": item["text"], "createdAt": item["createdAt"]}
            for item in active
        ]
    }


@app.post("/api/telegram/webhook", status_code=status.HTTP_204_NO_CONTENT)
async def telegram_webhook(
    update: TelegramUpdate,
    x_telegram_bot_api_secret_token: str = Header(default=""),
) -> None:
    if not settings.telegram_webhook_url or telegram_bot is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Webhook mode is disabled")
    if not settings.telegram_webhook_secret or not compare_digest(
        x_telegram_bot_api_secret_token,
        settings.telegram_webhook_secret,
    ):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid webhook secret")
    await telegram_bot.handle_update(update)

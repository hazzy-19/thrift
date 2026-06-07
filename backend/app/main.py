import asyncio
import logging
from contextlib import asynccontextmanager
from secrets import compare_digest

from fastapi import Depends, FastAPI, Header, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from redis.exceptions import RedisError
from sqlalchemy.orm import Session

from app.auth import get_authenticated_user_id
from app.cache.redis_store import RedisTransientStore
from app.config import get_app_settings
from app.dependencies import get_database
from app.schemas.cart import CartResponse, MergeCartRequest
from app.services.cart_merge import merge_local_cart
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
    allow_headers=["Authorization", "Content-Type", "X-Telegram-Bot-Api-Secret-Token"],
)


@app.middleware("http")
async def redis_rate_limit(request: Request, call_next):
    if app_settings.redis_url:
        client_ip = request.client.host if request.client else "unknown"
        try:
            allowed = RedisTransientStore().allow_request(
                client_ip,
                app_settings.rate_limit_requests,
                app_settings.rate_limit_window_seconds,
            )
            if not allowed:
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={"detail": "Too many requests"},
                )
        except RedisError:
            logger.exception("Redis rate limiter unavailable; allowing request")
    return await call_next(request)


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


@app.post("/api/cart/merge", response_model=CartResponse)
def merge_cart(
    payload: MergeCartRequest,
    authenticated_user_id: str = Depends(get_authenticated_user_id),
    database: Session = Depends(get_database),
) -> CartResponse:
    cart = merge_local_cart(
        authenticated_user_id=authenticated_user_id,
        local_items=payload.items,
        database=database,
    )
    return CartResponse(
        items=[
            {
                "product_id": item.product_id,
                "variant_id": item.variant_id,
                "quantity": item.quantity,
            }
            for item in cart.items
        ]
    )


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

from contextlib import asynccontextmanager
from secrets import compare_digest

from fastapi import FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .database import get_current_announcement, initialize_database
from .models import CurrentAnnouncementResponse, TelegramUpdate
from .telegram import process_telegram_update


@asynccontextmanager
async def lifespan(_: FastAPI):
    initialize_database()
    yield


settings = get_settings()
app = FastAPI(title="Thrifter API", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.frontend_origins),
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-Telegram-Bot-Api-Secret-Token"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/announcements/current", response_model=CurrentAnnouncementResponse)
def current_announcement() -> dict[str, dict[str, str] | None]:
    return {"announcement": get_current_announcement()}


@app.post("/api/telegram/webhook", status_code=status.HTTP_204_NO_CONTENT)
def telegram_webhook(
    update: TelegramUpdate,
    x_telegram_bot_api_secret_token: str = Header(default=""),
) -> None:
    if not settings.telegram_webhook_secret or not compare_digest(
        x_telegram_bot_api_secret_token,
        settings.telegram_webhook_secret,
    ):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid webhook secret")

    try:
        process_telegram_update(update, settings.telegram_allowed_chat_ids)
    except PermissionError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error)) from error

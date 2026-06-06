from collections.abc import Collection

from .database import clear_announcement, save_announcement
from .models import TelegramUpdate


def process_telegram_update(update: TelegramUpdate, allowed_chat_ids: Collection[int]) -> None:
    message = update.message
    if message is None or (message.from_user is not None and message.from_user.is_bot) or not message.text:
        return

    if allowed_chat_ids and message.chat.id not in allowed_chat_ids:
        raise PermissionError("Chat is not allowed")

    text = message.text.strip()
    if text == "/clear":
        clear_announcement()
        return

    if text.startswith("/"):
        return

    if len(text) > 240:
        raise ValueError("Message is too long")

    save_announcement(text, message.chat.id)

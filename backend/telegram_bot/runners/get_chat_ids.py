import asyncio

import httpx

from telegram_bot.config import get_settings


async def get_chat_ids() -> None:
    token = get_settings().telegram_bot_token
    if not token:
        raise RuntimeError("Set TELEGRAM_BOT_TOKEN first.")

    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.get(f"https://api.telegram.org/bot{token}/getUpdates")
        response.raise_for_status()

    chats: dict[int, str] = {}
    for update in response.json()["result"]:
        message = update.get("message")
        if not message:
            continue
        chat = message["chat"]
        chats[chat["id"]] = chat.get("title") or chat.get("username") or chat.get("first_name") or "Unnamed chat"

    if not chats:
        print("No chats found. Send the bot a message, then run this command again.")
        return

    for chat_id, name in chats.items():
        print(f"{chat_id}: {name}")


if __name__ == "__main__":
    asyncio.run(get_chat_ids())

# Thrifter Backend

FastAPI service for storefront APIs and Telegram-powered announcements.

## Setup

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

The API runs at `http://localhost:8000`.

## Telegram Setup

1. Revoke any token that has been shared.
2. Add the replacement values to `../server-secrets/.env.local`.
3. Send the bot a message, then find your chat ID:

```powershell
.\.venv\Scripts\python.exe scripts\get_chat_ids.py
```

4. Optionally add approved IDs to `TELEGRAM_ALLOWED_CHAT_IDS`. Leave it empty
   during local development to accept messages from any chat.
5. For production, generate a long random `TELEGRAM_WEBHOOK_SECRET`.
6. Deploy the backend to a public HTTPS URL.
7. Register the webhook:

```powershell
.\.venv\Scripts\python.exe scripts\set_webhook.py https://api.example.com
```

Plain text messages from approved chats become the current announcement.
Send `/clear` to remove it. Messages longer than 240 characters are rejected.

For local development, run polling instead of registering a webhook:

```powershell
.\.venv\Scripts\python.exe scripts\poll_bot.py
```

Do not run polling while a webhook is active.

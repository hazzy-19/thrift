# Thrifter Backend

FastAPI API and Telegram announcement manager.

All Telegram announcement code, models, storage, utilities, and detailed
documentation live in `telegram_bot/`. The general FastAPI entrypoint remains
in `app/main.py`.

## Environment

Configure `../server-secrets/.env.local`:

```env
TELEGRAM_BOT_TOKEN=
TELEGRAM_ALLOWED_CHAT_IDS=
TELEGRAM_WEBHOOK_SECRET=
TELEGRAM_WEBHOOK_URL=
FRONTEND_ORIGINS=http://localhost:5173
DATABASE_PATH=
DATABASE_URL=postgresql+psycopg://postgres:password@localhost:5432/thrifter
REDIS_URL=redis://localhost:6379/0
```

- `TELEGRAM_ALLOWED_CHAT_IDS` is required for announcement changes. With an
  empty list, all changes are blocked and only `/whoami` works.
- Leave `TELEGRAM_WEBHOOK_URL` empty locally. FastAPI automatically starts
  polling.
- Set `TELEGRAM_WEBHOOK_URL` to the public HTTPS backend URL in production.
  FastAPI automatically registers and uses the webhook.
- `TELEGRAM_WEBHOOK_SECRET` is required in webhook mode.

## Run Locally

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

The single Uvicorn command runs both the API and Telegram polling locally.

For WebStorm, select this project interpreter:

```text
backend\.venv\Scripts\python.exe
```

Send `/whoami` to the bot, then copy the returned chat or user ID into:

```env
TELEGRAM_ALLOWED_CHAT_IDS=123456789
```

Restart Uvicorn after changing environment values.

## Bot Commands

```text
/add <message>
/list
/delete <id>
/enable <id>
/disable <id>
/clear
/help
/whoami
```

Normal text from an allowed admin creates an announcement. `/list` includes
inline buttons for enabling, disabling, previewing, and deleting records.

## API

```text
GET /health
GET /api/announcements
POST /api/telegram/webhook
```

`GET /api/announcements` returns active announcements newest first.

Detailed bot documentation is in `telegram_bot/TELEGRAM_BOT_GUIDE.txt`.

## PostgreSQL, Redis, and Alembic

- PostgreSQL stores authenticated customer carts.
- Redis temporarily stores guest carts before authentication.
- `app/services/cart_merge.py` transactionally merges a Redis guest cart into
  the authenticated user's PostgreSQL cart, then clears the guest cache.
- The merge service must only be called after a backend-verified Firebase ID
  token identifies the customer. No public merge endpoint is exposed yet.

After setting `DATABASE_URL`, apply migrations from the backend folder:

```powershell
.\.venv\Scripts\python.exe -m alembic upgrade head
```

Create future migrations after changing SQLAlchemy models:

```powershell
.\.venv\Scripts\python.exe -m alembic revision --autogenerate -m "describe change"
```

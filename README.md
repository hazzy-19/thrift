# Thrifter

## Local Development

Start the backend:

```powershell
cd backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

Start the frontend in another terminal:

```powershell
cd frontend
npm.cmd run dev
```

Vite proxies frontend `/api` requests to `http://localhost:8000`.

## Telegram Announcements

Server secrets belong in `server-secrets/.env.local`. Revoke any bot token that
has been shared before configuring the backend.

FastAPI automatically runs the bot in polling mode locally when
`TELEGRAM_WEBHOOK_URL` is empty. Send `/whoami` to discover your ID, add it to
`TELEGRAM_ALLOWED_CHAT_IDS`, then restart FastAPI.

Approved admins can add, list, enable, disable, preview, and delete persistent
announcements. The navbar rotates active announcements every five seconds.

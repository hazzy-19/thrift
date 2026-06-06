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

For local bot development:

```powershell
cd backend
.\.venv\Scripts\python.exe scripts\poll_bot.py
```

Approved plain-text Telegram messages become the navbar announcement. Send
`/clear` to remove the current announcement.

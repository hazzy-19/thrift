# Jersey World

Jersey World is a sportswear commerce app built with a Vite React frontend,
Tailwind CSS, local shadcn-style UI primitives, a FastAPI backend, PostgreSQL,
Firebase authentication, Redis rate limiting, and a Telegram announcement bot.

The project was rebranded from a legacy apparel catalog. Current storefront copy,
empty states, auth defaults, metadata, cart storage keys, and API titles now use
Jersey World wording.

## Current Features

- Sportswear storefront with home, category, cart, wishlist, account, and login
  pages.
- DB-backed item listing through `GET /api/items`.
- Full item detail page at `/items/:id` with gallery navigation, size selector,
  quantity selector, add-to-cart, save button, stock status, description, specs,
  shipping and returns accordion, reviews, ratings, and same-category
  suggestions.
- Reusable product card used by grids and suggestions.
- Authenticated cart merge with PostgreSQL storage.
- Telegram-powered active announcements in the navbar.
- Redis-backed request rate limiting when `REDIS_URL` is configured.

## Local Development

Install backend dependencies and apply migrations:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m alembic upgrade head
```

Start the backend:

```powershell
cd backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

Start the frontend in another terminal:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Vite proxies frontend `/api` requests to `http://localhost:8000`.

## Environment

Server secrets belong in `server-secrets/.env.local`. Revoke any bot token or
credential that has been shared before configuring the backend.

Key backend values:

```env
FRONTEND_ORIGINS=http://localhost:5173
DATABASE_URL=postgresql+psycopg://postgres:password@localhost:5432/jersey_world
REDIS_URL=redis://localhost:6379/0
FIREBASE_PROJECT_ID=
FIREBASE_SERVICE_ACCOUNT_PATH=server-secrets/firebase-service-account.json
TELEGRAM_BOT_TOKEN=
TELEGRAM_ALLOWED_CHAT_IDS=
TELEGRAM_WEBHOOK_SECRET=
TELEGRAM_WEBHOOK_URL=
```

Key frontend value:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## Database

The backend expects these PostgreSQL tables to exist:

- `carts`
- `cart_items`
- `items`
- `item_reviews`
- `alembic_version`

Run migrations from the backend folder before starting FastAPI:

```powershell
.\.venv\Scripts\python.exe -m alembic upgrade head
```

Startup validates the configured schema and fails immediately when required
tables are missing.

## API

```text
GET /health
GET /api/announcements
GET /api/items
GET /api/items/{item_id}
POST /api/cart/merge
POST /api/telegram/webhook
```

`GET /api/items` accepts optional `category` and `query` parameters.
`GET /api/items/{item_id}` returns the item, reviews, and same-category
suggestions.

## Mock Data Policy

Hardcoded legacy product arrays have been cleared. The storefront now depends on
real rows in PostgreSQL. An empty database intentionally renders empty product
states instead of fallback mock products.

## Telegram Announcements

FastAPI automatically runs the bot in polling mode locally when
`TELEGRAM_WEBHOOK_URL` is empty. Send `/whoami` to discover your ID, add it to
`TELEGRAM_ALLOWED_CHAT_IDS`, then restart FastAPI.

Approved admins can add, list, enable, disable, preview, and delete persistent
announcements. Detailed bot documentation is in
`backend/telegram_bot/TELEGRAM_BOT_GUIDE.txt`.

## Verification

Frontend build:

```powershell
cd frontend
npm.cmd run build
```

Backend syntax check:

```powershell
cd backend
.\.venv\Scripts\python.exe -m compileall app
```

## Not Done Yet

- No production item seed/import workflow has been added; real Jersey World
  products must be inserted into PostgreSQL separately.
- No admin product management UI exists yet.
- Wishlist save state is local to the item page UI and is not persisted.
- Cart page still displays product and variant IDs, not full item names/images.
- Reviews are read-only; customers cannot submit ratings from the storefront.
- The repository name and remote still reference the previous project name.

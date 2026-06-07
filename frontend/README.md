# Thrifter Frontend

React, TypeScript, Vite, and Tailwind CSS storefront frontend.

## Run Locally

```bash
npm install
npm run dev
```

Production checks:

```bash
npm run lint
npm run build
```

## Project Structure

```text
src/
  components/   Reusable UI components
  pages/        Route-level page components
  assets/       Images and static assets
  context/      Shared React state
```

## Brand Palette

The project palette is based on the supplied Rose Pine reference.

| Token | Hex | Usage |
| --- | --- | --- |
| Rose | `#BE7880` | Brand accents and highlights |
| Pine | `#102C20` | Primary text and dark surfaces |
| Wine | `#4D0012` | Strong accents and calls to action |
| Pink | `#FFD8D9` | Soft backgrounds and borders |

These colors are available in Tailwind as `brand-rose`, `pine`, `wine`, and
`brand-pink`.

## Typography

- **Manrope**: body copy, controls, navigation, and other interface text.
- **Playfair Display**: brand name and page headings.

Both font families are installed through `@fontsource`, so production does not
depend on requests to Google's font servers.

## Telegram Announcements

The FastAPI backend receives approved Telegram commands and exposes active
announcements through `/api/announcements`. The navbar refreshes them every 30
seconds and rotates messages every five seconds. The frontend never connects
directly to Telegram.

## Authentication

The sign-in page uses one **Continue with Google** action for both registration
and returning-user sign-in. Firebase Authentication persists the session,
updates the navbar account state, and provides sign-out from the account page.

Firebase setup:

1. Create a Firebase project and web app.
2. Enable Google under **Authentication > Sign-in method**.
3. Add localhost and production hosts under **Authentication > Settings >
   Authorized domains**.
4. Copy `.env.example` to `.env.local` and enter the Firebase web app values.

Firebase web configuration uses `VITE_` variables because the browser requires
those values. Firebase Security Rules and authorized domains provide the actual
access control.

## Environment Secrets

`.env.local` is ignored by Git and is ready for local configuration.

- Firebase web values use the `VITE_FIREBASE_*` prefix.
- Telegram bot tokens belong in `server-secrets/.env.local`, never inside the
  frontend directory.
- Firebase service-account JSON files belong only in a backend secret manager or
  ignored server-only directory. They must never be imported by frontend code.

If a service-account key is ever placed in the frontend directory or shared,
delete that key in **Google Cloud Console > IAM & Admin > Service Accounts >
Keys**, then create a replacement only when the backend needs one.

If a Telegram bot token is shared, revoke it with BotFather immediately and put
only the replacement token in `server-secrets/.env.local`.

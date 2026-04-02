# Buyer portal

Small full-stack demo for a real-estate broker: buyers register, log in, and save property **favourites**. The API uses **SQLite**, **bcrypt** for password hashing, and **JWT** stored in an **httpOnly cookie**.

The UI is a **React** SPA styled with **[shadcn/ui](https://ui.shadcn.com/)** (Tailwind CSS v4, Base UI primitives, Geist font), built with Vite.

## Requirements

- [Node.js](https://nodejs.org/) 18+ (Node **20.19+** recommended; the client pins **Vite 5** so older 20.x can still run the build—see `client/package.json`)

## Install

From the project root:

```bash
cd "simple buyer portal"
npm install
cd client
npm install
cd ..
```

## Production-style run (API + built SPA)

Build the client, then start the server. Express serves `client/dist` when `client/dist/index.html` exists; otherwise it serves a short fallback page from `public/`.

```bash
npm run build:client
npm start
```

Open [http://localhost:3000](http://localhost:3000). Routes: `/`, `/login`, `/dashboard`.

Optional: copy `.env.example` to `.env` and set `JWT_SECRET` for non-demo use.

## Local development (hot reload)

Run the API and the Vite dev server in **two terminals** (Vite proxies `/api` to port 3000 so cookies stay on the dev origin).

**Terminal 1 — API**

```bash
npm run dev
```

**Terminal 2 — UI**

```bash
cd client
npm run dev
```

Open the URL Vite prints (e.g. [http://localhost:5173](http://localhost:5173)).

## Project layout

- `server/` — Express API, auth middleware, SQLite access
- `client/` — React app, shadcn components, Vite config
- `client/dist/` — Production build output (after `npm run build:client`)
- `public/` — Fallback static page if the SPA has not been built
- `data/portal.db` — Created on first run (gitignored)

## API overview

| Method | Path | Notes |
|--------|------|--------|
| POST | `/api/auth/register` | Body: `name`, `email`, `password` (min 8 chars). Sets auth cookie. |
| POST | `/api/auth/login` | Body: `email`, `password`. Sets auth cookie. |
| POST | `/api/auth/logout` | Clears cookie. |
| GET | `/api/auth/me` | Current user (requires cookie). |
| GET | `/api/properties` | Seeded listings (public). |
| GET | `/api/favourites` | Current user’s favourites only. |
| POST | `/api/favourites` | Body: `propertyId`. Adds favourite for current user. |
| DELETE | `/api/favourites/:favouriteId` | Removes favourite **only if it belongs to** the current user. |

Validation errors return `400` with `{ "error": "..." }`. Wrong credentials return `401`.

## Example flows

1. **Sign up → dashboard**  
   Open `/login`, use the **Register** tab, enter name, email, and password (8+ characters). Submit — you are redirected to `/dashboard` with your name and role shown.

2. **Log in**  
   Use **Log in** with the same email and password. The session cookie is sent automatically on later requests.

3. **Add a favourite**  
   On the dashboard, under **Browse properties**, click **Add to favourites**. A success alert appears and the listing appears under **My favourites**.

4. **Remove a favourite**  
   Click **Remove** on a favourite row, or click **Saved** on a property to toggle it off. Other users never see or change your rows: favourites are scoped by `user_id` on the server.

5. **Log out**  
   Click **Log out**; the cookie is cleared and you can log in again.

## Security notes

- Passwords are stored as **bcrypt** hashes only.  
- JWT is **httpOnly** and **SameSite=lax** (and `secure` in production).  
- For production, set a strong `JWT_SECRET`, serve over HTTPS, and consider rate limiting on auth routes.

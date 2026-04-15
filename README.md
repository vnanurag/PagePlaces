# PagePlaces

Track your books and the places they've been — where you bought them, received them, or read them — on an interactive map.

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS v4** + **shadcn/ui**
- **Prisma 6** + **PostgreSQL** (Supabase / Neon)
- **NextAuth.js v5** — credentials-based auth
- **Leaflet** + **react-leaflet** — interactive map
- **Google Books API** — book/author search

---

## Prerequisites

- Node.js 18+
- A PostgreSQL database — [Supabase](https://supabase.com) or [Neon](https://neon.tech) (both have generous free tiers)
- A [Google Books API key](https://console.cloud.google.com)

---

## Local Development

### 1. Clone and install

```bash
git clone https://github.com/your-username/pageplaces.git
cd pageplaces
npm install
```

> `postinstall` automatically runs `prisma generate` to build the typed client.

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in every value — see [Environment Variables](#environment-variables) below.

### 3. Run database migrations

```bash
npm run db:migrate:dev
```

This creates the `prisma/migrations/` folder and applies the full schema to your database.

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | **Pooled** connection string — used by Prisma Client at runtime |
| `DIRECT_URL` | ✅ | **Direct** (non-pooled) connection string — used by `prisma migrate` |
| `AUTH_SECRET` | ✅ | Random secret for NextAuth.js — generate with `openssl rand -base64 32` |
| `AUTH_URL` | ✅ prod | `http://localhost:3000` locally; your full domain on Vercel |
| `GOOGLE_BOOKS_API_KEY` | ✅ | From Google Cloud Console → APIs & Services → Credentials |

> **Why two database URLs?** Neon and Supabase route runtime queries through a connection pooler (PgBouncer) that doesn't support the DDL statements Prisma migrations need. `DIRECT_URL` bypasses the pooler so migrations can run.

---

## Database Setup

### Option A — Neon

1. Create a free project at [neon.tech](https://neon.tech).
2. In the dashboard, open **Connection Details**.
3. Copy the **pooled** connection string (toggle "Pooled connection" ON) → `DATABASE_URL`.
4. Copy the **direct** connection string (toggle OFF) → `DIRECT_URL`.

```
# .env.local
DATABASE_URL="postgresql://[user]:[pw]@[host]-pooler.neon.tech/[db]?sslmode=require&pgbouncer=true&connect_timeout=15"
DIRECT_URL="postgresql://[user]:[pw]@[host].neon.tech/[db]?sslmode=require"
```

### Option B — Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **Settings → Database → Connection string**.
3. Select **Transaction mode** (port 6543) → `DATABASE_URL`.
4. Select **Direct connection** (port 5432) → `DIRECT_URL`.

```
# .env.local
DATABASE_URL="postgresql://postgres.[ref]:[pw]@aws-0-[region].pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://postgres.[ref]:[pw]@db.[ref].supabase.co:5432/postgres"
```

---

## Deploying to Vercel

### 1. Push your code to GitHub

```bash
git add .
git commit -m "initial commit"
git push
```

### 2. Import the project on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import your GitHub repository.
2. Vercel auto-detects Next.js — no framework config changes needed.
3. Leave the **Build Command** as the default (`next build`).  
   Prisma Client is regenerated automatically via `postinstall` on every deploy.

### 3. Set environment variables

In the Vercel project dashboard → **Settings → Environment Variables**, add:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your pooled connection string |
| `DIRECT_URL` | Your direct connection string |
| `AUTH_SECRET` | Output of `openssl rand -base64 32` |
| `AUTH_URL` | `https://your-app.vercel.app` (your actual domain) |
| `GOOGLE_BOOKS_API_KEY` | Your Google Books API key |

> Set all variables for **Production**, **Preview**, and **Development** environments.

### 4. Run the initial migration

Migrations are **not** run automatically on deploy. Run them once manually (and after every schema change):

```bash
# From your local machine with DIRECT_URL set in .env.local
npm run db:migrate:deploy
```

Or add it as a one-off Vercel build step by overriding the build command in the dashboard:

```
npm run db:migrate:deploy && next build
```

### 5. Deploy

Click **Deploy** (or push a new commit). Vercel will:
1. Run `npm install` → triggers `postinstall` → runs `prisma generate`
2. Run `next build`
3. Serve the app

---

## Running Migrations in Production

| When | Command | How |
|---|---|---|
| First deploy | `npm run db:migrate:deploy` | Run locally against production `DIRECT_URL` |
| Schema change | `npm run db:migrate:dev` locally → commit migration files → `npm run db:migrate:deploy` against production | Always test locally first |
| Rollback | Restore DB from Supabase/Neon point-in-time backup | Prisma has no built-in rollback |

> **Never** run `db:migrate:dev` or `db:push` against a production database — `migrate dev` can reset data.

---

## Database Scripts

| Script | Description |
|---|---|
| `npm run db:generate` | Regenerate Prisma client after schema changes |
| `npm run db:migrate:dev` | Create a new migration and apply it (development only) |
| `npm run db:migrate:deploy` | Apply pending migrations (production / CI) |
| `npm run db:push` | Push schema without a migration file (prototyping only) |
| `npm run db:studio` | Open Prisma Studio to browse data |
| `npm run db:reset` | Drop and recreate the database (destructive — dev only) |

---

## API Routes

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create account |
| `GET` | `/api/books` | List user's saved books |
| `POST` | `/api/books` | Save a book to the collection |
| `GET/PUT/DELETE` | `/api/books/[id]` | Single book CRUD |
| `GET/POST` | `/api/books/[id]/locations` | List / add locations for a book |
| `PATCH/DELETE` | `/api/books/[id]/locations/[locationId]` | Update / remove a location |
| `GET` | `/api/google-books/search?q=` | Search Google Books |
| `GET` | `/api/google-books/authors?q=` | Search authors via Google Books |
| `GET` | `/api/map` | All map markers for the current user |

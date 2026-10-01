# Tourism Backend

REST API for the Africa tourism platform (Cameroon first). It serves attractions, nearby hotels/restaurants/guides, map points and tracked booking links to the [frontend](https://github.com/munjemunjegiovani-crypto/tourism-frontend).

**Stack:** Node.js 20+ · Express 5 · TypeScript · Drizzle ORM · PostgreSQL + PostGIS (Neon) · Zod

## Run it locally (Ubuntu)

### 1. Install Node.js 20+ (skip if `node -v` already shows 20 or higher)

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Get a database

**Option A — Neon (recommended, nothing to install)**

1. Create a free project at [neon.tech](https://neon.tech).
2. Copy the connection string from the dashboard (it ends with `?sslmode=require`).

**Option B — Local Postgres with PostGIS**

```bash
sudo apt-get install -y postgresql postgresql-16-postgis-3
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';" -c "CREATE DATABASE tourism;"
```

### 3. Install, configure, migrate, seed

```bash
git clone https://github.com/munjemunjegiovani-crypto/tourism-backend.git
cd tourism-backend
npm install
cp .env.example .env      # then open .env and set DATABASE_URL
npm run db:migrate        # creates PostGIS + all tables
npm run db:seed           # adds Cameroon regions, attractions and demo businesses
npm run dev               # API on http://localhost:4000
```

Check it works: open <http://localhost:4000/health> and <http://localhost:4000/api/v1/attractions>.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the API with auto-reload |
| `npm run build` / `npm start` | Compile to `dist/` and run the compiled server (production) |
| `npm run typecheck` | Check types without building |
| `npm run db:generate` | Create a new migration after editing `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations to the database in `DATABASE_URL` |
| `npm run db:seed` | Insert/refresh development data (safe to run again) |
| `npm run db:studio` | Browse the database in your browser |

## API (v1)

All responses are JSON. Lists return `{ data, nextCursor }`; pass `?cursor=<nextCursor>` for the next page. Errors return `{ error: { code, message } }`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/health` | API and database status |
| GET | `/api/v1/countries` | Countries |
| GET | `/api/v1/countries/:slug/regions` | Regions of a country |
| GET | `/api/v1/regions/:slug/cities` | Cities of a region |
| GET | `/api/v1/categories?type=attraction\|business` | Categories |
| GET | `/api/v1/attractions?country=&region=&city=&category=&q=&limit=&cursor=` | List and filter attractions |
| GET | `/api/v1/attractions/:slug` | Attraction details |
| GET | `/api/v1/attractions/:slug/nearby?type=hotel&radius=10000` | Businesses near an attraction (sponsored first, then closest) |
| GET | `/api/v1/businesses?country=&region=&city=&category=&q=` | List and filter businesses |
| GET | `/api/v1/businesses/:slug` | Business details |
| GET | `/api/v1/map?bbox=minLng,minLat,maxLng,maxLat` | Points inside the visible map area |
| GET | `/api/v1/go/:slug?src=` | Logs the click, then redirects to the booking/affiliate link |

Example: `GET /api/v1/attractions/lobe-falls/nearby?type=hotel&radius=3000`

## Project structure

```
src/
  index.ts              starts the server
  app.ts                Express setup: security headers, CORS, rate limits, routes
  config/env.ts         reads and validates .env
  db/schema.ts          database tables (edit here, then npm run db:generate)
  db/client.ts          database connection
  db/seed.ts            development data
  routes/               one file per group of endpoints
  middleware/errors.ts  404 and error responses
  lib/                  validation and error helpers
drizzle/                SQL migrations (generated — commit them)
```

## Deploy (Render)

1. On [render.com](https://render.com): **New → Web Service** → connect this repo.
2. Build command: `npm install && npm run build` · Start command: `npm start`.
3. Environment variables: `DATABASE_URL` (Neon), `CORS_ORIGIN` (your Vercel frontend URL), `IP_HASH_SALT`, `NODE_ENV=production`.
4. Run migrations once against Neon from your laptop: set `DATABASE_URL` in `.env` to the Neon URL and run `npm run db:migrate`.

## Notes

- Businesses in the seed are **fictional demo listings** (names start with "Demo"). Attraction coordinates are approximate. Check both before launch.
- Coming next: user accounts and auth, reviews, owner claims and dashboard, tours and Mobile Money/Stripe payments.

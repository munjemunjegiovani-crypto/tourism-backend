# Africa Discover API (tourism-backend)

The backend for **Africa Discover**, the tourism discovery platform. It's a REST API in Node.js, Express and TypeScript, backed by **PostgreSQL** with the **PostGIS** extension for "near me" and map queries.

The website lives in a separate repo, [`tourism-frontend`](../tourism-frontend). It only talks to this API.

## What's inside

- **Catalog:** 26 countries (11 with full travel guides), 108 cities, 93 destinations, 10 categories, 13 activities, 12 experiences and 13 travel-guide articles.
- **Places:** 17 real airports and 9 real markets (shown without ratings), plus clearly marked *demo* hotels and restaurants near popular destinations.
- **Search:** understands phrases like "waterfalls near Douala", "beaches in Cameroon" and "things to do in Nairobi". It also powers the search-box suggestions.
- **Geo:** nearby destinations, distances and map points (PostGIS `ST_DWithin` / `ST_Distance`).
- **Accounts:** sign-up and login with scrypt password hashes and hashed session tokens; profile, favorites ("saved" and "visited"), trips with stops and route summary, and reviews.
- **Money:** `/go/:slug` logs a click and redirects to a partner's booking link (affiliate-ready).

Seeded reviews are marked `isSample`. Demo places are marked `isDemo`. The website labels both.

## Run it locally

You need Node 22+ and PostgreSQL 14+ with PostGIS. On Ubuntu:

```bash
sudo apt install postgresql postgis
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
sudo -u postgres createdb tourism
```

Then:

```bash
cp .env.example .env      # adjust DATABASE_URL if needed
npm install
npm run db:reset          # drops and recreates the schema, migrates, seeds
npm run db:images         # optional, needs internet: fetches destination photos + credits from Wikimedia Commons
npm run dev               # http://localhost:4000
```

Check it works: `curl localhost:4000/health` should return `{"status":"ok","database":"ok"}`.

> Upgrading from the earlier Kamer Trails version? Run `npm run db:reset` once. The schema changed completely.

### Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start with auto-reload |
| `npm run build` / `npm start` | Compile to `dist/` and run it |
| `npm run typecheck` | TypeScript check |
| `npm run db:generate` | Create a migration after editing `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Insert or update the catalog (keeps users, favorites and trips) |
| `npm run db:reset` | Drop everything, migrate and seed. Refuses to run in production |
| `npm run db:images` | Look up photos on Wikimedia Commons for destinations without one |
| `npm run db:studio` | Browse the database in Drizzle Studio |

### Environment

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string (Neon works; keep `?sslmode=require`) |
| `PORT` | API port (default 4000) |
| `CORS_ORIGIN` | Website URL(s) allowed to call the API, comma-separated |
| `IP_HASH_SALT` | Random string used to hash IPs in click logs |
| `CONTACT_EMAIL` | Optional; sent in the User-Agent by `db:images` |
| `NODE_ENV` | `development` or `production` |

## Endpoints

Everything is under `/api/v1`. Responses are JSON. Errors look like `{ "error": { "code", "message" } }`.

**Catalog**
- `GET /categories`, `GET /activities`
- `GET /countries?featured&region`, `GET /countries/:slug`
- `GET /experiences`, `GET /experiences/:slug`
- `GET /articles?section=essentials|tips`, `GET /articles/:slug`

**Destinations**
- `GET /destinations?country&city&category&tag&q&minRating&price&difficulty&month&activity&near=lat,lng&radius&sort&limit&offset`. `sort` is one of `recommended`, `rating`, `nearest`, `popular`, `newest`, `name`
- `GET /destinations/nearby?near=lat,lng&radius`
- `GET /destinations/:slug`: photos, activities, nearby places and destinations, review summary
- `GET /destinations/:slug/reviews`, `POST /destinations/:slug/reviews` (logged in, one per user)

**Search, places, map**
- `GET /search?q=…&(same filters)` returns `{ data, total, places, thingsToDo, interpretation }`
- `GET /search/suggest?q=…`
- `GET /places?kind=hotel|restaurant|shopping|transport&near|country`
- `GET /map?layers=destinations,hotel,restaurant,shopping,transport&category&country&bbox`
- `GET /go/:slug`: booking redirect

**Account** (send `Authorization: Bearer <token>`)
- `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`
- `GET|PATCH|DELETE /me`, `POST /me/password`
- `GET /me/favorites`, `GET /me/favorites/keys`, `POST /me/favorites`, `DELETE /me/favorites/:kind/:slug?list=saved|visited`, `POST /me/favorites/import`
- `GET|POST /me/trips`, `GET|PATCH|DELETE /me/trips/:id`, `POST /me/trips/:id/stops`, `PATCH|DELETE /me/trips/:id/stops/:stopId`, `POST /me/trips/:id/reorder`

## Project layout

```
src/
  app.ts, index.ts        Express app (helmet, CORS, rate limits) and server
  config/env.ts           Validated environment
  db/schema.ts            Drizzle schema (all tables)
  db/data/                Seed content: countries, destinations, experiences, articles…
  db/seed.ts, reset.ts, images.ts
  lib/                    Auth, destination queries, search parsing, ratings
  routes/                 catalog, destinations, search, places, account
drizzle/                  SQL migrations
```

## Deploying

Any Node host works (Render, Railway, Fly.io) with a Postgres database that has PostGIS (Neon, Supabase, RDS). Set the environment variables, run `npm run build && npm run db:migrate && npm run db:seed`, then `npm start`.

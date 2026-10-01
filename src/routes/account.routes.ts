import { Router } from "express";
import { and, asc, eq, sql } from "drizzle-orm";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { db } from "../db/client.js";
import { destinations, experiences, favorites, places, sessions, tripStops, trips, users } from "../db/schema.js";
import { createSession, currentUser, deleteSession, hashPassword, requireUser, verifyPassword } from "../lib/auth.js";
import { findDestinations, haversineKm, coverImageSql } from "../lib/destinations.js";
import { HttpError, notFound } from "../lib/http-error.js";
import { parse } from "../lib/validation.js";

export const accountRouter = Router();

/* ---------- Authentication ---------- */

const authLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 20, standardHeaders: "draft-8", legacyHeaders: false });
const email = z.string().trim().toLowerCase().email("Enter a valid email address").max(200);
const password = z.string().min(8, "Use at least 8 characters").max(200);

const publicUser = (u: { id: number; name: string; email: string; avatarUrl: string | null; homeCity: string | null; createdAt?: Date }) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  avatarUrl: u.avatarUrl,
  homeCity: u.homeCity,
  createdAt: u.createdAt,
});

// POST /auth/register {name, email, password}
accountRouter.post("/auth/register", authLimiter, async (req, res) => {
  const body = parse(z.object({ name: z.string().trim().min(2, "Enter your name").max(80), email, password }), req.body);
  const [exists] = await db.select({ id: users.id }).from(users).where(eq(users.email, body.email));
  if (exists) throw new HttpError(409, "EMAIL_TAKEN", "An account with this email already exists. Log in instead.");
  const [user] = await db
    .insert(users)
    .values({ name: body.name, email: body.email, passwordHash: await hashPassword(body.password) })
    .returning();
  const session = await createSession(user.id);
  res.status(201).json({ data: { user: publicUser(user), ...session } });
});

// POST /auth/login {email, password}
accountRouter.post("/auth/login", authLimiter, async (req, res) => {
  const body = parse(z.object({ email, password: z.string().min(1).max(200) }), req.body);
  const [user] = await db.select().from(users).where(eq(users.email, body.email));
  if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
    throw new HttpError(401, "INVALID_LOGIN", "Email or password is incorrect");
  }
  const session = await createSession(user.id);
  res.json({ data: { user: publicUser(user), ...session } });
});

// POST /auth/logout
accountRouter.post("/auth/logout", requireUser, async (req, res) => {
  await deleteSession(req.token!);
  res.status(204).end();
});

/* ---------- Profile ---------- */

accountRouter.get("/me", requireUser, async (req, res) => {
  const [user] = await db.select().from(users).where(eq(users.id, currentUser(req).id));
  const [counts] = await db.execute<Record<string, number>>(sql`
    SELECT
      (SELECT COUNT(*)::int FROM favorites WHERE user_id = ${user.id} AND list = 'saved') AS saved,
      (SELECT COUNT(*)::int FROM favorites WHERE user_id = ${user.id} AND list = 'visited') AS visited,
      (SELECT COUNT(*)::int FROM trips WHERE user_id = ${user.id}) AS trips,
      (SELECT COUNT(*)::int FROM reviews WHERE user_id = ${user.id}) AS reviews`);
  res.json({ data: { ...publicUser(user), counts } });
});

// PATCH /me {name?, avatarUrl?, homeCity?}
accountRouter.patch("/me", requireUser, async (req, res) => {
  const body = parse(
    z.object({
      name: z.string().trim().min(2).max(80).optional(),
      avatarUrl: z.string().trim().url().max(500).or(z.literal("")).optional(),
      homeCity: z.string().trim().max(80).optional(),
    }),
    req.body,
  );
  const [user] = await db
    .update(users)
    .set({ ...body, avatarUrl: body.avatarUrl === "" ? null : body.avatarUrl, updatedAt: new Date() })
    .where(eq(users.id, currentUser(req).id))
    .returning();
  res.json({ data: publicUser(user) });
});

// POST /me/password {current, next} — also signs out other devices
accountRouter.post("/me/password", requireUser, async (req, res) => {
  const body = parse(z.object({ current: z.string().min(1), next: password }), req.body);
  const me = currentUser(req);
  const [user] = await db.select().from(users).where(eq(users.id, me.id));
  if (!(await verifyPassword(body.current, user.passwordHash))) throw new HttpError(400, "WRONG_PASSWORD", "Current password is incorrect");
  await db.update(users).set({ passwordHash: await hashPassword(body.next), updatedAt: new Date() }).where(eq(users.id, me.id));
  await db.delete(sessions).where(and(eq(sessions.userId, me.id), sql`token_hash <> encode(sha256(${req.token!}::bytea), 'hex')`));
  res.status(204).end();
});

// DELETE /me — delete the account and all its data
accountRouter.delete("/me", requireUser, async (req, res) => {
  await db.delete(users).where(eq(users.id, currentUser(req).id));
  res.status(204).end();
});

/* ---------- Favorites ---------- */

const favKind = z.enum(["destination", "experience", "place"]);
const favList = z.enum(["saved", "visited"]);

async function targetId(kind: z.infer<typeof favKind>, slug: string) {
  const table = kind === "destination" ? destinations : kind === "experience" ? experiences : places;
  const [row] = await db.select({ id: table.id }).from(table).where(eq(table.slug, slug));
  if (!row) throw notFound(kind[0].toUpperCase() + kind.slice(1));
  return row.id;
}

// GET /me/favorites/keys → ["destination:kribi", "experience:african-safari", "visited:destination:limbe"]
accountRouter.get("/me/favorites/keys", requireUser, async (req, res) => {
  const rows = await db.execute<{ key: string }>(sql`
    SELECT CASE WHEN f.list = 'visited' THEN 'visited:' ELSE '' END || f.kind || ':' ||
           COALESCE(d.slug, e.slug, p.slug) AS key
    FROM favorites f
    LEFT JOIN destinations d ON f.kind = 'destination' AND d.id = f.target_id
    LEFT JOIN experiences e ON f.kind = 'experience' AND e.id = f.target_id
    LEFT JOIN places p ON f.kind = 'place' AND p.id = f.target_id
    WHERE f.user_id = ${currentUser(req).id}`);
  res.json({ data: rows.map((r) => r.key).filter(Boolean) });
});

// GET /me/favorites → saved destinations, experiences, places and visited destinations
accountRouter.get("/me/favorites", requireUser, async (req, res) => {
  const userId = currentUser(req).id;
  const ids = async (kind: string, list: string) =>
    (
      await db.execute<{ target_id: number }>(sql`
        SELECT target_id FROM favorites WHERE user_id = ${userId} AND kind = ${kind} AND list = ${list} ORDER BY created_at DESC`)
    ).map((r) => r.target_id);

  const [savedDest, visitedDest, expIds, placeIds] = await Promise.all([
    ids("destination", "saved"),
    ids("destination", "visited"),
    ids("experience", "saved"),
    ids("place", "saved"),
  ]);
  const [saved, visited, exp, pl] = await Promise.all([
    savedDest.length ? findDestinations({ ids: savedDest, limit: 200 }) : { items: [] },
    visitedDest.length ? findDestinations({ ids: visitedDest, limit: 200 }) : { items: [] },
    expIds.length
      ? db.execute(sql`SELECT e.slug, e.name, e.emoji, e.tagline, ${coverImageSql(sql`e.cover_destination_id`)} AS image
                       FROM experiences e WHERE e.id IN (${sql.join(expIds.map((i) => sql`${i}`), sql`, `)})`)
      : [],
    placeIds.length
      ? db.execute(sql`SELECT p.slug, p.name, p.kind, p.rating::float AS rating, p.price_range AS "priceRange", p.is_demo AS "isDemo", ci.name AS city
                       FROM places p LEFT JOIN cities ci ON ci.id = p.city_id
                       WHERE p.id IN (${sql.join(placeIds.map((i) => sql`${i}`), sql`, `)})`)
      : [],
  ]);
  const order = (list: number[]) => (a: { id: number }, b: { id: number }) => list.indexOf(a.id) - list.indexOf(b.id);
  res.json({
    data: {
      destinations: saved.items.sort(order(savedDest)),
      visited: visited.items.sort(order(visitedDest)),
      experiences: exp,
      places: pl,
    },
  });
});

const favBody = z.object({ kind: favKind, slug: z.string().min(1).max(160), list: favList.default("saved") });

// POST /me/favorites {kind, slug, list?}
accountRouter.post("/me/favorites", requireUser, async (req, res) => {
  const body = parse(favBody, req.body);
  await db
    .insert(favorites)
    .values({ userId: currentUser(req).id, kind: body.kind, list: body.list, targetId: await targetId(body.kind, body.slug) })
    .onConflictDoNothing();
  res.status(201).json({ data: { ok: true } });
});

// DELETE /me/favorites/:kind/:slug?list=saved
accountRouter.delete("/me/favorites/:kind/:slug", requireUser, async (req, res) => {
  const p = parse(z.object({ kind: favKind, slug: z.string().min(1).max(160) }), req.params);
  const { list } = parse(z.object({ list: favList.default("saved") }), req.query);
  await db
    .delete(favorites)
    .where(
      and(
        eq(favorites.userId, currentUser(req).id),
        eq(favorites.kind, p.kind),
        eq(favorites.list, list),
        eq(favorites.targetId, await targetId(p.kind, p.slug)),
      ),
    );
  res.status(204).end();
});

// POST /me/favorites/import {items: [{kind, slug}]} — merges favourites saved before logging in
accountRouter.post("/me/favorites/import", requireUser, async (req, res) => {
  const { items } = parse(z.object({ items: z.array(favBody).max(200) }), req.body);
  let imported = 0;
  for (const it of items) {
    try {
      await db
        .insert(favorites)
        .values({ userId: currentUser(req).id, kind: it.kind, list: it.list, targetId: await targetId(it.kind, it.slug) })
        .onConflictDoNothing();
      imported++;
    } catch {
      // Unknown slug: skip it
    }
  }
  res.json({ data: { imported } });
});

/* ---------- Trips ---------- */

async function ownTrip(userId: number, id: number) {
  const [trip] = await db.select().from(trips).where(and(eq(trips.id, id), eq(trips.userId, userId)));
  if (!trip) throw notFound("Trip");
  return trip;
}
const idParam = z.object({ id: z.coerce.number().int().positive() });

// GET /me/trips
accountRouter.get("/me/trips", requireUser, async (req, res) => {
  const rows = await db.execute(sql`
    SELECT t.id, t.title, t.start_date AS "startDate", t.updated_at AS "updatedAt",
           COUNT(s.id)::int AS "stopCount", COALESCE(SUM(s.days), 0)::int AS days,
           (SELECT ${coverImageSql(sql`s2.destination_id`)} FROM trip_stops s2 WHERE s2.trip_id = t.id ORDER BY s2.position LIMIT 1) AS image,
           (SELECT json_agg(d.name ORDER BY s3.position) FROM trip_stops s3 JOIN destinations d ON d.id = s3.destination_id WHERE s3.trip_id = t.id) AS "stopNames"
    FROM trips t LEFT JOIN trip_stops s ON s.trip_id = t.id
    WHERE t.user_id = ${currentUser(req).id}
    GROUP BY t.id ORDER BY t.updated_at DESC`);
  res.json({ data: rows });
});

const tripBody = z.object({
  title: z.string().trim().min(2, "Give your trip a name").max(100),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal("")).optional(),
  notes: z.string().max(5000).optional(),
});

// POST /me/trips {title, startDate?, destinationSlug?}
accountRouter.post("/me/trips", requireUser, async (req, res) => {
  const body = parse(tripBody.extend({ destinationSlug: z.string().max(160).optional() }), req.body);
  const [trip] = await db
    .insert(trips)
    .values({ userId: currentUser(req).id, title: body.title, startDate: body.startDate || null, notes: body.notes })
    .returning({ id: trips.id });
  if (body.destinationSlug) {
    const destinationId = await targetId("destination", body.destinationSlug);
    await db.insert(tripStops).values({ tripId: trip.id, destinationId, position: 0 });
  }
  res.status(201).json({ data: { id: trip.id } });
});

// GET /me/trips/:id — stops with destinations, distances between stops and a duration estimate
accountRouter.get("/me/trips/:id", requireUser, async (req, res) => {
  const trip = await ownTrip(currentUser(req).id, parse(idParam, req.params).id);
  const stops = await db.select().from(tripStops).where(eq(tripStops.tripId, trip.id)).orderBy(asc(tripStops.position));
  const cards = stops.length ? (await findDestinations({ ids: stops.map((s) => s.destinationId), limit: 200 })).items : [];
  const byId = new Map(cards.map((c) => [c.id, c]));

  let totalKm = 0;
  const items = stops.map((s, i) => {
    const destination = byId.get(s.destinationId)!;
    const prev = i > 0 ? byId.get(stops[i - 1].destinationId) : undefined;
    const legKm = prev ? Math.round(haversineKm(prev.location, destination.location)) : 0;
    totalKm += legKm;
    return { id: s.id, position: i, days: s.days, notes: s.notes, legKm, destination };
  });
  // Rough travel time: road distance is often ~1.3× straight-line, at ~50 km/h; flights for very long legs
  const travelDays = items.reduce((sum, s) => sum + (s.legKm > 900 ? 1 : (s.legKm * 1.3) / 50 / 8), 0);
  const stayDays = items.reduce((sum, s) => sum + s.days, 0);
  res.json({
    data: {
      id: trip.id,
      title: trip.title,
      startDate: trip.startDate,
      notes: trip.notes,
      stops: items,
      summary: {
        stops: items.length,
        totalKm,
        stayDays,
        travelDays: Math.round(travelDays * 10) / 10,
        estimatedDays: Math.ceil(stayDays + travelDays),
      },
    },
  });
});

// PATCH /me/trips/:id {title?, startDate?, notes?}
accountRouter.patch("/me/trips/:id", requireUser, async (req, res) => {
  const trip = await ownTrip(currentUser(req).id, parse(idParam, req.params).id);
  const body = parse(tripBody.partial(), req.body);
  await db
    .update(trips)
    .set({ ...body, startDate: body.startDate === "" ? null : body.startDate, updatedAt: new Date() })
    .where(eq(trips.id, trip.id));
  res.status(204).end();
});

// DELETE /me/trips/:id
accountRouter.delete("/me/trips/:id", requireUser, async (req, res) => {
  const trip = await ownTrip(currentUser(req).id, parse(idParam, req.params).id);
  await db.delete(trips).where(eq(trips.id, trip.id));
  res.status(204).end();
});

// POST /me/trips/:id/stops {destinationSlug, days?, notes?} — adds at the end
accountRouter.post("/me/trips/:id/stops", requireUser, async (req, res) => {
  const trip = await ownTrip(currentUser(req).id, parse(idParam, req.params).id);
  const body = parse(
    z.object({ destinationSlug: z.string().min(1).max(160), days: z.coerce.number().int().min(1).max(60).default(1), notes: z.string().max(2000).optional() }),
    req.body,
  );
  const destinationId = await targetId("destination", body.destinationSlug);
  const [{ next }] = await db.execute<{ next: number }>(sql`SELECT COALESCE(MAX(position) + 1, 0)::int AS next FROM trip_stops WHERE trip_id = ${trip.id}`);
  const [stop] = await db
    .insert(tripStops)
    .values({ tripId: trip.id, destinationId, position: next, days: body.days, notes: body.notes })
    .returning({ id: tripStops.id });
  await db.update(trips).set({ updatedAt: new Date() }).where(eq(trips.id, trip.id));
  res.status(201).json({ data: { id: stop.id } });
});

const stopParams = z.object({ id: z.coerce.number().int().positive(), stopId: z.coerce.number().int().positive() });

// PATCH /me/trips/:id/stops/:stopId {days?, notes?}
accountRouter.patch("/me/trips/:id/stops/:stopId", requireUser, async (req, res) => {
  const p = parse(stopParams, req.params);
  const trip = await ownTrip(currentUser(req).id, p.id);
  const body = parse(z.object({ days: z.coerce.number().int().min(1).max(60).optional(), notes: z.string().max(2000).optional() }), req.body);
  await db.update(tripStops).set(body).where(and(eq(tripStops.id, p.stopId), eq(tripStops.tripId, trip.id)));
  await db.update(trips).set({ updatedAt: new Date() }).where(eq(trips.id, trip.id));
  res.status(204).end();
});

// DELETE /me/trips/:id/stops/:stopId
accountRouter.delete("/me/trips/:id/stops/:stopId", requireUser, async (req, res) => {
  const p = parse(stopParams, req.params);
  const trip = await ownTrip(currentUser(req).id, p.id);
  await db.delete(tripStops).where(and(eq(tripStops.id, p.stopId), eq(tripStops.tripId, trip.id)));
  await renumber(trip.id);
  res.status(204).end();
});

// POST /me/trips/:id/reorder {stopIds: [3, 1, 2]}
accountRouter.post("/me/trips/:id/reorder", requireUser, async (req, res) => {
  const trip = await ownTrip(currentUser(req).id, parse(idParam, req.params).id);
  const { stopIds } = parse(z.object({ stopIds: z.array(z.number().int().positive()).max(100) }), req.body);
  const current = await db.select({ id: tripStops.id }).from(tripStops).where(eq(tripStops.tripId, trip.id));
  const valid = new Set(current.map((s) => s.id));
  if (stopIds.length !== valid.size || stopIds.some((id) => !valid.has(id))) {
    throw new HttpError(400, "BAD_REQUEST", "stopIds must list every stop of this trip exactly once");
  }
  await db.transaction(async (tx) => {
    for (const [i, id] of stopIds.entries()) await tx.update(tripStops).set({ position: i }).where(eq(tripStops.id, id));
  });
  res.status(204).end();
});

async function renumber(tripId: number) {
  await db.execute(sql`
    UPDATE trip_stops s SET position = o.rn - 1
    FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY position) AS rn FROM trip_stops WHERE trip_id = ${tripId}) o
    WHERE s.id = o.id`);
}

import { Router } from "express";
import { createHash } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client.js";
import { affiliateClicks, places } from "../db/schema.js";
import { env } from "../config/env.js";
import { optionalUser } from "../lib/auth.js";
import { HttpError, notFound } from "../lib/http-error.js";
import type { LatLng } from "../lib/destinations.js";
import { clientIp, parse, slugParam } from "../lib/validation.js";

export const placesRouter = Router();

const KINDS = ["hotel", "restaurant", "shopping", "transport"] as const;
type Kind = (typeof KINDS)[number];

/** How far to look for each kind of place around a destination (km). */
const RADIUS: Record<Kind, number> = { hotel: 30, restaurant: 30, shopping: 60, transport: 200 };

async function placesNear(near: LatLng, kind: Kind, radiusKm: number, limit: number) {
  const here = sql`ST_SetSRID(ST_MakePoint(${near.lng}, ${near.lat}), 4326)::geography`;
  const rows = await db.execute<Record<string, unknown>>(sql`
    SELECT p.slug, p.kind, p.name, p.description, p.rating::float AS rating, p.price_range AS "priceRange", p.is_demo AS "isDemo",
           (p.plan <> 'free') AS sponsored, (p.affiliate_url IS NOT NULL OR p.website IS NOT NULL) AS bookable,
           ci.name AS city, ST_Y(p.location) AS lat, ST_X(p.location) AS lng,
           ROUND((ST_Distance(p.location::geography, ${here}) / 1000)::numeric, 1)::float AS "distanceKm"
    FROM places p LEFT JOIN cities ci ON ci.id = p.city_id
    WHERE p.kind = ${kind} AND ST_DWithin(p.location::geography, ${here}, ${radiusKm * 1000})
    ORDER BY (p.plan <> 'free') DESC, "distanceKm" ASC
    LIMIT ${limit}`);
  return rows.map(({ lat, lng, bookable, ...p }) => ({
    ...p,
    location: { lat: Number(lat), lng: Number(lng) },
    bookUrl: bookable ? `/api/v1/go/${p.slug}` : null,
  }));
}

/** Hotels, restaurants, shopping and transport around a point, grouped by kind. */
export async function nearbyPlaces(near: LatLng) {
  const [hotels, restaurants, shopping, transport] = await Promise.all(
    KINDS.map((k) => placesNear(near, k, RADIUS[k], k === "transport" ? 2 : 6)),
  );
  return { hotels, restaurants, shopping, transport };
}

// GET /places?kind=hotel&near=lat,lng&radius=30   or   /places?kind=hotel&country=cameroon (no location: best rated first)
placesRouter.get("/places", async (req, res) => {
  const q = parse(
    z.object({
      near: z.string().regex(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/, "use lat,lng").optional(),
      kind: z.enum(KINDS),
      country: z.string().max(80).optional(),
      radius: z.coerce.number().min(1).max(500).default(30),
      limit: z.coerce.number().int().min(1).max(100).default(24),
    }),
    req.query,
  );
  if (q.near) {
    const [lat, lng] = q.near.split(",").map(Number);
    res.json({ data: await placesNear({ lat, lng }, q.kind, q.radius, q.limit) });
    return;
  }
  const rows = await db.execute<Record<string, unknown>>(sql`
    SELECT p.slug, p.kind, p.name, p.description, p.rating::float AS rating, p.price_range AS "priceRange", p.is_demo AS "isDemo",
           (p.plan <> 'free') AS sponsored, ci.name AS city, co.name AS country, NULL::float AS "distanceKm"
    FROM places p JOIN countries co ON co.id = p.country_id LEFT JOIN cities ci ON ci.id = p.city_id
    WHERE p.kind = ${q.kind} AND ${q.country ? sql`co.slug = ${q.country}` : sql`TRUE`}
    ORDER BY (p.plan <> 'free') DESC, p.rating DESC NULLS LAST, p.name
    LIMIT ${q.limit}`);
  res.json({ data: rows });
});

// GET /go/:slug — counts the click, then sends the visitor to the booking site
placesRouter.get("/go/:slug", optionalUser, async (req, res) => {
  const { slug } = parse(slugParam, req.params);
  const src = parse(z.object({ src: z.string().regex(/^[a-z0-9_-]{1,40}$/).optional() }), req.query).src;
  const [p] = await db
    .select({ id: places.id, affiliateUrl: places.affiliateUrl, website: places.website })
    .from(places)
    .where(eq(places.slug, slug));
  const target = p?.affiliateUrl || p?.website;
  if (!p || !target) throw notFound("Booking link");
  if (!/^https?:\/\//.test(target)) throw new HttpError(400, "BAD_LINK", "Invalid booking link");
  const ipHash = createHash("sha256").update(env.IP_HASH_SALT + clientIp(req)).digest("hex");
  db.insert(affiliateClicks)
    .values({ placeId: p.id, userId: req.user?.id ?? null, sourcePage: src ?? null, ipHash })
    .catch((err) => console.error("Failed to log click", err));
  res.redirect(302, target);
});

// GET /map?bbox=minLng,minLat,maxLng,maxLat&layers=destinations,hotel,restaurant&category=beaches
placesRouter.get("/map", async (req, res) => {
  const q = parse(
    z.object({
      bbox: z.string().optional(),
      layers: z.string().default("destinations"),
      category: z.string().max(40).optional(),
      country: z.string().max(80).optional(),
    }),
    req.query,
  );
  let box = sql`TRUE`;
  let boxP = sql`TRUE`;
  if (q.bbox) {
    const n = q.bbox.split(",").map(Number);
    if (n.length !== 4 || n.some((x) => !Number.isFinite(x))) throw new HttpError(400, "BAD_REQUEST", "bbox must be minLng,minLat,maxLng,maxLat");
    const env = sql`ST_MakeEnvelope(${n[0]}, ${n[1]}, ${n[2]}, ${n[3]}, 4326)`;
    box = sql`d.location && ${env}`;
    boxP = sql`p.location && ${env}`;
  }
  const layers = new Set(q.layers.split(","));
  const kinds = KINDS.filter((k) => layers.has(k));
  const out: Record<string, unknown>[] = [];

  if (layers.has("destinations")) {
    const rows = await db.execute<Record<string, unknown>>(sql`
      SELECT 'destination' AS layer, d.slug, d.name, d.rating, ca.slug AS category, ca.emoji, co.slug AS "countrySlug",
             co.name AS country, ST_Y(d.location) AS lat, ST_X(d.location) AS lng
      FROM destinations d JOIN categories ca ON ca.id = d.category_id JOIN countries co ON co.id = d.country_id
      WHERE ${box} AND ${q.category ? sql`ca.slug = ${q.category}` : sql`TRUE`}
        AND ${q.country ? sql`co.slug = ${q.country}` : sql`TRUE`}`);
    out.push(...rows);
  }
  if (kinds.length) {
    const rows = await db.execute<Record<string, unknown>>(sql`
      SELECT p.kind::text AS layer, p.slug, p.name, p.rating, p.kind::text AS category, NULL AS emoji, co.slug AS "countrySlug",
             co.name AS country, ST_Y(p.location) AS lat, ST_X(p.location) AS lng, p.is_demo AS "isDemo"
      FROM places p JOIN countries co ON co.id = p.country_id
      WHERE ${boxP} AND p.kind::text IN (${sql.join(kinds.map((k) => sql`${k}`), sql`, `)})
        AND ${q.country ? sql`co.slug = ${q.country}` : sql`TRUE`}
      LIMIT 1000`);
    out.push(...rows);
  }
  res.json({
    data: out.map(({ lat, lng, rating, ...p }) => ({
      ...p,
      rating: rating === null ? null : Number(rating),
      location: { lat: Number(lat), lng: Number(lng) },
    })),
  });
});

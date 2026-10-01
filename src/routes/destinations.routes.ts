import { Router } from "express";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client.js";
import { destinations, reviews } from "../db/schema.js";
import { coverImageSql, findDestinations, type DestinationFilters } from "../lib/destinations.js";
import { currentUser, optionalUser, requireUser } from "../lib/auth.js";
import { HttpError, notFound } from "../lib/http-error.js";
import { parse, slugParam } from "../lib/validation.js";
import { refreshRatings } from "../lib/ratings.js";
import { nearbyPlaces } from "./places.routes.js";

export const destinationsRouter = Router();

const csv = z
  .string()
  .max(300)
  .optional()
  .transform((v) => (v ? v.split(",").map((x) => x.trim()).filter(Boolean) : undefined));
const latLng = z
  .string()
  .regex(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/, "use lat,lng")
  .optional()
  .transform((v) => (v ? { lat: Number(v.split(",")[0]), lng: Number(v.split(",")[1]) } : undefined));

export const destinationQuery = z.object({
  country: csv,
  city: z.string().max(120).optional(),
  category: csv,
  tag: csv,
  q: z.string().trim().max(100).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  price: csv,
  difficulty: csv,
  month: z.coerce.number().int().min(1).max(12).optional(),
  activity: z.string().max(80).optional(),
  near: latLng,
  radius: z.coerce.number().min(1).max(5000).optional(), // km
  slugs: csv,
  featured: z.enum(["true", "false"]).optional(),
  sort: z.enum(["recommended", "rating", "nearest", "popular", "newest", "name"]).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(24),
  offset: z.coerce.number().int().min(0).default(0),
});

export function toFilters(q: z.infer<typeof destinationQuery>): DestinationFilters {
  return {
    ...q,
    featured: q.featured === "true",
    radiusKm: q.near ? (q.radius ?? undefined) : undefined,
  };
}

// GET /destinations?country=cameroon,kenya&category=beaches&near=3.84,11.5&radius=200&sort=nearest
destinationsRouter.get("/destinations", async (req, res) => {
  const q = parse(destinationQuery, req.query);
  const { items, total } = await findDestinations(toFilters(q));
  res.json({ data: items, total, limit: q.limit, offset: q.offset });
});

// GET /destinations/nearby?near=lat,lng&radius=200 — "Explore near you"
destinationsRouter.get("/destinations/nearby", async (req, res) => {
  const q = parse(
    z.object({ near: latLng, radius: z.coerce.number().min(1).max(5000).default(300), limit: z.coerce.number().int().min(1).max(50).default(12) }),
    req.query,
  );
  if (!q.near) throw new HttpError(400, "BAD_REQUEST", "near=lat,lng is required");
  let result = await findDestinations({ near: q.near, radiusKm: q.radius, sort: "nearest", limit: q.limit });
  // Nothing close? Show the closest places anywhere, so the section is never empty
  if (result.items.length === 0) result = await findDestinations({ near: q.near, sort: "nearest", limit: q.limit });
  res.json({ data: result.items, total: result.total });
});

// GET /destinations/:slug — the destination page
destinationsRouter.get("/destinations/:slug", optionalUser, async (req, res) => {
  const { slug } = parse(slugParam, req.params);
  const { items } = await findDestinations({ slugs: [slug], limit: 1 });
  const card = items[0];
  if (!card) throw notFound("Destination");

  const [details] = await db.execute<Record<string, unknown>>(sql`
    SELECT d.description, d.highlights, d.opening_hours AS "openingHours", d.budget, d.best_months AS "bestMonths",
           co.safety AS "countrySafety"
    FROM destinations d JOIN countries co ON co.id = d.country_id WHERE d.id = ${card.id}`);

  const [images, activities, experiences, nearbyDest, places, reviewSummary, latestReviews] = await Promise.all([
    db.execute(sql`
      SELECT url, alt, credit, license, source_url AS "sourceUrl" FROM images
      WHERE owner_type = 'destination' AND owner_id = ${card.id} ORDER BY position`),
    db.execute(sql`
      SELECT a.slug, a.name, a.emoji, a.description, da.note, ${coverImageSql(sql`a.cover_destination_id`)} AS image
      FROM destination_activities da JOIN activities a ON a.id = da.activity_id
      WHERE da.destination_id = ${card.id} ORDER BY a.name`),
    db.execute(sql`
      SELECT e.slug, e.name, e.emoji, e.tagline FROM experiences e
      JOIN experience_destinations ed ON ed.experience_id = e.id WHERE ed.destination_id = ${card.id}
      ORDER BY e.sort_order`),
    findDestinations({ near: card.location, radiusKm: 250, excludeSlug: slug, sort: "nearest", limit: 8 }),
    nearbyPlaces(card.location),
    db.execute(sql`
      SELECT COUNT(*)::int AS count, ROUND(AVG(rating)::numeric, 1)::float AS average,
             json_build_object('5', COUNT(*) FILTER (WHERE rating = 5), '4', COUNT(*) FILTER (WHERE rating = 4),
                               '3', COUNT(*) FILTER (WHERE rating = 3), '2', COUNT(*) FILTER (WHERE rating = 2),
                               '1', COUNT(*) FILTER (WHERE rating = 1)) AS breakdown
      FROM reviews WHERE destination_id = ${card.id}`),
    latestReviewsFor(card.id, 6, 0),
  ]);

  const myReview = req.user
    ? (
        await db
          .select({ id: reviews.id })
          .from(reviews)
          .where(and(eq(reviews.destinationId, card.id), eq(reviews.userId, req.user.id)))
      )[0]
    : undefined;

  res.json({
    data: {
      ...card,
      ...details,
      images,
      activities,
      experiences,
      nearbyDestinations: nearbyDest.items,
      nearbyPlaces: places,
      reviews: { ...reviewSummary[0], items: latestReviews, userHasReviewed: Boolean(myReview) },
    },
  });
});

async function latestReviewsFor(destinationId: number, limit: number, offset: number) {
  return db.execute(sql`
    SELECT r.id, r.author_name AS "authorName", r.author_country AS "authorCountry", r.rating, r.title, r.body,
           r.visited_on AS "visitedOn", r.is_sample AS "isSample", r.created_at AS "createdAt",
           u.avatar_url AS "avatarUrl"
    FROM reviews r LEFT JOIN users u ON u.id = r.user_id
    WHERE r.destination_id = ${destinationId}
    ORDER BY r.is_sample ASC, r.created_at DESC
    LIMIT ${limit} OFFSET ${offset}`);
}

// GET /destinations/:slug/reviews?limit=&offset=
destinationsRouter.get("/destinations/:slug/reviews", async (req, res) => {
  const { slug } = parse(slugParam, req.params);
  const q = parse(z.object({ limit: z.coerce.number().int().min(1).max(50).default(10), offset: z.coerce.number().int().min(0).default(0) }), req.query);
  const [d] = await db.select({ id: destinations.id }).from(destinations).where(eq(destinations.slug, slug));
  if (!d) throw notFound("Destination");
  res.json({ data: await latestReviewsFor(d.id, q.limit, q.offset) });
});

// POST /destinations/:slug/reviews — logged-in users, one review per destination
destinationsRouter.post("/destinations/:slug/reviews", requireUser, async (req, res) => {
  const user = currentUser(req);
  const { slug } = parse(slugParam, req.params);
  const body = parse(
    z.object({
      rating: z.coerce.number().int().min(1).max(5),
      title: z.string().trim().min(3).max(120),
      body: z.string().trim().min(20, "Please write at least 20 characters").max(3000),
      visitedOn: z.string().trim().max(40).optional(),
    }),
    req.body,
  );
  const [d] = await db.select({ id: destinations.id }).from(destinations).where(eq(destinations.slug, slug));
  if (!d) throw notFound("Destination");
  const [existing] = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(and(eq(reviews.destinationId, d.id), eq(reviews.userId, user.id)));
  if (existing) throw new HttpError(409, "ALREADY_REVIEWED", "You've already reviewed this destination");

  const [created] = await db
    .insert(reviews)
    .values({ destinationId: d.id, userId: user.id, authorName: user.name, ...body })
    .returning({ id: reviews.id });
  await refreshRatings([d.id]);
  res.status(201).json({ data: { id: created.id } });
});

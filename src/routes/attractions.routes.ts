import { Router } from "express";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client.js";
import { attractions, categories, cities, countries, regions } from "../db/schema.js";
import { notFound } from "../lib/http-error.js";
import { page, paginationSchema, parse, slugParam } from "../lib/validation.js";
import { byId, listWhere, placeColumns, toLatLng } from "./shared.js";

export const attractionsRouter = Router();

const filterSlug = z.string().regex(/^[a-z0-9-]+$/).optional();
const listQuery = paginationSchema.extend({
  country: filterSlug,
  region: filterSlug,
  city: filterSlug,
  category: filterSlug,
  q: z.string().trim().min(1).max(80).optional(),
});

const baseSelect = {
  id: attractions.id,
  slug: attractions.slug,
  name: attractions.name,
  summaryEn: attractions.summaryEn,
  summaryFr: attractions.summaryFr,
  entryFee: attractions.entryFee,
  coverImageUrl: attractions.coverImageUrl,
  location: attractions.location,
  ...placeColumns,
};

function fromAttractions() {
  return db
    .select(baseSelect)
    .from(attractions)
    .innerJoin(cities, eq(attractions.cityId, cities.id))
    .innerJoin(regions, eq(cities.regionId, regions.id))
    .innerJoin(countries, eq(regions.countryId, countries.id))
    .innerJoin(categories, eq(attractions.categoryId, categories.id));
}

// GET /attractions?country=&region=&city=&category=&q=&limit=&cursor=
attractionsRouter.get("/attractions", async (req, res) => {
  const query = parse(listQuery, req.query);
  const rows = await fromAttractions()
    .where(listWhere(attractions, query))
    .orderBy(byId(attractions))
    .limit(query.limit + 1);

  const { data, nextCursor } = page(rows, query.limit);
  res.json({ data: data.map((r) => ({ ...r, location: toLatLng(r.location) })), nextCursor });
});

// GET /attractions/:slug
attractionsRouter.get("/attractions/:slug", async (req, res) => {
  const { slug } = parse(slugParam, req.params);
  const [row] = await db
    .select({
      ...baseSelect,
      descriptionEn: attractions.descriptionEn,
      descriptionFr: attractions.descriptionFr,
      openingHours: attractions.openingHours,
      bestSeason: attractions.bestSeason,
    })
    .from(attractions)
    .innerJoin(cities, eq(attractions.cityId, cities.id))
    .innerJoin(regions, eq(cities.regionId, regions.id))
    .innerJoin(countries, eq(regions.countryId, countries.id))
    .innerJoin(categories, eq(attractions.categoryId, categories.id))
    .where(and(eq(attractions.slug, slug), eq(attractions.status, "published")));

  if (!row) throw notFound("Attraction");
  res.json({ data: { ...row, location: toLatLng(row.location) } });
});

const nearbyQuery = z.object({
  type: z.string().regex(/^[a-z0-9-]+$/).optional(), // business category slug: hotel, restaurant, guide...
  radius: z.coerce.number().int().min(100).max(100_000).default(10_000), // meters
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

type NearbyRow = {
  slug: string;
  name: string;
  price_range: string | null;
  plan: "free" | "pro" | "premium";
  verified: boolean;
  cover_image_url: string | null;
  bookable: boolean;
  category_slug: string;
  category_name_en: string;
  category_name_fr: string;
  distance_m: number;
  lat: number;
  lng: number;
};

// GET /attractions/:slug/nearby?type=hotel&radius=10000
// Paid listings first (marked sponsored), then closest first.
attractionsRouter.get("/attractions/:slug/nearby", async (req, res) => {
  const { slug } = parse(slugParam, req.params);
  const { type, radius, limit } = parse(nearbyQuery, req.query);

  const [attraction] = await db
    .select({ id: attractions.id })
    .from(attractions)
    .where(and(eq(attractions.slug, slug), eq(attractions.status, "published")));
  if (!attraction) throw notFound("Attraction");

  const rows = await db.execute<NearbyRow>(sql`
    SELECT b.slug, b.name, b.price_range, b.plan, b.verified, b.cover_image_url,
           (b.affiliate_url IS NOT NULL OR b.website IS NOT NULL) AS bookable,
           c.slug AS category_slug, c.name_en AS category_name_en, c.name_fr AS category_name_fr,
           ST_Distance(b.location::geography, a.location::geography) AS distance_m,
           ST_Y(b.location) AS lat, ST_X(b.location) AS lng
    FROM businesses b
    JOIN categories c ON c.id = b.category_id
    JOIN attractions a ON a.id = ${attraction.id}
    WHERE b.status = 'published'
      AND ${type ? sql`c.slug = ${type}` : sql`TRUE`}
      AND ST_DWithin(b.location::geography, a.location::geography, ${radius})
    ORDER BY (b.plan <> 'free') DESC, distance_m ASC
    LIMIT ${limit}
  `);

  res.json({
    data: rows.map((r) => ({
      slug: r.slug,
      name: r.name,
      category: { slug: r.category_slug, nameEn: r.category_name_en, nameFr: r.category_name_fr },
      distanceMeters: Math.round(Number(r.distance_m)),
      priceRange: r.price_range,
      verified: r.verified,
      sponsored: r.plan !== "free",
      coverImageUrl: r.cover_image_url,
      location: { lat: Number(r.lat), lng: Number(r.lng) },
      bookUrl: r.bookable ? `/api/v1/go/${r.slug}?src=attraction` : null,
    })),
  });
});

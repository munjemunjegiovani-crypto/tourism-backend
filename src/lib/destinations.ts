/**
 * Destination queries shared by Explore, Search, Countries, Experiences, Favorites and Trips.
 * Written in SQL (through Drizzle's sql tag) because filters, distance and sorting combine freely.
 */
import { sql, type SQL } from "drizzle-orm";
import { db } from "../db/client.js";

export type LatLng = { lat: number; lng: number };

export type DestinationFilters = {
  country?: string[];
  city?: string;
  category?: string[];
  tag?: string[];
  q?: string;
  minRating?: number;
  price?: string[];
  difficulty?: string[];
  month?: number;
  activity?: string;
  near?: LatLng;
  radiusKm?: number;
  slugs?: string[];
  ids?: number[];
  featured?: boolean;
  excludeSlug?: string;
  sort?: "recommended" | "rating" | "nearest" | "popular" | "newest" | "name";
  limit?: number;
  offset?: number;
};

export type DestinationCard = {
  id: number;
  slug: string;
  name: string;
  summary: string;
  country: { slug: string; name: string; flag: string };
  city: { slug: string; name: string } | null;
  region: string | null;
  category: { slug: string; name: string; emoji: string };
  tags: string[];
  rating: number | null;
  reviewCount: number;
  priceRange: string | null;
  difficulty: string | null;
  bestTimeToVisit: string | null;
  recommendedDuration: string | null;
  popularity: number;
  location: LatLng;
  image: { url: string; alt: string; credit: string | null; sourceUrl: string | null } | null;
  distanceKm: number | null;
};

const geog = (p: LatLng) => sql`ST_SetSRID(ST_MakePoint(${p.lng}, ${p.lat}), 4326)::geography`;

/** First photo of a destination, as JSON (or null). */
export const coverImageSql = (destIdColumn: SQL) => sql`(
  SELECT json_build_object('url', i.url, 'alt', i.alt, 'credit', i.credit, 'sourceUrl', i.source_url)
  FROM images i WHERE i.owner_type = 'destination' AND i.owner_id = ${destIdColumn}
  ORDER BY i.position LIMIT 1
)`;

/** Accent-insensitive LIKE pattern: lowercases and strips accents in JS; SQL side uses translate(). */
const ACCENTED = "àáâãäåçèéêëìíîïñòóôõöùúûüýÿ";
const PLAIN = "aaaaaaceeeeiiiinooooouuuuyy";
export const normalize = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’']/g, "'").trim();
export const plainSql = (col: SQL) => sql`translate(lower(${col}), ${ACCENTED}, ${PLAIN})`;

export async function findDestinations(f: DestinationFilters): Promise<{ items: DestinationCard[]; total: number }> {
  const where: SQL[] = [sql`TRUE`];
  if (f.country?.length) where.push(sql`co.slug IN (${sql.join(f.country.map((c) => sql`${c}`), sql`, `)})`);
  if (f.city) where.push(sql`ci.slug = ${f.city}`);
  if (f.category?.length) {
    // "Food" is an interest, not a place type: it matches destinations known for local food experiences
    const inCategory = sql`ca.slug IN (${sql.join(f.category.map((c) => sql`${c}`), sql`, `)})`;
    where.push(
      f.category.includes("food")
        ? sql`(${inCategory} OR EXISTS (SELECT 1 FROM destination_activities da JOIN activities a ON a.id = da.activity_id
                                        WHERE da.destination_id = d.id AND a.slug = 'local-food'))`
        : inCategory,
    );
  }
  if (f.tag?.length) where.push(sql`d.tags && ARRAY[${sql.join(f.tag.map((t) => sql`${t}`), sql`, `)}]::text[]`);
  if (f.minRating) where.push(sql`d.rating >= ${f.minRating}`);
  if (f.price?.length) where.push(sql`d.price_range IN (${sql.join(f.price.map((p) => sql`${p}`), sql`, `)})`);
  if (f.difficulty?.length)
    where.push(sql`d.difficulty::text IN (${sql.join(f.difficulty.map((p) => sql`${p}`), sql`, `)})`);
  if (f.month) where.push(sql`${f.month} = ANY(d.best_months)`);
  if (f.activity)
    where.push(sql`EXISTS (SELECT 1 FROM destination_activities da JOIN activities a ON a.id = da.activity_id
                          WHERE da.destination_id = d.id AND a.slug = ${f.activity})`);
  if (f.slugs?.length) where.push(sql`d.slug IN (${sql.join(f.slugs.map((x) => sql`${x}`), sql`, `)})`);
  if (f.ids?.length) where.push(sql`d.id IN (${sql.join(f.ids.map((x) => sql`${x}`), sql`, `)})`);
  if (f.featured) where.push(sql`d.featured`);
  if (f.excludeSlug) where.push(sql`d.slug <> ${f.excludeSlug}`);
  if (f.q) {
    // Every word must appear somewhere: name, summary, tags, city, region, country or category
    for (const word of normalize(f.q).split(/\s+/).filter((w) => w.length > 1).slice(0, 6)) {
      const like = `%${word.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
      where.push(sql`(
        ${plainSql(sql`d.name`)} LIKE ${like} OR ${plainSql(sql`d.summary`)} LIKE ${like}
        OR ${plainSql(sql`array_to_string(d.tags, ' ')`)} LIKE ${like}
        OR ${plainSql(sql`coalesce(ci.name, '')`)} LIKE ${like} OR ${plainSql(sql`coalesce(d.region, '')`)} LIKE ${like}
        OR ${plainSql(sql`co.name`)} LIKE ${like} OR ${plainSql(sql`ca.name`)} LIKE ${like}
      )`);
    }
  }
  if (f.near && f.radiusKm) where.push(sql`ST_DWithin(d.location::geography, ${geog(f.near)}, ${f.radiusKm * 1000})`);

  const distance = f.near ? sql`ST_Distance(d.location::geography, ${geog(f.near)}) / 1000` : sql`NULL::float`;

  const order = (() => {
    switch (f.sort) {
      case "rating":
        return sql`d.rating DESC NULLS LAST, d.review_count DESC, d.popularity DESC`;
      case "nearest":
        return f.near ? sql`distance_km ASC` : sql`d.popularity DESC`;
      case "popular":
        return sql`d.popularity DESC, d.rating DESC NULLS LAST`;
      case "newest":
        return sql`d.created_at DESC, d.id DESC`;
      case "name":
        return sql`d.name ASC`;
      default:
        return sql`d.featured DESC, d.popularity DESC, d.rating DESC NULLS LAST`;
    }
  })();

  const limit = Math.min(Math.max(f.limit ?? 24, 1), 200);
  const offset = Math.max(f.offset ?? 0, 0);

  const rows = await db.execute<Record<string, unknown>>(sql`
    SELECT d.id, d.slug, d.name, d.summary, d.region, d.tags, d.rating, d.review_count, d.price_range,
           d.difficulty, d.best_time_to_visit, d.recommended_duration, d.popularity,
           ST_Y(d.location) AS lat, ST_X(d.location) AS lng,
           co.slug AS country_slug, co.name AS country_name, co.flag AS country_flag,
           ci.slug AS city_slug, ci.name AS city_name,
           ca.slug AS category_slug, ca.name AS category_name, ca.emoji AS category_emoji,
           ${coverImageSql(sql`d.id`)} AS image,
           ${distance} AS distance_km,
           COUNT(*) OVER() AS total
    FROM destinations d
    JOIN countries co ON co.id = d.country_id
    LEFT JOIN cities ci ON ci.id = d.city_id
    JOIN categories ca ON ca.id = d.category_id
    WHERE ${sql.join(where, sql` AND `)}
    ORDER BY ${order}
    LIMIT ${limit} OFFSET ${offset}
  `);

  return { items: rows.map(toCard), total: rows.length ? Number(rows[0].total) : 0 };
}

export function toCard(r: Record<string, unknown>): DestinationCard {
  return {
    id: Number(r.id),
    slug: String(r.slug),
    name: String(r.name),
    summary: String(r.summary),
    country: { slug: String(r.country_slug), name: String(r.country_name), flag: String(r.country_flag) },
    city: r.city_slug ? { slug: String(r.city_slug), name: String(r.city_name) } : null,
    region: (r.region as string) ?? null,
    category: { slug: String(r.category_slug), name: String(r.category_name), emoji: String(r.category_emoji) },
    tags: (r.tags as string[]) ?? [],
    rating: r.rating === null || r.rating === undefined ? null : Number(r.rating),
    reviewCount: Number(r.review_count ?? 0),
    priceRange: (r.price_range as string) ?? null,
    difficulty: (r.difficulty as string) ?? null,
    bestTimeToVisit: (r.best_time_to_visit as string) ?? null,
    recommendedDuration: (r.recommended_duration as string) ?? null,
    popularity: Number(r.popularity ?? 50),
    location: { lat: Number(r.lat), lng: Number(r.lng) },
    image: (r.image as DestinationCard["image"]) ?? null,
    distanceKm: r.distance_km === null || r.distance_km === undefined ? null : Math.round(Number(r.distance_km) * 10) / 10,
  };
}

/** Straight-line distance in km between two points (for trip legs on the server). */
export function haversineKm(a: LatLng, b: LatLng) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

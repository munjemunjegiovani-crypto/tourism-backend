import { Router } from "express";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client.js";
import { coverImageSql, findDestinations } from "../lib/destinations.js";
import { notFound } from "../lib/http-error.js";
import { parse, slugParam } from "../lib/validation.js";

export const catalogRouter = Router();

/* ---------- Categories and activities ---------- */

catalogRouter.get("/categories", async (_req, res) => {
  const rows = await db.execute(sql`
    SELECT c.slug, c.name, c.emoji,
      CASE WHEN c.slug = 'food'
        THEN (SELECT COUNT(DISTINCT da.destination_id)::int FROM destination_activities da JOIN activities a ON a.id = da.activity_id WHERE a.slug = 'local-food')
        ELSE (SELECT COUNT(*)::int FROM destinations d WHERE d.category_id = c.id) END AS "destinationCount"
    FROM categories c ORDER BY c.sort_order`);
  res.json({ data: rows });
});

catalogRouter.get("/activities", async (_req, res) => {
  const rows = await db.execute(sql`
    SELECT a.slug, a.name, a.emoji, a.description, ${coverImageSql(sql`a.cover_destination_id`)} AS image,
           (SELECT COUNT(*)::int FROM destination_activities da WHERE da.activity_id = a.id) AS "destinationCount"
    FROM activities a ORDER BY a.name`);
  res.json({ data: rows });
});

/* ---------- Countries ---------- */

const countrySummarySql = sql`
  co.slug, co.name, co.flag, co.iso_code AS "isoCode", co.africa_region AS "africaRegion", co.tagline,
  co.featured, ST_Y(co.location) AS lat, ST_X(co.location) AS lng,
  (SELECT COUNT(*)::int FROM destinations d WHERE d.country_id = co.id) AS "destinationCount",
  (SELECT ${coverImageSql(sql`d.id`)} FROM destinations d
     WHERE d.country_id = co.id AND EXISTS (SELECT 1 FROM images i WHERE i.owner_type = 'destination' AND i.owner_id = d.id)
     ORDER BY d.featured DESC, d.popularity DESC LIMIT 1) AS image`;

// GET /countries?featured=true&region=East
catalogRouter.get("/countries", async (req, res) => {
  const q = parse(z.object({ featured: z.enum(["true", "false"]).optional(), region: z.string().max(20).optional() }), req.query);
  const rows = await db.execute(sql`
    SELECT ${countrySummarySql} FROM countries co
    WHERE ${q.featured === "true" ? sql`co.featured` : sql`TRUE`}
      AND ${q.region ? sql`co.africa_region = ${q.region}` : sql`TRUE`}
    ORDER BY co.sort_order, co.name`);
  res.json({ data: rows.map(withLocation) });
});

// GET /countries/:slug — everything for the country page
catalogRouter.get("/countries/:slug", async (req, res) => {
  const { slug } = parse(slugParam, req.params);
  const [country] = await db.execute<Record<string, unknown>>(sql`
    SELECT ${countrySummarySql}, co.id, co.intro, co.capital, co.currency, co.languages,
      co.best_time_to_visit AS "bestTimeToVisit", co.recommended_duration AS "recommendedDuration",
      co.budget, co.culture, co.cuisine, co.travel_tips AS "travelTips", co.safety
    FROM countries co WHERE co.slug = ${slug}`);
  if (!country) throw notFound("Country");

  const [destinations, cities, experiences, articles] = await Promise.all([
    findDestinations({ country: [slug], limit: 100 }),
    db.execute(sql`
      SELECT ci.slug, ci.name, ci.region, ci.popular, ST_Y(ci.location) AS lat, ST_X(ci.location) AS lng,
             (SELECT COUNT(*)::int FROM destinations d WHERE d.city_id = ci.id) AS "destinationCount"
      FROM cities ci WHERE ci.country_id = ${country.id}
      ORDER BY ci.popular DESC, ci.name`),
    db.execute(sql`
      SELECT e.slug, e.name, e.emoji, e.tagline, e.sort_order, ${coverImageSql(sql`e.cover_destination_id`)} AS image
      FROM experiences e
      WHERE EXISTS (SELECT 1 FROM experience_destinations ed JOIN destinations d ON d.id = ed.destination_id
                    WHERE ed.experience_id = e.id AND d.country_id = ${country.id})
      ORDER BY e.sort_order`),
    db.execute(sql`SELECT slug, title, emoji, summary FROM articles WHERE country_id = ${country.id}`),
  ]);

  const { id: _id, ...rest } = country;
  res.json({
    data: {
      ...withLocation(rest),
      destinations: destinations.items,
      cities: cities.map(withLocation),
      experiences: experiences.map(({ sort_order: _s, ...e }) => e),
      articles,
    },
  });
});

/* ---------- Experiences ---------- */

const experienceSummarySql = sql`
  e.slug, e.name, e.emoji, e.tagline, e.typical_duration AS "typicalDuration", e.price_from AS "priceFrom",
  ${coverImageSql(sql`e.cover_destination_id`)} AS image,
  (SELECT COUNT(*)::int FROM experience_destinations ed WHERE ed.experience_id = e.id) AS "destinationCount"`;

catalogRouter.get("/experiences", async (_req, res) => {
  const rows = await db.execute(sql`SELECT ${experienceSummarySql} FROM experiences e ORDER BY e.sort_order`);
  res.json({ data: rows });
});

catalogRouter.get("/experiences/:slug", async (req, res) => {
  const { slug } = parse(slugParam, req.params);
  const [exp] = await db.execute<Record<string, unknown>>(sql`
    SELECT e.id, ${experienceSummarySql}, e.description, e.highlights, e.best_time_to_visit AS "bestTimeToVisit"
    FROM experiences e WHERE e.slug = ${slug}`);
  if (!exp) throw notFound("Experience");
  const ids = (
    await db.execute<{ destination_id: number }>(sql`SELECT destination_id FROM experience_destinations WHERE experience_id = ${exp.id}`)
  ).map((r) => r.destination_id);
  const destinations = await findDestinations({ ids, limit: 50, sort: "popular" });
  const others = await db.execute(sql`SELECT ${experienceSummarySql} FROM experiences e WHERE e.slug <> ${slug} ORDER BY e.sort_order LIMIT 4`);
  const { id: _id, ...rest } = exp;
  res.json({
    data: {
      ...rest,
      destinations: destinations.items,
      countries: [...new Map(destinations.items.map((d) => [d.country.slug, d.country])).values()],
      related: others,
    },
  });
});

/* ---------- Travel guide ---------- */

const articleSummarySql = sql`
  a.slug, a.section, a.title, a.emoji, a.summary, a.reading_minutes AS "readingMinutes", a.published_at AS "publishedAt",
  ${coverImageSql(sql`a.cover_destination_id`)} AS image,
  (SELECT json_build_object('slug', c.slug, 'name', c.name, 'flag', c.flag) FROM countries c WHERE c.id = a.country_id) AS country`;

catalogRouter.get("/articles", async (req, res) => {
  const { section } = parse(z.object({ section: z.enum(["essentials", "tips"]).optional() }), req.query);
  const rows = await db.execute(sql`
    SELECT ${articleSummarySql} FROM articles a
    WHERE ${section ? sql`a.section = ${section}` : sql`TRUE`}
    ORDER BY a.sort_order`);
  res.json({ data: rows });
});

catalogRouter.get("/articles/:slug", async (req, res) => {
  const { slug } = parse(slugParam, req.params);
  const [article] = await db.execute<Record<string, unknown> & { body: { type: string; slugs?: string[] }[] }>(sql`
    SELECT ${articleSummarySql}, a.body FROM articles a WHERE a.slug = ${slug}`);
  if (!article) throw notFound("Article");
  // Resolve destination blocks into cards
  const slugs = article.body.flatMap((b) => (b.type === "destinations" ? (b.slugs ?? []) : []));
  const cards = slugs.length ? (await findDestinations({ slugs, limit: 50 })).items : [];
  const related = await db.execute(sql`
    SELECT ${articleSummarySql} FROM articles a WHERE a.slug <> ${slug} AND a.section = ${article.section}
    ORDER BY a.sort_order LIMIT 3`);
  res.json({ data: { ...article, destinations: cards, related } });
});

function withLocation<T extends Record<string, unknown>>(row: T) {
  const { lat, lng, ...rest } = row as T & { lat: unknown; lng: unknown };
  return { ...rest, location: { lat: Number(lat), lng: Number(lng) } };
}

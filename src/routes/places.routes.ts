import { Router } from "express";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client.js";
import { categories, cities, countries, regions } from "../db/schema.js";
import { notFound } from "../lib/http-error.js";
import { parse, slugParam } from "../lib/validation.js";

export const placesRouter = Router();

// GET /countries
placesRouter.get("/countries", async (_req, res) => {
  const rows = await db
    .select({
      slug: countries.slug,
      isoCode: countries.isoCode,
      nameEn: countries.nameEn,
      nameFr: countries.nameFr,
      currency: countries.currency,
    })
    .from(countries)
    .orderBy(asc(countries.nameEn));
  res.json({ data: rows });
});

// GET /countries/:slug/regions
placesRouter.get("/countries/:slug/regions", async (req, res) => {
  const { slug } = parse(slugParam, req.params);
  const [country] = await db.select({ id: countries.id }).from(countries).where(eq(countries.slug, slug));
  if (!country) throw notFound("Country");

  const rows = await db
    .select({ slug: regions.slug, nameEn: regions.nameEn, nameFr: regions.nameFr })
    .from(regions)
    .where(eq(regions.countryId, country.id))
    .orderBy(asc(regions.nameEn));
  res.json({ data: rows });
});

// GET /regions/:slug/cities
placesRouter.get("/regions/:slug/cities", async (req, res) => {
  const { slug } = parse(slugParam, req.params);
  const [region] = await db.select({ id: regions.id }).from(regions).where(eq(regions.slug, slug));
  if (!region) throw notFound("Region");

  const rows = await db
    .select({ slug: cities.slug, name: cities.name, location: cities.location })
    .from(cities)
    .where(eq(cities.regionId, region.id))
    .orderBy(asc(cities.name));
  res.json({
    data: rows.map(({ location, ...c }) => ({ ...c, location: { lat: location.y, lng: location.x } })),
  });
});

// GET /categories?type=attraction|business
placesRouter.get("/categories", async (req, res) => {
  const { type } = parse(z.object({ type: z.enum(["attraction", "business"]).optional() }), req.query);
  const rows = await db
    .select({
      type: categories.type,
      slug: categories.slug,
      nameEn: categories.nameEn,
      nameFr: categories.nameFr,
      icon: categories.icon,
    })
    .from(categories)
    .where(type ? eq(categories.type, type) : undefined)
    .orderBy(asc(categories.nameEn));
  res.json({ data: rows });
});

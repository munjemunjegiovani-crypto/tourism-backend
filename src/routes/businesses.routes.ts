import { Router } from "express";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client.js";
import { businesses, categories, cities, countries, regions } from "../db/schema.js";
import { notFound } from "../lib/http-error.js";
import { page, paginationSchema, parse, slugParam } from "../lib/validation.js";
import { byId, listWhere, placeColumns, toLatLng } from "./shared.js";

export const businessesRouter = Router();

const filterSlug = z.string().regex(/^[a-z0-9-]+$/).optional();
const listQuery = paginationSchema.extend({
  country: filterSlug,
  region: filterSlug,
  city: filterSlug,
  category: filterSlug,
  q: z.string().trim().min(1).max(80).optional(),
});

const baseSelect = {
  id: businesses.id,
  slug: businesses.slug,
  name: businesses.name,
  priceRange: businesses.priceRange,
  plan: businesses.plan,
  verified: businesses.verified,
  coverImageUrl: businesses.coverImageUrl,
  affiliateUrl: businesses.affiliateUrl,
  website: businesses.website,
  location: businesses.location,
  ...placeColumns,
};

type Row = { slug: string; plan: string; affiliateUrl: string | null; website: string | null; location: { x: number; y: number } };

/** Public shape: never expose the raw affiliate URL, only our tracked redirect. */
function present<T extends Row>(r: T, src: string) {
  const { affiliateUrl, website, plan, location, ...rest } = r;
  return {
    ...rest,
    website,
    sponsored: plan !== "free",
    location: toLatLng(location),
    bookUrl: affiliateUrl || website ? `/api/v1/go/${r.slug}?src=${src}` : null,
  };
}

const detailSelect = {
  ...baseSelect,
  description: businesses.description,
  address: businesses.address,
  phone: businesses.phone,
  email: businesses.email,
  amenities: businesses.amenities,
};

// GET /businesses?country=&region=&city=&category=&q=&limit=&cursor=
businessesRouter.get("/businesses", async (req, res) => {
  const query = parse(listQuery, req.query);
  const rows = await db
    .select(baseSelect)
    .from(businesses)
    .innerJoin(cities, eq(businesses.cityId, cities.id))
    .innerJoin(regions, eq(cities.regionId, regions.id))
    .innerJoin(countries, eq(regions.countryId, countries.id))
    .innerJoin(categories, eq(businesses.categoryId, categories.id))
    .where(listWhere(businesses, query))
    .orderBy(byId(businesses))
    .limit(query.limit + 1);

  const { data, nextCursor } = page(rows, query.limit);
  res.json({ data: data.map((r) => present(r, "list")), nextCursor });
});

// GET /businesses/:slug
businessesRouter.get("/businesses/:slug", async (req, res) => {
  const { slug } = parse(slugParam, req.params);
  const [row] = await db
    .select(detailSelect)
    .from(businesses)
    .innerJoin(cities, eq(businesses.cityId, cities.id))
    .innerJoin(regions, eq(cities.regionId, regions.id))
    .innerJoin(countries, eq(regions.countryId, countries.id))
    .innerJoin(categories, eq(businesses.categoryId, categories.id))
    .where(and(eq(businesses.slug, slug), eq(businesses.status, "published")));

  if (!row) throw notFound("Business");
  res.json({ data: present(row, "business") });
});

import { and, eq, gt, ilike, asc, type SQL } from "drizzle-orm";
import { attractions, businesses, categories, cities, countries, regions } from "../db/schema.js";

/** Columns shared by attraction and business list queries: where the listing sits. */
export const placeColumns = {
  city: { slug: cities.slug, name: cities.name },
  region: { slug: regions.slug, nameEn: regions.nameEn, nameFr: regions.nameFr },
  country: { slug: countries.slug, nameEn: countries.nameEn, nameFr: countries.nameFr },
  category: { slug: categories.slug, nameEn: categories.nameEn, nameFr: categories.nameFr, icon: categories.icon },
};

export type ListFilters = {
  country?: string;
  region?: string;
  city?: string;
  category?: string;
  q?: string;
  cursor?: number;
};

/** Builds the WHERE clause for list endpoints. `table` is attractions or businesses. */
export function listWhere(table: typeof attractions | typeof businesses, f: ListFilters) {
  const conditions: (SQL | undefined)[] = [
    eq(table.status, "published"),
    f.country ? eq(countries.slug, f.country) : undefined,
    f.region ? eq(regions.slug, f.region) : undefined,
    f.city ? eq(cities.slug, f.city) : undefined,
    f.category ? eq(categories.slug, f.category) : undefined,
    f.q ? ilike(table.name, `%${escapeLike(f.q)}%`) : undefined,
    f.cursor ? gt(table.id, f.cursor) : undefined,
  ];
  return and(...conditions);
}

/** Escape LIKE wildcards so a search for "50%" matches literally. */
const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

export const byId =(table: typeof attractions | typeof businesses) => asc(table.id);

export const toLatLng = (p: { x: number; y: number }) => ({ lat: p.y, lng: p.x });

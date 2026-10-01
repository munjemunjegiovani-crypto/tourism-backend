import { Router } from "express";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client.js";
import { findDestinations, normalize, type DestinationFilters } from "../lib/destinations.js";
import { allPlaces, parseSearch, type ParsedSearch } from "../lib/search-parse.js";
import { parse } from "../lib/validation.js";
import { destinationQuery, toFilters } from "./destinations.routes.js";

export const searchRouter = Router();

/** Turn the parsed phrase into destination filters. Explicit filters from the page win. */
function filtersFor(p: ParsedSearch): DestinationFilters {
  const f: DestinationFilters = {};
  if (p.type?.category) f.category = [p.type.category];
  if (p.type?.tag) f.tag = p.type.tag;
  if (p.place) {
    if (p.place.kind === "country" && p.relation === "in") f.country = [p.place.slug];
    else {
      f.near = p.place.location;
      // Search around a city/destination, or across a whole country when asked "near Kenya"
      f.radiusKm = p.place.kind === "country" ? 800 : p.type ? 200 : 150;
      if (!p.type) f.sort = "nearest";
    }
  }
  if (p.text) f.q = p.text;
  return f;
}

// GET /search?q=waterfalls near Douala&sort=&minRating=…
searchRouter.get("/search", async (req, res) => {
  const q = parse(destinationQuery.extend({ q: z.string().trim().max(100).default("") }), req.query);
  const parsed = await parseSearch(q.q);
  const page = toFilters(q);
  delete page.q;
  const filters: DestinationFilters = { ...filtersFor(parsed), ...stripEmpty(page) };
  // Things to do: activities around the place
  const thingsToDo = parsed.intent === "things-to-do" && parsed.place ? await activitiesNear(filtersFor(parsed)) : [];

  let result = parsed.type?.placeKind ? { items: [], total: 0 } : await findDestinations(filters);
  // A place on its own ("Kenya") shows its destinations; nothing found → fall back to a plain text search
  if (result.total === 0 && !parsed.type?.placeKind && q.q && !parsed.place) {
    result = await findDestinations({ ...stripEmpty(page), q: q.q });
  }

  const places =
    parsed.type?.placeKind && parsed.place
      ? await db.execute(sql`
          SELECT p.slug, p.name, p.kind, p.rating::float AS rating, p.price_range AS "priceRange", p.is_demo AS "isDemo",
                 ci.name AS city, co.name AS country,
                 ROUND((ST_Distance(p.location::geography, ST_SetSRID(ST_MakePoint(${parsed.place.location.lng}, ${parsed.place.location.lat}), 4326)::geography) / 1000)::numeric, 1)::float AS "distanceKm"
          FROM places p JOIN countries co ON co.id = p.country_id LEFT JOIN cities ci ON ci.id = p.city_id
          WHERE p.kind = ${parsed.type.placeKind}
            AND ${parsed.place.kind === "country" ? sql`co.slug = ${parsed.place.slug}` : sql`ST_DWithin(p.location::geography, ST_SetSRID(ST_MakePoint(${parsed.place.location.lng}, ${parsed.place.location.lat}), 4326)::geography, 60000)`}
          ORDER BY "distanceKm" LIMIT 30`)
      : [];

  res.json({
    data: result.items,
    total: result.total,
    places,
    thingsToDo,
    interpretation: {
      intent: parsed.intent,
      type: parsed.type ? { label: parsed.type.label, category: parsed.type.category, placeKind: parsed.type.placeKind } : null,
      place: parsed.place ? { kind: parsed.place.kind, slug: parsed.place.slug, name: parsed.place.name, countrySlug: parsed.place.countrySlug } : null,
      relation: parsed.relation ?? null,
      text: parsed.text ?? null,
    },
  });
});

async function activitiesNear(f: DestinationFilters) {
  const near = f.near ? sql`ST_DWithin(d.location::geography, ST_SetSRID(ST_MakePoint(${f.near.lng}, ${f.near.lat}), 4326)::geography, ${(f.radiusKm ?? 150) * 1000})` : sql`TRUE`;
  const country = f.country?.length ? sql`co.slug = ${f.country[0]}` : sql`TRUE`;
  return db.execute(sql`
    SELECT a.slug, a.name, a.emoji, a.description,
           json_agg(json_build_object('slug', d.slug, 'name', d.name, 'note', da.note) ORDER BY d.popularity DESC) AS destinations
    FROM activities a
    JOIN destination_activities da ON da.activity_id = a.id
    JOIN destinations d ON d.id = da.destination_id
    JOIN countries co ON co.id = d.country_id
    WHERE ${near} AND ${country}
    GROUP BY a.id ORDER BY COUNT(*) DESC, a.name`);
}

const stripEmpty = <T extends object>(o: T) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== false && !(Array.isArray(v) && !v.length))) as T;

// GET /search/suggest?q=ken → countries, cities, destinations, experiences
searchRouter.get("/search/suggest", async (req, res) => {
  const { q } = parse(z.object({ q: z.string().trim().min(1).max(60) }), req.query);
  const term = normalize(q);
  const places = await allPlaces();
  const score = (name: string) => {
    const n = normalize(name);
    return n === term ? 0 : n.startsWith(term) ? 1 : n.includes(` ${term}`) ? 2 : n.includes(term) ? 3 : 9;
  };
  const kindOrder = { country: 0, city: 1, destination: 2 } as const;
  const matches = places
    .map((p) => ({ p, s: score(p.name) }))
    .filter((x) => x.s < 9)
    .sort((a, b) => a.s - b.s || kindOrder[a.p.kind] - kindOrder[b.p.kind] || a.p.name.length - b.p.name.length)
    .slice(0, 8)
    .map(({ p }) => p);

  const countryNames = new Map(places.filter((p) => p.kind === "country").map((p) => [p.slug, p.name]));
  const items: { type: string; slug: string; label: string; sublabel: string; countrySlug: string }[] = matches.map((p) => ({
    type: p.kind,
    slug: p.slug,
    label: p.name,
    sublabel: p.kind === "country" ? "Country" : `${p.kind === "city" ? "City" : "Destination"} in ${countryNames.get(p.countrySlug)}`,
    countrySlug: p.countrySlug,
  }));

  // Typing a country name suggests its popular cities and top destinations (e.g. Kenya → Nairobi, Maasai Mara…)
  const country = matches.find((p) => p.kind === "country" && score(p.name) <= 1);
  if (country) {
    const extra = await db.execute<{ type: string; slug: string; label: string }>(sql`
      (SELECT 'city' AS type, ci.slug, ci.name AS label FROM cities ci JOIN countries co ON co.id = ci.country_id
        WHERE co.slug = ${country.slug} AND ci.popular ORDER BY ci.name LIMIT 2)
      UNION ALL
      (SELECT 'destination', d.slug, d.name FROM destinations d JOIN countries co ON co.id = d.country_id
        WHERE co.slug = ${country.slug} ORDER BY d.popularity DESC LIMIT 5)`);
    for (const e of extra) {
      if (items.some((i) => i.slug === e.slug && i.type === e.type)) continue;
      items.push({
        type: e.type,
        slug: e.slug,
        label: e.label,
        sublabel: `${e.type === "city" ? "City" : "Destination"} in ${country.name}`,
        countrySlug: country.slug,
      });
    }
  }

  const experiences = await db.execute<{ slug: string; name: string }>(sql`
    SELECT slug, name FROM experiences WHERE lower(name) LIKE ${`%${term.replace(/[\\%_]/g, "")}%`} LIMIT 2`);
  for (const e of experiences) items.push({ type: "experience", slug: e.slug, label: e.name, sublabel: "Experience", countrySlug: "" });

  res.json({ data: items.slice(0, 10) });
});

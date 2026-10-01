/**
 * Loads the Africa Discover sample content into PostgreSQL.
 *   npm run db:seed
 *
 * Safe to run again: content is upserted by slug, so user accounts, favourites and trips stay.
 * At the end it tries to fetch real photos (see images.ts); without internet it skips that step.
 */
import { eq, sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn, PgTable } from "drizzle-orm/pg-core";
import { db, sqlClient } from "./client.js";
import * as s from "./schema.js";
import { categoriesData, activitiesData } from "./data/taxonomy.js";
import { countriesData } from "./data/countries.js";
import { cameroonDestinations } from "./data/destinations-cameroon.js";
import { eastNorthDestinations } from "./data/destinations-east-north.js";
import { westSouthDestinations } from "./data/destinations-west-south.js";
import { experiencesData } from "./data/experiences.js";
import { articlesData } from "./data/articles.js";
import { realPlaces, demoPlacesFor } from "./data/places.js";
import { sampleReviewsFor } from "./data/reviews.js";
import { commonsImage, resolveImages } from "./images.js";
import { refreshRatings } from "../lib/ratings.js";

export const allDestinations = [...cameroonDestinations, ...eastNorthDestinations, ...westSouthDestinations];

const pt = (lat: number, lng: number) => ({ x: lng, y: lat });
const toSnake = (k: string) => k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

/** Insert rows, updating existing ones that share the same slug. Returns slug → id. */
async function upsert<T extends Record<string, unknown> & { slug: string }>(
  table: PgTable & { slug: AnyPgColumn; id: AnyPgColumn },
  rows: T[],
): Promise<Map<string, number>> {
  if (rows.length === 0) return new Map();
  const keys = Object.keys(rows[0]).filter((k) => k !== "slug");
  const set = Object.fromEntries(keys.map((k) => [k, sql.raw(`excluded."${toSnake(k)}"`)])) as Record<string, SQL>;
  const result = (await db
    .insert(table)
    .values(rows as never)
    .onConflictDoUpdate({ target: table.slug, set })
    .returning({ id: table.id, slug: table.slug })) as { id: number; slug: string }[];
  return new Map(result.map((r) => [r.slug, r.id]));
}

function need(map: Map<string, number>, slug: string, what: string) {
  const id = map.get(slug);
  if (id === undefined) throw new Error(`Unknown ${what} "${slug}"`);
  return id;
}

async function main() {
  console.log("Seeding Africa Discover…");

  // Categories
  const categoryIds = await upsert(
    s.categories,
    categoriesData.map((c, i) => ({ ...c, sortOrder: i })),
  );

  // Countries and cities
  const countryIds = await upsert(
    s.countries,
    countriesData.map((c) => ({
      slug: c.slug,
      isoCode: c.iso,
      name: c.name,
      flag: c.flag,
      africaRegion: c.africaRegion,
      tagline: c.tagline,
      intro: c.intro,
      capital: c.capital,
      currency: c.currency,
      languages: c.languages,
      bestTimeToVisit: c.bestTime,
      recommendedDuration: c.duration,
      budget: c.budget,
      culture: c.culture || null,
      cuisine: c.cuisine,
      travelTips: c.tips,
      safety: c.safety,
      featured: c.featured ?? false,
      sortOrder: c.sortOrder ?? 100,
      location: pt(c.lat, c.lng),
    })),
  );
  const cityIds = await upsert(
    s.cities,
    countriesData.flatMap((c) =>
      c.cities.map((city) => ({
        slug: city.slug,
        countryId: need(countryIds, c.slug, "country"),
        name: city.name,
        region: city.region ?? null,
        popular: city.popular ?? false,
        location: pt(city.lat, city.lng),
      })),
    ),
  );

  // Destinations
  const destinationIds = await upsert(
    s.destinations,
    allDestinations.map((d) => ({
      slug: d.slug,
      countryId: need(countryIds, d.country, "country"),
      cityId: d.city ? need(cityIds, d.city, "city") : null,
      categoryId: need(categoryIds, d.category, "category"),
      name: d.name,
      region: countriesData.find((c) => c.slug === d.country)?.cities.find((c) => c.slug === d.city)?.region ?? null,
      tags: d.tags ?? [],
      summary: d.summary,
      description: d.description,
      highlights: d.highlights ?? [],
      location: pt(d.lat, d.lng),
      openingHours: d.openingHours ?? null,
      priceRange: d.priceRange ?? null,
      budget: d.budget ?? null,
      bestTimeToVisit: d.bestTime ?? null,
      bestMonths: d.bestMonths ?? null,
      recommendedDuration: d.duration ?? null,
      difficulty: d.difficulty ?? null,
      popularity: d.popularity ?? 50,
      featured: d.featured ?? false,
      wikiTitle: d.wiki ?? null,
    })),
  );
  const destId = (slug: string) => need(destinationIds, slug, "destination");

  // Hand-picked Commons photos go first (position 0); resolver adds more later
  for (const d of allDestinations) {
    for (const [i, file] of (d.photos ?? []).entries()) {
      await db
        .insert(s.images)
        .values({ ownerType: "destination", ownerId: destId(d.slug), position: i, ...commonsImage(file, d.name) })
        .onConflictDoNothing();
    }
  }

  // Activities
  const activityIds = await upsert(
    s.activities,
    activitiesData.map(({ cover, ...a }) => ({ ...a, coverDestinationId: destinationIds.get(cover) ?? null })),
  );
  await db.delete(s.destinationActivities);
  await db.insert(s.destinationActivities).values(
    allDestinations.flatMap((d) =>
      (d.activities ?? []).map((a) => {
        const [slug, note] = Array.isArray(a) ? a : [a, null];
        return { destinationId: destId(d.slug), activityId: need(activityIds, slug, "activity"), note };
      }),
    ),
  );

  // Experiences
  const experienceIds = await upsert(
    s.experiences,
    experiencesData.map((e, i) => ({
      slug: e.slug,
      name: e.name,
      emoji: e.emoji,
      tagline: e.tagline,
      description: e.description,
      highlights: e.highlights,
      typicalDuration: e.duration,
      priceFrom: e.priceFrom,
      bestTimeToVisit: e.bestTime,
      coverDestinationId: destinationIds.get(e.cover) ?? null,
      sortOrder: i,
    })),
  );
  await db.delete(s.experienceDestinations);
  await db.insert(s.experienceDestinations).values(
    experiencesData.flatMap((e) =>
      e.destinations.map((slug) => ({ experienceId: need(experienceIds, e.slug, "experience"), destinationId: destId(slug) })),
    ),
  );

  // Places: real airports and markets + demo hotels and restaurants
  const placeRows = [...realPlaces, ...demoPlacesFor(allDestinations)];
  await upsert(
    s.places,
    placeRows.map((p) => ({
      slug: p.slug,
      kind: p.kind,
      countryId: need(countryIds, p.country, "country"),
      cityId: p.city ? need(cityIds, p.city, "city") : null,
      name: p.name,
      description: p.description,
      location: pt(p.lat, p.lng),
      rating: p.rating ?? null,
      priceRange: p.priceRange ?? null,
      website: p.website ?? null,
      isDemo: p.isDemo ?? false,
      plan: p.plan ?? "free",
    })),
  );

  // Articles
  await upsert(
    s.articles,
    articlesData.map((a, i) => ({
      slug: a.slug,
      section: a.section,
      title: a.title,
      emoji: a.emoji,
      summary: a.summary,
      body: a.body,
      readingMinutes: a.readingMinutes,
      countryId: a.country ? need(countryIds, a.country, "country") : null,
      coverDestinationId: a.cover ? (destinationIds.get(a.cover) ?? null) : null,
      sortOrder: i,
    })),
  );

  // Sample reviews (replaced each run; real reviews are kept), then ratings
  await db.delete(s.reviews).where(eq(s.reviews.isSample, true));
  await db.insert(s.reviews).values(
    allDestinations.flatMap((d) => sampleReviewsFor(d).map((r) => ({ ...r, destinationId: destId(d.slug), isSample: true }))),
  );
  await refreshRatings();

  console.log(
    `Seeded ${countriesData.length} countries, ${cityIds.size} cities, ${allDestinations.length} destinations, ` +
      `${activitiesData.length} activities, ${experiencesData.length} experiences, ${placeRows.length} places, ${articlesData.length} articles.`,
  );

  // Real photos from Wikipedia/Commons (needs internet; safe to skip)
  try {
    await resolveImages({ quiet: false });
  } catch (err) {
    console.warn("Skipped photo download:", (err as Error).message);
    console.warn("Run `npm run db:images` later when you're online.");
  }
}

// Only run when called directly (not when imported by another script)
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    })
    .finally(() => sqlClient.end());
}

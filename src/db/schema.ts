/**
 * Africa Discover database schema (PostgreSQL + PostGIS).
 *
 * Locations are PostGIS points in WGS84 (srid 4326), mode "xy": x = longitude, y = latitude.
 * After editing this file run `npm run db:generate` to create a migration.
 */
import {
  pgTable,
  pgEnum,
  serial,
  integer,
  text,
  varchar,
  boolean,
  jsonb,
  numeric,
  timestamp,
  geometry,
  index,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";

const point = (name: string) => geometry(name, { type: "point", mode: "xy", srid: 4326 });

const createdAt = timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const difficultyEnum = pgEnum("difficulty", ["easy", "moderate", "difficult"]);
export const placeKindEnum = pgEnum("place_kind", ["hotel", "restaurant", "shopping", "transport"]);
export const imageOwnerEnum = pgEnum("image_owner", ["destination", "place"]);
export const favoriteKindEnum = pgEnum("favorite_kind", ["destination", "experience", "place"]);
export const favoriteListEnum = pgEnum("favorite_list", ["saved", "visited"]);
export const planEnum = pgEnum("listing_plan", ["free", "pro", "premium"]);

/* ---------- Geography ---------- */

export const countries = pgTable("countries", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  isoCode: varchar("iso_code", { length: 2 }).notNull().unique(),
  name: text("name").notNull(),
  flag: varchar("flag", { length: 16 }).notNull(),
  africaRegion: varchar("africa_region", { length: 40 }).notNull(), // East, West, Southern, North, Central, Indian Ocean
  tagline: text("tagline").notNull(),
  intro: text("intro").notNull(),
  capital: text("capital"),
  currency: text("currency"),
  languages: text("languages").array(),
  bestTimeToVisit: text("best_time_to_visit"),
  recommendedDuration: text("recommended_duration"),
  budget: text("budget"),
  culture: text("culture"),
  cuisine: jsonb("cuisine").$type<{ name: string; description: string }[]>(),
  travelTips: jsonb("travel_tips").$type<string[]>(),
  safety: text("safety"),
  featured: boolean("featured").notNull().default(false), // shown in "popular countries"
  sortOrder: integer("sort_order").notNull().default(100),
  location: point("location").notNull(), // map centre
  createdAt,
  updatedAt,
});

export const cities = pgTable(
  "cities",
  {
    id: serial("id").primaryKey(),
    countryId: integer("country_id")
      .notNull()
      .references(() => countries.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 120 }).notNull().unique(),
    name: text("name").notNull(),
    region: text("region"), // province / state
    popular: boolean("popular").notNull().default(false),
    location: point("location").notNull(),
  },
  (t) => [index("cities_country_idx").on(t.countryId), index("cities_location_gist").using("gist", t.location)],
);

/* ---------- Destinations ---------- */

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 40 }).notNull().unique(),
  name: text("name").notNull(),
  emoji: varchar("emoji", { length: 16 }).notNull(),
  sortOrder: integer("sort_order").notNull().default(100),
});

export const destinations = pgTable(
  "destinations",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 140 }).notNull().unique(),
    countryId: integer("country_id")
      .notNull()
      .references(() => countries.id, { onDelete: "cascade" }),
    cityId: integer("city_id").references(() => cities.id, { onDelete: "set null" }),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id),
    name: text("name").notNull(),
    region: text("region"),
    // Extra search words, e.g. ["waterfall"], ["national-park"], ["museum"], ["island"]
    tags: text("tags").array().notNull().default([]),
    summary: text("summary").notNull(),
    description: text("description").notNull(),
    highlights: jsonb("highlights").$type<string[]>(),
    location: point("location").notNull(),
    rating: numeric("rating", { precision: 2, scale: 1, mode: "number" }),
    reviewCount: integer("review_count").notNull().default(0),
    openingHours: text("opening_hours"),
    priceRange: varchar("price_range", { length: 8 }), // Free, $, $$, $$$
    budget: text("budget"),
    bestTimeToVisit: text("best_time_to_visit"),
    bestMonths: integer("best_months").array(), // 1–12, for the "best time" filter
    recommendedDuration: text("recommended_duration"),
    difficulty: difficultyEnum("difficulty"),
    popularity: integer("popularity").notNull().default(50), // 0–100, for "most popular"
    featured: boolean("featured").notNull().default(false),
    // Wikipedia article used by `npm run db:images` to find real photos
    wikiTitle: text("wiki_title"),
    createdAt,
    updatedAt,
  },
  (t) => [
    index("destinations_country_idx").on(t.countryId),
    index("destinations_city_idx").on(t.cityId),
    index("destinations_category_idx").on(t.categoryId),
    index("destinations_location_gist").using("gist", t.location),
  ],
);

/** Photos for destinations and places. Credit is required by Creative Commons licences. */
export const images = pgTable(
  "images",
  {
    id: serial("id").primaryKey(),
    ownerType: imageOwnerEnum("owner_type").notNull(),
    ownerId: integer("owner_id").notNull(),
    url: text("url").notNull(),
    alt: text("alt").notNull(),
    credit: text("credit"),
    license: text("license"),
    sourceUrl: text("source_url"),
    position: integer("position").notNull().default(0),
  },
  (t) => [
    index("images_owner_idx").on(t.ownerType, t.ownerId, t.position),
    uniqueIndex("images_owner_url_uq").on(t.ownerType, t.ownerId, t.url),
  ],
);

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  name: text("name").notNull(),
  emoji: varchar("emoji", { length: 16 }).notNull(),
  description: text("description").notNull(),
  coverDestinationId: integer("cover_destination_id").references(() => destinations.id, { onDelete: "set null" }),
});

export const destinationActivities = pgTable(
  "destination_activities",
  {
    destinationId: integer("destination_id")
      .notNull()
      .references(() => destinations.id, { onDelete: "cascade" }),
    activityId: integer("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    note: text("note"), // destination-specific detail, e.g. "Two-day guided climb to the summit"
  },
  (t) => [primaryKey({ columns: [t.destinationId, t.activityId] })],
);

export const experiences = pgTable("experiences", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  name: text("name").notNull(),
  emoji: varchar("emoji", { length: 16 }).notNull(),
  tagline: text("tagline").notNull(),
  description: text("description").notNull(),
  highlights: jsonb("highlights").$type<string[]>(),
  typicalDuration: text("typical_duration"),
  priceFrom: text("price_from"),
  bestTimeToVisit: text("best_time_to_visit"),
  coverDestinationId: integer("cover_destination_id").references(() => destinations.id, { onDelete: "set null" }),
  sortOrder: integer("sort_order").notNull().default(100),
});

export const experienceDestinations = pgTable(
  "experience_destinations",
  {
    experienceId: integer("experience_id")
      .notNull()
      .references(() => experiences.id, { onDelete: "cascade" }),
    destinationId: integer("destination_id")
      .notNull()
      .references(() => destinations.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.experienceId, t.destinationId] })],
);

/* ---------- Places: hotels, restaurants, shopping, transport ---------- */

export const places = pgTable(
  "places",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 140 }).notNull().unique(),
    kind: placeKindEnum("kind").notNull(),
    cityId: integer("city_id").references(() => cities.id, { onDelete: "set null" }),
    countryId: integer("country_id")
      .notNull()
      .references(() => countries.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    location: point("location").notNull(),
    rating: numeric("rating", { precision: 2, scale: 1, mode: "number" }),
    priceRange: varchar("price_range", { length: 8 }),
    website: text("website"),
    affiliateUrl: text("affiliate_url"),
    phone: varchar("phone", { length: 40 }),
    isDemo: boolean("is_demo").notNull().default(false), // fictional sample listing
    plan: planEnum("plan").notNull().default("free"),
    createdAt,
  },
  (t) => [index("places_kind_idx").on(t.kind), index("places_location_gist").using("gist", t.location)],
);

export const affiliateClicks = pgTable(
  "affiliate_clicks",
  {
    id: serial("id").primaryKey(),
    placeId: integer("place_id")
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
    userId: integer("user_id"),
    sourcePage: varchar("source_page", { length: 80 }),
    ipHash: varchar("ip_hash", { length: 64 }),
    createdAt,
  },
  (t) => [index("affiliate_clicks_place_idx").on(t.placeId, t.createdAt)],
);

/* ---------- Users ---------- */

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: varchar("email", { length: 200 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  avatarUrl: text("avatar_url"),
  homeCity: text("home_city"),
  createdAt,
  updatedAt,
});

/** Login sessions. Only a SHA-256 hash of the token is stored. */
export const sessions = pgTable(
  "sessions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt,
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const reviews = pgTable(
  "reviews",
  {
    id: serial("id").primaryKey(),
    destinationId: integer("destination_id")
      .notNull()
      .references(() => destinations.id, { onDelete: "cascade" }),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    authorName: text("author_name").notNull(),
    authorCountry: text("author_country"),
    rating: integer("rating").notNull(), // 1–5
    title: text("title"),
    body: text("body").notNull(),
    visitedOn: text("visited_on"), // e.g. "December 2025"
    isSample: boolean("is_sample").notNull().default(false), // written example, not a real visitor
    createdAt,
  },
  (t) => [index("reviews_destination_idx").on(t.destinationId, t.createdAt)],
);

export const favorites = pgTable(
  "favorites",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: favoriteKindEnum("kind").notNull(),
    targetId: integer("target_id").notNull(),
    list: favoriteListEnum("list").notNull().default("saved"),
    createdAt,
  },
  (t) => [primaryKey({ columns: [t.userId, t.kind, t.targetId, t.list] })],
);

export const trips = pgTable(
  "trips",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    startDate: varchar("start_date", { length: 10 }), // YYYY-MM-DD
    notes: text("notes"),
    createdAt,
    updatedAt,
  },
  (t) => [index("trips_user_idx").on(t.userId)],
);

export const tripStops = pgTable(
  "trip_stops",
  {
    id: serial("id").primaryKey(),
    tripId: integer("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    destinationId: integer("destination_id")
      .notNull()
      .references(() => destinations.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    days: integer("days").notNull().default(1),
    notes: text("notes"),
  },
  (t) => [index("trip_stops_trip_idx").on(t.tripId, t.position)],
);

/* ---------- Travel guide ---------- */

export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 140 }).notNull().unique(),
  section: varchar("section", { length: 40 }).notNull(), // "essentials" | "tips"
  title: text("title").notNull(),
  emoji: varchar("emoji", { length: 16 }),
  summary: text("summary").notNull(),
  // Body as blocks so the frontend can render headings, paragraphs and lists without HTML
  body: jsonb("body").$type<ArticleBlock[]>().notNull(),
  readingMinutes: integer("reading_minutes").notNull().default(3),
  countryId: integer("country_id").references(() => countries.id, { onDelete: "set null" }),
  coverDestinationId: integer("cover_destination_id").references(() => destinations.id, { onDelete: "set null" }),
  publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
  sortOrder: integer("sort_order").notNull().default(100),
});

export type ArticleBlock =
  | { type: "h2"; text: string }
  | { type: "p"; text: string }
  | { type: "list"; items: string[] }
  | { type: "destinations"; slugs: string[] };

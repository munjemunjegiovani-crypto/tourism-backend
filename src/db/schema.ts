import {
  pgTable,
  pgEnum,
  serial,
  integer,
  text,
  varchar,
  boolean,
  jsonb,
  timestamp,
  geometry,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Locations are stored as PostGIS points in WGS84 (srid 4326).
// mode "xy" means x = longitude, y = latitude.
const point = (name: string) => geometry(name, { type: "point", mode: "xy", srid: 4326 });

export const categoryTypeEnum = pgEnum("category_type", ["attraction", "business"]);
export const listingStatusEnum = pgEnum("listing_status", ["draft", "published", "archived"]);
export const businessPlanEnum = pgEnum("business_plan", ["free", "pro", "premium"]);
export const priceRangeEnum = pgEnum("price_range", ["$", "$$", "$$$", "$$$$"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const countries = pgTable("countries", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  isoCode: varchar("iso_code", { length: 2 }).notNull().unique(),
  nameEn: text("name_en").notNull(),
  nameFr: text("name_fr").notNull(),
  currency: varchar("currency", { length: 3 }).notNull(),
  ...timestamps,
});

export const regions = pgTable(
  "regions",
  {
    id: serial("id").primaryKey(),
    countryId: integer("country_id")
      .notNull()
      .references(() => countries.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 120 }).notNull().unique(),
    nameEn: text("name_en").notNull(),
    nameFr: text("name_fr").notNull(),
    ...timestamps,
  },
  (t) => [index("regions_country_idx").on(t.countryId)],
);

export const cities = pgTable(
  "cities",
  {
    id: serial("id").primaryKey(),
    regionId: integer("region_id")
      .notNull()
      .references(() => regions.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 120 }).notNull().unique(),
    name: text("name").notNull(),
    location: point("location").notNull(),
    ...timestamps,
  },
  (t) => [
    index("cities_region_idx").on(t.regionId),
    index("cities_location_gist").using("gist", t.location),
  ],
);

export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    type: categoryTypeEnum("type").notNull(),
    slug: varchar("slug", { length: 80 }).notNull(),
    nameEn: text("name_en").notNull(),
    nameFr: text("name_fr").notNull(),
    icon: varchar("icon", { length: 40 }),
  },
  (t) => [uniqueIndex("categories_type_slug_uq").on(t.type, t.slug)],
);

export const attractions = pgTable(
  "attractions",
  {
    id: serial("id").primaryKey(),
    cityId: integer("city_id")
      .notNull()
      .references(() => cities.id),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id),
    slug: varchar("slug", { length: 160 }).notNull().unique(),
    name: text("name").notNull(),
    summaryEn: text("summary_en"),
    summaryFr: text("summary_fr"),
    descriptionEn: text("description_en"),
    descriptionFr: text("description_fr"),
    location: point("location").notNull(),
    entryFee: text("entry_fee"),
    openingHours: jsonb("opening_hours"),
    bestSeason: text("best_season"),
    coverImageUrl: text("cover_image_url"),
    status: listingStatusEnum("status").notNull().default("draft"),
    ...timestamps,
  },
  (t) => [
    index("attractions_city_idx").on(t.cityId),
    index("attractions_category_idx").on(t.categoryId),
    index("attractions_location_gist").using("gist", t.location),
  ],
);

export const businesses = pgTable(
  "businesses",
  {
    id: serial("id").primaryKey(),
    cityId: integer("city_id")
      .notNull()
      .references(() => cities.id),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id),
    // Set when an owner claims the listing (users table comes in a later step)
    ownerId: integer("owner_id"),
    slug: varchar("slug", { length: 160 }).notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    location: point("location").notNull(),
    address: text("address"),
    phone: varchar("phone", { length: 40 }),
    email: varchar("email", { length: 200 }),
    website: text("website"),
    priceRange: priceRangeEnum("price_range"),
    amenities: jsonb("amenities").$type<string[]>(),
    affiliateUrl: text("affiliate_url"),
    coverImageUrl: text("cover_image_url"),
    plan: businessPlanEnum("plan").notNull().default("free"),
    verified: boolean("verified").notNull().default(false),
    status: listingStatusEnum("status").notNull().default("draft"),
    ...timestamps,
  },
  (t) => [
    index("businesses_city_idx").on(t.cityId),
    index("businesses_category_idx").on(t.categoryId),
    index("businesses_location_gist").using("gist", t.location),
  ],
);

export const affiliateClicks = pgTable(
  "affiliate_clicks",
  {
    id: serial("id").primaryKey(),
    businessId: integer("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    userId: integer("user_id"),
    sourcePage: varchar("source_page", { length: 80 }),
    ipHash: varchar("ip_hash", { length: 64 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("affiliate_clicks_business_idx").on(t.businessId, t.createdAt)],
);

CREATE TYPE "public"."business_plan" AS ENUM('free', 'pro', 'premium');--> statement-breakpoint
CREATE TYPE "public"."category_type" AS ENUM('attraction', 'business');--> statement-breakpoint
CREATE TYPE "public"."listing_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."price_range" AS ENUM('$', '$$', '$$$', '$$$$');--> statement-breakpoint
CREATE TABLE "affiliate_clicks" (
	"id" serial PRIMARY KEY NOT NULL,
	"business_id" integer NOT NULL,
	"user_id" integer,
	"source_page" varchar(80),
	"ip_hash" varchar(64),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attractions" (
	"id" serial PRIMARY KEY NOT NULL,
	"city_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	"slug" varchar(160) NOT NULL,
	"name" text NOT NULL,
	"summary_en" text,
	"summary_fr" text,
	"description_en" text,
	"description_fr" text,
	"location" geometry(point) NOT NULL,
	"entry_fee" text,
	"opening_hours" jsonb,
	"best_season" text,
	"cover_image_url" text,
	"status" "listing_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attractions_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "businesses" (
	"id" serial PRIMARY KEY NOT NULL,
	"city_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	"owner_id" integer,
	"slug" varchar(160) NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"location" geometry(point) NOT NULL,
	"address" text,
	"phone" varchar(40),
	"email" varchar(200),
	"website" text,
	"price_range" "price_range",
	"amenities" jsonb,
	"affiliate_url" text,
	"cover_image_url" text,
	"plan" "business_plan" DEFAULT 'free' NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"status" "listing_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "businesses_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" "category_type" NOT NULL,
	"slug" varchar(80) NOT NULL,
	"name_en" text NOT NULL,
	"name_fr" text NOT NULL,
	"icon" varchar(40)
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"id" serial PRIMARY KEY NOT NULL,
	"region_id" integer NOT NULL,
	"slug" varchar(120) NOT NULL,
	"name" text NOT NULL,
	"location" geometry(point) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cities_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "countries" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(120) NOT NULL,
	"iso_code" varchar(2) NOT NULL,
	"name_en" text NOT NULL,
	"name_fr" text NOT NULL,
	"currency" varchar(3) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "countries_slug_unique" UNIQUE("slug"),
	CONSTRAINT "countries_iso_code_unique" UNIQUE("iso_code")
);
--> statement-breakpoint
CREATE TABLE "regions" (
	"id" serial PRIMARY KEY NOT NULL,
	"country_id" integer NOT NULL,
	"slug" varchar(120) NOT NULL,
	"name_en" text NOT NULL,
	"name_fr" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "regions_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "affiliate_clicks" ADD CONSTRAINT "affiliate_clicks_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attractions" ADD CONSTRAINT "attractions_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attractions" ADD CONSTRAINT "attractions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regions" ADD CONSTRAINT "regions_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "affiliate_clicks_business_idx" ON "affiliate_clicks" USING btree ("business_id","created_at");--> statement-breakpoint
CREATE INDEX "attractions_city_idx" ON "attractions" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "attractions_category_idx" ON "attractions" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "attractions_location_gist" ON "attractions" USING gist ("location");--> statement-breakpoint
CREATE INDEX "businesses_city_idx" ON "businesses" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "businesses_category_idx" ON "businesses" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "businesses_location_gist" ON "businesses" USING gist ("location");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_type_slug_uq" ON "categories" USING btree ("type","slug");--> statement-breakpoint
CREATE INDEX "cities_region_idx" ON "cities" USING btree ("region_id");--> statement-breakpoint
CREATE INDEX "cities_location_gist" ON "cities" USING gist ("location");--> statement-breakpoint
CREATE INDEX "regions_country_idx" ON "regions" USING btree ("country_id");
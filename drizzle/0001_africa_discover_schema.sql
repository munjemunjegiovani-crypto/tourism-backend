CREATE TYPE "public"."difficulty" AS ENUM('easy', 'moderate', 'difficult');--> statement-breakpoint
CREATE TYPE "public"."favorite_kind" AS ENUM('destination', 'experience', 'place');--> statement-breakpoint
CREATE TYPE "public"."favorite_list" AS ENUM('saved', 'visited');--> statement-breakpoint
CREATE TYPE "public"."image_owner" AS ENUM('destination', 'place');--> statement-breakpoint
CREATE TYPE "public"."place_kind" AS ENUM('hotel', 'restaurant', 'shopping', 'transport');--> statement-breakpoint
CREATE TYPE "public"."listing_plan" AS ENUM('free', 'pro', 'premium');--> statement-breakpoint
CREATE TABLE "activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(80) NOT NULL,
	"name" text NOT NULL,
	"emoji" varchar(16) NOT NULL,
	"description" text NOT NULL,
	"cover_destination_id" integer,
	CONSTRAINT "activities_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "affiliate_clicks" (
	"id" serial PRIMARY KEY NOT NULL,
	"place_id" integer NOT NULL,
	"user_id" integer,
	"source_page" varchar(80),
	"ip_hash" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(140) NOT NULL,
	"section" varchar(40) NOT NULL,
	"title" text NOT NULL,
	"emoji" varchar(16),
	"summary" text NOT NULL,
	"body" jsonb NOT NULL,
	"reading_minutes" integer DEFAULT 3 NOT NULL,
	"country_id" integer,
	"cover_destination_id" integer,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sort_order" integer DEFAULT 100 NOT NULL,
	CONSTRAINT "articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(40) NOT NULL,
	"name" text NOT NULL,
	"emoji" varchar(16) NOT NULL,
	"sort_order" integer DEFAULT 100 NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"id" serial PRIMARY KEY NOT NULL,
	"country_id" integer NOT NULL,
	"slug" varchar(120) NOT NULL,
	"name" text NOT NULL,
	"region" text,
	"popular" boolean DEFAULT false NOT NULL,
	"location" geometry(point) NOT NULL,
	CONSTRAINT "cities_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "countries" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(80) NOT NULL,
	"iso_code" varchar(2) NOT NULL,
	"name" text NOT NULL,
	"flag" varchar(16) NOT NULL,
	"africa_region" varchar(40) NOT NULL,
	"tagline" text NOT NULL,
	"intro" text NOT NULL,
	"capital" text,
	"currency" text,
	"languages" text[],
	"best_time_to_visit" text,
	"recommended_duration" text,
	"budget" text,
	"culture" text,
	"cuisine" jsonb,
	"travel_tips" jsonb,
	"safety" text,
	"featured" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 100 NOT NULL,
	"location" geometry(point) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "countries_slug_unique" UNIQUE("slug"),
	CONSTRAINT "countries_iso_code_unique" UNIQUE("iso_code")
);
--> statement-breakpoint
CREATE TABLE "destination_activities" (
	"destination_id" integer NOT NULL,
	"activity_id" integer NOT NULL,
	"note" text,
	CONSTRAINT "destination_activities_destination_id_activity_id_pk" PRIMARY KEY("destination_id","activity_id")
);
--> statement-breakpoint
CREATE TABLE "destinations" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(140) NOT NULL,
	"country_id" integer NOT NULL,
	"city_id" integer,
	"category_id" integer NOT NULL,
	"name" text NOT NULL,
	"region" text,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"summary" text NOT NULL,
	"description" text NOT NULL,
	"highlights" jsonb,
	"location" geometry(point) NOT NULL,
	"rating" numeric(2, 1),
	"review_count" integer DEFAULT 0 NOT NULL,
	"opening_hours" text,
	"price_range" varchar(8),
	"budget" text,
	"best_time_to_visit" text,
	"best_months" integer[],
	"recommended_duration" text,
	"difficulty" "difficulty",
	"popularity" integer DEFAULT 50 NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"wiki_title" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "destinations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "experience_destinations" (
	"experience_id" integer NOT NULL,
	"destination_id" integer NOT NULL,
	CONSTRAINT "experience_destinations_experience_id_destination_id_pk" PRIMARY KEY("experience_id","destination_id")
);
--> statement-breakpoint
CREATE TABLE "experiences" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(80) NOT NULL,
	"name" text NOT NULL,
	"emoji" varchar(16) NOT NULL,
	"tagline" text NOT NULL,
	"description" text NOT NULL,
	"highlights" jsonb,
	"typical_duration" text,
	"price_from" text,
	"best_time_to_visit" text,
	"cover_destination_id" integer,
	"sort_order" integer DEFAULT 100 NOT NULL,
	CONSTRAINT "experiences_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"user_id" integer NOT NULL,
	"kind" "favorite_kind" NOT NULL,
	"target_id" integer NOT NULL,
	"list" "favorite_list" DEFAULT 'saved' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "favorites_user_id_kind_target_id_list_pk" PRIMARY KEY("user_id","kind","target_id","list")
);
--> statement-breakpoint
CREATE TABLE "images" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_type" "image_owner" NOT NULL,
	"owner_id" integer NOT NULL,
	"url" text NOT NULL,
	"alt" text NOT NULL,
	"credit" text,
	"license" text,
	"source_url" text,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "places" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(140) NOT NULL,
	"kind" "place_kind" NOT NULL,
	"city_id" integer,
	"country_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"location" geometry(point) NOT NULL,
	"rating" numeric(2, 1),
	"price_range" varchar(8),
	"website" text,
	"affiliate_url" text,
	"phone" varchar(40),
	"is_demo" boolean DEFAULT false NOT NULL,
	"plan" "listing_plan" DEFAULT 'free' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "places_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"destination_id" integer NOT NULL,
	"user_id" integer,
	"author_name" text NOT NULL,
	"author_country" text,
	"rating" integer NOT NULL,
	"title" text,
	"body" text NOT NULL,
	"visited_on" text,
	"is_sample" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "trip_stops" (
	"id" serial PRIMARY KEY NOT NULL,
	"trip_id" integer NOT NULL,
	"destination_id" integer NOT NULL,
	"position" integer NOT NULL,
	"days" integer DEFAULT 1 NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "trips" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"start_date" varchar(10),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" varchar(200) NOT NULL,
	"password_hash" text NOT NULL,
	"avatar_url" text,
	"home_city" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_cover_destination_id_destinations_id_fk" FOREIGN KEY ("cover_destination_id") REFERENCES "public"."destinations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_clicks" ADD CONSTRAINT "affiliate_clicks_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_cover_destination_id_destinations_id_fk" FOREIGN KEY ("cover_destination_id") REFERENCES "public"."destinations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "destination_activities" ADD CONSTRAINT "destination_activities_destination_id_destinations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destinations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "destination_activities" ADD CONSTRAINT "destination_activities_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "destinations" ADD CONSTRAINT "destinations_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "destinations" ADD CONSTRAINT "destinations_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "destinations" ADD CONSTRAINT "destinations_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_destinations" ADD CONSTRAINT "experience_destinations_experience_id_experiences_id_fk" FOREIGN KEY ("experience_id") REFERENCES "public"."experiences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_destinations" ADD CONSTRAINT "experience_destinations_destination_id_destinations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destinations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiences" ADD CONSTRAINT "experiences_cover_destination_id_destinations_id_fk" FOREIGN KEY ("cover_destination_id") REFERENCES "public"."destinations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "places" ADD CONSTRAINT "places_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "places" ADD CONSTRAINT "places_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_destination_id_destinations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destinations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_stops" ADD CONSTRAINT "trip_stops_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_stops" ADD CONSTRAINT "trip_stops_destination_id_destinations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destinations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "affiliate_clicks_place_idx" ON "affiliate_clicks" USING btree ("place_id","created_at");--> statement-breakpoint
CREATE INDEX "cities_country_idx" ON "cities" USING btree ("country_id");--> statement-breakpoint
CREATE INDEX "cities_location_gist" ON "cities" USING gist ("location");--> statement-breakpoint
CREATE INDEX "destinations_country_idx" ON "destinations" USING btree ("country_id");--> statement-breakpoint
CREATE INDEX "destinations_city_idx" ON "destinations" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "destinations_category_idx" ON "destinations" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "destinations_location_gist" ON "destinations" USING gist ("location");--> statement-breakpoint
CREATE INDEX "images_owner_idx" ON "images" USING btree ("owner_type","owner_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "images_owner_url_uq" ON "images" USING btree ("owner_type","owner_id","url");--> statement-breakpoint
CREATE INDEX "places_kind_idx" ON "places" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "places_location_gist" ON "places" USING gist ("location");--> statement-breakpoint
CREATE INDEX "reviews_destination_idx" ON "reviews" USING btree ("destination_id","created_at");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "trip_stops_trip_idx" ON "trip_stops" USING btree ("trip_id","position");--> statement-breakpoint
CREATE INDEX "trips_user_idx" ON "trips" USING btree ("user_id");
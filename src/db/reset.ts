/**
 * Deletes ALL data (including users) by recreating the public schema.
 * Development only: `npm run db:reset` then migrates and seeds again.
 */
import { sqlClient } from "./client.js";
import { env } from "../config/env.js";

if (env.NODE_ENV === "production") {
  console.error("Refusing to reset a production database.");
  process.exit(1);
}

await sqlClient.unsafe("DROP SCHEMA IF EXISTS drizzle CASCADE; DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
console.log("Database emptied.");
await sqlClient.end();

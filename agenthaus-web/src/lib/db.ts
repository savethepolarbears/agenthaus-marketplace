import { neon } from "@neondatabase/serverless";

// Returns a neon sql tagged-template client when DATABASE_URL is set.
// Without it, sql is null so callers can fall back to static data.
export const sql = process.env.DATABASE_URL
  ? neon(process.env.DATABASE_URL)
  : null;

import { neon } from '@neondatabase/serverless';

// Connects to Neon Serverless Postgres.  During deployment, set
// DATABASE_URL in the environment to your Neon connection string.  Without
// this, the application will throw at startup.
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
export const sql = neon(process.env.DATABASE_URL);
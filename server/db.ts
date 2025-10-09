import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from "@shared/schema";

// Use libsql (Turso) for development - works without compilation issues
const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db';

// Local SQLite setup with libsql
const client = createClient({
  url: databaseUrl,
});
export const db = drizzle(client, { schema });

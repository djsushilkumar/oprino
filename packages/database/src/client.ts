import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { z } from 'zod';
import * as schema from './schema/index.js';

const DatabaseConfigSchema = z.object({
  url: z
    .string()
    .url()
    .default('postgresql://oprino_admin:oprino_dev_password@localhost:5432/oprino_db'),
  max: z.number().int().positive().default(10),
});

export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;

export type Database = PostgresJsDatabase<typeof schema>;

export function createDatabaseClient(config?: Partial<DatabaseConfig>): {
  db: Database;
  client: postgres.Sql;
} {
  const parsed = DatabaseConfigSchema.parse({
    url: process.env.DATABASE_URL || config?.url,
    max: config?.max ?? 10,
  });

  const client = postgres(parsed.url, {
    max: parsed.max,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  const db = drizzle(client, { schema });

  return { db, client };
}

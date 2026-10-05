import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      'postgresql://oprino_admin:oprino_dev_password@localhost:5432/oprino_db',
  },
  strict: true,
  verbose: true,
});

import { z } from 'zod';

export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  HOST: z.string().default('0.0.0.0'),
  API_PUBLIC_URL: z.string().url().default('http://localhost:3001'),
  BETTER_AUTH_SECRET: z
    .string()
    .min(16)
    .default('oprino_dev_secret_must_be_long_and_secure_for_auth'),
  BETTER_AUTH_URL: z.string().url().default('http://localhost:3001'),
  DATABASE_URL: z
    .string()
    .default('postgresql://oprino_admin:oprino_dev_password@localhost:5432/oprino_db'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  CORS_ORIGINS: z.string().optional(),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  ENABLE_PROMETHEUS: z.coerce.boolean().default(true),
  SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
});

export type Env = z.infer<typeof EnvSchema>;

export function validateEnv(customEnv?: Record<string, unknown>): Env {
  const result = EnvSchema.safeParse(customEnv || process.env);
  if (!result.success) {
    console.error('❌ Invalid API environment variables:', result.error.format());
    throw new Error('Invalid API environment configuration');
  }
  return result.data;
}

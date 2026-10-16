import { z } from 'zod';

export const WorkerEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  DATABASE_URL: z
    .string()
    .default('postgresql://oprino_admin:oprino_dev_password@localhost:5432/oprino_db'),
  CONCURRENCY: z.coerce.number().int().positive().default(5),
  SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
});

export type WorkerEnv = z.infer<typeof WorkerEnvSchema>;

export function validateWorkerEnv(customEnv?: Record<string, unknown>): WorkerEnv {
  const result = WorkerEnvSchema.safeParse(customEnv || process.env);
  if (!result.success) {
    console.error('❌ Invalid Worker environment variables:', result.error.format());
    throw new Error('Invalid Worker environment configuration');
  }

  const isProduction = result.data.NODE_ENV === 'production';
  if (isProduction) {
    if (
      result.data.DATABASE_URL.includes('oprino_dev_password') ||
      result.data.DATABASE_URL.includes('localhost:5432') ||
      result.data.DATABASE_URL.includes('127.0.0.1:5432')
    ) {
      throw new Error(
        'Insecure Production Worker Database Configuration: Default development DATABASE_URL or localhost is strictly forbidden in production.',
      );
    }
    if (
      result.data.REDIS_URL.includes('localhost:6379') ||
      result.data.REDIS_URL.includes('127.0.0.1:6379')
    ) {
      throw new Error(
        'Insecure Production Worker Redis Configuration: Default development REDIS_URL or localhost is strictly forbidden in production.',
      );
    }
  }

  return result.data;
}

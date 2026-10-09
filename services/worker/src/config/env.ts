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
  return result.data;
}

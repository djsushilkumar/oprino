import { z } from 'zod';

export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  HOST: z.string().default('0.0.0.0'),
  API_PUBLIC_URL: z.string().url().default('http://localhost:3001'),
  APP_PUBLIC_URL: z.string().url().default('http://localhost:3000'),
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

  // Object Storage (Cloudflare R2 / AWS S3 / Local Dev Storage)
  STORAGE_DRIVER: z.enum(['s3', 'local']).default('local'),
  S3_ENDPOINT: z.string().url().optional(),
  S3_BUCKET_NAME: z.string().optional(),
  S3_REGION: z.string().default('auto'),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_FORCE_PATH_STYLE: z.coerce.boolean().default(false),
  LOCAL_STORAGE_DIR: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

export function validateEnv(customEnv?: Record<string, unknown>): Env {
  const result = EnvSchema.safeParse(customEnv || process.env);
  if (!result.success) {
    console.error('❌ Invalid API environment variables:', result.error.format());
    throw new Error('Invalid API environment configuration');
  }

  const isProductionLike =
    result.data.NODE_ENV === 'production' ||
    result.data.APP_ENV === 'production' ||
    result.data.APP_ENV === 'staging';

  // Security Invariant: Never allow fake or unconfigured storage in production or staging
  if (isProductionLike) {
    const isMissingS3 =
      !result.data.S3_BUCKET_NAME ||
      !result.data.S3_ACCESS_KEY_ID ||
      !result.data.S3_SECRET_ACCESS_KEY;

    if (result.data.STORAGE_DRIVER !== 's3' || isMissingS3) {
      const envName = result.data.APP_ENV === 'staging' ? 'Staging' : 'Production';
      console.error(
        `❌ ${envName} Storage Misconfiguration: Real S3/R2 object storage credentials (S3_BUCKET_NAME, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY) are strictly mandatory in ${envName.toLowerCase()}.`,
      );
      throw new Error(
        `${envName} environment requires valid S3/R2 storage configuration. Silent fallback to mock storage is strictly forbidden.`,
      );
    }

    // Security Invariant: Reject default development auth secrets in production-like environments
    if (result.data.BETTER_AUTH_SECRET === 'oprino_dev_secret_must_be_long_and_secure_for_auth') {
      const envName = result.data.APP_ENV === 'staging' ? 'Staging' : 'Production';
      throw new Error(
        `Insecure ${envName} Authentication Secret: Default development BETTER_AUTH_SECRET is strictly forbidden in ${envName.toLowerCase()}.`,
      );
    }

    // Security Invariant: Reject default development database credentials in production-like environments
    if (result.data.DATABASE_URL.includes('oprino_dev_password@localhost:5432')) {
      const envName = result.data.APP_ENV === 'staging' ? 'Staging' : 'Production';
      throw new Error(
        `Insecure ${envName} Database Configuration: Default development DATABASE_URL is strictly forbidden in ${envName.toLowerCase()}.`,
      );
    }
  }

  return result.data;
}

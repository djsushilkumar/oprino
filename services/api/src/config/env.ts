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

export function validateProductionUrl(urlString: string, varName: string, envName: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    throw new Error(`Insecure ${envName} ${varName}: "${urlString}" is not a valid absolute URL.`);
  }

  if (parsed.protocol !== 'https:') {
    throw new Error(
      `Insecure ${envName} ${varName}: Public origin must use HTTPS scheme, received "${parsed.protocol}" in "${urlString}".`,
    );
  }

  const hostname = parsed.hostname.toLowerCase().trim();
  const isLoopbackOrPrivate =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '10.0.2.2' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname);

  if (isLoopbackOrPrivate) {
    throw new Error(
      `Insecure ${envName} ${varName}: Cannot target loopback, emulator, or private IP address "${hostname}".`,
    );
  }

  return parsed;
}

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

  // Security Invariants for Production and Cloud Staging
  if (isProductionLike) {
    const envName = result.data.APP_ENV === 'staging' ? 'Staging' : 'Production';

    // 1. Mandatory Public URLs (HTTPS, non-loopback)
    validateProductionUrl(result.data.API_PUBLIC_URL, 'API_PUBLIC_URL', envName);
    validateProductionUrl(result.data.BETTER_AUTH_URL, 'BETTER_AUTH_URL', envName);
    validateProductionUrl(result.data.APP_PUBLIC_URL, 'APP_PUBLIC_URL', envName);

    // 2. Mandatory S3/R2 Object Storage Configuration
    const isMissingS3 =
      !result.data.S3_BUCKET_NAME ||
      !result.data.S3_ACCESS_KEY_ID ||
      !result.data.S3_SECRET_ACCESS_KEY;

    if (result.data.STORAGE_DRIVER !== 's3' || isMissingS3) {
      console.error(
        `❌ ${envName} Storage Misconfiguration: Real S3/R2 object storage credentials (S3_BUCKET_NAME, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY) are strictly mandatory in ${envName.toLowerCase()}.`,
      );
      throw new Error(
        `${envName} environment requires valid S3/R2 storage configuration. Silent fallback to mock storage is strictly forbidden.`,
      );
    }

    // 3. Reject Default Development Auth Secret
    if (result.data.BETTER_AUTH_SECRET === 'oprino_dev_secret_must_be_long_and_secure_for_auth') {
      throw new Error(
        `Insecure ${envName} Authentication Secret: Default development BETTER_AUTH_SECRET is strictly forbidden in ${envName.toLowerCase()}.`,
      );
    }

    // 4. Reject Default Development Database Credentials & Host
    try {
      const dbParsed = new URL(result.data.DATABASE_URL);
      const dbHost = dbParsed.hostname.toLowerCase().trim();
      if (
        dbHost === 'localhost' ||
        dbHost === '127.0.0.1' ||
        dbHost === '::1' ||
        dbHost === '10.0.2.2' ||
        result.data.DATABASE_URL.includes('oprino_dev_password')
      ) {
        throw new Error(
          `Insecure ${envName} Database Configuration: Default development DATABASE_URL or loopback host "${dbHost}" is strictly forbidden in ${envName.toLowerCase()}.`,
        );
      }
    } catch (err: any) {
      if (err.message.startsWith('Insecure')) throw err;
      throw new Error(`Invalid ${envName} DATABASE_URL: Malformed database connection string.`);
    }

    // 5. Reject Default Development Redis Loopback
    try {
      const redisParsed = new URL(result.data.REDIS_URL);
      const redisHost = redisParsed.hostname.toLowerCase().trim();
      if (
        redisHost === 'localhost' ||
        redisHost === '127.0.0.1' ||
        redisHost === '::1' ||
        redisHost === '10.0.2.2'
      ) {
        throw new Error(
          `Insecure ${envName} Redis Configuration: Cannot target development loopback host "${redisHost}" in ${envName.toLowerCase()}.`,
        );
      }
    } catch (err: any) {
      if (err.message.startsWith('Insecure')) throw err;
      throw new Error(`Invalid ${envName} REDIS_URL: Malformed Redis connection string.`);
    }

    // 6. Validate Public CORS Origins
    if (result.data.CORS_ORIGINS) {
      const origins = result.data.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean);
      for (const origin of origins) {
        if (origin === '*' || origin === 'oprino://app') continue;
        try {
          const parsedOrigin = new URL(origin);
          if (parsedOrigin.protocol !== 'https:') {
            throw new Error(
              `Insecure ${envName} CORS Origin: Origin "${origin}" must use HTTPS scheme in ${envName.toLowerCase()}.`,
            );
          }
          const oHost = parsedOrigin.hostname.toLowerCase().trim();
          if (
            oHost === 'localhost' ||
            oHost === '127.0.0.1' ||
            oHost === '10.0.2.2' ||
            oHost.endsWith('.localhost') ||
            /^192\.168\./.test(oHost) ||
            /^10\./.test(oHost)
          ) {
            throw new Error(
              `Insecure ${envName} CORS Origin: Origin "${origin}" cannot target loopback or private host in ${envName.toLowerCase()}.`,
            );
          }
        } catch (err: any) {
          if (err.message.startsWith('Insecure')) throw err;
          throw new Error(`Invalid ${envName} CORS Origin: "${origin}" is not a valid absolute URL.`);
        }
      }
    }
  }

  return result.data;
}

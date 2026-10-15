import * as path from 'node:path';
import type { Env } from '../config/env.js';
import type { StorageDriver } from './types.js';
import { S3StorageDriver } from './s3-driver.js';
import { LocalStorageDriver } from './local-driver.js';

export * from './types.js';
export * from './s3-driver.js';
export * from './local-driver.js';

export function createStorageDriver(env: Env): StorageDriver {
  const isS3Configured = Boolean(
    env.S3_BUCKET_NAME && env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY,
  );

  if (env.STORAGE_DRIVER === 's3' || isS3Configured) {
    if (!env.S3_BUCKET_NAME || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY) {
      throw new Error(
        'S3 storage driver requested but S3_BUCKET_NAME, S3_ACCESS_KEY_ID, or S3_SECRET_ACCESS_KEY is missing.',
      );
    }

    return new S3StorageDriver({
      bucket: env.S3_BUCKET_NAME,
      endpoint: env.S3_ENDPOINT,
      region: env.S3_REGION,
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      forcePathStyle: env.S3_FORCE_PATH_STYLE,
    });
  }

  // Local filesystem storage driver for development and automated integration testing
  const storageDir = env.LOCAL_STORAGE_DIR || path.resolve(process.cwd(), '.storage');
  return new LocalStorageDriver({
    storageDir,
    publicBaseUrl: env.API_PUBLIC_URL,
    secret: env.BETTER_AUTH_SECRET,
  });
}

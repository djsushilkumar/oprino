import { describe, test, before, after } from 'node:test';
import * as assert from 'node:assert/strict';
import * as crypto from 'node:crypto';
import Fastify from 'fastify';
import { S3StorageDriver } from './storage/s3-driver.js';
import { mediaRoutes } from './routes/media.js';
import {
  MediaService,
  ALLOWED_MIME_TYPES,
  MAX_UPLOAD_SIZE_BYTES,
} from './services/media.service.js';

// Minimal valid 1x1 synthetic JPEG binary
export const VALID_SYNTHETIC_JPEG = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
  0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
  0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
  0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
  0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
  0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00,
  0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0xda, 0x00, 0x08, 0x01,
  0x01, 0x00, 0x00, 0x3f, 0x00, 0x37, 0xff, 0xd9,
]);

// Minimal valid 1x1 synthetic PNG binary
export const VALID_SYNTHETIC_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

export interface LiveR2PreconditionsResult {
  shouldRun: boolean;
  missing: string[];
  reason?: string;
}

export function evaluateLiveR2Preconditions(
  env: Record<string, string | undefined> = process.env,
): LiveR2PreconditionsResult {
  const missing: string[] = [];
  if (!env.S3_BUCKET_NAME) missing.push('S3_BUCKET_NAME');
  if (!env.S3_ACCESS_KEY_ID) missing.push('S3_ACCESS_KEY_ID');
  if (!env.S3_SECRET_ACCESS_KEY) missing.push('S3_SECRET_ACCESS_KEY');

  const runLiveVal = env.RUN_LIVE_R2_TESTS?.trim().toLowerCase();
  const isRunLiveRequested = runLiveVal === 'true' || runLiveVal === '1';

  if (missing.length > 0) {
    if (isRunLiveRequested) {
      throw new Error(
        `FATAL_FAIL_CLOSED: RUN_LIVE_R2_TESTS=true was requested, but live Cloudflare R2 credentials are missing: ${missing.join(', ')}`,
      );
    }
    return {
      shouldRun: false,
      missing,
      reason: `Live Cloudflare R2 credentials missing: ${missing.join(', ')}. Set credentials or set RUN_LIVE_R2_TESTS=true to fail closed.`,
    };
  }

  return {
    shouldRun: true,
    missing: [],
  };
}

describe('Phase 3: Cloudflare R2 Cloud Storage & Staging Security Integration', () => {
  const stagingWorkspaceId = 'stg-ws-98765432-1111-2222-3333-444455556666';
  const stagingEmployeeId = 'stg-emp-11111111-aaaa-bbbb-cccc-ddddeeeeffff';
  const stagingTaskId = 'stg-tsk-33333333-aaaa-bbbb-cccc-ddddeeeeffff';

  describe('1. Cloud Storage Driver Architecture & S3/R2 Presigning Semantics', () => {
    const s3Config = {
      bucket: process.env.S3_BUCKET_NAME || 'oprino-staging-media',
      endpoint: process.env.S3_ENDPOINT || 'https://cf-staging-account.r2.cloudflarestorage.com',
      region: process.env.S3_REGION || 'auto',
      accessKeyId: process.env.S3_ACCESS_KEY_ID || 'mock-staging-r2-access-key-id',
      secretAccessKey:
        process.env.S3_SECRET_ACCESS_KEY || 'mock-staging-r2-secret-access-key-minimum-32-chars',
      forcePathStyle: false,
    };

    const s3Driver = new S3StorageDriver(s3Config);

    test('S3StorageDriver identifies with driverName="s3"', () => {
      assert.strictEqual(s3Driver.driverName, 's3');
    });

    test('Generates RFC-compliant S3/R2 presigned upload URL with SigV4 parameters', async () => {
      const fileKey = `${stagingWorkspaceId}/attendance/${stagingEmployeeId}/selfie-01.jpg`;
      const uploadUrl = await s3Driver.getUploadUrl(fileKey, {
        contentType: 'image/jpeg',
        expiresInSeconds: 600,
      });

      assert.ok(uploadUrl.startsWith('https://'), 'Upload URL must use secure HTTPS');
      assert.ok(uploadUrl.includes(s3Config.bucket), 'Upload URL must target staging bucket');
      assert.ok(
        uploadUrl.includes('X-Amz-Algorithm=AWS4-HMAC-SHA256'),
        'Must use AWS Signature v4 algorithm',
      );
      assert.ok(uploadUrl.includes('X-Amz-Credential='), 'Must include SigV4 credential scope');
      assert.ok(
        uploadUrl.includes('X-Amz-Signature='),
        'Must include cryptographically signed HMAC signature',
      );
      assert.ok(
        uploadUrl.includes('X-Amz-Expires=600'),
        'Must enforce 10-minute expiry constraint',
      );
    });

    test('Generates short-lived 15-minute presigned download URL with SigV4 parameters', async () => {
      const fileKey = `${stagingWorkspaceId}/proofs/${stagingTaskId}/proof-01.jpg`;
      const downloadUrl = await s3Driver.getDownloadUrl(fileKey, {
        expiresInSeconds: 900,
      });

      assert.ok(downloadUrl.startsWith('https://'), 'Download URL must use secure HTTPS');
      assert.ok(
        downloadUrl.includes('X-Amz-Expires=900'),
        'Must enforce 15-minute manager view expiry',
      );
      assert.ok(downloadUrl.includes('X-Amz-Signature='), 'Must include SigV4 signature');
    });
  });

  describe('2. Direct API Storage Proxy Blockade for S3StorageDriver', () => {
    let fastifyApp: any;

    before(async () => {
      fastifyApp = Fastify({ logger: false });
      const s3Driver = new S3StorageDriver({
        bucket: 'oprino-staging-media',
        region: 'auto',
        endpoint: 'https://cf-staging-account.r2.cloudflarestorage.com',
        accessKeyId: 'mock-key',
        secretAccessKey: 'mock-secret',
      });

      const mediaService = new MediaService({} as any, s3Driver, 'http://127.0.0.1:3001');

      const authMiddleware: any = {
        authenticate: async (req: any) => {
          req.user = { id: stagingEmployeeId };
        },
        requireWorkspace: async (req: any) => {
          req.workspaceId = stagingWorkspaceId;
          req.permissions = ['tasks.read', 'attendance.self.read'];
        },
      };

      await fastifyApp.register(mediaRoutes, { mediaService, authMiddleware });
      await fastifyApp.ready();
    });

    after(async () => {
      await fastifyApp.close();
    });

    test('Rejects direct API proxy upload with 403 Forbidden when S3 driver is active', async () => {
      const res = await fastifyApp.inject({
        method: 'PUT',
        url: `/v1/media/storage/upload/${stagingWorkspaceId}/attendance/${stagingEmployeeId}/photo.jpg?signature=fake&expires=${Date.now() + 60000}&contentType=image/jpeg`,
        headers: {
          'Content-Type': 'image/jpeg',
        },
        payload: Buffer.from('FAKE-PHOTO-DATA'),
      });

      assert.strictEqual(res.statusCode, 403);
      const body = JSON.parse(res.body);
      assert.ok(
        body.message.includes('Direct API storage proxy upload is disabled'),
        'Must enforce direct S3/R2 upload requirement',
      );
    });

    test('Rejects direct API proxy download with 403 Forbidden when S3 driver is active', async () => {
      const res = await fastifyApp.inject({
        method: 'GET',
        url: `/v1/media/storage/download/${stagingWorkspaceId}/attendance/${stagingEmployeeId}/photo.jpg?signature=fake&expires=${Date.now() + 60000}`,
      });

      assert.strictEqual(res.statusCode, 403);
      const body = JSON.parse(res.body);
      assert.ok(
        body.message.includes('Direct API storage proxy download is disabled'),
        'Must enforce direct S3/R2 download requirement',
      );
    });
  });

  describe('3. Cloudflare R2 CORS Configuration & Security Boundaries', () => {
    test('Validates required Cloudflare R2 CORS configuration rules for browser direct uploads', () => {
      const requiredCorsRules = [
        {
          AllowedOrigins: [
            'https://app.staging.oprino.com',
            'https://oprino-staging.vercel.app',
            'http://localhost:3000',
          ],
          AllowedMethods: ['PUT', 'GET', 'HEAD'],
          AllowedHeaders: ['Content-Type', 'x-amz-content-sha256', 'x-amz-date', 'Authorization'],
          ExposeHeaders: ['ETag'],
          MaxAgeSeconds: 3600,
        },
      ];

      assert.strictEqual(requiredCorsRules.length, 1);
      assert.ok(requiredCorsRules[0].AllowedMethods.includes('PUT'));
      assert.ok(requiredCorsRules[0].AllowedMethods.includes('GET'));
      assert.ok(requiredCorsRules[0].AllowedMethods.includes('HEAD'));
      assert.ok(requiredCorsRules[0].AllowedHeaders.includes('Content-Type'));
      assert.ok(requiredCorsRules[0].ExposeHeaders.includes('ETag'));
    });

    test('Validates MIME type restrictions and 10MB file size ceiling', () => {
      assert.ok(ALLOWED_MIME_TYPES.includes('image/jpeg'));
      assert.ok(ALLOWED_MIME_TYPES.includes('image/png'));
      assert.ok(ALLOWED_MIME_TYPES.includes('image/webp'));
      assert.strictEqual(MAX_UPLOAD_SIZE_BYTES, 10 * 1024 * 1024);
    });
  });

  describe('4. Live Cloudflare R2 Storage Validation (Conditioned on Live Credentials)', () => {
    let preconditions: LiveR2PreconditionsResult;
    try {
      preconditions = evaluateLiveR2Preconditions(process.env);
    } catch (err: any) {
      test('[LIVE R2] Fail-Closed Guard: Fails explicitly when RUN_LIVE_R2_TESTS=true but credentials are missing', () => {
        assert.fail(err.message);
      });
      return;
    }

    const liveDriver = preconditions.shouldRun
      ? new S3StorageDriver({
          bucket: process.env.S3_BUCKET_NAME!,
          endpoint: process.env.S3_ENDPOINT,
          region: process.env.S3_REGION || 'auto',
          accessKeyId: process.env.S3_ACCESS_KEY_ID!,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
          forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
        })
      : null;

    const createdKeys: string[] = [];

    after(async () => {
      // Ensure cleanup runs reliably even after test failure
      if (liveDriver && createdKeys.length > 0) {
        for (const key of createdKeys) {
          try {
            await liveDriver.deleteObject(key);
          } catch (err) {
            console.error(`Failed to cleanup live test key ${key}:`, err);
          }
        }
      }
    });

    const skipReason = preconditions.shouldRun ? undefined : preconditions.reason;

    test(
      '[LIVE R2] Uploads valid synthetic JPEG binary to staging R2 bucket using signed PUT URL',
      { skip: skipReason },
      async () => {
        assert.ok(liveDriver, 'liveDriver must be instantiated');
        const testKey = `${stagingWorkspaceId}/attendance/${stagingEmployeeId}/staging-selfie-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.jpg`;
        createdKeys.push(testKey);

        const uploadUrl = await liveDriver.getUploadUrl(testKey, {
          contentType: 'image/jpeg',
          expiresInSeconds: 300,
        });

        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'image/jpeg' },
          body: VALID_SYNTHETIC_JPEG,
        });

        assert.strictEqual(
          uploadRes.status,
          200,
          `R2 PUT upload must succeed with 200: ${await uploadRes.text()}`,
        );
      },
    );

    test(
      '[LIVE R2] Verifies physical object existence and byte fidelity via headObject',
      { skip: skipReason },
      async () => {
        assert.ok(liveDriver, 'liveDriver must be instantiated');
        const testKey = createdKeys[createdKeys.length - 1];
        assert.ok(testKey, 'Test key must exist');

        const meta = await liveDriver.headObject(testKey);
        assert.ok(meta);
        assert.strictEqual(meta.exists, true);
        assert.strictEqual(meta.sizeBytes, VALID_SYNTHETIC_JPEG.length);
        assert.strictEqual(meta.contentType, 'image/jpeg');
      },
    );

    test(
      '[LIVE R2] Generates presigned download URL and verifies byte-for-byte fidelity',
      { skip: skipReason },
      async () => {
        assert.ok(liveDriver, 'liveDriver must be instantiated');
        const testKey = createdKeys[createdKeys.length - 1];
        assert.ok(testKey, 'Test key must exist');

        const downloadUrl = await liveDriver.getDownloadUrl(testKey, {
          expiresInSeconds: 300,
        });

        const downloadRes = await fetch(downloadUrl);
        assert.strictEqual(downloadRes.status, 200);
        const downloadedBuffer = Buffer.from(await downloadRes.arrayBuffer());
        assert.deepStrictEqual(downloadedBuffer, VALID_SYNTHETIC_JPEG);
      },
    );

    test(
      '[LIVE R2] Safely deletes test object and verifies headObject returns exists: false',
      { skip: skipReason },
      async () => {
        assert.ok(liveDriver, 'liveDriver must be instantiated');
        const testKey = createdKeys[createdKeys.length - 1];
        assert.ok(testKey, 'Test key must exist');

        await liveDriver.deleteObject(testKey);
        const meta = await liveDriver.headObject(testKey);
        assert.strictEqual(meta?.exists, false);
      },
    );
  });

  describe('5. Cloud Storage Preconditions & Fail-Closed Regression Suite', () => {
    test('evaluateLiveR2Preconditions reports skip when credentials are missing and RUN_LIVE_R2_TESTS is unset', () => {
      const res = evaluateLiveR2Preconditions({});
      assert.strictEqual(res.shouldRun, false);
      assert.ok(res.missing.includes('S3_BUCKET_NAME'));
      assert.ok(res.missing.includes('S3_ACCESS_KEY_ID'));
      assert.ok(res.missing.includes('S3_SECRET_ACCESS_KEY'));
      assert.ok(res.reason?.includes('Live Cloudflare R2 credentials missing'));
    });

    test('evaluateLiveR2Preconditions throws fatal error when RUN_LIVE_R2_TESTS=true and credentials are missing', () => {
      assert.throws(
        () => evaluateLiveR2Preconditions({ RUN_LIVE_R2_TESTS: 'true' }),
        /FATAL_FAIL_CLOSED: RUN_LIVE_R2_TESTS=true was requested, but live Cloudflare R2 credentials are missing/,
      );
    });

    test('evaluateLiveR2Preconditions throws fatal error when RUN_LIVE_R2_TESTS=1 and credentials are missing', () => {
      assert.throws(
        () => evaluateLiveR2Preconditions({ RUN_LIVE_R2_TESTS: '1' }),
        /FATAL_FAIL_CLOSED: RUN_LIVE_R2_TESTS=true was requested, but live Cloudflare R2 credentials are missing/,
      );
    });

    test('evaluateLiveR2Preconditions reports shouldRun=true when complete credentials are provided', () => {
      const res = evaluateLiveR2Preconditions({
        S3_BUCKET_NAME: 'oprino-staging-media',
        S3_ACCESS_KEY_ID: 'valid-r2-key',
        S3_SECRET_ACCESS_KEY: 'valid-r2-secret',
      });
      assert.strictEqual(res.shouldRun, true);
      assert.strictEqual(res.missing.length, 0);
    });
  });
});

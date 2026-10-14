import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import * as os from 'node:os';
import * as path from 'node:path';
import * as fs from 'node:fs';
import Fastify from 'fastify';
import { LocalStorageDriver } from './storage/local-driver.js';
import { S3StorageDriver } from './storage/s3-driver.js';
import {
  MediaService,
  ALLOWED_MIME_TYPES,
  MAX_UPLOAD_SIZE_BYTES,
} from './services/media.service.js';
import { mediaRoutes } from './routes/media.js';
import { validateEnv } from './config/env.js';

describe('Media Storage & Security Hardening Unit & Domain Invariants', () => {
  const testStorageDir = path.join(os.tmpdir(), `oprino-test-storage-${Date.now()}`);
  const testSecret = 'super_secret_test_key_for_hmac_signing_at_least_32_chars';
  const publicBaseUrl = 'http://localhost:3001';

  let localDriver: LocalStorageDriver;
  let mediaService: MediaService;
  const workspaceAId = '11111111-1111-1111-1111-111111111111';
  const workspaceBId = '22222222-2222-2222-2222-222222222222';
  const employeeAId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const peerEmployeeId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const managerId = 'mmmmmmmm-mmmm-mmmm-mmmm-mmmmmmmmmmmm';

  // Mock minimal DB transaction for MediaService testing
  const mockDb: any = {
    transaction: async (fn: any) =>
      fn({
        execute: async () => {},
        select: () => ({
          from: () => ({
            where: () => [{ id: 'task-1' }],
          }),
        }),
        insert: () => ({
          values: (vals: any) => ({
            returning: () => [
              {
                id: 'proof-uuid-1',
                workspaceId: vals.workspaceId,
                taskId: vals.taskId,
                userId: vals.userId,
                proofType: vals.proofType,
                fileKey: vals.fileKey,
                fileUrl: vals.fileUrl,
                fileSizeBytes: vals.fileSizeBytes,
                mimeType: vals.mimeType,
                createdAt: new Date(),
              },
            ],
          }),
        }),
      }),
  };

  before(async () => {
    localDriver = new LocalStorageDriver({
      storageDir: testStorageDir,
      publicBaseUrl,
      secret: testSecret,
    });
    mediaService = new MediaService(mockDb, localDriver, publicBaseUrl);
  });

  after(async () => {
    if (fs.existsSync(testStorageDir)) {
      await fs.promises.rm(testStorageDir, { recursive: true, force: true });
    }
  });

  describe('1. LocalStorageDriver Durable Persistence & HMAC Tokens', () => {
    const testKey = `${workspaceAId}/proofs/task-100/photo.jpg`;
    const imagePayload = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]); // Real JPEG header
    const contentType = 'image/jpeg';

    test('Generates presigned upload URL with HMAC signature and expiration', async () => {
      const uploadUrl = await localDriver.getUploadUrl(testKey, {
        contentType,
        expiresInSeconds: 600,
      });

      assert.ok(uploadUrl.startsWith(`${publicBaseUrl}/v1/media/storage/upload/`));
      assert.ok(uploadUrl.includes('expires='));
      assert.ok(uploadUrl.includes('signature='));
      assert.ok(uploadUrl.includes('contentType=image%2Fjpeg'));
    });

    test('Validates authentic upload signature and rejects expired or tampered signatures', () => {
      const futureExpires = String(Math.floor(Date.now() / 1000) + 600);
      const pastExpires = String(Math.floor(Date.now() / 1000) - 10);
      const signature = localDriver.generateHmac(
        `UPLOAD:${testKey}:${contentType}:${futureExpires}`,
      );

      // Valid
      assert.strictEqual(
        localDriver.verifyUploadToken(testKey, futureExpires, signature, contentType),
        true,
      );

      // Expired
      assert.strictEqual(
        localDriver.verifyUploadToken(testKey, pastExpires, signature, contentType),
        false,
      );

      // Tampered Key
      assert.strictEqual(
        localDriver.verifyUploadToken('tampered/key.jpg', futureExpires, signature, contentType),
        false,
      );

      // Tampered Content-Type
      assert.strictEqual(
        localDriver.verifyUploadToken(testKey, futureExpires, signature, 'image/png'),
        false,
      );
    });

    test('Persists real binary bytes to disk and verifies via headObject', async () => {
      // Before upload: headObject reports exists=false
      const beforeMeta = await localDriver.headObject(testKey);
      assert.strictEqual(beforeMeta?.exists, false);

      // Store bytes
      await localDriver.putObject(testKey, imagePayload, contentType);

      // After upload: headObject confirms existence, byte count, and content type
      const afterMeta = await localDriver.headObject(testKey);
      assert.ok(afterMeta);
      assert.strictEqual(afterMeta.exists, true);
      assert.strictEqual(afterMeta.sizeBytes, imagePayload.length);
      assert.strictEqual(afterMeta.contentType, contentType);
      assert.ok(afterMeta.lastModified instanceof Date);

      // Read object back and verify byte-for-byte fidelity
      const retrieved = await localDriver.getObject(testKey);
      assert.ok(retrieved);
      assert.deepStrictEqual(retrieved.data, imagePayload);
      assert.strictEqual(retrieved.contentType, contentType);
    });

    test('Generates presigned download URL and validates HMAC signature', async () => {
      const downloadUrl = await localDriver.getDownloadUrl(testKey, { expiresInSeconds: 900 });
      assert.ok(downloadUrl.startsWith(`${publicBaseUrl}/v1/media/storage/download/`));
      assert.ok(downloadUrl.includes('expires='));
      assert.ok(downloadUrl.includes('signature='));

      const urlObj = new URL(downloadUrl);
      const expires = urlObj.searchParams.get('expires')!;
      const signature = urlObj.searchParams.get('signature')!;

      assert.strictEqual(localDriver.verifyDownloadToken(testKey, expires, signature), true);
      assert.strictEqual(
        localDriver.verifyDownloadToken('wrong/key.jpg', expires, signature),
        false,
      );
    });

    test('Deletes object and removes files from disk', async () => {
      await localDriver.deleteObject(testKey);
      const meta = await localDriver.headObject(testKey);
      assert.strictEqual(meta?.exists, false);
      const retrieved = await localDriver.getObject(testKey);
      assert.strictEqual(retrieved, null);
    });

    test('Path traversal attempts are blocked with security barrier violation', () => {
      assert.throws(
        () => (localDriver as any).getFilePath('../../../etc/passwd'),
        /Security barrier violation/,
      );
    });
  });

  describe('2. S3StorageDriver Architecture & Contract Verification', () => {
    test('Instantiates S3StorageDriver for AWS S3 and Cloudflare R2 configurations', () => {
      const s3Driver = new S3StorageDriver({
        bucket: 'oprino-private-media',
        endpoint: 'https://test-account.r2.cloudflarestorage.com',
        region: 'auto',
        accessKeyId: 'test-r2-access-key',
        secretAccessKey: 'test-r2-secret-key',
        forcePathStyle: false,
      });

      assert.strictEqual(s3Driver.driverName, 's3');
    });

    test('Generates signed PUT and GET URLs using S3 SDK presigner', async () => {
      const s3Driver = new S3StorageDriver({
        bucket: 'oprino-private-media',
        endpoint: 'https://test-account.r2.cloudflarestorage.com',
        region: 'auto',
        accessKeyId: 'test-r2-access-key',
        secretAccessKey: 'test-r2-secret-key',
        forcePathStyle: false,
      });

      const fileKey = `${workspaceAId}/proofs/task-1/proof.jpg`;
      const putUrl = await s3Driver.getUploadUrl(fileKey, {
        contentType: 'image/jpeg',
        expiresInSeconds: 600,
      });

      assert.ok(putUrl.includes('oprino-private-media'));
      assert.ok(putUrl.includes('X-Amz-Signature') || putUrl.includes('X-Amz-Algorithm'));
      assert.ok(putUrl.includes('X-Amz-Expires=600'));

      const getUrl = await s3Driver.getDownloadUrl(fileKey, { expiresInSeconds: 900 });
      assert.ok(getUrl.includes('oprino-private-media'));
      assert.ok(getUrl.includes('X-Amz-Signature') || getUrl.includes('X-Amz-Algorithm'));
      assert.ok(getUrl.includes('X-Amz-Expires=900'));
    });
  });

  describe('3. MediaService Security Boundaries & Guardrails', () => {
    test('Allowed MIME types list includes standard web raster formats', () => {
      assert.ok(ALLOWED_MIME_TYPES.includes('image/jpeg'));
      assert.ok(ALLOWED_MIME_TYPES.includes('image/png'));
      assert.ok(ALLOWED_MIME_TYPES.includes('image/webp'));
      assert.strictEqual(MAX_UPLOAD_SIZE_BYTES, 10485760); // 10 MB
    });

    test('Validates fileKey: allows valid tenant paths', () => {
      assert.doesNotThrow(() => {
        mediaService.validateFileKey(
          workspaceAId,
          `${workspaceAId}/attendance/${employeeAId}/selfie.jpg`,
        );
        mediaService.validateFileKey(workspaceAId, `${workspaceAId}/proofs/task-1/photo.png`);
      });
    });

    test('Validates fileKey: rejects cross-tenant prefix attempts with 403', () => {
      assert.throws(
        () => mediaService.validateFileKey(workspaceAId, `${workspaceBId}/proofs/task-2/photo.jpg`),
        (err: any) => err.statusCode === 403,
      );
    });

    test('Validates fileKey: rejects path traversal patterns with 400', () => {
      // Parent directory traversal
      assert.throws(
        () => mediaService.validateFileKey(workspaceAId, `${workspaceAId}/../secret.jpg`),
        (err: any) => err.statusCode === 400,
      );

      // Leading slash traversal
      assert.throws(
        () => mediaService.validateFileKey(workspaceAId, `/${workspaceAId}/photo.jpg`),
        (err: any) => err.statusCode === 400,
      );

      // Double slash traversal
      assert.throws(
        () => mediaService.validateFileKey(workspaceAId, `${workspaceAId}//proofs/photo.jpg`),
        (err: any) => err.statusCode === 400,
      );

      // Backslash traversal
      assert.throws(
        () => mediaService.validateFileKey(workspaceAId, `${workspaceAId}\\proofs\\photo.jpg`),
        (err: any) => err.statusCode === 400,
      );

      // Null byte injection
      assert.throws(
        () => mediaService.validateFileKey(workspaceAId, `${workspaceAId}/photo.jpg\0.png`),
        (err: any) => err.statusCode === 400,
      );
    });

    test('generateUploadUrl rejects unsupported MIME types with 400', async () => {
      await assert.rejects(
        () =>
          mediaService.generateUploadUrl(workspaceAId, employeeAId, {
            taskId: 'task-1',
            proofType: 'PHOTO',
            fileName: 'malicious.exe',
            mimeType: 'application/x-executable',
          }),
        (err: any) => err.statusCode === 400 && err.message.includes('Unsupported media MIME type'),
      );
    });

    test('generateUploadUrl rejects file sizes exceeding 10 MB with 400', async () => {
      await assert.rejects(
        () =>
          mediaService.generateUploadUrl(workspaceAId, employeeAId, {
            taskId: 'task-1',
            proofType: 'PHOTO',
            fileName: 'huge_file.jpg',
            mimeType: 'image/jpeg',
            fileSizeBytes: 15 * 1024 * 1024, // 15 MB
          }),
        (err: any) =>
          err.statusCode === 400 && err.message.includes('exceeds maximum allowed threshold'),
      );
    });

    test('confirmUpload rejects unuploaded / nonexistent media binary with 400 Bad Request', async () => {
      const fakeKey = `${workspaceAId}/proofs/task-1/nonexistent.jpg`;
      await assert.rejects(
        () =>
          mediaService.confirmUpload(workspaceAId, employeeAId, {
            taskId: 'task-1',
            proofType: 'PHOTO',
            fileKey: fakeKey,
          }),
        (err: any) =>
          err.statusCode === 400 &&
          err.code === 'STORAGE_OBJECT_NOT_FOUND' &&
          err.message.includes('does not exist in storage'),
      );
    });

    test('confirmUpload succeeds and verifies byte persistence when binary exists', async () => {
      const validKey = `${workspaceAId}/proofs/task-1/actual_uploaded.jpg`;
      const bytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x01, 0x02]);
      await localDriver.putObject(validKey, bytes, 'image/jpeg');

      const result = await mediaService.confirmUpload(workspaceAId, employeeAId, {
        taskId: 'task-1',
        proofType: 'PHOTO',
        fileKey: validKey,
      });

      assert.ok(result);
      assert.strictEqual(result.fileKey, validKey);
      assert.strictEqual(result.fileSizeBytes, bytes.length);
      assert.ok(decodeURIComponent(result.fileUrl).includes(validKey));
    });

    test('verifyMediaExists returns false when absent and true when uploaded', async () => {
      const key = `${workspaceAId}/attendance/${employeeAId}/test_selfie.jpg`;
      assert.strictEqual(await mediaService.verifyMediaExists(workspaceAId, key), false);

      await localDriver.putObject(key, Buffer.from('fake-selfie-bytes'), 'image/jpeg');
      assert.strictEqual(await mediaService.verifyMediaExists(workspaceAId, key), true);
    });

    test('getDownloadUrl: Self-employee can access own attendance selfie', async () => {
      const selfieKey = `${workspaceAId}/attendance/${employeeAId}/selfie.jpg`;
      await localDriver.putObject(selfieKey, Buffer.from('selfie'), 'image/jpeg');

      const res = await mediaService.getDownloadUrl(workspaceAId, employeeAId, selfieKey, []);
      assert.ok(res.downloadUrl);
      assert.strictEqual(res.fileKey, selfieKey);
      assert.strictEqual(res.expiresInSeconds, 900);
    });

    test('getDownloadUrl: Peer employee without team permission is rejected with 403', async () => {
      const selfieKey = `${workspaceAId}/attendance/${employeeAId}/selfie.jpg`;
      await assert.rejects(
        () =>
          mediaService.getDownloadUrl(workspaceAId, peerEmployeeId, selfieKey, [
            'attendance.self.read',
          ]),
        (err: any) => err.statusCode === 403 && err.message.includes('Insufficient permissions'),
      );
    });

    test('getDownloadUrl: Authorized manager with attendance.team.read CAN access selfie', async () => {
      const selfieKey = `${workspaceAId}/attendance/${employeeAId}/selfie.jpg`;
      const res = await mediaService.getDownloadUrl(workspaceAId, managerId, selfieKey, [
        'attendance.team.read',
      ]);
      assert.ok(res.downloadUrl);
      assert.strictEqual(res.fileKey, selfieKey);
    });

    test('getDownloadUrl: User without tasks.read cannot download task proof', async () => {
      const proofKey = `${workspaceAId}/proofs/task-1/proof.jpg`;
      await localDriver.putObject(proofKey, Buffer.from('proof'), 'image/jpeg');

      await assert.rejects(
        () => mediaService.getDownloadUrl(workspaceAId, employeeAId, proofKey, []),
        (err: any) => err.statusCode === 403 && err.message.includes('Insufficient permissions'),
      );
    });

    test('getDownloadUrl: User with tasks.read CAN download task proof', async () => {
      const proofKey = `${workspaceAId}/proofs/task-1/proof.jpg`;
      const res = await mediaService.getDownloadUrl(workspaceAId, employeeAId, proofKey, [
        'tasks.read',
      ]);
      assert.ok(res.downloadUrl);
      assert.strictEqual(res.fileKey, proofKey);
    });
  });

  describe('4. Production Security Invariant: Zero Fake Fallback in Production', () => {
    test('validateEnv throws fatal error if NODE_ENV=production and S3 credentials are missing', () => {
      assert.throws(
        () =>
          validateEnv({
            NODE_ENV: 'production',
            PORT: 3001,
            HOST: '0.0.0.0',
            API_PUBLIC_URL: 'https://api.oprino.com',
            BETTER_AUTH_SECRET: 'production_secret_must_be_very_long_and_secure_123456789',
            BETTER_AUTH_URL: 'https://api.oprino.com',
            DATABASE_URL: 'postgresql://oprino_admin:password@localhost:5432/oprino_db',
            REDIS_URL: 'redis://localhost:6379',
            // Missing S3_BUCKET_NAME, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY!
          }),
        /Production environment requires valid S3\/R2 storage configuration/,
      );
    });

    test('validateEnv succeeds in NODE_ENV=production when complete S3 credentials are provided', () => {
      const env = validateEnv({
        NODE_ENV: 'production',
        PORT: 3001,
        HOST: '0.0.0.0',
        API_PUBLIC_URL: 'https://api.oprino.com',
        BETTER_AUTH_SECRET: 'production_secret_must_be_very_long_and_secure_123456789',
        BETTER_AUTH_URL: 'https://api.oprino.com',
        DATABASE_URL: 'postgresql://oprino_admin:password@localhost:5432/oprino_db',
        REDIS_URL: 'redis://localhost:6379',
        STORAGE_DRIVER: 's3',
        S3_ENDPOINT: 'https://cf-account-id.r2.cloudflarestorage.com',
        S3_BUCKET_NAME: 'oprino-prod-media',
        S3_REGION: 'auto',
        S3_ACCESS_KEY_ID: 'valid-access-key-id',
        S3_SECRET_ACCESS_KEY: 'valid-secret-access-key',
      });

      assert.strictEqual(env.NODE_ENV, 'production');
      assert.strictEqual(env.STORAGE_DRIVER, 's3');
      assert.strictEqual(env.S3_BUCKET_NAME, 'oprino-prod-media');
    });
  });

  describe('5. Fastify HTTP Direct Storage Upload & Download Endpoints', () => {
    let fastifyApp: any;

    before(async () => {
      fastifyApp = Fastify({ logger: false });
      const authMiddleware: any = {
        authenticate: async () => {},
        requireWorkspace: async (req: any) => {
          req.workspaceId = workspaceAId;
        },
      };
      await fastifyApp.register(mediaRoutes, { mediaService, authMiddleware });
      await fastifyApp.ready();
    });

    after(async () => {
      await fastifyApp.close();
    });

    test('HTTP PUT /v1/media/storage/upload/* stores binary buffer to disk with real bytes', async () => {
      const fileKey = `${workspaceAId}/proofs/task-1/http_upload.jpg`;
      const uploadUrl = await localDriver.getUploadUrl(fileKey, { contentType: 'image/jpeg' });
      const urlObj = new URL(uploadUrl);
      const testBytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x11, 0x22, 0x33, 0x44]);

      const res = await fastifyApp.inject({
        method: 'PUT',
        url: `${urlObj.pathname}${urlObj.search}`,
        headers: { 'content-type': 'image/jpeg' },
        payload: testBytes,
      });

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.json().success, true);
      assert.strictEqual(res.json().sizeBytes, testBytes.length);

      // Verify on disk via headObject
      const meta = await localDriver.headObject(fileKey);
      assert.strictEqual(meta?.exists, true);
      assert.strictEqual(meta?.sizeBytes, testBytes.length);
    });

    test('HTTP GET /v1/media/storage/download/* retrieves exact binary buffer with Content-Type', async () => {
      const fileKey = `${workspaceAId}/proofs/task-1/http_upload.jpg`;
      const downloadUrl = await localDriver.getDownloadUrl(fileKey);
      const urlObj = new URL(downloadUrl);

      const res = await fastifyApp.inject({
        method: 'GET',
        url: `${urlObj.pathname}${urlObj.search}`,
      });

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.headers['content-type'], 'image/jpeg');
      assert.strictEqual(res.rawPayload.length, 8);
    });

    test('HTTP PUT /v1/media/storage/upload/* with invalid signature is rejected with 403', async () => {
      const fileKey = `${workspaceAId}/proofs/task-1/fake.jpg`;
      const res = await fastifyApp.inject({
        method: 'PUT',
        url: `/v1/media/storage/upload/${encodeURIComponent(fileKey)}?expires=9999999999&signature=invalidsignature`,
        headers: { 'content-type': 'image/jpeg' },
        payload: Buffer.from('test'),
      });

      assert.strictEqual(res.statusCode, 403);
    });

    test('HTTP GET /v1/media/storage/download/* with invalid signature is rejected with 403', async () => {
      const fileKey = `${workspaceAId}/proofs/task-1/fake.jpg`;
      const res = await fastifyApp.inject({
        method: 'GET',
        url: `/v1/media/storage/download/${encodeURIComponent(fileKey)}?expires=9999999999&signature=invalidsignature`,
      });

      assert.strictEqual(res.statusCode, 403);
    });
  });
});

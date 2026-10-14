import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import * as os from 'node:os';
import * as path from 'node:path';
import * as fs from 'node:fs';
import Fastify from 'fastify';
import { LocalStorageDriver } from './storage/local-driver.js';
import { S3StorageDriver } from './storage/s3-driver.js';
import { MediaService, ALLOWED_MIME_TYPES } from './services/media.service.js';
import { AttendanceService } from './services/attendance.service.js';
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

  const insertedProofRecords: any[] = [];

  const mockDb: any = {
    transaction: async (fn: any) => {
      const tx = {
        execute: async () => {},
        select: (_fields?: any) => ({
          from: (_table?: any) => ({
            leftJoin: () => ({ leftJoin: () => ({ where: () => [] }) }),
            where: (_cond?: any) => {
              return {
                limit: () => {
                  return [];
                },
                then: (resolve: any) => resolve([{ id: 'task-1', name: 'Test User' }]),
                [Symbol.iterator]: function* () {
                  yield { id: 'task-1', name: 'Test User' };
                },
              };
            },
          }),
        }),
        insert: (_table?: any) => ({
          values: (vals: any) => {
            insertedProofRecords.push(vals);
            return {
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
            };
          },
        }),
      };
      return fn(tx);
    },
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
      const deleteKey = `${workspaceAId}/proofs/task-99/temp.jpg`;
      await localDriver.putObject(deleteKey, Buffer.from('delete-me'), 'image/jpeg');
      assert.strictEqual((await localDriver.headObject(deleteKey))?.exists, true);

      await localDriver.deleteObject(deleteKey);
      assert.strictEqual((await localDriver.headObject(deleteKey))?.exists, false);
      assert.strictEqual(await localDriver.getObject(deleteKey), null);
    });

    test('Path traversal attempts are blocked with security barrier violation', async () => {
      await assert.rejects(
        () => localDriver.putObject('../etc/passwd', Buffer.from('evil'), 'text/plain'),
        /Security barrier violation/,
      );
      await assert.rejects(
        () => localDriver.getObject('/etc/shadow'),
        /Security barrier violation/,
      );
      await assert.rejects(
        () => localDriver.getObject('..\\windows\\system32'),
        /Security barrier violation/,
      );
      assert.strictEqual((await localDriver.headObject('..\\windows\\system32'))?.exists, false);
    });
  });

  describe('2. S3StorageDriver Architecture & Contract Verification', () => {
    test('Instantiates S3StorageDriver for AWS S3 and Cloudflare R2 configurations', () => {
      const s3Driver = new S3StorageDriver({
        bucket: 'oprino-private-media',
        region: 'auto',
        endpoint: 'https://test-account.r2.cloudflarestorage.com',
        accessKeyId: 'test-access-key-id',
        secretAccessKey: 'test-secret-access-key',
        forcePathStyle: true,
      });

      assert.strictEqual(s3Driver.driverName, 's3');
      assert.strictEqual(typeof s3Driver.getUploadUrl, 'function');
      assert.strictEqual(typeof s3Driver.getDownloadUrl, 'function');
      assert.strictEqual(typeof s3Driver.headObject, 'function');
      assert.strictEqual(typeof s3Driver.deleteObject, 'function');
    });

    test('Generates signed PUT and GET URLs using S3 SDK presigner', async () => {
      const s3Driver = new S3StorageDriver({
        bucket: 'oprino-private-media',
        region: 'us-east-1',
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
      });

      const key = `${workspaceAId}/proofs/task-1/sample.jpg`;
      const putUrl = await s3Driver.getUploadUrl(key, {
        contentType: 'image/jpeg',
        expiresInSeconds: 300,
      });
      assert.ok(putUrl.includes('oprino-private-media'));
      assert.ok(putUrl.includes('X-Amz-Signature='));
      assert.ok(putUrl.includes('X-Amz-Expires=300'));

      const getUrl = await s3Driver.getDownloadUrl(key, { expiresInSeconds: 600 });
      assert.ok(getUrl.includes('oprino-private-media'));
      assert.ok(getUrl.includes('X-Amz-Signature='));
      assert.ok(getUrl.includes('X-Amz-Expires=600'));
    });
  });

  describe('3. MediaService Security Boundaries & Guardrails', () => {
    test('Allowed MIME types list includes standard web raster formats', () => {
      assert.deepStrictEqual(ALLOWED_MIME_TYPES, ['image/jpeg', 'image/png', 'image/webp']);
    });

    test('Validates fileKey: allows valid tenant paths', () => {
      assert.doesNotThrow(() => {
        mediaService.validateFileKey(workspaceAId, `${workspaceAId}/proofs/task-1/photo.jpg`);
      });
    });

    test('Validates fileKey: rejects cross-tenant prefix attempts with 403', () => {
      assert.throws(
        () => mediaService.validateFileKey(workspaceAId, `${workspaceBId}/proofs/task-1/photo.jpg`),
        (err: any) => err.statusCode === 403 && err.message.includes('Security barrier violation'),
      );
    });

    test('Validates fileKey: rejects path traversal patterns with 400', () => {
      // Relative directory traversal
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

    test('confirmUpload rejects entity mismatch between taskId and fileKey with 403', async () => {
      const mismatchKey = `${workspaceAId}/proofs/task-DIFFERENT/mismatch.jpg`;
      await localDriver.putObject(mismatchKey, Buffer.from([0xff, 0xd8, 0xff, 0xe0]), 'image/jpeg');

      await assert.rejects(
        () =>
          mediaService.confirmUpload(workspaceAId, employeeAId, {
            taskId: 'task-1',
            proofType: 'PHOTO',
            fileKey: mismatchKey,
          }),
        (err: any) => err.statusCode === 403 && err.message.includes('entity'),
      );
    });

    test('confirmUpload rejects zero-byte empty uploaded file with 400', async () => {
      const zeroKey = `${workspaceAId}/proofs/task-1/empty.jpg`;
      await localDriver.putObject(zeroKey, Buffer.from([]), 'image/jpeg');

      await assert.rejects(
        () =>
          mediaService.confirmUpload(workspaceAId, employeeAId, {
            taskId: 'task-1',
            proofType: 'PHOTO',
            fileKey: zeroKey,
          }),
        (err: any) => err.statusCode === 400 && err.code === 'EMPTY_MEDIA_FILE',
      );
    });

    test('confirmUpload succeeds, stores durable key, and does not persist permanent presigned URL', async () => {
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

      // Invariant: Verify that database record received fileUrl: null (avoiding stale expired URLs)
      const lastInserted = insertedProofRecords[insertedProofRecords.length - 1];
      assert.strictEqual(lastInserted.fileUrl, null);
      assert.strictEqual(lastInserted.fileKey, validKey);
    });

    test('confirmUpload rejects replay when fileKey was already confirmed', async () => {
      const replayKey = `${workspaceAId}/proofs/task-1/replay_test.jpg`;
      await localDriver.putObject(replayKey, Buffer.from([0xff, 0xd8, 0xff, 0xe0]), 'image/jpeg');

      // Create a service with replay db
      const replayDb: any = {
        transaction: async (fn: any) => {
          return fn({
            execute: async () => {},
            select: () => ({
              from: () => ({
                where: () => {
                  const arr: any = [{ id: 'task-1' }];
                  arr.limit = () => [{ id: 'already-existing-proof' }];
                  return arr;
                },
              }),
            }),
          });
        },
      };
      const serviceWithReplay = new MediaService(replayDb, localDriver, publicBaseUrl);

      await assert.rejects(
        () =>
          serviceWithReplay.confirmUpload(workspaceAId, employeeAId, {
            taskId: 'task-1',
            proofType: 'PHOTO',
            fileKey: replayKey,
          }),
        (err: any) => err.statusCode === 400 && err.code === 'PROOF_REPLAY_DETECTED',
      );
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

    test('getDownloadUrl: Default-deny policy blocks unclassified media categories with 403', async () => {
      const unclassifiedKey = `${workspaceAId}/secret_docs/internal.pdf`;
      await assert.rejects(
        () => mediaService.getDownloadUrl(workspaceAId, employeeAId, unclassifiedKey, ['admin']),
        (err: any) => err.statusCode === 403 && err.message.includes('unclassified media category'),
      );
    });

    test('getDownloadUrl: Nonexistent storage file returns 404', async () => {
      const absentKey = `${workspaceAId}/proofs/task-1/absent.jpg`;
      await assert.rejects(
        () => mediaService.getDownloadUrl(workspaceAId, employeeAId, absentKey, ['tasks.read']),
        (err: any) => err.statusCode === 404 && err.message.includes('not found'),
      );
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
            // Missing S3 credentials!
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

  describe('5. Fastify HTTP Direct Storage Upload & Download Endpoints (Negative & Regression Tests)', () => {
    let fastifyApp: any;

    before(async () => {
      fastifyApp = Fastify({ logger: false });
      const authMiddleware: any = {
        authenticate: async (req: any, reply: any) => {
          if (!req.headers.authorization) {
            return reply.status(401).send({ statusCode: 401, error: 'Unauthorized' });
          }
          req.user = { id: employeeAId };
        },
        requireWorkspace: async (req: any, reply: any) => {
          const wsHeader = req.headers['x-workspace-id'];
          if (!wsHeader) {
            return reply.status(400).send({ statusCode: 400, error: 'Missing Workspace' });
          }
          req.workspaceId = wsHeader;
          req.permissions = ['tasks.read', 'attendance.self.read'];
        },
      };
      await fastifyApp.register(mediaRoutes, { mediaService, authMiddleware });
      await fastifyApp.ready();
    });

    after(async () => {
      await fastifyApp.close();
    });

    test('1. HTTP PUT /v1/media/storage/upload/* stores binary with valid signature', async () => {
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

    test('2. Unsigned upload rejected with 403 Forbidden', async () => {
      const fileKey = `${workspaceAId}/proofs/task-1/unsigned_upload.jpg`;
      const res = await fastifyApp.inject({
        method: 'PUT',
        url: `/v1/media/storage/upload/${encodeURIComponent(fileKey)}`,
        headers: { 'content-type': 'image/jpeg' },
        payload: Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
      });

      assert.strictEqual(res.statusCode, 403);
      assert.ok(res.json().message.includes('Missing mandatory upload signature'));
    });

    test('3. Unsigned download rejected with 403 Forbidden', async () => {
      const fileKey = `${workspaceAId}/proofs/task-1/http_upload.jpg`;
      const res = await fastifyApp.inject({
        method: 'GET',
        url: `/v1/media/storage/download/${encodeURIComponent(fileKey)}`,
      });

      assert.strictEqual(res.statusCode, 403);
      assert.ok(res.json().message.includes('Missing mandatory download signature'));
    });

    test('4. Invalid signature upload rejected with 403 Forbidden', async () => {
      const fileKey = `${workspaceAId}/proofs/task-1/fake.jpg`;
      const res = await fastifyApp.inject({
        method: 'PUT',
        url: `/v1/media/storage/upload/${encodeURIComponent(fileKey)}?expires=9999999999&signature=invalidsignature`,
        headers: { 'content-type': 'image/jpeg' },
        payload: Buffer.from('test'),
      });

      assert.strictEqual(res.statusCode, 403);
      assert.ok(res.json().message.includes('Invalid or expired upload signature token'));
    });

    test('5. Expired signature upload rejected with 403 Forbidden', async () => {
      const fileKey = `${workspaceAId}/proofs/task-1/expired.jpg`;
      const pastExpires = String(Math.floor(Date.now() / 1000) - 100);
      const signature = localDriver.generateHmac(`UPLOAD:${fileKey}:image/jpeg:${pastExpires}`);

      const res = await fastifyApp.inject({
        method: 'PUT',
        url: `/v1/media/storage/upload/${encodeURIComponent(fileKey)}?expires=${pastExpires}&signature=${signature}`,
        headers: { 'content-type': 'image/jpeg' },
        payload: Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
      });

      assert.strictEqual(res.statusCode, 403);
    });

    test('6. Tampered key in upload rejected with 403 Forbidden', async () => {
      const keyA = `${workspaceAId}/proofs/task-1/keyA.jpg`;
      const keyB = `${workspaceAId}/proofs/task-1/keyB.jpg`;
      const expires = String(Math.floor(Date.now() / 1000) + 600);
      const signatureForA = localDriver.generateHmac(`UPLOAD:${keyA}:image/jpeg:${expires}`);

      // Attempt to use key A's signature to upload to key B
      const res = await fastifyApp.inject({
        method: 'PUT',
        url: `/v1/media/storage/upload/${encodeURIComponent(keyB)}?expires=${expires}&signature=${signatureForA}&contentType=image%2Fjpeg`,
        headers: { 'content-type': 'image/jpeg' },
        payload: Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
      });

      assert.strictEqual(res.statusCode, 403);
    });

    test('7. Content-Type mismatch between signed query and header rejected with 400', async () => {
      const fileKey = `${workspaceAId}/proofs/task-1/mismatch.jpg`;
      const expires = String(Math.floor(Date.now() / 1000) + 600);
      const signature = localDriver.generateHmac(`UPLOAD:${fileKey}:image/jpeg:${expires}`);

      const res = await fastifyApp.inject({
        method: 'PUT',
        url: `/v1/media/storage/upload/${encodeURIComponent(fileKey)}?expires=${expires}&signature=${signature}&contentType=image%2Fjpeg`,
        headers: { 'content-type': 'image/png' },
        payload: Buffer.from('data'),
      });

      assert.strictEqual(res.statusCode, 400);
      assert.ok(res.json().message.includes('Content-Type mismatch'));
    });

    test('8. Unsupported Content-Type upload rejected with 400 or 415', async () => {
      const fileKey = `${workspaceAId}/proofs/task-1/evil.sh`;
      const res = await fastifyApp.inject({
        method: 'PUT',
        url: `/v1/media/storage/upload/${encodeURIComponent(fileKey)}?expires=9999999999&signature=testsig`,
        headers: { 'content-type': 'application/x-sh' },
        payload: Buffer.from('echo evil'),
      });

      assert.ok(
        res.statusCode === 400 || res.statusCode === 415,
        `Expected 400 or 415, got ${res.statusCode}`,
      );
    });

    test('9. Zero-byte upload rejected with 400 Bad Request', async () => {
      const fileKey = `${workspaceAId}/proofs/task-1/zerobyte.jpg`;
      const uploadUrl = await localDriver.getUploadUrl(fileKey, { contentType: 'image/jpeg' });
      const urlObj = new URL(uploadUrl);

      const res = await fastifyApp.inject({
        method: 'PUT',
        url: `${urlObj.pathname}${urlObj.search}`,
        headers: { 'content-type': 'image/jpeg' },
        payload: Buffer.from([]),
      });

      assert.strictEqual(res.statusCode, 400);
      assert.ok(res.json().message.includes('Empty file upload'));
    });

    test('10. Path traversal in direct upload/download URL rejected with 400', async () => {
      const resUpload = await fastifyApp.inject({
        method: 'PUT',
        url: `/v1/media/storage/upload/${encodeURIComponent(`${workspaceAId}/../evil.jpg`)}?expires=9999999999&signature=sig`,
        headers: { 'content-type': 'image/jpeg' },
        payload: Buffer.from('evil'),
      });
      assert.strictEqual(resUpload.statusCode, 400);

      const resDownload = await fastifyApp.inject({
        method: 'GET',
        url: `/v1/media/storage/download/${encodeURIComponent(`${workspaceAId}/../evil.jpg`)}?expires=9999999999&signature=sig`,
      });
      assert.strictEqual(resDownload.statusCode, 400);
    });

    test('11. Legacy /v1/media/mock-upload/* route is completely removed (returns 404)', async () => {
      const res = await fastifyApp.inject({
        method: 'PUT',
        url: '/v1/media/mock-upload/something.jpg',
        headers: { 'content-type': 'image/jpeg' },
        payload: Buffer.from('test'),
      });

      assert.strictEqual(res.statusCode, 404);
    });

    test('12. S3StorageDriver blocks unauthenticated direct upload & download proxy with 403', async () => {
      const s3FastifyApp = Fastify({ logger: false });
      const s3Driver = new S3StorageDriver({
        bucket: 'oprino-test-bucket',
        region: 'auto',
        accessKeyId: 'test-id',
        secretAccessKey: 'test-secret',
      });
      const s3MediaService = new MediaService(mockDb, s3Driver, publicBaseUrl);

      const authMiddleware: any = {
        authenticate: async () => {},
        requireWorkspace: async () => {},
      };
      await s3FastifyApp.register(mediaRoutes, { mediaService: s3MediaService, authMiddleware });
      await s3FastifyApp.ready();

      const putRes = await s3FastifyApp.inject({
        method: 'PUT',
        url: '/v1/media/storage/upload/test.jpg',
        headers: { 'content-type': 'image/jpeg' },
        payload: Buffer.from('bytes'),
      });
      assert.strictEqual(putRes.statusCode, 403);
      assert.ok(putRes.json().message.includes('Direct API storage proxy upload is disabled'));

      const getRes = await s3FastifyApp.inject({
        method: 'GET',
        url: '/v1/media/storage/download/test.jpg',
      });
      assert.strictEqual(getRes.statusCode, 403);
      assert.ok(getRes.json().message.includes('Direct API storage proxy download is disabled'));

      await s3FastifyApp.close();
    });

    test('13. POST /v1/media/download-url unauthenticated request rejected with 401', async () => {
      const res = await fastifyApp.inject({
        method: 'POST',
        url: '/v1/media/download-url',
        payload: { fileKey: `${workspaceAId}/proofs/task-1/photo.jpg` },
      });

      assert.strictEqual(res.statusCode, 401);
    });

    test('14. POST /v1/media/download-url cross-workspace request rejected with 403', async () => {
      const res = await fastifyApp.inject({
        method: 'POST',
        url: '/v1/media/download-url',
        headers: {
          authorization: 'Bearer valid_token',
          'x-workspace-id': workspaceAId,
        },
        payload: { fileKey: `${workspaceBId}/proofs/task-1/photo.jpg` },
      });

      assert.strictEqual(res.statusCode, 403);
    });
  });

  describe('6. AttendanceService Selfie Ownership & Integrity Invariants', () => {
    let attendanceService: AttendanceService;

    before(() => {
      const createChain = (data: any[] = []) => {
        const arr: any = [...data];
        arr.where = () => createChain(data);
        arr.limit = () => createChain(data);
        arr.leftJoin = () => createChain(data);
        return arr;
      };

      const attendanceMockDb: any = {
        transaction: async (fn: any) => {
          return fn({
            execute: async () => {},
            select: (fields?: any) => ({
              from: () => {
                if (fields && 'attendancePolicy' in fields) {
                  return createChain([{ attendancePolicy: 'SELFIE_REQUIRED' }]);
                }
                return createChain([]);
              },
            }),
            insert: () => ({
              values: (vals: any) => ({
                returning: () => [
                  {
                    id: 'session-1',
                    workspaceId: vals.workspaceId,
                    userId: vals.userId,
                    status: 'ON_DUTY',
                    punchInTime: new Date(),
                    punchOutTime: null,
                    selfieMediaKey: vals.selfieMediaKey,
                    isLate: false,
                    lateMinutes: 0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  },
                ],
              }),
            }),
          });
        },
      };

      attendanceService = new AttendanceService(attendanceMockDb, mediaService);
    });

    test('Employee cannot punch in using another employee selfie key (403 Forbidden)', async () => {
      // Peer employee's selfie key
      const peerSelfieKey = `${workspaceAId}/attendance/${peerEmployeeId}/selfie.jpg`;
      await localDriver.putObject(peerSelfieKey, Buffer.from('bytes'), 'image/jpeg');

      await assert.rejects(
        () =>
          attendanceService.punchIn(workspaceAId, employeeAId, {
            idempotencyKey: 'punch-ownership-test',
            selfieMediaKey: peerSelfieKey,
          }),
        (err: any) =>
          err.statusCode === 403 &&
          err.code === 'FORBIDDEN_SELFIE_OWNERSHIP' &&
          err.message.includes("cannot use another employee's attendance selfie"),
      );
    });

    test('Punch in fails if selfie binary was never uploaded to storage (400 Bad Request)', async () => {
      const missingSelfieKey = `${workspaceAId}/attendance/${employeeAId}/missing_selfie.jpg`;

      await assert.rejects(
        () =>
          attendanceService.punchIn(workspaceAId, employeeAId, {
            idempotencyKey: 'punch-missing-test',
            selfieMediaKey: missingSelfieKey,
          }),
        (err: any) =>
          err.statusCode === 400 &&
          err.code === 'MISSING_SELFIE_BINARY' &&
          err.message.includes('does not exist in storage'),
      );
    });

    test('Punch in fails if selfie binary in storage is empty 0 bytes (400 Bad Request)', async () => {
      const zeroSelfieKey = `${workspaceAId}/attendance/${employeeAId}/zero_selfie.jpg`;
      await localDriver.putObject(zeroSelfieKey, Buffer.from([]), 'image/jpeg');

      await assert.rejects(
        () =>
          attendanceService.punchIn(workspaceAId, employeeAId, {
            idempotencyKey: 'punch-zero-test',
            selfieMediaKey: zeroSelfieKey,
          }),
        (err: any) =>
          err.statusCode === 400 &&
          err.code === 'EMPTY_SELFIE_BINARY' &&
          err.message.includes('empty (0 bytes)'),
      );
    });

    test('Punch in succeeds when employee provides their own uploaded selfie binary', async () => {
      const validSelfieKey = `${workspaceAId}/attendance/${employeeAId}/valid_selfie.jpg`;
      const validBytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x11, 0x22]);
      await localDriver.putObject(validSelfieKey, validBytes, 'image/jpeg');

      const session = await attendanceService.punchIn(workspaceAId, employeeAId, {
        idempotencyKey: 'punch-valid-selfie-test',
        selfieMediaKey: validSelfieKey,
      });

      assert.ok(session);
      assert.strictEqual(session.status, 'ON_DUTY');
      assert.strictEqual(session.selfieMediaKey, validSelfieKey);
    });
  });
});

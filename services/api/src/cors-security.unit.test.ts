import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildServer } from './server.js';

describe('CORS Security Boundaries & Credentialed Authorization Tests', () => {
  const baseTestEnv = {
    NODE_ENV: 'production',
    APP_ENV: 'production',
    API_PUBLIC_URL: 'https://oprino-api.onrender.com',
    BETTER_AUTH_URL: 'https://oprino-api.onrender.com',
    APP_PUBLIC_URL: 'https://oprino.vercel.app',
    BETTER_AUTH_SECRET: 'super_secret_production_auth_key_1234567890',
    DATABASE_URL: 'postgresql://prod_user:strong_prod_pass@db.aws.neon.tech:5432/oprino_prod',
    REDIS_URL: 'rediss://default:upstash_token@oprino-redis.upstash.io:6379',
    STORAGE_DRIVER: 's3',
    S3_BUCKET_NAME: 'oprino-production-media',
    S3_ACCESS_KEY_ID: 'valid_r2_access_key',
    S3_SECRET_ACCESS_KEY: 'valid_r2_secret_key',
    CORS_ORIGINS: 'https://oprino.vercel.app,https://app.oprino.com',
  };

  const mockDbClient = {
    db: {} as any,
    client: { end: async () => {} } as any,
  };

  it('1. Authorizes legitimate production web origin with credentials', async () => {
    const { app } = buildServer({ env: baseTestEnv as any, dbClient: mockDbClient });
    const res = await app.inject({
      method: 'OPTIONS',
      url: '/health/live',
      headers: {
        origin: 'https://oprino.vercel.app',
        'access-control-request-method': 'GET',
      },
    });

    assert.strictEqual(res.statusCode, 204);
    assert.strictEqual(res.headers['access-control-allow-origin'], 'https://oprino.vercel.app');
    assert.strictEqual(res.headers['access-control-allow-credentials'], 'true');
  });

  it('2. Authorizes legitimate preview deployment matching strict oprino pattern with credentials', async () => {
    const { app } = buildServer({ env: baseTestEnv as any, dbClient: mockDbClient });
    const res = await app.inject({
      method: 'OPTIONS',
      url: '/health/live',
      headers: {
        origin: 'https://oprino-preview-deploy-123.vercel.app',
        'access-control-request-method': 'GET',
      },
    });

    assert.strictEqual(res.statusCode, 204);
    assert.strictEqual(res.headers['access-control-allow-origin'], 'https://oprino-preview-deploy-123.vercel.app');
    assert.strictEqual(res.headers['access-control-allow-credentials'], 'true');
  });

  it('3. Strictly rejects arbitrary untrusted third-party Vercel domains (prevents credentialed theft)', async () => {
    const { app } = buildServer({ env: baseTestEnv as any, dbClient: mockDbClient });
    const res = await app.inject({
      method: 'OPTIONS',
      url: '/health/live',
      headers: {
        origin: 'https://malicious-attacker.vercel.app',
        'access-control-request-method': 'GET',
      },
    });

    assert.strictEqual(res.statusCode, 204);
    assert.strictEqual(res.headers['access-control-allow-origin'], undefined, 'Must NOT reflect untrusted Vercel origin');
  });

  it('4. Strictly rejects cleartext HTTP even for legitimate domain', async () => {
    const { app } = buildServer({ env: baseTestEnv as any, dbClient: mockDbClient });
    const res = await app.inject({
      method: 'OPTIONS',
      url: '/health/live',
      headers: {
        origin: 'http://oprino.vercel.app',
        'access-control-request-method': 'GET',
      },
    });

    assert.strictEqual(res.statusCode, 204);
    assert.strictEqual(res.headers['access-control-allow-origin'], undefined, 'Must NOT reflect cleartext HTTP origin');
  });

  it('5. Strictly rejects suffix injection attacks targeting Vercel regex', async () => {
    const { app } = buildServer({ env: baseTestEnv as any, dbClient: mockDbClient });
    const res = await app.inject({
      method: 'OPTIONS',
      url: '/health/live',
      headers: {
        origin: 'https://evil-oprino.vercel.app.attacker.com',
        'access-control-request-method': 'GET',
      },
    });

    assert.strictEqual(res.statusCode, 204);
    assert.strictEqual(res.headers['access-control-allow-origin'], undefined, 'Must NOT reflect suffix spoofing origin');
  });
});

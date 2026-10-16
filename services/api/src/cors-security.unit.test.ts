import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { FastifyInstance } from 'fastify';
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

  let app: FastifyInstance;

  before(async () => {
    const server = buildServer({ env: baseTestEnv as any, dbClient: mockDbClient });
    app = server.app;
    await app.ready();
  });

  after(async () => {
    await app.close();
  });

  it('1. Authorizes legitimate production web origin with credentials', async () => {
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

  it('2. Authorizes legitimate preview deployment matching verified team-scoped namespace with credentials', async () => {
    const res = await app.inject({
      method: 'OPTIONS',
      url: '/health/live',
      headers: {
        origin: 'https://oprino-preview-deploy-123-djsushilkumar.vercel.app',
        'access-control-request-method': 'GET',
      },
    });

    assert.strictEqual(res.statusCode, 204);
    assert.strictEqual(res.headers['access-control-allow-origin'], 'https://oprino-preview-deploy-123-djsushilkumar.vercel.app');
    assert.strictEqual(res.headers['access-control-allow-credentials'], 'true');
  });

  it('3. Authorizes legitimate preview deployment with team suffix and branch slug', async () => {
    const res = await app.inject({
      method: 'OPTIONS',
      url: '/health/live',
      headers: {
        origin: 'https://oprino-git-feat-billing-djsushilkumar-7890.vercel.app',
        'access-control-request-method': 'GET',
      },
    });

    assert.strictEqual(res.statusCode, 204);
    assert.strictEqual(res.headers['access-control-allow-origin'], 'https://oprino-git-feat-billing-djsushilkumar-7890.vercel.app');
    assert.strictEqual(res.headers['access-control-allow-credentials'], 'true');
  });

  it('4. Authorizes explicitly configured extra origin from CORS_ORIGINS with credentials', async () => {
    const res = await app.inject({
      method: 'OPTIONS',
      url: '/health/live',
      headers: {
        origin: 'https://app.oprino.com',
        'access-control-request-method': 'GET',
      },
    });

    assert.strictEqual(res.statusCode, 204);
    assert.strictEqual(res.headers['access-control-allow-origin'], 'https://app.oprino.com');
    assert.strictEqual(res.headers['access-control-allow-credentials'], 'true');
  });

  it('5. Negative test: Strictly rejects third-party domain imitating oprino-attacker prefix', async () => {
    const res = await app.inject({
      method: 'OPTIONS',
      url: '/health/live',
      headers: {
        origin: 'https://oprino-attacker.vercel.app',
        'access-control-request-method': 'GET',
      },
    });

    assert.strictEqual(res.statusCode, 204);
    assert.strictEqual(res.headers['access-control-allow-origin'], undefined, 'Must NOT reflect third-party domain imitating oprino prefix');
  });

  it('6. Negative test: Strictly rejects third-party domain imitating oprino-evil prefix', async () => {
    const res = await app.inject({
      method: 'OPTIONS',
      url: '/health/live',
      headers: {
        origin: 'https://oprino-evil.vercel.app',
        'access-control-request-method': 'GET',
      },
    });

    assert.strictEqual(res.statusCode, 204);
    assert.strictEqual(res.headers['access-control-allow-origin'], undefined, 'Must NOT reflect oprino-evil prefix');
  });

  it('7. Negative test: Strictly rejects third-party domain imitating oprino-fake-login prefix', async () => {
    const res = await app.inject({
      method: 'OPTIONS',
      url: '/health/live',
      headers: {
        origin: 'https://oprino-fake-login.vercel.app',
        'access-control-request-method': 'GET',
      },
    });

    assert.strictEqual(res.statusCode, 204);
    assert.strictEqual(res.headers['access-control-allow-origin'], undefined, 'Must NOT reflect oprino-fake-login prefix');
  });

  it('8. Negative test: Strictly rejects unscoped Vercel deployment lacking verified team namespace', async () => {
    const res = await app.inject({
      method: 'OPTIONS',
      url: '/health/live',
      headers: {
        origin: 'https://oprino-preview-deploy-123.vercel.app',
        'access-control-request-method': 'GET',
      },
    });

    assert.strictEqual(res.statusCode, 204);
    assert.strictEqual(res.headers['access-control-allow-origin'], undefined, 'Must NOT reflect unscoped preview domain');
  });

  it('9. Negative test: Strictly rejects arbitrary third-party Vercel domains', async () => {
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

  it('10. Negative test: Strictly rejects cleartext HTTP even for legitimate domain', async () => {
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

  it('11. Negative test: Strictly rejects suffix injection attacks targeting Vercel regex', async () => {
    const res = await app.inject({
      method: 'OPTIONS',
      url: '/health/live',
      headers: {
        origin: 'https://oprino-preview-djsushilkumar.vercel.app.attacker.com',
        'access-control-request-method': 'GET',
      },
    });

    assert.strictEqual(res.statusCode, 204);
    assert.strictEqual(res.headers['access-control-allow-origin'], undefined, 'Must NOT reflect suffix spoofing origin');
  });
});

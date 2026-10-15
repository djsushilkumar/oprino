import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validateEnv } from './config/env.js';
import { resolveCanonicalInvitationBaseUrl } from './routes/workspaces.js';
import Fastify from 'fastify';
import { versionRoutes } from './routes/version.js';

describe('Production Environment Configuration Hardening (Fail-Closed Gates)', () => {
  const baseValidProdEnv = {
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

  it('1. Passes cleanly with verified, secure production configuration', () => {
    const validated = validateEnv(baseValidProdEnv);
    assert.strictEqual(validated.API_PUBLIC_URL, 'https://oprino-api.onrender.com');
    assert.strictEqual(validated.APP_PUBLIC_URL, 'https://oprino.vercel.app');
    assert.strictEqual(validated.STORAGE_DRIVER, 's3');
  });

  it('2. Strictly rejects cleartext HTTP in API_PUBLIC_URL in production', () => {
    assert.throws(
      () =>
        validateEnv({
          ...baseValidProdEnv,
          API_PUBLIC_URL: 'http://oprino-api.onrender.com',
        }),
      /Public origin must use HTTPS scheme/,
    );
  });

  it('3. Strictly rejects localhost loopback in API_PUBLIC_URL in production', () => {
    assert.throws(
      () =>
        validateEnv({
          ...baseValidProdEnv,
          API_PUBLIC_URL: 'https://localhost:3001',
        }),
      /Cannot target loopback, emulator, or private IP address/,
    );
  });

  it('4. Strictly rejects 127.0.0.1 in API_PUBLIC_URL in production', () => {
    assert.throws(
      () =>
        validateEnv({
          ...baseValidProdEnv,
          API_PUBLIC_URL: 'https://127.0.0.1:3001',
        }),
      /Cannot target loopback, emulator, or private IP address/,
    );
  });

  it('5. Strictly rejects Android emulator 10.0.2.2 in API_PUBLIC_URL in production', () => {
    assert.throws(
      () =>
        validateEnv({
          ...baseValidProdEnv,
          API_PUBLIC_URL: 'https://10.0.2.2:3001',
        }),
      /Cannot target loopback, emulator, or private IP address/,
    );
  });

  it('6. Strictly rejects private LAN IPs (192.168.x.x) in API_PUBLIC_URL in production', () => {
    assert.throws(
      () =>
        validateEnv({
          ...baseValidProdEnv,
          API_PUBLIC_URL: 'https://192.168.1.50:3001',
        }),
      /Cannot target loopback, emulator, or private IP address/,
    );
  });

  it('7. Strictly rejects localhost in BETTER_AUTH_URL in production', () => {
    assert.throws(
      () =>
        validateEnv({
          ...baseValidProdEnv,
          BETTER_AUTH_URL: 'http://localhost:3001',
        }),
      /Public origin must use HTTPS scheme/,
    );
  });

  it('8. Strictly rejects development loopback in REDIS_URL in production', () => {
    assert.throws(
      () =>
        validateEnv({
          ...baseValidProdEnv,
          REDIS_URL: 'redis://localhost:6379',
        }),
      /Insecure Production Redis Configuration: Cannot target development loopback host/,
    );
  });

  it('9. Strictly rejects development database loopback or default password in production', () => {
    assert.throws(
      () =>
        validateEnv({
          ...baseValidProdEnv,
          DATABASE_URL: 'postgresql://oprino_admin:oprino_dev_password@localhost:5432/oprino_db',
        }),
      /Insecure Production Database Configuration/,
    );
  });

  it('10. Strictly rejects insecure or loopback CORS origins in production', () => {
    assert.throws(
      () =>
        validateEnv({
          ...baseValidProdEnv,
          CORS_ORIGINS: 'https://oprino.vercel.app,http://localhost:3000',
        }),
      /Insecure Production CORS Origin/,
    );
  });
});

describe('Secure Workspace Invitation URL Resolution', () => {
  it('1. Resolves canonical URL from server configuration', () => {
    const url = resolveCanonicalInvitationBaseUrl('https://oprino.vercel.app');
    assert.strictEqual(url, 'https://oprino.vercel.app');
  });

  it('2. Fails closed when canonical URL is unconfigured', () => {
    const prevEnv = process.env.APP_PUBLIC_URL;
    delete process.env.APP_PUBLIC_URL;
    try {
      assert.throws(
        () => resolveCanonicalInvitationBaseUrl(''),
        /Canonical web application URL \(APP_PUBLIC_URL\) is not configured/,
      );
    } finally {
      if (prevEnv) process.env.APP_PUBLIC_URL = prevEnv;
    }
  });

  it('3. Fails closed when canonical URL is not HTTPS in production', () => {
    const prevNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      assert.throws(
        () => resolveCanonicalInvitationBaseUrl('http://oprino.vercel.app'),
        /Canonical web application URL in production\/staging must use HTTPS/,
      );
    } finally {
      process.env.NODE_ENV = prevNodeEnv;
    }
  });

  it('4. Fails closed when canonical URL targets localhost in production', () => {
    const prevNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      assert.throws(
        () => resolveCanonicalInvitationBaseUrl('https://localhost:3000'),
        /Canonical web application URL cannot target loopback or private host/,
      );
    } finally {
      process.env.NODE_ENV = prevNodeEnv;
    }
  });
});

describe('Dynamic Deployment Revision Resolution (/v1/version)', () => {
  it('1. Reports build-time RENDER_GIT_COMMIT when present', async () => {
    process.env.RENDER_GIT_COMMIT = 'commit-render-sha-12345';
    try {
      const app = Fastify();
      await app.register(versionRoutes);
      const res = await app.inject({ method: 'GET', url: '/v1/version' });
      assert.strictEqual(res.statusCode, 200);
      const body = JSON.parse(res.body);
      assert.strictEqual(body.gitCommit, 'commit-render-sha-12345');
    } finally {
      delete process.env.RENDER_GIT_COMMIT;
    }
  });

  it('2. Reports COMMIT_SHA fallback when RENDER_GIT_COMMIT is absent', async () => {
    delete process.env.RENDER_GIT_COMMIT;
    process.env.COMMIT_SHA = 'commit-docker-sha-67890';
    try {
      const app = Fastify();
      await app.register(versionRoutes);
      const res = await app.inject({ method: 'GET', url: '/v1/version' });
      assert.strictEqual(res.statusCode, 200);
      const body = JSON.parse(res.body);
      assert.strictEqual(body.gitCommit, 'commit-docker-sha-67890');
    } finally {
      delete process.env.COMMIT_SHA;
    }
  });
});

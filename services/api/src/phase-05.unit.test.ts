import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildServer } from './server.js';
import { HealthResponseSchema, LivenessResponseSchema } from '@oprino/contracts';

describe('Phase 05: Production Hardening, Observability & Security Verification', () => {
  const { app } = buildServer({
    env: {
      NODE_ENV: 'test',
      RATE_LIMIT_MAX: 10,
      RATE_LIMIT_WINDOW_MS: 60000,
    },
    logger: false,
  });

  after(async () => {
    await app.close();
  });

  test('OpenAPI specification includes Phase 05 observability endpoints', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/openapi.json',
    });

    assert.strictEqual(res.statusCode, 200);
    const spec = JSON.parse(res.body);

    assert.ok(spec.paths['/health'], 'Expected /health');
    assert.ok(spec.paths['/health/live'], 'Expected /health/live');
    assert.ok(spec.paths['/health/ready'], 'Expected /health/ready');
    assert.ok(spec.paths['/metrics'], 'Expected /metrics');
  });

  test('GET /health returns 200 and passes HealthResponseSchema', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health',
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    const validated = HealthResponseSchema.safeParse(body);
    assert.strictEqual(validated.success, true);
    assert.strictEqual(body.status, 'ok');
    assert.strictEqual(body.services.database, 'connected');
    assert.strictEqual(body.services.redis, 'connected');
  });

  test('GET /health/live returns 200 and passes LivenessResponseSchema', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health/live',
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    const validated = LivenessResponseSchema.safeParse(body);
    assert.strictEqual(validated.success, true);
    assert.strictEqual(body.status, 'ok');
    assert.ok(body.timestamp);
  });

  test('GET /health/ready returns 200 and passes HealthResponseSchema', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health/ready',
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    const validated = HealthResponseSchema.safeParse(body);
    assert.strictEqual(validated.success, true);
    assert.strictEqual(body.status, 'ok');
  });

  test('GET /metrics returns 200 text/plain with Prometheus metrics', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/metrics',
    });

    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.headers['content-type']?.includes('text/plain'));
    assert.ok(res.body.includes('oprino_http_requests_total'));
    assert.ok(res.body.includes('oprino_'));
  });

  test('Helmet security headers are enforced on all API responses', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/version',
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['x-content-type-options'], 'nosniff');
    assert.ok(res.headers['x-frame-options'], 'Expected x-frame-options header');
    assert.ok(res.headers['content-security-policy'], 'Expected content-security-policy header');
    assert.ok(res.headers['strict-transport-security'], 'Expected strict-transport-security header');
    assert.ok(
      res.headers['strict-transport-security']?.includes('max-age=63072000'),
      'Expected strict HSTS max-age',
    );
  });

  test('CORS headers allow trusted client origins and credentials', async () => {
    const res = await app.inject({
      method: 'OPTIONS',
      url: '/v1/version',
      headers: {
        origin: 'http://localhost:3000',
        'access-control-request-method': 'GET',
      },
    });

    assert.strictEqual(res.headers['access-control-allow-origin'], 'http://localhost:3000');
    assert.strictEqual(res.headers['access-control-allow-credentials'], 'true');
  });

  test('Rate limiting headers are returned and enforce burst limits', async () => {
    const { app: rateLimitedApp } = buildServer({
      env: {
        NODE_ENV: 'test',
        RATE_LIMIT_MAX: 3,
        RATE_LIMIT_WINDOW_MS: 60000,
      },
      logger: false,
    });

    try {
      // 1st request
      const res1 = await rateLimitedApp.inject({
        method: 'GET',
        url: '/v1/version',
        remoteAddress: '192.168.1.100',
      });
      assert.strictEqual(res1.statusCode, 200);
      assert.ok(res1.headers['x-ratelimit-limit']);
      assert.strictEqual(String(res1.headers['x-ratelimit-limit']), '3');

      // 2nd request
      const res2 = await rateLimitedApp.inject({
        method: 'GET',
        url: '/v1/version',
        remoteAddress: '192.168.1.100',
      });
      assert.strictEqual(res2.statusCode, 200);

      // 3rd request
      const res3 = await rateLimitedApp.inject({
        method: 'GET',
        url: '/v1/version',
        remoteAddress: '192.168.1.100',
      });
      assert.strictEqual(res3.statusCode, 200);

      // 4th request - should trigger 429
      const res4 = await rateLimitedApp.inject({
        method: 'GET',
        url: '/v1/version',
        remoteAddress: '192.168.1.100',
      });
      assert.strictEqual(res4.statusCode, 429);
      const body4 = JSON.parse(res4.body);
      assert.strictEqual(body4.statusCode, 429);
      assert.strictEqual(body4.error, 'Too Many Requests');
      assert.ok(body4.message.includes('Rate limit exceeded'));
    } finally {
      await rateLimitedApp.close();
    }
  });

  test('Degraded readiness status returns 503 when dependencies are down', async () => {
    // Build server with simulated disconnected services
    const { app: degradedApp } = buildServer({
      env: {
        NODE_ENV: 'development', // force real checks
        DATABASE_URL: 'postgresql://invalid:invalid@localhost:5432/nonexistent',
        REDIS_URL: 'redis://invalid:6379',
      },
      logger: false,
    });

    try {
      const res = await degradedApp.inject({
        method: 'GET',
        url: '/health/ready',
      });

      assert.strictEqual(res.statusCode, 503);
      const body = JSON.parse(res.body);
      assert.notStrictEqual(body.status, 'ok');
      assert.notStrictEqual(body.services.database, 'connected');
    } finally {
      await degradedApp.close();
    }
  });
});

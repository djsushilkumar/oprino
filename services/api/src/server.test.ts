import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildServer } from './server.js';
import { HealthResponseSchema, VersionResponseSchema } from '@oprino/contracts';

describe('Oprino API Scaffolding Tests', () => {
  const { app } = buildServer({ env: { NODE_ENV: 'test' }, logger: false });

  after(async () => {
    await app.close();
  });

  test('GET /health returns 200 and passes contract schema', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health',
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    const validated = HealthResponseSchema.safeParse(body);
    assert.strictEqual(validated.success, true);
    assert.strictEqual(body.status, 'ok');
  });

  test('GET /v1/version returns 200 and passes contract schema', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/version',
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    const validated = VersionResponseSchema.safeParse(body);
    assert.strictEqual(validated.success, true);
    assert.strictEqual(body.name, 'oprino-api');
  });

  test('GET /openapi.json serves OpenAPI 3.1 document', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/openapi.json',
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.openapi, '3.1.0');
    assert.ok(body.paths['/health']);
    assert.ok(body.paths['/v1/version']);
  });

  test('GET /api/auth/ok returns Better Auth boundary check', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/ok',
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.ok, true);
  });
});

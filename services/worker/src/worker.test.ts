import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { validateWorkerEnv } from './config/env.js';

describe('Oprino Worker Scaffolding Tests', () => {
  test('WorkerEnv parses valid environment', () => {
    const env = validateWorkerEnv({
      NODE_ENV: 'test',
      REDIS_URL: 'redis://127.0.0.1:6379',
      CONCURRENCY: '10',
    });

    assert.strictEqual(env.NODE_ENV, 'test');
    assert.strictEqual(env.REDIS_URL, 'redis://127.0.0.1:6379');
    assert.strictEqual(env.CONCURRENCY, 10);
  });

  test('WorkerEnv uses safe defaults', () => {
    const env = validateWorkerEnv({});
    assert.strictEqual(env.NODE_ENV, 'development');
    assert.strictEqual(env.CONCURRENCY, 5);
  });

  test('WorkerEnv rejects default development database credentials in production', () => {
    assert.throws(
      () =>
        validateWorkerEnv({
          NODE_ENV: 'production',
          DATABASE_URL: 'postgresql://oprino_admin:oprino_dev_password@localhost:5432/oprino_db',
          REDIS_URL: 'rediss://default:token@upstash.io:6379',
        }),
      /Insecure Production Worker Database Configuration/,
    );
  });

  test('WorkerEnv rejects default development redis in production', () => {
    assert.throws(
      () =>
        validateWorkerEnv({
          NODE_ENV: 'production',
          DATABASE_URL: 'postgresql://user:pass@db.neon.tech:5432/oprino_prod',
          REDIS_URL: 'redis://localhost:6379',
        }),
      /Insecure Production Worker Redis Configuration/,
    );
  });

  test('WorkerEnv passes with valid production configuration', () => {
    const env = validateWorkerEnv({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://user:pass@db.neon.tech:5432/oprino_prod',
      REDIS_URL: 'rediss://default:token@upstash.io:6379',
    });
    assert.strictEqual(env.NODE_ENV, 'production');
  });
});

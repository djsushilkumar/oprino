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
});

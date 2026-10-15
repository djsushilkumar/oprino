import { describe, it } from 'node:test';
import assert from 'node:assert';
import { normalizeApiBaseUrl, buildApiUrl } from './lib/api.js';

describe('Web API Base URL Contract & /v1/ Duplication Prevention Tests', () => {
  it('1. Correctly formats standard base URL without /v1 suffix', () => {
    const base = normalizeApiBaseUrl('https://oprino-api.onrender.com');
    assert.strictEqual(base, 'https://oprino-api.onrender.com');

    const url = buildApiUrl('/v1/auth/signin', 'https://oprino-api.onrender.com');
    assert.strictEqual(url, 'https://oprino-api.onrender.com/v1/auth/signin');
  });

  it('2. Strips accidental trailing /v1 suffix to prevent /v1/v1/ construction', () => {
    const base = normalizeApiBaseUrl('https://oprino-api.onrender.com/v1');
    assert.strictEqual(base, 'https://oprino-api.onrender.com');

    const url = buildApiUrl('/v1/auth/signin', 'https://oprino-api.onrender.com/v1');
    assert.strictEqual(url, 'https://oprino-api.onrender.com/v1/auth/signin');
    assert.ok(!url.includes('/v1/v1/'), 'Must not contain /v1/v1/');
  });

  it('3. Strips accidental trailing slashes and trailing /v1/', () => {
    const baseSlash = normalizeApiBaseUrl('https://oprino-api.onrender.com///');
    assert.strictEqual(baseSlash, 'https://oprino-api.onrender.com');

    const baseV1Slash = normalizeApiBaseUrl('https://oprino-api.onrender.com/v1///');
    assert.strictEqual(baseV1Slash, 'https://oprino-api.onrender.com');

    const url = buildApiUrl('/v1/tasks', 'https://oprino-api.onrender.com/v1/');
    assert.strictEqual(url, 'https://oprino-api.onrender.com/v1/tasks');
  });

  it('4. Handles endpoints provided without leading slashes safely', () => {
    const url = buildApiUrl('v1/auth/signup', 'https://oprino-api.onrender.com');
    assert.strictEqual(url, 'https://oprino-api.onrender.com/v1/auth/signup');
  });

  it('5. Builds root health and version routes cleanly without duplication', () => {
    const healthUrl = buildApiUrl('/health', 'https://oprino-api.onrender.com');
    assert.strictEqual(healthUrl, 'https://oprino-api.onrender.com/health');

    const versionUrl = buildApiUrl('/v1/version', 'https://oprino-api.onrender.com/v1');
    assert.strictEqual(versionUrl, 'https://oprino-api.onrender.com/v1/version');
  });

  it('6. Rejects insecure HTTP and localhost in production mode', () => {
    const envObj = process.env as Record<string, string | undefined>;
    const prevNodeEnv = envObj.NODE_ENV;
    envObj.NODE_ENV = 'production';
    try {
      assert.throws(
        () => normalizeApiBaseUrl('http://oprino-api.onrender.com'),
        /Security gate violation: Insecure production API URL/,
      );
      assert.throws(
        () => normalizeApiBaseUrl('https://localhost:3001'),
        /Security gate violation: Insecure production API URL/,
      );
      assert.throws(
        () => normalizeApiBaseUrl('https://127.0.0.1:3001'),
        /Security gate violation: Insecure production API URL/,
      );
    } finally {
      envObj.NODE_ENV = prevNodeEnv;
    }
  });
});

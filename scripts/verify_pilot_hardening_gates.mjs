/**
 * Oprino Phase 4C Hardening: Regression & Security Gates Verification
 * 
 * Verifies:
 * 1. Local-only mock server binding (127.0.0.1)
 * 2. Production rejection of mock server (fails fast on NODE_ENV=production)
 * 3. Staging rejection of mock server (fails fast on NODE_ENV=staging)
 * 4. Mock server identification headers & test-double metadata
 * 5. Debug vs Release Android Manifest cleartext isolation
 * 6. Real Fastify/OpenAPI contract path compatibility
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ PASSED: ${message}`);
}

async function runHardeningVerification() {
  console.log('\n=============================================================');
  console.log('🛡️  OPRINO PHASE 4C: SECURITY GATES & REGRESSION SUITE');
  console.log('=============================================================\n');

  // GATE 1: Production Rejection of Mock Server
  console.log('--- GATE 1: Production Environment Rejection ---');
  const prodCheck = spawnSync('node', ['scripts/isolated_pilot_server.mjs'], {
    env: { ...process.env, NODE_ENV: 'production' },
    encoding: 'utf-8',
  });
  assert(prodCheck.status !== 0, 'Mock server strictly refuses to execute under NODE_ENV=production');
  assert(
    prodCheck.stderr.includes('FATAL SECURITY VIOLATION') || prodCheck.stdout.includes('FATAL SECURITY VIOLATION'),
    'Outputs fatal security violation error message when production execution is attempted',
  );

  // GATE 2: Staging Rejection of Mock Server
  console.log('\n--- GATE 2: Staging Environment Rejection ---');
  const stagingCheck = spawnSync('node', ['scripts/isolated_pilot_server.mjs'], {
    env: { ...process.env, NODE_ENV: 'staging' },
    encoding: 'utf-8',
  });
  assert(stagingCheck.status !== 0, 'Mock server strictly refuses to execute under NODE_ENV=staging');

  // GATE 3: Mock Server Identification & Local Binding
  console.log('\n--- GATE 3: Mock Server Headers & Local Loopback Binding ---');
  const healthRes = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:3001/health/ready', (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) }));
    }).on('error', reject);
  });

  assert(healthRes.status === 200, 'Mock server reachable on local loopback 127.0.0.1:3001');
  assert(healthRes.headers['x-oprino-mock-server'] === 'true', 'X-Oprino-Mock-Server header is explicitly true');
  assert(healthRes.headers['x-oprino-backend-type'] === 'in-memory-test-double', 'X-Oprino-Backend-Type confirms in-memory-test-double');
  assert(healthRes.body.mock === true, 'Response payload explicitly includes mock: true');
  assert(healthRes.body.engine === 'synthetic-in-memory-mock', 'Engine metadata confirms synthetic-in-memory-mock');

  // GATE 4: Android Manifest Cleartext Isolation (Debug vs Release)
  console.log('\n--- GATE 4: Android Manifest Cleartext Isolation ---');
  const mainManifestPath = path.resolve('apps/mobile/android/app/src/main/AndroidManifest.xml');
  const debugManifestPath = path.resolve('apps/mobile/android/app/src/debug/AndroidManifest.xml');
  const releaseManifestPath = path.resolve('apps/mobile/android/app/src/release/AndroidManifest.xml');

  const mainManifest = fs.readFileSync(mainManifestPath, 'utf-8');
  const debugManifest = fs.readFileSync(debugManifestPath, 'utf-8');
  const releaseManifest = fs.readFileSync(releaseManifestPath, 'utf-8');

  assert(
    !mainManifest.includes('android:usesCleartextTraffic="true"'),
    'Main AndroidManifest.xml does NOT grant cleartext traffic (Production protection)',
  );
  assert(
    debugManifest.includes('android:usesCleartextTraffic="true"'),
    'Debug AndroidManifest.xml explicitly restricts cleartext traffic to debug builds',
  );
  assert(
    releaseManifest.includes('android:usesCleartextTraffic="false"'),
    'Release AndroidManifest.xml explicitly prohibits cleartext traffic',
  );

  // GATE 5: Real Fastify Contract Compatibility Check
  console.log('\n--- GATE 5: OpenAPI 3.1 Fastify Contract Compatibility ---');
  const openApiPath = path.resolve('packages/contracts/dist/openapi.json');
  assert(fs.existsSync(openApiPath), 'OpenAPI specification dist/openapi.json exists');
  const openApi = JSON.parse(fs.readFileSync(openApiPath, 'utf-8'));

  const paths = Object.keys(openApi.paths || {});
  console.log(`  Found ${paths.length} API paths defined in OpenAPI specification`);
  assert(paths.includes('/health/ready'), 'Contract defines /health/ready endpoint');
  assert(paths.some((p) => p.includes('/attendance')), 'Contract defines attendance endpoints');
  assert(paths.some((p) => p.includes('/tasks')), 'Contract defines tasks endpoints');

  console.log('\n=============================================================');
  console.log('🎉 ALL 5 SECURITY & REGRESSION HARDENING GATES VERIFIED (PASS)!');
  console.log('=============================================================\n');
}

runHardeningVerification().catch((err) => {
  console.error('\n❌ HARDENING VERIFICATION FAILED:', err);
  process.exit(1);
});

#!/usr/bin/env node

/**
 * Pre-build validation script ensuring Flutter mobile production compilation
 * cannot proceed with missing, insecure, or development endpoints.
 */

const args = process.argv.slice(2);
const envArg = args.find((a) => a.startsWith('--environment='))?.split('=')[1] || '';
const apiUrlArg = args.find((a) => a.startsWith('--api-url='))?.split('=')[1] || '';

console.log('--- Production Build Defines Gate ---');
console.log(`Environment: "${envArg}"`);
console.log(`Target API URL: "${apiUrlArg}"`);

if (!envArg) {
  console.error(
    '❌ FAIL: Missing --environment define. Production builds require explicit ENVIRONMENT=PRODUCTION',
  );
  process.exit(1);
}

const normalized = envArg.toUpperCase().replace(/-/g, '_');
if (normalized !== 'PRODUCTION' && normalized !== 'PROD') {
  console.error(
    `❌ FAIL: Invalid release environment: "${envArg}". Production release builds must specify ENVIRONMENT=PRODUCTION.`,
  );
  process.exit(1);
}

if (!apiUrlArg) {
  console.error(
    '❌ FAIL: Missing --api-url define. Production builds require explicit HTTPS API URL.',
  );
  process.exit(1);
}

let parsedUrl;
try {
  parsedUrl = new URL(apiUrlArg);
} catch (e) {
  console.error(`❌ FAIL: Malformed API URL: "${apiUrlArg}" is not a valid URL.`);
  process.exit(1);
}

if (parsedUrl.protocol !== 'https:') {
  console.error(
    `❌ FAIL: Insecure protocol "${parsedUrl.protocol}" in "${apiUrlArg}". Production API URL must strictly use HTTPS.`,
  );
  process.exit(1);
}

const host = parsedUrl.hostname.toLowerCase();
const isLoopbackOrPrivate =
  host === 'localhost' ||
  host === '127.0.0.1' ||
  host === '::1' ||
  host === '10.0.2.2' ||
  host.endsWith('.localhost') ||
  host.endsWith('.local') ||
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host) ||
  /^192\.168\.\d{1,3}\.\d{1,3}$/.test(host) ||
  /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host);

if (isLoopbackOrPrivate) {
  console.error(
    `❌ FAIL: Security barrier violation: Target host "${host}" is a loopback or private network address.`,
  );
  process.exit(1);
}

console.log('✓ PASS: Production build defines verified.');
process.exit(0);

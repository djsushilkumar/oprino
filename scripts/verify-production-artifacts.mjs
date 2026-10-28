#!/usr/bin/env node

/**
 * Oprino Production Artifact & Configuration Scanner
 * Automated regression check verifying that no production artifacts,
 * client configs, workflows, or templates reference development loopbacks,
 * emulator aliases, cleartext HTTP, or unapproved fallbacks.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

let totalChecks = 0;
let passedChecks = 0;
const failures = [];

function assertCheck(name, condition, errorDetail) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ✓ PASS: ${name}`);
  } else {
    failures.push({ name, errorDetail });
    console.error(`  ❌ FAIL: ${name}\n     -> ${errorDetail}`);
  }
}

console.log('==================================================================');
console.log('   OPRINO PRODUCTION ARTIFACT & ENDPOINT SECURITY SCANNER         ');
console.log('==================================================================');

// 1. Check generated Dart API Client constructor
const dartClientPath = path.resolve(rootDir, 'generated/dart-api/lib/src/api_client.dart');
if (fs.existsSync(dartClientPath)) {
  const content = fs.readFileSync(dartClientPath, 'utf-8');
  assertCheck(
    'Dart API Client has required baseUrl without default emulator IP',
    content.includes('required String baseUrl') &&
      !content.includes("String baseUrl = 'http://10.0.2.2:3000'"),
    'api_client.dart contains hard-coded emulator loopback default instead of required baseUrl.',
  );
  assertCheck(
    'Dart API Client validates non-empty baseUrl',
    content.includes('if (baseUrl.trim().isEmpty)'),
    'api_client.dart lacks fail-closed validation against empty baseUrl.',
  );
  assertCheck(
    'Dart API Client normalizes baseUrl and strips redundant /v1',
    content.includes('normalizeBaseUrl(baseUrl)') &&
      content.includes('static String normalizeBaseUrl'),
    'api_client.dart lacks normalizeBaseUrl helper to prevent /v1/v1/ route concatenation.',
  );
} else {
  assertCheck('Dart API Client exists', false, `File not found at ${dartClientPath}`);
}

// 2. Check Dart client generator script
const dartGeneratorPath = path.resolve(
  rootDir,
  'packages/contracts/scripts/generate-dart-client.ts',
);
if (fs.existsSync(dartGeneratorPath)) {
  const content = fs.readFileSync(dartGeneratorPath, 'utf-8');
  assertCheck(
    'Dart Client Generator emits required baseUrl parameter',
    content.includes('required String baseUrl') &&
      !content.includes("String baseUrl = 'http://10.0.2.2:3000'"),
    'generate-dart-client.ts template contains hardcoded emulator IP.',
  );
}

// 3. Check OpenAPI specification servers
const openApiPath = path.resolve(rootDir, 'packages/contracts/src/openapi.ts');
if (fs.existsSync(openApiPath)) {
  const content = fs.readFileSync(openApiPath, 'utf-8');
  assertCheck(
    'OpenAPI specification defines Production HTTPS as primary server',
    content.includes("url: 'https://oprino-api.onrender.com'"),
    'openapi.ts is missing production server endpoint.',
  );
}

// 4. Check Mobile Release Workflow & Gradle Signing
const mobileReleasePath = path.resolve(rootDir, '.github/workflows/mobile-release.yml');
if (fs.existsSync(mobileReleasePath)) {
  const content = fs.readFileSync(mobileReleasePath, 'utf-8');
  assertCheck(
    'Mobile Release Workflow passes explicit PRODUCTION dart defines',
    content.includes('--dart-define=ENVIRONMENT=PRODUCTION') &&
      content.includes('--dart-define=API_BASE_URL='),
    'mobile-release.yml builds release APK without explicit production dart defines.',
  );
  assertCheck(
    'Mobile Release Workflow enforces production release keystore secrets',
    content.includes('OPRINO_RELEASE_KEYSTORE_BASE64') && !content.includes('androiddebugkey'),
    'mobile-release.yml generates debug keystore instead of requiring production signing secrets.',
  );
  assertCheck(
    'Mobile Release Workflow uses env mapping for secrets without inline script interpolation',
    content.includes('RELEASE_KEYSTORE_BASE64: ${{ secrets.OPRINO_RELEASE_KEYSTORE_BASE64') &&
      !content.includes('${{ secrets.OPRINO_RELEASE_KEYSTORE_BASE64 }} | base64'),
    'mobile-release.yml interpolates secrets directly into inline bash scripts instead of mapping to env.',
  );
  assertCheck(
    'Mobile Release Workflow validates keystore and certificate integrity using keytool',
    content.includes('keytool -list -v'),
    'mobile-release.yml lacks fail-closed certificate integrity validation using keytool.',
  );
  assertCheck(
    'Mobile Release Workflow enforces mandatory release certificate SHA-256 fingerprint',
    content.includes('ACTUAL_SHA256=') &&
      content.includes('OPRINO_RELEASE_CERT_SHA256') &&
      content.includes('[ -z "$EXPECTED_CERT_SHA256" ]'),
    'mobile-release.yml lacks mandatory release certificate SHA-256 fingerprint verification.',
  );
  assertCheck(
    'Mobile Release Workflow verifies compiled APK cryptographic signature using apksigner fail-closed',
    content.includes('verify --verbose --print-certs') &&
      content.includes('apksigner is strictly required'),
    'mobile-release.yml lacks fail-closed compiled APK signature verification with apksigner.',
  );
  assertCheck(
    'Mobile Release Workflow verifies compiled APK signer certificate against expected fingerprint',
    content.includes('APK_SIGNER_SHA256') &&
      content.includes('$APK_SIGNER_SHA256" != "$NORMALIZED_EXPECTED'),
    'mobile-release.yml does not verify compiled APK signer certificate against approved SHA-256 fingerprint.',
  );
  assertCheck(
    'Mobile Release Workflow prevents automatic release generation on push to main',
    content.includes('workflow_dispatch:') && !content.includes('push:'),
    'mobile-release.yml contains automatic push trigger to main.',
  );
}

const buildGradlePath = path.resolve(rootDir, 'apps/mobile/android/app/build.gradle.kts');
if (fs.existsSync(buildGradlePath)) {
  const content = fs.readFileSync(buildGradlePath, 'utf-8');
  assertCheck(
    'Android Gradle configuration enforces release signing credentials gate',
    content.includes('Production release build requires legitimate release signing credentials'),
    'build.gradle.kts lacks taskGraph fail-closed check for release signing credentials.',
  );
  assertCheck(
    'Android Gradle configuration enforces complete credentials (password and alias)',
    content.includes('Production release build requires complete release signing credentials'),
    'build.gradle.kts does not validate storePassword, keyAlias, and keyPassword completeness.',
  );
}

// 5. Check Mobile AppConfig
const appConfigPath = path.resolve(rootDir, 'apps/mobile/lib/core/config/app_config.dart');
if (fs.existsSync(appConfigPath)) {
  const content = fs.readFileSync(appConfigPath, 'utf-8');
  assertCheck(
    'AppConfig rejects loopback and private hosts in PRODUCTION',
    content.includes('isAuthorizedLocalHost(host)') &&
      content.includes('PRODUCTION endpoint cannot target local loopback'),
    'app_config.dart does not reject loopback hosts in PRODUCTION environment.',
  );
  assertCheck(
    'AppConfig enforces release mode fail-closed gate',
    content.includes('kReleaseMode') &&
      content.includes('Release mode requires explicit --dart-define=ENVIRONMENT=PRODUCTION'),
    'app_config.dart lacks release mode fail-closed guard.',
  );
  assertCheck(
    'AppConfig normalizes API URL and strips trailing /v1',
    content.includes('static String normalizeApiUrl') &&
      content.includes('normalizeApiUrl(rawBaseUrl)'),
    'app_config.dart lacks normalizeApiUrl to prevent double /v1/v1/ concatenation.',
  );
}

// 6. Check Web Next.js configuration and API client
const nextConfigPath = path.resolve(rootDir, 'apps/web/next.config.mjs');
if (fs.existsSync(nextConfigPath)) {
  const content = fs.readFileSync(nextConfigPath, 'utf-8');
  assertCheck(
    'Next.js config validates HTTPS and rejects loopbacks for production builds',
    content.includes('Production web build requires HTTPS API URL') &&
      content.includes('Production web build cannot target local loopback'),
    'next.config.mjs allows insecure HTTP or loopback API in production web builds.',
  );
}

const webApiLibPath = path.resolve(rootDir, 'apps/web/src/lib/api.ts');
if (fs.existsSync(webApiLibPath)) {
  const content = fs.readFileSync(webApiLibPath, 'utf-8');
  assertCheck(
    'Web api.ts rejects insecure API URL in production',
    content.includes('Security gate violation: Insecure production API URL'),
    'api.ts does not guard against insecure API URLs in production.',
  );
  assertCheck(
    'Web api.ts normalizes API base URL and builds URLs preventing /v1/v1/ duplication',
    content.includes('export function normalizeApiBaseUrl') &&
      content.includes('export function buildApiUrl'),
    'api.ts does not provide normalizeApiBaseUrl and buildApiUrl helpers.',
  );
}

// 7. Check Backend API Environment & Invitation Routes
const apiEnvPath = path.resolve(rootDir, 'services/api/src/config/env.ts');
if (fs.existsSync(apiEnvPath)) {
  const content = fs.readFileSync(apiEnvPath, 'utf-8');
  assertCheck(
    'API env.ts parses and validates production URLs with HTTPS',
    content.includes('validateProductionUrl') &&
      content.includes('Public origin must use HTTPS scheme'),
    'services/api env.ts does not validate public URL schemes with URL parser.',
  );
  assertCheck(
    'API env.ts rejects development database and redis loopbacks in production',
    content.includes('Cannot target development loopback host') &&
      content.includes('Default development DATABASE_URL'),
    'services/api env.ts does not reject dev db/redis loopbacks in production.',
  );
}

const workerEnvPath = path.resolve(rootDir, 'services/worker/src/config/env.ts');
if (fs.existsSync(workerEnvPath)) {
  const content = fs.readFileSync(workerEnvPath, 'utf-8');
  assertCheck(
    'Worker env.ts rejects development database and redis loopbacks in production',
    content.includes('Insecure Production Worker Database Configuration') &&
      content.includes('Insecure Production Worker Redis Configuration'),
    'services/worker env.ts does not reject dev db/redis in production.',
  );
}

const authRoutePath = path.resolve(rootDir, 'services/api/src/routes/auth.ts');
if (fs.existsSync(authRoutePath)) {
  const content = fs.readFileSync(authRoutePath, 'utf-8');
  assertCheck(
    'Auth routes bind canonical Better Auth request URL and enforce Host/X-Forwarded trust boundary',
    content.includes("headers.set('host', canonicalOrigin.host)") &&
      content.includes(
        "headers.set('x-forwarded-proto', canonicalOrigin.protocol.replace(':', ''))",
      ),
    'auth.ts does not enforce canonical request URL and trust boundary on Host and X-Forwarded-Proto.',
  );
}

const workspacesRoutePath = path.resolve(rootDir, 'services/api/src/routes/workspaces.ts');
if (fs.existsSync(workspacesRoutePath)) {
  const content = fs.readFileSync(workspacesRoutePath, 'utf-8');
  assertCheck(
    'Workspaces routes use canonical invitation base URL without client header injection',
    content.includes('resolveCanonicalInvitationBaseUrl') &&
      !content.includes('(req.headers.origin as string) ||'),
    'workspaces.ts still permits client-controlled Origin/Referer header injection for invitation links.',
  );
}

// 8. Check API version route
const versionRoutePath = path.resolve(rootDir, 'services/api/src/routes/version.ts');
if (fs.existsSync(versionRoutePath)) {
  const content = fs.readFileSync(versionRoutePath, 'utf-8');
  assertCheck(
    'API version route resolves dynamic commit SHA from deployment runtime',
    content.includes('process.env.RENDER_GIT_COMMIT') && !content.includes("gitCommit: '5fc3468'"),
    'version.ts still contains hardcoded gitCommit string literal.',
  );
}

console.log('------------------------------------------------------------------');
console.log(`Scan Summary: ${passedChecks}/${totalChecks} checks passed.`);

if (failures.length > 0) {
  console.error(`❌ REGRESSION CHECK FAILED: ${failures.length} security violation(s) detected!`);
  for (const f of failures) {
    console.error(` - [${f.name}]: ${f.errorDetail}`);
  }
  process.exit(1);
} else {
  console.log(
    '✓ ALL PRODUCTION ARTIFACT CHECKS PASSED: Zero development fallbacks in production configurations.',
  );
  process.exit(0);
}

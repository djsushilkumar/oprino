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
    content.includes('required String baseUrl') && !content.includes("String baseUrl = 'http://10.0.2.2:3000'"),
    'api_client.dart contains hard-coded emulator loopback default instead of required baseUrl.'
  );
  assertCheck(
    'Dart API Client validates non-empty baseUrl',
    content.includes("if (baseUrl.trim().isEmpty)"),
    'api_client.dart lacks fail-closed validation against empty baseUrl.'
  );
} else {
  assertCheck('Dart API Client exists', false, `File not found at ${dartClientPath}`);
}

// 2. Check Dart client generator script
const dartGeneratorPath = path.resolve(rootDir, 'packages/contracts/scripts/generate-dart-client.ts');
if (fs.existsSync(dartGeneratorPath)) {
  const content = fs.readFileSync(dartGeneratorPath, 'utf-8');
  assertCheck(
    'Dart Client Generator emits required baseUrl parameter',
    content.includes('required String baseUrl') && !content.includes("String baseUrl = 'http://10.0.2.2:3000'"),
    'generate-dart-client.ts template contains hardcoded emulator IP.'
  );
}

// 3. Check OpenAPI specification servers
const openApiPath = path.resolve(rootDir, 'packages/contracts/src/openapi.ts');
if (fs.existsSync(openApiPath)) {
  const content = fs.readFileSync(openApiPath, 'utf-8');
  assertCheck(
    'OpenAPI specification defines Production HTTPS as primary server',
    content.includes("url: 'https://oprino-api.onrender.com'"),
    'openapi.ts is missing production server endpoint.'
  );
}

// 4. Check Mobile Release Workflow
const mobileReleasePath = path.resolve(rootDir, '.github/workflows/mobile-release.yml');
if (fs.existsSync(mobileReleasePath)) {
  const content = fs.readFileSync(mobileReleasePath, 'utf-8');
  assertCheck(
    'Mobile Release Workflow passes explicit PRODUCTION dart defines',
    content.includes('--dart-define=ENVIRONMENT=PRODUCTION') && content.includes('--dart-define=API_BASE_URL='),
    'mobile-release.yml builds release APK without explicit production dart defines.'
  );
  assertCheck(
    'Mobile Release Workflow enforces production release keystore secrets',
    content.includes('OPRINO_RELEASE_KEYSTORE_BASE64') && !content.includes('androiddebugkey'),
    'mobile-release.yml generates debug keystore instead of requiring production signing secrets.'
  );
}

// 5. Check Mobile AppConfig
const appConfigPath = path.resolve(rootDir, 'apps/mobile/lib/core/config/app_config.dart');
if (fs.existsSync(appConfigPath)) {
  const content = fs.readFileSync(appConfigPath, 'utf-8');
  assertCheck(
    'AppConfig rejects loopback and private hosts in PRODUCTION',
    content.includes('isAuthorizedLocalHost(host)') && content.includes('PRODUCTION endpoint cannot target local loopback'),
    'app_config.dart does not reject loopback hosts in PRODUCTION environment.'
  );
  assertCheck(
    'AppConfig enforces release mode fail-closed gate',
    content.includes('kReleaseMode') && content.includes('Release mode requires explicit --dart-define=ENVIRONMENT=PRODUCTION'),
    'app_config.dart lacks release mode fail-closed guard.'
  );
}

// 6. Check Web Next.js configuration and API client
const nextConfigPath = path.resolve(rootDir, 'apps/web/next.config.mjs');
if (fs.existsSync(nextConfigPath)) {
  const content = fs.readFileSync(nextConfigPath, 'utf-8');
  assertCheck(
    'Next.js config validates HTTPS and rejects loopbacks for production builds',
    content.includes('Production web build requires HTTPS API URL') && content.includes('Production web build cannot target local loopback'),
    'next.config.mjs allows insecure HTTP or loopback API in production web builds.'
  );
}

const webApiLibPath = path.resolve(rootDir, 'apps/web/src/lib/api.ts');
if (fs.existsSync(webApiLibPath)) {
  const content = fs.readFileSync(webApiLibPath, 'utf-8');
  assertCheck(
    'Web api.ts rejects insecure API URL in production',
    content.includes('Security gate violation: Insecure production API URL'),
    'api.ts does not guard against insecure API URLs in production.'
  );
}

// 7. Check Backend API Environment & Invitation Routes
const apiEnvPath = path.resolve(rootDir, 'services/api/src/config/env.ts');
if (fs.existsSync(apiEnvPath)) {
  const content = fs.readFileSync(apiEnvPath, 'utf-8');
  assertCheck(
    'API env.ts parses and validates production URLs with HTTPS',
    content.includes('validateProductionUrl') && content.includes('Public origin must use HTTPS scheme'),
    'services/api env.ts does not validate public URL schemes with URL parser.'
  );
  assertCheck(
    'API env.ts rejects development database and redis loopbacks in production',
    content.includes('Cannot target development loopback host') && content.includes('Default development DATABASE_URL'),
    'services/api env.ts does not reject dev db/redis loopbacks in production.'
  );
}

const workspacesRoutePath = path.resolve(rootDir, 'services/api/src/routes/workspaces.ts');
if (fs.existsSync(workspacesRoutePath)) {
  const content = fs.readFileSync(workspacesRoutePath, 'utf-8');
  assertCheck(
    'Workspaces routes use canonical invitation base URL without client header injection',
    content.includes('resolveCanonicalInvitationBaseUrl') && !content.includes("(req.headers.origin as string) ||"),
    'workspaces.ts still permits client-controlled Origin/Referer header injection for invitation links.'
  );
}

// 8. Check API version route
const versionRoutePath = path.resolve(rootDir, 'services/api/src/routes/version.ts');
if (fs.existsSync(versionRoutePath)) {
  const content = fs.readFileSync(versionRoutePath, 'utf-8');
  assertCheck(
    'API version route resolves dynamic commit SHA from deployment runtime',
    content.includes('process.env.RENDER_GIT_COMMIT') && !content.includes("gitCommit: '5fc3468'"),
    'version.ts still contains hardcoded gitCommit string literal.'
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
  console.log('✓ ALL PRODUCTION ARTIFACT CHECKS PASSED: Zero development fallbacks in production configurations.');
  process.exit(0);
}

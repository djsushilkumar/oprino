/**
 * Oprino Phase 4C — Automated Pilot Scenarios & Invariant Verification Suite
 * 
 * Verifies end-to-end field ops workflows against isolated pilot backend:
 * 1. Isolated health check & synthetic tenant isolation
 * 2. Employee authentication & tenant scoped workspace
 * 3. Device registration & governance (ADR-006)
 * 4. Zero Off-Duty GPS tracking enforcement (Duty-boundary invariant)
 * 5. Attendance punch-in with selfie proof upload
 * 6. On-duty location tracking within site geofence
 * 7. Task assignment & checklist progress
 * 8. Task proof-of-work photo storage & filesystem durability
 * 9. Manager review & task proof verification
 * 10. Attendance punch-out and immediate GPS cutoff
 * 11. Device revocation & session termination
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const API_BASE = 'http://localhost:3001';

async function request(reqPath, options = {}) {
  const url = new URL(reqPath, API_BASE);
  const method = options.method || 'GET';
  const headers = options.headers || {};
  let body = options.body;

  if (body && typeof body === 'object' && !Buffer.isBuffer(body)) {
    body = JSON.stringify(body);
    headers['Content-Type'] = 'application/json';
  }

  return new Promise((resolve, reject) => {
    const req = http.request(url, { method, headers }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf-8');
        let data = raw;
        try {
          data = JSON.parse(raw);
        } catch {}
        resolve({ status: res.statusCode, headers: res.headers, body: data });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

async function uploadBinary(uploadUrl, buffer) {
  const url = new URL(uploadUrl);
  return new Promise((resolve, reject) => {
    const req = http.request(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': buffer.length,
      },
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf-8') });
      });
    });
    req.on('error', reject);
    req.write(buffer);
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ PASSED: ${message}`);
}

async function runPilotVerification() {
  console.log('\n=============================================================');
  console.log('🚀 OPRINO PHASE 4C: PILOT SCENARIOS & PRIVACY INVARIANT SUITE');
  console.log('=============================================================\n');

  // Reset state to ensure clean test run
  await request('/v1/test/reset', { method: 'POST' }).catch(() => {});

  // SCENARIO 1: Isolated Environment & Health Check
  console.log('--- SCENARIO 1: Isolated Environment & Health Check ---');
  const healthRes = await request('/health/ready');
  assert(healthRes.status === 200, 'Isolated pilot server responds 200 OK');
  assert(healthRes.body.status === 'ok', 'Pilot server status is ok');
  assert(healthRes.body.mock === true, 'Server unmistakably identifies as synthetic in-memory mock');
  assert(healthRes.headers['x-oprino-mock-server'] === 'true', 'X-Oprino-Mock-Server header confirms test-double status');
  assert(healthRes.body.services.storage === 'local-isolated', 'Storage strictly local-isolated (Zero Neon/R2)');

  // SCENARIO 2: Employee Authentication & Tenant Isolation
  console.log('\n--- SCENARIO 2: Employee Login & Tenant Isolation ---');
  const empLogin = await request('/v1/auth/sign-in/email', {
    method: 'POST',
    body: {
      email: 'field.lead@acme.com',
      password: 'PilotPassword123!'
    }
  });
  assert(empLogin.status === 200, 'Employee login succeeds with synthetic credentials');
  assert(empLogin.body.user.email === 'field.lead@acme.com', 'Authenticated user email matches');
  const empToken = empLogin.body.token;

  // Verify Me Context & Workspace Isolation
  const meRes = await request('/v1/me', {
    headers: { Authorization: `Bearer ${empToken}` }
  });
  assert(meRes.status === 200, 'Context endpoint /v1/me returned 200');
  assert(meRes.body.activeWorkspace.id === 'ws-pilot-1', 'Active workspace confirmed as ws-pilot-1');
  assert(meRes.body.activeWorkspace.name === 'Apex Field Services', 'Tenant verified as Apex Field Services');
  assert(meRes.body.role.name === 'Employee', 'Role verified as Employee');

  // SCENARIO 3: Device Registration & Governance (OnePlus Hardware)
  console.log('\n--- SCENARIO 3: Device Registration & Governance (OnePlus Hardware) ---');
  const devReg = await request('/v1/devices', {
    method: 'POST',
    headers: { Authorization: `Bearer ${empToken}` },
    body: {
      installationId: '55df2f92-6116-45ad-971e-374d9782b085',
      platform: 'ANDROID',
      model: 'OnePlus Nord CE4 (CPH2707)',
      osVersion: 'Android 16 (API 36)'
    }
  });
  assert(devReg.status === 200, 'Device registration accepted');
  assert(devReg.body.status === 'REGISTERED', 'Physical device installation marked REGISTERED');

  // SCENARIO 4: Privacy Invariant — Zero Off-Duty GPS Tracking
  console.log('\n--- SCENARIO 4: Zero Off-Duty GPS Tracking Invariant ---');
  const offDutyLoc = await request('/v1/location/breadcrumb', {
    method: 'POST',
    headers: { Authorization: `Bearer ${empToken}` },
    body: {
      latitude: 12.9716,
      longitude: 77.5946,
      accuracy: 4.5,
      timestamp: new Date().toISOString()
    }
  });
  assert(offDutyLoc.status === 403, 'Off-duty GPS submission strictly rejected with HTTP 403 Forbidden');
  assert(offDutyLoc.body.code === 'OFF_DUTY_TRACKING_PROHIBITED', 'Zero off-duty tracking invariant explicitly enforced');

  // SCENARIO 5: Attendance Punch-In with Selfie Proof Upload
  console.log('\n--- SCENARIO 5: Attendance Punch-In with Selfie Proof Upload ---');
  const selfieUrlRes = await request('/v1/media/attendance-selfie-url', {
    method: 'POST',
    headers: { Authorization: `Bearer ${empToken}` }
  });
  assert(selfieUrlRes.status === 200, 'Presigned selfie upload URL generated');
  assert(Boolean(selfieUrlRes.body.uploadUrl), 'Upload URL provided');
  assert(Boolean(selfieUrlRes.body.fileKey), 'FileKey provided');

  // Upload synthetic selfie binary
  const selfieBuffer = Buffer.from('JPEG_SELFIE_BINARY_PILOT_VERIFICATION_PAYLOAD_DATA');
  const selfieUploadRes = await uploadBinary(selfieUrlRes.body.uploadUrl, selfieBuffer);
  assert(selfieUploadRes.status === 200, 'Selfie binary successfully written to local pilot storage');

  // Execute Punch-In
  const punchInRes = await request('/v1/attendance/punch-in', {
    method: 'POST',
    headers: { Authorization: `Bearer ${empToken}` },
    body: {
      selfieMediaKey: selfieUrlRes.body.fileKey,
      latitude: 28.6139,
      longitude: 77.209,
      accuracy: 4.2
    }
  });
  assert(punchInRes.status === 200, 'Punch-in accepted with valid selfie proof');
  assert(punchInRes.body.status === 'ON_DUTY', 'Attendance status transitioned to ON_DUTY');

  // SCENARIO 6: On-Duty Location Tracking
  console.log('\n--- SCENARIO 6: On-Duty Location Tracking Within Site Geofence ---');
  const onDutyLoc = await request('/v1/location/breadcrumb', {
    method: 'POST',
    headers: { Authorization: `Bearer ${empToken}` },
    body: {
      latitude: 28.6140,
      longitude: 77.2092,
      accuracy: 3.5,
      timestamp: new Date().toISOString()
    }
  });
  assert(onDutyLoc.status === 200, 'On-duty GPS breadcrumb accepted and recorded');
  assert(onDutyLoc.body.recorded === true, 'Breadcrumb successfully stored during active shift');

  // SCENARIO 7: Task Assignment & Checklist Progress
  console.log('\n--- SCENARIO 7: Task Assignment & Checklist Progress ---');
  const tasksRes = await request('/v1/tasks', {
    headers: { Authorization: `Bearer ${empToken}` }
  });
  assert(tasksRes.status === 200 && tasksRes.body.tasks.length > 0, 'Employee fetches assigned field tasks');
  const task = tasksRes.body.tasks[0];
  console.log(`  Assigned Task: "${task.title}" at site: ${task.customerName}`);

  const checkRes = await request(`/v1/tasks/${task.id}/checklist/chk-1`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${empToken}` },
    body: { isCompleted: true }
  });
  assert(checkRes.status === 200, 'Checklist item 1 marked as completed');

  // SCENARIO 8: Task Proof-of-Work Photo Upload & Local Durability
  console.log('\n--- SCENARIO 8: Task Proof Upload & Local Storage Durability ---');
  const proofUrlRes = await request('/v1/media/upload-url', {
    method: 'POST',
    headers: { Authorization: `Bearer ${empToken}` },
    body: { taskId: task.id }
  });
  assert(proofUrlRes.status === 200, 'Task proof upload URL generated');

  const proofBuffer = Buffer.from('JPEG_PROOF_OF_WORK_COMPRESSOR_HEPA_FILTER_INSPECTION');
  const proofUploadRes = await uploadBinary(proofUrlRes.body.uploadUrl, proofBuffer);
  assert(proofUploadRes.status === 200, 'Task proof binary uploaded to local storage');

  const confirmProofRes = await request(`/v1/tasks/${task.id}/proofs`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${empToken}` },
    body: {
      fileKey: proofUrlRes.body.fileKey,
      proofType: 'PHOTO',
      notes: 'Completed intake filter replacement and pressure check'
    }
  });
  assert(confirmProofRes.status === 201, 'Proof record linked to task');

  // SCENARIO 9: Manager Proof Review & Verification
  console.log('\n--- SCENARIO 9: Manager Review & Task Approval ---');
  const mgrLogin = await request('/v1/auth/sign-in/email', {
    method: 'POST',
    body: {
      email: 'manager@acme.com',
      password: 'PilotPassword123!'
    }
  });
  assert(mgrLogin.status === 200, 'Manager authentication succeeds');
  const mgrToken = mgrLogin.body.token;

  const verifyTaskRes = await request(`/v1/tasks/${task.id}/verify`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${mgrToken}` },
    body: { action: 'APPROVE' }
  });
  assert(verifyTaskRes.status === 200, 'Manager approves task completion');
  assert(verifyTaskRes.body.status === 'VERIFIED', 'Task status transitioned to VERIFIED');

  // SCENARIO 10: Attendance Punch-Out & Immediate GPS Cutoff
  console.log('\n--- SCENARIO 10: Attendance Punch-Out & Duty Cutoff ---');
  const punchOutRes = await request('/v1/attendance/punch-out', {
    method: 'POST',
    headers: { Authorization: `Bearer ${empToken}` }
  });
  assert(punchOutRes.status === 200, 'Punch-out recorded successfully');
  assert(punchOutRes.body.status === 'OFF_DUTY', 'Attendance status transitioned to OFF_DUTY');

  // Verify GPS tracking stops immediately post punch-out
  const postDutyLoc = await request('/v1/location/breadcrumb', {
    method: 'POST',
    headers: { Authorization: `Bearer ${empToken}` },
    body: {
      latitude: 28.6145,
      longitude: 77.2100,
      accuracy: 5.0,
      timestamp: new Date().toISOString()
    }
  });
  assert(postDutyLoc.status === 403, 'Subsequent GPS breadcrumbs immediately rejected post punch-out');
  assert(postDutyLoc.body.code === 'OFF_DUTY_TRACKING_PROHIBITED', 'Zero off-duty tracking invariant strictly maintained');

  // SCENARIO 11: Device Revocation & Session Invalidation
  console.log('\n--- SCENARIO 11: Device Revocation & Session Invalidation ---');
  const revokeRes = await request('/v1/devices/revoke', {
    method: 'POST',
    headers: { Authorization: `Bearer ${mgrToken}` }
  });
  assert(revokeRes.status === 200, 'Manager successfully revokes device installation');

  const revokedAccessRes = await request('/v1/tasks', {
    headers: { Authorization: `Bearer ${empToken}` }
  });
  assert(revokedAccessRes.status === 401, 'Revoked device session immediately blocked with HTTP 401');
  assert(revokedAccessRes.body.code === 'DEVICE_REVOKED', 'DEVICE_REVOKED error contract enforced');

  console.log('\n=============================================================');
  console.log('🎉 ALL 11 PILOT SCENARIOS & PRIVACY INVARIANTS 100% VERIFIED!');
  console.log('=============================================================\n');
}

runPilotVerification().catch((err) => {
  console.error('\n❌ PILOT VERIFICATION SUITE FAILED:', err);
  process.exit(1);
});

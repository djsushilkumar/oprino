import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildServer } from './server.js';

describe('V1 Release Blockers Remediation Integration Tests (BLK-002 through BLK-006)', () => {
  const { app, dbClient } = buildServer({
    env: { NODE_ENV: 'test' },
    logger: false,
  });

  const ownerAEmail = `owner.blockers.a.${Date.now()}@example.com`;
  const ownerBEmail = `owner.blockers.b.${Date.now()}@example.com`;
  const password = 'SecurePassword123!';

  let tokenOwnerA: string;
  let userOwnerAId: string;
  let workspaceAId: string;
  let ownerAMembershipId: string;

  let tokenOwnerB: string;
  let workspaceBId: string;

  let tokenEmployeeA: string;
  let employeeAMembershipId: string;

  before(async () => {
    await app.ready();

    // 1. Sign up Owner A & Create Workspace A
    const resA = await app.inject({
      method: 'POST',
      url: '/v1/auth/signup',
      payload: { email: ownerAEmail, password, name: 'Owner Alpha' },
    });
    const bodyA = resA.json();
    tokenOwnerA = bodyA.token;
    userOwnerAId = bodyA.user.id;

    const wsResA = await app.inject({
      method: 'POST',
      url: '/v1/workspaces',
      headers: { authorization: `Bearer ${tokenOwnerA}` },
      payload: { name: 'Alpha Logistics' },
    });
    workspaceAId = wsResA.json().id;

    // Get owner A membership id
    const membersA = await app.inject({
      method: 'GET',
      url: '/v1/workspaces/members',
      headers: {
        authorization: `Bearer ${tokenOwnerA}`,
        'x-workspace-id': workspaceAId,
      },
    });
    ownerAMembershipId = membersA.json().members[0].membershipId;

    // 2. Sign up Owner B & Create Workspace B
    const resB = await app.inject({
      method: 'POST',
      url: '/v1/auth/signup',
      payload: { email: ownerBEmail, password, name: 'Owner Beta' },
    });
    tokenOwnerB = resB.json().token;

    const wsResB = await app.inject({
      method: 'POST',
      url: '/v1/workspaces',
      headers: { authorization: `Bearer ${tokenOwnerB}` },
      payload: { name: 'Beta Systems' },
    });
    workspaceBId = wsResB.json().id;
  });

  after(async () => {
    await app.close();
  });

  // =========================================================================
  // BLK-002: Secure Employee Invitation Workflow
  // =========================================================================
  describe('BLK-002: Secure Employee Invitation Workflow', () => {
    let generatedToken: string;
    const inviteeEmail = `invitee.field.${Date.now()}@example.com`;

    test('1. Admin generates secure invitation link with single-use cryptographic token', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/workspaces/members/invite',
        headers: {
          authorization: `Bearer ${tokenOwnerA}`,
          'x-workspace-id': workspaceAId,
        },
        payload: {
          email: inviteeEmail,
          name: 'Priya Sharma',
          roleName: 'Employee',
        },
      });

      assert.strictEqual(res.statusCode, 201);
      const data = res.json();
      assert.strictEqual(data.invitation.email, inviteeEmail);
      assert.strictEqual(data.invitation.roleName, 'Employee');
      assert.strictEqual(data.invitation.status, 'PENDING');
      assert.ok(data.invitation.invitationUrl);
      assert.ok(data.invitation.invitationUrl.includes('/auth/activate?token='));

      // Extract raw token from url
      const url = new URL(data.invitation.invitationUrl);
      generatedToken = url.searchParams.get('token')!;
      assert.ok(generatedToken.length >= 32);
    });

    test('2. Token validation endpoint returns invitation metadata without leaking credentials', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/v1/auth/invitations/${generatedToken}/validate`,
      });

      assert.strictEqual(res.statusCode, 200);
      const data = res.json();
      assert.strictEqual(data.valid, true);
      assert.strictEqual(data.email, inviteeEmail);
      assert.strictEqual(data.workspaceName, 'Alpha Logistics');
      assert.strictEqual(data.roleName, 'Employee');
    });

    test('3. Invitee sets their own password and activates account via single-use token', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/auth/invitations/accept',
        payload: {
          token: generatedToken,
          password: 'CustomStrongPassword456!',
          name: 'Priya Sharma',
        },
      });

      assert.strictEqual(res.statusCode, 200);
      const data = res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.data.email, inviteeEmail);

      // Now invitee can sign in using their own chosen password
      const signInRes = await app.inject({
        method: 'POST',
        url: '/v1/auth/signin',
        payload: {
          email: inviteeEmail,
          password: 'CustomStrongPassword456!',
        },
      });

      assert.strictEqual(signInRes.statusCode, 200);
      tokenEmployeeA = signInRes.json().token;
      assert.ok(signInRes.json().user.id);
      assert.strictEqual(signInRes.json().activeWorkspaceId, workspaceAId);

      // Save employee membership ID for lifecycle tests
      const members = await app.inject({
        method: 'GET',
        url: '/v1/workspaces/members',
        headers: {
          authorization: `Bearer ${tokenOwnerA}`,
          'x-workspace-id': workspaceAId,
        },
      });
      const member = members.json().members.find((m: any) => m.email === inviteeEmail);
      assert.ok(member);
      employeeAMembershipId = member.membershipId;
    });

    test('4. Token replay prevention: Used token is rejected on second acceptance attempt', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/auth/invitations/accept',
        payload: {
          token: generatedToken,
          password: 'AnotherPassword789!',
        },
      });

      assert.strictEqual(res.statusCode, 400);
      const body = res.json();
      assert.ok(body.message.includes('already accepted'));
    });

    test('5. Admin can revoke an invitation before it is accepted', async () => {
      const revokeEmail = `revoked.field.${Date.now()}@example.com`;
      const invRes = await app.inject({
        method: 'POST',
        url: '/v1/workspaces/members/invite',
        headers: {
          authorization: `Bearer ${tokenOwnerA}`,
          'x-workspace-id': workspaceAId,
        },
        payload: { email: revokeEmail, roleName: 'Employee' },
      });
      const invData = invRes.json();
      const rawUrl = new URL(invData.invitation.invitationUrl);
      const tokenToRevoke = rawUrl.searchParams.get('token')!;

      // Revoke it
      const revokeRes = await app.inject({
        method: 'POST',
        url: `/v1/workspaces/members/invitations/${invData.invitation.id}/revoke`,
        headers: {
          authorization: `Bearer ${tokenOwnerA}`,
          'x-workspace-id': workspaceAId,
        },
      });
      assert.strictEqual(revokeRes.statusCode, 200);

      // Attempting to accept revoked token is rejected
      const acceptRes = await app.inject({
        method: 'POST',
        url: '/v1/auth/invitations/accept',
        payload: { token: tokenToRevoke, password: 'ValidPassword123!' },
      });
      assert.strictEqual(acceptRes.statusCode, 400);
      assert.ok(acceptRes.json().message.includes('already revoked'));
    });

    test('6. Non-admin (Employee) cannot invite members (403 Forbidden)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/workspaces/members/invite',
        headers: {
          authorization: `Bearer ${tokenEmployeeA}`,
          'x-workspace-id': workspaceAId,
        },
        payload: { email: `unauthorized.${Date.now()}@example.com`, roleName: 'Employee' },
      });

      assert.strictEqual(res.statusCode, 403);
    });

    test('7. Inviting an existing active member of the workspace returns 409 Conflict', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/workspaces/members/invite',
        headers: {
          authorization: `Bearer ${tokenOwnerA}`,
          'x-workspace-id': workspaceAId,
        },
        payload: { email: inviteeEmail, roleName: 'Employee' },
      });

      assert.strictEqual(res.statusCode, 409);
    });
  });

  // =========================================================================
  // BLK-003: Employee Bulk CSV Import
  // =========================================================================
  describe('BLK-003: Employee Bulk CSV Import', () => {
    test('1. Bulk import with 25 valid employees generates 25 distinct invitations', async () => {
      const batch25 = Array.from({ length: 25 }, (_, i) => ({
        name: `Tech TwentyFive ${i}`,
        email: `batch25.user.${Date.now()}.${i}@example.com`,
        role: (i % 5 === 0 ? 'Manager' : 'Employee') as 'Manager' | 'Employee',
      }));

      const res = await app.inject({
        method: 'POST',
        url: '/v1/workspaces/members/import-csv',
        headers: {
          authorization: `Bearer ${tokenOwnerA}`,
          'x-workspace-id': workspaceAId,
        },
        payload: { members: batch25 },
      });

      assert.strictEqual(res.statusCode, 200);
      const data = res.json();
      assert.strictEqual(data.totalRows, 25);
      assert.strictEqual(data.successCount, 25);
      assert.strictEqual(data.failureCount, 0);
      assert.strictEqual(data.results.length, 25);
      assert.strictEqual(data.results[0].status, 'INVITED');
      assert.ok(data.results[0].invitationUrl);
    });

    test('2. Bounded batch size: 100 valid employees import is supported', async () => {
      const batch100 = Array.from({ length: 100 }, (_, i) => ({
        name: `Bulk Employee ${i}`,
        email: `bulk100.user.${Date.now()}.${i}@example.com`,
        role: 'Employee' as const,
      }));

      const res = await app.inject({
        method: 'POST',
        url: '/v1/workspaces/members/import-csv',
        headers: {
          authorization: `Bearer ${tokenOwnerA}`,
          'x-workspace-id': workspaceAId,
        },
        payload: { members: batch100 },
      });

      assert.strictEqual(res.statusCode, 200);
      const data = res.json();
      assert.strictEqual(data.totalRows, 100);
      assert.strictEqual(data.successCount, 100);
      assert.strictEqual(data.failureCount, 0);
    });

    test('3. Oversized batch (>100 rows) is rejected with 400 Bad Request', async () => {
      const batch101 = Array.from({ length: 101 }, (_, i) => ({
        name: `Oversized Employee ${i}`,
        email: `oversized.${Date.now()}.${i}@example.com`,
        role: 'Employee' as const,
      }));

      const res = await app.inject({
        method: 'POST',
        url: '/v1/workspaces/members/import-csv',
        headers: {
          authorization: `Bearer ${tokenOwnerA}`,
          'x-workspace-id': workspaceAId,
        },
        payload: { members: batch101 },
      });

      assert.strictEqual(res.statusCode, 400);
    });

    test('4. Batch with duplicates, invalid emails, and formula injection sanitization', async () => {
      const duplicateEmail = `dupe.${Date.now()}@example.com`;
      const mixedBatch = [
        { name: '=cmd|"/c calc"!A0', email: `safe.${Date.now()}@example.com`, role: 'Employee' as const },
        { name: 'Duplicate One', email: duplicateEmail, role: 'Employee' as const },
        { name: 'Duplicate Two', email: duplicateEmail, role: 'Employee' as const },
        { name: 'Invalid Email Person', email: 'not-an-email', role: 'Employee' as const },
      ];

      const res = await app.inject({
        method: 'POST',
        url: '/v1/workspaces/members/import-csv',
        headers: {
          authorization: `Bearer ${tokenOwnerA}`,
          'x-workspace-id': workspaceAId,
        },
        payload: { members: mixedBatch },
      });

      assert.strictEqual(res.statusCode, 200);
      const data = res.json();
      assert.strictEqual(data.totalRows, 4);
      assert.strictEqual(data.successCount, 2); // 1 formula sanitized + 1 first duplicate
      assert.strictEqual(data.failureCount, 2); // 1 skipped duplicate + 1 invalid email

      const formulaRow = data.results.find((r: any) => r.row === 1);
      assert.strictEqual(formulaRow.status, 'INVITED');

      const skippedDupe = data.results.find((r: any) => r.row === 3);
      assert.strictEqual(skippedDupe.status, 'SKIPPED');

      const invalidRow = data.results.find((r: any) => r.row === 4);
      assert.strictEqual(invalidRow.status, 'FAILED');
    });

    test('5. Non-admin (Employee) cannot execute bulk import (403 Forbidden)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/workspaces/members/import-csv',
        headers: {
          authorization: `Bearer ${tokenEmployeeA}`,
          'x-workspace-id': workspaceAId,
        },
        payload: {
          members: [{ name: 'Unauthorized', email: `unauth.${Date.now()}@example.com`, role: 'Employee' }],
        },
      });

      assert.strictEqual(res.statusCode, 403);
    });
  });

  // =========================================================================
  // BLK-004: Selfie-Verified Attendance & Policy Enforcement
  // =========================================================================
  describe('BLK-004: Selfie-Verified Attendance & Policy Enforcement', () => {
    test('1. Default SIMPLE policy allows standard punch-in without selfie or GPS', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/attendance/punch-in',
        headers: {
          authorization: `Bearer ${tokenEmployeeA}`,
          'x-workspace-id': workspaceAId,
        },
        payload: {
          idempotencyKey: `punch-simple-${Date.now()}`,
          note: 'Starting shift simple',
        },
      });

      assert.strictEqual(res.statusCode, 200);
      const session = res.json();
      assert.strictEqual(session.status, 'ON_DUTY');

      // Punch out to reset duty state
      await app.inject({
        method: 'POST',
        url: '/v1/attendance/punch-out',
        headers: {
          authorization: `Bearer ${tokenEmployeeA}`,
          'x-workspace-id': workspaceAId,
        },
        payload: { idempotencyKey: `punch-out-reset-${Date.now()}` },
      });
    });

    test('2. Owner configures company policy to SELFIE_REQUIRED', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/v1/workspaces/settings',
        headers: {
          authorization: `Bearer ${tokenOwnerA}`,
          'x-workspace-id': workspaceAId,
        },
        payload: { attendancePolicy: 'SELFIE_REQUIRED' },
      });

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.json().settings.attendancePolicy, 'SELFIE_REQUIRED');
    });

    test('3. Under SELFIE_REQUIRED, punch in without selfie is rejected with 400 MISSING_REQUIRED_SELFIE', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/attendance/punch-in',
        headers: {
          authorization: `Bearer ${tokenEmployeeA}`,
          'x-workspace-id': workspaceAId,
        },
        payload: {
          idempotencyKey: `punch-missing-selfie-${Date.now()}`,
          note: 'Punching without selfie',
        },
      });

      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.json().error, 'MISSING_REQUIRED_SELFIE');
    });

    test('4. Employee requests direct selfie upload URL and punches in successfully with selfieMediaKey', async () => {
      // Step A: Request direct upload URL
      const uploadUrlRes = await app.inject({
        method: 'POST',
        url: '/v1/media/attendance-selfie-url',
        headers: {
          authorization: `Bearer ${tokenEmployeeA}`,
          'x-workspace-id': workspaceAId,
        },
        payload: { fileName: 'punch_in_selfie.jpg' },
      });

      assert.strictEqual(uploadUrlRes.statusCode, 200);
      const { uploadUrl, fileKey } = uploadUrlRes.json();
      assert.ok(fileKey.startsWith(`${workspaceAId}/attendance/`));

      // Step B: Mock upload to storage target
      const mockUploadRes = await app.inject({
        method: 'PUT',
        url: new URL(uploadUrl).pathname,
        headers: { 'content-type': 'application/octet-stream' },
        payload: 'fake-image-bytes-mock',
      });
      assert.strictEqual(mockUploadRes.statusCode, 200);

      // Step C: Punch in referencing verified selfieMediaKey
      const punchRes = await app.inject({
        method: 'POST',
        url: '/v1/attendance/punch-in',
        headers: {
          authorization: `Bearer ${tokenEmployeeA}`,
          'x-workspace-id': workspaceAId,
        },
        payload: {
          idempotencyKey: `punch-with-selfie-${Date.now()}`,
          selfieMediaKey: fileKey,
          latitude: 28.6139,
          longitude: 77.2090,
          accuracy: 8.5,
          note: 'Punch in with front-camera selfie',
        },
      });

      assert.strictEqual(punchRes.statusCode, 200);
      const session = punchRes.json();
      assert.strictEqual(session.status, 'ON_DUTY');
      assert.strictEqual(session.selfieMediaKey, fileKey);
      assert.strictEqual(session.punchInLatitude, 28.6139);
      assert.strictEqual(session.punchInLongitude, 77.2090);

      // Punch out
      await app.inject({
        method: 'POST',
        url: '/v1/attendance/punch-out',
        headers: {
          authorization: `Bearer ${tokenEmployeeA}`,
          'x-workspace-id': workspaceAId,
        },
        payload: { idempotencyKey: `punch-out-after-selfie-${Date.now()}` },
      });
    });

    test('5. Replay prevention: reusing identical selfieMediaKey in another session is blocked', async () => {
      // Request upload URL
      const uploadUrlRes = await app.inject({
        method: 'POST',
        url: '/v1/media/attendance-selfie-url',
        headers: {
          authorization: `Bearer ${tokenEmployeeA}`,
          'x-workspace-id': workspaceAId,
        },
      });
      const { fileKey } = uploadUrlRes.json();

      // First punch with fileKey
      await app.inject({
        method: 'POST',
        url: '/v1/attendance/punch-in',
        headers: {
          authorization: `Bearer ${tokenEmployeeA}`,
          'x-workspace-id': workspaceAId,
        },
        payload: {
          idempotencyKey: `punch-replay-1-${Date.now()}`,
          selfieMediaKey: fileKey,
        },
      });

      // Punch out
      await app.inject({
        method: 'POST',
        url: '/v1/attendance/punch-out',
        headers: {
          authorization: `Bearer ${tokenEmployeeA}`,
          'x-workspace-id': workspaceAId,
        },
        payload: { idempotencyKey: `punch-out-replay-1-${Date.now()}` },
      });

      // Second punch attempting to reuse identical fileKey
      const replayRes = await app.inject({
        method: 'POST',
        url: '/v1/attendance/punch-in',
        headers: {
          authorization: `Bearer ${tokenEmployeeA}`,
          'x-workspace-id': workspaceAId,
        },
        payload: {
          idempotencyKey: `punch-replay-2-${Date.now()}`,
          selfieMediaKey: fileKey,
        },
      });

      assert.strictEqual(replayRes.statusCode, 400);
      assert.strictEqual(replayRes.json().error, 'SELFIE_REPLAY_DETECTED');
    });

    test('6. Manager team attendance overview reflects selfie references', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/attendance/team',
        headers: {
          authorization: `Bearer ${tokenOwnerA}`,
          'x-workspace-id': workspaceAId,
        },
      });

      assert.strictEqual(res.statusCode, 200);
      const data = res.json();
      assert.ok(Array.isArray(data.history));
      const sessionWithSelfie = data.history.find((s: any) => s.selfieMediaKey !== null);
      assert.ok(sessionWithSelfie);
      assert.ok(sessionWithSelfie.selfieMediaKey.includes(workspaceAId));
    });

    test('7. Tenant media boundary: access to media file across workspaces is blocked (403)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/v1/media/files/${encodeURIComponent(`${workspaceAId}/attendance/some-file.jpg`)}`,
        headers: {
          authorization: `Bearer ${tokenOwnerB}`,
          'x-workspace-id': workspaceBId,
        },
      });

      assert.strictEqual(res.statusCode, 403);
    });
  });

  // =========================================================================
  // BLK-005: Employee Lifecycle Management
  // =========================================================================
  describe('BLK-005: Employee Lifecycle Management', () => {
    test('1. Admin updates employee role to Manager and assigns manager', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/v1/workspaces/members/${employeeAMembershipId}`,
        headers: {
          authorization: `Bearer ${tokenOwnerA}`,
          'x-workspace-id': workspaceAId,
        },
        payload: {
          roleName: 'Manager',
          managerId: userOwnerAId,
        },
      });

      assert.strictEqual(res.statusCode, 200);
      const data = res.json();
      assert.strictEqual(data.member.roleName, 'Manager');
      assert.strictEqual(data.member.managerId, userOwnerAId);
    });

    test('2. Admin suspends employee; suspended member is revoked and blocked', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/v1/workspaces/members/${employeeAMembershipId}`,
        headers: {
          authorization: `Bearer ${tokenOwnerA}`,
          'x-workspace-id': workspaceAId,
        },
        payload: { status: 'suspended' },
      });

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.json().member.status, 'suspended');

      // Suspended member cannot punch in
      const punchRes = await app.inject({
        method: 'POST',
        url: '/v1/attendance/punch-in',
        headers: {
          authorization: `Bearer ${tokenEmployeeA}`,
          'x-workspace-id': workspaceAId,
        },
        payload: { idempotencyKey: `punch-suspended-${Date.now()}` },
      });
      assert.strictEqual(punchRes.statusCode, 403);

      // Reactivate member for subsequent checks
      await app.inject({
        method: 'PATCH',
        url: `/v1/workspaces/members/${employeeAMembershipId}`,
        headers: {
          authorization: `Bearer ${tokenOwnerA}`,
          'x-workspace-id': workspaceAId,
        },
        payload: { status: 'active', roleName: 'Employee' },
      });
    });

    test('3. Last-Active-Owner Protection: Attempting to demote or suspend last Owner is blocked with 400', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/v1/workspaces/members/${ownerAMembershipId}`,
        headers: {
          authorization: `Bearer ${tokenOwnerA}`,
          'x-workspace-id': workspaceAId,
        },
        payload: {
          status: 'suspended',
        },
      });

      assert.strictEqual(res.statusCode, 400);
      assert.ok(res.json().message.includes('last active Owner'));
    });

    test('4. Non-admin (Employee) cannot modify membership lifecycle (403 Forbidden)', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/v1/workspaces/members/${ownerAMembershipId}`,
        headers: {
          authorization: `Bearer ${tokenEmployeeA}`,
          'x-workspace-id': workspaceAId,
        },
        payload: { roleName: 'Employee' },
      });

      assert.strictEqual(res.statusCode, 403);
    });
  });

  // =========================================================================
  // BLK-006: Configurable Location Retention
  // =========================================================================
  describe('BLK-006: Configurable Location Retention', () => {
    test('1. GET /v1/workspaces/settings returns default retention of 30 days', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/workspaces/settings',
        headers: {
          authorization: `Bearer ${tokenOwnerA}`,
          'x-workspace-id': workspaceAId,
        },
      });

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.json().settings.locationRetentionDays, 30);
    });

    test('2. Owner updates retention to 7 days', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/v1/workspaces/settings',
        headers: {
          authorization: `Bearer ${tokenOwnerA}`,
          'x-workspace-id': workspaceAId,
        },
        payload: { locationRetentionDays: 7 },
      });

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.json().settings.locationRetentionDays, 7);
    });

    test('3. Non-owner (Employee) cannot update workspace retention settings (403 Forbidden)', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/v1/workspaces/settings',
        headers: {
          authorization: `Bearer ${tokenEmployeeA}`,
          'x-workspace-id': workspaceAId,
        },
        payload: { locationRetentionDays: 90 },
      });

      assert.strictEqual(res.statusCode, 403);
    });

    test('4. Per-workspace retention procedure isolates data and prunes target workspace correctly', async () => {
      // Insert old telemetry record in Workspace A (10 days old, retention is 7 days)
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      await dbClient.client`
        INSERT INTO employee_locations (workspace_id, user_id, latitude, longitude, accuracy, recorded_at)
        VALUES (${workspaceAId}::uuid, ${userOwnerAId}::uuid, 28.5, 77.2, 5.0, ${tenDaysAgo.toISOString()});
      `;

      // Insert old telemetry record in Workspace B (10 days old, retention in Workspace B is default 30 days)
      await dbClient.client`
        INSERT INTO employee_locations (workspace_id, user_id, latitude, longitude, accuracy, recorded_at)
        VALUES (${workspaceBId}::uuid, ${userOwnerAId}::uuid, 19.0, 72.8, 5.0, ${tenDaysAgo.toISOString()});
      `;

      // Run per-workspace pruning for Workspace A with 7 days retention
      const [pruneResultA] = (await dbClient.client`
        SELECT telemetry_prune_workspace_records(${workspaceAId}::uuid, 7) as deleted_count;
      `) as unknown as [{ deleted_count: number }];

      assert.ok(pruneResultA.deleted_count >= 1);

      // Verify Workspace B record remains intact (cross-tenant isolation invariant)
      const remainingB = await dbClient.client`
        SELECT id FROM employee_locations
        WHERE workspace_id = ${workspaceBId}::uuid AND recorded_at = ${tenDaysAgo.toISOString()};
      `;
      assert.strictEqual(remainingB.length, 1);
    });
  });
});

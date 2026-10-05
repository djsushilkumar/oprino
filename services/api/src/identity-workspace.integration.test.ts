import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildServer } from './server.js';
import { sql, eq } from 'drizzle-orm';
import * as schema from '@oprino/database/schema';

describe('Oprino Identity, Workspace & Multi-Tenant API Integration Tests', () => {
  const { app, dbClient } = buildServer({
    env: { NODE_ENV: 'test' },
    logger: false,
  });
  const db = dbClient.db;

  const testUserAEmail = `owner.alpha.${Date.now()}@example.com`;
  const testUserBEmail = `technician.beta.${Date.now()}@example.com`;
  const testPassword = 'SecurePassword123!';

  let tokenA: string;
  let userAId: string;
  let workspaceAId: string;

  let tokenB: string;
  let userBId: string;

  const installationAId = 'a1111111-2222-3333-4444-555555555555';

  before(async () => {
    await app.ready();
  });

  after(async () => {
    // Teardown test data
    if (workspaceAId) {
      await db.delete(schema.workspaces).where(eq(schema.workspaces.id, workspaceAId));
    }
    if (userAId && userBId) {
      await db.delete(schema.users).where(sql`id IN (${userAId}, ${userBId})`);
    }
    await app.close();
  });

  test('1. Unauthenticated request to /v1/me returns 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/me',
    });

    assert.strictEqual(res.statusCode, 401);
  });

  test('2. User A signup creates user and returns session credential', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/signup',
      payload: {
        email: testUserAEmail,
        password: testPassword,
        name: 'Alpha Owner',
      },
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.ok(body.token, 'Must return session token');
    assert.strictEqual(body.user.email, testUserAEmail);
    assert.strictEqual(body.user.name, 'Alpha Owner');

    tokenA = body.token;
    userAId = body.user.id;
  });

  test('3. User A signin validates credentials', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/signin',
      payload: {
        email: testUserAEmail,
        password: testPassword,
      },
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.ok(body.token);
    assert.strictEqual(body.user.id, userAId);
  });

  test('4. POST /v1/workspaces atomically provisions workspace, default roles, permissions, and owner membership', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/workspaces',
      headers: {
        authorization: `Bearer ${tokenA}`,
      },
      payload: {
        name: 'Alpha Operations Corp',
      },
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.ok(body.id);
    assert.strictEqual(body.name, 'Alpha Operations Corp');
    assert.strictEqual(body.role, 'Owner/Admin');
    assert.ok(body.permissions.includes('workspace.manage'));
    assert.ok(body.permissions.includes('members.manage'));
    assert.ok(body.permissions.includes('devices.manage'));

    workspaceAId = body.id;

    // Verify atomic database state
    const createdRoles = await db
      .select()
      .from(schema.roles)
      .where(eq(schema.roles.workspaceId, workspaceAId));
    assert.strictEqual(createdRoles.length, 3, 'Must create Owner, Manager, and Employee roles');

    const auditEvents = await db
      .select()
      .from(schema.auditLogs)
      .where(eq(schema.auditLogs.workspaceId, workspaceAId));
    assert.strictEqual(auditEvents.length, 1);
    assert.strictEqual(auditEvents[0].action, 'workspace.created');
  });

  test('5. GET /v1/workspaces returns only authorized workspaces', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/workspaces',
      headers: {
        authorization: `Bearer ${tokenA}`,
      },
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.workspaces.length, 1);
    assert.strictEqual(body.workspaces[0].id, workspaceAId);
    assert.strictEqual(body.workspaces[0].membershipStatus, 'active');
    assert.strictEqual(body.workspaces[0].roleName, 'Owner/Admin');
  });

  test('6. GET /v1/me resolves active workspace context and permissions', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/me',
      headers: {
        authorization: `Bearer ${tokenA}`,
        'x-workspace-id': workspaceAId,
      },
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.user.id, userAId);
    assert.strictEqual(body.activeWorkspace.id, workspaceAId);
    assert.strictEqual(body.role.name, 'Owner/Admin');
    assert.ok(body.permissions.includes('workspace.manage'));
  });

  test('7. Second user (User B) signs up and cannot access User A workspace (403 Forbidden)', async () => {
    // Signup User B
    const signupRes = await app.inject({
      method: 'POST',
      url: '/v1/auth/signup',
      payload: {
        email: testUserBEmail,
        password: testPassword,
        name: 'Beta Tech',
      },
    });

    assert.strictEqual(signupRes.statusCode, 200);
    const bodyB = JSON.parse(signupRes.body);
    tokenB = bodyB.token;
    userBId = bodyB.user.id;

    // User B attempts to access Workspace A
    const resMe = await app.inject({
      method: 'GET',
      url: '/v1/me',
      headers: {
        authorization: `Bearer ${tokenB}`,
        'x-workspace-id': workspaceAId,
      },
    });

    assert.strictEqual(resMe.statusCode, 200);
    const meBody = JSON.parse(resMe.body);
    assert.strictEqual(meBody.activeWorkspace, null, 'User B must not have access to Workspace A');
    assert.strictEqual(meBody.permissions.length, 0);

    // User B attempts to switch to Workspace A via session switch
    const switchRes = await app.inject({
      method: 'POST',
      url: '/v1/session/workspace',
      headers: {
        authorization: `Bearer ${tokenB}`,
      },
      payload: {
        workspaceId: workspaceAId,
      },
    });

    assert.strictEqual(switchRes.statusCode, 403, 'Must reject forged workspace switch');
  });

  test('8. Suspended membership is rejected with 403', async () => {
    // Add User B to Workspace A as SUSPENDED
    const [managerRole] = await db
      .select()
      .from(schema.roles)
      .where(sql`workspace_id = ${workspaceAId} AND name = 'Manager'`);

    await db.insert(schema.workspaceMemberships).values({
      workspaceId: workspaceAId,
      userId: userBId,
      roleId: managerRole.id,
      status: 'suspended',
    });

    // Attempt to switch to suspended workspace
    const switchRes = await app.inject({
      method: 'POST',
      url: '/v1/session/workspace',
      headers: {
        authorization: `Bearer ${tokenB}`,
      },
      payload: {
        workspaceId: workspaceAId,
      },
    });

    assert.strictEqual(switchRes.statusCode, 403);
    const body = JSON.parse(switchRes.body);
    assert.match(body.message, /suspended/i);
  });

  test('9. Removed membership is rejected with 403', async () => {
    // Update User B membership in Workspace A to REMOVED
    await db
      .update(schema.workspaceMemberships)
      .set({ status: 'removed' })
      .where(sql`workspace_id = ${workspaceAId} AND user_id = ${userBId}`);

    const switchRes = await app.inject({
      method: 'POST',
      url: '/v1/session/workspace',
      headers: {
        authorization: `Bearer ${tokenB}`,
      },
      payload: {
        workspaceId: workspaceAId,
      },
    });

    assert.strictEqual(switchRes.statusCode, 403);
    const body = JSON.parse(switchRes.body);
    assert.match(body.message, /invalid or inactive/i);

    // List workspaces for User B should NOT include removed workspace
    const listRes = await app.inject({
      method: 'GET',
      url: '/v1/workspaces',
      headers: {
        authorization: `Bearer ${tokenB}`,
      },
    });

    const listBody = JSON.parse(listRes.body);
    assert.strictEqual(listBody.workspaces.length, 0, 'Removed workspace must not appear in list');
  });

  test('10. Device registration, listing, and revocation lifecycle', async () => {
    // Register device installation
    const regRes = await app.inject({
      method: 'POST',
      url: '/v1/devices/register',
      headers: {
        authorization: `Bearer ${tokenA}`,
      },
      payload: {
        installationId: installationAId,
        platform: 'android',
        deviceModel: 'Pixel 8 Pro',
        osVersion: 'Android 15',
        appVersion: '1.0.0',
      },
    });

    assert.strictEqual(regRes.statusCode, 200);
    const regBody = JSON.parse(regRes.body);
    assert.strictEqual(regBody.installationId, installationAId);
    assert.strictEqual(regBody.isTrusted, true);

    // List devices
    const listRes = await app.inject({
      method: 'GET',
      url: '/v1/devices',
      headers: {
        authorization: `Bearer ${tokenA}`,
      },
    });

    assert.strictEqual(listRes.statusCode, 200);
    const listBody = JSON.parse(listRes.body);
    assert.strictEqual(listBody.devices.length, 1);
    assert.strictEqual(listBody.devices[0].installationId, installationAId);

    // Revoke device
    const revokeRes = await app.inject({
      method: 'POST',
      url: '/v1/devices/revoke',
      headers: {
        authorization: `Bearer ${tokenA}`,
      },
      payload: {
        installationId: installationAId,
      },
    });

    assert.strictEqual(revokeRes.statusCode, 200);
    assert.strictEqual(JSON.parse(revokeRes.body).success, true);

    // Next request with revoked installation ID header MUST be rejected with 401 DEVICE_REVOKED
    const rejectedReq = await app.inject({
      method: 'GET',
      url: '/v1/me',
      headers: {
        authorization: `Bearer ${tokenA}`,
        'x-installation-id': installationAId,
      },
    });

    assert.strictEqual(rejectedReq.statusCode, 401);
    const rejBody = JSON.parse(rejectedReq.body);
    assert.strictEqual(rejBody.error?.code, 'DEVICE_REVOKED');
  });

  test('11. Signout revokes session credential', async () => {
    const signoutRes = await app.inject({
      method: 'POST',
      url: '/v1/auth/signout',
      headers: {
        authorization: `Bearer ${tokenA}`,
      },
    });

    assert.strictEqual(signoutRes.statusCode, 200);

    // Subsequent request with revoked token must return 401
    const meAfterSignout = await app.inject({
      method: 'GET',
      url: '/v1/me',
      headers: {
        authorization: `Bearer ${tokenA}`,
      },
    });

    assert.strictEqual(meAfterSignout.statusCode, 401);
  });
});

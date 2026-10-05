import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { sql } from 'drizzle-orm';
import { createDatabaseClient } from '@oprino/database';
import * as schema from '@oprino/database/schema';

describe('PostgreSQL Row-Level Security (RLS) & Multi-Tenant Isolation Integration Tests', () => {
  // Use oprino_app (non-superuser role) so PostgreSQL kernel enforces RLS
  const appDbClient = createDatabaseClient({
    url:
      process.env.DATABASE_URL_APP ||
      'postgresql://oprino_app:oprino_dev_password@localhost:5432/oprino_db',
    max: 2,
  });
  const db = appDbClient.db;

  // Admin client for test setup and teardown
  const adminDbClient = createDatabaseClient({
    url:
      process.env.DATABASE_URL ||
      'postgresql://oprino_admin:oprino_dev_password@localhost:5432/oprino_db',
    max: 1,
  });
  const adminDb = adminDbClient.db;

  let workspaceAId: string;
  let workspaceBId: string;
  let userAId: string;
  let userBId: string;
  let roleAId: string;
  let roleBId: string;

  before(async () => {
    // 1. Create two isolated workspaces in DB
    const [wsA] = await adminDb
      .insert(schema.workspaces)
      .values({
        name: 'RLS Tenant Alpha',
        slug: `rls-tenant-alpha-${Date.now()}`,
        status: 'ACTIVE',
      })
      .returning();
    workspaceAId = wsA.id;

    const [wsB] = await adminDb
      .insert(schema.workspaces)
      .values({
        name: 'RLS Tenant Beta',
        slug: `rls-tenant-beta-${Date.now()}`,
        status: 'ACTIVE',
      })
      .returning();
    workspaceBId = wsB.id;

    // 2. Create users
    const [uA] = await adminDb
      .insert(schema.users)
      .values({
        name: 'User Alpha',
        email: `user.alpha.${Date.now()}@example.com`,
      })
      .returning();
    userAId = uA.id;

    const [uB] = await adminDb
      .insert(schema.users)
      .values({
        name: 'User Beta',
        email: `user.beta.${Date.now()}@example.com`,
      })
      .returning();
    userBId = uB.id;

    // 3. Create roles
    const [rA] = await adminDb
      .insert(schema.roles)
      .values({
        workspaceId: workspaceAId,
        name: 'Role Alpha',
      })
      .returning();
    roleAId = rA.id;

    const [rB] = await adminDb
      .insert(schema.roles)
      .values({
        workspaceId: workspaceBId,
        name: 'Role Beta',
      })
      .returning();
    roleBId = rB.id;

    // 4. Create memberships
    await adminDb.insert(schema.workspaceMemberships).values([
      {
        workspaceId: workspaceAId,
        userId: userAId,
        roleId: roleAId,
        status: 'active',
      },
      {
        workspaceId: workspaceBId,
        userId: userBId,
        roleId: roleBId,
        status: 'active',
      },
    ]);

    // 5. Create audit log entries
    await adminDb.insert(schema.auditLogs).values([
      {
        workspaceId: workspaceAId,
        actorId: userAId,
        action: 'test.alpha_action',
        targetType: 'test',
        targetId: 'alpha-1',
      },
      {
        workspaceId: workspaceBId,
        actorId: userBId,
        action: 'test.beta_action',
        targetType: 'test',
        targetId: 'beta-1',
      },
    ]);
  });

  after(async () => {
    // Cleanup test data
    if (workspaceAId && workspaceBId) {
      await adminDb.delete(schema.workspaces).where(sql`id IN (${workspaceAId}, ${workspaceBId})`);
    }
    if (userAId && userBId) {
      await adminDb.delete(schema.users).where(sql`id IN (${userAId}, ${userBId})`);
    }
    await appDbClient.client.end();
    await adminDbClient.client.end();
  });

  test('Direct query on tenant-scoped table without tenant context returns 0 rows (RLS default-deny)', async () => {
    // When connected as oprino_app (NO BYPASSRLS) and app.current_workspace_id is empty:
    // RLS policy evaluates to false
    const rows = await db.select().from(schema.roles);
    assert.strictEqual(rows.length, 0, 'RLS must block all rows when tenant context is omitted');

    const auditRows = await db.select().from(schema.auditLogs);
    assert.strictEqual(
      auditRows.length,
      0,
      'RLS must block audit logs when tenant context is omitted',
    );
  });

  test('Transaction with SET LOCAL app.current_workspace_id isolates queries to that tenant only', async () => {
    await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceAId}, true)`);

      const rolesA = await tx.select().from(schema.roles);
      assert.strictEqual(rolesA.length, 1, 'Should find exactly 1 role for Tenant A');
      assert.strictEqual(rolesA[0].id, roleAId);
      assert.strictEqual(rolesA[0].workspaceId, workspaceAId);

      const auditA = await tx.select().from(schema.auditLogs);
      assert.strictEqual(auditA.length, 1, 'Should find exactly 1 audit log for Tenant A');
      assert.strictEqual(auditA[0].action, 'test.alpha_action');
    });
  });

  test('User in Workspace A cannot read Workspace B records via RLS', async () => {
    await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceAId}, true)`);

      // Attempt to query Role B explicitly by its UUID
      const crossRole = await tx
        .select()
        .from(schema.roles)
        .where(sql`id = ${roleBId}`);

      assert.strictEqual(
        crossRole.length,
        0,
        'RLS must cull Workspace B record when tenant context is Workspace A',
      );

      // Attempt to query Audit Log B
      const crossAudit = await tx
        .select()
        .from(schema.auditLogs)
        .where(sql`workspace_id = ${workspaceBId}`);

      assert.strictEqual(crossAudit.length, 0, 'RLS must cull Workspace B audit logs');
    });
  });

  test('User in Workspace A cannot write/insert records into Workspace B (RLS WITH CHECK violation)', async () => {
    let insertError: any = null;
    try {
      await db.transaction(async (tx) => {
        await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceAId}, true)`);
        await tx.insert(schema.roles).values({
          workspaceId: workspaceBId,
          name: 'Malicious Forged Role',
        });
      });
    } catch (err) {
      insertError = err;
    }

    assert.ok(
      insertError,
      'Database must reject insert when workspace_id violates RLS WITH CHECK policy',
    );
    assert.match(insertError.message, /violates row-level security policy/i);
  });

  test('Pooled connection does not retain prior tenant context (SET LOCAL isolation)', async () => {
    // Transaction 1: sets tenant context to Workspace A and completes
    await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceAId}, true)`);
      const rolesA = await tx.select().from(schema.roles);
      assert.strictEqual(rolesA.length, 1);
    });

    // Transaction 2: starts fresh on the same pool without setting context
    await db.transaction(async (tx) => {
      const res = await tx.execute(
        sql`SELECT current_setting('app.current_workspace_id', true) as current_ws`,
      );
      const currentWs = (res as any)[0]?.current_ws;
      assert.strictEqual(
        currentWs,
        '',
        'SET LOCAL must reset tenant setting upon transaction commit',
      );

      // Querying roles returns 0 rows
      const rolesEmpty = await tx.select().from(schema.roles);
      assert.strictEqual(rolesEmpty.length, 0, 'No roles should leak from previous transaction');
    });
  });
});

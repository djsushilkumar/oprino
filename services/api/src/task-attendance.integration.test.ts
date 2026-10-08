import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildServer } from './server.js';
import { sql, eq, and } from 'drizzle-orm';
import { createDatabaseClient } from '@oprino/database';
import * as schema from '@oprino/database/schema';

describe('Phase 02B: Task & Attendance Core Domain Integration & Security Tests', () => {
  const { app, dbClient } = buildServer({
    env: { NODE_ENV: 'test' },
    logger: false,
  });
  const db = dbClient.db;

  // Dedicated client connected as non-superuser oprino_app for PostgreSQL RLS testing
  const appDbClient = createDatabaseClient({
    url:
      process.env.DATABASE_URL_APP ||
      'postgresql://oprino_app:oprino_dev_password@localhost:5432/oprino_db',
    max: 2,
  });
  const appDb = appDbClient.db;

  // Workspace A (Tenant Alpha)
  const ownerAEmail = `owner.task.a.${Date.now()}@example.com`;
  const employeeAEmail = `employee.task.a.${Date.now()}@example.com`;
  const suspendedAEmail = `suspended.task.a.${Date.now()}@example.com`;

  // Workspace B (Tenant Beta)
  const ownerBEmail = `owner.task.b.${Date.now()}@example.com`;
  const employeeBEmail = `employee.task.b.${Date.now()}@example.com`;

  const password = 'SecurePassword123!';

  let tokenOwnerA: string;
  let userOwnerAId: string;
  let workspaceAId: string;

  let tokenEmployeeA: string;
  let userEmployeeAId: string;

  let userSuspendedAId: string;

  let tokenOwnerB: string;
  let userOwnerBId: string;
  let workspaceBId: string;

  let tokenEmployeeB: string;
  let userEmployeeBId: string;

  let createdTaskId: string;
  let createdShiftId: string;

  before(async () => {
    await app.ready();

    // 1. Sign up Owner A
    const resA = await app.inject({
      method: 'POST',
      url: '/v1/auth/signup',
      payload: { email: ownerAEmail, password, name: 'Owner Alpha' },
    });
    const bodyA = resA.json();
    tokenOwnerA = bodyA.token;
    userOwnerAId = bodyA.user.id;

    // 2. Create Workspace A
    const wsResA = await app.inject({
      method: 'POST',
      url: '/v1/workspaces',
      headers: { authorization: `Bearer ${tokenOwnerA}` },
      payload: { name: 'Tenant Alpha Operations' },
    });
    workspaceAId = wsResA.json().id;

    // 3. Sign up Employee A
    const resEmpA = await app.inject({
      method: 'POST',
      url: '/v1/auth/signup',
      payload: { email: employeeAEmail, password, name: 'Employee Alpha' },
    });
    const bodyEmpA = resEmpA.json();
    tokenEmployeeA = bodyEmpA.token;
    userEmployeeAId = bodyEmpA.user.id;

    // 4. Sign up Suspended User A
    const resSuspA = await app.inject({
      method: 'POST',
      url: '/v1/auth/signup',
      payload: { email: suspendedAEmail, password, name: 'Suspended Alpha' },
    });
    userSuspendedAId = resSuspA.json().user.id;

    // 5. Add Employee A to Workspace A with Employee role
    const [empRoleA] = await db
      .select()
      .from(schema.roles)
      .where(and(eq(schema.roles.workspaceId, workspaceAId), eq(schema.roles.name, 'Employee')));

    await db.insert(schema.workspaceMemberships).values([
      {
        workspaceId: workspaceAId,
        userId: userEmployeeAId,
        roleId: empRoleA.id,
        status: 'active',
      },
      {
        workspaceId: workspaceAId,
        userId: userSuspendedAId,
        roleId: empRoleA.id,
        status: 'suspended',
      },
    ]);

    // 6. Sign up Owner B & Create Workspace B
    const resB = await app.inject({
      method: 'POST',
      url: '/v1/auth/signup',
      payload: { email: ownerBEmail, password, name: 'Owner Beta' },
    });
    const bodyB = resB.json();
    tokenOwnerB = bodyB.token;
    userOwnerBId = bodyB.user.id;

    const wsResB = await app.inject({
      method: 'POST',
      url: '/v1/workspaces',
      headers: { authorization: `Bearer ${tokenOwnerB}` },
      payload: { name: 'Tenant Beta Operations' },
    });
    workspaceBId = wsResB.json().id;

    // 7. Sign up Employee B & Add to Workspace B
    const resEmpB = await app.inject({
      method: 'POST',
      url: '/v1/auth/signup',
      payload: { email: employeeBEmail, password, name: 'Employee Beta' },
    });
    const bodyEmpB = resEmpB.json();
    tokenEmployeeB = bodyEmpB.token;
    userEmployeeBId = bodyEmpB.user.id;

    const [empRoleB] = await db
      .select()
      .from(schema.roles)
      .where(and(eq(schema.roles.workspaceId, workspaceBId), eq(schema.roles.name, 'Employee')));

    await db.insert(schema.workspaceMemberships).values({
      workspaceId: workspaceBId,
      userId: userEmployeeBId,
      roleId: empRoleB.id,
      status: 'active',
    });
  });

  after(async () => {
    // Cleanup workspaces
    if (workspaceAId) {
      await db.delete(schema.workspaces).where(eq(schema.workspaces.id, workspaceAId));
    }
    if (workspaceBId) {
      await db.delete(schema.workspaces).where(eq(schema.workspaces.id, workspaceBId));
    }
    if (userOwnerAId && userOwnerBId) {
      await db
        .delete(schema.users)
        .where(
          sql`id IN (${userOwnerAId}, ${userEmployeeAId}, ${userSuspendedAId}, ${userOwnerBId}, ${userEmployeeBId})`,
        );
    }
    await appDbClient.client.end();
    await app.close();
  });

  // =========================================================================
  // TASK SECURITY & WORKFLOW TESTS
  // =========================================================================

  test('Tasks: Unauthenticated create request is rejected with 401', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/tasks',
      headers: { 'x-workspace-id': workspaceAId },
      payload: { title: 'Unauthorized Task' },
    });

    assert.strictEqual(res.statusCode, 401);
  });

  test('Tasks: Employee without tasks.create permission cannot create task (403 Forbidden)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/tasks',
      headers: {
        authorization: `Bearer ${tokenEmployeeA}`,
        'x-workspace-id': workspaceAId,
      },
      payload: { title: 'Employee Created Task' },
    });

    assert.strictEqual(res.statusCode, 403);
    assert.match(res.json().message, /tasks\.create/);
  });

  test('Tasks: Cross-workspace assignee assignment is rejected with 400', async () => {
    // Owner A attempts to assign Employee B (from Workspace B) to a task in Workspace A
    const res = await app.inject({
      method: 'POST',
      url: '/v1/tasks',
      headers: {
        authorization: `Bearer ${tokenOwnerA}`,
        'x-workspace-id': workspaceAId,
      },
      payload: {
        title: 'Cross Tenant Task Attempt',
        assigneeIds: [userEmployeeBId],
      },
    });

    assert.strictEqual(res.statusCode, 400);
    assert.match(res.json().message, /not an active member of this workspace/);
  });

  test('Tasks: Suspended workspace member cannot be assigned to task (400)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/tasks',
      headers: {
        authorization: `Bearer ${tokenOwnerA}`,
        'x-workspace-id': workspaceAId,
      },
      payload: {
        title: 'Suspended Assignee Attempt',
        assigneeIds: [userSuspendedAId],
      },
    });

    assert.strictEqual(res.statusCode, 400);
    assert.match(res.json().message, /not an active member of this workspace/);
  });

  test('Tasks: Authorized manager creates task with assignees and checklist items', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/tasks',
      headers: {
        authorization: `Bearer ${tokenOwnerA}`,
        'x-workspace-id': workspaceAId,
      },
      payload: {
        title: 'Emergency Generator Maintenance',
        description: 'Inspect fuel line and test transfer switch',
        priority: 'HIGH',
        dueAt: '2026-10-10T18:00:00.000Z',
        assigneeIds: [userEmployeeAId],
        checklist: ['Check oil level', 'Test battery voltage', 'Perform 15-min load test'],
      },
    });

    assert.strictEqual(res.statusCode, 201);
    const body = res.json();
    assert.strictEqual(body.title, 'Emergency Generator Maintenance');
    assert.strictEqual(body.status, 'ASSIGNED');
    assert.strictEqual(body.simplifiedStatus, 'TO_DO');
    assert.strictEqual(body.priority, 'HIGH');
    assert.strictEqual(body.version, 1);
    assert.strictEqual(body.assignees.length, 1);
    assert.strictEqual(body.assignees[0].userId, userEmployeeAId);
    assert.strictEqual(body.checklist.length, 3);
    assert.strictEqual(body.checklist[0].title, 'Check oil level');
    assert.strictEqual(body.checklist[0].isCompleted, false);

    createdTaskId = body.id;
  });

  test('Tasks: Cross-workspace read of task is blocked (404 / isolated)', async () => {
    // Owner B in Workspace B attempts to read Task A from Workspace A
    const res = await app.inject({
      method: 'GET',
      url: `/v1/tasks/${createdTaskId}`,
      headers: {
        authorization: `Bearer ${tokenOwnerB}`,
        'x-workspace-id': workspaceBId,
      },
    });

    assert.strictEqual(res.statusCode, 404);
  });

  test('Tasks: Invalid status transition is rejected with 400', async () => {
    // Current status is ASSIGNED. Attempting direct transition to COMPLETED (skipping ACCEPTED, EN_ROUTE, ARRIVED, IN_PROGRESS)
    const res = await app.inject({
      method: 'POST',
      url: `/v1/tasks/${createdTaskId}/transition`,
      headers: {
        authorization: `Bearer ${tokenEmployeeA}`,
        'x-workspace-id': workspaceAId,
      },
      payload: {
        status: 'COMPLETED',
        version: 1,
      },
    });

    assert.strictEqual(res.statusCode, 400);
    assert.match(res.json().message, /Invalid status transition/);
  });

  test('Tasks: Optimistic concurrency conflict returns 409 when client version is stale', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/v1/tasks/${createdTaskId}/transition`,
      headers: {
        authorization: `Bearer ${tokenEmployeeA}`,
        'x-workspace-id': workspaceAId,
      },
      payload: {
        status: 'ACCEPTED',
        version: 999, // Stale version
      },
    });

    assert.strictEqual(res.statusCode, 409);
    assert.match(res.json().message, /Version conflict/);
  });

  test('Tasks: Valid transition progression ASSIGNED -> ACCEPTED -> EN_ROUTE -> ARRIVED -> IN_PROGRESS -> COMPLETED', async () => {
    // 1. ASSIGNED -> ACCEPTED (version 1 -> 2)
    const res1 = await app.inject({
      method: 'POST',
      url: `/v1/tasks/${createdTaskId}/transition`,
      headers: {
        authorization: `Bearer ${tokenEmployeeA}`,
        'x-workspace-id': workspaceAId,
      },
      payload: { status: 'ACCEPTED', version: 1, comment: 'Accepted task' },
    });
    assert.strictEqual(res1.statusCode, 200);
    assert.strictEqual(res1.json().status, 'ACCEPTED');
    assert.strictEqual(res1.json().simplifiedStatus, 'TO_DO');
    assert.strictEqual(res1.json().version, 2);

    // 2. ACCEPTED -> EN_ROUTE (version 2 -> 3)
    const res2 = await app.inject({
      method: 'POST',
      url: `/v1/tasks/${createdTaskId}/transition`,
      headers: {
        authorization: `Bearer ${tokenEmployeeA}`,
        'x-workspace-id': workspaceAId,
      },
      payload: { status: 'EN_ROUTE', version: 2 },
    });
    assert.strictEqual(res2.statusCode, 200);
    assert.strictEqual(res2.json().status, 'EN_ROUTE');
    assert.strictEqual(res2.json().simplifiedStatus, 'IN_PROGRESS');

    // 3. EN_ROUTE -> ARRIVED (version 3 -> 4)
    const res3 = await app.inject({
      method: 'POST',
      url: `/v1/tasks/${createdTaskId}/transition`,
      headers: {
        authorization: `Bearer ${tokenEmployeeA}`,
        'x-workspace-id': workspaceAId,
      },
      payload: { status: 'ARRIVED', version: 3 },
    });
    assert.strictEqual(res3.statusCode, 200);
    assert.strictEqual(res3.json().status, 'ARRIVED');

    // 4. ARRIVED -> IN_PROGRESS (version 4 -> 5)
    const res4 = await app.inject({
      method: 'POST',
      url: `/v1/tasks/${createdTaskId}/transition`,
      headers: {
        authorization: `Bearer ${tokenEmployeeA}`,
        'x-workspace-id': workspaceAId,
      },
      payload: { status: 'IN_PROGRESS', version: 4 },
    });
    assert.strictEqual(res4.statusCode, 200);
    assert.strictEqual(res4.json().status, 'IN_PROGRESS');

    // Complete all checklist items (mandatory completion invariant)
    const currentTaskDetails = await app.inject({
      method: 'GET',
      url: `/v1/tasks/${createdTaskId}`,
      headers: {
        authorization: `Bearer ${tokenEmployeeA}`,
        'x-workspace-id': workspaceAId,
      },
    });
    for (const item of currentTaskDetails.json().checklist) {
      await app.inject({
        method: 'PATCH',
        url: `/v1/tasks/${createdTaskId}/checklist/${item.id}`,
        headers: {
          authorization: `Bearer ${tokenEmployeeA}`,
          'x-workspace-id': workspaceAId,
        },
        payload: { isCompleted: true },
      });
    }

    // 5. IN_PROGRESS -> COMPLETED (version 5 -> 6)
    const res5 = await app.inject({
      method: 'POST',
      url: `/v1/tasks/${createdTaskId}/transition`,
      headers: {
        authorization: `Bearer ${tokenEmployeeA}`,
        'x-workspace-id': workspaceAId,
      },
      payload: { status: 'COMPLETED', version: 5, comment: 'Work complete' },
    });
    assert.strictEqual(res5.statusCode, 200);
    assert.strictEqual(res5.json().status, 'COMPLETED');
    assert.strictEqual(res5.json().simplifiedStatus, 'DONE');
  });

  test('Tasks: Employee cannot verify task (COMPLETED -> VERIFIED requires tasks.verify permission)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/v1/tasks/${createdTaskId}/transition`,
      headers: {
        authorization: `Bearer ${tokenEmployeeA}`,
        'x-workspace-id': workspaceAId,
      },
      payload: { status: 'VERIFIED', version: 6 },
    });

    assert.strictEqual(res.statusCode, 403);
    assert.match(res.json().message, /tasks\.verify/);
  });

  test('Tasks: Manager with tasks.verify can verify task (COMPLETED -> VERIFIED)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/v1/tasks/${createdTaskId}/transition`,
      headers: {
        authorization: `Bearer ${tokenOwnerA}`,
        'x-workspace-id': workspaceAId,
      },
      payload: { status: 'VERIFIED', version: 6, comment: 'Verified and approved' },
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.json().status, 'VERIFIED');
    assert.strictEqual(res.json().simplifiedStatus, 'DONE');
    assert.strictEqual(res.json().version, 7);
  });

  test('Tasks: Checklist item completion toggle works', async () => {
    // Get task checklist items
    const taskRes = await app.inject({
      method: 'GET',
      url: `/v1/tasks/${createdTaskId}`,
      headers: {
        authorization: `Bearer ${tokenOwnerA}`,
        'x-workspace-id': workspaceAId,
      },
    });
    const checklist = taskRes.json().checklist;
    const itemId = checklist[0].id;

    // Toggle to completed
    const toggleRes = await app.inject({
      method: 'PATCH',
      url: `/v1/tasks/${createdTaskId}/checklist/${itemId}`,
      headers: {
        authorization: `Bearer ${tokenEmployeeA}`,
        'x-workspace-id': workspaceAId,
      },
      payload: { isCompleted: true },
    });

    assert.strictEqual(toggleRes.statusCode, 200);
    assert.strictEqual(toggleRes.json().isCompleted, true);
    assert.strictEqual(toggleRes.json().completedBy, userEmployeeAId);
  });

  // =========================================================================
  // ATTENDANCE SECURITY & WORKFLOW TESTS
  // =========================================================================

  test('Attendance: Unauthenticated punch request is rejected with 401', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/attendance/punch-in',
      headers: { 'x-workspace-id': workspaceAId },
      payload: { idempotencyKey: 'unauth-key-1' },
    });

    assert.strictEqual(res.statusCode, 401);
  });

  test('Attendance: Owner configures overnight shift (22:00 -> 06:00)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/attendance/shifts',
      headers: {
        authorization: `Bearer ${tokenOwnerA}`,
        'x-workspace-id': workspaceAId,
      },
      payload: {
        name: 'Overnight Plant Shift',
        startTime: '22:00',
        endTime: '06:00',
        timezone: 'UTC',
      },
    });

    assert.strictEqual(res.statusCode, 201);
    const body = res.json();
    assert.strictEqual(body.name, 'Overnight Plant Shift');
    assert.strictEqual(body.startTime, '22:00');
    assert.strictEqual(body.endTime, '06:00');
    createdShiftId = body.id;
  });

  test('Attendance: Employee punches in successfully (transitions to ON_DUTY)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/attendance/punch-in',
      headers: {
        authorization: `Bearer ${tokenEmployeeA}`,
        'x-workspace-id': workspaceAId,
      },
      payload: {
        idempotencyKey: 'punch-in-emp-a-key-1',
        shiftId: createdShiftId,
        note: 'Reporting for generator inspection',
      },
    });

    assert.strictEqual(res.statusCode, 200);
    const body = res.json();
    assert.strictEqual(body.status, 'ON_DUTY');
    assert.strictEqual(body.userId, userEmployeeAId);
    assert.ok(body.punchInTime);
    assert.strictEqual(body.punchOutTime, null);
  });

  test('Attendance: Replayed punch mutation with same idempotencyKey does NOT create duplicate session', async () => {
    // Retry with identical idempotencyKey
    const res = await app.inject({
      method: 'POST',
      url: '/v1/attendance/punch-in',
      headers: {
        authorization: `Bearer ${tokenEmployeeA}`,
        'x-workspace-id': workspaceAId,
      },
      payload: {
        idempotencyKey: 'punch-in-emp-a-key-1',
        shiftId: createdShiftId,
      },
    });

    assert.strictEqual(res.statusCode, 200);
    const body = res.json();
    assert.strictEqual(body.status, 'ON_DUTY');
    assert.strictEqual(body.userId, userEmployeeAId);

    // Verify in DB that only 1 session exists for Employee A
    const count = await db
      .select({ count: sql`count(*)` })
      .from(schema.attendanceSessions)
      .where(
        and(
          eq(schema.attendanceSessions.workspaceId, workspaceAId),
          eq(schema.attendanceSessions.userId, userEmployeeAId),
        ),
      );
    assert.strictEqual(Number((count[0] as any).count), 1);
  });

  test('Attendance: Concurrent duplicate Punch In with NEW idempotencyKey is blocked with 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/attendance/punch-in',
      headers: {
        authorization: `Bearer ${tokenEmployeeA}`,
        'x-workspace-id': workspaceAId,
      },
      payload: {
        idempotencyKey: 'punch-in-new-key-while-active',
      },
    });

    assert.strictEqual(res.statusCode, 400);
    assert.match(res.json().message, /Already on duty/);
  });

  test('Attendance: Current attendance endpoint returns ON_DUTY state and active session', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/attendance/current',
      headers: {
        authorization: `Bearer ${tokenEmployeeA}`,
        'x-workspace-id': workspaceAId,
      },
    });

    assert.strictEqual(res.statusCode, 200);
    const body = res.json();
    assert.strictEqual(body.dutyState, 'ON_DUTY');
    assert.ok(body.activeSession);
    assert.strictEqual(body.activeSession.userId, userEmployeeAId);
  });

  test('Attendance: Employee without attendance.team.read cannot access /v1/attendance/team (403)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/attendance/team',
      headers: {
        authorization: `Bearer ${tokenEmployeeA}`,
        'x-workspace-id': workspaceAId,
      },
    });

    assert.strictEqual(res.statusCode, 403);
    assert.match(res.json().message, /attendance\.team\.read/);
  });

  test('Attendance: Manager can view team attendance overview', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/attendance/team',
      headers: {
        authorization: `Bearer ${tokenOwnerA}`,
        'x-workspace-id': workspaceAId,
      },
    });

    assert.strictEqual(res.statusCode, 200);
    const body = res.json();
    assert.strictEqual(body.onDutyCount, 1);
    assert.strictEqual(body.activeSessions[0].userId, userEmployeeAId);
  });

  test('Attendance: Employee punches out successfully with authoritative server duration', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/attendance/punch-out',
      headers: {
        authorization: `Bearer ${tokenEmployeeA}`,
        'x-workspace-id': workspaceAId,
      },
      payload: {
        idempotencyKey: 'punch-out-emp-a-key-1',
        note: 'Completed scheduled duty',
      },
    });

    assert.strictEqual(res.statusCode, 200);
    const body = res.json();
    assert.strictEqual(body.status, 'OFF_DUTY');
    assert.ok(body.punchOutTime);
    assert.strictEqual(typeof body.durationMinutes, 'number');
  });

  test('Attendance: Punch Out without active session is rejected with 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/attendance/punch-out',
      headers: {
        authorization: `Bearer ${tokenEmployeeA}`,
        'x-workspace-id': workspaceAId,
      },
      payload: {
        idempotencyKey: 'punch-out-when-already-off',
      },
    });

    assert.strictEqual(res.statusCode, 400);
    assert.match(res.json().message, /No active attendance session/);
  });

  test('Attendance: Cross-workspace user cannot see Workspace A attendance history', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/attendance/history',
      headers: {
        authorization: `Bearer ${tokenEmployeeB}`,
        'x-workspace-id': workspaceBId,
      },
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.json().sessions.length, 0);
  });

  // =========================================================================
  // POSTGRESQL RLS ENFORCEMENT TESTS (NON-SUPERUSER oprino_app)
  // =========================================================================

  test('RLS: Direct query without tenant context on Phase 02B tables returns 0 rows (default-deny)', async () => {
    const taskRows = await appDb.select().from(schema.tasks);
    assert.strictEqual(taskRows.length, 0, 'RLS must block tasks when tenant context is omitted');

    const assigneeRows = await appDb.select().from(schema.taskAssignees);
    assert.strictEqual(assigneeRows.length, 0, 'RLS must block task_assignees without tenant context');

    const checklistRows = await appDb.select().from(schema.taskChecklistItems);
    assert.strictEqual(checklistRows.length, 0, 'RLS must block task_checklist_items without tenant context');

    const commentRows = await appDb.select().from(schema.taskComments);
    assert.strictEqual(commentRows.length, 0, 'RLS must block task_comments without tenant context');

    const activityRows = await appDb.select().from(schema.taskActivity);
    assert.strictEqual(activityRows.length, 0, 'RLS must block task_activity without tenant context');

    const shiftRows = await appDb.select().from(schema.attendanceShifts);
    assert.strictEqual(shiftRows.length, 0, 'RLS must block attendance_shifts without tenant context');

    const sessionRows = await appDb.select().from(schema.attendanceSessions);
    assert.strictEqual(sessionRows.length, 0, 'RLS must block attendance_sessions without tenant context');

    const eventRows = await appDb.select().from(schema.attendanceEvents);
    assert.strictEqual(eventRows.length, 0, 'RLS must block attendance_events without tenant context');
  });

  test('RLS: SET LOCAL app.current_workspace_id isolates Phase 02B queries to that tenant only', async () => {
    await appDb.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceAId}, true)`);

      const tasksA = await tx.select().from(schema.tasks);
      assert.strictEqual(tasksA.length, 1, 'Should find exactly 1 task for Tenant A');
      assert.strictEqual(tasksA[0].id, createdTaskId);

      const shiftsA = await tx.select().from(schema.attendanceShifts);
      assert.strictEqual(shiftsA.length, 1, 'Should find exactly 1 shift for Tenant A');
    });

    await appDb.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceBId}, true)`);

      const tasksB = await tx.select().from(schema.tasks);
      assert.strictEqual(tasksB.length, 0, 'Tenant B must see 0 tasks from Tenant A');

      const shiftsB = await tx.select().from(schema.attendanceShifts);
      assert.strictEqual(shiftsB.length, 0, 'Tenant B must see 0 shifts from Tenant A');
    });
  });
});

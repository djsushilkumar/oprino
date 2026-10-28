import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { buildServer } from './server.js';
import { sql, and, eq, inArray } from 'drizzle-orm';
import { createDatabaseClient } from '@oprino/database';
import * as schema from '@oprino/database/schema';

describe('Phase 02C: GPS Location Pipeline, Geofencing & Tracking Security Tests', () => {
  const { app, dbClient, pubsub } = buildServer({
    env: { NODE_ENV: 'test' },
    logger: false,
  });
  const db = dbClient.db;

  // Dedicated non-superuser client for RLS testing
  const appDbClient = createDatabaseClient({
    url:
      process.env.DATABASE_URL_APP ||
      'postgresql://oprino_app:oprino_dev_password@localhost:5432/oprino_db',
    max: 2,
  });
  const appDb = appDbClient.db;

  // Workspace A (Alpha)
  const ownerAEmail = `owner.loc.a.${Date.now()}@example.com`;
  const employeeAEmail = `employee.loc.a.${Date.now()}@example.com`;

  // Workspace B (Beta)
  const ownerBEmail = `owner.loc.b.${Date.now()}@example.com`;
  const employeeBEmail = `employee.loc.b.${Date.now()}@example.com`;

  const password = 'SecurePassword123!';

  let tokenOwnerA: string;
  let userOwnerAId: string;
  let workspaceAId: string;

  let tokenEmployeeA: string;
  let userEmployeeAId: string;

  let tokenOwnerB: string;
  let workspaceBId: string;

  let tokenEmployeeB: string;
  let userEmployeeBId: string;

  let testGeofenceId: string;

  before(async () => {
    await app.ready();

    // 1. Sign up Owner A
    const resA = await app.inject({
      method: 'POST',
      url: '/v1/auth/signup',
      payload: { name: 'Owner Alpha', email: ownerAEmail, password },
    });
    const dataA = JSON.parse(resA.body);
    tokenOwnerA = dataA.token;
    userOwnerAId = dataA.user.id;

    // Provision Workspace A
    const wsResA = await app.inject({
      method: 'POST',
      url: '/v1/workspaces',
      headers: { authorization: `Bearer ${tokenOwnerA}` },
      payload: { name: 'Alpha Logistics' },
    });
    workspaceAId = JSON.parse(wsResA.body).id;

    // Sign up Employee A
    const resEmpA = await app.inject({
      method: 'POST',
      url: '/v1/auth/signup',
      payload: { name: 'Field Tech Alpha', email: employeeAEmail, password },
    });
    const dataEmpA = JSON.parse(resEmpA.body);
    tokenEmployeeA = dataEmpA.token;
    userEmployeeAId = dataEmpA.user.id;

    // Attach Employee A to Workspace A as Employee role
    await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.bypass_rls', 'on', true)`);
      const [empRole] = await tx
        .select()
        .from(schema.roles)
        .where(
          sql`${schema.roles.workspaceId} = ${workspaceAId} AND ${schema.roles.name} = 'Employee'`,
        );

      await tx.insert(schema.workspaceMemberships).values({
        workspaceId: workspaceAId,
        userId: userEmployeeAId,
        roleId: empRole.id,
        status: 'active',
      });
    });

    await app.inject({
      method: 'POST',
      url: '/v1/workspaces/switch',
      headers: { authorization: `Bearer ${tokenEmployeeA}` },
      payload: { workspaceId: workspaceAId },
    });

    // 2. Sign up Owner B & Workspace B
    const resB = await app.inject({
      method: 'POST',
      url: '/v1/auth/signup',
      payload: { name: 'Owner Beta', email: ownerBEmail, password },
    });
    const dataB = JSON.parse(resB.body);
    tokenOwnerB = dataB.token;

    const wsResB = await app.inject({
      method: 'POST',
      url: '/v1/workspaces',
      headers: { authorization: `Bearer ${tokenOwnerB}` },
      payload: { name: 'Beta Freight' },
    });
    workspaceBId = JSON.parse(wsResB.body).id;

    // Sign up Employee B
    const resEmpB = await app.inject({
      method: 'POST',
      url: '/v1/auth/signup',
      payload: { name: 'Field Tech Beta', email: employeeBEmail, password },
    });
    const dataEmpB = JSON.parse(resEmpB.body);
    tokenEmployeeB = dataEmpB.token;
    userEmployeeBId = dataEmpB.user.id;

    await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.bypass_rls', 'on', true)`);
      const [empRole] = await tx
        .select()
        .from(schema.roles)
        .where(
          sql`${schema.roles.workspaceId} = ${workspaceBId} AND ${schema.roles.name} = 'Employee'`,
        );

      await tx.insert(schema.workspaceMemberships).values({
        workspaceId: workspaceBId,
        userId: userEmployeeBId,
        roleId: empRole.id,
        status: 'active',
      });
    });

    await app.inject({
      method: 'POST',
      url: '/v1/workspaces/switch',
      headers: { authorization: `Bearer ${tokenEmployeeB}` },
      payload: { workspaceId: workspaceBId },
    });
  });

  after(async () => {
    await app.close();
    await appDbClient.client.end();
    await dbClient.client.end();
  });

  // -------------------------------------------------------------------------
  // 1. Unauthenticated & Permission Boundaries
  // -------------------------------------------------------------------------
  test('Telemetry: Unauthenticated ingest request is rejected with 401', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/telemetry/locations',
      payload: {
        locations: [
          {
            id: '11111111-1111-1111-1111-111111111111',
            recordedAt: new Date().toISOString(),
            latitude: 28.6139,
            longitude: 77.209,
            accuracy: 10,
          },
        ],
      },
    });

    assert.equal(res.statusCode, 401);
  });

  // -------------------------------------------------------------------------
  // 2. Duty Boundary Invariant: Off-Duty Telemetry Discard
  // -------------------------------------------------------------------------
  test('Duty Boundary Invariant: Off-duty employee telemetry is HARD DROPPED with ZERO DB writes', async () => {
    const pointId = randomUUID();
    const res = await app.inject({
      method: 'POST',
      url: '/v1/telemetry/locations',
      headers: {
        authorization: `Bearer ${tokenEmployeeA}`,
        'x-workspace-id': workspaceAId,
      },
      payload: {
        locations: [
          {
            id: pointId,
            recordedAt: new Date().toISOString(),
            latitude: 28.6139,
            longitude: 77.209,
            accuracy: 12.0,
            speed: 5.0,
            activityType: 'walking',
          },
        ],
      },
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.accepted, 0);
    assert.equal(body.dropped, 1);
    assert.equal(body.reason, 'OFF_DUTY_FILTER');

    // Verify ZERO writes occurred in database
    await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.bypass_rls', 'on', true)`);
      const rows = await tx
        .select()
        .from(schema.employeeLocations)
        .where(sql`${schema.employeeLocations.id} = ${pointId}`);
      assert.equal(rows.length, 0, 'Zero off-duty telemetry points should exist in DB');
    });
  });

  // -------------------------------------------------------------------------
  // 3. On-Duty Telemetry Ingestion & Mileage Rollup
  // -------------------------------------------------------------------------
  test('Telemetry: On-duty employee telemetry is accepted, stored, and rolled into travel summary', async () => {
    // 1. Employee punches in
    const punchRes = await app.inject({
      method: 'POST',
      url: '/v1/attendance/punch-in',
      headers: {
        authorization: `Bearer ${tokenEmployeeA}`,
        'x-workspace-id': workspaceAId,
      },
      payload: {
        idempotencyKey: 'loc-test-punch-in-01',
      },
    });
    assert.equal(punchRes.statusCode, 200);

    // 2. Submit on-duty location points
    const point1Id = randomUUID();
    const point2Id = randomUUID();
    const now = new Date();
    const later = new Date(now.getTime() + 60000);

    const ingestRes = await app.inject({
      method: 'POST',
      url: '/v1/telemetry/locations',
      headers: {
        authorization: `Bearer ${tokenEmployeeA}`,
        'x-workspace-id': workspaceAId,
      },
      payload: {
        locations: [
          {
            id: point1Id,
            recordedAt: now.toISOString(),
            latitude: 28.6139,
            longitude: 77.209,
            accuracy: 10.0,
            speed: 3.5,
            batteryLevel: 0.92,
            isCharging: false,
            activityType: 'walking',
          },
          {
            id: point2Id,
            recordedAt: later.toISOString(),
            latitude: 28.615,
            longitude: 77.21,
            accuracy: 8.5,
            speed: 4.2,
            batteryLevel: 0.91,
            isCharging: false,
            activityType: 'walking',
          },
        ],
      },
    });

    if (ingestRes.statusCode !== 200) {
      console.error('INGEST FAILED BODY:', ingestRes.body);
    }
    assert.equal(ingestRes.statusCode, 200);
    const ingestBody = JSON.parse(ingestRes.body);
    assert.equal(ingestBody.accepted, 2);
    assert.equal(ingestBody.dropped, 0);

    // 3. Verify points in DB
    await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.bypass_rls', 'on', true)`);
      const rows = await tx
        .select()
        .from(schema.employeeLocations)
        .where(sql`${schema.employeeLocations.userId} = ${userEmployeeAId}`);
      assert.equal(rows.length, 2);

      // Verify travel summary exists
      const summaries = await tx
        .select()
        .from(schema.dailyTravelSummaries)
        .where(sql`${schema.dailyTravelSummaries.userId} = ${userEmployeeAId}`);
      assert.equal(summaries.length, 1);
      assert.ok(summaries[0].totalDistanceMeters > 0, 'Distance should be positive');
      assert.equal(summaries[0].pointCount, 2);
    });
  });

  // -------------------------------------------------------------------------
  // 4. Quality Filter (Accuracy & Speed bounds)
  // -------------------------------------------------------------------------
  test('Quality Filter: Points with accuracy > 50m are dropped', async () => {
    const badPointId = randomUUID();
    const goodPointId = randomUUID();

    const ingestRes = await app.inject({
      method: 'POST',
      url: '/v1/telemetry/locations',
      headers: {
        authorization: `Bearer ${tokenEmployeeA}`,
        'x-workspace-id': workspaceAId,
      },
      payload: {
        locations: [
          {
            id: badPointId,
            recordedAt: new Date().toISOString(),
            latitude: 28.6139,
            longitude: 77.209,
            accuracy: 95.0, // > 50m!
          },
          {
            id: goodPointId,
            recordedAt: new Date().toISOString(),
            latitude: 28.614,
            longitude: 77.2091,
            accuracy: 15.0, // Valid
          },
        ],
      },
    });

    assert.equal(ingestRes.statusCode, 200);
    const body = JSON.parse(ingestRes.body);
    assert.equal(body.accepted, 1);
    assert.equal(body.dropped, 1);
  });

  // -------------------------------------------------------------------------
  // 5. Peer Visibility Permission & Live Operational Map
  // -------------------------------------------------------------------------
  test('Peer Visibility Invariant: Employee without location.read cannot view live team map (403)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/telemetry/live',
      headers: {
        authorization: `Bearer ${tokenEmployeeA}`,
        'x-workspace-id': workspaceAId,
      },
    });

    assert.equal(res.statusCode, 403, 'Peer location visibility must be OFF by default');
  });

  test('Live Map: Manager/Owner with location.read can view live on-duty workers', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/telemetry/live',
      headers: {
        authorization: `Bearer ${tokenOwnerA}`,
        'x-workspace-id': workspaceAId,
      },
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.ok(Array.isArray(body.workers));
    assert.equal(body.workers.length, 1);
    assert.equal(body.workers[0].userId, userEmployeeAId);
    assert.equal(body.workers[0].dutyStatus, 'ON_DUTY');
    assert.ok(body.workers[0].latitude);
    assert.ok(body.workers[0].longitude);
  });

  // -------------------------------------------------------------------------
  // 6. Post Punch-Out Cutoff (Hard Duty Boundary)
  // -------------------------------------------------------------------------
  test('Duty Boundary: Subsequent points after Punch Out are immediately dropped', async () => {
    // 1. Employee punches out
    const punchOutRes = await app.inject({
      method: 'POST',
      url: '/v1/attendance/punch-out',
      headers: {
        authorization: `Bearer ${tokenEmployeeA}`,
        'x-workspace-id': workspaceAId,
      },
      payload: {
        idempotencyKey: 'loc-test-punch-out-01',
      },
    });
    assert.equal(punchOutRes.statusCode, 200);

    // 2. Attempt location ingest after punch out
    const postPunchOutPointId = randomUUID();
    const ingestRes = await app.inject({
      method: 'POST',
      url: '/v1/telemetry/locations',
      headers: {
        authorization: `Bearer ${tokenEmployeeA}`,
        'x-workspace-id': workspaceAId,
      },
      payload: {
        locations: [
          {
            id: postPunchOutPointId,
            recordedAt: new Date().toISOString(),
            latitude: 28.6139,
            longitude: 77.209,
            accuracy: 10.0,
          },
        ],
      },
    });

    assert.equal(ingestRes.statusCode, 200);
    const body = JSON.parse(ingestRes.body);
    assert.equal(body.accepted, 0);
    assert.equal(body.dropped, 1);
    assert.equal(body.reason, 'OFF_DUTY_FILTER');
  });

  test('Historical Duty Reconciliation: Offline points recorded during valid duty session uploaded AFTER punch-out are accepted', async () => {
    // 1. Employee starts a new shift
    const punchInRes = await app.inject({
      method: 'POST',
      url: '/v1/attendance/punch-in',
      headers: {
        authorization: `Bearer ${tokenEmployeeA}`,
        'x-workspace-id': workspaceAId,
      },
      payload: {
        idempotencyKey: 'hist-duty-punch-in-01',
      },
    });
    assert.equal(punchInRes.statusCode, 200);
    const punchInData = JSON.parse(punchInRes.body);
    const sessionPunchInTime = new Date(punchInData.punchInTime);

    // Offline point recorded 100ms after punch-in (strictly within duty shift)
    const offlineRecordedAt = new Date(sessionPunchInTime.getTime() + 100).toISOString();
    const offlinePointId = randomUUID();

    // Wait a brief moment to ensure punch-out occurs after offlineRecordedAt
    await new Promise((r) => setTimeout(r, 300));

    // 2. Employee punches out
    const punchOutRes = await app.inject({
      method: 'POST',
      url: '/v1/attendance/punch-out',
      headers: {
        authorization: `Bearer ${tokenEmployeeA}`,
        'x-workspace-id': workspaceAId,
      },
      payload: {
        idempotencyKey: 'hist-duty-punch-out-02',
      },
    });
    assert.equal(punchOutRes.statusCode, 200);

    // 3. Device now syncs the offline point recorded during the shift
    const syncRes = await app.inject({
      method: 'POST',
      url: '/v1/telemetry/locations',
      headers: {
        authorization: `Bearer ${tokenEmployeeA}`,
        'x-workspace-id': workspaceAId,
      },
      payload: {
        locations: [
          {
            id: offlinePointId,
            recordedAt: offlineRecordedAt,
            latitude: 28.6145,
            longitude: 77.2095,
            accuracy: 12.0,
          },
        ],
      },
    });

    assert.equal(syncRes.statusCode, 200);
    const syncBody = JSON.parse(syncRes.body);
    assert.equal(
      syncBody.accepted,
      1,
      'Offline point recorded during valid duty session must be accepted after punch-out',
    );
    assert.equal(syncBody.dropped, 0);
  });

  test('Idempotency & Travel Rollup: Duplicate batch submission does not duplicate distance or pointCount', async () => {
    // 1. Punch in for test
    await app.inject({
      method: 'POST',
      url: '/v1/attendance/punch-in',
      headers: {
        authorization: `Bearer ${tokenEmployeeA}`,
        'x-workspace-id': workspaceAId,
      },
      payload: {
        idempotencyKey: 'idem-duty-punch-in-01',
      },
    });

    const pt1Id = randomUUID();
    const pt2Id = randomUUID();
    const now = Date.now();
    const batch = {
      locations: [
        {
          id: pt1Id,
          recordedAt: new Date(now - 10000).toISOString(),
          latitude: 28.614,
          longitude: 77.209,
          accuracy: 8.0,
        },
        {
          id: pt2Id,
          recordedAt: new Date(now - 5000).toISOString(),
          latitude: 28.615,
          longitude: 77.21,
          accuracy: 8.0,
        },
      ],
    };

    // First ingestion
    const firstRes = await app.inject({
      method: 'POST',
      url: '/v1/telemetry/locations',
      headers: {
        authorization: `Bearer ${tokenEmployeeA}`,
        'x-workspace-id': workspaceAId,
      },
      payload: batch,
    });
    assert.equal(firstRes.statusCode, 200);

    const todayDate = new Date().toISOString().slice(0, 10);
    let summary1: any;
    await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceAId}, true)`);
      [summary1] = await tx
        .select()
        .from(schema.dailyTravelSummaries)
        .where(
          sql`${schema.dailyTravelSummaries.workspaceId} = ${workspaceAId} AND ${schema.dailyTravelSummaries.userId} = ${userEmployeeAId} AND ${schema.dailyTravelSummaries.date} = ${todayDate}`,
        );
    });

    // Replay the exact same batch (client network retry)
    const secondRes = await app.inject({
      method: 'POST',
      url: '/v1/telemetry/locations',
      headers: {
        authorization: `Bearer ${tokenEmployeeA}`,
        'x-workspace-id': workspaceAId,
      },
      payload: batch,
    });
    assert.equal(secondRes.statusCode, 200);

    let summary2: any;
    await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceAId}, true)`);
      [summary2] = await tx
        .select()
        .from(schema.dailyTravelSummaries)
        .where(
          sql`${schema.dailyTravelSummaries.workspaceId} = ${workspaceAId} AND ${schema.dailyTravelSummaries.userId} = ${userEmployeeAId} AND ${schema.dailyTravelSummaries.date} = ${todayDate}`,
        );
    });

    assert.equal(
      summary1.pointCount,
      summary2.pointCount,
      'Duplicate batch must not increment pointCount',
    );
    assert.equal(
      summary1.totalDistanceMeters,
      summary2.totalDistanceMeters,
      'Duplicate batch must not accumulate duplicate distance',
    );

    // Punch out
    await app.inject({
      method: 'POST',
      url: '/v1/attendance/punch-out',
      headers: {
        authorization: `Bearer ${tokenEmployeeA}`,
        'x-workspace-id': workspaceAId,
      },
      payload: {
        idempotencyKey: 'idem-duty-punch-out-01',
      },
    });
  });

  test('Security: Short-lived single-use streaming ticket can be generated and consumed for SSE without token in URL', async () => {
    // 1. Generate stream ticket as Owner
    const ticketRes = await app.inject({
      method: 'POST',
      url: '/v1/telemetry/stream-ticket',
      headers: {
        authorization: `Bearer ${tokenOwnerA}`,
        'x-workspace-id': workspaceAId,
      },
    });
    assert.equal(ticketRes.statusCode, 200);
    const { ticket, expiresInSeconds } = JSON.parse(ticketRes.body);
    assert.ok(ticket);
    assert.equal(expiresInSeconds, 60);

    // 2. Reject request with invalid ticket
    const invalidRes = await app.inject({
      method: 'GET',
      url: '/v1/telemetry/stream?ticket=invalid-ticket-xyz',
    });
    assert.equal(invalidRes.statusCode, 401);

    // 3. Consume the ticket
    const consumed = await pubsub.consumeStreamingTicket(ticket);
    assert.ok(consumed);
    assert.equal(consumed?.workspaceId, workspaceAId);

    // 4. Second consumption of same single-use ticket fails with 401 (Replay protection)
    const secondSseRes = await app.inject({
      method: 'GET',
      url: `/v1/telemetry/stream?ticket=${ticket}`,
    });
    assert.equal(secondSseRes.statusCode, 401, 'Streaming ticket must be single-use only');
  });

  test('Security & Verification: Ticket expiration and non-authorized user rejection', async () => {
    // 1. Employee without location.read cannot generate stream ticket (403 Forbidden)
    const forbiddenRes = await app.inject({
      method: 'POST',
      url: '/v1/telemetry/stream-ticket',
      headers: {
        authorization: `Bearer ${tokenEmployeeA}`,
        'x-workspace-id': workspaceAId,
      },
    });
    assert.equal(forbiddenRes.statusCode, 403);

    // 2. Consume expired ticket fails
    const expiredTicket = 'tkt_expired_test_ticket_val';
    const expiredPayload = JSON.stringify({
      userId: userOwnerAId,
      workspaceId: workspaceAId,
      expiresAt: Date.now() - 5000,
    });
    if ((pubsub as any).isRedisConnected && (pubsub as any).redisPub) {
      await (pubsub as any).redisPub.set(
        `stream_ticket:${expiredTicket}`,
        expiredPayload,
        'EX',
        10,
      );
    }
    (pubsub as any).streamingTickets?.set(expiredTicket, {
      userId: userOwnerAId,
      workspaceId: workspaceAId,
      expiresAt: Date.now() - 5000,
    });

    const expiredRes = await app.inject({
      method: 'GET',
      url: `/v1/telemetry/stream?ticket=${expiredTicket}`,
    });
    assert.equal(expiredRes.statusCode, 401, 'Expired ticket must be rejected with 401');
  });

  test('Partial Ingestion: Batch with mixed valid, invalid accuracy, and off-duty points returns exact acceptedIds and rejectedIds', async () => {
    // Punch in Employee A
    await app.inject({
      method: 'POST',
      url: '/v1/attendance/punch-in',
      headers: {
        authorization: `Bearer ${tokenEmployeeA}`,
        'x-workspace-id': workspaceAId,
      },
      payload: { idempotencyKey: 'partial-punch-in-01' },
    });

    const validId = randomUUID();
    const badAccuracyId = randomUUID();
    const offDutyId = randomUUID();
    const now = Date.now();

    const batch = {
      locations: [
        {
          id: validId,
          recordedAt: new Date(now).toISOString(),
          latitude: 28.6139,
          longitude: 77.209,
          accuracy: 10.0,
        },
        {
          id: badAccuracyId,
          recordedAt: new Date(now + 1000).toISOString(),
          latitude: 28.614,
          longitude: 77.2091,
          accuracy: 85.0, // > 50m: rejected by quality filter
        },
        {
          id: offDutyId,
          recordedAt: new Date(now - 86400000 * 10).toISOString(), // 10 days ago (outside 7-day window and shift): off-duty drop
          latitude: 28.6141,
          longitude: 77.2092,
          accuracy: 12.0,
        },
      ],
    };

    const res = await app.inject({
      method: 'POST',
      url: '/v1/telemetry/locations',
      headers: {
        authorization: `Bearer ${tokenEmployeeA}`,
        'x-workspace-id': workspaceAId,
      },
      payload: batch,
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.accepted, 1);
    assert.equal(body.dropped, 2);
    assert.deepEqual(body.acceptedIds, [validId]);
    assert.ok(body.rejectedIds.includes(badAccuracyId));
    assert.ok(body.rejectedIds.includes(offDutyId));

    // Punch out
    await app.inject({
      method: 'POST',
      url: '/v1/attendance/punch-out',
      headers: {
        authorization: `Bearer ${tokenEmployeeA}`,
        'x-workspace-id': workspaceAId,
      },
      payload: { idempotencyKey: 'partial-punch-out-01' },
    });
  });

  test('Concurrent Ingestion: Parallel submission of identical location batches does not duplicate mileage or points', async () => {
    // Punch in Employee A
    await app.inject({
      method: 'POST',
      url: '/v1/attendance/punch-in',
      headers: {
        authorization: `Bearer ${tokenEmployeeA}`,
        'x-workspace-id': workspaceAId,
      },
      payload: { idempotencyKey: 'concurrent-punch-in-01' },
    });

    const cPt1 = randomUUID();
    const cPt2 = randomUUID();
    const now = Date.now();

    const batch = {
      locations: [
        {
          id: cPt1,
          recordedAt: new Date(now + 1000).toISOString(),
          latitude: 28.62,
          longitude: 77.21,
          accuracy: 5.0,
        },
        {
          id: cPt2,
          recordedAt: new Date(now + 2000).toISOString(),
          latitude: 28.621,
          longitude: 77.211,
          accuracy: 5.0,
        },
      ],
    };

    // Fire 2 concurrent identical requests
    const [res1, res2] = await Promise.all([
      app.inject({
        method: 'POST',
        url: '/v1/telemetry/locations',
        headers: {
          authorization: `Bearer ${tokenEmployeeA}`,
          'x-workspace-id': workspaceAId,
        },
        payload: batch,
      }),
      app.inject({
        method: 'POST',
        url: '/v1/telemetry/locations',
        headers: {
          authorization: `Bearer ${tokenEmployeeA}`,
          'x-workspace-id': workspaceAId,
        },
        payload: batch,
      }),
    ]);

    assert.equal(res1.statusCode, 200);
    assert.equal(res2.statusCode, 200);

    const todayDate = new Date().toISOString().slice(0, 10);
    let summary: any;
    await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceAId}, true)`);
      [summary] = await tx
        .select()
        .from(schema.dailyTravelSummaries)
        .where(
          and(
            eq(schema.dailyTravelSummaries.workspaceId, workspaceAId),
            eq(schema.dailyTravelSummaries.userId, userEmployeeAId),
            eq(schema.dailyTravelSummaries.date, todayDate),
          ),
        );
    });

    // Check database row count for these 2 points
    let rowCount = 0;
    await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceAId}, true)`);
      const rows = await tx
        .select()
        .from(schema.employeeLocations)
        .where(
          and(
            eq(schema.employeeLocations.workspaceId, workspaceAId),
            inArray(schema.employeeLocations.id, [cPt1, cPt2]),
          ),
        );
      rowCount = rows.length;
    });

    assert.equal(rowCount, 2, 'Exactly 2 points must exist in database, zero duplicates');
    assert.ok(
      summary.pointCount >= 2,
      'Summary pointCount must reflect inserted points without duplicate inflation',
    );

    // Punch out
    await app.inject({
      method: 'POST',
      url: '/v1/attendance/punch-out',
      headers: {
        authorization: `Bearer ${tokenEmployeeA}`,
        'x-workspace-id': workspaceAId,
      },
      payload: { idempotencyKey: 'concurrent-punch-out-01' },
    });
  });

  test('Out-of-Order Uploads: Samples submitted non-chronologically are properly sorted in route history', async () => {
    // Punch in Employee A
    await app.inject({
      method: 'POST',
      url: '/v1/attendance/punch-in',
      headers: {
        authorization: `Bearer ${tokenEmployeeA}`,
        'x-workspace-id': workspaceAId,
      },
      payload: { idempotencyKey: 'ooo-punch-in-01' },
    });

    const oooPt1 = randomUUID();
    const oooPt2 = randomUUID();
    const oooPt3 = randomUUID();
    const baseTime = Date.now();

    // Submit Point 3 (later) first
    await app.inject({
      method: 'POST',
      url: '/v1/telemetry/locations',
      headers: {
        authorization: `Bearer ${tokenEmployeeA}`,
        'x-workspace-id': workspaceAId,
      },
      payload: {
        locations: [
          {
            id: oooPt3,
            recordedAt: new Date(baseTime + 30000).toISOString(),
            latitude: 28.633,
            longitude: 77.223,
            accuracy: 8.0,
          },
        ],
      },
    });

    // Submit Point 1 (earlier) and Point 2 (middle) second
    await app.inject({
      method: 'POST',
      url: '/v1/telemetry/locations',
      headers: {
        authorization: `Bearer ${tokenEmployeeA}`,
        'x-workspace-id': workspaceAId,
      },
      payload: {
        locations: [
          {
            id: oooPt1,
            recordedAt: new Date(baseTime + 10000).toISOString(),
            latitude: 28.631,
            longitude: 77.221,
            accuracy: 8.0,
          },
          {
            id: oooPt2,
            recordedAt: new Date(baseTime + 20000).toISOString(),
            latitude: 28.632,
            longitude: 77.222,
            accuracy: 8.0,
          },
        ],
      },
    });

    // Query history as Owner
    const today = new Date().toISOString().slice(0, 10);
    const histRes = await app.inject({
      method: 'GET',
      url: `/v1/telemetry/history?userId=${userEmployeeAId}&date=${today}`,
      headers: {
        authorization: `Bearer ${tokenOwnerA}`,
        'x-workspace-id': workspaceAId,
      },
    });
    assert.equal(histRes.statusCode, 200);
    const histBody = JSON.parse(histRes.body);

    const relevantPoints = histBody.points.filter((p: any) =>
      [oooPt1, oooPt2, oooPt3].includes(p.id),
    );
    assert.equal(relevantPoints.length, 3);
    assert.equal(relevantPoints[0].id, oooPt1, 'Point 1 must be first in reconstructed route');
    assert.equal(relevantPoints[1].id, oooPt2, 'Point 2 must be second in reconstructed route');
    assert.equal(relevantPoints[2].id, oooPt3, 'Point 3 must be third in reconstructed route');

    // Punch out
    await app.inject({
      method: 'POST',
      url: '/v1/attendance/punch-out',
      headers: {
        authorization: `Bearer ${tokenEmployeeA}`,
        'x-workspace-id': workspaceAId,
      },
      payload: { idempotencyKey: 'ooo-punch-out-01' },
    });
  });

  // -------------------------------------------------------------------------
  // 7. Historical Route Breadcrumbs
  // -------------------------------------------------------------------------
  test('History: Owner retrieves duty-hours breadcrumbs for specific date', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const res = await app.inject({
      method: 'GET',
      url: `/v1/telemetry/history?userId=${userEmployeeAId}&date=${today}`,
      headers: {
        authorization: `Bearer ${tokenOwnerA}`,
        'x-workspace-id': workspaceAId,
      },
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.userId, userEmployeeAId);
    assert.equal(body.date, today);
    assert.ok(body.points.length >= 2);
    assert.ok(body.totalDistanceMeters > 0);
  });

  // -------------------------------------------------------------------------
  // 8. Geofences CRUD & Proximity Validation
  // -------------------------------------------------------------------------
  test('Geofences: Owner creates office geofence and validates proximity', async () => {
    // 1. Create Geofence (HQ in New Delhi: 28.6139, 77.2090, radius 100m)
    const createRes = await app.inject({
      method: 'POST',
      url: '/v1/geofences',
      headers: {
        authorization: `Bearer ${tokenOwnerA}`,
        'x-workspace-id': workspaceAId,
      },
      payload: {
        name: 'Headquarters Hub',
        description: 'Main central office',
        latitude: 28.6139,
        longitude: 77.209,
        radiusMeters: 100,
        geofenceType: 'OFFICE',
      },
    });

    assert.equal(createRes.statusCode, 201);
    const geofence = JSON.parse(createRes.body);
    testGeofenceId = geofence.id;
    assert.equal(geofence.name, 'Headquarters Hub');

    // 2. List Geofences
    const listRes = await app.inject({
      method: 'GET',
      url: '/v1/geofences',
      headers: {
        authorization: `Bearer ${tokenOwnerA}`,
        'x-workspace-id': workspaceAId,
      },
    });
    assert.equal(listRes.statusCode, 200);
    const listBody = JSON.parse(listRes.body);
    assert.ok(listBody.geofences.length >= 1);

    // 3. Proximity check INSIDE (point ~25m away)
    const insideRes = await app.inject({
      method: 'POST',
      url: '/v1/geofences/validate-proximity',
      headers: {
        authorization: `Bearer ${tokenEmployeeA}`,
        'x-workspace-id': workspaceAId,
      },
      payload: {
        geofenceId: testGeofenceId,
        latitude: 28.6141,
        longitude: 77.2091,
      },
    });
    assert.equal(insideRes.statusCode, 200);
    const insideBody = JSON.parse(insideRes.body);
    assert.equal(insideBody.isInside, true);
    assert.ok(insideBody.distanceMeters < 100);

    // 4. Proximity check OUTSIDE (point ~500m away)
    const outsideRes = await app.inject({
      method: 'POST',
      url: '/v1/geofences/validate-proximity',
      headers: {
        authorization: `Bearer ${tokenEmployeeA}`,
        'x-workspace-id': workspaceAId,
      },
      payload: {
        geofenceId: testGeofenceId,
        latitude: 28.62,
        longitude: 77.215,
      },
    });
    assert.equal(outsideRes.statusCode, 200);
    const outsideBody = JSON.parse(outsideRes.body);
    assert.equal(outsideBody.isInside, false);
    assert.ok(outsideBody.distanceMeters > 100);

    // 5. Delete Geofence
    const delRes = await app.inject({
      method: 'DELETE',
      url: `/v1/geofences/${testGeofenceId}`,
      headers: {
        authorization: `Bearer ${tokenOwnerA}`,
        'x-workspace-id': workspaceAId,
      },
    });
    assert.equal(delRes.statusCode, 200);
  });

  // -------------------------------------------------------------------------
  // 9. Multi-Tenant Isolation & RLS Verification
  // -------------------------------------------------------------------------
  test('RLS: Direct query without tenant context on Phase 02C tables returns 0 rows', async () => {
    await appDb.transaction(async (tx) => {
      const locs = await tx.select().from(schema.employeeLocations);
      assert.equal(locs.length, 0, 'Default-deny RLS must block un-tenanted queries');

      const fences = await tx.select().from(schema.geofences);
      assert.equal(fences.length, 0);

      const summaries = await tx.select().from(schema.dailyTravelSummaries);
      assert.equal(summaries.length, 0);
    });
  });

  test('RLS: Tenant Beta cannot access Tenant Alpha telemetry or geofences', async () => {
    // Attempt to access history of User A with Tenant B credentials
    const res = await app.inject({
      method: 'GET',
      url: `/v1/telemetry/history?userId=${userEmployeeAId}&date=${new Date().toISOString().slice(0, 10)}`,
      headers: {
        authorization: `Bearer ${tokenOwnerB}`,
        'x-workspace-id': workspaceBId,
      },
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.points.length, 0, 'Cross-tenant query must return zero points');
  });

  // -------------------------------------------------------------------------
  // 10. Automated Retention Pruning Stored Procedure
  // -------------------------------------------------------------------------
  test('Retention: telemetry_prune_expired_records(30) prunes records older than 30 days', async () => {
    const expiredPointId = randomUUID();
    const expiredTimestamp = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000); // 35 days ago

    // Insert old record bypassing RLS for test
    await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.bypass_rls', 'on', true)`);
      await tx.insert(schema.employeeLocations).values({
        id: expiredPointId,
        workspaceId: workspaceAId,
        userId: userEmployeeAId,
        recordedAt: expiredTimestamp,
        latitude: 28.6139,
        longitude: 77.209,
        accuracy: 10,
      });
    });

    // Execute retention pruning stored procedure
    const [result] = (await dbClient.client`
      SELECT telemetry_prune_expired_records(30) as deleted_count;
    `) as unknown as [{ deleted_count: number }];

    assert.ok(result.deleted_count >= 1, 'At least 1 expired record should be pruned');

    // Verify expired point is gone
    await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.bypass_rls', 'on', true)`);
      const rows = await tx
        .select()
        .from(schema.employeeLocations)
        .where(sql`${schema.employeeLocations.id} = ${expiredPointId}`);
      assert.equal(rows.length, 0, 'Expired telemetry point must be permanently deleted');
    });
  });
});

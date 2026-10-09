import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildServer } from './server.js';
import {
  SyncBatchRequestSchema,
  SyncBatchResponseSchema,
  ReorderVisitsRequestSchema,
  CreateRecurringTaskTemplateRequestSchema,
  AssignShiftRosterRequestSchema,
  AttendanceReportResponseSchema,
  TaskSlaReportResponseSchema,
  VisitReportResponseSchema,
  NotificationSchema,
} from '@oprino/contracts';

describe('Phase 04: Contract & Route Boundary Verification', () => {
  const { app } = buildServer({ env: { NODE_ENV: 'test' }, logger: false });

  after(async () => {
    await app.close();
  });

  test('OpenAPI specification includes all Phase 04 endpoints and schemas', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/openapi.json',
    });

    assert.strictEqual(res.statusCode, 200);
    const spec = JSON.parse(res.body);

    // Verify Phase 04 Routes are exposed
    assert.ok(spec.paths['/v1/sync/mutations'], 'Expected /v1/sync/mutations');
    assert.ok(spec.paths['/v1/visits/sequence'], 'Expected /v1/visits/sequence');
    assert.ok(spec.paths['/v1/tasks/templates'], 'Expected /v1/tasks/templates');
    assert.ok(spec.paths['/v1/attendance/rosters'], 'Expected /v1/attendance/rosters');
    assert.ok(spec.paths['/v1/reports/attendance'], 'Expected /v1/reports/attendance');
    assert.ok(spec.paths['/v1/reports/tasks'], 'Expected /v1/reports/tasks');
    assert.ok(spec.paths['/v1/reports/visits'], 'Expected /v1/reports/visits');
    assert.ok(spec.paths['/v1/reports/export/csv'], 'Expected /v1/reports/export/csv');
    assert.ok(spec.paths['/v1/notifications'], 'Expected /v1/notifications');
    assert.ok(spec.paths['/v1/notifications/{id}/read'], 'Expected /v1/notifications/{id}/read');
    assert.ok(spec.paths['/v1/notifications/read-all'], 'Expected /v1/notifications/read-all');
  });

  test('SyncBatchRequestSchema validates mutation batch contracts correctly', () => {
    const validBatch = {
      mutations: [
        {
          mutationId: '550e8400-e29b-41d4-a716-446655440000',
          entityType: 'ATTENDANCE',
          entityId: '550e8400-e29b-41d4-a716-446655440001',
          mutationType: 'PUNCH_IN',
          payload: { shiftId: 'morning-shift' },
          idempotencyKey: 'mut-punch-in-uuid-1',
          clientTimestamp: new Date().toISOString(),
        },
        {
          mutationId: '550e8400-e29b-41d4-a716-446655440002',
          entityType: 'TASK',
          entityId: '550e8400-e29b-41d4-a716-446655440003',
          mutationType: 'TRANSITION',
          payload: { status: 'IN_PROGRESS', version: 1 },
          idempotencyKey: 'mut-task-trans-uuid-2',
          clientTimestamp: new Date().toISOString(),
        },
      ],
    };

    const parsed = SyncBatchRequestSchema.safeParse(validBatch);
    assert.strictEqual(parsed.success, true);
    if (parsed.success) {
      assert.strictEqual(parsed.data.mutations.length, 2);
    }
  });

  test('SyncBatchResponseSchema validates conflict response contract', () => {
    const validResponse = {
      processedCount: 2,
      appliedCount: 1,
      conflictCount: 1,
      results: [
        {
          mutationId: '550e8400-e29b-41d4-a716-446655440000',
          entityId: '550e8400-e29b-41d4-a716-446655440001',
          status: 'APPLIED',
        },
        {
          mutationId: '550e8400-e29b-41d4-a716-446655440002',
          entityId: '550e8400-e29b-41d4-a716-446655440003',
          status: 'REJECTED_STALE',
          resolutionNote: 'MANAGER_CANCELLATION_PRECEDENCE',
        },
      ],
    };

    const parsed = SyncBatchResponseSchema.safeParse(validResponse);
    assert.strictEqual(parsed.success, true);
    if (parsed.success) {
      assert.strictEqual(parsed.data.results[1]?.resolutionNote, 'MANAGER_CANCELLATION_PRECEDENCE');
      assert.strictEqual(parsed.data.results[1]?.status, 'REJECTED_STALE');
    }
  });

  test('ReorderVisitsRequestSchema validates route reorder contracts', () => {
    const validReorder = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      routeDate: '2026-10-09',
      orderedVisitIds: [
        '550e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440002',
        '550e8400-e29b-41d4-a716-446655440003',
      ],
    };

    const parsed = ReorderVisitsRequestSchema.safeParse(validReorder);
    assert.strictEqual(parsed.success, true);

    const invalidDate = { ...validReorder, routeDate: '09/10/2026' };
    const invalidParsed = ReorderVisitsRequestSchema.safeParse(invalidDate);
    assert.strictEqual(invalidParsed.success, false, 'Should reject invalid date format');
  });

  test('CreateRecurringTaskTemplateRequestSchema validates recurrence cron contracts', () => {
    const validTemplate = {
      title: 'Weekly Generator Servicing',
      recurrenceFrequency: 'WEEKLY',
      recurrenceInterval: 1,
      daysOfWeek: [1],
      timeOfDay: '08:00',
      priority: 'HIGH',
    };

    const parsed = CreateRecurringTaskTemplateRequestSchema.safeParse(validTemplate);
    assert.strictEqual(parsed.success, true);
  });

  test('AssignShiftRosterRequestSchema validates roster assignment contracts', () => {
    const validRoster = {
      shiftId: '550e8400-e29b-41d4-a716-446655440001',
      userIds: ['550e8400-e29b-41d4-a716-446655440000'],
      dates: ['2026-10-09'],
    };

    const parsed = AssignShiftRosterRequestSchema.safeParse(validRoster);
    assert.strictEqual(parsed.success, true);
  });

  test('AttendanceReportResponseSchema validates operational analytics schema', () => {
    const validReport = {
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      totalEmployees: 5,
      totalCompanyHours: 176.5,
      items: [
        {
          userId: '550e8400-e29b-41d4-a716-446655440000',
          userName: 'Jane Tech',
          userEmail: 'jane@example.com',
          presentDays: 22,
          totalMinutes: 10590,
          totalHours: 176.5,
          lateDays: 1,
          totalLateMinutes: 15,
        },
      ],
    };

    const parsed = AttendanceReportResponseSchema.safeParse(validReport);
    assert.strictEqual(parsed.success, true);
  });

  test('TaskSlaReportResponseSchema validates task resolution and overdue metrics', () => {
    const validTaskReport = {
      totalTasks: 40,
      completedTasks: 32,
      verifiedTasks: 28,
      rejectedTasks: 2,
      overdueTasks: 5,
      onTimeRate: 87.5,
      statusDistribution: {
        ASSIGNED: 4,
        IN_PROGRESS: 4,
        COMPLETED: 4,
        VERIFIED: 28,
      },
    };

    const parsed = TaskSlaReportResponseSchema.safeParse(validTaskReport);
    assert.strictEqual(parsed.success, true);
  });

  test('VisitReportResponseSchema validates visit summary audit metrics', () => {
    const validVisitReport = {
      totalVisits: 85,
      completedVisits: 80,
      plannedVisits: 5,
      totalDurationMinutes: 4250,
      averageDurationMinutes: 53.1,
    };

    const parsed = VisitReportResponseSchema.safeParse(validVisitReport);
    assert.strictEqual(parsed.success, true);
  });

  test('NotificationSchema validates operational alert models', () => {
    const validNotification = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      workspaceId: '550e8400-e29b-41d4-a716-446655440001',
      userId: '550e8400-e29b-41d4-a716-446655440002',
      type: 'TASK_OVERDUE',
      title: 'Task Overdue SLA Alert',
      body: 'HVAC Compressor Check at Downtown Site is 2 hours overdue',
      entityType: 'task',
      entityId: '550e8400-e29b-41d4-a716-446655440003',
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    const parsed = NotificationSchema.safeParse(validNotification);
    assert.strictEqual(parsed.success, true);
  });
});

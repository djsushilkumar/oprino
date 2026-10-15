import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  integer,
  doublePrecision,
  unique,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { workspaces } from './tenants.js';

/**
 * TENANT-SCOPED: Attendance Shifts Table
 * Configured shift schedules with start/end time and overnight handling.
 */
export const attendanceShifts = pgTable('attendance_shifts', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  startTime: varchar('start_time', { length: 10 }).notNull(), // e.g. "09:00" or "22:00"
  endTime: varchar('end_time', { length: 10 }).notNull(),     // e.g. "17:00" or "06:00"
  timezone: varchar('timezone', { length: 50 }).notNull().default('UTC'),
  isActive: boolean('is_active').notNull().default(true),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * TENANT-SCOPED: Attendance Sessions Table
 * Canonical duty sessions recorded per user and workspace.
 */
export const attendanceSessions = pgTable('attendance_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  shiftId: uuid('shift_id').references(() => attendanceShifts.id, { onDelete: 'set null' }),
  status: varchar('status', { length: 20 }).notNull().default('ON_DUTY'), // 'ON_DUTY' | 'OFF_DUTY'
  punchInTime: timestamp('punch_in_time', { withTimezone: true }).notNull(),
  punchOutTime: timestamp('punch_out_time', { withTimezone: true }),
  durationMinutes: integer('duration_minutes'),
  punchInIdempotencyKey: varchar('punch_in_idempotency_key', { length: 255 }),
  punchOutIdempotencyKey: varchar('punch_out_idempotency_key', { length: 255 }),
  selfieMediaKey: text('selfie_media_key'),
  punchInLatitude: doublePrecision('punch_in_latitude'),
  punchInLongitude: doublePrecision('punch_in_longitude'),
  punchInAccuracy: doublePrecision('punch_in_accuracy'),
  isLate: boolean('is_late').notNull().default(false),
  lateMinutes: integer('late_minutes').notNull().default(0),
  isManualAdjustment: boolean('is_manual_adjustment').notNull().default(false),
  adjustmentNote: text('adjustment_note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * TENANT-SCOPED: Attendance Events Table
 * Granular event log for duty transitions and adjustments.
 */
export const attendanceEvents = pgTable('attendance_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => attendanceSessions.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  eventType: varchar('event_type', { length: 50 }).notNull(), // 'PUNCH_IN' | 'PUNCH_OUT' | 'MANUAL_ADJUSTMENT'
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
  idempotencyKey: varchar('idempotency_key', { length: 255 }),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * TENANT-SCOPED: Shift Rosters Table
 * Explicit daily duty assignments mapping employees to shifts.
 */
export const shiftRosters = pgTable(
  'shift_rosters',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    shiftId: uuid('shift_id')
      .notNull()
      .references(() => attendanceShifts.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    scheduledDate: varchar('scheduled_date', { length: 10 }).notNull(), // YYYY-MM-DD
    status: varchar('status', { length: 20 }).notNull().default('SCHEDULED'), // 'SCHEDULED' | 'ATTENDED' | 'MISSED' | 'EXCUSED'
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('shift_rosters_workspace_user_date_idx').on(
      table.workspaceId,
      table.userId,
      table.scheduledDate,
    ),
    index('shift_rosters_workspace_date_idx').on(table.workspaceId, table.scheduledDate),
  ],
);

export type AttendanceShift = typeof attendanceShifts.$inferSelect;
export type NewAttendanceShift = typeof attendanceShifts.$inferInsert;
export type AttendanceSession = typeof attendanceSessions.$inferSelect;
export type NewAttendanceSession = typeof attendanceSessions.$inferInsert;
export type AttendanceEvent = typeof attendanceEvents.$inferSelect;
export type NewAttendanceEvent = typeof attendanceEvents.$inferInsert;
export type ShiftRoster = typeof shiftRosters.$inferSelect;
export type NewShiftRoster = typeof shiftRosters.$inferInsert;

import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  doublePrecision,
  real,
  integer,
  unique,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { workspaces } from './tenants.js';
import { attendanceSessions } from './attendance.js';

/**
 * TENANT-SCOPED: Employee Locations Telemetry Table
 * High-frequency GPS coordinates and device hardware telemetry recorded strictly during duty hours.
 */
export const employeeLocations = pgTable(
  'employee_locations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    sessionId: uuid('session_id').references(() => attendanceSessions.id, {
      onDelete: 'set null',
    }),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull(),
    latitude: doublePrecision('latitude').notNull(),
    longitude: doublePrecision('longitude').notNull(),
    accuracy: real('accuracy').notNull(),
    speed: real('speed'),
    heading: real('heading'),
    altitude: real('altitude'),
    batteryLevel: real('battery_level'),
    isCharging: boolean('is_charging'),
    activityType: varchar('activity_type', { length: 50 }).default('still'), // 'still' | 'walking' | 'on_foot' | 'in_vehicle'
    isMoving: boolean('is_moving').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('employee_locations_workspace_user_time_idx').on(
      table.workspaceId,
      table.userId,
      table.recordedAt,
    ),
    index('employee_locations_workspace_time_idx').on(table.workspaceId, table.recordedAt),
  ],
);

/**
 * TENANT-SCOPED: Geofences Table
 * Configurable geographic boundaries (circular) for offices, client sites, and checkpoints.
 */
export const geofences = pgTable(
  'geofences',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    latitude: doublePrecision('latitude').notNull(),
    longitude: doublePrecision('longitude').notNull(),
    radiusMeters: real('radius_meters').notNull().default(100),
    geofenceType: varchar('geofence_type', { length: 50 }).notNull().default('OFFICE'), // 'OFFICE' | 'CUSTOMER_SITE' | 'CHECKPOINT'
    isActive: boolean('is_active').notNull().default(true),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('geofences_workspace_active_idx').on(table.workspaceId, table.isActive),
  ],
);

/**
 * TENANT-SCOPED: Daily Travel Summaries Table
 * Bounded 3-year aggregated conveyance & mileage totals for on-duty travel.
 */
export const dailyTravelSummaries = pgTable(
  'daily_travel_summaries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    date: varchar('date', { length: 10 }).notNull(), // 'YYYY-MM-DD'
    totalDistanceMeters: real('total_distance_meters').notNull().default(0),
    totalDurationMinutes: integer('total_duration_minutes').notNull().default(0),
    pointCount: integer('point_count').notNull().default(0),
    firstPointAt: timestamp('first_point_at', { withTimezone: true }),
    lastPointAt: timestamp('last_point_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('daily_travel_summaries_user_date_idx').on(
      table.workspaceId,
      table.userId,
      table.date,
    ),
  ],
);

export type EmployeeLocation = typeof employeeLocations.$inferSelect;
export type NewEmployeeLocation = typeof employeeLocations.$inferInsert;
export type Geofence = typeof geofences.$inferSelect;
export type NewGeofence = typeof geofences.$inferInsert;
export type DailyTravelSummary = typeof dailyTravelSummaries.$inferSelect;
export type NewDailyTravelSummary = typeof dailyTravelSummaries.$inferInsert;

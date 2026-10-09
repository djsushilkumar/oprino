import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  doublePrecision,
  integer,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { workspaces } from './tenants.js';
import { tasks } from './tasks.js';
import { customers, customerSites } from './customers.js';

/**
 * TENANT-SCOPED: Physical Site Visits Table
 * Represents physical stops made by workers to client facilities.
 * Invariant: Tasks and Visits are decoupled; a task can link 0, 1, or multiple visits.
 */
export const visits = pgTable(
  'visits',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    siteId: uuid('site_id').references(() => customerSites.id, { onDelete: 'set null' }),
    taskId: uuid('task_id').references(() => tasks.id, { onDelete: 'set null' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: varchar('status', { length: 50 }).notNull().default('PLANNED'), // 'PLANNED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED'
    plannedAt: timestamp('planned_at', { withTimezone: true }),
    checkInTime: timestamp('check_in_time', { withTimezone: true }),
    checkOutTime: timestamp('check_out_time', { withTimezone: true }),
    checkInLatitude: doublePrecision('check_in_latitude'),
    checkInLongitude: doublePrecision('check_in_longitude'),
    checkOutLatitude: doublePrecision('check_out_latitude'),
    checkOutLongitude: doublePrecision('check_out_longitude'),
    durationMinutes: integer('duration_minutes').default(0),
    sequenceOrder: integer('sequence_order'),
    routeDate: varchar('route_date', { length: 10 }), // YYYY-MM-DD
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('visits_workspace_user_idx').on(table.workspaceId, table.userId),
    index('visits_workspace_customer_idx').on(table.workspaceId, table.customerId),
    index('visits_workspace_task_idx').on(table.workspaceId, table.taskId),
    index('visits_workspace_status_idx').on(table.workspaceId, table.status),
    index('visits_workspace_user_route_idx').on(
      table.workspaceId,
      table.userId,
      table.routeDate,
      table.sequenceOrder,
    ),
  ],
);

/**
 * TENANT-SCOPED: Task Proofs & Media Attachments Table
 * Stores proof-of-work items (geotagged watermarked photos, on-glass customer signatures, documents).
 * Conforms to ADR-012 Pre-Signed S3 Object Storage architecture.
 */
export const taskProofs = pgTable(
  'task_proofs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    taskId: uuid('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    visitId: uuid('visit_id').references(() => visits.id, { onDelete: 'set null' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    proofType: varchar('proof_type', { length: 50 }).notNull(), // 'PHOTO' | 'SIGNATURE' | 'DOCUMENT'
    fileKey: text('file_key').notNull(),
    fileUrl: text('file_url'),
    fileSizeBytes: integer('file_size_bytes'),
    mimeType: varchar('mime_type', { length: 100 }),
    signerName: varchar('signer_name', { length: 255 }),
    signerPhone: varchar('signer_phone', { length: 50 }),
    watermarkMetadata: jsonb('watermark_metadata').default({}),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('task_proofs_workspace_task_idx').on(table.workspaceId, table.taskId),
    index('task_proofs_workspace_type_idx').on(table.workspaceId, table.proofType),
  ],
);

export type Visit = typeof visits.$inferSelect;
export type NewVisit = typeof visits.$inferInsert;
export type TaskProof = typeof taskProofs.$inferSelect;
export type NewTaskProof = typeof taskProofs.$inferInsert;

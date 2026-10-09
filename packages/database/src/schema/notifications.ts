import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { workspaces } from './tenants.js';

/**
 * TENANT-SCOPED: In-App Notifications Table
 * Stores operational notifications and exceptions for users.
 */
export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 50 }).notNull(), // 'TASK_ASSIGNED' | 'TASK_OVERDUE' | 'PROOF_REJECTED' | 'MISSED_SHIFT' | 'SYSTEM'
    title: varchar('title', { length: 255 }).notNull(),
    body: text('body').notNull(),
    entityType: varchar('entity_type', { length: 50 }),
    entityId: varchar('entity_id', { length: 255 }),
    isRead: boolean('is_read').notNull().default(false),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('notifications_workspace_user_read_idx').on(
      table.workspaceId,
      table.userId,
      table.isRead,
      table.createdAt,
    ),
  ],
);

/**
 * TENANT-SCOPED: Sync Mutation Audit & Deduplication Records Table
 * Records batch sync mutations processed from mobile clients.
 */
export const syncMutationRecords = pgTable(
  'sync_mutation_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    mutationId: uuid('mutation_id').notNull(),
    entityType: varchar('entity_type', { length: 50 }).notNull(),
    entityId: varchar('entity_id', { length: 255 }).notNull(),
    mutationType: varchar('mutation_type', { length: 50 }).notNull(),
    status: varchar('status', { length: 50 }).notNull(), // 'APPLIED' | 'CONFLICT_RESOLVED' | 'REJECTED_STALE' | 'DUPLICATE_ACK'
    resolutionNote: text('resolution_note'),
    clientTimestamp: timestamp('client_timestamp', { withTimezone: true }).notNull(),
    replayedAt: timestamp('replayed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('sync_mutations_workspace_mutation_idx').on(table.workspaceId, table.mutationId),
    index('sync_mutations_workspace_entity_idx').on(
      table.workspaceId,
      table.entityType,
      table.entityId,
    ),
  ],
);

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type SyncMutationRecord = typeof syncMutationRecords.$inferSelect;
export type NewSyncMutationRecord = typeof syncMutationRecords.$inferInsert;

import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  integer,
  unique,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { workspaces } from './tenants.js';
import { customers, customerSites } from './customers.js';

/**
 * TENANT-SCOPED: Tasks Table
 * Represents an operational unit of work with lifecycle progression.
 */
export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 50 }).notNull().default('ASSIGNED'),
  priority: varchar('priority', { length: 20 }).notNull().default('MEDIUM'),
  dueAt: timestamp('due_at', { withTimezone: true }),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  siteId: uuid('site_id').references(() => customerSites.id, { onDelete: 'set null' }),
  requiresSignature: boolean('requires_signature').notNull().default(false),
  requiresPhotoProof: boolean('requires_photo_proof').notNull().default(false),
  verifiedBy: uuid('verified_by').references(() => users.id, { onDelete: 'set null' }),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  verificationNotes: text('verification_notes'),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * TENANT-SCOPED: Task Assignees Table
 * Supports assignment to one or multiple employees within the workspace.
 */
export const taskAssignees = pgTable(
  'task_assignees',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    taskId: uuid('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    assignedBy: uuid('assigned_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('task_assignees_task_user_idx').on(table.taskId, table.userId)],
);

/**
 * TENANT-SCOPED: Task Checklist Items Table
 * Lightweight sub-task items actionable by assigned workers.
 */
export const taskChecklistItems = pgTable('task_checklist_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  taskId: uuid('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  isCompleted: boolean('is_completed').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  completedBy: uuid('completed_by').references(() => users.id, { onDelete: 'set null' }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * TENANT-SCOPED: Task Comments Table
 * Contextual operational collaboration notes.
 */
export const taskComments = pgTable('task_comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  taskId: uuid('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  authorId: uuid('author_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * TENANT-SCOPED: Task Activity Table
 * Immutable operational timeline of task transitions and updates.
 */
export const taskActivity = pgTable('task_activity', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  taskId: uuid('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  actorId: uuid('actor_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  action: varchar('action', { length: 50 }).notNull(),
  fromStatus: varchar('from_status', { length: 50 }),
  toStatus: varchar('to_status', { length: 50 }),
  details: jsonb('details').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * TENANT-SCOPED: Recurring Task Templates Table
 * Generates tasks according to daily, weekly, or monthly schedules.
 */
export const recurringTaskTemplates = pgTable(
  'recurring_task_templates',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    priority: varchar('priority', { length: 20 }).notNull().default('MEDIUM'),
    customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
    siteId: uuid('site_id').references(() => customerSites.id, { onDelete: 'set null' }),
    requiresSignature: boolean('requires_signature').notNull().default(false),
    requiresPhotoProof: boolean('requires_photo_proof').notNull().default(false),
    checklistTemplate: jsonb('checklist_template').default([]),
    assigneeIds: jsonb('assignee_ids').default([]),
    recurrenceFrequency: varchar('recurrence_frequency', { length: 20 }).notNull(), // 'DAILY' | 'WEEKLY' | 'MONTHLY'
    recurrenceInterval: integer('recurrence_interval').notNull().default(1),
    daysOfWeek: jsonb('days_of_week').default([]), // [0..6]
    dayOfMonth: integer('day_of_month'),
    timeOfDay: varchar('time_of_day', { length: 10 }).notNull().default('09:00'),
    timezone: varchar('timezone', { length: 50 }).notNull().default('UTC'),
    isActive: boolean('is_active').notNull().default(true),
    nextRunAt: timestamp('next_run_at', { withTimezone: true }).notNull(),
    lastRunAt: timestamp('last_run_at', { withTimezone: true }),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('recurring_tasks_workspace_active_idx').on(
      table.workspaceId,
      table.isActive,
      table.nextRunAt,
    ),
  ],
);

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type TaskAssignee = typeof taskAssignees.$inferSelect;
export type NewTaskAssignee = typeof taskAssignees.$inferInsert;
export type TaskChecklistItem = typeof taskChecklistItems.$inferSelect;
export type NewTaskChecklistItem = typeof taskChecklistItems.$inferInsert;
export type TaskComment = typeof taskComments.$inferSelect;
export type NewTaskComment = typeof taskComments.$inferInsert;
export type TaskActivity = typeof taskActivity.$inferSelect;
export type NewTaskActivity = typeof taskActivity.$inferInsert;
export type RecurringTaskTemplate = typeof recurringTaskTemplates.$inferSelect;
export type NewRecurringTaskTemplate = typeof recurringTaskTemplates.$inferInsert;

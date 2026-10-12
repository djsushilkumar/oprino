import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
  unique,
} from 'drizzle-orm/pg-core';
import { users } from './users.js';

/**
 * GLOBAL / TENANT ROOT: Workspaces Table
 * Represents an isolated business tenant organization.
 */
export const workspaces = pgTable('workspaces', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  status: varchar('status', { length: 50 }).notNull().default('ACTIVE'),
  locationRetentionDays: integer('location_retention_days').notNull().default(30), // 7 | 30 | 90 | 180
  attendancePolicy: varchar('attendance_policy', { length: 50 }).notNull().default('SIMPLE'), // 'SIMPLE' | 'GPS_REQUIRED' | 'SELFIE_REQUIRED' | 'GPS_AND_SELFIE_REQUIRED' | 'GEOFENCE_REQUIRED'
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * TENANT-SCOPED: Roles Table
 * Defines default and custom roles scoped to a specific workspace.
 */
export const roles = pgTable('roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  description: varchar('description', { length: 255 }),
  isSystemDefault: boolean('is_system_default').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * TENANT-SCOPED: Role Permissions Table
 * Maps individual granular permission codes to roles within a workspace.
 */
export const rolePermissions = pgTable('role_permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  roleId: uuid('role_id')
    .notNull()
    .references(() => roles.id, { onDelete: 'cascade' }),
  permission: varchar('permission', { length: 100 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * TENANT-SCOPED: Workspace Memberships Table
 * Associates a human user with a specific workspace, assigned role, and lifecycle status.
 */
export const workspaceMemberships = pgTable(
  'workspace_memberships',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'restrict' }),
    managerId: uuid('manager_id').references(() => users.id, { onDelete: 'set null' }),
    status: varchar('status', { length: 32 }).notNull().default('active'), // 'invited' | 'active' | 'suspended' | 'removed'
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('workspace_memberships_workspace_user_idx').on(table.workspaceId, table.userId),
  ],
);

/**
 * TENANT-SCOPED: Workspace Invitations Table
 * Tracks secure, single-use, cryptographically hashed employee invitation tokens.
 */
export const workspaceInvitations = pgTable(
  'workspace_invitations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    email: varchar('email', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    invitedBy: uuid('invited_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(), // SHA-256 hex
    status: varchar('status', { length: 32 }).notNull().default('PENDING'), // 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED'
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('workspace_invitations_token_hash_idx').on(table.tokenHash),
  ],
);

/**
 * TENANT-SCOPED / USER DEVICE: User Devices & Installation Governance
 * Tracks Oprino Installation IDs and hardware governance across mobile devices.
 */
export const userDevices = pgTable(
  'user_devices',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }),
    installationId: uuid('installation_id').notNull(),
    platform: varchar('platform', { length: 16 }).notNull(), // 'android' | 'ios' | 'web'
    deviceModel: varchar('device_model', { length: 128 }),
    osVersion: varchar('os_version', { length: 64 }),
    appVersion: varchar('app_version', { length: 32 }),
    pushToken: text('push_token'),
    status: varchar('status', { length: 32 }).notNull().default('active'), // 'pending' | 'active' | 'revoked'
    isTrusted: boolean('is_trusted').notNull().default(true),
    lastActiveAt: timestamp('last_active_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('user_devices_user_installation_idx').on(table.userId, table.installationId)],
);

/**
 * TENANT-SCOPED: Audit Logs Table
 * Immutable append-only audit trail for operational, security, and administrative events.
 */
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 100 }).notNull(),
  targetType: varchar('target_type', { length: 50 }).notNull(),
  targetId: varchar('target_id', { length: 100 }),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;
export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type NewRolePermission = typeof rolePermissions.$inferInsert;
export type WorkspaceMembership = typeof workspaceMemberships.$inferSelect;
export type NewWorkspaceMembership = typeof workspaceMemberships.$inferInsert;
export type WorkspaceInvitation = typeof workspaceInvitations.$inferSelect;
export type NewWorkspaceInvitation = typeof workspaceInvitations.$inferInsert;
export type UserDevice = typeof userDevices.$inferSelect;
export type NewUserDevice = typeof userDevices.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;


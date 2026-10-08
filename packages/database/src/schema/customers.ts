import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  doublePrecision,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { workspaces } from './tenants.js';

/**
 * TENANT-SCOPED: Customers Table
 * Master account directory for business clients and accounts.
 */
export const customers = pgTable(
  'customers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    companyName: varchar('company_name', { length: 255 }),
    email: varchar('email', { length: 255 }),
    phone: varchar('phone', { length: 50 }),
    notes: text('notes'),
    isActive: boolean('is_active').notNull().default(true),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('customers_workspace_active_idx').on(table.workspaceId, table.isActive),
    index('customers_workspace_name_idx').on(table.workspaceId, table.name),
  ],
);

/**
 * TENANT-SCOPED: Customer Sites Table
 * Physical client work sites, depots, and facilities belonging to a customer.
 */
export const customerSites = pgTable(
  'customer_sites',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    address: text('address').notNull(),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    geofenceRadiusMeters: doublePrecision('geofence_radius_meters').notNull().default(100.0),
    contactName: varchar('contact_name', { length: 255 }),
    contactPhone: varchar('contact_phone', { length: 50 }),
    notes: text('notes'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('customer_sites_workspace_customer_idx').on(table.workspaceId, table.customerId),
    index('customer_sites_workspace_active_idx').on(table.workspaceId, table.isActive),
  ],
);

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
export type CustomerSite = typeof customerSites.$inferSelect;
export type NewCustomerSite = typeof customerSites.$inferInsert;

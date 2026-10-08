import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const CustomerSchema = z
  .object({
    id: z.string().uuid().openapi({ example: 'c1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    workspaceId: z.string().uuid().openapi({ example: 'w1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    name: z.string().openapi({ example: 'Apex Facilities Management' }),
    companyName: z.string().nullable().optional().openapi({ example: 'Apex Group Corp' }),
    email: z.string().email().nullable().optional().openapi({ example: 'facilities@apex.com' }),
    phone: z.string().nullable().optional().openapi({ example: '+1-555-0199' }),
    notes: z.string().nullable().optional().openapi({ example: 'Primary commercial client for HVAC servicing' }),
    isActive: z.boolean().openapi({ example: true }),
    createdAt: z.string().openapi({ example: '2026-10-08T09:00:00.000Z' }),
    updatedAt: z.string().openapi({ example: '2026-10-08T09:00:00.000Z' }),
  })
  .openapi('Customer');

export const CreateCustomerRequestSchema = z
  .object({
    name: z.string().min(1).max(255).openapi({ example: 'Apex Facilities Management' }),
    companyName: z.string().max(255).optional().openapi({ example: 'Apex Group Corp' }),
    email: z.string().email().optional().openapi({ example: 'facilities@apex.com' }),
    phone: z.string().max(50).optional().openapi({ example: '+1-555-0199' }),
    notes: z.string().optional().openapi({ example: 'Key commercial account' }),
  })
  .openapi('CreateCustomerRequest');

export const UpdateCustomerRequestSchema = z
  .object({
    name: z.string().min(1).max(255).optional().openapi({ example: 'Apex Facilities Inc' }),
    companyName: z.string().max(255).nullable().optional(),
    email: z.string().email().nullable().optional(),
    phone: z.string().max(50).nullable().optional(),
    notes: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .openapi('UpdateCustomerRequest');

export const ListCustomersResponseSchema = z
  .object({
    customers: z.array(CustomerSchema),
    total: z.number().int().openapi({ example: 1 }),
  })
  .openapi('ListCustomersResponse');

export const CustomerSiteSchema = z
  .object({
    id: z.string().uuid().openapi({ example: 's1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    workspaceId: z.string().uuid().openapi({ example: 'w1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    customerId: z.string().uuid().openapi({ example: 'c1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    customerName: z.string().optional().openapi({ example: 'Apex Facilities Management' }),
    name: z.string().openapi({ example: 'North Logistics Depot' }),
    address: z.string().openapi({ example: '742 Evergreen Terrace, Springfield' }),
    latitude: z.number().nullable().optional().openapi({ example: 28.6139 }),
    longitude: z.number().nullable().optional().openapi({ example: 77.2090 }),
    geofenceRadiusMeters: z.number().positive().openapi({ example: 150.0 }),
    contactName: z.string().nullable().optional().openapi({ example: 'John Depot Lead' }),
    contactPhone: z.string().nullable().optional().openapi({ example: '+1-555-0288' }),
    notes: z.string().nullable().optional(),
    isActive: z.boolean().openapi({ example: true }),
    createdAt: z.string().openapi({ example: '2026-10-08T09:00:00.000Z' }),
    updatedAt: z.string().openapi({ example: '2026-10-08T09:00:00.000Z' }),
  })
  .openapi('CustomerSite');

export const CreateCustomerSiteRequestSchema = z
  .object({
    name: z.string().min(1).max(255).openapi({ example: 'North Logistics Depot' }),
    address: z.string().min(1).openapi({ example: '742 Evergreen Terrace, Springfield' }),
    latitude: z.number().min(-90).max(90).optional().openapi({ example: 28.6139 }),
    longitude: z.number().min(-180).max(180).optional().openapi({ example: 77.2090 }),
    geofenceRadiusMeters: z.number().positive().optional().default(100.0).openapi({ example: 100.0 }),
    contactName: z.string().max(255).optional().openapi({ example: 'John Depot Lead' }),
    contactPhone: z.string().max(50).optional().openapi({ example: '+1-555-0288' }),
    notes: z.string().optional(),
  })
  .openapi('CreateCustomerSiteRequest');

export const UpdateCustomerSiteRequestSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    address: z.string().min(1).optional(),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
    geofenceRadiusMeters: z.number().positive().optional(),
    contactName: z.string().max(255).nullable().optional(),
    contactPhone: z.string().max(50).nullable().optional(),
    notes: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .openapi('UpdateCustomerSiteRequest');

export const ListCustomerSitesResponseSchema = z
  .object({
    sites: z.array(CustomerSiteSchema),
    total: z.number().int().openapi({ example: 1 }),
  })
  .openapi('ListCustomerSitesResponse');

export type Customer = z.infer<typeof CustomerSchema>;
export type CreateCustomerRequest = z.infer<typeof CreateCustomerRequestSchema>;
export type UpdateCustomerRequest = z.infer<typeof UpdateCustomerRequestSchema>;
export type ListCustomersResponse = z.infer<typeof ListCustomersResponseSchema>;
export type CustomerSite = z.infer<typeof CustomerSiteSchema>;
export type CreateCustomerSiteRequest = z.infer<typeof CreateCustomerSiteRequestSchema>;
export type UpdateCustomerSiteRequest = z.infer<typeof UpdateCustomerSiteRequestSchema>;
export type ListCustomerSitesResponse = z.infer<typeof ListCustomerSitesResponseSchema>;

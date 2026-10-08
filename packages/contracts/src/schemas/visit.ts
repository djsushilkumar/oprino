import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const VisitStatusEnum = z.enum([
  'PLANNED',
  'CHECKED_IN',
  'CHECKED_OUT',
  'CANCELLED',
]);
export type VisitStatus = z.infer<typeof VisitStatusEnum>;

export const VisitSchema = z
  .object({
    id: z.string().uuid().openapi({ example: 'v1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    workspaceId: z.string().uuid().openapi({ example: 'w1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    customerId: z.string().uuid().openapi({ example: 'c1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    customerName: z.string().optional().openapi({ example: 'Apex Facilities Management' }),
    siteId: z.string().uuid().nullable().optional().openapi({ example: 's1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    siteName: z.string().nullable().optional().openapi({ example: 'North Logistics Depot' }),
    taskId: z.string().uuid().nullable().optional().openapi({ example: 't1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    taskTitle: z.string().nullable().optional().openapi({ example: 'Inspect HVAC Unit' }),
    userId: z.string().uuid().openapi({ example: 'u1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    userName: z.string().optional().openapi({ example: 'Jane Field Tech' }),
    status: VisitStatusEnum.openapi({ example: 'PLANNED' }),
    plannedAt: z.string().nullable().optional().openapi({ example: '2026-10-08T14:00:00.000Z' }),
    checkInTime: z.string().nullable().optional().openapi({ example: '2026-10-08T14:05:00.000Z' }),
    checkOutTime: z.string().nullable().optional().openapi({ example: '2026-10-08T15:20:00.000Z' }),
    checkInLatitude: z.number().nullable().optional().openapi({ example: 28.6139 }),
    checkInLongitude: z.number().nullable().optional().openapi({ example: 77.2090 }),
    checkOutLatitude: z.number().nullable().optional().openapi({ example: 28.6139 }),
    checkOutLongitude: z.number().nullable().optional().openapi({ example: 77.2090 }),
    durationMinutes: z.number().int().optional().default(0).openapi({ example: 75 }),
    notes: z.string().nullable().optional().openapi({ example: 'Client signed paper receipt on site' }),
    createdAt: z.string().openapi({ example: '2026-10-08T09:00:00.000Z' }),
    updatedAt: z.string().openapi({ example: '2026-10-08T09:00:00.000Z' }),
  })
  .openapi('Visit');

export const CreateVisitRequestSchema = z
  .object({
    customerId: z.string().uuid().openapi({ example: 'c1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    siteId: z.string().uuid().optional().openapi({ example: 's1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    taskId: z.string().uuid().optional().openapi({ example: 't1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    userId: z.string().uuid().optional().openapi({ example: 'u1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    plannedAt: z.string().optional().openapi({ example: '2026-10-08T14:00:00.000Z' }),
    notes: z.string().optional().openapi({ example: 'Quarterly equipment audit' }),
  })
  .openapi('CreateVisitRequest');

export const VisitCheckInRequestSchema = z
  .object({
    latitude: z.number().min(-90).max(90).openapi({ example: 28.6139 }),
    longitude: z.number().min(-180).max(180).openapi({ example: 77.2090 }),
    accuracy: z.number().positive().optional().openapi({ example: 8.5 }),
    notes: z.string().optional().openapi({ example: 'Arrived at client reception' }),
  })
  .openapi('VisitCheckInRequest');

export const VisitCheckOutRequestSchema = z
  .object({
    latitude: z.number().min(-90).max(90).openapi({ example: 28.6139 }),
    longitude: z.number().min(-180).max(180).openapi({ example: 77.2090 }),
    accuracy: z.number().positive().optional().openapi({ example: 8.5 }),
    notes: z.string().optional().openapi({ example: 'Inspection complete, customer signed' }),
  })
  .openapi('VisitCheckOutRequest');

export const ListVisitsResponseSchema = z
  .object({
    visits: z.array(VisitSchema),
    total: z.number().int().openapi({ example: 1 }),
  })
  .openapi('ListVisitsResponse');

export type Visit = z.infer<typeof VisitSchema>;
export type CreateVisitRequest = z.infer<typeof CreateVisitRequestSchema>;
export type VisitCheckInRequest = z.infer<typeof VisitCheckInRequestSchema>;
export type VisitCheckOutRequest = z.infer<typeof VisitCheckOutRequestSchema>;
export type ListVisitsResponse = z.infer<typeof ListVisitsResponseSchema>;

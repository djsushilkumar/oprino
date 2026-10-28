import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const LocationPointSchema = z
  .object({
    id: z.string().uuid().openapi({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    recordedAt: z.string().openapi({ example: '2026-10-08T10:15:30.000Z' }),
    latitude: z.number().min(-90).max(90).openapi({ example: 28.6139 }),
    longitude: z.number().min(-180).max(180).openapi({ example: 77.209 }),
    accuracy: z.number().min(0).openapi({ example: 12.5 }),
    speed: z.number().nullable().optional().openapi({ example: 3.2 }),
    heading: z.number().nullable().optional().openapi({ example: 180.0 }),
    altitude: z.number().nullable().optional().openapi({ example: 215.0 }),
    batteryLevel: z.number().min(0).max(1).nullable().optional().openapi({ example: 0.84 }),
    isCharging: z.boolean().nullable().optional().openapi({ example: false }),
    activityType: z.string().nullable().optional().openapi({ example: 'walking' }),
    isMoving: z.boolean().nullable().optional().openapi({ example: true }),
  })
  .openapi('LocationPoint');

export const LocationIngestBatchRequestSchema = z
  .object({
    locations: z.array(LocationPointSchema).min(1).max(200),
  })
  .openapi('LocationIngestBatchRequest');

export const LocationIngestResponseSchema = z
  .object({
    accepted: z.number().int().openapi({ example: 5 }),
    dropped: z.number().int().openapi({ example: 0 }),
    reason: z.string().nullable().optional().openapi({ example: null }),
    serverTimestamp: z.string().openapi({ example: '2026-10-08T10:15:35.000Z' }),
    acceptedIds: z
      .array(z.string().uuid())
      .optional()
      .openapi({ example: ['c56a4180-65aa-42ec-a945-5fd21dec0538'] }),
    rejectedIds: z.array(z.string().uuid()).optional().openapi({ example: [] }),
  })
  .openapi('LocationIngestResponse');

export const LiveWorkerLocationSchema = z
  .object({
    userId: z.string().uuid().openapi({ example: 'u1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    userName: z.string().openapi({ example: 'Alex Field Tech' }),
    userEmail: z.string().optional().openapi({ example: 'alex@example.com' }),
    dutyStatus: z.enum(['ON_DUTY', 'OFF_DUTY']).openapi({ example: 'ON_DUTY' }),
    sessionId: z
      .string()
      .uuid()
      .nullable()
      .optional()
      .openapi({ example: 's1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    recordedAt: z.string().openapi({ example: '2026-10-08T10:15:30.000Z' }),
    latitude: z.number().openapi({ example: 28.6139 }),
    longitude: z.number().openapi({ example: 77.209 }),
    accuracy: z.number().openapi({ example: 10.0 }),
    speed: z.number().nullable().optional().openapi({ example: 4.5 }),
    heading: z.number().nullable().optional().openapi({ example: 90.0 }),
    batteryLevel: z.number().nullable().optional().openapi({ example: 0.75 }),
    isCharging: z.boolean().nullable().optional().openapi({ example: false }),
    activityType: z.string().nullable().optional().openapi({ example: 'in_vehicle' }),
    isMoving: z.boolean().nullable().optional().openapi({ example: true }),
    currentTaskId: z.string().uuid().nullable().optional().openapi({ example: null }),
    currentTaskTitle: z.string().nullable().optional().openapi({ example: null }),
  })
  .openapi('LiveWorkerLocation');

export const ListLiveWorkersResponseSchema = z
  .object({
    workers: z.array(LiveWorkerLocationSchema),
  })
  .openapi('ListLiveWorkersResponse');

export const LocationHistoryQuerySchema = z
  .object({
    userId: z.string().uuid(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD'),
  })
  .openapi('LocationHistoryQuery');

export const LocationHistoryResponseSchema = z
  .object({
    userId: z.string().uuid().openapi({ example: 'u1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    userName: z.string().optional().openapi({ example: 'Alex Field Tech' }),
    date: z.string().openapi({ example: '2026-10-08' }),
    totalDistanceMeters: z.number().openapi({ example: 12450.5 }),
    totalDurationMinutes: z.number().int().openapi({ example: 275 }),
    points: z.array(LocationPointSchema),
  })
  .openapi('LocationHistoryResponse');

export const GeofenceSchema = z
  .object({
    id: z.string().uuid().openapi({ example: 'g1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    workspaceId: z.string().uuid().openapi({ example: 'w1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    name: z.string().openapi({ example: 'Headquarters Office' }),
    description: z.string().nullable().optional().openapi({ example: 'Central HQ Hub' }),
    latitude: z.number().min(-90).max(90).openapi({ example: 28.6139 }),
    longitude: z.number().min(-180).max(180).openapi({ example: 77.209 }),
    radiusMeters: z.number().positive().openapi({ example: 150.0 }),
    geofenceType: z.enum(['OFFICE', 'CUSTOMER_SITE', 'CHECKPOINT']).openapi({ example: 'OFFICE' }),
    isActive: z.boolean().openapi({ example: true }),
    createdBy: z.string().uuid().openapi({ example: 'u1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    createdAt: z.string().openapi({ example: '2026-10-08T08:00:00.000Z' }),
    updatedAt: z.string().openapi({ example: '2026-10-08T08:00:00.000Z' }),
  })
  .openapi('Geofence');

export const CreateGeofenceRequestSchema = z
  .object({
    name: z.string().min(1).max(100).openapi({ example: 'North Branch Depot' }),
    description: z.string().optional().openapi({ example: 'Logistics fulfillment depot' }),
    latitude: z.number().min(-90).max(90).openapi({ example: 28.65 }),
    longitude: z.number().min(-180).max(180).openapi({ example: 77.23 }),
    radiusMeters: z.number().positive().default(100).openapi({ example: 100 }),
    geofenceType: z
      .enum(['OFFICE', 'CUSTOMER_SITE', 'CHECKPOINT'])
      .default('OFFICE')
      .openapi({ example: 'OFFICE' }),
  })
  .openapi('CreateGeofenceRequest');

export const ListGeofencesResponseSchema = z
  .object({
    geofences: z.array(GeofenceSchema),
  })
  .openapi('ListGeofencesResponse');

export const CheckGeofenceProximityRequestSchema = z
  .object({
    geofenceId: z.string().uuid().openapi({ example: 'g1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    latitude: z.number().min(-90).max(90).openapi({ example: 28.6142 }),
    longitude: z.number().min(-180).max(180).openapi({ example: 77.2093 }),
  })
  .openapi('CheckGeofenceProximityRequest');

export const CheckGeofenceProximityResponseSchema = z
  .object({
    geofenceId: z.string().uuid().openapi({ example: 'g1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    geofenceName: z.string().openapi({ example: 'Headquarters Office' }),
    distanceMeters: z.number().openapi({ example: 45.2 }),
    radiusMeters: z.number().openapi({ example: 150.0 }),
    isInside: z.boolean().openapi({ example: true }),
  })
  .openapi('CheckGeofenceProximityResponse');

export type LocationPoint = z.infer<typeof LocationPointSchema>;
export type LocationIngestBatchRequest = z.infer<typeof LocationIngestBatchRequestSchema>;
export type LocationIngestResponse = z.infer<typeof LocationIngestResponseSchema>;
export type LiveWorkerLocation = z.infer<typeof LiveWorkerLocationSchema>;
export type ListLiveWorkersResponse = z.infer<typeof ListLiveWorkersResponseSchema>;
export type LocationHistoryQuery = z.infer<typeof LocationHistoryQuerySchema>;
export type LocationHistoryResponse = z.infer<typeof LocationHistoryResponseSchema>;
export type Geofence = z.infer<typeof GeofenceSchema>;
export type CreateGeofenceRequest = z.infer<typeof CreateGeofenceRequestSchema>;
export type ListGeofencesResponse = z.infer<typeof ListGeofencesResponseSchema>;
export type CheckGeofenceProximityRequest = z.infer<typeof CheckGeofenceProximityRequestSchema>;
export type CheckGeofenceProximityResponse = z.infer<typeof CheckGeofenceProximityResponseSchema>;

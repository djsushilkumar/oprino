import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const RegisterDeviceRequestSchema = z
  .object({
    installationId: z.string().uuid().openapi({ example: 'i1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    platform: z.enum(['android', 'ios', 'web']).openapi({ example: 'android' }),
    deviceModel: z.string().max(128).optional().openapi({ example: 'Pixel 8' }),
    osVersion: z.string().max(64).optional().openapi({ example: 'Android 15' }),
    appVersion: z.string().max(32).optional().openapi({ example: '1.0.0' }),
    pushToken: z.string().optional().openapi({ example: 'fcm_token_sample_123' }),
  })
  .openapi('RegisterDeviceRequest');

export const DeviceStatusSchema = z
  .enum(['pending', 'active', 'revoked'])
  .openapi('DeviceStatus');

export const DeviceResponseSchema = z
  .object({
    id: z.string().uuid().openapi({ example: 'd1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    installationId: z.string().uuid().openapi({ example: 'i1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    platform: z.string().openapi({ example: 'android' }),
    deviceModel: z.string().nullable().optional().openapi({ example: 'Pixel 8' }),
    osVersion: z.string().nullable().optional().openapi({ example: 'Android 15' }),
    appVersion: z.string().nullable().optional().openapi({ example: '1.0.0' }),
    status: z.string().openapi({ example: 'active' }),
    isTrusted: z.boolean().openapi({ example: true }),
    lastActiveAt: z.string().openapi({ example: '2026-10-05T12:00:00.000Z' }),
    enrolledAt: z.string().optional().openapi({ example: '2026-10-05T12:00:00.000Z' }),
    revokedAt: z.string().nullable().optional().openapi({ example: '2026-10-05T12:00:00.000Z' }),
  })
  .openapi('DeviceResponse');

export const ListDevicesResponseSchema = z
  .object({
    devices: z.array(DeviceResponseSchema),
  })
  .openapi('ListDevicesResponse');

export const RevokeDeviceRequestSchema = z
  .object({
    installationId: z.string().uuid().openapi({ example: 'i1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    userId: z.string().uuid().optional().openapi({ example: 'u1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
  })
  .openapi('RevokeDeviceRequest');

export const RevokeDeviceResponseSchema = z
  .object({
    success: z.boolean().openapi({ example: true }),
    message: z.string().openapi({ example: 'Device installation revoked successfully' }),
  })
  .openapi('RevokeDeviceResponse');

export const ApproveDeviceRequestSchema = z
  .object({
    installationId: z.string().uuid().openapi({ example: 'i1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    userId: z.string().uuid().optional().openapi({ example: 'u1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
  })
  .openapi('ApproveDeviceRequest');

export const ApproveDeviceResponseSchema = z
  .object({
    success: z.boolean().openapi({ example: true }),
    message: z.string().openapi({ example: 'Device installation approved successfully' }),
  })
  .openapi('ApproveDeviceResponse');

export type DeviceStatus = z.infer<typeof DeviceStatusSchema>;
export type RegisterDeviceRequest = z.infer<typeof RegisterDeviceRequestSchema>;
export type DeviceResponse = z.infer<typeof DeviceResponseSchema>;
export type ListDevicesResponse = z.infer<typeof ListDevicesResponseSchema>;
export type RevokeDeviceRequest = z.infer<typeof RevokeDeviceRequestSchema>;
export type RevokeDeviceResponse = z.infer<typeof RevokeDeviceResponseSchema>;
export type ApproveDeviceRequest = z.infer<typeof ApproveDeviceRequestSchema>;
export type ApproveDeviceResponse = z.infer<typeof ApproveDeviceResponseSchema>;


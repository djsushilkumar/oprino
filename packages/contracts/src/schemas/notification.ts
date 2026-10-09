import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const NotificationTypeEnum = z.enum([
  'TASK_ASSIGNED',
  'TASK_OVERDUE',
  'PROOF_REJECTED',
  'MISSED_SHIFT',
  'SYSTEM',
]);
export type NotificationType = z.infer<typeof NotificationTypeEnum>;

export const NotificationSchema = z
  .object({
    id: z.string().uuid().openapi({ example: 'n1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    workspaceId: z.string().uuid().openapi({ example: 'w1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    userId: z.string().uuid().openapi({ example: 'u1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    type: NotificationTypeEnum.openapi({ example: 'TASK_ASSIGNED' }),
    title: z.string().openapi({ example: 'New Task Assigned' }),
    body: z.string().openapi({ example: 'You have been assigned to HVAC Maintenance Unit 4B' }),
    entityType: z.string().nullable().optional().openapi({ example: 'task' }),
    entityId: z.string().nullable().optional().openapi({ example: 't1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    isRead: z.boolean().openapi({ example: false }),
    readAt: z.string().nullable().optional(),
    createdAt: z.string().openapi({ example: '2026-10-09T08:00:00.000Z' }),
  })
  .openapi('Notification');

export const ListNotificationsResponseSchema = z
  .object({
    notifications: z.array(NotificationSchema),
    total: z.number().int().openapi({ example: 5 }),
    unreadCount: z.number().int().openapi({ example: 2 }),
  })
  .openapi('ListNotificationsResponse');

export const MarkNotificationReadResponseSchema = z
  .object({
    success: z.boolean().openapi({ example: true }),
    markedCount: z.number().int().openapi({ example: 1 }),
  })
  .openapi('MarkNotificationReadResponse');

export type Notification = z.infer<typeof NotificationSchema>;
export type ListNotificationsResponse = z.infer<typeof ListNotificationsResponseSchema>;
export type MarkNotificationReadResponse = z.infer<typeof MarkNotificationReadResponseSchema>;

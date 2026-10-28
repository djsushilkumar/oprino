import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const TaskStatusEnum = z.enum([
  'ASSIGNED',
  'ACCEPTED',
  'EN_ROUTE',
  'ARRIVED',
  'IN_PROGRESS',
  'COMPLETED',
  'VERIFIED',
]);

export const SimplifiedTaskStatusEnum = z.enum(['TO_DO', 'IN_PROGRESS', 'DONE']);

export const TaskPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

export type TaskStatus = z.infer<typeof TaskStatusEnum>;
export type SimplifiedTaskStatus = z.infer<typeof SimplifiedTaskStatusEnum>;
export type TaskPriority = z.infer<typeof TaskPriorityEnum>;

export const TaskAssigneeSchema = z
  .object({
    id: z.string().uuid().openapi({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    taskId: z.string().uuid().openapi({ example: 't1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    userId: z.string().uuid().openapi({ example: 'u1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    name: z.string().openapi({ example: 'Jane Field Tech' }),
    email: z.string().email().openapi({ example: 'jane@example.com' }),
    assignedAt: z.string().openapi({ example: '2026-10-05T12:00:00.000Z' }),
  })
  .openapi('TaskAssignee');

export const TaskChecklistItemSchema = z
  .object({
    id: z.string().uuid().openapi({ example: 'c1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    taskId: z.string().uuid().openapi({ example: 't1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    title: z.string().openapi({ example: 'Inspect water supply valve' }),
    isCompleted: z.boolean().openapi({ example: false }),
    sortOrder: z.number().int().openapi({ example: 0 }),
    completedBy: z.string().uuid().nullable().optional().openapi({ example: null }),
    completedAt: z.string().nullable().optional().openapi({ example: null }),
    createdAt: z.string().openapi({ example: '2026-10-05T12:00:00.000Z' }),
  })
  .openapi('TaskChecklistItem');

export const TaskCommentSchema = z
  .object({
    id: z.string().uuid().openapi({ example: 'm1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    taskId: z.string().uuid().openapi({ example: 't1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    authorId: z.string().uuid().openapi({ example: 'u1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    authorName: z.string().openapi({ example: 'Jane Field Tech' }),
    content: z.string().openapi({ example: 'Site gate was locked, called supervisor.' }),
    createdAt: z.string().openapi({ example: '2026-10-05T12:30:00.000Z' }),
  })
  .openapi('TaskComment');

export const TaskActivitySchema = z
  .object({
    id: z.string().uuid().openapi({ example: 'e1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    taskId: z.string().uuid().openapi({ example: 't1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    actorId: z.string().uuid().openapi({ example: 'u1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    actorName: z.string().openapi({ example: 'Jane Field Tech' }),
    action: z.string().openapi({ example: 'task.status_changed' }),
    fromStatus: z.string().nullable().optional().openapi({ example: 'ASSIGNED' }),
    toStatus: z.string().nullable().optional().openapi({ example: 'ACCEPTED' }),
    details: z.record(z.unknown()).optional(),
    createdAt: z.string().openapi({ example: '2026-10-05T12:05:00.000Z' }),
  })
  .openapi('TaskActivity');

export const TaskResponseSchema = z
  .object({
    id: z.string().uuid().openapi({ example: 't1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    workspaceId: z.string().uuid().openapi({ example: 'w1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    title: z.string().openapi({ example: 'HVAC Maintenance Unit 4B' }),
    description: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: 'Annual filter change and motor inspection' }),
    status: TaskStatusEnum.openapi({ example: 'ASSIGNED' }),
    simplifiedStatus: SimplifiedTaskStatusEnum.openapi({ example: 'TO_DO' }),
    priority: TaskPriorityEnum.openapi({ example: 'HIGH' }),
    dueAt: z.string().nullable().optional().openapi({ example: '2026-10-06T18:00:00.000Z' }),
    customerId: z
      .string()
      .uuid()
      .nullable()
      .optional()
      .openapi({ example: 'c1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    customerName: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: 'Apex Facilities Management' }),
    siteId: z
      .string()
      .uuid()
      .nullable()
      .optional()
      .openapi({ example: 's1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    siteName: z.string().nullable().optional().openapi({ example: 'North Logistics Depot' }),
    requiresSignature: z.boolean().optional().default(false).openapi({ example: true }),
    requiresPhotoProof: z.boolean().optional().default(false).openapi({ example: true }),
    verifiedBy: z.string().uuid().nullable().optional(),
    verifierName: z.string().nullable().optional().openapi({ example: 'Supervisor Bob' }),
    verifiedAt: z.string().nullable().optional(),
    verificationNotes: z.string().nullable().optional(),
    createdBy: z.string().uuid().openapi({ example: 'u1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    creatorName: z.string().optional().openapi({ example: 'Supervisor Bob' }),
    version: z.number().int().openapi({ example: 1 }),
    assignees: z.array(TaskAssigneeSchema),
    checklist: z.array(TaskChecklistItemSchema).optional(),
    comments: z.array(TaskCommentSchema).optional(),
    activities: z.array(TaskActivitySchema).optional(),
    createdAt: z.string().openapi({ example: '2026-10-05T12:00:00.000Z' }),
    updatedAt: z.string().openapi({ example: '2026-10-05T12:00:00.000Z' }),
  })
  .openapi('TaskResponse');

export const CreateTaskRequestSchema = z
  .object({
    title: z.string().min(1).max(255).openapi({ example: 'HVAC Maintenance Unit 4B' }),
    description: z
      .string()
      .optional()
      .openapi({ example: 'Annual filter change and motor inspection' }),
    priority: TaskPriorityEnum.optional().default('MEDIUM').openapi({ example: 'HIGH' }),
    dueAt: z.string().optional().openapi({ example: '2026-10-06T18:00:00.000Z' }),
    customerId: z.string().uuid().optional(),
    siteId: z.string().uuid().optional(),
    requiresSignature: z.boolean().optional().default(false),
    requiresPhotoProof: z.boolean().optional().default(false),
    assigneeIds: z
      .array(z.string().uuid())
      .optional()
      .openapi({ example: ['u1b2c3d4-e5f6-7890-abcd-ef1234567890'] }),
    checklist: z
      .array(z.string().min(1).max(255))
      .optional()
      .openapi({ example: ['Check air filter', 'Inspect wiring'] }),
  })
  .openapi('CreateTaskRequest');

export const UpdateTaskRequestSchema = z
  .object({
    title: z.string().min(1).max(255).optional().openapi({ example: 'HVAC Maintenance Unit 4B' }),
    description: z.string().nullable().optional().openapi({ example: 'Updated task scope' }),
    priority: TaskPriorityEnum.optional().openapi({ example: 'URGENT' }),
    dueAt: z.string().nullable().optional().openapi({ example: '2026-10-07T12:00:00.000Z' }),
    customerId: z.string().uuid().nullable().optional(),
    siteId: z.string().uuid().nullable().optional(),
    requiresSignature: z.boolean().optional(),
    requiresPhotoProof: z.boolean().optional(),
    assigneeIds: z.array(z.string().uuid()).optional(),
    version: z.number().int().openapi({ example: 1 }),
  })
  .openapi('UpdateTaskRequest');

export const TaskTransitionRequestSchema = z
  .object({
    status: TaskStatusEnum.openapi({ example: 'ACCEPTED' }),
    version: z.number().int().openapi({ example: 1 }),
    comment: z.string().optional().openapi({ example: 'Accepted task and heading to truck' }),
  })
  .openapi('TaskTransitionRequest');

export const VerifyTaskRequestSchema = z
  .object({
    action: z.enum(['VERIFY', 'REJECT']).openapi({ example: 'VERIFY' }),
    notes: z
      .string()
      .optional()
      .openapi({ example: 'Photos confirmed, customer signature present.' }),
  })
  .openapi('VerifyTaskRequest');

export const CreateChecklistItemRequestSchema = z
  .object({
    title: z.string().min(1).max(255).openapi({ example: 'Verify breaker is off' }),
    sortOrder: z.number().int().optional().openapi({ example: 0 }),
  })
  .openapi('CreateChecklistItemRequest');

export const UpdateChecklistItemRequestSchema = z
  .object({
    isCompleted: z.boolean().openapi({ example: true }),
  })
  .openapi('UpdateChecklistItemRequest');

export const CreateTaskCommentRequestSchema = z
  .object({
    content: z.string().min(1).max(2000).openapi({ example: 'Gate access code was 4211.' }),
  })
  .openapi('CreateTaskCommentRequest');

export const ListTasksResponseSchema = z
  .object({
    tasks: z.array(TaskResponseSchema),
    total: z.number().int().openapi({ example: 1 }),
  })
  .openapi('ListTasksResponse');

export const RecurrenceFrequencyEnum = z.enum(['DAILY', 'WEEKLY', 'MONTHLY']);
export type RecurrenceFrequency = z.infer<typeof RecurrenceFrequencyEnum>;

export const RecurringTaskTemplateSchema = z
  .object({
    id: z.string().uuid().openapi({ example: 'rt1b2c3d-e5f6-7890-abcd-ef1234567890' }),
    workspaceId: z.string().uuid().openapi({ example: 'w1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    title: z.string().openapi({ example: 'Daily HVAC Filter Inspection' }),
    description: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: 'Inspect and replace dirty filters' }),
    priority: TaskPriorityEnum.openapi({ example: 'MEDIUM' }),
    customerId: z.string().uuid().nullable().optional(),
    customerName: z.string().nullable().optional(),
    siteId: z.string().uuid().nullable().optional(),
    siteName: z.string().nullable().optional(),
    requiresSignature: z.boolean().default(false),
    requiresPhotoProof: z.boolean().default(false),
    checklistTemplate: z
      .array(
        z.object({
          title: z.string(),
          sortOrder: z.number().int().default(0),
        }),
      )
      .default([]),
    assigneeIds: z.array(z.string().uuid()).default([]),
    recurrenceFrequency: RecurrenceFrequencyEnum.openapi({ example: 'DAILY' }),
    recurrenceInterval: z.number().int().default(1),
    daysOfWeek: z.array(z.number().int().min(0).max(6)).default([]),
    dayOfMonth: z.number().int().min(1).max(31).nullable().optional(),
    timeOfDay: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .default('09:00'),
    timezone: z.string().default('UTC'),
    isActive: z.boolean().default(true),
    nextRunAt: z.string(),
    lastRunAt: z.string().nullable().optional(),
    createdBy: z.string().uuid(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi('RecurringTaskTemplate');

export const CreateRecurringTaskTemplateRequestSchema = z
  .object({
    title: z.string().min(1).max(255).openapi({ example: 'Daily HVAC Filter Inspection' }),
    description: z.string().optional(),
    priority: TaskPriorityEnum.default('MEDIUM'),
    customerId: z.string().uuid().optional(),
    siteId: z.string().uuid().optional(),
    requiresSignature: z.boolean().default(false),
    requiresPhotoProof: z.boolean().default(false),
    checklistTemplate: z
      .array(
        z.object({
          title: z.string(),
          sortOrder: z.number().int().default(0),
        }),
      )
      .default([]),
    assigneeIds: z.array(z.string().uuid()).default([]),
    recurrenceFrequency: RecurrenceFrequencyEnum.openapi({ example: 'DAILY' }),
    recurrenceInterval: z.number().int().default(1),
    daysOfWeek: z.array(z.number().int().min(0).max(6)).default([]),
    dayOfMonth: z.number().int().min(1).max(31).optional(),
    timeOfDay: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .default('09:00'),
    timezone: z.string().default('UTC'),
  })
  .openapi('CreateRecurringTaskTemplateRequest');

export const UpdateRecurringTaskTemplateRequestSchema =
  CreateRecurringTaskTemplateRequestSchema.partial()
    .extend({
      isActive: z.boolean().optional(),
    })
    .openapi('UpdateRecurringTaskTemplateRequest');

export const ListRecurringTaskTemplatesResponseSchema = z
  .object({
    templates: z.array(RecurringTaskTemplateSchema),
    total: z.number().int(),
  })
  .openapi('ListRecurringTaskTemplatesResponse');

export type TaskAssignee = z.infer<typeof TaskAssigneeSchema>;
export type TaskChecklistItem = z.infer<typeof TaskChecklistItemSchema>;
export type TaskComment = z.infer<typeof TaskCommentSchema>;
export type TaskActivity = z.infer<typeof TaskActivitySchema>;
export type TaskResponse = z.infer<typeof TaskResponseSchema>;
export type CreateTaskRequest = z.infer<typeof CreateTaskRequestSchema>;
export type UpdateTaskRequest = z.infer<typeof UpdateTaskRequestSchema>;
export type TaskTransitionRequest = z.infer<typeof TaskTransitionRequestSchema>;
export type VerifyTaskRequest = z.infer<typeof VerifyTaskRequestSchema>;
export type CreateChecklistItemRequest = z.infer<typeof CreateChecklistItemRequestSchema>;
export type UpdateChecklistItemRequest = z.infer<typeof UpdateChecklistItemRequestSchema>;
export type CreateTaskCommentRequest = z.infer<typeof CreateTaskCommentRequestSchema>;
export type ListTasksResponse = z.infer<typeof ListTasksResponseSchema>;
export type RecurringTaskTemplate = z.infer<typeof RecurringTaskTemplateSchema>;
export type CreateRecurringTaskTemplateRequest = z.infer<
  typeof CreateRecurringTaskTemplateRequestSchema
>;
export type UpdateRecurringTaskTemplateRequest = z.infer<
  typeof UpdateRecurringTaskTemplateRequestSchema
>;
export type ListRecurringTaskTemplatesResponse = z.infer<
  typeof ListRecurringTaskTemplatesResponseSchema
>;

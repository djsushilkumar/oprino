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
    description: z.string().nullable().optional().openapi({ example: 'Annual filter change and motor inspection' }),
    status: TaskStatusEnum.openapi({ example: 'ASSIGNED' }),
    simplifiedStatus: SimplifiedTaskStatusEnum.openapi({ example: 'TO_DO' }),
    priority: TaskPriorityEnum.openapi({ example: 'HIGH' }),
    dueAt: z.string().nullable().optional().openapi({ example: '2026-10-06T18:00:00.000Z' }),
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
    description: z.string().optional().openapi({ example: 'Annual filter change and motor inspection' }),
    priority: TaskPriorityEnum.optional().default('MEDIUM').openapi({ example: 'HIGH' }),
    dueAt: z.string().optional().openapi({ example: '2026-10-06T18:00:00.000Z' }),
    assigneeIds: z.array(z.string().uuid()).optional().openapi({ example: ['u1b2c3d4-e5f6-7890-abcd-ef1234567890'] }),
    checklist: z.array(z.string().min(1).max(255)).optional().openapi({ example: ['Check air filter', 'Inspect wiring'] }),
  })
  .openapi('CreateTaskRequest');

export const UpdateTaskRequestSchema = z
  .object({
    title: z.string().min(1).max(255).optional().openapi({ example: 'HVAC Maintenance Unit 4B' }),
    description: z.string().nullable().optional().openapi({ example: 'Updated task scope' }),
    priority: TaskPriorityEnum.optional().openapi({ example: 'URGENT' }),
    dueAt: z.string().nullable().optional().openapi({ example: '2026-10-07T12:00:00.000Z' }),
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

export type TaskAssignee = z.infer<typeof TaskAssigneeSchema>;
export type TaskChecklistItem = z.infer<typeof TaskChecklistItemSchema>;
export type TaskComment = z.infer<typeof TaskCommentSchema>;
export type TaskActivity = z.infer<typeof TaskActivitySchema>;
export type TaskResponse = z.infer<typeof TaskResponseSchema>;
export type CreateTaskRequest = z.infer<typeof CreateTaskRequestSchema>;
export type UpdateTaskRequest = z.infer<typeof UpdateTaskRequestSchema>;
export type TaskTransitionRequest = z.infer<typeof TaskTransitionRequestSchema>;
export type CreateChecklistItemRequest = z.infer<typeof CreateChecklistItemRequestSchema>;
export type UpdateChecklistItemRequest = z.infer<typeof UpdateChecklistItemRequestSchema>;
export type CreateTaskCommentRequest = z.infer<typeof CreateTaskCommentRequestSchema>;
export type ListTasksResponse = z.infer<typeof ListTasksResponseSchema>;

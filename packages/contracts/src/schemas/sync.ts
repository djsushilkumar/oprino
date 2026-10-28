import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const SyncEntityTypeEnum = z.enum(['ATTENDANCE', 'TASK', 'CHECKLIST', 'VISIT', 'PROOF']);
export type SyncEntityType = z.infer<typeof SyncEntityTypeEnum>;

export const SyncMutationTypeEnum = z.enum([
  'PUNCH_IN',
  'PUNCH_OUT',
  'TRANSITION',
  'CHECKLIST_UPDATE',
  'VISIT_CHECK_IN',
  'VISIT_CHECK_OUT',
  'CONFIRM_PROOF',
]);
export type SyncMutationType = z.infer<typeof SyncMutationTypeEnum>;

export const SyncResolutionStatusEnum = z.enum([
  'APPLIED',
  'APPLIED_OVERRIDE',
  'MERGED_PARTIAL',
  'REJECTED_STALE',
  'DUPLICATE_ACK',
]);
export type SyncResolutionStatus = z.infer<typeof SyncResolutionStatusEnum>;

export const SyncMutationEnvelopeSchema = z
  .object({
    mutationId: z.string().uuid().openapi({ example: 'm1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    entityType: SyncEntityTypeEnum.openapi({ example: 'TASK' }),
    entityId: z.string().openapi({ example: 't1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    mutationType: SyncMutationTypeEnum.openapi({ example: 'TRANSITION' }),
    clientTimestamp: z.string().openapi({ example: '2026-10-09T08:30:00.000Z' }),
    payload: z.record(z.unknown()).openapi({ example: { status: 'COMPLETED', version: 2 } }),
    expectedVersion: z.number().int().optional().openapi({ example: 2 }),
  })
  .openapi('SyncMutationEnvelope');

export const SyncBatchRequestSchema = z
  .object({
    mutations: z.array(SyncMutationEnvelopeSchema),
  })
  .openapi('SyncBatchRequest');

export const SyncMutationResultSchema = z
  .object({
    mutationId: z.string().uuid().openapi({ example: 'm1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    status: SyncResolutionStatusEnum.openapi({ example: 'APPLIED' }),
    entityId: z.string().openapi({ example: 't1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    serverVersion: z.number().int().optional().openapi({ example: 3 }),
    resolutionNote: z.string().nullable().optional(),
    error: z.string().nullable().optional(),
  })
  .openapi('SyncMutationResult');

export const SyncBatchResponseSchema = z
  .object({
    results: z.array(SyncMutationResultSchema),
    processedCount: z.number().int().openapi({ example: 5 }),
    appliedCount: z.number().int().openapi({ example: 5 }),
    conflictCount: z.number().int().openapi({ example: 0 }),
  })
  .openapi('SyncBatchResponse');

export type SyncMutationEnvelope = z.infer<typeof SyncMutationEnvelopeSchema>;
export type SyncBatchRequest = z.infer<typeof SyncBatchRequestSchema>;
export type SyncMutationResult = z.infer<typeof SyncMutationResultSchema>;
export type SyncBatchResponse = z.infer<typeof SyncBatchResponseSchema>;

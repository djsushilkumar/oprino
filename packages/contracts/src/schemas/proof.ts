import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const ProofTypeEnum = z.enum(['PHOTO', 'SIGNATURE', 'DOCUMENT']);
export type ProofType = z.infer<typeof ProofTypeEnum>;

export const TaskProofSchema = z
  .object({
    id: z.string().uuid().openapi({ example: 'p1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    workspaceId: z.string().uuid().openapi({ example: 'w1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    taskId: z.string().uuid().openapi({ example: 't1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    visitId: z
      .string()
      .uuid()
      .nullable()
      .optional()
      .openapi({ example: 'v1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    userId: z.string().uuid().openapi({ example: 'u1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    userName: z.string().optional().openapi({ example: 'Jane Field Tech' }),
    proofType: ProofTypeEnum.openapi({ example: 'PHOTO' }),
    fileKey: z.string().openapi({ example: 'workspace-1/proofs/2026/10/task-1/proof-1.jpg' }),
    fileUrl: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: 'https://storage.oprino.com/proof-1.jpg' }),
    fileSizeBytes: z.number().int().nullable().optional().openapi({ example: 284500 }),
    mimeType: z.string().nullable().optional().openapi({ example: 'image/jpeg' }),
    signerName: z.string().nullable().optional().openapi({ example: 'Alice Customer' }),
    signerPhone: z.string().nullable().optional().openapi({ example: '+1-555-0199' }),
    watermarkMetadata: z.record(z.unknown()).optional(),
    notes: z.string().nullable().optional(),
    createdAt: z.string().openapi({ example: '2026-10-08T15:30:00.000Z' }),
  })
  .openapi('TaskProof');

export const MediaUploadUrlRequestSchema = z
  .object({
    taskId: z.string().uuid().openapi({ example: 't1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    visitId: z
      .string()
      .uuid()
      .optional()
      .openapi({ example: 'v1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    proofType: ProofTypeEnum.openapi({ example: 'PHOTO' }),
    fileName: z.string().min(1).openapi({ example: 'ac_compressor_replaced.jpg' }),
    mimeType: z.string().min(1).openapi({ example: 'image/jpeg' }),
    fileSizeBytes: z.number().int().optional().openapi({ example: 320000 }),
  })
  .openapi('MediaUploadUrlRequest');

export const MediaUploadUrlResponseSchema = z
  .object({
    uploadUrl: z
      .string()
      .openapi({ example: 'https://s3.us-east-1.amazonaws.com/oprino-proofs/upload?...' }),
    fileKey: z.string().openapi({ example: 'workspace-1/proofs/2026/10/task-1/photo-abc.jpg' }),
    expiresInSeconds: z.number().int().openapi({ example: 600 }),
  })
  .openapi('MediaUploadUrlResponse');

export const ConfirmMediaUploadRequestSchema = z
  .object({
    taskId: z.string().uuid().openapi({ example: 't1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    visitId: z.string().uuid().optional(),
    proofType: ProofTypeEnum.openapi({ example: 'PHOTO' }),
    fileKey: z
      .string()
      .min(1)
      .openapi({ example: 'workspace-1/proofs/2026/10/task-1/photo-abc.jpg' }),
    fileSizeBytes: z.number().int().optional().openapi({ example: 320000 }),
    mimeType: z.string().optional().openapi({ example: 'image/jpeg' }),
    signerName: z.string().optional().openapi({ example: 'Alice Customer' }),
    signerPhone: z.string().optional().openapi({ example: '+1-555-0199' }),
    watermarkMetadata: z.record(z.unknown()).optional(),
    notes: z
      .string()
      .optional()
      .openapi({ example: 'Compressor valve replaced and pressure tested.' }),
  })
  .openapi('ConfirmMediaUploadRequest');

export const ListTaskProofsResponseSchema = z
  .object({
    proofs: z.array(TaskProofSchema),
  })
  .openapi('ListTaskProofsResponse');

export const MediaDownloadUrlRequestSchema = z
  .object({
    fileKey: z.string().min(1).openapi({ example: 'workspace-1/proofs/task-1/photo.jpg' }),
  })
  .openapi('MediaDownloadUrlRequest');

export const MediaDownloadUrlResponseSchema = z
  .object({
    downloadUrl: z
      .string()
      .openapi({ example: 'https://s3.us-east-1.amazonaws.com/oprino-proofs/photo.jpg?...' }),
    fileKey: z.string().openapi({ example: 'workspace-1/proofs/task-1/photo.jpg' }),
    expiresInSeconds: z.number().int().openapi({ example: 900 }),
  })
  .openapi('MediaDownloadUrlResponse');

export type TaskProof = z.infer<typeof TaskProofSchema>;
export type MediaUploadUrlRequest = z.infer<typeof MediaUploadUrlRequestSchema>;
export type MediaUploadUrlResponse = z.infer<typeof MediaUploadUrlResponseSchema>;
export type ConfirmMediaUploadRequest = z.infer<typeof ConfirmMediaUploadRequestSchema>;
export type ListTaskProofsResponse = z.infer<typeof ListTaskProofsResponseSchema>;
export type MediaDownloadUrlRequest = z.infer<typeof MediaDownloadUrlRequestSchema>;
export type MediaDownloadUrlResponse = z.infer<typeof MediaDownloadUrlResponseSchema>;

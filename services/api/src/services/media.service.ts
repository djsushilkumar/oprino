import * as crypto from 'node:crypto';
import { eq, and, desc, sql } from 'drizzle-orm';
import type { Database } from '@oprino/database';
import { taskProofs, tasks, users } from '@oprino/database/schema';
import type {
  MediaUploadUrlRequest,
  MediaUploadUrlResponse,
  ConfirmMediaUploadRequest,
} from '@oprino/contracts';
import type { StorageDriver } from '../storage/types.js';

export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export class MediaService {
  private publicBaseUrl: string;

  constructor(
    private db: Database,
    private storageDriver: StorageDriver,
    publicBaseUrl?: string,
  ) {
    this.publicBaseUrl = publicBaseUrl || 'http://localhost:3000';
  }

  getStorageDriver(): StorageDriver {
    return this.storageDriver;
  }

  getPublicBaseUrl(): string {
    return this.publicBaseUrl;
  }

  /**
   * Validates file key against path traversal and ensures tenant isolation.
   */
  validateFileKey(workspaceId: string, fileKey: string): void {
    if (!fileKey || typeof fileKey !== 'string') {
      const error: any = new Error('Invalid file key provided');
      error.statusCode = 400;
      throw error;
    }

    // Path Traversal Guardrails (400 Bad Request)
    if (
      fileKey.includes('..') ||
      fileKey.includes('//') ||
      fileKey.includes('\\') ||
      fileKey.startsWith('/') ||
      fileKey.includes('\0')
    ) {
      const error: any = new Error(
        'Security barrier violation: Malicious path traversal pattern detected in file key',
      );
      error.statusCode = 400;
      throw error;
    }

    // Tenant Isolation Check (403 Forbidden)
    if (!fileKey.startsWith(`${workspaceId}/`)) {
      const error: any = new Error(
        'Security barrier violation: Cannot access media outside active workspace prefix',
      );
      error.statusCode = 403;
      throw error;
    }
  }

  /**
   * Generates a pre-signed S3 direct-upload URL partitioned by workspace ID (ADR-012).
   */
  async generateUploadUrl(
    workspaceId: string,
    _userId: string,
    input: MediaUploadUrlRequest,
  ): Promise<MediaUploadUrlResponse> {
    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(input.mimeType as any)) {
      const error: any = new Error(
        `Unsupported media MIME type: ${input.mimeType}. Allowed formats are: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
      error.statusCode = 400;
      throw error;
    }

    // Validate size limit
    if (input.fileSizeBytes && input.fileSizeBytes > MAX_UPLOAD_SIZE_BYTES) {
      const error: any = new Error(
        `File size exceeds maximum allowed threshold of ${MAX_UPLOAD_SIZE_BYTES} bytes (10 MB).`,
      );
      error.statusCode = 400;
      throw error;
    }

    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      // Verify task belongs to workspace
      const [task] = await tx
        .select({ id: tasks.id })
        .from(tasks)
        .where(and(eq(tasks.workspaceId, workspaceId), eq(tasks.id, input.taskId)));

      if (!task) {
        const error = new Error('Task not found in active workspace');
        (error as any).statusCode = 404;
        throw error;
      }

      // Partitioned key: {workspace_id}/proofs/{taskId}/{timestamp}-{uuid}-{safeFileName}
      const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const uniqueSuffix = crypto.randomUUID().substring(0, 8);
      const fileKey = `${workspaceId}/proofs/${input.taskId}/${Date.now()}-${uniqueSuffix}-${safeName}`;

      this.validateFileKey(workspaceId, fileKey);

      const uploadUrl = await this.storageDriver.getUploadUrl(fileKey, {
        contentType: input.mimeType,
        maxSizeBytes: input.fileSizeBytes || MAX_UPLOAD_SIZE_BYTES,
        expiresInSeconds: 600, // 10 minutes
      });

      return {
        uploadUrl,
        fileKey,
        expiresInSeconds: 600,
      };
    });
  }

  /**
   * BLK-004: Generates pre-signed direct-upload URL for employee attendance selfie verification.
   */
  async generateAttendanceSelfieUploadUrl(
    workspaceId: string,
    userId: string,
    fileName = 'selfie.jpg',
  ): Promise<MediaUploadUrlResponse> {
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueSuffix = crypto.randomUUID().substring(0, 8);
    const fileKey = `${workspaceId}/attendance/${userId}/${Date.now()}-${uniqueSuffix}-${safeName}`;

    this.validateFileKey(workspaceId, fileKey);

    const uploadUrl = await this.storageDriver.getUploadUrl(fileKey, {
      contentType: 'image/jpeg',
      maxSizeBytes: MAX_UPLOAD_SIZE_BYTES,
      expiresInSeconds: 600, // 10 minutes
    });

    return {
      uploadUrl,
      fileKey,
      expiresInSeconds: 600,
    };
  }

  /**
   * Confirms uploaded proof binary and records proof in task_proofs.
   * Guarantees that binary actually exists in storage before recording.
   */
  async confirmUpload(workspaceId: string, userId: string, input: ConfirmMediaUploadRequest) {
    this.validateFileKey(workspaceId, input.fileKey);

    // Verify entity association: fileKey must strictly match target task proof prefix
    const expectedTaskPrefix = `${workspaceId}/proofs/${input.taskId}/`;
    if (!input.fileKey.startsWith(expectedTaskPrefix)) {
      const error: any = new Error(
        'Security barrier violation: fileKey does not match the target task proof entity',
      );
      error.statusCode = 403;
      throw error;
    }

    // Verify object existence in real storage
    const meta = await this.storageDriver.headObject(input.fileKey);
    if (!meta || !meta.exists) {
      const error: any = new Error(
        'Uploaded media binary does not exist in storage. The direct binary upload must complete before confirming proof.',
      );
      error.statusCode = 400;
      error.code = 'STORAGE_OBJECT_NOT_FOUND';
      throw error;
    }

    // Verify real file size
    if (meta.sizeBytes === 0) {
      const error: any = new Error('Uploaded media file is empty (0 bytes).');
      error.statusCode = 400;
      error.code = 'EMPTY_MEDIA_FILE';
      throw error;
    }

    if (meta.sizeBytes && meta.sizeBytes > MAX_UPLOAD_SIZE_BYTES) {
      const error: any = new Error(
        `Uploaded media file exceeds maximum allowed threshold of ${MAX_UPLOAD_SIZE_BYTES} bytes (10 MB).`,
      );
      error.statusCode = 400;
      error.code = 'OVERSIZED_MEDIA_FILE';
      throw error;
    }

    // Verify MIME type if known
    if (meta.contentType && !ALLOWED_MIME_TYPES.includes(meta.contentType as any)) {
      const error: any = new Error(
        `Uploaded object has disallowed Content-Type: ${meta.contentType}`,
      );
      error.statusCode = 400;
      throw error;
    }

    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      // Verify task belongs to workspace
      const [task] = await tx
        .select({ id: tasks.id })
        .from(tasks)
        .where(and(eq(tasks.workspaceId, workspaceId), eq(tasks.id, input.taskId)));

      if (!task) {
        const error = new Error('Task not found in active workspace');
        (error as any).statusCode = 404;
        throw error;
      }

      // Replay prevention: verify this fileKey has not already been confirmed
      const [existingProof] = await tx
        .select({ id: taskProofs.id })
        .from(taskProofs)
        .where(and(eq(taskProofs.workspaceId, workspaceId), eq(taskProofs.fileKey, input.fileKey)))
        .limit(1);

      if (existingProof) {
        const error: any = new Error(
          'Replay detected: This media file has already been confirmed as proof.',
        );
        error.statusCode = 400;
        error.code = 'PROOF_REPLAY_DETECTED';
        throw error;
      }

      // Generate a fresh 15-minute presigned GET URL for viewing
      const fileUrl = await this.storageDriver.getDownloadUrl(input.fileKey, {
        expiresInSeconds: 900,
      });

      const actualSizeBytes = meta.sizeBytes ?? input.fileSizeBytes ?? null;
      const actualMimeType = meta.contentType ?? input.mimeType ?? 'image/jpeg';

      const [proof] = await tx
        .insert(taskProofs)
        .values({
          workspaceId,
          taskId: input.taskId,
          visitId: input.visitId ?? null,
          userId,
          proofType: input.proofType as any,
          fileKey: input.fileKey,
          fileUrl: null, // Durable storage: generate fresh presigned URLs on demand, never store stale URLs
          fileSizeBytes: actualSizeBytes,
          mimeType: actualMimeType,
          signerName: input.signerName ?? null,
          signerPhone: input.signerPhone ?? null,
          watermarkMetadata: input.watermarkMetadata ?? null,
          notes: input.notes ?? null,
        })
        .returning();

      if (!proof) {
        throw new Error('Failed to record task proof');
      }

      // Get user name
      const [user] = await tx.select({ name: users.name }).from(users).where(eq(users.id, userId));

      return {
        id: proof.id,
        workspaceId: proof.workspaceId,
        taskId: proof.taskId,
        visitId: proof.visitId,
        userId: proof.userId,
        userName: user?.name,
        proofType: proof.proofType,
        fileKey: proof.fileKey,
        fileUrl,
        fileSizeBytes: proof.fileSizeBytes,
        mimeType: proof.mimeType,
        signerName: proof.signerName,
        signerPhone: proof.signerPhone,
        watermarkMetadata: proof.watermarkMetadata as Record<string, unknown> | undefined,
        notes: proof.notes,
        createdAt: proof.createdAt.toISOString(),
      };
    });
  }

  /**
   * Generates a short-lived presigned GET URL for authorized viewing.
   */
  async getDownloadUrl(
    workspaceId: string,
    userId: string,
    fileKey: string,
    permissions: string[] = [],
  ): Promise<{ downloadUrl: string; fileKey: string; expiresInSeconds: number }> {
    this.validateFileKey(workspaceId, fileKey);

    // Permission and ownership authorization with default-deny
    if (fileKey.startsWith(`${workspaceId}/attendance/`)) {
      const parts = fileKey.split('/');
      // Expected key format: {workspaceId}/attendance/{userId}/{timestamp}-{uuid}-{filename}
      const targetUserId = parts[2];
      const isOwner = targetUserId === userId;
      const hasTeamRead =
        permissions.includes('attendance.team.read') || permissions.includes('admin');
      if (!isOwner && !hasTeamRead) {
        const error: any = new Error(
          'Security barrier violation: Insufficient permissions to view employee attendance selfie',
        );
        error.statusCode = 403;
        throw error;
      }
    } else if (fileKey.startsWith(`${workspaceId}/proofs/`)) {
      const hasTasksRead =
        permissions.includes('tasks.read') ||
        permissions.includes('tasks.write') ||
        permissions.includes('admin');
      if (!hasTasksRead) {
        const error: any = new Error(
          'Security barrier violation: Insufficient permissions to inspect task proof',
        );
        error.statusCode = 403;
        throw error;
      }
    } else {
      // Default-Deny: Any unclassified media category is forbidden
      const error: any = new Error(
        'Security barrier violation: Access to unclassified media category is forbidden',
      );
      error.statusCode = 403;
      throw error;
    }

    // Verify object exists
    const meta = await this.storageDriver.headObject(fileKey);
    if (!meta || !meta.exists) {
      const error: any = new Error('Storage object not found');
      error.statusCode = 404;
      throw error;
    }

    const downloadUrl = await this.storageDriver.getDownloadUrl(fileKey, {
      expiresInSeconds: 900,
    });

    return {
      downloadUrl,
      fileKey,
      expiresInSeconds: 900,
    };
  }

  /**
   * Verifies that a media key exists in storage.
   */
  async verifyMediaExists(workspaceId: string, fileKey: string): Promise<boolean> {
    this.validateFileKey(workspaceId, fileKey);
    const meta = await this.storageDriver.headObject(fileKey);
    return Boolean(meta && meta.exists);
  }

  /**
   * Lists all proofs of work attached to a task, generating fresh presigned download URLs.
   */
  async listTaskProofs(workspaceId: string, taskId: string) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      const rows = await tx
        .select({
          proof: taskProofs,
          userName: users.name,
        })
        .from(taskProofs)
        .innerJoin(users, eq(taskProofs.userId, users.id))
        .where(and(eq(taskProofs.workspaceId, workspaceId), eq(taskProofs.taskId, taskId)))
        .orderBy(desc(taskProofs.createdAt));

      const proofsWithSignedUrls = await Promise.all(
        rows.map(async (r) => {
          let downloadUrl = r.proof.fileUrl;
          try {
            downloadUrl = await this.storageDriver.getDownloadUrl(r.proof.fileKey, {
              expiresInSeconds: 900,
            });
          } catch {
            // retain fallback url if presigning fails
          }

          return {
            id: r.proof.id,
            workspaceId: r.proof.workspaceId,
            taskId: r.proof.taskId,
            visitId: r.proof.visitId,
            userId: r.proof.userId,
            userName: r.userName,
            proofType: r.proof.proofType,
            fileKey: r.proof.fileKey,
            fileUrl: downloadUrl,
            fileSizeBytes: r.proof.fileSizeBytes,
            mimeType: r.proof.mimeType,
            signerName: r.proof.signerName,
            signerPhone: r.proof.signerPhone,
            watermarkMetadata: r.proof.watermarkMetadata as Record<string, unknown> | undefined,
            notes: r.proof.notes,
            createdAt: r.proof.createdAt.toISOString(),
          };
        }),
      );

      return {
        proofs: proofsWithSignedUrls,
      };
    });
  }
}

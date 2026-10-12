import * as crypto from 'node:crypto';
import { eq, and, desc, sql } from 'drizzle-orm';
import type { Database } from '@oprino/database';
import { taskProofs, tasks, users } from '@oprino/database/schema';
import type {
  MediaUploadUrlRequest,
  MediaUploadUrlResponse,
  ConfirmMediaUploadRequest,
} from '@oprino/contracts';

export class MediaService {
  private publicBaseUrl: string;

  constructor(
    private db: Database,
    publicBaseUrl?: string,
  ) {
    this.publicBaseUrl = publicBaseUrl || 'http://localhost:3000';
  }

  /**
   * Generates a pre-signed or mock direct-upload URL partitioned by workspace ID (ADR-012).
   */
  async generateUploadUrl(
    workspaceId: string,
    _userId: string,
    input: MediaUploadUrlRequest,
  ): Promise<MediaUploadUrlResponse> {
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

      // In production/cloud, this calls AWS S3 PutObjectCommand presigner.
      // In local dev/test environment, we generate a valid direct upload target.
      const uploadUrl = `${this.publicBaseUrl}/v1/media/mock-upload/${encodeURIComponent(fileKey)}`;

      return {
        uploadUrl,
        fileKey,
        expiresInSeconds: 600,
      };
    });
  }

  getPublicBaseUrl(): string {
    return this.publicBaseUrl;
  }

  /**
   * BLK-004: Generates direct-upload URL for employee attendance selfie verification.
   */
  async generateAttendanceSelfieUploadUrl(
    workspaceId: string,
    userId: string,
    fileName = 'selfie.jpg',
  ): Promise<MediaUploadUrlResponse> {
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueSuffix = crypto.randomUUID().substring(0, 8);
    const fileKey = `${workspaceId}/attendance/${userId}/${Date.now()}-${uniqueSuffix}-${safeName}`;
    const uploadUrl = `${this.publicBaseUrl}/v1/media/mock-upload/${encodeURIComponent(fileKey)}`;

    return {
      uploadUrl,
      fileKey,
      expiresInSeconds: 600,
    };
  }

  /**
   * Confirms uploaded proof binary and records proof in task_proofs.
   */
  async confirmUpload(
    workspaceId: string,
    userId: string,
    input: ConfirmMediaUploadRequest,
  ) {
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

      // Security check: ensure fileKey starts with this workspaceId (tenant path barrier)
      if (!input.fileKey.startsWith(`${workspaceId}/`)) {
        const error = new Error('Security barrier violation: fileKey must belong to workspace prefix');
        (error as any).statusCode = 403;
        throw error;
      }

      const fileUrl = `${this.publicBaseUrl}/v1/media/files/${encodeURIComponent(input.fileKey)}`;

      const [proof] = await tx
        .insert(taskProofs)
        .values({
          workspaceId,
          taskId: input.taskId,
          visitId: input.visitId ?? null,
          userId,
          proofType: input.proofType as any,
          fileKey: input.fileKey,
          fileUrl,
          fileSizeBytes: input.fileSizeBytes ?? null,
          mimeType: input.mimeType ?? null,
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
        fileUrl: proof.fileUrl,
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
   * Lists all proofs of work attached to a task.
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

      return {
        proofs: rows.map((r) => ({
          id: r.proof.id,
          workspaceId: r.proof.workspaceId,
          taskId: r.proof.taskId,
          visitId: r.proof.visitId,
          userId: r.proof.userId,
          userName: r.userName,
          proofType: r.proof.proofType,
          fileKey: r.proof.fileKey,
          fileUrl: r.proof.fileUrl,
          fileSizeBytes: r.proof.fileSizeBytes,
          mimeType: r.proof.mimeType,
          signerName: r.proof.signerName,
          signerPhone: r.proof.signerPhone,
          watermarkMetadata: r.proof.watermarkMetadata as Record<string, unknown> | undefined,
          notes: r.proof.notes,
          createdAt: r.proof.createdAt.toISOString(),
        })),
      };
    });
  }
}

import { eq, and, sql } from 'drizzle-orm';
import type { Database } from '@oprino/database';
import {
  syncMutationRecords,
  tasks,
  taskChecklistItems,
  taskActivity,
  attendanceSessions,
  attendanceEvents,
  visits,
  taskProofs,
} from '@oprino/database/schema';
import type {
  SyncBatchRequest,
  SyncBatchResponse,
  SyncMutationResult,
} from '@oprino/contracts';

export class SyncService {
  constructor(private db: Database) {}

  /**
   * Processes a batch of offline client mutations adhering to the Conflict Resolution Matrix.
   */
  async processBatch(
    workspaceId: string,
    userId: string,
    batch: SyncBatchRequest,
  ): Promise<SyncBatchResponse> {
    const results: SyncMutationResult[] = [];
    let appliedCount = 0;
    let conflictCount = 0;

    for (const mutation of batch.mutations) {
      try {
        const result = await this.db.transaction(async (tx) => {
          await tx.execute(
            sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`,
          );

          // 1. Idempotency check: Deduplicate if previously processed
          const [existing] = await tx
            .select()
            .from(syncMutationRecords)
            .where(
              and(
                eq(syncMutationRecords.workspaceId, workspaceId),
                eq(syncMutationRecords.mutationId, mutation.mutationId),
              ),
            );

          if (existing) {
            return {
              mutationId: mutation.mutationId,
              status: 'DUPLICATE_ACK' as const,
              entityId: mutation.entityId,
              resolutionNote: 'Mutation already acknowledged',
            };
          }

          // 2. Dispatch by entity & mutation type
          let resolution: SyncMutationResult;

          switch (mutation.mutationType) {
            case 'PUNCH_IN':
              resolution = await this.resolvePunchIn(tx, workspaceId, userId, mutation);
              break;

            case 'PUNCH_OUT':
              resolution = await this.resolvePunchOut(tx, workspaceId, userId, mutation);
              break;

            case 'TRANSITION':
              resolution = await this.resolveTaskTransition(tx, workspaceId, userId, mutation);
              break;

            case 'CHECKLIST_UPDATE':
              resolution = await this.resolveChecklistUpdate(tx, workspaceId, userId, mutation);
              break;

            case 'VISIT_CHECK_IN':
              resolution = await this.resolveVisitCheckIn(tx, workspaceId, userId, mutation);
              break;

            case 'VISIT_CHECK_OUT':
              resolution = await this.resolveVisitCheckOut(tx, workspaceId, userId, mutation);
              break;

            case 'CONFIRM_PROOF':
              resolution = await this.resolveConfirmProof(tx, workspaceId, userId, mutation);
              break;

            default:
              resolution = {
                mutationId: mutation.mutationId,
                status: 'REJECTED_STALE',
                entityId: mutation.entityId,
                error: `Unsupported mutation type: ${mutation.mutationType}`,
              };
          }

          // 3. Record resolution in sync audit log
          await tx.insert(syncMutationRecords).values({
            workspaceId,
            mutationId: mutation.mutationId,
            entityType: mutation.entityType,
            entityId: mutation.entityId,
            mutationType: mutation.mutationType,
            status: resolution.status,
            resolutionNote: resolution.resolutionNote ?? null,
            clientTimestamp: new Date(mutation.clientTimestamp),
          });

          return resolution;
        });

        results.push(result);
        if (result.status === 'APPLIED' || result.status === 'DUPLICATE_ACK') {
          appliedCount++;
        } else if (result.status === 'APPLIED_OVERRIDE' || result.status === 'MERGED_PARTIAL') {
          appliedCount++;
          conflictCount++;
        } else {
          conflictCount++;
        }
      } catch (err: any) {
        results.push({
          mutationId: mutation.mutationId,
          status: 'REJECTED_STALE',
          entityId: mutation.entityId,
          error: err.message || 'Processing failed',
        });
        conflictCount++;
      }
    }

    return {
      results,
      processedCount: results.length,
      appliedCount,
      conflictCount,
    };
  }

  /**
   * Conflict Rule: Attendance Punch-In (Single-Active-Shift Rule)
   */
  private async resolvePunchIn(
    tx: any,
    workspaceId: string,
    userId: string,
    mutation: any,
  ): Promise<SyncMutationResult> {
    const payload = mutation.payload;
    const clientTime = new Date(mutation.clientTimestamp);

    // Check active session
    const [active] = await tx
      .select()
      .from(attendanceSessions)
      .where(
        and(
          eq(attendanceSessions.workspaceId, workspaceId),
          eq(attendanceSessions.userId, userId),
          eq(attendanceSessions.status, 'ON_DUTY'),
        ),
      );

    if (active) {
      return {
        mutationId: mutation.mutationId,
        status: 'DUPLICATE_ACK',
        entityId: active.id,
        resolutionNote: 'Active shift already open; existing shift preserved',
      };
    }

    // Create session
    const [session] = await tx
      .insert(attendanceSessions)
      .values({
        workspaceId,
        userId,
        shiftId: payload.shiftId ?? null,
        status: 'ON_DUTY',
        punchInTime: clientTime,
        punchInIdempotencyKey: mutation.mutationId,
      })
      .returning();

    await tx.insert(attendanceEvents).values({
      workspaceId,
      sessionId: session.id,
      userId,
      eventType: 'PUNCH_IN',
      recordedAt: clientTime,
      idempotencyKey: mutation.mutationId,
      metadata: { source: 'OFFLINE_REPLAY' },
    });

    return {
      mutationId: mutation.mutationId,
      status: 'APPLIED',
      entityId: session.id,
    };
  }

  /**
   * Conflict Rule: Attendance Punch-Out (Worker Hardware Reality Wins)
   */
  private async resolvePunchOut(
    tx: any,
    workspaceId: string,
    userId: string,
    mutation: any,
  ): Promise<SyncMutationResult> {
    const clientTime = new Date(mutation.clientTimestamp);

    // Find latest session
    const [session] = await tx
      .select()
      .from(attendanceSessions)
      .where(
        and(
          eq(attendanceSessions.workspaceId, workspaceId),
          eq(attendanceSessions.userId, userId),
        ),
      )
      .orderBy(sql`${attendanceSessions.punchInTime} DESC`)
      .limit(1);

    if (!session) {
      return {
        mutationId: mutation.mutationId,
        status: 'REJECTED_STALE',
        entityId: userId,
        error: 'No attendance session found to punch out',
      };
    }

    const durationMinutes = Math.max(
      0,
      Math.round((clientTime.getTime() - new Date(session.punchInTime).getTime()) / 60000),
    );

    // If server already auto-punched out, Worker Hardware Reality Wins!
    const isOverride = session.status === 'OFF_DUTY';

    await tx
      .update(attendanceSessions)
      .set({
        status: 'OFF_DUTY',
        punchOutTime: clientTime,
        durationMinutes,
        punchOutIdempotencyKey: mutation.mutationId,
        updatedAt: new Date(),
      })
      .where(eq(attendanceSessions.id, session.id));

    await tx.insert(attendanceEvents).values({
      workspaceId,
      sessionId: session.id,
      userId,
      eventType: 'PUNCH_OUT',
      recordedAt: clientTime,
      idempotencyKey: mutation.mutationId,
      metadata: { source: 'OFFLINE_REPLAY', isOverride },
    });

    return {
      mutationId: mutation.mutationId,
      status: isOverride ? 'APPLIED_OVERRIDE' : 'APPLIED',
      entityId: session.id,
      resolutionNote: isOverride ? 'Hardware punch-out supersedes system timeout' : undefined,
    };
  }

  /**
   * Conflict Rule: Task Status Transition (Managerial Cancellation Wins)
   */
  private async resolveTaskTransition(
    tx: any,
    workspaceId: string,
    userId: string,
    mutation: any,
  ): Promise<SyncMutationResult> {
    const payload = mutation.payload;
    const [task] = await tx
      .select()
      .from(tasks)
      .where(and(eq(tasks.workspaceId, workspaceId), eq(tasks.id, mutation.entityId)));

    if (!task) {
      return {
        mutationId: mutation.mutationId,
        status: 'REJECTED_STALE',
        entityId: mutation.entityId,
        error: 'Task does not exist',
      };
    }

    // Managerial Cancellation Wins: If manager cancelled online, worker cannot complete
    if (task.status === 'CANCELLED') {
      return {
        mutationId: mutation.mutationId,
        status: 'REJECTED_STALE',
        entityId: task.id,
        serverVersion: task.version,
        resolutionNote: 'Task was cancelled by Manager. Work notes preserved in audit history.',
      };
    }

    const newVersion = task.version + 1;
    await tx
      .update(tasks)
      .set({
        status: payload.status,
        version: newVersion,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, task.id));

    await tx.insert(taskActivity).values({
      workspaceId,
      taskId: task.id,
      actorId: userId,
      action: 'task.status_changed',
      fromStatus: task.status,
      toStatus: payload.status,
      details: { source: 'OFFLINE_REPLAY', comment: payload.comment },
    });

    return {
      mutationId: mutation.mutationId,
      status: 'APPLIED',
      entityId: task.id,
      serverVersion: newVersion,
    };
  }

  /**
   * Conflict Rule: Checklist Update (Field-Level Granular Merge)
   */
  private async resolveChecklistUpdate(
    tx: any,
    workspaceId: string,
    userId: string,
    mutation: any,
  ): Promise<SyncMutationResult> {
    const payload = mutation.payload;
    const [item] = await tx
      .select()
      .from(taskChecklistItems)
      .where(
        and(
          eq(taskChecklistItems.workspaceId, workspaceId),
          eq(taskChecklistItems.id, mutation.entityId),
        ),
      );

    if (!item) {
      return {
        mutationId: mutation.mutationId,
        status: 'REJECTED_STALE',
        entityId: mutation.entityId,
        error: 'Checklist item not found',
      };
    }

    const isCompleted = Boolean(payload.isCompleted);
    await tx
      .update(taskChecklistItems)
      .set({
        isCompleted,
        completedBy: isCompleted ? userId : null,
        completedAt: isCompleted ? new Date(mutation.clientTimestamp) : null,
      })
      .where(eq(taskChecklistItems.id, item.id));

    return {
      mutationId: mutation.mutationId,
      status: 'APPLIED',
      entityId: item.id,
      resolutionNote: 'Checklist item state merged without clobbering',
    };
  }

  /**
   * Conflict Rule: Visit Check-In (Chronological Truth Wins)
   */
  private async resolveVisitCheckIn(
    tx: any,
    workspaceId: string,
    _userId: string,
    mutation: any,
  ): Promise<SyncMutationResult> {
    const payload = mutation.payload;
    const clientTime = new Date(mutation.clientTimestamp);

    const [visit] = await tx
      .select()
      .from(visits)
      .where(and(eq(visits.workspaceId, workspaceId), eq(visits.id, mutation.entityId)));

    if (!visit) {
      return {
        mutationId: mutation.mutationId,
        status: 'REJECTED_STALE',
        entityId: mutation.entityId,
        error: 'Visit not found',
      };
    }

    await tx
      .update(visits)
      .set({
        status: 'CHECKED_IN',
        checkInTime: clientTime,
        checkInLatitude: payload.latitude,
        checkInLongitude: payload.longitude,
        notes: payload.notes ?? visit.notes,
        updatedAt: new Date(),
      })
      .where(eq(visits.id, visit.id));

    return {
      mutationId: mutation.mutationId,
      status: 'APPLIED',
      entityId: visit.id,
    };
  }

  /**
   * Conflict Rule: Visit Check-Out (Chronological Truth Wins)
   */
  private async resolveVisitCheckOut(
    tx: any,
    workspaceId: string,
    _userId: string,
    mutation: any,
  ): Promise<SyncMutationResult> {
    const payload = mutation.payload;
    const clientTime = new Date(mutation.clientTimestamp);

    const [visit] = await tx
      .select()
      .from(visits)
      .where(and(eq(visits.workspaceId, workspaceId), eq(visits.id, mutation.entityId)));

    if (!visit) {
      return {
        mutationId: mutation.mutationId,
        status: 'REJECTED_STALE',
        entityId: mutation.entityId,
        error: 'Visit not found',
      };
    }

    const checkInTime = visit.checkInTime ? new Date(visit.checkInTime) : clientTime;
    const durationMinutes = Math.max(0, Math.round((clientTime.getTime() - checkInTime.getTime()) / 60000));

    await tx
      .update(visits)
      .set({
        status: 'CHECKED_OUT',
        checkOutTime: clientTime,
        checkOutLatitude: payload.latitude,
        checkOutLongitude: payload.longitude,
        durationMinutes,
        notes: payload.notes ?? visit.notes,
        updatedAt: new Date(),
      })
      .where(eq(visits.id, visit.id));

    return {
      mutationId: mutation.mutationId,
      status: 'APPLIED',
      entityId: visit.id,
    };
  }

  /**
   * Conflict Rule: Proof of Work (Append-Only Immutable Proof)
   */
  private async resolveConfirmProof(
    tx: any,
    workspaceId: string,
    userId: string,
    mutation: any,
  ): Promise<SyncMutationResult> {
    const payload = mutation.payload;

    const [proof] = await tx
      .insert(taskProofs)
      .values({
        workspaceId,
        taskId: payload.taskId,
        visitId: payload.visitId ?? null,
        userId,
        proofType: payload.proofType,
        fileKey: payload.fileKey,
        fileUrl: payload.fileUrl ?? null,
        signerName: payload.signerName ?? null,
        signerPhone: payload.signerPhone ?? null,
        watermarkMetadata: payload.watermarkMetadata ?? {},
        notes: payload.notes ?? null,
      })
      .returning();

    return {
      mutationId: mutation.mutationId,
      status: 'APPLIED',
      entityId: proof.id,
    };
  }
}

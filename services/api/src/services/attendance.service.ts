import { eq, and, ne, desc, sql } from 'drizzle-orm';
import type { Database } from '@oprino/database';
import {
  workspaces,
  attendanceShifts,
  attendanceSessions,
  attendanceEvents,
  users,
} from '@oprino/database/schema';
import type { MediaService } from './media.service.js';

export interface CreateShiftDto {
  name: string;
  startTime: string; // "09:00" or "22:00"
  endTime: string; // "17:00" or "06:00"
  timezone?: string;
}

export interface PunchInDto {
  idempotencyKey: string;
  shiftId?: string;
  note?: string;
  selfieMediaKey?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
}

export interface PunchOutDto {
  idempotencyKey: string;
  note?: string;
}

export class AttendanceService {
  constructor(
    private db: Database,
    private mediaService?: MediaService,
  ) {}

  /**
   * Creates a tenant-scoped shift schedule.
   */
  async createShift(workspaceId: string, creatorId: string, input: CreateShiftDto) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      const [shift] = await tx
        .insert(attendanceShifts)
        .values({
          workspaceId,
          name: input.name,
          startTime: input.startTime,
          endTime: input.endTime,
          timezone: input.timezone || 'UTC',
          isActive: true,
          createdBy: creatorId,
        })
        .returning();

      return {
        id: shift.id,
        workspaceId: shift.workspaceId,
        name: shift.name,
        startTime: shift.startTime,
        endTime: shift.endTime,
        timezone: shift.timezone,
        isActive: shift.isActive,
        createdAt: shift.createdAt.toISOString(),
        updatedAt: shift.updatedAt.toISOString(),
      };
    });
  }

  /**
   * Lists all active shifts in workspace.
   */
  async listShifts(workspaceId: string) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      const rows = await tx
        .select()
        .from(attendanceShifts)
        .where(
          and(eq(attendanceShifts.workspaceId, workspaceId), eq(attendanceShifts.isActive, true)),
        )
        .orderBy(desc(attendanceShifts.createdAt));

      return {
        shifts: rows.map((s: any) => ({
          id: s.id,
          workspaceId: s.workspaceId,
          name: s.name,
          startTime: s.startTime,
          endTime: s.endTime,
          timezone: s.timezone,
          isActive: s.isActive,
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
        })),
      };
    });
  }

  /**
   * Helper to format a session response.
   */
  private formatSession(
    row: any,
    userName?: string | null,
    userEmail?: string | null,
    shiftName?: string | null,
  ) {
    return {
      id: row.id,
      workspaceId: row.workspaceId,
      userId: row.userId,
      userName: userName ?? row.userName ?? undefined,
      userEmail: userEmail ?? row.userEmail ?? undefined,
      shiftId: row.shiftId,
      shiftName: shiftName ?? row.shiftName ?? undefined,
      status: row.status as 'ON_DUTY' | 'OFF_DUTY',
      punchInTime: row.punchInTime.toISOString(),
      punchOutTime: row.punchOutTime ? row.punchOutTime.toISOString() : null,
      durationMinutes: row.durationMinutes,
      selfieMediaKey: row.selfieMediaKey ?? null,
      punchInLatitude: row.punchInLatitude ?? null,
      punchInLongitude: row.punchInLongitude ?? null,
      punchInAccuracy: row.punchInAccuracy ?? null,
      isLate: row.isLate,
      lateMinutes: row.lateMinutes,
      isManualAdjustment: row.isManualAdjustment,
      adjustmentNote: row.adjustmentNote,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  /**
   * Punch In: Transition to ON_DUTY with authoritative server timestamp and idempotency.
   */
  async punchIn(workspaceId: string, userId: string, input: PunchInDto) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      // 1. Idempotency Check: if this punchInIdempotencyKey was already processed, return existing session
      const [existingByIdempotency] = await tx
        .select({
          session: attendanceSessions,
          userName: users.name,
          userEmail: users.email,
          shiftName: attendanceShifts.name,
        })
        .from(attendanceSessions)
        .leftJoin(users, eq(attendanceSessions.userId, users.id))
        .leftJoin(attendanceShifts, eq(attendanceSessions.shiftId, attendanceShifts.id))
        .where(
          and(
            eq(attendanceSessions.workspaceId, workspaceId),
            eq(attendanceSessions.userId, userId),
            eq(attendanceSessions.punchInIdempotencyKey, input.idempotencyKey),
          ),
        );

      if (existingByIdempotency) {
        return this.formatSession(
          existingByIdempotency.session,
          existingByIdempotency.userName,
          existingByIdempotency.userEmail,
          existingByIdempotency.shiftName,
        );
      }

      // 2. Concurrency Check: Check for active ON_DUTY session for this user in workspace
      const [activeSession] = await tx
        .select()
        .from(attendanceSessions)
        .where(
          and(
            eq(attendanceSessions.workspaceId, workspaceId),
            eq(attendanceSessions.userId, userId),
            eq(attendanceSessions.status, 'ON_DUTY'),
          ),
        );

      if (activeSession) {
        const error = new Error('Already on duty. Active session already exists.');
        (error as any).statusCode = 400;
        throw error;
      }

      // 3. Authoritative server timestamp
      const serverTimestamp = new Date();

      // 4. Shift evaluation & Late Calculation Foundation
      let isLate = false;
      let lateMinutes = 0;
      let shiftRecord: any = null;

      if (input.shiftId) {
        const [foundShift] = await tx
          .select()
          .from(attendanceShifts)
          .where(
            and(
              eq(attendanceShifts.workspaceId, workspaceId),
              eq(attendanceShifts.id, input.shiftId),
            ),
          );
        shiftRecord = foundShift;
      }

      if (shiftRecord) {
        // Compare shift start time with punch-in time in shift's target timezone
        const [shiftHours, shiftMins] = shiftRecord.startTime.split(':').map(Number);
        const shiftTz = shiftRecord.timezone || 'UTC';
        let punchHours = serverTimestamp.getUTCHours();
        let punchMins = serverTimestamp.getUTCMinutes();

        try {
          const parts = new Intl.DateTimeFormat('en-US', {
            timeZone: shiftTz,
            hour: 'numeric',
            minute: 'numeric',
            hourCycle: 'h23',
          }).formatToParts(serverTimestamp);

          for (const p of parts) {
            if (p.type === 'hour') {
              punchHours = Number(p.value);
            } else if (p.type === 'minute') {
              punchMins = Number(p.value);
            }
          }
        } catch {
          // If timezone string is invalid, fallback to UTC
          punchHours = serverTimestamp.getUTCHours();
          punchMins = serverTimestamp.getUTCMinutes();
        }

        const shiftTotalMins = shiftHours * 60 + shiftMins;
        const punchTotalMins = punchHours * 60 + punchMins;

        // If punch occurs after shift start time on regular same-day start (with 5 min grace)
        if (punchTotalMins > shiftTotalMins + 5) {
          isLate = true;
          lateMinutes = punchTotalMins - shiftTotalMins;
        }
      }

      // 4b. Company Attendance Policy Enforcement (BLK-004)
      const [ws] = await tx
        .select({ attendancePolicy: workspaces.attendancePolicy })
        .from(workspaces)
        .where(eq(workspaces.id, workspaceId))
        .limit(1);

      const policy = ws?.attendancePolicy ?? 'SIMPLE';

      if (policy === 'SELFIE_REQUIRED' || policy === 'GPS_AND_SELFIE_REQUIRED') {
        if (!input.selfieMediaKey) {
          const error: any = new Error(
            'A verified selfie photo is required to punch in under company attendance policy.',
          );
          error.statusCode = 400;
          error.code = 'MISSING_REQUIRED_SELFIE';
          throw error;
        }
      }

      if (policy === 'GPS_REQUIRED' || policy === 'GPS_AND_SELFIE_REQUIRED') {
        if (input.latitude === undefined || input.longitude === undefined) {
          const error: any = new Error(
            'GPS coordinates are required to punch in under company attendance policy.',
          );
          error.statusCode = 400;
          error.code = 'MISSING_REQUIRED_GPS';
          throw error;
        }
      }

      if (input.selfieMediaKey) {
        // Validate tenant barrier: must start with workspaceId/
        if (!input.selfieMediaKey.startsWith(`${workspaceId}/`)) {
          const error: any = new Error(
            'Security barrier violation: selfie photo must belong to active workspace',
          );
          error.statusCode = 403;
          error.code = 'FORBIDDEN_MEDIA_ACCESS';
          throw error;
        }

        // Ownership invariant: Employee cannot use another employee's selfie key
        const expectedSelfiePrefix = `${workspaceId}/attendance/${userId}/`;
        if (!input.selfieMediaKey.startsWith(expectedSelfiePrefix)) {
          const error: any = new Error(
            "Security barrier violation: cannot use another employee's attendance selfie",
          );
          error.statusCode = 403;
          error.code = 'FORBIDDEN_SELFIE_OWNERSHIP';
          throw error;
        }

        // Validate storage existence: ensure image binary was actually uploaded to storage
        if (this.mediaService) {
          this.mediaService.validateFileKey(workspaceId, input.selfieMediaKey);
          const meta = await this.mediaService.getStorageDriver().headObject(input.selfieMediaKey);
          if (!meta || !meta.exists) {
            const error: any = new Error(
              'Selfie photo binary does not exist in storage. The direct binary upload must complete before punching in.',
            );
            error.statusCode = 400;
            error.code = 'MISSING_SELFIE_BINARY';
            throw error;
          }

          if (meta.sizeBytes === 0) {
            const error: any = new Error('Selfie photo file in storage is empty (0 bytes).');
            error.statusCode = 400;
            error.code = 'EMPTY_SELFIE_BINARY';
            throw error;
          }

          if (meta.sizeBytes && meta.sizeBytes > 10 * 1024 * 1024) {
            const error: any = new Error('Selfie photo file exceeds 10MB limit.');
            error.statusCode = 400;
            error.code = 'OVERSIZED_SELFIE_BINARY';
            throw error;
          }
        }

        // Prevent replay of unrelated selfie evidence across sessions
        const [existingWithSelfie] = await tx
          .select({ id: attendanceSessions.id })
          .from(attendanceSessions)
          .where(
            and(
              eq(attendanceSessions.workspaceId, workspaceId),
              eq(attendanceSessions.selfieMediaKey, input.selfieMediaKey),
              ne(attendanceSessions.punchInIdempotencyKey, input.idempotencyKey),
            ),
          )
          .limit(1);

        if (existingWithSelfie) {
          const error: any = new Error(
            'Replay detected: This selfie evidence has already been submitted for another session.',
          );
          error.statusCode = 400;
          error.code = 'SELFIE_REPLAY_DETECTED';
          throw error;
        }
      }

      // 5. Insert new Attendance Session
      const [newSession] = await tx
        .insert(attendanceSessions)
        .values({
          workspaceId,
          userId,
          shiftId: input.shiftId ?? null,
          status: 'ON_DUTY',
          punchInTime: serverTimestamp,
          punchInIdempotencyKey: input.idempotencyKey,
          selfieMediaKey: input.selfieMediaKey ?? null,
          punchInLatitude: input.latitude ?? null,
          punchInLongitude: input.longitude ?? null,
          punchInAccuracy: input.accuracy ?? null,
          isLate,
          lateMinutes,
        })
        .returning();

      // 6. Record Attendance Event
      await tx.insert(attendanceEvents).values({
        workspaceId,
        sessionId: newSession.id,
        userId,
        eventType: 'PUNCH_IN',
        recordedAt: serverTimestamp,
        idempotencyKey: input.idempotencyKey,
        metadata: {
          note: input.note ?? null,
          selfieMediaKey: input.selfieMediaKey ?? null,
          latitude: input.latitude ?? null,
          longitude: input.longitude ?? null,
          serverTimestamp: serverTimestamp.toISOString(),
          isLate,
          lateMinutes,
        },
      });

      const [user] = await tx.select().from(users).where(eq(users.id, userId));

      return this.formatSession(newSession, user?.name, user?.email, shiftRecord?.name);
    });
  }

  /**
   * Punch Out: Transition from ON_DUTY to OFF_DUTY with duration calculation.
   */
  async punchOut(workspaceId: string, userId: string, input: PunchOutDto) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      // 1. Idempotency Check: if this punchOutIdempotencyKey was already processed, return closed session
      const [existingByIdempotency] = await tx
        .select({
          session: attendanceSessions,
          userName: users.name,
          userEmail: users.email,
          shiftName: attendanceShifts.name,
        })
        .from(attendanceSessions)
        .leftJoin(users, eq(attendanceSessions.userId, users.id))
        .leftJoin(attendanceShifts, eq(attendanceSessions.shiftId, attendanceShifts.id))
        .where(
          and(
            eq(attendanceSessions.workspaceId, workspaceId),
            eq(attendanceSessions.userId, userId),
            eq(attendanceSessions.punchOutIdempotencyKey, input.idempotencyKey),
          ),
        );

      if (existingByIdempotency) {
        return this.formatSession(
          existingByIdempotency.session,
          existingByIdempotency.userName,
          existingByIdempotency.userEmail,
          existingByIdempotency.shiftName,
        );
      }

      // 2. Find currently active ON_DUTY session
      const [activeSession] = await tx
        .select()
        .from(attendanceSessions)
        .where(
          and(
            eq(attendanceSessions.workspaceId, workspaceId),
            eq(attendanceSessions.userId, userId),
            eq(attendanceSessions.status, 'ON_DUTY'),
          ),
        );

      if (!activeSession) {
        const error = new Error('No active attendance session found to punch out from.');
        (error as any).statusCode = 400;
        throw error;
      }

      // 3. Authoritative server timestamp & duration calculation
      const serverTimestamp = new Date();
      const punchInMillis = activeSession.punchInTime.getTime();
      const punchOutMillis = serverTimestamp.getTime();
      const durationMinutes = Math.max(0, Math.round((punchOutMillis - punchInMillis) / 60000));

      // 4. Update session to OFF_DUTY
      const [updatedSession] = await tx
        .update(attendanceSessions)
        .set({
          status: 'OFF_DUTY',
          punchOutTime: serverTimestamp,
          durationMinutes,
          punchOutIdempotencyKey: input.idempotencyKey,
          updatedAt: serverTimestamp,
        })
        .where(
          and(
            eq(attendanceSessions.workspaceId, workspaceId),
            eq(attendanceSessions.id, activeSession.id),
          ),
        )
        .returning();

      // 5. Record Attendance Event
      await tx.insert(attendanceEvents).values({
        workspaceId,
        sessionId: updatedSession.id,
        userId,
        eventType: 'PUNCH_OUT',
        recordedAt: serverTimestamp,
        idempotencyKey: input.idempotencyKey,
        metadata: {
          note: input.note ?? null,
          durationMinutes,
          serverTimestamp: serverTimestamp.toISOString(),
        },
      });

      const [user] = await tx.select().from(users).where(eq(users.id, userId));
      let shiftName: string | undefined;
      if (updatedSession.shiftId) {
        const [shift] = await tx
          .select({ name: attendanceShifts.name })
          .from(attendanceShifts)
          .where(eq(attendanceShifts.id, updatedSession.shiftId));
        shiftName = shift?.name;
      }

      return this.formatSession(updatedSession, user?.name, user?.email, shiftName);
    });
  }

  /**
   * Retrieves current user attendance state.
   */
  async getCurrentAttendance(workspaceId: string, userId: string) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      // Check for active session
      const [active] = await tx
        .select({
          session: attendanceSessions,
          userName: users.name,
          userEmail: users.email,
          shiftName: attendanceShifts.name,
        })
        .from(attendanceSessions)
        .leftJoin(users, eq(attendanceSessions.userId, users.id))
        .leftJoin(attendanceShifts, eq(attendanceSessions.shiftId, attendanceShifts.id))
        .where(
          and(
            eq(attendanceSessions.workspaceId, workspaceId),
            eq(attendanceSessions.userId, userId),
            eq(attendanceSessions.status, 'ON_DUTY'),
          ),
        );

      // Check for last session
      const [last] = await tx
        .select({
          session: attendanceSessions,
          userName: users.name,
          userEmail: users.email,
          shiftName: attendanceShifts.name,
        })
        .from(attendanceSessions)
        .leftJoin(users, eq(attendanceSessions.userId, users.id))
        .leftJoin(attendanceShifts, eq(attendanceSessions.shiftId, attendanceShifts.id))
        .where(
          and(
            eq(attendanceSessions.workspaceId, workspaceId),
            eq(attendanceSessions.userId, userId),
          ),
        )
        .orderBy(desc(attendanceSessions.punchInTime))
        .limit(1);

      const serverTime = new Date().toISOString();

      let dutyState: 'NOT_STARTED' | 'ON_DUTY' | 'OFF_DUTY' = 'NOT_STARTED';
      if (active) {
        dutyState = 'ON_DUTY';
      } else if (last) {
        dutyState = 'OFF_DUTY';
      }

      return {
        dutyState,
        activeSession: active
          ? this.formatSession(active.session, active.userName, active.userEmail, active.shiftName)
          : null,
        lastSession: last
          ? this.formatSession(last.session, last.userName, last.userEmail, last.shiftName)
          : null,
        assignedShift: null,
        serverTime,
      };
    });
  }

  /**
   * Retrieves individual user attendance history.
   */
  async getAttendanceHistory(workspaceId: string, userId: string, limit = 50, offset = 0) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      const rows = await tx
        .select({
          session: attendanceSessions,
          userName: users.name,
          userEmail: users.email,
          shiftName: attendanceShifts.name,
        })
        .from(attendanceSessions)
        .leftJoin(users, eq(attendanceSessions.userId, users.id))
        .leftJoin(attendanceShifts, eq(attendanceSessions.shiftId, attendanceShifts.id))
        .where(
          and(
            eq(attendanceSessions.workspaceId, workspaceId),
            eq(attendanceSessions.userId, userId),
          ),
        )
        .orderBy(desc(attendanceSessions.punchInTime))
        .limit(limit)
        .offset(offset);

      return {
        sessions: rows.map((r: any) =>
          this.formatSession(r.session, r.userName, r.userEmail, r.shiftName),
        ),
        total: rows.length,
      };
    });
  }

  /**
   * Manager / Admin view: overview of team attendance across the workspace.
   */
  async getTeamAttendance(workspaceId: string) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      const allActive = await tx
        .select({
          session: attendanceSessions,
          userName: users.name,
          userEmail: users.email,
          shiftName: attendanceShifts.name,
        })
        .from(attendanceSessions)
        .leftJoin(users, eq(attendanceSessions.userId, users.id))
        .leftJoin(attendanceShifts, eq(attendanceSessions.shiftId, attendanceShifts.id))
        .where(
          and(
            eq(attendanceSessions.workspaceId, workspaceId),
            eq(attendanceSessions.status, 'ON_DUTY'),
          ),
        )
        .orderBy(desc(attendanceSessions.punchInTime));

      const recentHistory = await tx
        .select({
          session: attendanceSessions,
          userName: users.name,
          userEmail: users.email,
          shiftName: attendanceShifts.name,
        })
        .from(attendanceSessions)
        .leftJoin(users, eq(attendanceSessions.userId, users.id))
        .leftJoin(attendanceShifts, eq(attendanceSessions.shiftId, attendanceShifts.id))
        .where(
          and(
            eq(attendanceSessions.workspaceId, workspaceId),
            eq(attendanceSessions.status, 'OFF_DUTY'),
          ),
        )
        .orderBy(desc(attendanceSessions.punchOutTime))
        .limit(50);

      return {
        onDutyCount: allActive.length,
        offDutyCount: recentHistory.length,
        activeSessions: allActive.map((r: any) =>
          this.formatSession(r.session, r.userName, r.userEmail, r.shiftName),
        ),
        history: recentHistory.map((r: any) =>
          this.formatSession(r.session, r.userName, r.userEmail, r.shiftName),
        ),
      };
    });
  }
}

import { eq, and, sql } from 'drizzle-orm';
import type { Database } from '@oprino/database';
import { userDevices, auditLogs, sessions, users } from '@oprino/database/schema';

export interface RegisterDeviceInput {
  installationId: string;
  platform: 'android' | 'ios' | 'web';
  deviceModel?: string;
  osVersion?: string;
  appVersion?: string;
  pushToken?: string;
}

export interface DeviceGovernanceStatus {
  exists: boolean;
  status: 'pending' | 'active' | 'revoked' | 'unregistered';
  isTrusted: boolean;
  device?: {
    id: string;
    installationId: string;
    platform: string;
    status: string;
    isTrusted: boolean;
    lastActiveAt: string;
    enrolledAt?: string;
    revokedAt?: string | null;
  };
}

export class DeviceService {
  constructor(private db: Database) {}

  /**
   * Registers or updates an installation ID and device hardware telemetry.
   * Invariant: A revoked installation cannot autonomously restore trust.
   * If a user already has a revoked device in the workspace, a new installation ID
   * is placed into PENDING state to prevent UUID-regeneration bypass.
   */
  async registerDevice(userId: string, input: RegisterDeviceInput, workspaceId?: string) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.bypass_rls', 'on', true)`);

      const [existing] = await tx
        .select()
        .from(userDevices)
        .where(
          and(eq(userDevices.userId, userId), eq(userDevices.installationId, input.installationId)),
        );

      let deviceRecord;

      if (existing) {
        // If already revoked, NEVER auto-re-trust without administrative action
        const isRevoked = existing.status === 'revoked' || !existing.isTrusted;
        const status = isRevoked ? 'revoked' : existing.status;
        const isTrusted = !isRevoked;

        const [updated] = await tx
          .update(userDevices)
          .set({
            platform: input.platform,
            deviceModel: input.deviceModel ?? existing.deviceModel,
            osVersion: input.osVersion ?? existing.osVersion,
            appVersion: input.appVersion ?? existing.appVersion,
            pushToken: input.pushToken ?? existing.pushToken,
            workspaceId: workspaceId ?? existing.workspaceId,
            lastActiveAt: new Date(),
            updatedAt: new Date(),
            status,
            isTrusted,
          })
          .where(eq(userDevices.id, existing.id))
          .returning();

        deviceRecord = updated;
      } else {
        // Check if user has ANY revoked device record
        const revokedExisting = await tx
          .select({ id: userDevices.id })
          .from(userDevices)
          .where(and(eq(userDevices.userId, userId), eq(userDevices.status, 'revoked')))
          .limit(1);

        // If user previously had a revoked installation, new installation defaults to 'pending'
        const initialStatus = revokedExisting.length > 0 ? 'pending' : 'active';
        const initialTrusted = initialStatus === 'active';

        const [inserted] = await tx
          .insert(userDevices)
          .values({
            userId,
            workspaceId,
            installationId: input.installationId,
            platform: input.platform,
            deviceModel: input.deviceModel,
            osVersion: input.osVersion,
            appVersion: input.appVersion,
            pushToken: input.pushToken,
            status: initialStatus,
            isTrusted: initialTrusted,
            lastActiveAt: new Date(),
            enrolledAt: new Date(),
          })
          .returning();

        deviceRecord = inserted;
      }

      if (!deviceRecord) {
        throw new Error('Failed to register device installation');
      }

      // Audit Log
      if (workspaceId) {
        await tx.insert(auditLogs).values({
          workspaceId,
          actorId: userId,
          action: 'device.registered',
          targetType: 'device',
          targetId: deviceRecord.installationId,
          metadata: {
            platform: deviceRecord.platform,
            deviceModel: deviceRecord.deviceModel,
            appVersion: deviceRecord.appVersion,
            status: deviceRecord.status,
            isTrusted: deviceRecord.isTrusted,
          },
        });
      }

      return {
        id: deviceRecord.id,
        installationId: deviceRecord.installationId,
        platform: deviceRecord.platform,
        deviceModel: deviceRecord.deviceModel,
        osVersion: deviceRecord.osVersion,
        appVersion: deviceRecord.appVersion,
        status: deviceRecord.status,
        isTrusted: deviceRecord.isTrusted,
        lastActiveAt: deviceRecord.lastActiveAt.toISOString(),
        enrolledAt: deviceRecord.enrolledAt?.toISOString(),
        revokedAt: deviceRecord.revokedAt?.toISOString() ?? null,
      };
    });
  }

  /**
   * Lists all devices registered to a specific user.
   */
  async listUserDevices(userId: string) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.bypass_rls', 'on', true)`);

      const rows = await tx.select().from(userDevices).where(eq(userDevices.userId, userId));

      return rows.map((r) => ({
        id: r.id,
        installationId: r.installationId,
        platform: r.platform,
        deviceModel: r.deviceModel,
        osVersion: r.osVersion,
        appVersion: r.appVersion,
        status: r.status,
        isTrusted: r.isTrusted,
        lastActiveAt: r.lastActiveAt.toISOString(),
        enrolledAt: r.enrolledAt?.toISOString(),
        revokedAt: r.revokedAt?.toISOString() ?? null,
      }));
    });
  }

  /**
   * Lists all devices in a workspace (administrative view).
   */
  async listWorkspaceDevices(workspaceId: string) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      const rows = await tx
        .select({
          device: userDevices,
          userName: users.name,
          userEmail: users.email,
        })
        .from(userDevices)
        .innerJoin(users, eq(userDevices.userId, users.id))
        .where(eq(userDevices.workspaceId, workspaceId));

      return rows.map((r) => ({
        id: r.device.id,
        userId: r.device.userId,
        userName: r.userName,
        userEmail: r.userEmail,
        installationId: r.device.installationId,
        platform: r.device.platform,
        deviceModel: r.device.deviceModel,
        osVersion: r.device.osVersion,
        appVersion: r.device.appVersion,
        status: r.device.status,
        isTrusted: r.device.isTrusted,
        lastActiveAt: r.device.lastActiveAt.toISOString(),
        enrolledAt: r.device.enrolledAt?.toISOString(),
        revokedAt: r.device.revokedAt?.toISOString() ?? null,
      }));
    });
  }

  /**
   * Revokes an installation by installation ID.
   * Atomically invalidates all sessions bound to this installation and sets status to revoked.
   */
  async revokeDevice(
    targetUserId: string,
    installationId: string,
    actorId: string,
    workspaceId?: string,
  ) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.bypass_rls', 'on', true)`);

      const [updated] = await tx
        .update(userDevices)
        .set({
          status: 'revoked',
          isTrusted: false,
          revokedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(userDevices.userId, targetUserId),
            eq(userDevices.installationId, installationId),
          ),
        )
        .returning();

      if (!updated) {
        const err = new Error('Device not found or not owned by specified user');
        (err as any).statusCode = 404;
        throw err;
      }

      // CRITICAL SECURITY CONTROL: Drop all active server-side sessions bound to this installation
      await tx
        .delete(sessions)
        .where(
          and(
            eq(sessions.userId, targetUserId),
            eq(sessions.installationId, installationId),
          ),
        );

      if (workspaceId || updated.workspaceId) {
        await tx.insert(auditLogs).values({
          workspaceId: (workspaceId || updated.workspaceId)!,
          actorId,
          action: 'device.revoked',
          targetType: 'device',
          targetId: installationId,
          metadata: {
            targetUserId,
            platform: updated.platform,
            deviceModel: updated.deviceModel,
          },
        });
      }

      return {
        success: true,
        message: 'Device installation revoked and active sessions invalidated successfully',
      };
    });
  }

  /**
   * Approves a PENDING installation, granting trusted active access.
   */
  async approveDevice(
    targetUserId: string,
    installationId: string,
    actorId: string,
    workspaceId: string,
  ) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      const [updated] = await tx
        .update(userDevices)
        .set({
          status: 'active',
          isTrusted: true,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(userDevices.userId, targetUserId),
            eq(userDevices.installationId, installationId),
          ),
        )
        .returning();

      if (!updated) {
        const err = new Error('Device not found');
        (err as any).statusCode = 404;
        throw err;
      }

      await tx.insert(auditLogs).values({
        workspaceId,
        actorId,
        action: 'device.approved',
        targetType: 'device',
        targetId: installationId,
        metadata: {
          targetUserId,
          platform: updated.platform,
        },
      });

      return {
        success: true,
        message: 'Device installation approved successfully',
      };
    });
  }

  /**
   * Evaluates comprehensive governance status for an installation.
   */
  async getInstallationGovernance(
    userId: string,
    installationId: string,
  ): Promise<DeviceGovernanceStatus> {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.bypass_rls', 'on', true)`);

      const [device] = await tx
        .select()
        .from(userDevices)
        .where(
          and(eq(userDevices.userId, userId), eq(userDevices.installationId, installationId)),
        );

      if (!device) {
        return {
          exists: false,
          status: 'unregistered',
          isTrusted: false,
        };
      }

      const status =
        device.status === 'revoked' || !device.isTrusted
          ? 'revoked'
          : device.status === 'pending'
            ? 'pending'
            : 'active';

      return {
        exists: true,
        status,
        isTrusted: device.isTrusted,
        device: {
          id: device.id,
          installationId: device.installationId,
          platform: device.platform,
          status: device.status,
          isTrusted: device.isTrusted,
          lastActiveAt: device.lastActiveAt.toISOString(),
          enrolledAt: device.enrolledAt?.toISOString(),
          revokedAt: device.revokedAt?.toISOString() ?? null,
        },
      };
    });
  }

  /**
   * Checks if an installation is revoked (backward-compatible check).
   */
  async isInstallationRevoked(userId: string, installationId: string): Promise<boolean> {
    const gov = await this.getInstallationGovernance(userId, installationId);
    return gov.status === 'revoked';
  }
}

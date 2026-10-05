import { eq, and, sql } from 'drizzle-orm';
import type { Database } from '@oprino/database';
import { userDevices, auditLogs } from '@oprino/database/schema';

export interface RegisterDeviceInput {
  installationId: string;
  platform: 'android' | 'ios' | 'web';
  deviceModel?: string;
  osVersion?: string;
  appVersion?: string;
  pushToken?: string;
}

export class DeviceService {
  constructor(private db: Database) {}

  /**
   * Registers or updates an installation ID and device hardware telemetry.
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
        // If revoked, do not auto-re-trust without administrative action
        const shouldTrust = existing.status === 'revoked' || !existing.isTrusted ? false : true;
        const status = shouldTrust ? 'active' : 'revoked';

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
            isTrusted: shouldTrust,
          })
          .where(eq(userDevices.id, existing.id))
          .returning();

        deviceRecord = updated;
      } else {
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
            status: 'active',
            isTrusted: true,
            lastActiveAt: new Date(),
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
      }));
    });
  }

  /**
   * Revokes an installation by installation ID.
   */
  async revokeDevice(userId: string, installationId: string, workspaceId?: string) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.bypass_rls', 'on', true)`);

      const [updated] = await tx
        .update(userDevices)
        .set({
          status: 'revoked',
          isTrusted: false,
          updatedAt: new Date(),
        })
        .where(and(eq(userDevices.userId, userId), eq(userDevices.installationId, installationId)))
        .returning();

      if (!updated) {
        const err = new Error('Device not found or not owned by user');
        (err as any).statusCode = 404;
        throw err;
      }

      if (workspaceId || updated.workspaceId) {
        await tx.insert(auditLogs).values({
          workspaceId: (workspaceId || updated.workspaceId)!,
          actorId: userId,
          action: 'device.revoked',
          targetType: 'device',
          targetId: installationId,
          metadata: {
            platform: updated.platform,
            deviceModel: updated.deviceModel,
          },
        });
      }

      return {
        success: true,
        message: 'Device installation revoked successfully',
      };
    });
  }

  /**
   * Checks if an installation is revoked.
   */
  async isInstallationRevoked(userId: string, installationId: string): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.bypass_rls', 'on', true)`);

      const [device] = await tx
        .select({
          status: userDevices.status,
          isTrusted: userDevices.isTrusted,
        })
        .from(userDevices)
        .where(and(eq(userDevices.userId, userId), eq(userDevices.installationId, installationId)));

      if (!device) return false;
      return device.status === 'revoked' || !device.isTrusted;
    });
  }
}

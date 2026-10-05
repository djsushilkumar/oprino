import type { FastifyPluginAsync } from 'fastify';
import type { Database } from '@oprino/database';
import type { createAuthMiddleware } from '../middleware/auth.js';
import {
  workspaces,
  workspaceMemberships,
  roles,
  rolePermissions,
  userDevices,
} from '@oprino/database/schema';
import { eq, and, sql } from 'drizzle-orm';

export interface MeRoutesOptions {
  db: Database;
  authMiddleware: ReturnType<typeof createAuthMiddleware>;
}

export const meRoutes: FastifyPluginAsync<MeRoutesOptions> = async (app, options) => {
  const { db, authMiddleware } = options;

  app.get('/v1/me', { preHandler: [authMiddleware.authenticate] }, async (req, reply) => {
    const userId = req.user!.id;
    const requestedWorkspaceId =
      (req.headers['x-workspace-id'] as string | undefined) ||
      req.session?.activeWorkspaceId ||
      null;

    const installationId = req.headers['x-installation-id'] as string | undefined;

    const context = await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.bypass_rls', 'on', true)`);

      let activeWorkspace = null;
      let membership = null;
      let role = null;
      let permissions: string[] = [];

      if (requestedWorkspaceId) {
        const [wsRecord] = await tx
          .select({
            id: workspaces.id,
            name: workspaces.name,
            slug: workspaces.slug,
            status: workspaces.status,
            membershipId: workspaceMemberships.id,
            membershipStatus: workspaceMemberships.status,
            roleId: roles.id,
            roleName: roles.name,
          })
          .from(workspaces)
          .innerJoin(
            workspaceMemberships,
            and(
              eq(workspaceMemberships.workspaceId, workspaces.id),
              eq(workspaceMemberships.userId, userId),
            ),
          )
          .innerJoin(roles, eq(workspaceMemberships.roleId, roles.id))
          .where(eq(workspaces.id, requestedWorkspaceId));

        if (wsRecord && wsRecord.membershipStatus !== 'removed') {
          activeWorkspace = {
            id: wsRecord.id,
            name: wsRecord.name,
            slug: wsRecord.slug,
            status: wsRecord.status,
          };
          membership = {
            id: wsRecord.membershipId,
            status: wsRecord.membershipStatus,
          };
          role = {
            id: wsRecord.roleId,
            name: wsRecord.roleName,
          };

          if (wsRecord.membershipStatus === 'active') {
            const perms = await tx
              .select({ permission: rolePermissions.permission })
              .from(rolePermissions)
              .where(eq(rolePermissions.roleId, wsRecord.roleId));

            permissions = perms.map((p) => p.permission);
          }
        }
      }

      let currentInstallation = null;
      if (installationId) {
        const [device] = await tx
          .select({
            id: userDevices.id,
            installationId: userDevices.installationId,
            status: userDevices.status,
            isTrusted: userDevices.isTrusted,
          })
          .from(userDevices)
          .where(
            and(eq(userDevices.userId, userId), eq(userDevices.installationId, installationId)),
          );

        if (device) {
          currentInstallation = device;
        }
      }

      return {
        activeWorkspace,
        membership,
        role,
        permissions,
        currentInstallation,
      };
    });

    return reply.status(200).send({
      user: {
        id: req.user!.id,
        email: req.user!.email,
        name: req.user!.name,
        emailVerified: req.user!.emailVerified,
        image: req.user!.image ?? null,
      },
      activeWorkspace: context.activeWorkspace,
      membership: context.membership,
      role: context.role,
      permissions: context.permissions,
      currentInstallation: context.currentInstallation,
    });
  });
};

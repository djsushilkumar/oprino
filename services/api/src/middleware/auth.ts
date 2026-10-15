import type { FastifyRequest, FastifyReply } from 'fastify';
import type { Auth } from '../auth/better-auth.js';
import type { DeviceService } from '../services/device.service.js';
import type { Database } from '@oprino/database';
import { workspaceMemberships, roles, rolePermissions, workspaces } from '@oprino/database/schema';
import { eq, and, sql } from 'drizzle-orm';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      name: string;
      emailVerified: boolean;
      image?: string | null;
    };
    session?: {
      id: string;
      userId: string;
      token: string;
      expiresAt: Date;
      activeWorkspaceId?: string | null;
    };
    installationId?: string;
    workspaceId?: string;
    membership?: {
      id: string;
      status: string;
      roleId: string;
    };
    role?: {
      id: string;
      name: string;
    };
    permissions?: string[];
  }
}

export function createAuthMiddleware(auth: Auth, deviceService: DeviceService, db: Database) {
  /**
   * Stage 1: Authenticate Identity & Verify Installation Governance
   */
  async function authenticate(req: FastifyRequest, reply: FastifyReply) {
    try {
      const query = req.query as Record<string, string> | undefined;
      const headers = { ...(req.headers as Record<string, string>) };

      const session = await auth.api.getSession({
        headers,
      });

      if (!session || !session.user) {
        return reply.status(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Authentication required. Missing or expired session.',
        });
      }

      req.user = session.user as any;
      req.session = session.session as any;

      // Stage 1B: Device / Installation Governance Check
      const installationId =
        (req.headers['x-installation-id'] as string | undefined) || query?.installationId;
      if (installationId) {
        req.installationId = installationId;
        const isRevoked = await deviceService.isInstallationRevoked(req.user!.id, installationId);

        if (isRevoked) {
          return reply.status(401).send({
            error: {
              code: 'DEVICE_REVOKED',
              message: 'This installation has been de-authorized by an administrator.',
              statusCode: 401,
            },
          });
        }
      }
    } catch (err: any) {
      req.log.error(err, 'Authentication error');
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid session token',
      });
    }
  }

  /**
   * Stage 2 & 3: Workspace Membership Verification & Active Tenant Context Resolution
   */
  async function requireWorkspace(req: FastifyRequest, reply: FastifyReply) {
    if (!req.user) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    const query = req.query as Record<string, string> | undefined;
    const requestedWorkspaceId =
      (req.headers['x-workspace-id'] as string | undefined) ||
      query?.workspaceId ||
      req.session?.activeWorkspaceId ||
      undefined;

    if (!requestedWorkspaceId) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message:
          'Active workspace context required. Provide X-Workspace-Id header or activate workspace.',
      });
    }

    // 5-Stage Verification query
    const result = await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.bypass_rls', 'on', true)`);

      const [record] = await tx
        .select({
          membershipId: workspaceMemberships.id,
          membershipStatus: workspaceMemberships.status,
          roleId: workspaceMemberships.roleId,
          roleName: roles.name,
          workspaceId: workspaces.id,
          workspaceStatus: workspaces.status,
        })
        .from(workspaceMemberships)
        .innerJoin(roles, eq(workspaceMemberships.roleId, roles.id))
        .innerJoin(workspaces, eq(workspaceMemberships.workspaceId, workspaces.id))
        .where(
          and(
            eq(workspaceMemberships.userId, req.user!.id),
            eq(workspaceMemberships.workspaceId, requestedWorkspaceId),
          ),
        );

      if (!record || record.membershipStatus === 'removed') {
        return { error: 'invalid', message: 'Invalid or inactive workspace membership' };
      }

      if (record.membershipStatus === 'suspended') {
        return { error: 'suspended', message: 'Membership is suspended' };
      }

      // Fetch permissions
      const perms = await tx
        .select({ permission: rolePermissions.permission })
        .from(rolePermissions)
        .where(eq(rolePermissions.roleId, record.roleId));

      return {
        record,
        permissions: perms.map((p) => p.permission),
      };
    });

    if ('error' in result) {
      return reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: result.message,
      });
    }

    req.workspaceId = result.record.workspaceId;
    req.membership = {
      id: result.record.membershipId,
      status: result.record.membershipStatus,
      roleId: result.record.roleId,
    };
    req.role = {
      id: result.record.roleId,
      name: result.record.roleName,
    };
    req.permissions = result.permissions;
  }

  /**
   * Permission Evaluator Guard
   */
  function requirePermission(permission: string) {
    return async (req: FastifyRequest, reply: FastifyReply) => {
      if (!req.permissions || !req.permissions.includes(permission)) {
        return reply.status(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: `Permission denied: required capability '${permission}' is not granted to your current role.`,
        });
      }
    };
  }

  return {
    authenticate,
    requireWorkspace,
    requirePermission,
  };
}

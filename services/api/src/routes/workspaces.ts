import type { FastifyPluginAsync } from 'fastify';
import type { WorkspaceService } from '../services/workspace.service.js';
import type { createAuthMiddleware } from '../middleware/auth.js';
import type { Auth } from '../auth/better-auth.js';
import {
  CreateWorkspaceRequestSchema,
  SwitchWorkspaceRequestSchema,
  AddWorkspaceMemberRequestSchema,
} from '@oprino/contracts';
import { PERMISSIONS } from '../auth/permissions.js';

export interface WorkspaceRoutesOptions {
  workspaceService: WorkspaceService;
  authMiddleware: ReturnType<typeof createAuthMiddleware>;
  auth?: Auth;
}

export const workspaceRoutes: FastifyPluginAsync<WorkspaceRoutesOptions> = async (app, options) => {
  const { workspaceService, authMiddleware, auth } = options;

  // POST /v1/workspaces - Create Workspace atomically
  app.post('/v1/workspaces', { preHandler: [authMiddleware.authenticate] }, async (req, reply) => {
    const parsed = CreateWorkspaceRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid workspace payload',
        details: parsed.error.issues,
      });
    }

    try {
      const workspace = await workspaceService.createWorkspaceAtomic(
        req.user!.id,
        parsed.data,
        req.session?.id,
      );

      return reply.status(201).send(workspace);
    } catch (err: any) {
      req.log.error(err, 'Failed to create workspace');
      return reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: err.message || 'Failed to provision workspace',
      });
    }
  });

  // GET /v1/workspaces - List all valid workspaces for authenticated user
  app.get('/v1/workspaces', { preHandler: [authMiddleware.authenticate] }, async (req, reply) => {
    try {
      const workspacesList = await workspaceService.listUserWorkspaces(req.user!.id);
      return reply.status(200).send({ workspaces: workspacesList });
    } catch (err: any) {
      req.log.error(err, 'Failed to list workspaces');
      return reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to retrieve workspaces',
      });
    }
  });

  // POST /v1/session/workspace - Switch active workspace
  app.post(
    '/v1/session/workspace',
    { preHandler: [authMiddleware.authenticate] },
    async (req, reply) => {
      const parsed = SwitchWorkspaceRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid switch workspace payload',
          details: parsed.error.issues,
        });
      }

      try {
        const result = await workspaceService.switchActiveWorkspace(
          req.user!.id,
          parsed.data.workspaceId,
          req.session?.id,
        );

        return reply.status(200).send(result);
      } catch (err: any) {
        const status = err.statusCode || 400;
        return reply.status(status).send({
          statusCode: status,
          error: err.code || 'SWITCH_WORKSPACE_FAILED',
          message: err.message || 'Failed to switch workspace context',
        });
      }
    },
  );

  // GET /v1/workspaces/members - List members of active workspace
  app.get(
    '/v1/workspaces/members',
    { preHandler: [authMiddleware.authenticate, authMiddleware.requireWorkspace] },
    async (req, reply) => {
      try {
        const members = await workspaceService.listWorkspaceMembers(req.workspaceId!);
        return reply.status(200).send({ members });
      } catch (err: any) {
        req.log.error(err, 'Failed to list workspace members');
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to retrieve workspace members',
        });
      }
    },
  );

  // POST /v1/workspaces/members - Add a new member to the active workspace
  app.post(
    '/v1/workspaces/members',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.MEMBERS_MANAGE),
      ],
    },
    async (req, reply) => {
      const parsed = AddWorkspaceMemberRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid member payload',
          details: parsed.error.issues,
        });
      }

      try {
        const result = await workspaceService.addWorkspaceMember(
          req.workspaceId!,
          req.user!.id,
          parsed.data,
          auth,
        );

        return reply.status(201).send({
          member: result,
          message: `${result.roleName} added successfully`,
        });
      } catch (err: any) {
        req.log.error(err, 'Failed to add workspace member');
        const status = err.statusCode || 500;
        return reply.status(status).send({
          statusCode: status,
          error: err.code || 'ADD_MEMBER_FAILED',
          message: err.message || 'Failed to add workspace member',
        });
      }
    },
  );
};

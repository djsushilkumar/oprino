import type { FastifyPluginAsync } from 'fastify';
import type { WorkspaceService } from '../services/workspace.service.js';
import type { createAuthMiddleware } from '../middleware/auth.js';
import { CreateWorkspaceRequestSchema, SwitchWorkspaceRequestSchema } from '@oprino/contracts';

export interface WorkspaceRoutesOptions {
  workspaceService: WorkspaceService;
  authMiddleware: ReturnType<typeof createAuthMiddleware>;
}

export const workspaceRoutes: FastifyPluginAsync<WorkspaceRoutesOptions> = async (app, options) => {
  const { workspaceService, authMiddleware } = options;

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
};

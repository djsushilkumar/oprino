import type { FastifyPluginAsync } from 'fastify';
import type { SyncService } from '../services/sync.service.js';
import type { createAuthMiddleware } from '../middleware/auth.js';
import { SyncBatchRequestSchema } from '@oprino/contracts';

export interface SyncRoutesOptions {
  syncService: SyncService;
  authMiddleware: ReturnType<typeof createAuthMiddleware>;
}

export const syncRoutes: FastifyPluginAsync<SyncRoutesOptions> = async (app, options) => {
  const { syncService, authMiddleware } = options;

  // POST /v1/sync/mutations - Replay batch mutations
  app.post(
    '/v1/sync/mutations',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
      ],
    },
    async (req, reply) => {
      const parsed = SyncBatchRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid sync batch payload',
          details: parsed.error.issues,
        });
      }

      try {
        const response = await syncService.processBatch(
          req.workspaceId!,
          req.user!.id,
          parsed.data,
        );
        return reply.status(200).send(response);
      } catch (err: any) {
        req.log.error(err, 'Failed to process sync mutations batch');
        const status = err.statusCode || 500;
        return reply.status(status).send({
          statusCode: status,
          error: status === 400 ? 'Bad Request' : 'Internal Server Error',
          message: err.message || 'Failed to process sync mutations',
        });
      }
    },
  );
};

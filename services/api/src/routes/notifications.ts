import type { FastifyPluginAsync } from 'fastify';
import type { NotificationService } from '../services/notification.service.js';
import type { createAuthMiddleware } from '../middleware/auth.js';

export interface NotificationRoutesOptions {
  notificationService: NotificationService;
  authMiddleware: ReturnType<typeof createAuthMiddleware>;
}

export const notificationRoutes: FastifyPluginAsync<NotificationRoutesOptions> = async (
  app,
  options,
) => {
  const { notificationService, authMiddleware } = options;

  // GET /v1/notifications - List notifications
  app.get(
    '/v1/notifications',
    {
      preHandler: [authMiddleware.authenticate, authMiddleware.requireWorkspace],
    },
    async (req, reply) => {
      try {
        const result = await notificationService.listNotifications(req.workspaceId!, req.user!.id);
        return reply.status(200).send(result);
      } catch (err: any) {
        req.log.error(err, 'Failed to list notifications');
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: err.message || 'Failed to list notifications',
        });
      }
    },
  );

  // PATCH /v1/notifications/:id/read - Mark notification as read
  app.patch(
    '/v1/notifications/:id/read',
    {
      preHandler: [authMiddleware.authenticate, authMiddleware.requireWorkspace],
    },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      try {
        const result = await notificationService.markAsRead(req.workspaceId!, req.user!.id, id);
        return reply.status(200).send(result);
      } catch (err: any) {
        req.log.error(err, 'Failed to mark notification read');
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: err.message || 'Failed to mark notification read',
        });
      }
    },
  );

  // POST /v1/notifications/read-all - Mark all notifications as read
  app.post(
    '/v1/notifications/read-all',
    {
      preHandler: [authMiddleware.authenticate, authMiddleware.requireWorkspace],
    },
    async (req, reply) => {
      try {
        const result = await notificationService.markAllAsRead(req.workspaceId!, req.user!.id);
        return reply.status(200).send(result);
      } catch (err: any) {
        req.log.error(err, 'Failed to mark all notifications read');
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: err.message || 'Failed to mark all notifications read',
        });
      }
    },
  );
};

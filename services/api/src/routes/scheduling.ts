import type { FastifyPluginAsync } from 'fastify';
import type { SchedulingService } from '../services/scheduling.service.js';
import type { createAuthMiddleware } from '../middleware/auth.js';
import { PERMISSIONS } from '../auth/permissions.js';
import {
  CreateRecurringTaskTemplateRequestSchema,
  UpdateRecurringTaskTemplateRequestSchema,
  AssignShiftRosterRequestSchema,
} from '@oprino/contracts';

export interface SchedulingRoutesOptions {
  schedulingService: SchedulingService;
  authMiddleware: ReturnType<typeof createAuthMiddleware>;
}

export const schedulingRoutes: FastifyPluginAsync<SchedulingRoutesOptions> = async (
  app,
  options,
) => {
  const { schedulingService, authMiddleware } = options;

  // -------------------------------------------------------------------------
  // Recurring Task Templates
  // -------------------------------------------------------------------------

  // POST /v1/tasks/templates - Create Recurring Template
  app.post(
    '/v1/tasks/templates',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.TASKS_CREATE),
      ],
    },
    async (req, reply) => {
      const parsed = CreateRecurringTaskTemplateRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid recurring template payload',
          details: parsed.error.issues,
        });
      }

      try {
        const template = await schedulingService.createRecurringTemplate(
          req.workspaceId!,
          req.user!.id,
          parsed.data,
        );
        return reply.status(201).send(template);
      } catch (err: any) {
        req.log.error(err, 'Failed to create recurring template');
        const status = err.statusCode || 500;
        return reply.status(status).send({
          statusCode: status,
          error: status === 400 ? 'Bad Request' : 'Internal Server Error',
          message: err.message || 'Failed to create recurring template',
        });
      }
    },
  );

  // GET /v1/tasks/templates - List Recurring Templates
  app.get(
    '/v1/tasks/templates',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.TASKS_READ),
      ],
    },
    async (req, reply) => {
      try {
        const result = await schedulingService.listRecurringTemplates(req.workspaceId!);
        return reply.status(200).send(result);
      } catch (err: any) {
        req.log.error(err, 'Failed to list recurring templates');
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: err.message || 'Failed to list recurring templates',
        });
      }
    },
  );

  // PATCH /v1/tasks/templates/:id - Update Recurring Template
  app.patch(
    '/v1/tasks/templates/:id',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.TASKS_UPDATE),
      ],
    },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const parsed = UpdateRecurringTaskTemplateRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid update payload',
          details: parsed.error.issues,
        });
      }

      try {
        const template = await schedulingService.updateRecurringTemplate(
          req.workspaceId!,
          id,
          parsed.data,
        );
        return reply.status(200).send(template);
      } catch (err: any) {
        const status = err.statusCode || 500;
        return reply.status(status).send({
          statusCode: status,
          error:
            status === 400 ? 'Bad Request' : status === 404 ? 'Not Found' : 'Internal Server Error',
          message: err.message || 'Failed to update recurring template',
        });
      }
    },
  );

  // -------------------------------------------------------------------------
  // Shift Rosters
  // -------------------------------------------------------------------------

  // POST /v1/attendance/rosters - Assign Shift Rosters
  app.post(
    '/v1/attendance/rosters',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.ATTENDANCE_TEAM_READ),
      ],
    },
    async (req, reply) => {
      const parsed = AssignShiftRosterRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid shift roster payload',
          details: parsed.error.issues,
        });
      }

      try {
        const rosters = await schedulingService.assignShiftRosters(req.workspaceId!, parsed.data);
        return reply.status(201).send(rosters);
      } catch (err: any) {
        req.log.error(err, 'Failed to assign shift rosters');
        const status = err.statusCode || 500;
        return reply.status(status).send({
          statusCode: status,
          error: status === 400 ? 'Bad Request' : 'Internal Server Error',
          message: err.message || 'Failed to assign shift rosters',
        });
      }
    },
  );

  // GET /v1/attendance/rosters - List Shift Rosters
  app.get(
    '/v1/attendance/rosters',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.ATTENDANCE_SELF_READ),
      ],
    },
    async (req, reply) => {
      try {
        const query = req.query as { startDate?: string; endDate?: string; userId?: string };
        const result = await schedulingService.listShiftRosters(req.workspaceId!, query);
        return reply.status(200).send(result);
      } catch (err: any) {
        req.log.error(err, 'Failed to list shift rosters');
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: err.message || 'Failed to list shift rosters',
        });
      }
    },
  );
};

import type { FastifyPluginAsync } from 'fastify';
import type { VisitService } from '../services/visit.service.js';
import type { createAuthMiddleware } from '../middleware/auth.js';
import { PERMISSIONS } from '../auth/permissions.js';
import {
  CreateVisitRequestSchema,
  VisitCheckInRequestSchema,
  VisitCheckOutRequestSchema,
  ReorderVisitsRequestSchema,
} from '@oprino/contracts';

export interface VisitRoutesOptions {
  visitService: VisitService;
  authMiddleware: ReturnType<typeof createAuthMiddleware>;
}

export const visitRoutes: FastifyPluginAsync<VisitRoutesOptions> = async (app, options) => {
  const { visitService, authMiddleware } = options;

  // POST /v1/visits - Create Visit
  app.post(
    '/v1/visits',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.VISITS_READ),
      ],
    },
    async (req, reply) => {
      const parsed = CreateVisitRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid visit payload',
          details: parsed.error.issues,
        });
      }

      try {
        const visit = await visitService.createVisit(req.workspaceId!, parsed.data, req.user!.id);
        return reply.status(201).send(visit);
      } catch (err: any) {
        req.log.error(err, 'Failed to create visit');
        const status = err.statusCode || 500;
        return reply.status(status).send({
          statusCode: status,
          error: status === 400 ? 'Bad Request' : 'Internal Server Error',
          message: err.message || 'Failed to create visit',
        });
      }
    },
  );

  // GET /v1/visits - List Visits
  app.get(
    '/v1/visits',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.VISITS_READ),
      ],
    },
    async (req, reply) => {
      try {
        const query = req.query as {
          status?: string;
          userId?: string;
          customerId?: string;
          date?: string;
        };

        const hasManagerScope =
          req.permissions?.includes(PERMISSIONS.VISITS_MANAGE) ||
          req.permissions?.includes(PERMISSIONS.TASKS_ASSIGN) ||
          req.permissions?.includes(PERMISSIONS.TASKS_CREATE);
        const restrictToUserId = hasManagerScope ? undefined : req.user!.id;

        const result = await visitService.listVisits(req.workspaceId!, query, restrictToUserId);
        return reply.status(200).send(result);
      } catch (err: any) {
        req.log.error(err, 'Failed to list visits');
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to list visits',
        });
      }
    },
  );

  // GET /v1/visits/:id - Get Visit Details
  app.get(
    '/v1/visits/:id',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.VISITS_READ),
      ],
    },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      try {
        const visit = await visitService.getVisitById(req.workspaceId!, id);
        return reply.status(200).send(visit);
      } catch (err: any) {
        const status = err.statusCode || 500;
        return reply.status(status).send({
          statusCode: status,
          error: status === 404 ? 'Not Found' : 'Internal Server Error',
          message: err.message || 'Failed to get visit',
        });
      }
    },
  );

  // POST /v1/visits/:id/check-in - GPS Check-in
  app.post(
    '/v1/visits/:id/check-in',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.VISITS_READ),
      ],
    },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const parsed = VisitCheckInRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid check-in payload',
          details: parsed.error.issues,
        });
      }

      try {
        const visit = await visitService.checkInVisit(
          req.workspaceId!,
          id,
          req.user!.id,
          parsed.data,
        );
        return reply.status(200).send(visit);
      } catch (err: any) {
        const status = err.statusCode || 500;
        return reply.status(status).send({
          statusCode: status,
          error:
            status === 400 ? 'Bad Request' : status === 404 ? 'Not Found' : 'Internal Server Error',
          message: err.message || 'Failed to check in visit',
        });
      }
    },
  );

  // POST /v1/visits/:id/check-out - GPS Check-out
  app.post(
    '/v1/visits/:id/check-out',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.VISITS_READ),
      ],
    },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const parsed = VisitCheckOutRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid check-out payload',
          details: parsed.error.issues,
        });
      }

      try {
        const visit = await visitService.checkOutVisit(
          req.workspaceId!,
          id,
          req.user!.id,
          parsed.data,
        );
        return reply.status(200).send(visit);
      } catch (err: any) {
        const status = err.statusCode || 500;
        return reply.status(status).send({
          statusCode: status,
          error:
            status === 400 ? 'Bad Request' : status === 404 ? 'Not Found' : 'Internal Server Error',
          message: err.message || 'Failed to check out visit',
        });
      }
    },
  );

  // PUT /v1/visits/sequence - Reorder day route sequence
  app.put(
    '/v1/visits/sequence',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.VISITS_READ),
      ],
    },
    async (req, reply) => {
      const parsed = ReorderVisitsRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid reorder sequence payload',
          details: parsed.error.issues,
        });
      }

      try {
        const result = await visitService.reorderVisits(
          req.workspaceId!,
          parsed.data.userId,
          parsed.data.routeDate,
          parsed.data.orderedVisitIds,
        );
        return reply.status(200).send(result);
      } catch (err: any) {
        req.log.error(err, 'Failed to reorder visits sequence');
        const status = err.statusCode || 500;
        return reply.status(status).send({
          statusCode: status,
          error: status === 400 ? 'Bad Request' : 'Internal Server Error',
          message: err.message || 'Failed to reorder visits',
        });
      }
    },
  );
};

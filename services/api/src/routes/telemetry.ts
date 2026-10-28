import type { FastifyPluginAsync } from 'fastify';
import { LocationIngestBatchRequestSchema, LocationHistoryQuerySchema } from '@oprino/contracts';
import type { TelemetryService } from '../services/telemetry.service.js';
import type { PubSubService } from '../services/pubsub.service.js';
import type { createAuthMiddleware } from '../middleware/auth.js';
import { PERMISSIONS } from '../auth/permissions.js';

export interface TelemetryRoutesOptions {
  telemetryService: TelemetryService;
  pubsub: PubSubService;
  authMiddleware: ReturnType<typeof createAuthMiddleware>;
}

export const telemetryRoutes: FastifyPluginAsync<TelemetryRoutesOptions> = async (
  fastify,
  opts,
) => {
  const { telemetryService, pubsub, authMiddleware } = opts;

  /**
   * POST /v1/telemetry/locations
   * Ingest duty location batch. Drops off-duty points automatically (Duty-Hours-Only Invariant).
   */
  fastify.post(
    '/v1/telemetry/locations',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.LOCATION_RECORD),
      ],
    },
    async (request, reply) => {
      const parsed = LocationIngestBatchRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          code: 'VALIDATION_ERROR',
          message: 'Invalid location batch parameters',
          errors: parsed.error.format(),
        });
      }

      const activeWorkspaceId = request.workspaceId!;
      const userId = request.user!.id;

      try {
        const result = await telemetryService.ingestLocations(
          activeWorkspaceId,
          userId,
          parsed.data.locations,
        );

        return reply.status(200).send(result);
      } catch (err: any) {
        request.log.error(err, 'Failed to ingest locations');
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: err.message || 'Failed to ingest locations',
        });
      }
    },
  );

  /**
   * GET /v1/telemetry/live
   * Live duty-hours map: returns active on-duty members with latest coordinates.
   * Peer visibility OFF by default (Requires LOCATION_READ).
   */
  fastify.get(
    '/v1/telemetry/live',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.LOCATION_READ),
      ],
    },
    async (request, reply) => {
      try {
        const activeWorkspaceId = request.workspaceId!;
        const result = await telemetryService.getLiveWorkers(activeWorkspaceId);
        return reply.status(200).send(result);
      } catch (err: any) {
        request.log.error(err, 'Failed to get live workers');
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: err.message || 'Failed to get live workers',
        });
      }
    },
  );

  /**
   * GET /v1/telemetry/history
   * Historical duty breadcrumbs for an employee on a given date.
   */
  fastify.get(
    '/v1/telemetry/history',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.LOCATION_READ),
      ],
    },
    async (request, reply) => {
      const parsed = LocationHistoryQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          code: 'VALIDATION_ERROR',
          message: 'Invalid history query parameters (userId and YYYY-MM-DD date required)',
          errors: parsed.error.format(),
        });
      }

      try {
        const activeWorkspaceId = request.workspaceId!;
        const result = await telemetryService.getLocationHistory(
          activeWorkspaceId,
          parsed.data.userId,
          parsed.data.date,
        );

        return reply.status(200).send(result);
      } catch (err: any) {
        request.log.error(err, 'Failed to get location history');
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: err.message || 'Failed to get location history',
        });
      }
    },
  );

  /**
   * POST /v1/telemetry/stream-ticket
   * Issues a short-lived (60s) single-use ticket for secure browser SSE streaming.
   * Eliminates transmitting persistent tokens in query strings.
   */
  fastify.post(
    '/v1/telemetry/stream-ticket',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.LOCATION_READ),
      ],
    },
    async (request, reply) => {
      const ticket = await pubsub.createStreamingTicket(request.user!.id, request.workspaceId!);
      return reply.status(200).send({ ticket, expiresInSeconds: 60 });
    },
  );

  /**
   * GET /v1/telemetry/stream
   * Realtime Server-Sent Events (SSE) stream for web live map.
   * Supports secure single-use ticket (?ticket=) or standard auth headers/cookies.
   */
  fastify.get('/v1/telemetry/stream', async (request, reply) => {
    const query = request.query as Record<string, string> | undefined;
    let activeWorkspaceId: string | null = null;

    // 1. Single-use ticket authentication
    if (query?.ticket) {
      const ticketData = await pubsub.consumeStreamingTicket(query.ticket);
      if (!ticketData) {
        return reply.status(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Invalid or expired streaming ticket',
        });
      }
      activeWorkspaceId = ticketData.workspaceId;
    } else {
      // 2. Standard authentication through cookies or Authorization header
      await authMiddleware.authenticate(request, reply);
      if (reply.sent) return;
      await authMiddleware.requireWorkspace(request, reply);
      if (reply.sent) return;
      await authMiddleware.requirePermission(PERMISSIONS.LOCATION_READ)(request, reply);
      if (reply.sent) return;
      activeWorkspaceId = request.workspaceId!;
    }

    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache, no-transform');
    reply.raw.setHeader('Connection', 'keep-alive');
    reply.raw.setHeader('X-Accel-Buffering', 'no');
    reply.raw.flushHeaders();

    // Send initial heartbeat
    reply.raw.write(
      `event: connected\ndata: ${JSON.stringify({ workspaceId: activeWorkspaceId })}\n\n`,
    );

    const unsubscribe = await pubsub.subscribe(`live_ops:${activeWorkspaceId}`, (payload) => {
      try {
        reply.raw.write(`event: location_update\ndata: ${JSON.stringify(payload)}\n\n`);
      } catch {
        // Socket closed
      }
    });

    request.raw.on('close', () => {
      unsubscribe();
    });

    // Keep connection open; return nothing to avoid Fastify closing response automatically
    return new Promise(() => {});
  });
};

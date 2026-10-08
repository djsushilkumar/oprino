import type { FastifyPluginAsync } from 'fastify';
import {
  CreateGeofenceRequestSchema,
  CheckGeofenceProximityRequestSchema,
} from '@oprino/contracts';
import type { TelemetryService } from '../services/telemetry.service.js';
import type { createAuthMiddleware } from '../middleware/auth.js';
import { PERMISSIONS } from '../auth/permissions.js';

export interface GeofencesRoutesOptions {
  telemetryService: TelemetryService;
  authMiddleware: ReturnType<typeof createAuthMiddleware>;
}

export const geofencesRoutes: FastifyPluginAsync<GeofencesRoutesOptions> = async (
  fastify,
  opts,
) => {
  const { telemetryService, authMiddleware } = opts;

  /**
   * GET /v1/geofences
   * List all configured geofences in the workspace.
   */
  fastify.get(
    '/v1/geofences',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.GEOFENCES_READ),
      ],
    },
    async (request, reply) => {
      const activeWorkspaceId = request.workspaceId!;
      const result = await telemetryService.listGeofences(activeWorkspaceId);
      return reply.status(200).send(result);
    },
  );

  /**
   * POST /v1/geofences
   * Create a new geofence boundary.
   */
  fastify.post(
    '/v1/geofences',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.GEOFENCES_MANAGE),
      ],
    },
    async (request, reply) => {
      const parsed = CreateGeofenceRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          code: 'VALIDATION_ERROR',
          message: 'Invalid geofence parameters',
          errors: parsed.error.format(),
        });
      }

      const activeWorkspaceId = request.workspaceId!;
      const userId = request.user!.id;

      const result = await telemetryService.createGeofence(
        activeWorkspaceId,
        userId,
        parsed.data,
      );

      return reply.status(201).send(result);
    },
  );

  /**
   * DELETE /v1/geofences/:id
   * Remove a geofence.
   */
  fastify.delete(
    '/v1/geofences/:id',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.GEOFENCES_MANAGE),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const activeWorkspaceId = request.workspaceId!;

      const result = await telemetryService.deleteGeofence(activeWorkspaceId, id);
      return reply.status(200).send(result);
    },
  );

  /**
   * POST /v1/geofences/validate-proximity
   * Validate proximity: check if coordinates fall within geofence radius.
   */
  fastify.post(
    '/v1/geofences/validate-proximity',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.GEOFENCES_READ),
      ],
    },
    async (request, reply) => {
      const parsed = CheckGeofenceProximityRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          code: 'VALIDATION_ERROR',
          message: 'Invalid proximity check parameters',
          errors: parsed.error.format(),
        });
      }

      const activeWorkspaceId = request.workspaceId!;

      const result = await telemetryService.validateProximity(
        activeWorkspaceId,
        parsed.data.geofenceId,
        parsed.data.latitude,
        parsed.data.longitude,
      );

      return reply.status(200).send(result);
    },
  );
};

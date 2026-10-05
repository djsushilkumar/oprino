import type { FastifyPluginAsync } from 'fastify';
import type { DeviceService } from '../services/device.service.js';
import type { createAuthMiddleware } from '../middleware/auth.js';
import { RegisterDeviceRequestSchema, RevokeDeviceRequestSchema } from '@oprino/contracts';

export interface DeviceRoutesOptions {
  deviceService: DeviceService;
  authMiddleware: ReturnType<typeof createAuthMiddleware>;
}

export const deviceRoutes: FastifyPluginAsync<DeviceRoutesOptions> = async (app, options) => {
  const { deviceService, authMiddleware } = options;

  // POST /v1/devices/register - Register or refresh device installation
  app.post(
    '/v1/devices/register',
    { preHandler: [authMiddleware.authenticate] },
    async (req, reply) => {
      const parsed = RegisterDeviceRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid device registration payload',
          details: parsed.error.issues,
        });
      }

      try {
        const device = await deviceService.registerDevice(
          req.user!.id,
          parsed.data,
          req.session?.activeWorkspaceId ?? undefined,
        );

        return reply.status(200).send(device);
      } catch (err: any) {
        req.log.error(err, 'Failed to register device');
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to register device installation',
        });
      }
    },
  );

  // GET /v1/devices - List all registered devices for user
  app.get('/v1/devices', { preHandler: [authMiddleware.authenticate] }, async (req, reply) => {
    try {
      const devices = await deviceService.listUserDevices(req.user!.id);
      return reply.status(200).send({ devices });
    } catch (err: any) {
      req.log.error(err, 'Failed to list devices');
      return reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to retrieve devices list',
      });
    }
  });

  // POST /v1/devices/revoke - Revoke a specific installation
  app.post(
    '/v1/devices/revoke',
    { preHandler: [authMiddleware.authenticate] },
    async (req, reply) => {
      const parsed = RevokeDeviceRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid revoke device payload',
          details: parsed.error.issues,
        });
      }

      try {
        const result = await deviceService.revokeDevice(
          req.user!.id,
          parsed.data.installationId,
          req.session?.activeWorkspaceId ?? undefined,
        );

        return reply.status(200).send(result);
      } catch (err: any) {
        const status = err.statusCode || 500;
        return reply.status(status).send({
          statusCode: status,
          error: 'REVOCATION_FAILED',
          message: err.message || 'Failed to revoke device',
        });
      }
    },
  );
};

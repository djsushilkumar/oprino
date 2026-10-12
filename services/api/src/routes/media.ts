import type { FastifyPluginAsync } from 'fastify';
import type { MediaService } from '../services/media.service.js';
import type { createAuthMiddleware } from '../middleware/auth.js';
import {
  MediaUploadUrlRequestSchema,
  ConfirmMediaUploadRequestSchema,
} from '@oprino/contracts';

export interface MediaRoutesOptions {
  mediaService: MediaService;
  authMiddleware: ReturnType<typeof createAuthMiddleware>;
}

export const mediaRoutes: FastifyPluginAsync<MediaRoutesOptions> = async (app, options) => {
  const { mediaService, authMiddleware } = options;

  // POST /v1/media/upload-url - Request pre-signed direct upload URL (ADR-012)
  app.post(
    '/v1/media/upload-url',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
      ],
    },
    async (req, reply) => {
      const parsed = MediaUploadUrlRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid upload request payload',
          details: parsed.error.issues,
        });
      }

      try {
        const result = await mediaService.generateUploadUrl(
          req.workspaceId!,
          req.user!.id,
          parsed.data,
        );
        return reply.status(200).send(result);
      } catch (err: any) {
        req.log.error(err, 'Failed to generate upload URL');
        const status = err.statusCode || 500;
        return reply.status(status).send({
          statusCode: status,
          error: status === 404 ? 'Not Found' : 'Internal Server Error',
          message: err.message || 'Failed to generate upload URL',
        });
      }
    },
  );

  // POST /v1/media/confirm - Confirm uploaded proof binary
  app.post(
    '/v1/media/confirm',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
      ],
    },
    async (req, reply) => {
      const parsed = ConfirmMediaUploadRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid proof confirmation payload',
          details: parsed.error.issues,
        });
      }

      try {
        const proof = await mediaService.confirmUpload(
          req.workspaceId!,
          req.user!.id,
          parsed.data,
        );
        return reply.status(201).send(proof);
      } catch (err: any) {
        req.log.error(err, 'Failed to confirm proof upload');
        const status = err.statusCode || 500;
        return reply.status(status).send({
          statusCode: status,
          error: status === 403 ? 'Forbidden' : status === 404 ? 'Not Found' : 'Internal Server Error',
          message: err.message || 'Failed to confirm proof upload',
        });
      }
    },
  );

  // POST /v1/media/attendance-selfie-url - BLK-004: Direct attendance selfie upload
  app.post(
    '/v1/media/attendance-selfie-url',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
      ],
    },
    async (req, reply) => {
      const fileName = (req.body as any)?.fileName || 'selfie.jpg';
      const result = await mediaService.generateAttendanceSelfieUploadUrl(
        req.workspaceId!,
        req.user!.id,
        fileName,
      );
      return reply.status(200).send(result);
    },
  );

  // GET /v1/media/files/* - Protected media access partitioned by tenant barrier
  app.get(
    '/v1/media/files/*',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
      ],
    },
    async (req, reply) => {
      const rawPath = (req.params as any)['*'] || '';
      const fileKey = decodeURIComponent(rawPath);

      // Verify tenant barrier
      if (!fileKey.startsWith(`${req.workspaceId!}/`)) {
        return reply.status(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: 'Security barrier violation: Cannot access media outside active workspace',
        });
      }

      return reply.status(200).send({
        fileKey,
        url: `${mediaService.getPublicBaseUrl()}/v1/media/mock-upload/${encodeURIComponent(fileKey)}`,
        status: 'AVAILABLE',
      });
    },
  );

  // Add binary content-type parser for mock uploads
  app.addContentTypeParser(
    ['application/octet-stream', 'image/jpeg', 'image/png', 'text/plain'],
    (_req, payload, done) => {
      done(null, payload);
    },
  );

  // PUT /v1/media/mock-upload/* - Local dev mock direct S3 upload target
  app.put('/v1/media/mock-upload/*', async (_req, reply) => {
    return reply.status(200).send({ success: true, message: 'Mock upload successful' });
  });
};


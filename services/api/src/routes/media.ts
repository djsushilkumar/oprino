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

  // PUT /v1/media/mock-upload/* - Local dev mock direct S3 upload target
  app.put('/v1/media/mock-upload/*', async (_req, reply) => {
    return reply.status(200).send({ success: true, message: 'Mock upload successful' });
  });
};

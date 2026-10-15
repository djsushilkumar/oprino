import type { FastifyPluginAsync } from 'fastify';
import {
  type MediaService,
  ALLOWED_MIME_TYPES,
  MAX_UPLOAD_SIZE_BYTES,
} from '../services/media.service.js';
import type { createAuthMiddleware } from '../middleware/auth.js';
import { LocalStorageDriver } from '../storage/local-driver.js';
import { MediaUploadUrlRequestSchema, ConfirmMediaUploadRequestSchema } from '@oprino/contracts';

export interface MediaRoutesOptions {
  mediaService: MediaService;
  authMiddleware: ReturnType<typeof createAuthMiddleware>;
}

export const mediaRoutes: FastifyPluginAsync<MediaRoutesOptions> = async (app, options) => {
  const { mediaService, authMiddleware } = options;
  const storageDriver = mediaService.getStorageDriver();

  // Add binary content-type parser for direct S3 / Local storage uploads
  app.addContentTypeParser(
    ['application/octet-stream', 'image/jpeg', 'image/png', 'image/webp', 'text/plain'],
    { parseAs: 'buffer' },
    (_req, body, done) => {
      done(null, body);
    },
  );

  // POST /v1/media/upload-url - Request pre-signed direct upload URL (ADR-012)
  app.post(
    '/v1/media/upload-url',
    {
      preHandler: [authMiddleware.authenticate, authMiddleware.requireWorkspace],
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
          error:
            status === 404 ? 'Not Found' : status === 400 ? 'Bad Request' : 'Internal Server Error',
          message: err.message || 'Failed to generate upload URL',
        });
      }
    },
  );

  // POST /v1/media/confirm - Confirm uploaded proof binary
  app.post(
    '/v1/media/confirm',
    {
      preHandler: [authMiddleware.authenticate, authMiddleware.requireWorkspace],
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
        const proof = await mediaService.confirmUpload(req.workspaceId!, req.user!.id, parsed.data);
        return reply.status(201).send(proof);
      } catch (err: any) {
        req.log.error(err, 'Failed to confirm proof upload');
        const status = err.statusCode || 500;
        return reply.status(status).send({
          statusCode: status,
          error:
            status === 403
              ? 'Forbidden'
              : status === 404
                ? 'Not Found'
                : status === 400
                  ? 'Bad Request'
                  : 'Internal Server Error',
          message: err.message || 'Failed to confirm proof upload',
        });
      }
    },
  );

  // POST /v1/media/attendance-selfie-url - BLK-004: Direct attendance selfie upload
  app.post(
    '/v1/media/attendance-selfie-url',
    {
      preHandler: [authMiddleware.authenticate, authMiddleware.requireWorkspace],
    },
    async (req, reply) => {
      try {
        const fileName = (req.body as any)?.fileName || 'selfie.jpg';
        const result = await mediaService.generateAttendanceSelfieUploadUrl(
          req.workspaceId!,
          req.user!.id,
          fileName,
        );
        return reply.status(200).send(result);
      } catch (err: any) {
        req.log.error(err, 'Failed to generate attendance selfie upload URL');
        const status = err.statusCode || 500;
        return reply.status(status).send({
          statusCode: status,
          error: status === 400 ? 'Bad Request' : 'Internal Server Error',
          message: err.message || 'Failed to generate selfie upload URL',
        });
      }
    },
  );

  // POST /v1/media/download-url - Secure short-lived presigned download URL request
  app.post(
    '/v1/media/download-url',
    {
      preHandler: [authMiddleware.authenticate, authMiddleware.requireWorkspace],
    },
    async (req, reply) => {
      const fileKey = (req.body as any)?.fileKey;
      if (!fileKey || typeof fileKey !== 'string') {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Missing or invalid fileKey parameter',
        });
      }

      try {
        const result = await mediaService.getDownloadUrl(
          req.workspaceId!,
          req.user!.id,
          fileKey,
          req.permissions || [],
        );
        return reply.status(200).send(result);
      } catch (err: any) {
        req.log.error(err, 'Failed to generate download URL');
        const status = err.statusCode || 500;
        return reply.status(status).send({
          statusCode: status,
          error:
            status === 403
              ? 'Forbidden'
              : status === 404
                ? 'Not Found'
                : status === 400
                  ? 'Bad Request'
                  : 'Internal Server Error',
          message: err.message || 'Failed to generate download URL',
        });
      }
    },
  );

  // GET /v1/media/download-url - Alternate query-based presigned download URL request
  app.get(
    '/v1/media/download-url',
    {
      preHandler: [authMiddleware.authenticate, authMiddleware.requireWorkspace],
    },
    async (req, reply) => {
      const fileKey = (req.query as any)?.fileKey;
      if (!fileKey || typeof fileKey !== 'string') {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Missing or invalid fileKey query parameter',
        });
      }

      try {
        const result = await mediaService.getDownloadUrl(
          req.workspaceId!,
          req.user!.id,
          fileKey,
          req.permissions || [],
        );
        return reply.status(200).send(result);
      } catch (err: any) {
        req.log.error(err, 'Failed to generate download URL');
        const status = err.statusCode || 500;
        return reply.status(status).send({
          statusCode: status,
          error:
            status === 403
              ? 'Forbidden'
              : status === 404
                ? 'Not Found'
                : status === 400
                  ? 'Bad Request'
                  : 'Internal Server Error',
          message: err.message || 'Failed to generate download URL',
        });
      }
    },
  );

  // GET /v1/media/files/* - Protected media access partitioned by tenant barrier
  app.get(
    '/v1/media/files/*',
    {
      preHandler: [authMiddleware.authenticate, authMiddleware.requireWorkspace],
    },
    async (req, reply) => {
      const rawPath = (req.params as any)['*'] || '';
      const fileKey = decodeURIComponent(rawPath);

      try {
        const result = await mediaService.getDownloadUrl(
          req.workspaceId!,
          req.user!.id,
          fileKey,
          req.permissions || [],
        );

        // Check accept header: if browser expects image or redirect, redirect with 307
        const accept = req.headers.accept || '';
        if (
          accept.includes('image/') ||
          accept.includes('text/html') ||
          !accept.includes('application/json')
        ) {
          return reply.redirect(result.downloadUrl, 307);
        }

        return reply.status(200).send({
          fileKey: result.fileKey,
          url: result.downloadUrl,
          expiresInSeconds: result.expiresInSeconds,
          status: 'AVAILABLE',
        });
      } catch (err: any) {
        const status = err.statusCode || 500;
        return reply.status(status).send({
          statusCode: status,
          error:
            status === 403
              ? 'Forbidden'
              : status === 404
                ? 'Not Found'
                : status === 400
                  ? 'Bad Request'
                  : 'Internal Server Error',
          message: err.message || 'Failed to access media file',
        });
      }
    },
  );

  // =========================================================================
  // LOCAL STORAGE DIRECT SIGNED TARGETS (DISABLED IN S3 MODE)
  // =========================================================================

  // Handle direct PUT uploads for LocalStorageDriver only with MANDATORY HMAC signature
  app.put('/v1/media/storage/upload/*', async (req, reply) => {
    // S3 Safety Guard: Direct API proxy uploads are strictly forbidden when S3 driver is active
    if (!(storageDriver instanceof LocalStorageDriver)) {
      return reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message:
          'Direct API storage proxy upload is disabled. S3/R2 presigned URLs must be used directly.',
      });
    }

    const rawPath = (req.params as any)['*'] || '';
    const fileKey = decodeURIComponent(rawPath);

    if (!fileKey) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Missing file key in upload path',
      });
    }

    // Path traversal guardrails
    if (
      fileKey.includes('..') ||
      fileKey.includes('//') ||
      fileKey.includes('\\') ||
      fileKey.startsWith('/') ||
      fileKey.includes('\0')
    ) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message:
          'Security barrier violation: Malicious path traversal pattern detected in file key',
      });
    }

    const query = req.query as Record<string, string>;

    // MANDATORY SIGNED TOKEN VALIDATION: Missing signature or expiry is immediately rejected
    if (!query?.signature || !query?.expires) {
      return reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message:
          'Forbidden: Missing mandatory upload signature or expiration token. Direct uploads require a valid signed token.',
      });
    }

    const headerContentType = ((req.headers['content-type'] as string) || 'image/jpeg')
      .split(';')[0]
      .trim();

    // Validate MIME type against allowed list
    if (!ALLOWED_MIME_TYPES.includes(headerContentType as any)) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: `Unsupported media Content-Type: ${headerContentType}. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
      });
    }

    // If query specified contentType, enforce exact match with header Content-Type
    if (query.contentType && query.contentType !== headerContentType) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: `Content-Type mismatch: upload requested with ${query.contentType} but received ${headerContentType}`,
      });
    }

    const isValid = storageDriver.verifyUploadToken(
      fileKey,
      query.expires,
      query.signature,
      query.contentType || headerContentType,
    );

    if (!isValid) {
      return reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Invalid or expired upload signature token',
      });
    }

    // Persist real bytes to storage
    const dataBuffer = Buffer.isBuffer(req.body)
      ? req.body
      : typeof req.body === 'string'
        ? Buffer.from(req.body)
        : Buffer.from([]);

    // Validate actual file size constraints
    if (dataBuffer.length === 0) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Empty file upload (0 bytes) is not allowed',
      });
    }

    if (dataBuffer.length > MAX_UPLOAD_SIZE_BYTES) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: `Uploaded file exceeds maximum allowed threshold of ${MAX_UPLOAD_SIZE_BYTES} bytes (10 MB).`,
      });
    }

    // Verify binary magic bytes match the declared Content-Type (Priority 2)
    const isJpeg =
      dataBuffer.length >= 3 &&
      dataBuffer[0] === 0xff &&
      dataBuffer[1] === 0xd8 &&
      dataBuffer[2] === 0xff;
    const isPng =
      dataBuffer.length >= 8 &&
      dataBuffer[0] === 0x89 &&
      dataBuffer[1] === 0x50 &&
      dataBuffer[2] === 0x4e &&
      dataBuffer[3] === 0x47 &&
      dataBuffer[4] === 0x0d &&
      dataBuffer[5] === 0x0a &&
      dataBuffer[6] === 0x1a &&
      dataBuffer[7] === 0x0a;
    const isWebp =
      dataBuffer.length >= 12 &&
      dataBuffer[0] === 0x52 &&
      dataBuffer[1] === 0x49 &&
      dataBuffer[2] === 0x46 &&
      dataBuffer[3] === 0x46 &&
      dataBuffer[8] === 0x57 &&
      dataBuffer[9] === 0x45 &&
      dataBuffer[10] === 0x42 &&
      dataBuffer[11] === 0x50;

    if (headerContentType === 'image/jpeg' && !isJpeg) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Uploaded binary is corrupted or does not match declared image/jpeg format',
      });
    }

    if (headerContentType === 'image/png' && !isPng) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Uploaded binary is corrupted or does not match declared image/png format',
      });
    }

    if (headerContentType === 'image/webp' && !isWebp) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Uploaded binary is corrupted or does not match declared image/webp format',
      });
    }

    await storageDriver.putObject(fileKey, dataBuffer, headerContentType);

    return reply.status(200).send({
      success: true,
      fileKey,
      sizeBytes: dataBuffer.length,
      message: 'Direct storage upload successful',
    });
  });

  // Handle direct GET downloads for LocalStorageDriver only with MANDATORY HMAC signature
  app.get('/v1/media/storage/download/*', async (req, reply) => {
    // S3 Safety Guard: Direct API proxy downloads are strictly forbidden when S3 driver is active
    if (!(storageDriver instanceof LocalStorageDriver)) {
      return reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message:
          'Direct API storage proxy download is disabled. S3/R2 presigned URLs must be used directly.',
      });
    }

    const rawPath = (req.params as any)['*'] || '';
    const fileKey = decodeURIComponent(rawPath);

    if (!fileKey) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Missing file key in download path',
      });
    }

    // Path traversal guardrails
    if (
      fileKey.includes('..') ||
      fileKey.includes('//') ||
      fileKey.includes('\\') ||
      fileKey.startsWith('/') ||
      fileKey.includes('\0')
    ) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message:
          'Security barrier violation: Malicious path traversal pattern detected in file key',
      });
    }

    const query = req.query as Record<string, string>;

    // MANDATORY SIGNED TOKEN VALIDATION: Missing signature or expiry is immediately rejected
    if (!query?.signature || !query?.expires) {
      return reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message:
          'Forbidden: Missing mandatory download signature or expiration token. Direct downloads require a valid signed token.',
      });
    }

    const isValid = storageDriver.verifyDownloadToken(fileKey, query.expires, query.signature);
    if (!isValid) {
      return reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Invalid or expired download signature token',
      });
    }

    const obj = await storageDriver.getObject(fileKey);
    if (!obj) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'Storage object not found',
      });
    }

    return reply
      .header('Content-Type', obj.contentType)
      .header('Content-Length', obj.data.length)
      .header('Cache-Control', 'private, max-age=900')
      .status(200)
      .send(obj.data);
  });
};

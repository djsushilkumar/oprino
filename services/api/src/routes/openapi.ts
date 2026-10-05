import type { FastifyPluginAsync } from 'fastify';
import { generateOpenApiDocument } from '@oprino/contracts';

export const openapiRoutes: FastifyPluginAsync = async (app) => {
  const spec = generateOpenApiDocument();

  app.get('/openapi.json', async (_req, reply) => {
    return reply.header('Content-Type', 'application/json').send(spec);
  });
};

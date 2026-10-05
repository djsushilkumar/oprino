import { OpenApiGeneratorV31, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { HealthResponseSchema } from './schemas/health.js';
import { VersionResponseSchema } from './schemas/version.js';
import { ApiErrorSchema } from './schemas/common.js';

export const registry = new OpenAPIRegistry();

// Register components
registry.register('HealthResponse', HealthResponseSchema);
registry.register('VersionResponse', VersionResponseSchema);
registry.register('ApiError', ApiErrorSchema);

// Register paths
registry.registerPath({
  method: 'get',
  path: '/health',
  summary: 'Health Check',
  description: 'Returns the operational health status of the API and backing datastores',
  tags: ['System'],
  operationId: 'getHealth',
  responses: {
    200: {
      description: 'System is operational',
      content: {
        'application/json': {
          schema: HealthResponseSchema,
        },
      },
    },
    503: {
      description: 'System or a dependent service is degraded or unhealthy',
      content: {
        'application/json': {
          schema: ApiErrorSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/v1/version',
  summary: 'System Version Information',
  description: 'Returns build version, active environment, and architecture metadata',
  tags: ['System'],
  operationId: 'getVersion',
  responses: {
    200: {
      description: 'Version metadata successfully retrieved',
      content: {
        'application/json': {
          schema: VersionResponseSchema,
        },
      },
    },
  },
});

export function generateOpenApiDocument(): Record<string, any> {
  const generator = new OpenApiGeneratorV31(registry.definitions);

  return generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'Oprino Operations Engine API',
      version: '0.1.0',
      description: 'Authoritative REST & Realtime API for Oprino Workforce Management Platform',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local Development Server',
      },
      {
        url: 'http://10.0.2.2:3000',
        description: 'Android Emulator Loopback',
      },
      {
        url: 'http://127.0.0.1:3000',
        description: 'Physical Android Reverse Loopback',
      },
    ],
  });
}

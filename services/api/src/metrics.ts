import client, { Registry, Counter, Histogram } from 'prom-client';
import type { FastifyInstance } from 'fastify';

export const register = new Registry();

// Collect default Node.js and process metrics
client.collectDefaultMetrics({
  register,
  prefix: 'oprino_',
});

export const httpRequestsTotal = new Counter({
  name: 'oprino_http_requests_total',
  help: 'Total number of HTTP requests processed by Oprino API',
  labelNames: ['method', 'route', 'status_code'] as const,
  registers: [register],
});

export const httpRequestDurationSeconds = new Histogram({
  name: 'oprino_http_request_duration_seconds',
  help: 'HTTP request duration in seconds for Oprino API',
  labelNames: ['method', 'route', 'status_code'] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

export function setupMetricsHooks(app: FastifyInstance): void {
  app.addHook('onRequest', async (req) => {
    (req as any)._metricsStartTime = process.hrtime();
  });

  app.addHook('onResponse', async (req, reply) => {
    const startTime = (req as any)._metricsStartTime as [number, number] | undefined;
    if (!startTime) return;

    const diff = process.hrtime(startTime);
    const durationSeconds = diff[0] + diff[1] / 1e9;
    const route = req.routeOptions?.url ?? req.url.split('?')[0];
    const method = req.method;
    const statusCode = String(reply.statusCode);

    httpRequestsTotal.inc({
      method,
      route,
      status_code: statusCode,
    });

    httpRequestDurationSeconds.observe(
      {
        method,
        route,
        status_code: statusCode,
      },
      durationSeconds,
    );
  });
}

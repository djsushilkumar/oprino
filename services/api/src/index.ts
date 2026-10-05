import { buildServer } from './server.js';

const { app, env } = buildServer();

async function start() {
  try {
    const address = await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info(`🚀 Oprino API Server listening at ${address}`);
    app.log.info(`📖 OpenAPI spec available at ${address}/openapi.json`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// Graceful shutdown
const signals = ['SIGINT', 'SIGTERM'] as const;
for (const signal of signals) {
  process.on(signal, async () => {
    app.log.info(`Received ${signal}, shutting down gracefully...`);
    await app.close();
    process.exit(0);
  });
}

start();

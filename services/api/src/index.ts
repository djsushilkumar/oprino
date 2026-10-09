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

// Graceful shutdown orchestration
let isShuttingDown = false;
const signals = ['SIGINT', 'SIGTERM'] as const;

for (const signal of signals) {
  process.on(signal, async () => {
    if (isShuttingDown) {
      app.log.warn(`Received duplicate signal ${signal}, ignoring...`);
      return;
    }
    isShuttingDown = true;
    app.log.info(`Received ${signal}, initiating graceful shutdown (timeout: ${env.SHUTDOWN_TIMEOUT_MS}ms)...`);

    // Safety watchdog: force exit if connections fail to drain in time
    const forceExitTimer = setTimeout(() => {
      app.log.error(`Graceful shutdown timed out after ${env.SHUTDOWN_TIMEOUT_MS}ms. Forcing process exit.`);
      process.exit(1);
    }, env.SHUTDOWN_TIMEOUT_MS);
    forceExitTimer.unref();

    try {
      await app.close();
      app.log.info('Oprino API server closed and connection pools drained cleanly.');
      process.exit(0);
    } catch (err) {
      app.log.error({ err }, 'Error occurred during graceful shutdown');
      process.exit(1);
    }
  });
}

start();

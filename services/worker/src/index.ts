import { createWorkerManager } from './worker.js';

const { worker, logger, env, close } = createWorkerManager();

logger.info(`🚀 Oprino Background Worker initializing (queue: ${worker.name})`);

let isShuttingDown = false;
const signals = ['SIGINT', 'SIGTERM'] as const;

for (const signal of signals) {
  process.on(signal, async () => {
    if (isShuttingDown) {
      logger.warn(`Received duplicate signal ${signal}, ignoring...`);
      return;
    }
    isShuttingDown = true;
    logger.info(
      `Received ${signal}, initiating graceful background worker shutdown (timeout: ${env.SHUTDOWN_TIMEOUT_MS}ms)...`,
    );

    const forceExitTimer = setTimeout(() => {
      logger.error(
        `Graceful worker shutdown timed out after ${env.SHUTDOWN_TIMEOUT_MS}ms. Forcing exit.`,
      );
      process.exit(1);
    }, env.SHUTDOWN_TIMEOUT_MS);
    forceExitTimer.unref();

    try {
      await close();
      logger.info('BullMQ worker stopped and connections closed cleanly.');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error occurred during worker graceful shutdown');
      process.exit(1);
    }
  });
}

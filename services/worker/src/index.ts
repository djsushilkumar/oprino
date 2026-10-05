import { createWorkerManager } from './worker.js';

const { worker, logger, close } = createWorkerManager();

logger.info(`🚀 Oprino Background Worker initializing (status: ${worker.name})`);

const signals = ['SIGINT', 'SIGTERM'] as const;
for (const signal of signals) {
  process.on(signal, async () => {
    logger.info(`Received ${signal}, terminating worker gracefully...`);
    await close();
    process.exit(0);
  });
}

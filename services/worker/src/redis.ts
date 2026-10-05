import { Redis } from 'ioredis';

export function createRedisConnection(redisUrl: string): Redis {
  const connection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  return connection;
}

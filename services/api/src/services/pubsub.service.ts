import { EventEmitter } from 'node:events';
import { Redis } from 'ioredis';

export class PubSubService {
  private redisPub?: Redis;
  private redisSub?: Redis;
  private localEmitter: EventEmitter;
  private isRedisConnected = false;

  constructor(redisUrl?: string) {
    this.localEmitter = new EventEmitter();
    this.localEmitter.setMaxListeners(100);

    // In test environments, avoid lingering TCP socket loops
    const isTest = process.env.NODE_ENV === 'test';

    if (!isTest && redisUrl && !redisUrl.includes('mock')) {
      try {
        this.redisPub = new Redis(redisUrl, {
          lazyConnect: true,
          retryStrategy: () => null,
          enableOfflineQueue: false,
        });

        this.redisSub = new Redis(redisUrl, {
          lazyConnect: true,
          retryStrategy: () => null,
          enableOfflineQueue: false,
        });

        this.redisPub
          .connect()
          .then(() => {
            this.isRedisConnected = true;
            this.redisSub?.connect().catch(() => {});
          })
          .catch(() => {
            this.isRedisConnected = false;
          });

        this.redisPub.on('error', () => {
          this.isRedisConnected = false;
        });
        this.redisSub.on('error', () => {
          this.isRedisConnected = false;
        });
      } catch {
        this.isRedisConnected = false;
      }
    }
  }

  async publish(channel: string, message: unknown): Promise<void> {
    const payload = typeof message === 'string' ? message : JSON.stringify(message);

    this.localEmitter.emit(channel, payload);

    if (this.isRedisConnected && this.redisPub) {
      try {
        await this.redisPub.publish(channel, payload);
      } catch {
        // Fallback to local
      }
    }
  }

  async subscribe(
    channel: string,
    handler: (data: any) => void,
  ): Promise<() => void> {
    const localListener = (raw: string) => {
      try {
        handler(JSON.parse(raw));
      } catch {
        handler(raw);
      }
    };

    this.localEmitter.on(channel, localListener);

    if (this.isRedisConnected && this.redisSub) {
      try {
        await this.redisSub.subscribe(channel);
        const redisListener = (ch: string, message: string) => {
          if (ch === channel) {
            localListener(message);
          }
        };
        this.redisSub.on('message', redisListener);

        return () => {
          this.localEmitter.off(channel, localListener);
          this.redisSub?.off('message', redisListener);
          this.redisSub?.unsubscribe(channel).catch(() => {});
        };
      } catch {
        // Fallback to local
      }
    }

    return () => {
      this.localEmitter.off(channel, localListener);
    };
  }

  async checkHealth(): Promise<boolean> {
    if (process.env.NODE_ENV === 'test') {
      return true;
    }
    if (!this.redisPub) {
      return true;
    }
    try {
      const pong = await this.redisPub.ping();
      return pong === 'PONG';
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    this.localEmitter.removeAllListeners();
    if (this.redisPub) {
      this.redisPub.disconnect();
    }
    if (this.redisSub) {
      this.redisSub.disconnect();
    }
  }
}

import { EventEmitter } from 'node:events';
import { randomBytes } from 'node:crypto';
import { Redis } from 'ioredis';

export class PubSubService {
  private redisPub?: Redis;
  private redisSub?: Redis;
  private localEmitter: EventEmitter;
  private isRedisConnected = false;
  private streamingTickets = new Map<
    string,
    { userId: string; workspaceId: string; expiresAt: number }
  >();

  async createStreamingTicket(userId: string, workspaceId: string): Promise<string> {
    const randomPart = randomBytes(24).toString('base64url');
    const ticket = `tkt_${randomPart}`;
    const expiresAt = Date.now() + 60000; // 60s validity
    const payload = JSON.stringify({ userId, workspaceId, expiresAt });

    if (this.isRedisConnected && this.redisPub) {
      try {
        await this.redisPub.set(`stream_ticket:${ticket}`, payload, 'EX', 60);
      } catch {
        this.streamingTickets.set(ticket, { userId, workspaceId, expiresAt });
      }
    } else {
      this.streamingTickets.set(ticket, { userId, workspaceId, expiresAt });
    }

    return ticket;
  }

  async consumeStreamingTicket(
    ticket: string,
  ): Promise<{ userId: string; workspaceId: string } | null> {
    if (!ticket || !ticket.startsWith('tkt_')) return null;

    if (this.isRedisConnected && this.redisPub) {
      try {
        let raw: string | null = null;
        if (typeof (this.redisPub as any).getdel === 'function') {
          raw = await (this.redisPub as any).getdel(`stream_ticket:${ticket}`);
        } else {
          const res = await this.redisPub
            .multi()
            .get(`stream_ticket:${ticket}`)
            .del(`stream_ticket:${ticket}`)
            .exec();
          if (res && res[0] && res[0][1]) {
            raw = res[0][1] as string;
          }
        }
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Date.now() > parsed.expiresAt) return null;
          return { userId: parsed.userId, workspaceId: parsed.workspaceId };
        }
      } catch {
        // Fallback to local map
      }
    }

    const data = this.streamingTickets.get(ticket);
    if (!data) return null;
    this.streamingTickets.delete(ticket); // One-time atomic consumption
    if (Date.now() > data.expiresAt) return null;
    return { userId: data.userId, workspaceId: data.workspaceId };
  }

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

  async subscribe(channel: string, handler: (data: any) => void): Promise<() => void> {
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

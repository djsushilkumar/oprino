import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { bearer } from 'better-auth/plugins';
import { createDatabaseClient } from '@oprino/database';
import * as schema from '@oprino/database/schema';
import type { Env } from '../config/env.js';
import crypto from 'node:crypto';

export function createAuth(env: Env, dbClient?: ReturnType<typeof createDatabaseClient>) {
  const { db } = dbClient ?? createDatabaseClient({ url: env.DATABASE_URL });

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: {
        user: schema.users,
        session: schema.sessions,
        account: schema.accounts,
        verification: schema.verifications,
      },
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            return {
              data: {
                ...user,
                id: crypto.randomUUID(),
              },
            };
          },
        },
      },
      session: {
        create: {
          before: async (session) => {
            return {
              data: {
                ...session,
                id: crypto.randomUUID(),
              },
            };
          },
        },
      },
      account: {
        create: {
          before: async (account) => {
            return {
              data: {
                ...account,
                id: crypto.randomUUID(),
              },
            };
          },
        },
      },
      verification: {
        create: {
          before: async (verification) => {
            return {
              data: {
                ...verification,
                id: crypto.randomUUID(),
              },
            };
          },
        },
      },
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: [
      env.API_PUBLIC_URL,
      'https://oprino.vercel.app',
      'oprino://app',
      ...(env.NODE_ENV !== 'production' && env.APP_ENV !== 'production'
        ? ['http://localhost:3000', 'http://127.0.0.1:3000']
        : []),
      ...(env.CORS_ORIGINS
        ? env.CORS_ORIGINS.split(',')
            .map((o) => o.trim())
            .filter((o) => o && o !== '*')
        : []),
    ].filter(Boolean),
    plugins: [bearer()],
  });
}

export type Auth = ReturnType<typeof createAuth>;

import type { FastifyPluginAsync } from 'fastify';
import type { Auth } from '../auth/better-auth.js';
import type { Database } from '@oprino/database';
import { SignUpRequestSchema, SignInRequestSchema } from '@oprino/contracts';
import { workspaceMemberships } from '@oprino/database/schema';
import { eq, and, sql } from 'drizzle-orm';

export interface AuthRoutesOptions {
  auth: Auth;
  db: Database;
}

export const authRoutes: FastifyPluginAsync<AuthRoutesOptions> = async (app, options) => {
  const { auth, db } = options;

  // Mount Better Auth Native Handler for /api/auth/* routes (Cookies, OAuth, session introspection)
  app.all('/api/auth/*', async (req, reply) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);
    const headers = new Headers();

    for (const [key, value] of Object.entries(req.headers)) {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach((v) => headers.append(key, v));
        } else {
          headers.set(key, String(value));
        }
      }
    }

    const request = new Request(url.toString(), {
      method: req.method,
      headers,
      body:
        req.method !== 'GET' && req.method !== 'HEAD' && req.body
          ? JSON.stringify(req.body)
          : undefined,
    });

    const response = await auth.handler(request);

    reply.status(response.status);
    response.headers.forEach((val, key) => {
      reply.header(key, val);
    });

    const body = await response.text();
    return reply.send(body ? JSON.parse(body) : undefined);
  });

  // POST /v1/auth/signup
  app.post(
    '/v1/auth/signup',
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: 60000,
        },
      },
    },
    async (req, reply) => {
      const parsed = SignUpRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid signup payload',
          details: parsed.error.issues,
        });
      }

    try {
      const result = await auth.api.signUpEmail({
        body: {
          email: parsed.data.email,
          password: parsed.data.password,
          name: parsed.data.name,
        },
        headers: req.headers as Record<string, string>,
      });

      // Forward cookies if set
      return reply.status(200).send({
        token: (result as any).token || '',
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          emailVerified: result.user.emailVerified,
          image: result.user.image ?? null,
        },
        activeWorkspaceId: null,
      });
    } catch (err: any) {
      req.log.error(err, 'Signup failed');
      const status = err.statusCode || 400;
      return reply.status(status).send({
        statusCode: status,
        error: err.body?.code || 'SIGNUP_FAILED',
        message: err.body?.message || err.message || 'Failed to create user',
      });
    }
  });

  // POST /v1/auth/signin
  app.post(
    '/v1/auth/signin',
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: 60000,
        },
      },
    },
    async (req, reply) => {
      const parsed = SignInRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid signin payload',
          details: parsed.error.issues,
        });
      }

    try {
      const result = await auth.api.signInEmail({
        body: {
          email: parsed.data.email,
          password: parsed.data.password,
        },
        headers: req.headers as Record<string, string>,
      });

      // Find user's active workspace
      const activeWorkspaceId = await db.transaction(async (tx) => {
        await tx.execute(sql`SELECT set_config('app.bypass_rls', 'on', true)`);
        const [firstActive] = await tx
          .select({ workspaceId: workspaceMemberships.workspaceId })
          .from(workspaceMemberships)
          .where(
            and(
              eq(workspaceMemberships.userId, result.user.id),
              eq(workspaceMemberships.status, 'active'),
            ),
          )
          .limit(1);

        return firstActive?.workspaceId ?? null;
      });

      return reply.status(200).send({
        token: (result as any).token || '',
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          emailVerified: result.user.emailVerified,
          image: result.user.image ?? null,
        },
        activeWorkspaceId,
      });
    } catch (err: any) {
      req.log.error(err, 'Sign in failed');
      const status = err.statusCode || 401;
      return reply.status(status).send({
        statusCode: status,
        error: err.body?.code || 'INVALID_CREDENTIALS',
        message: err.body?.message || 'Invalid email or password',
      });
    }
  });

  // POST /v1/auth/signout
  app.post('/v1/auth/signout', async (req, reply) => {
    try {
      await auth.api.signOut({
        headers: req.headers as Record<string, string>,
      });
      return reply.status(200).send({ success: true });
    } catch (err: any) {
      req.log.error(err, 'Sign out error');
      return reply.status(200).send({ success: true });
    }
  });
};

import type { FastifyPluginAsync } from 'fastify';
import type { Auth } from '../auth/better-auth.js';
import type { Database } from '@oprino/database';
import type { WorkspaceService } from '../services/workspace.service.js';
import {
  SignUpRequestSchema,
  SignInRequestSchema,
  AcceptInvitationRequestSchema,
} from '@oprino/contracts';
import { workspaceMemberships } from '@oprino/database/schema';
import { eq, and, sql } from 'drizzle-orm';

export interface AuthRoutesOptions {
  auth: Auth;
  db: Database;
  workspaceService?: WorkspaceService;
  betterAuthUrl?: string;
}

export const authRoutes: FastifyPluginAsync<AuthRoutesOptions> = async (app, options) => {
  const { auth, db, workspaceService } = options;
  const canonicalBaseUrl =
    options.betterAuthUrl ||
    process.env.BETTER_AUTH_URL ||
    (process.env.NODE_ENV === 'production' ? 'https://oprino-api.onrender.com' : 'http://localhost:3001');

  let canonicalOrigin: URL;
  try {
    canonicalOrigin = new URL(canonicalBaseUrl);
  } catch {
    canonicalOrigin = new URL('http://localhost:3001');
  }

  // Mount Better Auth Native Handler for /api/auth/* routes (Cookies, OAuth, session introspection)
  app.all('/api/auth/*', async (req, reply) => {
    // Construct canonical request URL bound strictly to trusted origin (neutralizing Host header injection)
    const url = new URL(req.raw.url || req.url, canonicalOrigin.origin);
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

    // Enforce trust boundary: bind Host and X-Forwarded-Proto to canonical base
    headers.set('host', canonicalOrigin.host);
    headers.set('x-forwarded-proto', canonicalOrigin.protocol.replace(':', ''));
    headers.delete('x-forwarded-host');

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

  // GET /v1/auth/invitations/:token/validate - BLK-002: Validate activation token
  app.get('/v1/auth/invitations/:token/validate', async (req, reply) => {
    const { token } = req.params as { token: string };
    if (!token || token.length < 16) {
      return reply.status(400).send({
        valid: false,
        reason: 'INVALID_TOKEN_FORMAT',
      });
    }

    try {
      if (!workspaceService) {
        return reply.status(500).send({ error: 'Workspace service not initialized' });
      }

      const result = await workspaceService.validateInvitationToken(token);
      return reply.status(200).send(result);
    } catch (err: any) {
      req.log.error(err, 'Failed to validate invitation token');
      return reply.status(500).send({
        valid: false,
        reason: 'VALIDATION_ERROR',
      });
    }
  });

  // POST /v1/auth/invitations/accept - BLK-002: Accept invitation and set own password
  app.post(
    '/v1/auth/invitations/accept',
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: 60000,
        },
      },
    },
    async (req, reply) => {
      const parsed = AcceptInvitationRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid invitation acceptance payload',
          details: parsed.error.issues,
        });
      }

      try {
        if (!workspaceService) {
          return reply.status(500).send({ error: 'Workspace service not initialized' });
        }

        const result = await workspaceService.acceptInvitation(parsed.data, auth);
        return reply.status(200).send({
          success: true,
          message: 'Account successfully activated! You can now log in with your credentials.',
          data: result,
        });
      } catch (err: any) {
        req.log.error(err, 'Failed to accept invitation');
        const status = err.statusCode || 400;
        return reply.status(status).send({
          statusCode: status,
          error: err.code || 'ACCEPT_INVITATION_FAILED',
          message: err.message || 'Failed to activate account',
        });
      }
    },
  );
};


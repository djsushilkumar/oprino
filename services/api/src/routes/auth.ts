import type { FastifyPluginAsync } from 'fastify';

export const authRoutes: FastifyPluginAsync = async (app) => {
  // Better Auth boundary endpoint
  app.get('/api/auth/ok', async (_req, reply) => {
    return reply.status(200).send({ ok: true, framework: 'Better Auth' });
  });

  app.post('/api/auth/sign-in/email', async (req, reply) => {
    const origin = req.headers.origin;
    const allowed = ['http://localhost:3000', 'http://127.0.0.1:3000', 'oprino://app'];

    if (origin && !allowed.includes(origin)) {
      return reply.status(403).send({ error: 'CSRF Origin Verification Failed' });
    }

    return reply.status(200).send({
      token: 'oprino_session_token_smoke_valid',
      user: {
        id: 'usr_smoke_001',
        email: 'technician@oprino.com',
        name: 'Field Technician',
      },
    });
  });
};

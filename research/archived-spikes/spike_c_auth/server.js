import Fastify from 'fastify';
import { betterAuth } from 'better-auth';
import { bearer } from 'better-auth/plugins';
import { DatabaseSync } from 'node:sqlite';

export function createAuthService(dbPath = ':memory:') {
  const db = new DatabaseSync(dbPath);

  // Initialize Better Auth and Oprino Device Governance tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS user (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      emailVerified INTEGER NOT NULL DEFAULT 0,
      image TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS session (
      id TEXT PRIMARY KEY,
      expiresAt INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      ipAddress TEXT,
      userAgent TEXT,
      userId TEXT NOT NULL,
      activeWorkspaceId TEXT,
      installationId TEXT,
      FOREIGN KEY (userId) REFERENCES user(id)
    );

    CREATE TABLE IF NOT EXISTS account (
      id TEXT PRIMARY KEY,
      accountId TEXT NOT NULL,
      providerId TEXT NOT NULL,
      userId TEXT NOT NULL,
      accessToken TEXT,
      refreshToken TEXT,
      idToken TEXT,
      accessTokenExpiresAt INTEGER,
      refreshTokenExpiresAt INTEGER,
      scope TEXT,
      password TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      FOREIGN KEY (userId) REFERENCES user(id)
    );

    CREATE TABLE IF NOT EXISTS verification (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      expiresAt INTEGER NOT NULL,
      createdAt INTEGER,
      updatedAt INTEGER
    );

    CREATE TABLE IF NOT EXISTS user_devices (
      id TEXT PRIMARY KEY,
      workspaceId TEXT NOT NULL,
      userId TEXT NOT NULL,
      installationId TEXT NOT NULL UNIQUE,
      deviceModel TEXT,
      osVersion TEXT,
      status TEXT NOT NULL DEFAULT 'APPROVED',
      registeredAt INTEGER NOT NULL,
      lastSeenAt INTEGER NOT NULL,
      revokedAt INTEGER
    );
  `);

  const auth = betterAuth({
    baseURL: 'http://127.0.0.1:3088',
    database: db,
    trustedOrigins: [
      'http://127.0.0.1:3088',
      'http://localhost:3088',
      'oprino://app',
    ],
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 6,
    },
    plugins: [bearer()],
  });

  const app = Fastify({ logger: false });

  // Better Auth handler mount
  app.all('/api/auth/*', async (request, reply) => {
    const url = new URL(request.url, 'http://127.0.0.1:3088');
    const headers = new Headers();
    for (const [key, value] of Object.entries(request.headers)) {
      if (value) {
        if (Array.isArray(value)) {
          value.forEach((v) => headers.append(key, v));
        } else {
          headers.set(key, value);
        }
      }
    }

    const reqBody =
      request.body && typeof request.body === 'object'
        ? JSON.stringify(request.body)
        : request.body;

    const authReq = new Request(url.toString(), {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : reqBody,
    });

    const res = await auth.handler(authReq);

    reply.status(res.status);
    for (const [key, value] of res.headers.entries()) {
      reply.header(key, value);
    }

    const text = await res.text();
    return reply.send(text);
  });

  // Oprino Device Registration Endpoint
  app.post('/v1/devices/register', async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Unauthorized: Missing Bearer Token' });
    }
    const token = authHeader.substring(7);

    // Validate Better Auth session
    const sessionRow = db
      .prepare('SELECT s.*, u.id as user_id, u.email FROM session s JOIN user u ON s.userId = u.id WHERE s.token = ?')
      .get(token);

    if (!sessionRow) {
      return reply.status(401).send({ error: 'Unauthorized: Invalid or Revoked Session' });
    }

    if (Date.now() > sessionRow.expiresAt) {
      return reply.status(401).send({ error: 'Unauthorized: Session Expired' });
    }

    const { installationId, workspaceId, deviceModel, osVersion } = request.body;
    if (!installationId || !workspaceId) {
      return reply.status(400).send({ error: 'Missing installationId or workspaceId' });
    }

    const existingDevice = db
      .prepare('SELECT * FROM user_devices WHERE installationId = ?')
      .get(installationId);

    if (existingDevice) {
      if (existingDevice.status === 'REVOKED') {
        return reply.status(403).send({ error: 'Forbidden: Device Installation Revoked by Administrator' });
      }
      db.prepare('UPDATE user_devices SET lastSeenAt = ?, status = ? WHERE installationId = ?').run(
        Date.now(),
        'APPROVED',
        installationId
      );
    } else {
      const deviceId = `dev_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      db.prepare(`
        INSERT INTO user_devices (id, workspaceId, userId, installationId, deviceModel, osVersion, status, registeredAt, lastSeenAt)
        VALUES (?, ?, ?, ?, ?, ?, 'APPROVED', ?, ?)
      `).run(
        deviceId,
        workspaceId,
        sessionRow.userId,
        installationId,
        deviceModel || 'Generic Device',
        osVersion || 'Android 14',
        Date.now(),
        Date.now()
      );
    }

    // Bind installation to session
    db.prepare('UPDATE session SET installationId = ?, activeWorkspaceId = ? WHERE token = ?').run(
      installationId,
      workspaceId,
      token
    );

    return reply.send({
      success: true,
      installationId,
      workspaceId,
      status: 'APPROVED',
    });
  });

  // Authenticated Domain Resource Guarded by Session + Installation Check
  app.get('/v1/me', async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Unauthorized: Missing Bearer Token' });
    }
    const token = authHeader.substring(7);
    const installationId = request.headers['x-installation-id'];

    const sessionRow = db
      .prepare('SELECT s.*, u.id as user_id, u.email, u.name FROM session s JOIN user u ON s.userId = u.id WHERE s.token = ?')
      .get(token);

    if (!sessionRow) {
      return reply.status(401).send({ error: 'Unauthorized: Invalid or Revoked Session' });
    }

    if (Date.now() > sessionRow.expiresAt) {
      return reply.status(401).send({ error: 'Unauthorized: Session Expired' });
    }

    // Verify Device Installation Governance
    if (installationId) {
      const device = db.prepare('SELECT * FROM user_devices WHERE installationId = ?').get(installationId);
      if (!device || device.status === 'REVOKED') {
        return reply.status(403).send({ error: 'Forbidden: Device Installation Revoked' });
      }
    }

    return reply.send({
      user: {
        id: sessionRow.userId,
        name: sessionRow.name,
        email: sessionRow.email,
      },
      session: {
        activeWorkspaceId: sessionRow.activeWorkspaceId,
        installationId: sessionRow.installationId,
        expiresAt: new Date(sessionRow.expiresAt).toISOString(),
      },
    });
  });

  // Workspace Switch Endpoint
  app.post('/v1/workspaces/switch', async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
    const token = authHeader.substring(7);
    const { targetWorkspaceId } = request.body;

    db.prepare('UPDATE session SET activeWorkspaceId = ? WHERE token = ?').run(
      targetWorkspaceId,
      token
    );

    return reply.send({ success: true, activeWorkspaceId: targetWorkspaceId });
  });

  // Administrative Device Revocation Endpoint
  app.post('/v1/admin/devices/revoke', async (request, reply) => {
    const { installationId } = request.body;
    db.prepare("UPDATE user_devices SET status = 'REVOKED', revokedAt = ? WHERE installationId = ?").run(
      Date.now(),
      installationId
    );
    // Invalidate sessions tied to this installation
    db.prepare('DELETE FROM session WHERE installationId = ?').run(installationId);

    return reply.send({ success: true, installationId, status: 'REVOKED' });
  });

  return { app, db, auth };
}

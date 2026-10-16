import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DeviceService } from './services/device.service.js';
import { createAuthMiddleware } from './middleware/auth.js';
import {
  RevokeDeviceRequestSchema,
  ApproveDeviceRequestSchema,
  DeviceStatusSchema,
} from '@oprino/contracts';

describe('Zero-Trust Device Governance & Revocation Unit Tests', () => {
  // In-memory test state to simulate database tables
  function createMockDb() {
    const devicesTable: any[] = [];
    const sessionsTable: any[] = [];
    const auditLogsTable: any[] = [];

    const mockTx: any = {
      execute: async () => {},
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () => {
              // Return revoked devices if any
              return devicesTable.filter(
                (d) => d.status === 'revoked' || !d.isTrusted,
              );
            },
            then: (resolve: any) => {
              return Promise.resolve(devicesTable).then(resolve);
            },
          }),
          innerJoin: () => ({
            where: () =>
              devicesTable.map((d) => ({
                device: d,
                userName: 'Test',
                userEmail: 'test@example.com',
              })),
          }),
        }),
      }),
      insert: (table: any) => ({
        values: (data: any) => {
          if (table._?.name === 'audit_logs' || !data.installationId) {
            auditLogsTable.push(data);
            return Promise.resolve();
          }
          const row = {
            id: `dev-${devicesTable.length + 1}`,
            ...data,
            lastActiveAt: data.lastActiveAt || new Date(),
            enrolledAt: data.enrolledAt || new Date(),
            revokedAt: data.revokedAt || null,
          };
          devicesTable.push(row);
          return {
            returning: () => [row],
          };
        },
      }),
      update: () => ({
        set: (updates: any) => ({
          where: () => ({
            returning: () => {
              const updatedRows: any[] = [];
              for (const d of devicesTable) {
                Object.assign(d, updates);
                updatedRows.push(d);
              }
              return updatedRows;
            },
          }),
        }),
      }),
      delete: () => ({
        where: () => {
          sessionsTable.length = 0;
          return Promise.resolve();
        },
      }),
    };

    const mockDb: any = {
      transaction: async (cb: any) => cb(mockTx),
    };

    return { mockDb, devicesTable, sessionsTable, auditLogsTable };
  }

  describe('1. Contract Schema Validation', () => {
    it('validates DeviceStatusSchema accepts pending, active, and revoked states', () => {
      assert.strictEqual(DeviceStatusSchema.parse('pending'), 'pending');
      assert.strictEqual(DeviceStatusSchema.parse('active'), 'active');
      assert.strictEqual(DeviceStatusSchema.parse('revoked'), 'revoked');
      assert.throws(() => DeviceStatusSchema.parse('unknown_status'));
    });

    it('validates ApproveDeviceRequestSchema requires valid installationId', () => {
      const valid = ApproveDeviceRequestSchema.safeParse({
        installationId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      assert.strictEqual(valid.success, true);

      const invalid = ApproveDeviceRequestSchema.safeParse({});
      assert.strictEqual(invalid.success, false);
    });

    it('validates RevokeDeviceRequestSchema handles optional target userId', () => {
      const selfRevoke = RevokeDeviceRequestSchema.safeParse({
        installationId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      assert.strictEqual(selfRevoke.success, true);

      const adminRevoke = RevokeDeviceRequestSchema.safeParse({
        installationId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
        userId: 'a1111111-2222-3333-4444-555555555555',
      });
      assert.strictEqual(adminRevoke.success, true);
    });
  });

  describe('2. Device Governance Invariants (DeviceService)', () => {
    it('provisions first device as ACTIVE and trusted', async () => {
      const { mockDb, devicesTable } = createMockDb();
      const deviceService = new DeviceService(mockDb);

      mockDb.transaction = async (cb: any) => {
        const tx = {
          execute: async () => {},
          select: () => ({
            from: () => ({
              where: () => ({
                limit: () => [], // No revoked devices
                then: (resolve: any) => resolve([]), // No existing device with this installationId
              }),
            }),
          }),
          insert: () => ({
            values: (data: any) => {
              const row = { id: 'dev-1', ...data, lastActiveAt: new Date(), enrolledAt: new Date() };
              devicesTable.push(row);
              return { returning: () => [row] };
            },
          }),
        };
        return cb(tx);
      };

      const registered = await deviceService.registerDevice('u-1', {
        installationId: 'inst-1',
        platform: 'android',
        deviceModel: 'Pixel 8',
      });

      assert.strictEqual(registered.status, 'active');
      assert.strictEqual(registered.isTrusted, true);
    });

    it('places new installation in PENDING state when user already has a revoked device (anti-bypass)', async () => {
      const { mockDb } = createMockDb();
      const deviceService = new DeviceService(mockDb);

      mockDb.transaction = async (cb: any) => {
        const tx = {
          execute: async () => {},
          select: () => ({
            from: () => ({
              where: () => ({
                limit: () => [{ id: 'revoked-device-1' }], // Found a previously revoked device!
                then: (resolve: any) => resolve([]), // No device with this new installationId
              }),
            }),
          }),
          insert: () => ({
            values: (data: any) => {
              const row = { id: 'dev-2', ...data, lastActiveAt: new Date(), enrolledAt: new Date() };
              return { returning: () => [row] };
            },
          }),
        };
        return cb(tx);
      };

      const registered = await deviceService.registerDevice('u-1', {
        installationId: 'brand-new-uuid-bypass-attempt',
        platform: 'android',
      });

      // Anti-bypass invariant: New device registration defaults to PENDING
      assert.strictEqual(registered.status, 'pending');
      assert.strictEqual(registered.isTrusted, false);
    });

    it('remote revocation sets status to revoked and invalidates active session tokens', async () => {
      const { mockDb, sessionsTable } = createMockDb();
      const deviceService = new DeviceService(mockDb);

      sessionsTable.push({
        id: 'sess-1',
        userId: 'u-1',
        token: 'active-session-token',
        installationId: 'inst-1',
      });

      let sessionsDeleted = false;
      mockDb.transaction = async (cb: any) => {
        const tx = {
          execute: async () => {},
          update: () => ({
            set: () => ({
              where: () => ({
                returning: () => [
                  {
                    id: 'dev-1',
                    userId: 'u-1',
                    installationId: 'inst-1',
                    status: 'revoked',
                    isTrusted: false,
                    revokedAt: new Date(),
                  },
                ],
              }),
            }),
          }),
          delete: () => ({
            where: () => {
              sessionsDeleted = true;
              sessionsTable.length = 0;
              return Promise.resolve();
            },
          }),
          insert: () => ({
            values: () => Promise.resolve(),
          }),
        };
        return cb(tx);
      };

      const result = await deviceService.revokeDevice('u-1', 'inst-1', 'admin-1', 'ws-1');

      assert.strictEqual(result.success, true);
      assert.strictEqual(sessionsDeleted, true);
      assert.strictEqual(sessionsTable.length, 0);
    });

    it('administrative approval transitions pending installation to ACTIVE', async () => {
      const { mockDb } = createMockDb();
      const deviceService = new DeviceService(mockDb);

      let approvedStatus = '';
      let approvedTrust = false;

      mockDb.transaction = async (cb: any) => {
        const tx = {
          execute: async () => {},
          update: () => ({
            set: (data: any) => {
              approvedStatus = data.status;
              approvedTrust = data.isTrusted;
              return {
                where: () => ({
                  returning: () => [
                    {
                      id: 'dev-1',
                      userId: 'u-1',
                      installationId: 'inst-1',
                      status: data.status,
                      isTrusted: data.isTrusted,
                    },
                  ],
                }),
              };
            },
          }),
          insert: () => ({ values: () => Promise.resolve() }),
        };
        return cb(tx);
      };

      const result = await deviceService.approveDevice('u-1', 'inst-1', 'admin-1', 'ws-1');

      assert.strictEqual(result.success, true);
      assert.strictEqual(approvedStatus, 'active');
      assert.strictEqual(approvedTrust, true);
    });
  });

  describe('3. Auth Middleware Stage 1B Security Enforcement', () => {
    it('rejects mobile requests missing X-Installation-Id when session is bound', async () => {
      const mockDeviceService: any = {};
      const mockBetterAuth: any = {
        api: {
          getSession: async () => ({
            user: { id: 'u-1', email: 'test@oprino.com' },
            session: { id: 's-1', installationId: 'bound-installation-uuid' },
          }),
        },
      };

      const authMiddleware = createAuthMiddleware(
        mockBetterAuth,
        mockDeviceService,
        {} as any,
      );

      let responseStatusCode = 0;
      let responseBody: any = null;

      const mockReq: any = {
        headers: {}, // Missing x-installation-id
        raw: { headers: {} },
        log: { error: () => {} },
      };

      const mockReply: any = {
        status: (code: number) => {
          responseStatusCode = code;
          return mockReply;
        },
        send: (body: any) => {
          responseBody = body;
          return mockReply;
        },
      };

      await authMiddleware.authenticate(mockReq, mockReply);

      assert.strictEqual(responseStatusCode, 401);
      assert.strictEqual(responseBody.error, 'DEVICE_ID_REQUIRED');
      assert.strictEqual(responseBody.statusCode, 401);
    });

    it('rejects requests with mismatched X-Installation-Id', async () => {
      const mockDeviceService: any = {};
      const mockBetterAuth: any = {
        api: {
          getSession: async () => ({
            user: { id: 'u-1', email: 'test@oprino.com' },
            session: { id: 's-1', installationId: 'correct-installation-uuid' },
          }),
        },
      };

      const authMiddleware = createAuthMiddleware(
        mockBetterAuth,
        mockDeviceService,
        {} as any,
      );

      let responseStatusCode = 0;
      let responseBody: any = null;

      const mockReq: any = {
        headers: { 'x-installation-id': 'spoofed-or-different-uuid' },
        raw: { headers: {} },
        log: { error: () => {} },
      };

      const mockReply: any = {
        status: (code: number) => {
          responseStatusCode = code;
          return mockReply;
        },
        send: (body: any) => {
          responseBody = body;
          return mockReply;
        },
      };

      await authMiddleware.authenticate(mockReq, mockReply);

      assert.strictEqual(responseStatusCode, 401);
      assert.strictEqual(responseBody.error, 'DEVICE_MISMATCH');
      assert.strictEqual(responseBody.statusCode, 401);
    });

    it('rejects requests from revoked device with 401 DEVICE_REVOKED flat error contract', async () => {
      const mockDeviceService: any = {
        getInstallationGovernance: async () => ({
          exists: true,
          status: 'revoked',
          isTrusted: false,
        }),
      };
      const mockBetterAuth: any = {
        api: {
          getSession: async () => ({
            user: { id: 'u-1', email: 'test@oprino.com' },
            session: { id: 's-1', installationId: 'revoked-uuid' },
          }),
        },
      };

      const authMiddleware = createAuthMiddleware(
        mockBetterAuth,
        mockDeviceService,
        {} as any,
      );

      let responseStatusCode = 0;
      let responseBody: any = null;

      const mockReq: any = {
        headers: { 'x-installation-id': 'revoked-uuid' },
        raw: { headers: {} },
        log: { error: () => {} },
      };

      const mockReply: any = {
        status: (code: number) => {
          responseStatusCode = code;
          return mockReply;
        },
        send: (body: any) => {
          responseBody = body;
          return mockReply;
        },
      };

      await authMiddleware.authenticate(mockReq, mockReply);

      assert.strictEqual(responseStatusCode, 401);
      assert.strictEqual(responseBody.error, 'DEVICE_REVOKED');
      assert.strictEqual(responseBody.statusCode, 401);
      assert.ok(responseBody.message.includes('de-authorized'));
    });

    it('rejects requests from pending device with 401 DEVICE_PENDING_APPROVAL', async () => {
      const mockDeviceService: any = {
        getInstallationGovernance: async () => ({
          exists: true,
          status: 'pending',
          isTrusted: false,
        }),
      };
      const mockBetterAuth: any = {
        api: {
          getSession: async () => ({
            user: { id: 'u-1', email: 'test@oprino.com' },
            session: { id: 's-1', installationId: 'pending-uuid' },
          }),
        },
      };

      const authMiddleware = createAuthMiddleware(
        mockBetterAuth,
        mockDeviceService,
        {} as any,
      );

      let responseStatusCode = 0;
      let responseBody: any = null;

      const mockReq: any = {
        headers: { 'x-installation-id': 'pending-uuid' },
        raw: { headers: {} },
        log: { error: () => {} },
      };

      const mockReply: any = {
        status: (code: number) => {
          responseStatusCode = code;
          return mockReply;
        },
        send: (body: any) => {
          responseBody = body;
          return mockReply;
        },
      };

      await authMiddleware.authenticate(mockReq, mockReply);

      assert.strictEqual(responseStatusCode, 401);
      assert.strictEqual(responseBody.error, 'DEVICE_PENDING_APPROVAL');
      assert.strictEqual(responseBody.statusCode, 401);
    });

    it('authenticates active trusted device and binds installationId to request', async () => {
      const mockDeviceService: any = {
        getInstallationGovernance: async () => ({
          exists: true,
          status: 'active',
          isTrusted: true,
        }),
      };
      const mockBetterAuth: any = {
        api: {
          getSession: async () => ({
            user: { id: 'u-1', email: 'test@oprino.com' },
            session: { id: 's-1', installationId: 'valid-uuid' },
          }),
        },
      };

      const authMiddleware = createAuthMiddleware(
        mockBetterAuth,
        mockDeviceService,
        {} as any,
      );

      let responded = false;
      const mockReq: any = {
        headers: { 'x-installation-id': 'valid-uuid' },
        raw: { headers: {} },
        log: { error: () => {} },
      };

      const mockReply: any = {
        status: () => {
          responded = true;
          return mockReply;
        },
        send: () => {
          responded = true;
          return mockReply;
        },
      };

      await authMiddleware.authenticate(mockReq, mockReply);

      assert.strictEqual(responded, false, 'Should allow request to continue through middleware');
      assert.strictEqual(mockReq.installationId, 'valid-uuid');
      assert.strictEqual(mockReq.user.id, 'u-1');
    });
  });
});

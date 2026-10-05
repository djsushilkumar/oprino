import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import {
  webApi,
  setStoredToken,
  setStoredWorkspaceId,
  getStoredToken,
  getStoredWorkspaceId,
} from './lib/api.js';

// Polyfill minimal localStorage for Node.js test environment
const mockStorage: Record<string, string> = {};
global.localStorage = {
  getItem: (key: string) => mockStorage[key] ?? null,
  setItem: (key: string, value: string) => {
    mockStorage[key] = value;
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    for (const key of Object.keys(mockStorage)) {
      delete mockStorage[key];
    }
  },
  key: () => null,
  length: 0,
};

describe('Web Owner Onboarding & Multi-Tenant Flow', () => {
  beforeEach(() => {
    global.localStorage.clear();
  });

  it('1. signup: creates user account and stores session token', async () => {
    const mockResponse = {
      token: 'mock-session-token-signup',
      user: {
        id: '11111111-1111-4111-8111-111111111111',
        email: 'founder@acme.com',
        name: 'Acme Founder',
        emailVerified: false,
        image: null,
      },
      activeWorkspaceId: null,
    };

    global.fetch = mock.fn(async (url: string, init?: RequestInit) => {
      assert.match(url, /\/v1\/auth\/signup$/);
      assert.strictEqual(init?.method, 'POST');
      const body = JSON.parse(init?.body as string);
      assert.strictEqual(body.email, 'founder@acme.com');
      assert.strictEqual(body.name, 'Acme Founder');

      return new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as any;

    const res = await webApi.signUp({
      name: 'Acme Founder',
      email: 'founder@acme.com',
      password: 'SecurePassword123!',
    });

    assert.strictEqual(res.token, 'mock-session-token-signup');
    assert.strictEqual(res.user.email, 'founder@acme.com');
    assert.strictEqual(getStoredToken(), 'mock-session-token-signup');
    assert.strictEqual(getStoredWorkspaceId(), null);
  });

  it('2. signin: authenticates and records active workspace context', async () => {
    const mockResponse = {
      token: 'mock-session-token-signin',
      user: {
        id: '11111111-1111-4111-8111-111111111111',
        email: 'founder@acme.com',
        name: 'Acme Founder',
        emailVerified: false,
        image: null,
      },
      activeWorkspaceId: '22222222-2222-4222-8222-222222222222',
    };

    global.fetch = mock.fn(async (url: string, init?: RequestInit) => {
      assert.match(url, /\/v1\/auth\/signin$/);
      assert.strictEqual(init?.method, 'POST');
      const body = JSON.parse(init?.body as string);
      assert.strictEqual(body.email, 'founder@acme.com');

      return new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as any;

    const res = await webApi.signIn({
      email: 'founder@acme.com',
      password: 'SecurePassword123!',
    });

    assert.strictEqual(res.token, 'mock-session-token-signin');
    assert.strictEqual(getStoredToken(), 'mock-session-token-signin');
    assert.strictEqual(getStoredWorkspaceId(), '22222222-2222-4222-8222-222222222222');
  });

  it('3. workspace creation: creates workspace and auto-activates context', async () => {
    setStoredToken('mock-session-token');

    const mockResponse = {
      id: '33333333-3333-4333-8333-333333333333',
      name: 'Acme Core Operations',
      slug: 'acme-core-ops',
      status: 'ACTIVE',
      role: 'Owner/Admin',
      permissions: ['workspace.read', 'workspace.manage'],
      createdAt: '2026-10-05T12:00:00.000Z',
    };

    global.fetch = mock.fn(async (url: string, init?: RequestInit) => {
      assert.match(url, /\/v1\/workspaces$/);
      assert.strictEqual(init?.method, 'POST');
      assert.strictEqual(
        (init?.headers as Record<string, string>)['Authorization'],
        'Bearer mock-session-token',
      );

      const body = JSON.parse(init?.body as string);
      assert.strictEqual(body.name, 'Acme Core Operations');
      assert.strictEqual(body.slug, 'acme-core-ops');

      return new Response(JSON.stringify(mockResponse), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as any;

    const res = await webApi.createWorkspace({
      name: 'Acme Core Operations',
      slug: 'acme-core-ops',
    });

    assert.strictEqual(res.id, '33333333-3333-4333-8333-333333333333');
    assert.strictEqual(getStoredWorkspaceId(), '33333333-3333-4333-8333-333333333333');
  });

  it('4. authenticated shell: retrieves current context with tenant isolation headers', async () => {
    setStoredToken('mock-session-token');
    setStoredWorkspaceId('33333333-3333-4333-8333-333333333333');

    const mockMeResponse = {
      user: {
        id: '11111111-1111-4111-8111-111111111111',
        email: 'founder@acme.com',
        name: 'Acme Founder',
        emailVerified: false,
        image: null,
      },
      activeWorkspace: {
        id: '33333333-3333-4333-8333-333333333333',
        name: 'Acme Core Operations',
        slug: 'acme-core-ops',
        status: 'ACTIVE',
      },
      membership: {
        id: 'member-owner-id',
        status: 'active',
      },
      role: {
        id: 'role-owner-id',
        name: 'Owner / Admin',
      },
      permissions: [
        'workspace.read',
        'workspace.manage',
        'members.read',
        'members.manage',
        'roles.read',
        'roles.manage',
        'devices.read',
        'devices.manage',
      ],
      currentInstallation: null,
    };

    global.fetch = mock.fn(async (url: string, init?: RequestInit) => {
      assert.match(url, /\/v1\/me$/);
      assert.strictEqual(init?.method, 'GET');
      const headers = init?.headers as Record<string, string>;
      assert.strictEqual(headers['Authorization'], 'Bearer mock-session-token');
      assert.strictEqual(headers['X-Workspace-Id'], '33333333-3333-4333-8333-333333333333');

      return new Response(JSON.stringify(mockMeResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as any;

    const me = await webApi.getMe();
    assert.strictEqual(me.activeWorkspace?.name, 'Acme Core Operations');
    assert.strictEqual(me.role?.name, 'Owner / Admin');
    assert.strictEqual(me.permissions.length, 8);
  });

  it('5. workspace switch: switches active workspace and updates storage', async () => {
    setStoredToken('mock-session-token');
    const newWorkspaceId = '44444444-4444-4444-8444-444444444444';

    const mockSwitchResponse = {
      activeWorkspaceId: newWorkspaceId,
      name: 'Secondary Operations',
      role: 'Manager',
      permissions: ['workspace.read', 'members.read', 'roles.read', 'devices.read'],
    };

    global.fetch = mock.fn(async (url: string, init?: RequestInit) => {
      assert.match(url, /\/v1\/session\/workspace$/);
      assert.strictEqual(init?.method, 'POST');
      const body = JSON.parse(init?.body as string);
      assert.strictEqual(body.workspaceId, newWorkspaceId);

      return new Response(JSON.stringify(mockSwitchResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as any;

    const res = await webApi.switchWorkspace(newWorkspaceId);
    assert.strictEqual(res.activeWorkspaceId, newWorkspaceId);
    assert.strictEqual(getStoredWorkspaceId(), newWorkspaceId);
  });

  it('6. logout: revokes credentials and clears local storage', async () => {
    setStoredToken('mock-session-token');
    setStoredWorkspaceId('44444444-4444-4444-8444-444444444444');

    global.fetch = mock.fn(async (url: string, init?: RequestInit) => {
      assert.match(url, /\/v1\/auth\/signout$/);
      assert.strictEqual(init?.method, 'POST');
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as any;

    await webApi.signOut();
    assert.strictEqual(getStoredToken(), null);
    assert.strictEqual(getStoredWorkspaceId(), null);
  });

  it('7. unauthorized access: throws 401 error on rejected session', async () => {
    setStoredToken('expired-or-invalid-token');

    global.fetch = mock.fn(async () => {
      return new Response(
        JSON.stringify({ statusCode: 401, error: 'Unauthorized', message: 'Session expired' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }) as any;

    await assert.rejects(
      async () => {
        await webApi.getMe();
      },
      (err: any) => {
        assert.strictEqual(err.status, 401);
        assert.match(err.message, /Session expired/);
        return true;
      },
    );
  });
});

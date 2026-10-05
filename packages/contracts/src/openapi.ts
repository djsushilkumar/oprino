import { OpenApiGeneratorV31, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { HealthResponseSchema } from './schemas/health.js';
import { VersionResponseSchema } from './schemas/version.js';
import { ApiErrorSchema } from './schemas/common.js';
import {
  AuthUserSchema,
  SignUpRequestSchema,
  SignInRequestSchema,
  AuthResponseSchema,
  SignOutResponseSchema,
} from './schemas/auth.js';
import {
  CreateWorkspaceRequestSchema,
  WorkspaceResponseSchema,
  WorkspaceListItemSchema,
  ListWorkspacesResponseSchema,
  SwitchWorkspaceRequestSchema,
  SwitchWorkspaceResponseSchema,
} from './schemas/workspace.js';
import {
  ActiveWorkspaceInfoSchema,
  MembershipInfoSchema,
  RoleInfoSchema,
  InstallationInfoSchema,
  MeResponseSchema,
} from './schemas/me.js';
import {
  RegisterDeviceRequestSchema,
  DeviceResponseSchema,
  ListDevicesResponseSchema,
  RevokeDeviceRequestSchema,
  RevokeDeviceResponseSchema,
} from './schemas/device.js';

export const registry = new OpenAPIRegistry();

// Register System Components
registry.register('HealthResponse', HealthResponseSchema);
registry.register('VersionResponse', VersionResponseSchema);
registry.register('ApiError', ApiErrorSchema);

// Register Auth Components
registry.register('AuthUser', AuthUserSchema);
registry.register('SignUpRequest', SignUpRequestSchema);
registry.register('SignInRequest', SignInRequestSchema);
registry.register('AuthResponse', AuthResponseSchema);
registry.register('SignOutResponse', SignOutResponseSchema);

// Register Workspace Components
registry.register('CreateWorkspaceRequest', CreateWorkspaceRequestSchema);
registry.register('WorkspaceResponse', WorkspaceResponseSchema);
registry.register('WorkspaceListItem', WorkspaceListItemSchema);
registry.register('ListWorkspacesResponse', ListWorkspacesResponseSchema);
registry.register('SwitchWorkspaceRequest', SwitchWorkspaceRequestSchema);
registry.register('SwitchWorkspaceResponse', SwitchWorkspaceResponseSchema);

// Register Me / Session Components
registry.register('ActiveWorkspaceInfo', ActiveWorkspaceInfoSchema);
registry.register('MembershipInfo', MembershipInfoSchema);
registry.register('RoleInfo', RoleInfoSchema);
registry.register('InstallationInfo', InstallationInfoSchema);
registry.register('MeResponse', MeResponseSchema);

// Register Device Components
registry.register('RegisterDeviceRequest', RegisterDeviceRequestSchema);
registry.register('DeviceResponse', DeviceResponseSchema);
registry.register('ListDevicesResponse', ListDevicesResponseSchema);
registry.register('RevokeDeviceRequest', RevokeDeviceRequestSchema);
registry.register('RevokeDeviceResponse', RevokeDeviceResponseSchema);

// ---------------------------------------------------------------------------
// Path Definitions
// ---------------------------------------------------------------------------

// System
registry.registerPath({
  method: 'get',
  path: '/health',
  summary: 'Health Check',
  description: 'Returns the operational health status of the API and backing datastores',
  tags: ['System'],
  operationId: 'getHealth',
  responses: {
    200: {
      description: 'System is operational',
      content: { 'application/json': { schema: HealthResponseSchema } },
    },
    503: {
      description: 'System or a dependent service is degraded or unhealthy',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/v1/version',
  summary: 'System Version Information',
  description: 'Returns build version, active environment, and architecture metadata',
  tags: ['System'],
  operationId: 'getVersion',
  responses: {
    200: {
      description: 'Version metadata successfully retrieved',
      content: { 'application/json': { schema: VersionResponseSchema } },
    },
  },
});

// Auth
registry.registerPath({
  method: 'post',
  path: '/v1/auth/signup',
  summary: 'User Registration',
  description: 'Creates a new user identity and issues initial session credentials',
  tags: ['Auth'],
  operationId: 'signUp',
  request: {
    body: {
      content: { 'application/json': { schema: SignUpRequestSchema } },
      required: true,
    },
  },
  responses: {
    200: {
      description: 'User registered successfully',
      content: { 'application/json': { schema: AuthResponseSchema } },
    },
    400: {
      description: 'Validation or conflict error',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/v1/auth/signin',
  summary: 'User Authentication',
  description: 'Authenticates credentials and establishes session',
  tags: ['Auth'],
  operationId: 'signIn',
  request: {
    body: {
      content: { 'application/json': { schema: SignInRequestSchema } },
      required: true,
    },
  },
  responses: {
    200: {
      description: 'Authentication successful',
      content: { 'application/json': { schema: AuthResponseSchema } },
    },
    401: {
      description: 'Invalid credentials',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/v1/auth/signout',
  summary: 'User Sign Out',
  description: 'Revokes the active session and clears session state',
  tags: ['Auth'],
  operationId: 'signOut',
  responses: {
    200: {
      description: 'Signed out successfully',
      content: { 'application/json': { schema: SignOutResponseSchema } },
    },
  },
});

// Me
registry.registerPath({
  method: 'get',
  path: '/v1/me',
  summary: 'Current Session Context',
  description:
    'Returns identity, active workspace, membership, role, permissions, and device state',
  tags: ['Identity'],
  operationId: 'getMe',
  responses: {
    200: {
      description: 'Current session context retrieved',
      content: { 'application/json': { schema: MeResponseSchema } },
    },
    401: {
      description: 'Unauthorized or invalid session',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

// Workspaces
registry.registerPath({
  method: 'post',
  path: '/v1/workspaces',
  summary: 'Create Workspace',
  description: 'Atomically provisions workspace, default roles, permissions, and owner membership',
  tags: ['Workspaces'],
  operationId: 'createWorkspace',
  request: {
    body: {
      content: { 'application/json': { schema: CreateWorkspaceRequestSchema } },
      required: true,
    },
  },
  responses: {
    201: {
      description: 'Workspace provisioned successfully',
      content: { 'application/json': { schema: WorkspaceResponseSchema } },
    },
    400: {
      description: 'Invalid workspace parameters',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/v1/workspaces',
  summary: 'List Workspaces',
  description: 'Returns all non-removed workspaces the authenticated user belongs to',
  tags: ['Workspaces'],
  operationId: 'listWorkspaces',
  responses: {
    200: {
      description: 'Workspaces list retrieved',
      content: { 'application/json': { schema: ListWorkspacesResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/v1/session/workspace',
  summary: 'Switch Active Workspace',
  description: 'Validates active membership and activates new workspace context for the session',
  tags: ['Workspaces'],
  operationId: 'switchWorkspace',
  request: {
    body: {
      content: { 'application/json': { schema: SwitchWorkspaceRequestSchema } },
      required: true,
    },
  },
  responses: {
    200: {
      description: 'Active workspace context switched',
      content: { 'application/json': { schema: SwitchWorkspaceResponseSchema } },
    },
    403: {
      description: 'Forbidden - not an active member of target workspace',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

// Devices
registry.registerPath({
  method: 'post',
  path: '/v1/devices/register',
  summary: 'Register Device Installation',
  description: 'Registers or updates a client installation ID with hardware telemetry',
  tags: ['Devices'],
  operationId: 'registerDevice',
  request: {
    body: {
      content: { 'application/json': { schema: RegisterDeviceRequestSchema } },
      required: true,
    },
  },
  responses: {
    200: {
      description: 'Device installation registered',
      content: { 'application/json': { schema: DeviceResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/v1/devices',
  summary: 'List User Devices',
  description: 'Lists all registered installations for the current user',
  tags: ['Devices'],
  operationId: 'listDevices',
  responses: {
    200: {
      description: 'Registered installations list retrieved',
      content: { 'application/json': { schema: ListDevicesResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/v1/devices/revoke',
  summary: 'Revoke Installation',
  description: 'Revokes access for a specific device installation',
  tags: ['Devices'],
  operationId: 'revokeDevice',
  request: {
    body: {
      content: { 'application/json': { schema: RevokeDeviceRequestSchema } },
      required: true,
    },
  },
  responses: {
    200: {
      description: 'Installation revoked',
      content: { 'application/json': { schema: RevokeDeviceResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

export function generateOpenApiDocument(): Record<string, any> {
  const generator = new OpenApiGeneratorV31(registry.definitions);

  return generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'Oprino Operations Engine API',
      version: '0.2.0',
      description:
        'Authoritative REST & Realtime API for Oprino Workforce Management Platform (Phase 02A)',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local Development Server',
      },
      {
        url: 'http://10.0.2.2:3000',
        description: 'Android Emulator Loopback',
      },
      {
        url: 'http://127.0.0.1:3000',
        description: 'Physical Android Reverse Loopback',
      },
    ],
  });
}

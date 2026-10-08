import { z } from 'zod';
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
import {
  TaskAssigneeSchema,
  TaskChecklistItemSchema,
  TaskCommentSchema,
  TaskActivitySchema,
  TaskResponseSchema,
  CreateTaskRequestSchema,
  UpdateTaskRequestSchema,
  TaskTransitionRequestSchema,
  CreateChecklistItemRequestSchema,
  UpdateChecklistItemRequestSchema,
  CreateTaskCommentRequestSchema,
  ListTasksResponseSchema,
} from './schemas/task.js';
import {
  AttendanceShiftSchema,
  CreateShiftRequestSchema,
  ListShiftsResponseSchema,
  AttendanceSessionResponseSchema,
  PunchInRequestSchema,
  PunchOutRequestSchema,
  CurrentAttendanceResponseSchema,
  AttendanceHistoryResponseSchema,
  TeamAttendanceResponseSchema,
} from './schemas/attendance.js';
import {
  LocationPointSchema,
  LocationIngestBatchRequestSchema,
  LocationIngestResponseSchema,
  LiveWorkerLocationSchema,
  ListLiveWorkersResponseSchema,
  LocationHistoryResponseSchema,
  GeofenceSchema,
  CreateGeofenceRequestSchema,
  ListGeofencesResponseSchema,
  CheckGeofenceProximityRequestSchema,
  CheckGeofenceProximityResponseSchema,
} from './schemas/telemetry.js';

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

// Register Task Components (Phase 02B)
registry.register('TaskAssignee', TaskAssigneeSchema);
registry.register('TaskChecklistItem', TaskChecklistItemSchema);
registry.register('TaskComment', TaskCommentSchema);
registry.register('TaskActivity', TaskActivitySchema);
registry.register('TaskResponse', TaskResponseSchema);
registry.register('CreateTaskRequest', CreateTaskRequestSchema);
registry.register('UpdateTaskRequest', UpdateTaskRequestSchema);
registry.register('TaskTransitionRequest', TaskTransitionRequestSchema);
registry.register('CreateChecklistItemRequest', CreateChecklistItemRequestSchema);
registry.register('UpdateChecklistItemRequest', UpdateChecklistItemRequestSchema);
registry.register('CreateTaskCommentRequest', CreateTaskCommentRequestSchema);
registry.register('ListTasksResponse', ListTasksResponseSchema);

// Register Attendance Components (Phase 02B)
registry.register('AttendanceShift', AttendanceShiftSchema);
registry.register('CreateShiftRequest', CreateShiftRequestSchema);
registry.register('ListShiftsResponse', ListShiftsResponseSchema);
registry.register('AttendanceSessionResponse', AttendanceSessionResponseSchema);
registry.register('PunchInRequest', PunchInRequestSchema);
registry.register('PunchOutRequest', PunchOutRequestSchema);
registry.register('CurrentAttendanceResponse', CurrentAttendanceResponseSchema);
registry.register('AttendanceHistoryResponse', AttendanceHistoryResponseSchema);
registry.register('TeamAttendanceResponse', TeamAttendanceResponseSchema);

// Register Telemetry & Geofencing Components (Phase 02C)
registry.register('LocationPoint', LocationPointSchema);
registry.register('LocationIngestBatchRequest', LocationIngestBatchRequestSchema);
registry.register('LocationIngestResponse', LocationIngestResponseSchema);
registry.register('LiveWorkerLocation', LiveWorkerLocationSchema);
registry.register('ListLiveWorkersResponse', ListLiveWorkersResponseSchema);
registry.register('LocationHistoryResponse', LocationHistoryResponseSchema);
registry.register('Geofence', GeofenceSchema);
registry.register('CreateGeofenceRequest', CreateGeofenceRequestSchema);
registry.register('ListGeofencesResponse', ListGeofencesResponseSchema);
registry.register('CheckGeofenceProximityRequest', CheckGeofenceProximityRequestSchema);
registry.register('CheckGeofenceProximityResponse', CheckGeofenceProximityResponseSchema);

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
      description: 'System is degraded or down',
      content: { 'application/json': { schema: HealthResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/v1/version',
  summary: 'API Version',
  description: 'Returns version metadata and system uptime',
  tags: ['System'],
  operationId: 'getVersion',
  responses: {
    200: {
      description: 'Version metadata retrieved',
      content: { 'application/json': { schema: VersionResponseSchema } },
    },
  },
});

// Authentication
registry.registerPath({
  method: 'post',
  path: '/v1/auth/signup',
  summary: 'Sign Up',
  description: 'Creates a new user identity account and initial session',
  tags: ['Auth'],
  operationId: 'signUp',
  request: {
    body: {
      content: { 'application/json': { schema: SignUpRequestSchema } },
      required: true,
    },
  },
  responses: {
    201: {
      description: 'User created successfully',
      content: { 'application/json': { schema: AuthResponseSchema } },
    },
    400: {
      description: 'Invalid input or email already exists',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/v1/auth/signin',
  summary: 'Sign In',
  description: 'Authenticates with email and password, establishing a session',
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
      description: 'Authenticated successfully',
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
  summary: 'Sign Out',
  description: 'Terminates the current session',
  tags: ['Auth'],
  operationId: 'signOut',
  responses: {
    200: {
      description: 'Signed out successfully',
      content: { 'application/json': { schema: SignOutResponseSchema } },
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
      description: 'Switched workspace context',
      content: { 'application/json': { schema: SwitchWorkspaceResponseSchema } },
    },
    400: {
      description: 'Invalid membership or suspended access',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

// Identity & Session Context
registry.registerPath({
  method: 'get',
  path: '/v1/me',
  summary: 'Get Current Identity & Session Context',
  description: 'Resolves current user, active workspace, role, permissions, and device status',
  tags: ['Me'],
  operationId: 'getMe',
  responses: {
    200: {
      description: 'Resolved context',
      content: { 'application/json': { schema: MeResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

// Device Governance
registry.registerPath({
  method: 'post',
  path: '/v1/devices/register',
  summary: 'Register Device Installation',
  description: 'Registers or updates a client installation bound to user and workspace',
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
      description: 'Device registered successfully',
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

// ---------------------------------------------------------------------------
// Tasks Endpoints (Phase 02B)
// ---------------------------------------------------------------------------

registry.registerPath({
  method: 'post',
  path: '/v1/tasks',
  summary: 'Create Task',
  description: 'Creates a new tenant-scoped task with assignees and checklist items',
  tags: ['Tasks'],
  operationId: 'createTask',
  request: {
    body: {
      content: { 'application/json': { schema: CreateTaskRequestSchema } },
      required: true,
    },
  },
  responses: {
    201: {
      description: 'Task created successfully',
      content: { 'application/json': { schema: TaskResponseSchema } },
    },
    400: {
      description: 'Invalid task parameters or assignee not in workspace',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
    403: {
      description: 'Forbidden - Missing tasks.create permission',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/v1/tasks',
  summary: 'List Tasks',
  description: 'Lists tasks within the active workspace with filtering support',
  tags: ['Tasks'],
  operationId: 'listTasks',
  request: {
    query: z.object({
      status: z.string().optional(),
      assigneeId: z.string().uuid().optional(),
      priority: z.string().optional(),
      overdue: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: 'Tasks retrieved successfully',
      content: { 'application/json': { schema: ListTasksResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
    403: {
      description: 'Forbidden - Missing tasks.read permission',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/v1/tasks/{taskId}',
  summary: 'Get Task Details',
  description: 'Returns full details of a task including assignees, checklist, and activity',
  tags: ['Tasks'],
  operationId: 'getTaskById',
  request: {
    params: z.object({
      taskId: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: 'Task details retrieved',
      content: { 'application/json': { schema: TaskResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
    404: {
      description: 'Task not found',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/v1/tasks/{taskId}',
  summary: 'Update Task',
  description: 'Updates task mutable fields with optimistic concurrency version check',
  tags: ['Tasks'],
  operationId: 'updateTask',
  request: {
    params: z.object({
      taskId: z.string().uuid(),
    }),
    body: {
      content: { 'application/json': { schema: UpdateTaskRequestSchema } },
      required: true,
    },
  },
  responses: {
    200: {
      description: 'Task updated successfully',
      content: { 'application/json': { schema: TaskResponseSchema } },
    },
    400: {
      description: 'Invalid input',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
    409: {
      description: 'Version conflict - task modified by another actor',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/v1/tasks/{taskId}/transition',
  summary: 'Transition Task Status',
  description: 'Executes a validated state transition with optimistic concurrency check',
  tags: ['Tasks'],
  operationId: 'transitionTask',
  request: {
    params: z.object({
      taskId: z.string().uuid(),
    }),
    body: {
      content: { 'application/json': { schema: TaskTransitionRequestSchema } },
      required: true,
    },
  },
  responses: {
    200: {
      description: 'Task transitioned successfully',
      content: { 'application/json': { schema: TaskResponseSchema } },
    },
    400: {
      description: 'Invalid status transition',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
    409: {
      description: 'Version conflict',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/v1/tasks/{taskId}/checklist',
  summary: 'Add Checklist Item',
  description: 'Adds a new checklist item to the specified task',
  tags: ['Tasks'],
  operationId: 'createChecklistItem',
  request: {
    params: z.object({
      taskId: z.string().uuid(),
    }),
    body: {
      content: { 'application/json': { schema: CreateChecklistItemRequestSchema } },
      required: true,
    },
  },
  responses: {
    201: {
      description: 'Checklist item added',
      content: { 'application/json': { schema: TaskChecklistItemSchema } },
    },
    404: {
      description: 'Task not found',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/v1/tasks/{taskId}/checklist/{itemId}',
  summary: 'Update Checklist Item',
  description: 'Toggles checklist item completion state',
  tags: ['Tasks'],
  operationId: 'updateChecklistItem',
  request: {
    params: z.object({
      taskId: z.string().uuid(),
      itemId: z.string().uuid(),
    }),
    body: {
      content: { 'application/json': { schema: UpdateChecklistItemRequestSchema } },
      required: true,
    },
  },
  responses: {
    200: {
      description: 'Checklist item updated',
      content: { 'application/json': { schema: TaskChecklistItemSchema } },
    },
    404: {
      description: 'Checklist item not found',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/v1/tasks/{taskId}/comments',
  summary: 'Add Task Comment',
  description: 'Appends an operational note to the task',
  tags: ['Tasks'],
  operationId: 'createTaskComment',
  request: {
    params: z.object({
      taskId: z.string().uuid(),
    }),
    body: {
      content: { 'application/json': { schema: CreateTaskCommentRequestSchema } },
      required: true,
    },
  },
  responses: {
    201: {
      description: 'Comment created',
      content: { 'application/json': { schema: TaskCommentSchema } },
    },
    404: {
      description: 'Task not found',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

// ---------------------------------------------------------------------------
// Attendance Endpoints (Phase 02B)
// ---------------------------------------------------------------------------

registry.registerPath({
  method: 'post',
  path: '/v1/attendance/punch-in',
  summary: 'Punch In (Duty Start)',
  description: 'Authoritative server timestamp punch in with idempotency deduplication',
  tags: ['Attendance'],
  operationId: 'punchIn',
  request: {
    body: {
      content: { 'application/json': { schema: PunchInRequestSchema } },
      required: true,
    },
  },
  responses: {
    200: {
      description: 'Punched in successfully',
      content: { 'application/json': { schema: AttendanceSessionResponseSchema } },
    },
    400: {
      description: 'Already on duty or invalid parameters',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/v1/attendance/punch-out',
  summary: 'Punch Out (Duty End)',
  description: 'Authoritative server timestamp punch out with duration calculation',
  tags: ['Attendance'],
  operationId: 'punchOut',
  request: {
    body: {
      content: { 'application/json': { schema: PunchOutRequestSchema } },
      required: true,
    },
  },
  responses: {
    200: {
      description: 'Punched out successfully',
      content: { 'application/json': { schema: AttendanceSessionResponseSchema } },
    },
    400: {
      description: 'Not currently on duty or invalid state',
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
  path: '/v1/attendance/current',
  summary: 'Get Current Attendance State',
  description: 'Returns the current user duty state, active session, and assigned shift',
  tags: ['Attendance'],
  operationId: 'getCurrentAttendance',
  responses: {
    200: {
      description: 'Current attendance state retrieved',
      content: { 'application/json': { schema: CurrentAttendanceResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/v1/attendance/history',
  summary: 'Get Attendance History',
  description: 'Returns the current user attendance sessions history',
  tags: ['Attendance'],
  operationId: 'getAttendanceHistory',
  request: {
    query: z.object({
      limit: z.string().optional(),
      offset: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: 'Attendance history retrieved',
      content: { 'application/json': { schema: AttendanceHistoryResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/v1/attendance/team',
  summary: 'Get Team Attendance',
  description: 'Manager view of currently on-duty employees and recent sessions in workspace',
  tags: ['Attendance'],
  operationId: 'getTeamAttendance',
  responses: {
    200: {
      description: 'Team attendance summary retrieved',
      content: { 'application/json': { schema: TeamAttendanceResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
    403: {
      description: 'Forbidden - Missing attendance.team.read permission',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/v1/attendance/shifts',
  summary: 'Create Shift',
  description: 'Configures a shift schedule for the workspace',
  tags: ['Attendance'],
  operationId: 'createShift',
  request: {
    body: {
      content: { 'application/json': { schema: CreateShiftRequestSchema } },
      required: true,
    },
  },
  responses: {
    201: {
      description: 'Shift created successfully',
      content: { 'application/json': { schema: AttendanceShiftSchema } },
    },
    400: {
      description: 'Invalid shift parameters',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
    403: {
      description: 'Forbidden - Missing attendance.manage permission',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/v1/attendance/shifts',
  summary: 'List Shifts',
  description: 'Lists all configured active shifts for the workspace',
  tags: ['Attendance'],
  operationId: 'listShifts',
  responses: {
    200: {
      description: 'Shifts retrieved',
      content: { 'application/json': { schema: ListShiftsResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

// Telemetry & Location Pipeline (Phase 02C)
registry.registerPath({
  method: 'post',
  path: '/v1/telemetry/locations',
  summary: 'Ingest Location Telemetry Batch',
  description:
    'Ingests GPS coordinate batch strictly during active duty hours. Coordinates outside active duty are dropped with zero database writes (Duty-Hours-Only Invariant).',
  tags: ['Telemetry'],
  operationId: 'ingestLocations',
  request: {
    body: {
      description: 'Batch of duty location breadcrumbs',
      content: { 'application/json': { schema: LocationIngestBatchRequestSchema } },
    },
  },
  responses: {
    200: {
      description: 'Ingestion outcome report',
      content: { 'application/json': { schema: LocationIngestResponseSchema } },
    },
    400: {
      description: 'Invalid telemetry batch',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
    403: {
      description: 'Forbidden - Missing location.record permission',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/v1/telemetry/live',
  summary: 'Get Live On-Duty Workers',
  description:
    'Retrieves latest coordinates and duty statuses for active on-duty team members (Requires location.read permission; Peer visibility OFF by default).',
  tags: ['Telemetry'],
  operationId: 'getLiveWorkers',
  responses: {
    200: {
      description: 'Live worker locations',
      content: { 'application/json': { schema: ListLiveWorkersResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
    403: {
      description: 'Forbidden - Missing location.read permission',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/v1/telemetry/history',
  summary: 'Get Location Breadcrumbs History',
  description:
    'Retrieves historical route breadcrumbs for an employee during active duty hours for a specific date.',
  tags: ['Telemetry'],
  operationId: 'getLocationHistory',
  request: {
    query: z.object({
      userId: z.string().uuid(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    }),
  },
  responses: {
    200: {
      description: 'Historical location breadcrumbs',
      content: { 'application/json': { schema: LocationHistoryResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
    403: {
      description: 'Forbidden - Missing location.read permission',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

// Geofencing Endpoints (Phase 02C)
registry.registerPath({
  method: 'get',
  path: '/v1/geofences',
  summary: 'List Workspace Geofences',
  description: 'Lists all defined geofences for the current workspace.',
  tags: ['Geofences'],
  operationId: 'listGeofences',
  responses: {
    200: {
      description: 'List of geofences',
      content: { 'application/json': { schema: ListGeofencesResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/v1/geofences',
  summary: 'Create Geofence',
  description: 'Creates a new circular geographic boundary (office, customer site, checkpoint).',
  tags: ['Geofences'],
  operationId: 'createGeofence',
  request: {
    body: {
      description: 'Geofence definition',
      content: { 'application/json': { schema: CreateGeofenceRequestSchema } },
    },
  },
  responses: {
    201: {
      description: 'Geofence created',
      content: { 'application/json': { schema: GeofenceSchema } },
    },
    400: {
      description: 'Invalid geofence parameters',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
    403: {
      description: 'Forbidden - Missing geofences.manage permission',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/v1/geofences/validate-proximity',
  summary: 'Validate Proximity to Geofence',
  description: 'Calculates distance and verifies if given coordinates fall inside a geofence.',
  tags: ['Geofences'],
  operationId: 'validateGeofenceProximity',
  request: {
    body: {
      description: 'Target geofence and coordinate pair',
      content: { 'application/json': { schema: CheckGeofenceProximityRequestSchema } },
    },
  },
  responses: {
    200: {
      description: 'Proximity result',
      content: { 'application/json': { schema: CheckGeofenceProximityResponseSchema } },
    },
    400: {
      description: 'Invalid coordinates or geofence not found',
      content: { 'application/json': { schema: ApiErrorSchema } },
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
      version: '0.3.0',
      description:
        'Authoritative REST & Realtime API for Oprino Workforce Management Platform (Phase 02C)',
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

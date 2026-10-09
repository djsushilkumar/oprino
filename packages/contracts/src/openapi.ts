import { z } from 'zod';
import { OpenApiGeneratorV31, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { HealthResponseSchema, LivenessResponseSchema } from './schemas/health.js';
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
  VerifyTaskRequestSchema,
  RecurringTaskTemplateSchema,
  CreateRecurringTaskTemplateRequestSchema,
  UpdateRecurringTaskTemplateRequestSchema,
  ListRecurringTaskTemplatesResponseSchema,
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
  ShiftRosterSchema,
  AssignShiftRosterRequestSchema,
  ListShiftRostersResponseSchema,
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
import {
  CustomerSchema,
  CreateCustomerRequestSchema,
  UpdateCustomerRequestSchema,
  ListCustomersResponseSchema,
  CustomerSiteSchema,
  CreateCustomerSiteRequestSchema,
  UpdateCustomerSiteRequestSchema,
  ListCustomerSitesResponseSchema,
} from './schemas/customer.js';
import {
  VisitSchema,
  CreateVisitRequestSchema,
  VisitCheckInRequestSchema,
  VisitCheckOutRequestSchema,
  ListVisitsResponseSchema,
  ReorderVisitsRequestSchema,
} from './schemas/visit.js';
import {
  TaskProofSchema,
  MediaUploadUrlRequestSchema,
  MediaUploadUrlResponseSchema,
  ConfirmMediaUploadRequestSchema,
  ListTaskProofsResponseSchema,
} from './schemas/proof.js';
import {
  SyncBatchRequestSchema,
  SyncBatchResponseSchema,
} from './schemas/sync.js';
import {
  AttendanceReportResponseSchema,
  TaskSlaReportResponseSchema,
  VisitReportResponseSchema,
} from './schemas/report.js';
import {
  NotificationSchema,
  ListNotificationsResponseSchema,
  MarkNotificationReadResponseSchema,
} from './schemas/notification.js';

export const registry = new OpenAPIRegistry();

// Register System Components
registry.register('HealthResponse', HealthResponseSchema);
registry.register('LivenessResponse', LivenessResponseSchema);
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

// Register Customers & Sites Components (Phase 03)
registry.register('Customer', CustomerSchema);
registry.register('CreateCustomerRequest', CreateCustomerRequestSchema);
registry.register('UpdateCustomerRequest', UpdateCustomerRequestSchema);
registry.register('ListCustomersResponse', ListCustomersResponseSchema);
registry.register('CustomerSite', CustomerSiteSchema);
registry.register('CreateCustomerSiteRequest', CreateCustomerSiteRequestSchema);
registry.register('UpdateCustomerSiteRequest', UpdateCustomerSiteRequestSchema);
registry.register('ListCustomerSitesResponse', ListCustomerSitesResponseSchema);

// Register Physical Site Visits Components (Phase 03)
registry.register('Visit', VisitSchema);
registry.register('CreateVisitRequest', CreateVisitRequestSchema);
registry.register('VisitCheckInRequest', VisitCheckInRequestSchema);
registry.register('VisitCheckOutRequest', VisitCheckOutRequestSchema);
registry.register('ListVisitsResponse', ListVisitsResponseSchema);

// Register Proof of Work & Media Components (Phase 03)
registry.register('TaskProof', TaskProofSchema);
registry.register('MediaUploadUrlRequest', MediaUploadUrlRequestSchema);
registry.register('MediaUploadUrlResponse', MediaUploadUrlResponseSchema);
registry.register('ConfirmMediaUploadRequest', ConfirmMediaUploadRequestSchema);
registry.register('ListTaskProofsResponse', ListTaskProofsResponseSchema);
registry.register('VerifyTaskRequest', VerifyTaskRequestSchema);

// Register Phase 04 Components
registry.register('ReorderVisitsRequest', ReorderVisitsRequestSchema);
registry.register('RecurringTaskTemplate', RecurringTaskTemplateSchema);
registry.register('CreateRecurringTaskTemplateRequest', CreateRecurringTaskTemplateRequestSchema);
registry.register('UpdateRecurringTaskTemplateRequest', UpdateRecurringTaskTemplateRequestSchema);
registry.register('ListRecurringTaskTemplatesResponse', ListRecurringTaskTemplatesResponseSchema);
registry.register('ShiftRoster', ShiftRosterSchema);
registry.register('AssignShiftRosterRequest', AssignShiftRosterRequestSchema);
registry.register('ListShiftRostersResponse', ListShiftRostersResponseSchema);
registry.register('SyncBatchRequest', SyncBatchRequestSchema);
registry.register('SyncBatchResponse', SyncBatchResponseSchema);
registry.register('AttendanceReportResponse', AttendanceReportResponseSchema);
registry.register('TaskSlaReportResponse', TaskSlaReportResponseSchema);
registry.register('VisitReportResponse', VisitReportResponseSchema);
registry.register('Notification', NotificationSchema);
registry.register('ListNotificationsResponse', ListNotificationsResponseSchema);
registry.register('MarkNotificationReadResponse', MarkNotificationReadResponseSchema);


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
  path: '/health/live',
  summary: 'Liveness Probe',
  description: 'Lightweight liveness probe indicating process and event loop responsiveness',
  tags: ['System'],
  operationId: 'getLiveness',
  responses: {
    200: {
      description: 'Process is alive and responding',
      content: { 'application/json': { schema: LivenessResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/health/ready',
  summary: 'Readiness Probe',
  description: 'Deep readiness probe evaluating database connection pool and Redis cache readiness',
  tags: ['System'],
  operationId: 'getReadiness',
  responses: {
    200: {
      description: 'Service is ready to accept production traffic',
      content: { 'application/json': { schema: HealthResponseSchema } },
    },
    503: {
      description: 'Service or underlying dependency is not ready',
      content: { 'application/json': { schema: HealthResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/metrics',
  summary: 'Prometheus Metrics',
  description: 'Exposes Prometheus system and HTTP operational metrics',
  tags: ['System'],
  operationId: 'getMetrics',
  responses: {
    200: {
      description: 'Prometheus metrics text stream',
      content: { 'text/plain': { schema: z.string() } },
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

// ---------------------------------------------------------------------------
// Phase 03: Customers & Sites Paths
// ---------------------------------------------------------------------------

registry.registerPath({
  method: 'post',
  path: '/v1/customers',
  summary: 'Create Customer Account',
  description: 'Provisions a new client or account within the active workspace',
  tags: ['Customers'],
  operationId: 'createCustomer',
  request: {
    body: {
      description: 'Customer creation payload',
      content: { 'application/json': { schema: CreateCustomerRequestSchema } },
    },
  },
  responses: {
    201: {
      description: 'Customer created successfully',
      content: { 'application/json': { schema: CustomerSchema } },
    },
    400: {
      description: 'Validation error',
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
  path: '/v1/customers',
  summary: 'List Customers',
  description: 'Lists all customer accounts in the workspace',
  tags: ['Customers'],
  operationId: 'listCustomers',
  responses: {
    200: {
      description: 'Customers directory',
      content: { 'application/json': { schema: ListCustomersResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/v1/customers/{id}',
  summary: 'Get Customer Details',
  description: 'Retrieves a single customer record',
  tags: ['Customers'],
  operationId: 'getCustomerById',
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      description: 'Customer details',
      content: { 'application/json': { schema: CustomerSchema } },
    },
    404: {
      description: 'Customer not found',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/v1/customers/{id}',
  summary: 'Update Customer',
  description: 'Updates customer details',
  tags: ['Customers'],
  operationId: 'updateCustomer',
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      description: 'Update payload',
      content: { 'application/json': { schema: UpdateCustomerRequestSchema } },
    },
  },
  responses: {
    200: {
      description: 'Customer updated',
      content: { 'application/json': { schema: CustomerSchema } },
    },
    404: {
      description: 'Customer not found',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/v1/customers/{customerId}/sites',
  summary: 'Create Customer Site',
  description: 'Adds a physical client facility or work site to a customer',
  tags: ['Customers'],
  operationId: 'createCustomerSite',
  request: {
    params: z.object({ customerId: z.string().uuid() }),
    body: {
      description: 'Site creation payload',
      content: { 'application/json': { schema: CreateCustomerSiteRequestSchema } },
    },
  },
  responses: {
    201: {
      description: 'Customer site created',
      content: { 'application/json': { schema: CustomerSiteSchema } },
    },
    404: {
      description: 'Customer not found',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/v1/customers/{customerId}/sites',
  summary: 'List Customer Sites',
  description: 'Lists all physical sites for a specific customer',
  tags: ['Customers'],
  operationId: 'listCustomerSites',
  request: {
    params: z.object({ customerId: z.string().uuid() }),
  },
  responses: {
    200: {
      description: 'List of customer sites',
      content: { 'application/json': { schema: ListCustomerSitesResponseSchema } },
    },
  },
});

// ---------------------------------------------------------------------------
// Phase 03: Physical Site Visits Paths
// ---------------------------------------------------------------------------

registry.registerPath({
  method: 'post',
  path: '/v1/visits',
  summary: 'Create / Schedule Site Visit',
  description: 'Schedules a physical site stop for a field employee',
  tags: ['Visits'],
  operationId: 'createVisit',
  request: {
    body: {
      description: 'Visit creation payload',
      content: { 'application/json': { schema: CreateVisitRequestSchema } },
    },
  },
  responses: {
    201: {
      description: 'Visit scheduled',
      content: { 'application/json': { schema: VisitSchema } },
    },
    400: {
      description: 'Validation error',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/v1/visits',
  summary: 'List Visits',
  description: 'Lists site visits filtered by status or user',
  tags: ['Visits'],
  operationId: 'listVisits',
  responses: {
    200: {
      description: 'List of site visits',
      content: { 'application/json': { schema: ListVisitsResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/v1/visits/{id}',
  summary: 'Get Visit Details',
  description: 'Retrieves visit record by ID',
  tags: ['Visits'],
  operationId: 'getVisitById',
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      description: 'Visit record',
      content: { 'application/json': { schema: VisitSchema } },
    },
    404: {
      description: 'Visit not found',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/v1/visits/{id}/check-in',
  summary: 'Record Site Check-In',
  description: 'Captures arrival timestamp and GPS coordinates at client site',
  tags: ['Visits'],
  operationId: 'checkInVisit',
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      description: 'Check-in coordinates',
      content: { 'application/json': { schema: VisitCheckInRequestSchema } },
    },
  },
  responses: {
    200: {
      description: 'Check-in recorded',
      content: { 'application/json': { schema: VisitSchema } },
    },
    400: {
      description: 'Invalid visit state or coordinates',
      content: { 'application/json': { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/v1/visits/{id}/check-out',
  summary: 'Record Site Check-Out',
  description: 'Captures departure timestamp, GPS coordinates, and calculates duration',
  tags: ['Visits'],
  operationId: 'checkOutVisit',
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      description: 'Check-out coordinates and notes',
      content: { 'application/json': { schema: VisitCheckOutRequestSchema } },
    },
  },
  responses: {
    200: {
      description: 'Check-out recorded',
      content: { 'application/json': { schema: VisitSchema } },
    },
  },
});

// ---------------------------------------------------------------------------
// Phase 03: Proof of Work & Media Paths (ADR-012)
// ---------------------------------------------------------------------------

registry.registerPath({
  method: 'post',
  path: '/v1/media/upload-url',
  summary: 'Generate Pre-Signed S3 Upload URL',
  description: 'Generates a short-lived pre-signed PUT URL for direct client binary upload',
  tags: ['Media & Proof of Work'],
  operationId: 'requestMediaUploadUrl',
  request: {
    body: {
      description: 'Upload metadata',
      content: { 'application/json': { schema: MediaUploadUrlRequestSchema } },
    },
  },
  responses: {
    200: {
      description: 'Pre-signed S3 upload URL',
      content: { 'application/json': { schema: MediaUploadUrlResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/v1/media/confirm',
  summary: 'Confirm Proof of Work Upload',
  description: 'Records verified proof-of-work item (photo or customer digital signature)',
  tags: ['Media & Proof of Work'],
  operationId: 'confirmMediaUpload',
  request: {
    body: {
      description: 'Proof confirmation details',
      content: { 'application/json': { schema: ConfirmMediaUploadRequestSchema } },
    },
  },
  responses: {
    201: {
      description: 'Proof confirmed and saved',
      content: { 'application/json': { schema: TaskProofSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/v1/tasks/{taskId}/proofs',
  summary: 'List Proof of Work for Task',
  description: 'Retrieves all photos and signatures submitted for a task',
  tags: ['Media & Proof of Work'],
  operationId: 'listTaskProofs',
  request: {
    params: z.object({ taskId: z.string().uuid() }),
  },
  responses: {
    200: {
      description: 'List of task proofs',
      content: { 'application/json': { schema: ListTaskProofsResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/v1/tasks/{id}/verify',
  summary: 'Verify or Reject Task Proof of Work',
  description: 'Manager approval or rejection of completed task proof of work',
  tags: ['Tasks'],
  operationId: 'verifyTask',
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      description: 'Verification review action and notes',
      content: { 'application/json': { schema: VerifyTaskRequestSchema } },
    },
  },
  responses: {
    200: {
      description: 'Task verification status updated',
      content: { 'application/json': { schema: TaskResponseSchema } },
    },
  },
});

// ---------------------------------------------------------------------------
// Phase 04: Advanced Scheduling, Dispatch Routing, Conflict Resilience & Reports
// ---------------------------------------------------------------------------

// 1. Visit Sequencing / Dispatch Reorder
registry.registerPath({
  method: 'put',
  path: '/v1/visits/sequence',
  summary: 'Reorder Visits for Day Dispatch Route',
  description: 'Atomically updates the stop sequence numbers for an assigned worker on a specific date',
  tags: ['Visits'],
  operationId: 'reorderVisits',
  request: {
    body: {
      description: 'Ordered list of visit IDs for technician',
      content: { 'application/json': { schema: ReorderVisitsRequestSchema } },
    },
  },
  responses: {
    200: {
      description: 'Updated stop order list',
      content: { 'application/json': { schema: ListVisitsResponseSchema } },
    },
  },
});

// 2. Recurring Task Templates
registry.registerPath({
  method: 'post',
  path: '/v1/tasks/templates',
  summary: 'Create Recurring Task Template',
  description: 'Provisions a recurring template that automatically generates tasks',
  tags: ['Tasks'],
  operationId: 'createRecurringTaskTemplate',
  request: {
    body: {
      description: 'Template configuration',
      content: { 'application/json': { schema: CreateRecurringTaskTemplateRequestSchema } },
    },
  },
  responses: {
    201: {
      description: 'Created template',
      content: { 'application/json': { schema: RecurringTaskTemplateSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/v1/tasks/templates',
  summary: 'List Recurring Task Templates',
  description: 'Retrieves active and inactive recurring task templates for the workspace',
  tags: ['Tasks'],
  operationId: 'listRecurringTaskTemplates',
  responses: {
    200: {
      description: 'List of templates',
      content: { 'application/json': { schema: ListRecurringTaskTemplatesResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/v1/tasks/templates/{id}',
  summary: 'Update Recurring Task Template',
  description: 'Modifies recurring schedule, assignees, or active status',
  tags: ['Tasks'],
  operationId: 'updateRecurringTaskTemplate',
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      description: 'Template updates',
      content: { 'application/json': { schema: UpdateRecurringTaskTemplateRequestSchema } },
    },
  },
  responses: {
    200: {
      description: 'Updated template',
      content: { 'application/json': { schema: RecurringTaskTemplateSchema } },
    },
  },
});

// 3. Shift Rosters
registry.registerPath({
  method: 'post',
  path: '/v1/attendance/rosters',
  summary: 'Assign Shift Rosters',
  description: 'Assigns employees to scheduled shifts across dates',
  tags: ['Attendance'],
  operationId: 'assignShiftRoster',
  request: {
    body: {
      description: 'Roster assignments',
      content: { 'application/json': { schema: AssignShiftRosterRequestSchema } },
    },
  },
  responses: {
    201: {
      description: 'Created rosters',
      content: { 'application/json': { schema: ListShiftRostersResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/v1/attendance/rosters',
  summary: 'List Shift Rosters',
  description: 'Lists scheduled rosters for workspace members with date range filtering',
  tags: ['Attendance'],
  operationId: 'listShiftRosters',
  request: {
    query: z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      userId: z.string().uuid().optional(),
    }),
  },
  responses: {
    200: {
      description: 'List of rosters',
      content: { 'application/json': { schema: ListShiftRostersResponseSchema } },
    },
  },
});

// 4. Batch Sync Replay (Conflict Engine)
registry.registerPath({
  method: 'post',
  path: '/v1/sync/mutations',
  summary: 'Replay Batch Sync Mutations',
  description: 'Atomically processes queued offline mutations with conflict matrix resolution',
  tags: ['Sync'],
  operationId: 'syncMutationsBatch',
  request: {
    body: {
      description: 'Array of queued client mutations',
      content: { 'application/json': { schema: SyncBatchRequestSchema } },
    },
  },
  responses: {
    200: {
      description: 'Batch processing results',
      content: { 'application/json': { schema: SyncBatchResponseSchema } },
    },
  },
});

// 5. Operational Analytics & Reporting
registry.registerPath({
  method: 'get',
  path: '/v1/reports/attendance',
  summary: 'Get Attendance Summary Report',
  description: 'Computes present days, duty hours, late minutes, and overtime across date range',
  tags: ['Reports'],
  operationId: 'getAttendanceReport',
  request: {
    query: z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: 'Attendance report summary',
      content: { 'application/json': { schema: AttendanceReportResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/v1/reports/tasks',
  summary: 'Get Task SLA Performance Report',
  description: 'Aggregates task completion, verification rates, and on-time SLA metrics',
  tags: ['Reports'],
  operationId: 'getTaskSlaReport',
  request: {
    query: z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: 'Task SLA report',
      content: { 'application/json': { schema: TaskSlaReportResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/v1/reports/visits',
  summary: 'Get Visit Audit Report',
  description: 'Aggregates total visits, durations, and check-in compliance',
  tags: ['Reports'],
  operationId: 'getVisitReport',
  request: {
    query: z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: 'Visit report summary',
      content: { 'application/json': { schema: VisitReportResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/v1/reports/export/csv',
  summary: 'Export Attendance Report as CSV',
  description: 'Streams attendance report summary in comma-separated values format for spreadsheet integration',
  tags: ['Reports'],
  operationId: 'exportAttendanceCsv',
  request: {
    query: z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: 'CSV file download stream',
      content: {
        'text/csv': {
          schema: z.string(),
        },
      },
    },
  },
});

// 6. In-App Notifications
registry.registerPath({
  method: 'get',
  path: '/v1/notifications',
  summary: 'List In-App Notifications',
  description: 'Retrieves operational notifications and alerts for the authenticated user',
  tags: ['Notifications'],
  operationId: 'listNotifications',
  responses: {
    200: {
      description: 'List of notifications',
      content: { 'application/json': { schema: ListNotificationsResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/v1/notifications/{id}/read',
  summary: 'Mark Notification as Read',
  description: 'Marks a specific notification as read',
  tags: ['Notifications'],
  operationId: 'markNotificationAsRead',
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      description: 'Marked read confirmation',
      content: { 'application/json': { schema: MarkNotificationReadResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/v1/notifications/read-all',
  summary: 'Mark All Notifications as Read',
  description: 'Marks all notifications for the user as read',
  tags: ['Notifications'],
  operationId: 'markAllNotificationsAsRead',
  responses: {
    200: {
      description: 'Marked read confirmation',
      content: { 'application/json': { schema: MarkNotificationReadResponseSchema } },
    },
  },
});

export function generateOpenApiDocument(): Record<string, any> {
  const generator = new OpenApiGeneratorV31(registry.definitions);

  return generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'Oprino Operations Engine API',
      version: '0.4.0',
      description:
        'Authoritative REST & Realtime API for Oprino Workforce Management Platform (Phase 04: Advanced Scheduling, Dispatch Routing, Conflict Resilience & Analytics)',
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



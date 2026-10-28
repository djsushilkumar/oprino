import {
  type SignUpRequest,
  type SignInRequest,
  type CreateWorkspaceRequest,
  type AuthResponse,
  type MeResponse,
  type WorkspaceResponse,
  type ListWorkspacesResponse,
  type SwitchWorkspaceResponse,
  type AddWorkspaceMemberRequest,
  type AddWorkspaceMemberResponse,
  // V1 Blockers: Invitations, Import, Lifecycle & Settings
  type InviteWorkspaceMemberRequest,
  type InviteWorkspaceMemberResponse,
  type WorkspaceInvitation,
  type ListWorkspaceInvitationsResponse,
  type RevokeInvitationRequest,
  type AcceptInvitationRequest,
  type ValidateInvitationResponse,
  type BulkImportMembersRequest,
  type BulkImportMembersResponse,
  type BulkImportRow,
  type BulkImportRowResult,
  type UpdateWorkspaceMemberRequest,
  type UpdateWorkspaceMemberResponse,
  type WorkspaceSettings,
  type UpdateWorkspaceSettingsRequest,
  type WorkspaceSettingsResponse,
  // Phase 02B Tasks
  type TaskResponse,
  type ListTasksResponse,
  type CreateTaskRequest,
  type UpdateTaskRequest,
  type TaskTransitionRequest,
  type TaskChecklistItem,
  type UpdateChecklistItemRequest,
  type TaskComment,
  type CreateTaskCommentRequest,
  // Phase 02B Attendance
  type AttendanceSessionResponse,
  type CurrentAttendanceResponse,
  type AttendanceHistoryResponse,
  type TeamAttendanceResponse,
  type AttendanceShift,
  type ListShiftsResponse,
  type CreateShiftRequest,
  type PunchInRequest,
  type PunchOutRequest,
  // Phase 02C Telemetry & Geofences
  type ListLiveWorkersResponse,
  type LocationHistoryResponse,
  type Geofence,
  type CreateGeofenceRequest,
  type ListGeofencesResponse,
  type CheckGeofenceProximityRequest,
  type CheckGeofenceProximityResponse,
  // Phase 03 Field Operations, Visits & Proofs
  type Customer,
  type CreateCustomerRequest,
  type UpdateCustomerRequest,
  type ListCustomersResponse,
  type CustomerSite,
  type CreateCustomerSiteRequest,
  type UpdateCustomerSiteRequest,
  type ListCustomerSitesResponse,
  type Visit,
  type CreateVisitRequest,
  type VisitCheckInRequest,
  type VisitCheckOutRequest,
  type ListVisitsResponse,
  type TaskProof,
  type ListTaskProofsResponse,
  type VerifyTaskRequest,
  // Phase 04 Advanced Operations
  type ReorderVisitsRequest,
  type RecurringTaskTemplate,
  type CreateRecurringTaskTemplateRequest,
  type UpdateRecurringTaskTemplateRequest,
  type ListRecurringTaskTemplatesResponse,
  type ShiftRoster,
  type AssignShiftRosterRequest,
  type ListShiftRostersResponse,
  type AttendanceReportResponse,
  type TaskSlaReportResponse,
  type VisitReportResponse,
  type Notification,
  type ListNotificationsResponse,
  type MarkNotificationReadResponse,
} from '@oprino/contracts';

export interface WorkspaceMember {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  membershipId: string;
  roleId: string;
  roleName: string;
  status: string;
}
export function normalizeApiBaseUrl(rawUrl?: string): string {
  let url = (rawUrl || process.env.NEXT_PUBLIC_API_URL || 'https://oprino-api.onrender.com').trim();
  url = url.replace(/\/+$/, '');
  if (url.endsWith('/v1')) {
    url = url.slice(0, -3);
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(
      `Security gate violation: Insecure production API URL "${url}". Malformed URL.`,
    );
  }

  if (process.env.NODE_ENV === 'production') {
    if (parsed.protocol !== 'https:') {
      throw new Error(
        `Security gate violation: Insecure production API URL "${url}". Production builds must use HTTPS.`,
      );
    }
    const host = parsed.hostname.toLowerCase().trim();
    const isLoopbackOrPrivate =
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host === '10.0.2.2' ||
      host.endsWith('.localhost') ||
      host.endsWith('.local') ||
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host) ||
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(host) ||
      /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host);

    if (isLoopbackOrPrivate) {
      throw new Error(
        `Security gate violation: Insecure production API URL "${url}". Cannot target loopback or private host.`,
      );
    }
  }
  return url;
}

export function getApiBaseUrl(): string {
  return normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
}

export function buildApiUrl(endpoint: string, baseUrl?: string): string {
  const base = normalizeApiBaseUrl(baseUrl);
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${cleanEndpoint}`;
}

const TOKEN_KEY = 'oprino_web_auth_token';
const WORKSPACE_KEY = 'oprino_web_active_workspace_id';

export function getStoredToken(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (typeof localStorage === 'undefined') return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getStoredWorkspaceId(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(WORKSPACE_KEY);
}

export function setStoredWorkspaceId(workspaceId: string | null): void {
  if (typeof localStorage === 'undefined') return;
  if (workspaceId) {
    localStorage.setItem(WORKSPACE_KEY, workspaceId);
  } else {
    localStorage.removeItem(WORKSPACE_KEY);
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  customWorkspaceId?: string | null,
): Promise<T> {
  const token = getStoredToken();
  const activeWorkspaceId =
    customWorkspaceId !== undefined ? customWorkspaceId : getStoredWorkspaceId();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (activeWorkspaceId) {
    headers['X-Workspace-Id'] = activeWorkspaceId;
  }
  const fullUrl = buildApiUrl(endpoint);
  const res = await fetch(fullUrl, {
    ...options,
    headers,
  });

  const contentType = res.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const errorMsg =
      isJson && (data.message || data.error) ? data.message || data.error : res.statusText;
    const error = new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    (error as any).status = res.status;
    (error as any).data = data;
    throw error;
  }

  return data as T;
}

export const webApi = {
  // Auth & Identity
  async signUp(body: SignUpRequest): Promise<AuthResponse> {
    const res = await request<AuthResponse>('/v1/auth/signup', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (res.token) {
      setStoredToken(res.token);
    }
    if (res.activeWorkspaceId) {
      setStoredWorkspaceId(res.activeWorkspaceId);
    }
    return res;
  },

  async signIn(body: SignInRequest): Promise<AuthResponse> {
    const res = await request<AuthResponse>('/v1/auth/signin', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (res.token) {
      setStoredToken(res.token);
    }
    if (res.activeWorkspaceId) {
      setStoredWorkspaceId(res.activeWorkspaceId);
    }
    return res;
  },

  async signOut(): Promise<void> {
    try {
      await request<{ success: boolean }>('/v1/auth/signout', { method: 'POST' });
    } finally {
      setStoredToken(null);
      setStoredWorkspaceId(null);
    }
  },

  async getMe(workspaceId?: string | null): Promise<MeResponse> {
    return request<MeResponse>('/v1/me', { method: 'GET' }, workspaceId);
  },

  async listWorkspaces(): Promise<ListWorkspacesResponse> {
    return request<ListWorkspacesResponse>('/v1/workspaces', { method: 'GET' });
  },

  async createWorkspace(body: CreateWorkspaceRequest): Promise<WorkspaceResponse> {
    const res = await request<WorkspaceResponse>('/v1/workspaces', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    setStoredWorkspaceId(res.id);
    return res;
  },

  async switchWorkspace(workspaceId: string): Promise<SwitchWorkspaceResponse> {
    const res = await request<SwitchWorkspaceResponse>('/v1/session/workspace', {
      method: 'POST',
      body: JSON.stringify({ workspaceId }),
    });
    setStoredWorkspaceId(res.activeWorkspaceId);
    return res;
  },

  async listWorkspaceMembers(workspaceId?: string | null): Promise<{ members: WorkspaceMember[] }> {
    return request<{ members: WorkspaceMember[] }>(
      '/v1/workspaces/members',
      { method: 'GET' },
      workspaceId,
    );
  },

  async addWorkspaceMember(
    data: AddWorkspaceMemberRequest,
    workspaceId?: string | null,
  ): Promise<AddWorkspaceMemberResponse> {
    return request<AddWorkspaceMemberResponse>(
      '/v1/workspaces/members',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      workspaceId,
    );
  },

  // V1 Blockers: Member Invitations & Lifecycle
  async inviteWorkspaceMember(
    data: InviteWorkspaceMemberRequest,
    workspaceId?: string | null,
  ): Promise<InviteWorkspaceMemberResponse> {
    return request<InviteWorkspaceMemberResponse>(
      '/v1/workspaces/members/invite',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      workspaceId,
    );
  },

  async listWorkspaceInvitations(
    workspaceId?: string | null,
  ): Promise<ListWorkspaceInvitationsResponse> {
    return request<ListWorkspaceInvitationsResponse>(
      '/v1/workspaces/members/invitations',
      { method: 'GET' },
      workspaceId,
    );
  },

  async revokeWorkspaceInvitation(
    data: RevokeInvitationRequest,
    workspaceId?: string | null,
  ): Promise<{ revoked: boolean }> {
    return request<{ revoked: boolean }>(
      '/v1/workspaces/members/invitations/revoke',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      workspaceId,
    );
  },

  async validateInvitation(token: string): Promise<ValidateInvitationResponse> {
    return request<ValidateInvitationResponse>(
      `/v1/auth/invitations/${encodeURIComponent(token)}/validate`,
      { method: 'GET' },
    );
  },

  async acceptInvitation(data: AcceptInvitationRequest): Promise<AuthResponse> {
    const res = await request<AuthResponse>('/v1/auth/invitations/accept', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.token) {
      setStoredToken(res.token);
    }
    if (res.activeWorkspaceId) {
      setStoredWorkspaceId(res.activeWorkspaceId);
    }
    return res;
  },

  async importMembersCsv(
    data: BulkImportMembersRequest,
    workspaceId?: string | null,
  ): Promise<BulkImportMembersResponse> {
    return request<BulkImportMembersResponse>(
      '/v1/workspaces/members/import-csv',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      workspaceId,
    );
  },

  async updateWorkspaceMember(
    membershipId: string,
    data: UpdateWorkspaceMemberRequest,
    workspaceId?: string | null,
  ): Promise<UpdateWorkspaceMemberResponse> {
    return request<UpdateWorkspaceMemberResponse>(
      `/v1/workspaces/members/${encodeURIComponent(membershipId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
      workspaceId,
    );
  },

  // V1 Blockers: Workspace Settings & Retention
  async getWorkspaceSettings(workspaceId?: string | null): Promise<WorkspaceSettingsResponse> {
    return request<WorkspaceSettingsResponse>(
      '/v1/workspaces/settings',
      { method: 'GET' },
      workspaceId,
    );
  },

  async updateWorkspaceSettings(
    data: UpdateWorkspaceSettingsRequest,
    workspaceId?: string | null,
  ): Promise<WorkspaceSettingsResponse> {
    return request<WorkspaceSettingsResponse>(
      '/v1/workspaces/settings',
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
      workspaceId,
    );
  },

  // V1 Blockers: Selfie Media Upload
  async getAttendanceSelfieUploadUrl(data: {
    fileName: string;
    contentType: string;
  }): Promise<{ uploadUrl: string; mediaKey: string }> {
    return request<{ uploadUrl: string; mediaKey: string }>('/v1/media/attendance-selfie-url', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getMediaDownloadUrl(mediaKey: string): Promise<string> {
    const res = await request<{ downloadUrl: string; fileKey: string; expiresInSeconds: number }>(
      '/v1/media/download-url',
      {
        method: 'POST',
        body: JSON.stringify({ fileKey: mediaKey }),
      },
    );
    return res.downloadUrl;
  },

  getMediaFileUrl(mediaKey: string): string {
    return buildApiUrl(`/v1/media/files/${encodeURIComponent(mediaKey)}`);
  },

  // Phase 02B: Tasks
  async listTasks(params?: Record<string, string>): Promise<ListTasksResponse> {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return request<ListTasksResponse>(`/v1/tasks${query}`, { method: 'GET' });
  },

  async getTaskById(taskId: string): Promise<TaskResponse> {
    return request<TaskResponse>(`/v1/tasks/${taskId}`, { method: 'GET' });
  },

  async createTask(body: CreateTaskRequest): Promise<TaskResponse> {
    return request<TaskResponse>('/v1/tasks', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async updateTask(taskId: string, body: UpdateTaskRequest): Promise<TaskResponse> {
    return request<TaskResponse>(`/v1/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  async transitionTask(taskId: string, body: TaskTransitionRequest): Promise<TaskResponse> {
    return request<TaskResponse>(`/v1/tasks/${taskId}/transition`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async updateChecklistItem(
    taskId: string,
    itemId: string,
    body: UpdateChecklistItemRequest,
  ): Promise<TaskChecklistItem> {
    return request<TaskChecklistItem>(`/v1/tasks/${taskId}/checklist/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  async createTaskComment(taskId: string, body: CreateTaskCommentRequest): Promise<TaskComment> {
    return request<TaskComment>(`/v1/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  // Phase 02B: Attendance
  async punchIn(body: PunchInRequest): Promise<AttendanceSessionResponse> {
    return request<AttendanceSessionResponse>('/v1/attendance/punch-in', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async punchOut(body: PunchOutRequest): Promise<AttendanceSessionResponse> {
    return request<AttendanceSessionResponse>('/v1/attendance/punch-out', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async getCurrentAttendance(): Promise<CurrentAttendanceResponse> {
    return request<CurrentAttendanceResponse>('/v1/attendance/current', { method: 'GET' });
  },

  async getAttendanceHistory(): Promise<AttendanceHistoryResponse> {
    return request<AttendanceHistoryResponse>('/v1/attendance/history', { method: 'GET' });
  },

  async getTeamAttendance(): Promise<TeamAttendanceResponse> {
    return request<TeamAttendanceResponse>('/v1/attendance/team', { method: 'GET' });
  },

  async createShift(body: CreateShiftRequest): Promise<AttendanceShift> {
    return request<AttendanceShift>('/v1/attendance/shifts', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async listShifts(): Promise<ListShiftsResponse> {
    return request<ListShiftsResponse>('/v1/attendance/shifts', { method: 'GET' });
  },

  // Phase 02C: Telemetry & Live Operations Map
  async getLiveWorkers(): Promise<ListLiveWorkersResponse> {
    return request<ListLiveWorkersResponse>('/v1/telemetry/live', { method: 'GET' });
  },

  async getStreamTicket(): Promise<{ ticket: string; expiresInSeconds: number }> {
    return request<{ ticket: string; expiresInSeconds: number }>('/v1/telemetry/stream-ticket', {
      method: 'POST',
    });
  },

  async getLocationHistory(userId: string, date: string): Promise<LocationHistoryResponse> {
    return request<LocationHistoryResponse>(
      `/v1/telemetry/history?userId=${encodeURIComponent(userId)}&date=${encodeURIComponent(date)}`,
      { method: 'GET' },
    );
  },

  // Phase 02C: Geofences
  async listGeofences(): Promise<ListGeofencesResponse> {
    return request<ListGeofencesResponse>('/v1/geofences', { method: 'GET' });
  },

  async createGeofence(body: CreateGeofenceRequest): Promise<Geofence> {
    return request<Geofence>('/v1/geofences', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async deleteGeofence(geofenceId: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/v1/geofences/${geofenceId}`, {
      method: 'DELETE',
    });
  },

  async validateGeofenceProximity(
    body: CheckGeofenceProximityRequest,
  ): Promise<CheckGeofenceProximityResponse> {
    return request<CheckGeofenceProximityResponse>('/v1/geofences/validate-proximity', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  // --- Phase 03: Customers & Customer Sites ---
  async listCustomers(search?: string): Promise<ListCustomersResponse> {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return request<ListCustomersResponse>(`/v1/customers${query}`, { method: 'GET' });
  },

  async createCustomer(body: CreateCustomerRequest): Promise<Customer> {
    return request<Customer>('/v1/customers', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async getCustomer(id: string): Promise<Customer> {
    return request<Customer>(`/v1/customers/${id}`, { method: 'GET' });
  },

  async updateCustomer(id: string, body: UpdateCustomerRequest): Promise<Customer> {
    return request<Customer>(`/v1/customers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  async listCustomerSites(customerId: string): Promise<ListCustomerSitesResponse> {
    return request<ListCustomerSitesResponse>(`/v1/customers/${customerId}/sites`, {
      method: 'GET',
    });
  },

  async createCustomerSite(
    customerId: string,
    body: CreateCustomerSiteRequest,
  ): Promise<CustomerSite> {
    return request<CustomerSite>(`/v1/customers/${customerId}/sites`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async getCustomerSite(customerId: string, siteId: string): Promise<CustomerSite> {
    return request<CustomerSite>(`/v1/customers/${customerId}/sites/${siteId}`, {
      method: 'GET',
    });
  },

  async updateCustomerSite(
    customerId: string,
    siteId: string,
    body: UpdateCustomerSiteRequest,
  ): Promise<CustomerSite> {
    return request<CustomerSite>(`/v1/customers/${customerId}/sites/${siteId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  // --- Phase 03: Field Visits ---
  async listVisits(filters?: {
    status?: string;
    userId?: string;
    customerId?: string;
    date?: string;
  }): Promise<ListVisitsResponse> {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.userId) params.set('userId', filters.userId);
    if (filters?.customerId) params.set('customerId', filters.customerId);
    if (filters?.date) params.set('date', filters.date);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<ListVisitsResponse>(`/v1/visits${qs}`, { method: 'GET' });
  },

  async createVisit(body: CreateVisitRequest): Promise<Visit> {
    return request<Visit>('/v1/visits', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async getVisit(id: string): Promise<Visit> {
    return request<Visit>(`/v1/visits/${id}`, { method: 'GET' });
  },

  async checkInVisit(id: string, body: VisitCheckInRequest): Promise<Visit> {
    return request<Visit>(`/v1/visits/${id}/check-in`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async checkOutVisit(id: string, body: VisitCheckOutRequest): Promise<Visit> {
    return request<Visit>(`/v1/visits/${id}/check-out`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  // --- Phase 03: Proof of Work & Verification ---
  async listTaskProofs(taskId: string): Promise<ListTaskProofsResponse> {
    return request<ListTaskProofsResponse>(`/v1/tasks/${taskId}/proofs`, { method: 'GET' });
  },

  async verifyTask(taskId: string, body: VerifyTaskRequest): Promise<TaskResponse> {
    return request<TaskResponse>(`/v1/tasks/${taskId}/verify`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  // --- Phase 04: Day Route Stop Sequencing ---
  async reorderVisits(body: ReorderVisitsRequest): Promise<ListVisitsResponse> {
    return request<ListVisitsResponse>('/v1/visits/sequence', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  // --- Phase 04: Recurring Task Templates ---
  async listRecurringTemplates(): Promise<ListRecurringTaskTemplatesResponse> {
    return request<ListRecurringTaskTemplatesResponse>('/v1/tasks/templates', { method: 'GET' });
  },

  async createRecurringTemplate(
    body: CreateRecurringTaskTemplateRequest,
  ): Promise<RecurringTaskTemplate> {
    return request<RecurringTaskTemplate>('/v1/tasks/templates', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async updateRecurringTemplate(
    id: string,
    body: UpdateRecurringTaskTemplateRequest,
  ): Promise<RecurringTaskTemplate> {
    return request<RecurringTaskTemplate>(`/v1/tasks/templates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  // --- Phase 04: Shift Rostering ---
  async listShiftRosters(filters?: {
    startDate?: string;
    endDate?: string;
    userId?: string;
  }): Promise<ListShiftRostersResponse> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.set('startDate', filters.startDate);
    if (filters?.endDate) params.set('endDate', filters.endDate);
    if (filters?.userId) params.set('userId', filters.userId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<ListShiftRostersResponse>(`/v1/attendance/rosters${qs}`, { method: 'GET' });
  },

  async assignShiftRoster(body: AssignShiftRosterRequest): Promise<ListShiftRostersResponse> {
    return request<ListShiftRostersResponse>('/v1/attendance/rosters', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  // --- Phase 04: Operational Analytics & Reports ---
  async getAttendanceReport(filters?: {
    startDate?: string;
    endDate?: string;
  }): Promise<AttendanceReportResponse> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.set('startDate', filters.startDate);
    if (filters?.endDate) params.set('endDate', filters.endDate);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<AttendanceReportResponse>(`/v1/reports/attendance${qs}`, { method: 'GET' });
  },

  async getTaskSlaReport(filters?: {
    startDate?: string;
    endDate?: string;
  }): Promise<TaskSlaReportResponse> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.set('startDate', filters.startDate);
    if (filters?.endDate) params.set('endDate', filters.endDate);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<TaskSlaReportResponse>(`/v1/reports/tasks${qs}`, { method: 'GET' });
  },

  async getVisitReport(filters?: {
    startDate?: string;
    endDate?: string;
  }): Promise<VisitReportResponse> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.set('startDate', filters.startDate);
    if (filters?.endDate) params.set('endDate', filters.endDate);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<VisitReportResponse>(`/v1/reports/visits${qs}`, { method: 'GET' });
  },

  getAttendanceCsvUrl(filters?: { startDate?: string; endDate?: string }): string {
    const params = new URLSearchParams();
    if (filters?.startDate) params.set('startDate', filters.startDate);
    if (filters?.endDate) params.set('endDate', filters.endDate);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return buildApiUrl(`/v1/reports/export/csv${qs}`);
  },

  // --- Phase 04: Notifications ---
  async listNotifications(): Promise<ListNotificationsResponse> {
    return request<ListNotificationsResponse>('/v1/notifications', { method: 'GET' });
  },

  async markNotificationRead(id: string): Promise<MarkNotificationReadResponse> {
    return request<MarkNotificationReadResponse>(`/v1/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  async markAllNotificationsRead(): Promise<MarkNotificationReadResponse> {
    return request<MarkNotificationReadResponse>('/v1/notifications/read-all', {
      method: 'POST',
    });
  },
};

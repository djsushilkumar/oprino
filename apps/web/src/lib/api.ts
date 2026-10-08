import {
  type SignUpRequest,
  type SignInRequest,
  type CreateWorkspaceRequest,
  type AuthResponse,
  type MeResponse,
  type WorkspaceResponse,
  type ListWorkspacesResponse,
  type SwitchWorkspaceResponse,
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
} from '@oprino/contracts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

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

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
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
};


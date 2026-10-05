import {
  type SignUpRequest,
  type SignInRequest,
  type CreateWorkspaceRequest,
  type AuthResponse,
  type MeResponse,
  type WorkspaceResponse,
  type ListWorkspacesResponse,
  type SwitchWorkspaceResponse,
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
};

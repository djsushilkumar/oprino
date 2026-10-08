'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BrandLogo } from '../../components/BrandLogo';
import { webApi, getStoredToken } from '../../lib/api';
import type { MeResponse, WorkspaceListItem } from '@oprino/contracts';

export default function DashboardShellPage() {
  const router = useRouter();
  const [context, setContext] = useState<MeResponse | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      router.push('/auth/signin');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const [meRes, wsList] = await Promise.all([webApi.getMe(), webApi.listWorkspaces()]);

      if (!meRes.activeWorkspace) {
        router.push('/onboarding/workspace');
        return;
      }

      setContext(meRes);
      setWorkspaces(wsList.workspaces);
    } catch (err: any) {
      if (err.status === 401) {
        router.push('/auth/signin');
      } else {
        setError(err.message || 'Failed to load user context');
      }
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleWorkspaceSwitch = async (workspaceId: string) => {
    if (context?.activeWorkspace?.id === workspaceId) return;
    try {
      setIsSwitching(true);
      await webApi.switchWorkspace(workspaceId);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to switch workspace');
    } finally {
      setIsSwitching(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await webApi.signOut();
    } finally {
      router.push('/auth/signin');
    }
  };

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F8FAFC',
          fontFamily: 'var(--oprino-font-body, "Inter", sans-serif)',
          color: '#475569',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <BrandLogo size={48} />
          <p style={{ marginTop: '1rem', fontSize: '0.875rem' }}>Loading workspace context...</p>
        </div>
      </div>
    );
  }

  if (error || !context) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F8FAFC',
          padding: '2rem',
        }}
      >
        <div
          style={{
            maxWidth: '440px',
            backgroundColor: '#FFFFFF',
            padding: '2rem',
            borderRadius: '12px',
            border: '1px solid #DDE5EF',
            textAlign: 'center',
          }}
        >
          <h2 style={{ color: '#DC2626', marginBottom: '0.5rem' }}>Session Error</h2>
          <p style={{ color: '#475569', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            {error || 'Unable to establish workspace session.'}
          </p>
          <button
            onClick={() => router.push('/auth/signin')}
            style={{
              backgroundColor: '#164CFF',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '0.75rem 1.5rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Return to Sign In
          </button>
        </div>
      </div>
    );
  }

  const { user, activeWorkspace, role, permissions } = context;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F8FAFC',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--oprino-font-body, "Inter", sans-serif)',
      }}
    >
      {/* Authenticated Navigation Bar */}
      <header
        style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #DDE5EF',
          padding: '0.75rem 1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <BrandLogo size={32} />

          {/* Workspace Switcher Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                fontSize: '0.75rem',
                color: '#64748B',
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              Workspace:
            </span>
            <select
              value={activeWorkspace?.id || ''}
              onChange={(e) => {
                if (e.target.value === '__NEW__') {
                  router.push('/onboarding/workspace');
                } else {
                  handleWorkspaceSwitch(e.target.value);
                }
              }}
              disabled={isSwitching}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#F8FAFC',
                color: '#0F172A',
                fontWeight: 600,
                fontSize: '0.875rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.name} ({ws.roleName})
                </option>
              ))}
              <option value="__NEW__">+ Create New Workspace</option>
            </select>
          </div>

          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginLeft: '0.5rem' }}>
            <span
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                backgroundColor: '#EFF6FF',
                color: '#164CFF',
              }}
            >
              Overview
            </span>
            <a
              href="/tasks"
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.8125rem',
                fontWeight: 500,
                color: '#64748B',
                textDecoration: 'none',
              }}
            >
              Tasks
            </a>
            <a
              href="/attendance"
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.8125rem',
                fontWeight: 500,
                color: '#64748B',
                textDecoration: 'none',
              }}
            >
              Attendance
            </a>
          </nav>
        </div>

        {/* User Identity & Logout Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>
              {user.name}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{user.email}</div>
          </div>

          <span
            style={{
              backgroundColor: '#EFF6FF',
              color: '#164CFF',
              padding: '0.3rem 0.65rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              border: '1px solid #BFDBFE',
            }}
          >
            {role?.name || 'Member'}
          </span>

          <button
            onClick={handleSignOut}
            style={{
              backgroundColor: 'transparent',
              color: '#64748B',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              padding: '0.4rem 0.85rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Authenticated Body */}
      <main
        style={{ flex: 1, padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}
      >
        {/* Workspace Banner */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #DDE5EF',
            borderRadius: '12px',
            padding: '1.75rem',
            marginBottom: '1.5rem',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.25rem',
                }}
              >
                <h1
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: '#0F172A',
                    fontFamily: 'var(--oprino-font-display, "Outfit", sans-serif)',
                  }}
                >
                  {activeWorkspace?.name}
                </h1>
                <span
                  style={{
                    backgroundColor: '#DCFCE7',
                    color: '#15803D',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '6px',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                  }}
                >
                  Active Tenant
                </span>
              </div>
              <p style={{ color: '#64748B', fontSize: '0.875rem', fontFamily: 'monospace' }}>
                Slug: {activeWorkspace?.slug} &bull; ID: {activeWorkspace?.id}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => router.push('/onboarding/workspace')}
                style={{
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.5rem 0.9rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                + Add Another Workspace
              </button>
            </div>
          </div>
        </div>

        {/* Foundation Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {/* Card 1: Role & Governance */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #DDE5EF',
              borderRadius: '12px',
              padding: '1.5rem',
            }}
          >
            <h2
              style={{
                fontSize: '1.125rem',
                fontWeight: 700,
                color: '#0F172A',
                marginBottom: '1rem',
              }}
            >
              Role & Permissions
            </h2>

            <div style={{ marginBottom: '1.25rem' }}>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: '#64748B',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                }}
              >
                Assigned Role
              </div>
              <div
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: '#0F172A',
                  marginTop: '0.25rem',
                }}
              >
                {role?.name || 'Member'}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: '#64748B',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  marginBottom: '0.5rem',
                }}
              >
                Effective Permissions ({permissions.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                {permissions.map((p: string) => (
                  <span
                    key={p}
                    style={{
                      backgroundColor: '#F1F5F9',
                      color: '#334155',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                    }}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Tenant Isolation & Invariants */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #DDE5EF',
              borderRadius: '12px',
              padding: '1.5rem',
            }}
          >
            <h2
              style={{
                fontSize: '1.125rem',
                fontWeight: 700,
                color: '#0F172A',
                marginBottom: '1rem',
              }}
            >
              Tenant Isolation Guarantees
            </h2>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.875rem',
                fontSize: '0.8125rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#16A34A', fontWeight: 700 }}>✓</span>
                <span style={{ color: '#334155' }}>
                  <strong>PostgreSQL Row-Level Security:</strong> Kernel-enforced tenant boundaries.
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#16A34A', fontWeight: 700 }}>✓</span>
                <span style={{ color: '#334155' }}>
                  <strong>Transaction-Scoped Isolation:</strong>{' '}
                  <code>SET LOCAL app.current_workspace_id</code> on pooled connections.
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#16A34A', fontWeight: 700 }}>✓</span>
                <span style={{ color: '#334155' }}>
                  <strong>Duty-Hours Invariant:</strong> Zero off-duty tracking. Peer visibility OFF
                  by default.
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#16A34A', fontWeight: 700 }}>✓</span>
                <span style={{ color: '#334155' }}>
                  <strong>Device Governance:</strong> Installation ID lifecycle with instant
                  server-side revocation.
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Switcher Summary */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #DDE5EF',
              borderRadius: '12px',
              padding: '1.5rem',
            }}
          >
            <h2
              style={{
                fontSize: '1.125rem',
                fontWeight: 700,
                color: '#0F172A',
                marginBottom: '1rem',
              }}
            >
              Your Workspaces ({workspaces.length})
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {workspaces.map((ws) => {
                const isCurrent = ws.id === activeWorkspace?.id;
                return (
                  <div
                    key={ws.id}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: isCurrent ? '1.5px solid #164CFF' : '1px solid #E2E8F0',
                      backgroundColor: isCurrent ? '#EFF6FF' : '#F8FAFC',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0F172A' }}>
                        {ws.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        Role: {ws.roleName}
                      </div>
                    </div>
                    {isCurrent ? (
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#164CFF' }}>
                        Active
                      </span>
                    ) : (
                      <button
                        onClick={() => handleWorkspaceSwitch(ws.id)}
                        disabled={isSwitching}
                        style={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #CBD5E1',
                          borderRadius: '6px',
                          padding: '0.3rem 0.6rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          color: '#0F172A',
                        }}
                      >
                        Switch
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

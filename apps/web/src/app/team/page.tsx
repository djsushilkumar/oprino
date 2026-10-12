'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { HeaderNav } from '../../components/HeaderNav';
import { Icon } from '../../components/Icon';
import { webApi, getStoredToken, type WorkspaceMember } from '../../lib/api';
import type { MeResponse } from '@oprino/contracts';

export default function TeamPage() {
  const router = useRouter();
  const [context, setContext] = useState<MeResponse | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberPassword, setMemberPassword] = useState('Welcome@123');
  const [memberRole, setMemberRole] = useState<'Employee' | 'Manager'>('Employee');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      router.push('/auth/signin');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const meRes = await webApi.getMe();
      if (!meRes.activeWorkspace) {
        router.push('/onboarding/workspace');
        return;
      }
      setContext(meRes);

      const res = await webApi.listWorkspaceMembers();
      setMembers(res.members || []);
    } catch (err: any) {
      if (err.status === 401) {
        router.push('/auth/signin');
      } else {
        setError(err.message || 'Failed to load team members');
      }
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSignOut = async () => {
    await webApi.signOut();
    router.push('/auth/signin');
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim() || !memberEmail.trim() || !memberPassword.trim()) {
      setModalError('Please fill in all required fields.');
      return;
    }

    if (memberPassword.length < 8) {
      setModalError('Password must be at least 8 characters.');
      return;
    }

    try {
      setIsSubmitting(true);
      setModalError(null);

      const res = await webApi.addWorkspaceMember({
        name: memberName.trim(),
        email: memberEmail.trim().toLowerCase(),
        password: memberPassword,
        roleName: memberRole,
      });

      setSuccessMessage(
        `✅ ${res.member.name} was added successfully as ${res.member.roleName}! They can now log in using ${res.member.email}.`,
      );

      // Reset modal fields and close
      setMemberName('');
      setMemberEmail('');
      setMemberPassword('Welcome@123');
      setMemberRole('Employee');
      setIsModalOpen(false);

      // Refresh members list
      await loadData();
    } catch (err: any) {
      setModalError(err.message || 'Failed to add team member');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered members list
  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (roleFilter === 'ALL') return true;
    if (roleFilter === 'EMPLOYEE') return m.roleName.toLowerCase().includes('employee');
    if (roleFilter === 'MANAGER') return m.roleName.toLowerCase().includes('manager');
    if (roleFilter === 'OWNER') return m.roleName.toLowerCase().includes('owner');
    return true;
  });

  const totalEmployees = members.filter((m) =>
    m.roleName.toLowerCase().includes('employee'),
  ).length;
  const totalManagers = members.filter((m) =>
    m.roleName.toLowerCase().includes('manager'),
  ).length;
  const totalOwners = members.filter((m) =>
    m.roleName.toLowerCase().includes('owner'),
  ).length;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      <HeaderNav context={context} onSignOut={handleSignOut} />

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem' }}>
        {/* Header Title & Action Button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1
                style={{
                  fontFamily: 'var(--oprino-font-display, "Outfit", sans-serif)',
                  fontSize: '1.875rem',
                  fontWeight: 800,
                  color: '#0F172A',
                  letterSpacing: '-0.02em',
                  margin: 0,
                }}
              >
                Team & Field Workforce
              </h1>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '0.2rem 0.65rem',
                  borderRadius: '20px',
                  backgroundColor: '#E0E7FF',
                  color: '#4338CA',
                }}
              >
                {context?.activeWorkspace?.name || 'Workspace'}
              </span>
            </div>
            <p style={{ color: '#64748B', fontSize: '0.9375rem', marginTop: '0.25rem' }}>
              Manage operations supervisors, dispatchers, and field technicians for mobile execution.
            </p>
          </div>

          <button
            onClick={() => {
              setIsModalOpen(true);
              setModalError(null);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#164CFF',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '0.75rem 1.25rem',
              fontSize: '0.9375rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(22, 76, 255, 0.2)',
              transition: 'background-color 0.15s ease',
            }}
          >
            <Icon name="plus" size={16} color="#FFFFFF" />
            <span>Add Employee</span>
          </button>
        </div>

        {/* Success Alert Banner */}
        {successMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#ECFDF5',
              border: '1px solid #6EE7B7',
              borderRadius: '8px',
              padding: '0.875rem 1.25rem',
              color: '#065F46',
              fontSize: '0.9375rem',
              marginBottom: '1.5rem',
            }}
          >
            <span>{successMessage}</span>
            <button
              onClick={() => setSuccessMessage(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#065F46',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div
            style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: '8px',
              padding: '0.875rem 1.25rem',
              color: '#DC2626',
              fontSize: '0.9375rem',
              marginBottom: '1.5rem',
            }}
          >
            {error}
          </div>
        )}

        {/* Metrics Summary Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              padding: '1.25rem',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
            }}
          >
            <div style={{ color: '#64748B', fontSize: '0.8125rem', fontWeight: 600 }}>
              TOTAL WORKFORCE
            </div>
            <div
              style={{
                fontSize: '1.875rem',
                fontWeight: 800,
                color: '#0F172A',
                marginTop: '0.25rem',
                fontFamily: 'var(--oprino-font-display, "Outfit", sans-serif)',
              }}
            >
              {members.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#10B981', marginTop: '0.25rem' }}>
              Active members in workspace
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#FFFFFF',
              padding: '1.25rem',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
            }}
          >
            <div style={{ color: '#64748B', fontSize: '0.8125rem', fontWeight: 600 }}>
              FIELD EMPLOYEES
            </div>
            <div
              style={{
                fontSize: '1.875rem',
                fontWeight: 800,
                color: '#059669',
                marginTop: '0.25rem',
                fontFamily: 'var(--oprino-font-display, "Outfit", sans-serif)',
              }}
            >
              {totalEmployees}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>
              Mobile APK technicians & site agents
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#FFFFFF',
              padding: '1.25rem',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
            }}
          >
            <div style={{ color: '#64748B', fontSize: '0.8125rem', fontWeight: 600 }}>
              OPERATIONS MANAGERS
            </div>
            <div
              style={{
                fontSize: '1.875rem',
                fontWeight: 800,
                color: '#4F46E5',
                marginTop: '0.25rem',
                fontFamily: 'var(--oprino-font-display, "Outfit", sans-serif)',
              }}
            >
              {totalManagers}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>
              Supervisors & dispatch coordinators
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#FFFFFF',
              padding: '1.25rem',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
            }}
          >
            <div style={{ color: '#64748B', fontSize: '0.8125rem', fontWeight: 600 }}>
              ADMINISTRATORS
            </div>
            <div
              style={{
                fontSize: '1.875rem',
                fontWeight: 800,
                color: '#0F172A',
                marginTop: '0.25rem',
                fontFamily: 'var(--oprino-font-display, "Outfit", sans-serif)',
              }}
            >
              {totalOwners}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>
              Workspace owners with full RBAC
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            padding: '1rem 1.25rem',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            marginBottom: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>Filter:</span>
            {[
              { id: 'ALL', label: 'All' },
              { id: 'EMPLOYEE', label: 'Employees' },
              { id: 'MANAGER', label: 'Managers' },
              { id: 'OWNER', label: 'Admins' },
            ].map((tab) => {
              const active = roleFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setRoleFilter(tab.id)}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: '6px',
                    fontSize: '0.8125rem',
                    fontWeight: active ? 600 : 500,
                    border: active ? '1px solid #164CFF' : '1px solid #E2E8F0',
                    backgroundColor: active ? '#EEF2FF' : '#FFFFFF',
                    color: active ? '#164CFF' : '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div style={{ minWidth: '280px' }}>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.85rem',
                fontSize: '0.875rem',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                outline: 'none',
                color: '#0F172A',
              }}
            />
          </div>
        </div>

        {/* Members Table */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            overflow: 'hidden',
          }}
        >
          {isLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
              Loading workforce members...
            </div>
          ) : filteredMembers.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <div style={{ marginBottom: '0.75rem' }}>
                <Icon name="team" size={44} color="#94A3B8" />
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0F172A', margin: 0 }}>
                No team members found
              </h3>
              <p style={{ color: '#64748B', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {searchQuery || roleFilter !== 'ALL'
                  ? 'Try adjusting your search query or filter.'
                  : 'Start by adding field employees to your workspace.'}
              </p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.8125rem', fontWeight: 700, color: '#475569' }}>
                    MEMBER
                  </th>
                  <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.8125rem', fontWeight: 700, color: '#475569' }}>
                    ROLE
                  </th>
                  <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.8125rem', fontWeight: 700, color: '#475569' }}>
                    MOBILE ACCESS
                  </th>
                  <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.8125rem', fontWeight: 700, color: '#475569' }}>
                    STATUS
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((m) => {
                  const isOwner = m.roleName.toLowerCase().includes('owner');
                  const isManager = m.roleName.toLowerCase().includes('manager');
                  const isEmployee = m.roleName.toLowerCase().includes('employee');

                  let roleBadgeBg = '#F1F5F9';
                  let roleBadgeColor = '#475569';
                  if (isOwner) {
                    roleBadgeBg = '#EFF6FF';
                    roleBadgeColor = '#1D4ED8';
                  } else if (isManager) {
                    roleBadgeBg = '#EEF2FF';
                    roleBadgeColor = '#4338CA';
                  } else if (isEmployee) {
                    roleBadgeBg = '#ECFDF5';
                    roleBadgeColor = '#047857';
                  }

                  const initials = m.name
                    ? m.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)
                    : 'U';

                  return (
                    <tr
                      key={m.membershipId}
                      style={{ borderBottom: '1px solid #F1F5F9', transition: 'background-color 0.15s ease' }}
                    >
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              backgroundColor: isEmployee ? '#D1FAE5' : isManager ? '#E0E7FF' : '#DBEAFE',
                              color: isEmployee ? '#065F46' : isManager ? '#3730A3' : '#1E40AF',
                              fontWeight: 700,
                              fontSize: '0.875rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.9375rem' }}>
                              {m.name}
                            </div>
                            <div style={{ color: '#64748B', fontSize: '0.8125rem' }}>{m.email}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '0.25rem 0.65rem',
                            borderRadius: '20px',
                            backgroundColor: roleBadgeBg,
                            color: roleBadgeColor,
                            display: 'inline-block',
                          }}
                        >
                          {m.roleName}
                        </span>
                      </td>

                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Icon name="mobile" size={16} color="#164CFF" />
                          <span style={{ fontSize: '0.8125rem', color: '#334155', fontWeight: 500 }}>
                            {isEmployee
                              ? 'Field Execution & GPS Track'
                              : isManager
                              ? 'Managerial Dispatch & Map'
                              : 'Full System Access'}
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <span
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: '#10B981',
                            }}
                          />
                          <span
                            style={{
                              fontSize: '0.8125rem',
                              fontWeight: 600,
                              color: '#065F46',
                              textTransform: 'capitalize',
                            }}
                          >
                            {m.status}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Add Employee Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '520px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    color: '#0F172A',
                    fontFamily: 'var(--oprino-font-display, "Outfit", sans-serif)',
                  }}
                >
                  Add Team Member
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8125rem', color: '#64748B' }}>
                  Create an account for a frontline field technician or operations manager.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.25rem',
                  color: '#64748B',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMember} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {modalError && (
                <div
                  style={{
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    color: '#DC2626',
                    fontSize: '0.875rem',
                  }}
                >
                  {modalError}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginBottom: '0.375rem' }}>
                  Full Name <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    outline: 'none',
                    color: '#0F172A',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginBottom: '0.375rem' }}>
                  Work Email <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="ramesh@company.com"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    outline: 'none',
                    color: '#0F172A',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginBottom: '0.375rem' }}>
                  Initial Password <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                  value={memberPassword}
                  onChange={(e) => setMemberPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    outline: 'none',
                    color: '#0F172A',
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem', display: 'block' }}>
                  The employee will use this password to log into the Oprino Mobile App.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginBottom: '0.375rem' }}>
                  Role & Operational Permissions
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <label
                    style={{
                      border: memberRole === 'Employee' ? '2px solid #164CFF' : '1px solid #E2E8F0',
                      backgroundColor: memberRole === 'Employee' ? '#EEF2FF' : '#FFFFFF',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="radio"
                        name="role"
                        value="Employee"
                        checked={memberRole === 'Employee'}
                        onChange={() => setMemberRole('Employee')}
                      />
                      <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0F172A' }}>Employee</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      Field technician, mobile selfie punch, tasks, site visits.
                    </span>
                  </label>

                  <label
                    style={{
                      border: memberRole === 'Manager' ? '2px solid #164CFF' : '1px solid #E2E8F0',
                      backgroundColor: memberRole === 'Manager' ? '#EEF2FF' : '#FFFFFF',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="radio"
                        name="role"
                        value="Manager"
                        checked={memberRole === 'Manager'}
                        onChange={() => setMemberRole('Manager')}
                      />
                      <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0F172A' }}>Manager</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      Operations supervisor, dispatches tasks, approves proof.
                    </span>
                  </label>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                  marginTop: '0.5rem',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '0.65rem 1.25rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#475569',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '0.65rem 1.5rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#164CFF',
                    color: '#FFFFFF',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.7 : 1,
                  }}
                >
                  {isSubmitting ? 'Adding Member...' : 'Confirm & Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

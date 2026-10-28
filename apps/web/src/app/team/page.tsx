'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { HeaderNav } from '../../components/HeaderNav';
import { Icon } from '../../components/Icon';
import { webApi, getStoredToken, type WorkspaceMember } from '../../lib/api';
import type {
  MeResponse,
  WorkspaceInvitation,
  BulkImportRow,
  BulkImportRowResult,
} from '@oprino/contracts';

type ActiveTab = 'members' | 'invitations';

export default function TeamPage() {
  const router = useRouter();
  const [context, setContext] = useState<MeResponse | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('members');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Single Invite Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Employee' | 'Manager'>('Employee');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);
  const [hasCopiedLink, setHasCopiedLink] = useState(false);

  // Bulk CSV Import Modal State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkRows, setBulkRows] = useState<BulkImportRow[]>([]);
  const [bulkFileName, setBulkFileName] = useState<string | null>(null);
  const [bulkParseError, setBulkParseError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    totalRows: number;
    successCount: number;
    failureCount: number;
    results: BulkImportRowResult[];
  } | null>(null);

  // Member Lifecycle Action Modal State
  const [lifecycleModal, setLifecycleModal] = useState<{
    isOpen: boolean;
    member: WorkspaceMember | null;
    action: 'SUSPEND' | 'ACTIVATE' | 'REMOVE' | 'ROLE_CHANGE';
    newRole?: 'Employee' | 'Manager';
  }>({
    isOpen: false,
    member: null,
    action: 'SUSPEND',
  });
  const [isLifecycleSubmitting, setIsLifecycleSubmitting] = useState(false);
  const [lifecycleError, setLifecycleError] = useState<string | null>(null);

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

      const [membersRes, invitesRes] = await Promise.all([
        webApi.listWorkspaceMembers(),
        webApi.listWorkspaceInvitations().catch(() => ({ invitations: [] })),
      ]);

      setMembers(membersRes.members || []);
      setInvitations(invitesRes.invitations || []);
    } catch (err: any) {
      if (err.status === 401) {
        router.push('/auth/signin');
      } else {
        setError(err.message || 'Failed to load team data');
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

  // Check how many active owners exist
  const activeOwnersCount = useMemo(() => {
    return members.filter(
      (m) => m.roleName.toLowerCase() === 'owner' && m.status.toUpperCase() !== 'SUSPENDED',
    ).length;
  }, [members]);

  // Handle Single Invite
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) {
      setInviteError('Please provide both name and work email.');
      return;
    }

    try {
      setIsInviting(true);
      setInviteError(null);

      const res = await webApi.inviteWorkspaceMember({
        name: inviteName.trim(),
        email: inviteEmail.trim().toLowerCase(),
        roleName: inviteRole,
      });

      const activationUrl =
        res.invitation.invitationUrl ||
        `${window.location.origin}/auth/activate?id=${res.invitation.id}`;
      setGeneratedInviteLink(activationUrl);
      setSuccessMessage(`Invitation generated for ${res.invitation.email}!`);
      await loadData();
    } catch (err: any) {
      setInviteError(err.message || 'Failed to create invitation');
    } finally {
      setIsInviting(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setHasCopiedLink(true);
      setTimeout(() => setHasCopiedLink(false), 3000);
    } catch {
      // fallback
      prompt('Copy activation link:', text);
    }
  };

  // Revoke Invitation
  const handleRevokeInvitation = async (invitationId: string) => {
    if (
      !confirm(
        'Are you sure you want to revoke this invitation? The activation link will immediately stop working.',
      )
    ) {
      return;
    }

    try {
      await webApi.revokeWorkspaceInvitation({ invitationId });
      setSuccessMessage('Invitation revoked successfully.');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to revoke invitation');
    }
  };

  // Download Sample CSV Template
  const handleDownloadTemplate = () => {
    const csvContent =
      'name,email,role\n' +
      'Ramesh Sharma,ramesh@company.com,Employee\n' +
      'Pooja Patel,pooja@company.com,Manager\n' +
      'Amit Verma,amit@company.com,Employee\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'oprino_employee_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle CSV File Selection & Parse
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBulkParseError(null);
    setImportSummary(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setBulkParseError('Invalid file format. Please upload a .csv file.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setBulkParseError('File size exceeds the 2MB limit.');
      return;
    }

    setBulkFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) {
        setBulkParseError('Uploaded CSV file is empty.');
        return;
      }

      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      if (lines.length < 2) {
        setBulkParseError('CSV must contain a header row and at least one data row.');
        return;
      }

      const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const nameIdx = header.indexOf('name');
      const emailIdx = header.indexOf('email');
      const roleIdx = header.indexOf('role');

      if (nameIdx === -1 || emailIdx === -1 || roleIdx === -1) {
        setBulkParseError('CSV header must contain "name", "email", and "role" columns.');
        return;
      }

      const parsedRows: BulkImportRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p) => p.trim());
        if (parts.length >= 3) {
          const rawRole = parts[roleIdx];
          const normalizedRole = rawRole.toLowerCase().includes('man') ? 'Manager' : 'Employee';
          parsedRows.push({
            name: parts[nameIdx],
            email: parts[emailIdx],
            role: normalizedRole as 'Employee' | 'Manager',
          });
        }
      }

      if (parsedRows.length === 0) {
        setBulkParseError('No valid data rows found in CSV.');
        return;
      }

      if (parsedRows.length > 100) {
        setBulkParseError(
          `Import is bounded to 100 rows per batch. Found ${parsedRows.length} rows.`,
        );
        return;
      }

      setBulkRows(parsedRows);
    };

    reader.onerror = () => {
      setBulkParseError('Failed to read the selected CSV file.');
    };

    reader.readAsText(file);
  };

  // Submit Bulk Import
  const handleBulkImportSubmit = async () => {
    if (bulkRows.length === 0) return;

    try {
      setIsImporting(true);
      setBulkParseError(null);

      const res = await webApi.importMembersCsv({ members: bulkRows });
      setImportSummary({
        totalRows: res.totalRows,
        successCount: res.successCount,
        failureCount: res.failureCount,
        results: res.results,
      });

      setSuccessMessage(
        `Bulk import processed: ${res.successCount} invited, ${res.failureCount} failed.`,
      );
      await loadData();
    } catch (err: any) {
      setBulkParseError(err.message || 'Bulk import failed');
    } finally {
      setIsImporting(false);
    }
  };

  // Handle Lifecycle Action Confirmation
  const handleExecuteLifecycleAction = async () => {
    const { member, action, newRole } = lifecycleModal;
    if (!member) return;

    try {
      setIsLifecycleSubmitting(true);
      setLifecycleError(null);

      if (action === 'ROLE_CHANGE') {
        if (!newRole) return;
        await webApi.updateWorkspaceMember(member.membershipId, { roleName: newRole });
        setSuccessMessage(`Updated role of ${member.name} to ${newRole}.`);
      } else if (action === 'SUSPEND') {
        await webApi.updateWorkspaceMember(member.membershipId, { status: 'suspended' });
        setSuccessMessage(`Suspended ${member.name}. Mobile tracking and sessions terminated.`);
      } else if (action === 'ACTIVATE') {
        await webApi.updateWorkspaceMember(member.membershipId, { status: 'active' });
        setSuccessMessage(`Reactivated ${member.name}.`);
      } else if (action === 'REMOVE') {
        await webApi.updateWorkspaceMember(member.membershipId, { status: 'removed' });
        setSuccessMessage(`Removed ${member.name} from workspace.`);
      }

      setLifecycleModal({ isOpen: false, member: null, action: 'SUSPEND' });
      await loadData();
    } catch (err: any) {
      setLifecycleError(err.message || 'Operation failed');
    } finally {
      setIsLifecycleSubmitting(false);
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
  const totalManagers = members.filter((m) => m.roleName.toLowerCase().includes('manager')).length;
  const totalOwners = members.filter((m) => m.roleName.toLowerCase().includes('owner')).length;
  const totalPendingInvites = invitations.filter((i) => i.status === 'PENDING').length;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      <HeaderNav context={context} onSignOut={handleSignOut} />

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem' }}>
        {/* Header Title & Action Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem',
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
              Manage operations supervisors, dispatchers, and field technicians for mobile
              execution.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Bulk CSV Import Button */}
            <button
              onClick={() => {
                setIsBulkModalOpen(true);
                setBulkRows([]);
                setBulkFileName(null);
                setBulkParseError(null);
                setImportSummary(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#FFFFFF',
                color: '#334155',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                padding: '0.65rem 1.15rem',
                fontSize: '0.9375rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon name="download" size={16} color="#475569" />
              <span>Bulk Import (CSV)</span>
            </button>

            {/* Invite Employee Button */}
            <button
              onClick={() => {
                setIsInviteModalOpen(true);
                setInviteName('');
                setInviteEmail('');
                setInviteRole('Employee');
                setInviteError(null);
                setGeneratedInviteLink(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#164CFF',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '0.65rem 1.25rem',
                fontSize: '0.9375rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(22, 76, 255, 0.2)',
                transition: 'background-color 0.15s ease',
              }}
            >
              <Icon name="plus" size={16} color="#FFFFFF" />
              <span>Invite Member</span>
            </button>
          </div>
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
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
                color: '#164CFF',
                marginTop: '0.25rem',
                fontFamily: 'var(--oprino-font-display, "Outfit", sans-serif)',
              }}
            >
              {totalEmployees}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>
              Mobile attendance & GPS active
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
              MANAGERS & OWNERS
            </div>
            <div
              style={{
                fontSize: '1.875rem',
                fontWeight: 800,
                color: '#4338CA',
                marginTop: '0.25rem',
                fontFamily: 'var(--oprino-font-display, "Outfit", sans-serif)',
              }}
            >
              {totalManagers + totalOwners}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>
              Dispatchers & administrators
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
              PENDING INVITATIONS
            </div>
            <div
              style={{
                fontSize: '1.875rem',
                fontWeight: 800,
                color: '#D97706',
                marginTop: '0.25rem',
                fontFamily: 'var(--oprino-font-display, "Outfit", sans-serif)',
              }}
            >
              {totalPendingInvites}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#D97706', marginTop: '0.25rem' }}>
              Awaiting employee password setup
            </div>
          </div>
        </div>

        {/* Tab Switching: Active Members vs Pending Invitations */}
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            borderBottom: '1px solid #E2E8F0',
            marginBottom: '1.5rem',
          }}
        >
          <button
            onClick={() => setActiveTab('members')}
            style={{
              padding: '0.75rem 1rem',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'members' ? '3px solid #164CFF' : '3px solid transparent',
              color: activeTab === 'members' ? '#164CFF' : '#64748B',
              fontWeight: 700,
              fontSize: '0.9375rem',
              cursor: 'pointer',
            }}
          >
            Active Workforce ({members.length})
          </button>
          <button
            onClick={() => setActiveTab('invitations')}
            style={{
              padding: '0.75rem 1rem',
              border: 'none',
              background: 'none',
              borderBottom:
                activeTab === 'invitations' ? '3px solid #164CFF' : '3px solid transparent',
              color: activeTab === 'invitations' ? '#164CFF' : '#64748B',
              fontWeight: 700,
              fontSize: '0.9375rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>Pending Invitations</span>
            {totalPendingInvites > 0 && (
              <span
                style={{
                  fontSize: '0.75rem',
                  backgroundColor: '#FEF3C7',
                  color: '#B45309',
                  borderRadius: '12px',
                  padding: '0.1rem 0.5rem',
                }}
              >
                {totalPendingInvites}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: ACTIVE WORKFORCE TABLE */}
        {activeTab === 'members' && (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            }}
          >
            {/* Filter Bar */}
            <div
              style={{
                padding: '1rem 1.25rem',
                borderBottom: '1px solid #F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  flex: '1',
                  maxWidth: '360px',
                }}
              >
                <Icon name="search" size={18} color="#94A3B8" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    fontSize: '0.875rem',
                    width: '100%',
                    color: '#0F172A',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8125rem', color: '#64748B', fontWeight: 600 }}>
                  Role:
                </span>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.8125rem',
                    color: '#0F172A',
                    backgroundColor: '#FFFFFF',
                    outline: 'none',
                  }}
                >
                  <option value="ALL">All Roles</option>
                  <option value="EMPLOYEE">Employees Only</option>
                  <option value="MANAGER">Managers Only</option>
                  <option value="OWNER">Owners Only</option>
                </select>
              </div>
            </div>

            {/* Table */}
            {isLoading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                Loading workforce roster...
              </div>
            ) : filteredMembers.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                No team members match your criteria.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th
                      style={{
                        padding: '0.875rem 1.25rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#475569',
                      }}
                    >
                      NAME & EMAIL
                    </th>
                    <th
                      style={{
                        padding: '0.875rem 1.25rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#475569',
                      }}
                    >
                      ROLE & PERMISSION
                    </th>
                    <th
                      style={{
                        padding: '0.875rem 1.25rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#475569',
                      }}
                    >
                      STATUS
                    </th>
                    <th
                      style={{
                        padding: '0.875rem 1.25rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#475569',
                        textAlign: 'right',
                      }}
                    >
                      LIFECYCLE ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((m) => {
                    const isOwner = m.roleName.toLowerCase() === 'owner';
                    const isManager = m.roleName.toLowerCase() === 'manager';
                    const isEmployee = m.roleName.toLowerCase() === 'employee';
                    const isSuspended = m.status.toUpperCase() === 'SUSPENDED';
                    const isLastActiveOwner = isOwner && !isSuspended && activeOwnersCount <= 1;

                    let roleBadgeBg = '#DBEAFE';
                    let roleBadgeColor = '#1E40AF';
                    if (isManager) {
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
                        style={{
                          borderBottom: '1px solid #F1F5F9',
                          backgroundColor: isSuspended ? '#FFFBEB' : '#FFFFFF',
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                            <div
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                backgroundColor: isSuspended
                                  ? '#FEE2E2'
                                  : isEmployee
                                    ? '#D1FAE5'
                                    : isManager
                                      ? '#E0E7FF'
                                      : '#DBEAFE',
                                color: isSuspended
                                  ? '#991B1B'
                                  : isEmployee
                                    ? '#065F46'
                                    : isManager
                                      ? '#3730A3'
                                      : '#1E40AF',
                                fontWeight: 700,
                                fontSize: '0.875rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifySelf: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {initials}
                            </div>
                            <div>
                              <div
                                style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.9375rem' }}
                              >
                                {m.name}
                              </div>
                              <div style={{ color: '#64748B', fontSize: '0.8125rem' }}>
                                {m.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '1rem 1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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

                            {/* Role changer dropdown if not last owner */}
                            {!isOwner && (
                              <select
                                value={isManager ? 'Manager' : 'Employee'}
                                onChange={(e) => {
                                  const targetRole = e.target.value as 'Employee' | 'Manager';
                                  setLifecycleModal({
                                    isOpen: true,
                                    member: m,
                                    action: 'ROLE_CHANGE',
                                    newRole: targetRole,
                                  });
                                  setLifecycleError(null);
                                }}
                                style={{
                                  fontSize: '0.75rem',
                                  padding: '0.2rem 0.4rem',
                                  borderRadius: '6px',
                                  border: '1px solid #CBD5E1',
                                  color: '#475569',
                                  cursor: 'pointer',
                                }}
                              >
                                <option value="Employee">Employee</option>
                                <option value="Manager">Manager</option>
                              </select>
                            )}

                            {isLastActiveOwner && (
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  color: '#64748B',
                                  fontStyle: 'italic',
                                }}
                              >
                                (Primary Owner)
                              </span>
                            )}
                          </div>
                        </td>

                        <td style={{ padding: '1rem 1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            <span
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: isSuspended ? '#EF4444' : '#10B981',
                              }}
                            />
                            <span
                              style={{
                                fontSize: '0.8125rem',
                                fontWeight: 600,
                                color: isSuspended ? '#B91C1C' : '#065F46',
                                textTransform: 'capitalize',
                              }}
                            >
                              {isSuspended ? 'Suspended' : 'Active'}
                            </span>
                          </div>
                        </td>

                        <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-end',
                              gap: '0.5rem',
                            }}
                          >
                            {/* Suspend or Reactivate */}
                            {isSuspended ? (
                              <button
                                onClick={() => {
                                  setLifecycleModal({
                                    isOpen: true,
                                    member: m,
                                    action: 'ACTIVATE',
                                  });
                                  setLifecycleError(null);
                                }}
                                style={{
                                  padding: '0.35rem 0.75rem',
                                  borderRadius: '6px',
                                  border: '1px solid #10B981',
                                  backgroundColor: '#ECFDF5',
                                  color: '#047857',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                Reactivate
                              </button>
                            ) : (
                              <button
                                disabled={isLastActiveOwner}
                                onClick={() => {
                                  setLifecycleModal({
                                    isOpen: true,
                                    member: m,
                                    action: 'SUSPEND',
                                  });
                                  setLifecycleError(null);
                                }}
                                title={
                                  isLastActiveOwner
                                    ? 'Cannot suspend the last active Owner'
                                    : 'Suspend employee'
                                }
                                style={{
                                  padding: '0.35rem 0.75rem',
                                  borderRadius: '6px',
                                  border: '1px solid #FCD34D',
                                  backgroundColor: '#FFFBEB',
                                  color: '#B45309',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  cursor: isLastActiveOwner ? 'not-allowed' : 'pointer',
                                  opacity: isLastActiveOwner ? 0.5 : 1,
                                }}
                              >
                                Suspend
                              </button>
                            )}

                            {/* Remove Member */}
                            <button
                              disabled={isLastActiveOwner}
                              onClick={() => {
                                setLifecycleModal({
                                  isOpen: true,
                                  member: m,
                                  action: 'REMOVE',
                                });
                                setLifecycleError(null);
                              }}
                              title={
                                isLastActiveOwner
                                  ? 'Cannot remove the last active Owner'
                                  : 'Remove from workspace'
                              }
                              style={{
                                padding: '0.35rem 0.75rem',
                                borderRadius: '6px',
                                border: '1px solid #FCA5A5',
                                backgroundColor: '#FEF2F2',
                                color: '#DC2626',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: isLastActiveOwner ? 'not-allowed' : 'pointer',
                                opacity: isLastActiveOwner ? 0.5 : 1,
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 2: PENDING INVITATIONS TABLE */}
        {activeTab === 'invitations' && (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            }}
          >
            {invitations.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                No invitations currently pending. Click "Invite Member" to generate a secure
                activation link.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th
                      style={{
                        padding: '0.875rem 1.25rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#475569',
                      }}
                    >
                      INVITED EMAIL
                    </th>
                    <th
                      style={{
                        padding: '0.875rem 1.25rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#475569',
                      }}
                    >
                      ROLE
                    </th>
                    <th
                      style={{
                        padding: '0.875rem 1.25rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#475569',
                      }}
                    >
                      STATUS
                    </th>
                    <th
                      style={{
                        padding: '0.875rem 1.25rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#475569',
                      }}
                    >
                      EXPIRES AT
                    </th>
                    <th
                      style={{
                        padding: '0.875rem 1.25rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#475569',
                        textAlign: 'right',
                      }}
                    >
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((inv) => (
                    <tr key={inv.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td
                        style={{
                          padding: '1rem 1.25rem',
                          fontWeight: 600,
                          color: '#0F172A',
                          fontSize: '0.875rem',
                        }}
                      >
                        {inv.email}
                      </td>
                      <td
                        style={{ padding: '1rem 1.25rem', fontSize: '0.8125rem', color: '#475569' }}
                      >
                        {inv.roleName}
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.5rem',
                            borderRadius: '12px',
                            backgroundColor: inv.status === 'PENDING' ? '#FEF3C7' : '#F1F5F9',
                            color: inv.status === 'PENDING' ? '#B45309' : '#64748B',
                          }}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td
                        style={{ padding: '1rem 1.25rem', fontSize: '0.8125rem', color: '#64748B' }}
                      >
                        {new Date(inv.expiresAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        {inv.status === 'PENDING' && (
                          <button
                            onClick={() => handleRevokeInvitation(inv.id)}
                            style={{
                              padding: '0.35rem 0.75rem',
                              borderRadius: '6px',
                              border: '1px solid #FCA5A5',
                              backgroundColor: '#FEF2F2',
                              color: '#DC2626',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>

      {/* MODAL 1: SINGLE INVITE MEMBER (BLK-002) */}
      {isInviteModalOpen && (
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
                  Invite Team Member
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8125rem', color: '#64748B' }}>
                  Generate a cryptographically secure, single-use activation link.
                </p>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
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

            {generatedInviteLink ? (
              <div
                style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
              >
                <div
                  style={{
                    backgroundColor: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    borderRadius: '8px',
                    padding: '1rem',
                    color: '#065F46',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>
                    ✅ Invitation Link Generated!
                  </div>
                  <div style={{ fontSize: '0.8125rem' }}>
                    Share this link with <strong>{inviteEmail}</strong>. They will use it to choose
                    their own secure password and activate their account.
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: '#334155',
                      marginBottom: '0.35rem',
                    }}
                  >
                    Single-Use Activation URL (Valid for 7 days)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={generatedInviteLink}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.8125rem',
                      backgroundColor: '#F8FAFC',
                      color: '#0F172A',
                    }}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '0.75rem',
                    marginTop: '0.5rem',
                  }}
                >
                  <button
                    onClick={() => {
                      setGeneratedInviteLink(null);
                      setInviteName('');
                      setInviteEmail('');
                    }}
                    style={{
                      padding: '0.65rem 1rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      backgroundColor: '#FFFFFF',
                      color: '#475569',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Invite Another
                  </button>
                  <button
                    onClick={() => copyToClipboard(generatedInviteLink)}
                    style={{
                      padding: '0.65rem 1.25rem',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: hasCopiedLink ? '#10B981' : '#164CFF',
                      color: '#FFFFFF',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {hasCopiedLink ? '✓ Copied to Clipboard!' : 'Copy Activation Link'}
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleInviteSubmit}
                style={{
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem',
                }}
              >
                {inviteError && (
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
                    {inviteError}
                  </div>
                )}

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#0F172A',
                      marginBottom: '0.375rem',
                    }}
                  >
                    Full Name <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
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
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#0F172A',
                      marginBottom: '0.375rem',
                    }}
                  >
                    Work Email <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="ramesh@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
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
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#0F172A',
                      marginBottom: '0.375rem',
                    }}
                  >
                    Role & Operational Permissions
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <label
                      style={{
                        border:
                          inviteRole === 'Employee' ? '2px solid #164CFF' : '1px solid #E2E8F0',
                        backgroundColor: inviteRole === 'Employee' ? '#EEF2FF' : '#FFFFFF',
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
                          checked={inviteRole === 'Employee'}
                          onChange={() => setInviteRole('Employee')}
                        />
                        <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0F172A' }}>
                          Employee
                        </span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        Mobile selfie punch, visits, GPS tracking during duty.
                      </span>
                    </label>

                    <label
                      style={{
                        border:
                          inviteRole === 'Manager' ? '2px solid #164CFF' : '1px solid #E2E8F0',
                        backgroundColor: inviteRole === 'Manager' ? '#EEF2FF' : '#FFFFFF',
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
                          checked={inviteRole === 'Manager'}
                          onChange={() => setInviteRole('Manager')}
                        />
                        <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0F172A' }}>
                          Manager
                        </span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        Live map monitoring, attendance approval, task dispatch.
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
                    onClick={() => setIsInviteModalOpen(false)}
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
                    disabled={isInviting}
                    style={{
                      padding: '0.65rem 1.5rem',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#164CFF',
                      color: '#FFFFFF',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: isInviting ? 'not-allowed' : 'pointer',
                      opacity: isInviting ? 0.7 : 1,
                    }}
                  >
                    {isInviting ? 'Generating...' : 'Create Invitation Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: BULK CSV IMPORT (BLK-003) */}
      {isBulkModalOpen && (
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
              maxWidth: '680px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
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
                  Bulk Employee Onboarding (CSV)
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8125rem', color: '#64748B' }}>
                  Upload up to 100 employees per batch with automated role mapping and single-use
                  activation tokens.
                </p>
              </div>
              <button
                onClick={() => setIsBulkModalOpen(false)}
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

            <div
              style={{
                padding: '1.5rem',
                overflowY: 'auto',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
              }}
            >
              {/* Template Download Banner */}
              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  border: '1px dashed #CBD5E1',
                  borderRadius: '10px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0F172A' }}>
                    Need the standard CSV format?
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#64748B' }}>
                    Required columns: <code>name, email, role</code> (Employee or Manager)
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '6px',
                    border: '1px solid #164CFF',
                    backgroundColor: '#EEF2FF',
                    color: '#164CFF',
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                  }}
                >
                  Download Template
                </button>
              </div>

              {/* File Input */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#0F172A',
                    marginBottom: '0.35rem',
                  }}
                >
                  Choose CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              {bulkParseError && (
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
                  {bulkParseError}
                </div>
              )}

              {/* Preview Table if rows parsed */}
              {bulkRows.length > 0 && !importSummary && (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0F172A' }}>
                      Ready to import {bulkRows.length} employees ({bulkFileName})
                    </div>
                  </div>
                  <div
                    style={{
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                    }}
                  >
                    <table
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '0.8125rem',
                        textAlign: 'left',
                      }}
                    >
                      <thead style={{ backgroundColor: '#F8FAFC', position: 'sticky', top: 0 }}>
                        <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                          <th style={{ padding: '0.5rem 0.75rem', color: '#475569' }}>#</th>
                          <th style={{ padding: '0.5rem 0.75rem', color: '#475569' }}>Name</th>
                          <th style={{ padding: '0.5rem 0.75rem', color: '#475569' }}>Email</th>
                          <th style={{ padding: '0.5rem 0.75rem', color: '#475569' }}>Role</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkRows.map((r, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '0.5rem 0.75rem', color: '#64748B' }}>{i + 1}</td>
                            <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>{r.name}</td>
                            <td style={{ padding: '0.5rem 0.75rem' }}>{r.email}</td>
                            <td style={{ padding: '0.5rem 0.75rem' }}>{r.role}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Import Results Summary if finished */}
              {importSummary && (
                <div>
                  <div
                    style={{
                      backgroundColor: importSummary.failureCount === 0 ? '#ECFDF5' : '#FFFBEB',
                      border: `1px solid ${importSummary.failureCount === 0 ? '#6EE7B7' : '#FCD34D'}`,
                      borderRadius: '8px',
                      padding: '1rem',
                      marginBottom: '1rem',
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: '0.9375rem',
                        color: '#0F172A',
                        marginBottom: '0.25rem',
                      }}
                    >
                      Import Summary: {importSummary.successCount} Successful,{' '}
                      {importSummary.failureCount} Failed (Total: {importSummary.totalRows})
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#475569' }}>
                      Invitations created have 7-day single-use activation tokens without default
                      credentials.
                    </div>
                  </div>

                  <div
                    style={{
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                    }}
                  >
                    <table
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '0.8125rem',
                        textAlign: 'left',
                      }}
                    >
                      <thead style={{ backgroundColor: '#F8FAFC', position: 'sticky', top: 0 }}>
                        <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                          <th style={{ padding: '0.5rem 0.75rem', color: '#475569' }}>Row</th>
                          <th style={{ padding: '0.5rem 0.75rem', color: '#475569' }}>Email</th>
                          <th style={{ padding: '0.5rem 0.75rem', color: '#475569' }}>Status</th>
                          <th style={{ padding: '0.5rem 0.75rem', color: '#475569' }}>Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importSummary.results.map((res, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '0.5rem 0.75rem' }}>{res.row}</td>
                            <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>
                              {res.email}
                            </td>
                            <td style={{ padding: '0.5rem 0.75rem' }}>
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  padding: '0.15rem 0.4rem',
                                  borderRadius: '10px',
                                  backgroundColor:
                                    res.status === 'INVITED'
                                      ? '#ECFDF5'
                                      : res.status === 'SKIPPED'
                                        ? '#EFF6FF'
                                        : '#FEF2F2',
                                  color:
                                    res.status === 'INVITED'
                                      ? '#065F46'
                                      : res.status === 'SKIPPED'
                                        ? '#1E40AF'
                                        : '#DC2626',
                                }}
                              >
                                {res.status}
                              </span>
                            </td>
                            <td style={{ padding: '0.5rem 0.75rem', color: '#64748B' }}>
                              {res.error ||
                                (res.invitationUrl ? 'Activation link ready' : 'Completed')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div
              style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
              }}
            >
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
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
                Close
              </button>

              {bulkRows.length > 0 && !importSummary && (
                <button
                  type="button"
                  disabled={isImporting}
                  onClick={handleBulkImportSubmit}
                  style={{
                    padding: '0.65rem 1.5rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#164CFF',
                    color: '#FFFFFF',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: isImporting ? 'not-allowed' : 'pointer',
                    opacity: isImporting ? 0.7 : 1,
                  }}
                >
                  {isImporting
                    ? 'Processing Batch...'
                    : `Confirm Import (${bulkRows.length} Employees)`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: MEMBER LIFECYCLE CONFIRMATION (BLK-005) */}
      {lifecycleModal.isOpen && lifecycleModal.member && (
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
              maxWidth: '460px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              padding: '1.5rem',
            }}
          >
            <h3
              style={{
                margin: '0 0 0.5rem',
                fontSize: '1.125rem',
                fontWeight: 700,
                color: '#0F172A',
                fontFamily: 'var(--oprino-font-display, "Outfit", sans-serif)',
              }}
            >
              {lifecycleModal.action === 'ROLE_CHANGE' && `Change Role: ${lifecycleModal.newRole}`}
              {lifecycleModal.action === 'SUSPEND' && 'Suspend Team Member'}
              {lifecycleModal.action === 'ACTIVATE' && 'Reactivate Team Member'}
              {lifecycleModal.action === 'REMOVE' && 'Remove Member from Workspace'}
            </h3>

            {lifecycleError && (
              <div
                style={{
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  color: '#DC2626',
                  fontSize: '0.875rem',
                  marginBottom: '1rem',
                }}
              >
                {lifecycleError}
              </div>
            )}

            <p
              style={{
                fontSize: '0.875rem',
                color: '#475569',
                lineHeight: 1.5,
                margin: '0 0 1.25rem',
              }}
            >
              {lifecycleModal.action === 'ROLE_CHANGE' && (
                <>
                  Are you sure you want to change the role of{' '}
                  <strong>{lifecycleModal.member.name}</strong> to{' '}
                  <strong>{lifecycleModal.newRole}</strong>? Their operational permissions and route
                  access will update immediately.
                </>
              )}
              {lifecycleModal.action === 'SUSPEND' && (
                <>
                  Suspending <strong>{lifecycleModal.member.name}</strong> will immediately
                  terminate any active duty-hours GPS tracking sessions, revoke mobile session
                  authorizations, and prevent logging in until reactivated.
                </>
              )}
              {lifecycleModal.action === 'ACTIVATE' && (
                <>
                  Reactivating <strong>{lifecycleModal.member.name}</strong> will restore mobile
                  access and allow starting duty-hours field tracking.
                </>
              )}
              {lifecycleModal.action === 'REMOVE' && (
                <>
                  Removing <strong>{lifecycleModal.member.name}</strong> will revoke their
                  membership, terminate all tracking sessions, and prevent further access to
                  workspace records.
                </>
              )}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() =>
                  setLifecycleModal({ isOpen: false, member: null, action: 'SUSPEND' })
                }
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
                type="button"
                disabled={isLifecycleSubmitting}
                onClick={handleExecuteLifecycleAction}
                style={{
                  padding: '0.65rem 1.5rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor:
                    lifecycleModal.action === 'REMOVE' || lifecycleModal.action === 'SUSPEND'
                      ? '#DC2626'
                      : '#164CFF',
                  color: '#FFFFFF',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: isLifecycleSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isLifecycleSubmitting ? 0.7 : 1,
                }}
              >
                {isLifecycleSubmitting ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

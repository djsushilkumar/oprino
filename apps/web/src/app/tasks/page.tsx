'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { HeaderNav } from '../../components/HeaderNav';
import { Icon } from '../../components/Icon';
import { webApi, getStoredToken, type WorkspaceMember } from '../../lib/api';
import type {
  MeResponse,
  TaskResponse,
  Customer,
  CustomerSite,
  TaskProof,
} from '@oprino/contracts';

export default function TasksPage() {
  const router = useRouter();
  const [context, setContext] = useState<MeResponse | null>(null);
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sitesByCustomer, setSitesByCustomer] = useState<Record<string, CustomerSite[]>>({});
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  // Create Task Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [newDueAt, setNewDueAt] = useState('');
  const [newCustomerId, setNewCustomerId] = useState('');
  const [newSiteId, setNewSiteId] = useState('');
  const [newRequiresPhotoProof, setNewRequiresPhotoProof] = useState(false);
  const [newRequiresSignature, setNewRequiresSignature] = useState(false);
  const [newAssigneeIds, setNewAssigneeIds] = useState<string[]>([]);
  const [newChecklist, setNewChecklist] = useState<string[]>(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Assign Task Modal State
  const [assigningTask, setAssigningTask] = useState<TaskResponse | null>(null);
  const [editAssigneeIds, setEditAssigneeIds] = useState<string[]>([]);
  const [isSubmittingAssign, setIsSubmittingAssign] = useState(false);

  // Verification Review Modal State
  const [reviewTask, setReviewTask] = useState<TaskResponse | null>(null);
  const [taskProofs, setTaskProofs] = useState<TaskProof[]>([]);
  const [isLoadingProofs, setIsLoadingProofs] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [isSubmittingVerification, setIsSubmittingVerification] = useState(false);

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

      const params: Record<string, string> = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (priorityFilter !== 'ALL') params.priority = priorityFilter;

      const [tasksRes, customersRes, membersRes] = await Promise.all([
        webApi.listTasks(params),
        webApi.listCustomers(),
        webApi.listWorkspaceMembers().catch(() => ({ members: [] })),
      ]);
      setTasks(tasksRes.tasks);
      setCustomers(customersRes.customers);
      setMembers(membersRes.members);
    } catch (err: any) {
      if (err.status === 401) {
        router.push('/auth/signin');
      } else {
        setError(err.message || 'Failed to load tasks');
      }
    } finally {
      setIsLoading(false);
    }
  }, [router, statusFilter, priorityFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load sites when customer is selected in Create Task Modal
  useEffect(() => {
    if (!newCustomerId) {
      setNewSiteId('');
      return;
    }
    if (!sitesByCustomer[newCustomerId]) {
      webApi
        .listCustomerSites(newCustomerId)
        .then((res) => {
          setSitesByCustomer((prev) => ({ ...prev, [newCustomerId]: res.sites }));
        })
        .catch((err) => {
          console.error('Failed to load customer sites', err);
        });
    }
  }, [newCustomerId, sitesByCustomer]);

  const handleSignOut = async () => {
    await webApi.signOut();
    router.push('/auth/signin');
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      setIsSubmitting(true);
      setError(null);
      const checklistItems = newChecklist.map((c) => c.trim()).filter(Boolean);

      await webApi.createTask({
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        priority: newPriority,
        dueAt: newDueAt ? new Date(newDueAt).toISOString() : undefined,
        customerId: newCustomerId || undefined,
        siteId: newSiteId || undefined,
        requiresPhotoProof: newRequiresPhotoProof,
        requiresSignature: newRequiresSignature,
        assigneeIds: newAssigneeIds.length > 0 ? newAssigneeIds : undefined,
        checklist: checklistItems.length > 0 ? checklistItems : undefined,
      });

      setIsModalOpen(false);
      setNewTitle('');
      setNewDescription('');
      setNewPriority('MEDIUM');
      setNewDueAt('');
      setNewCustomerId('');
      setNewSiteId('');
      setNewRequiresPhotoProof(false);
      setNewRequiresSignature(false);
      setNewAssigneeIds([]);
      setNewChecklist(['']);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAssignModal = (task: TaskResponse) => {
    setAssigningTask(task);
    setEditAssigneeIds(task.assignees.map((a) => a.id));
  };

  const handleSaveAssignees = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningTask) return;
    try {
      setIsSubmittingAssign(true);
      setError(null);
      await webApi.updateTask(assigningTask.id, {
        assigneeIds: editAssigneeIds,
        version: assigningTask.version,
      });
      setAssigningTask(null);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update assignees');
    } finally {
      setIsSubmittingAssign(false);
    }
  };

  const openReviewModal = async (task: TaskResponse) => {
    setReviewTask(task);
    setVerificationNotes(task.verificationNotes || '');
    setIsLoadingProofs(true);
    setTaskProofs([]);
    try {
      const proofsRes = await webApi.listTaskProofs(task.id);
      setTaskProofs(proofsRes.proofs);
    } catch (err: any) {
      setError(err.message || 'Failed to load task proofs');
    } finally {
      setIsLoadingProofs(false);
    }
  };

  const handleReviewAction = async (action: 'VERIFY' | 'REJECT') => {
    if (!reviewTask) return;
    try {
      setIsSubmittingVerification(true);
      setError(null);
      await webApi.verifyTask(reviewTask.id, {
        action,
        notes: verificationNotes.trim() || undefined,
      });
      setReviewTask(null);
      await loadData();
    } catch (err: any) {
      setError(err.message || `Failed to ${action.toLowerCase()} task`);
    } finally {
      setIsSubmittingVerification(false);
    }
  };

  const canCreate = context?.permissions?.includes('tasks.create') ?? false;
  const canVerify =
    (context?.permissions?.includes('tasks.verify') ||
      context?.permissions?.includes('proofs.verify')) ??
    false;

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; color: string; label: string }> = {
      ASSIGNED: { bg: '#EFF6FF', color: '#1D4ED8', label: 'ASSIGNED' },
      ACCEPTED: { bg: '#F0FDF4', color: '#15803D', label: 'ACCEPTED' },
      EN_ROUTE: { bg: '#FEF3C7', color: '#B45309', label: 'EN ROUTE' },
      ARRIVED: { bg: '#E0E7FF', color: '#4338CA', label: 'ARRIVED' },
      IN_PROGRESS: { bg: '#FDF4FF', color: '#A21CAF', label: 'IN PROGRESS' },
      COMPLETED: { bg: '#ECFDF5', color: '#047857', label: 'COMPLETED' },
      VERIFIED: { bg: '#F1F5F9', color: '#0F172A', label: 'VERIFIED' },
    };
    const s = styles[status] || { bg: '#F1F5F9', color: '#475569', label: status };
    return (
      <span
        style={{
          padding: '0.2rem 0.55rem',
          borderRadius: '4px',
          fontSize: '0.75rem',
          fontWeight: 700,
          backgroundColor: s.bg,
          color: s.color,
          letterSpacing: '0.02em',
        }}
      >
        {s.label}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      LOW: '#64748B',
      MEDIUM: '#2563EB',
      HIGH: '#D97706',
      URGENT: '#DC2626',
    };
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.3rem',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: styles[priority] || '#64748B',
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: styles[priority] || '#64748B',
          }}
        />
        {priority}
      </span>
    );
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F8FAFC',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <HeaderNav context={context} onSignOut={handleSignOut} />

      <main
        style={{
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto',
          padding: '2rem 1.5rem',
          flex: 1,
        }}
      >
        {/* Top Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                color: '#0F172A',
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              Tasks & Proof of Work
            </h1>
            <p style={{ color: '#64748B', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
              Operational work dispatch, customer sites, field proofs, and manager verification.
            </p>
          </div>

          {canCreate && (
            <button
              onClick={() => setIsModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#164CFF',
                color: '#FFFFFF',
                padding: '0.625rem 1.25rem',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(22, 76, 255, 0.2)',
              }}
            >
              + Create Task
            </button>
          )}
        </div>

        {error && (
          <div
            style={{
              padding: '0.875rem 1.25rem',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: '8px',
              color: '#991B1B',
              fontSize: '0.875rem',
              marginBottom: '1.5rem',
            }}
          >
            {error}
          </div>
        )}

        {/* Filters */}
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '1.5rem',
            padding: '1rem',
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569' }}>
              Status:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '0.8125rem',
                backgroundColor: '#FFFFFF',
                color: '#0F172A',
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="EN_ROUTE">En Route</option>
              <option value="ARRIVED">Arrived</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed (Pending Verification)</option>
              <option value="VERIFIED">Verified</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569' }}>
              Priority:
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '0.8125rem',
                backgroundColor: '#FFFFFF',
                color: '#0F172A',
              }}
            >
              <option value="ALL">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>

        {/* Task Table */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            overflow: 'hidden',
          }}
        >
          {isLoading ? (
            <div
              style={{
                padding: '3rem',
                textAlign: 'center',
                color: '#64748B',
                fontSize: '0.875rem',
              }}
            >
              Loading tasks...
            </div>
          ) : tasks.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
              <p style={{ margin: 0, fontWeight: 600 }}>No tasks found</p>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem' }}>
                {canCreate
                  ? 'Create your first task to start operations.'
                  : 'No tasks assigned to your view.'}
              </p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th
                    style={{
                      padding: '0.75rem 1rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#64748B',
                      textTransform: 'uppercase',
                    }}
                  >
                    Task / Customer
                  </th>
                  <th
                    style={{
                      padding: '0.75rem 1rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#64748B',
                      textTransform: 'uppercase',
                    }}
                  >
                    Requirements
                  </th>
                  <th
                    style={{
                      padding: '0.75rem 1rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#64748B',
                      textTransform: 'uppercase',
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      padding: '0.75rem 1rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#64748B',
                      textTransform: 'uppercase',
                    }}
                  >
                    Priority
                  </th>
                  <th
                    style={{
                      padding: '0.75rem 1rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#64748B',
                      textTransform: 'uppercase',
                    }}
                  >
                    Assignees
                  </th>
                  <th
                    style={{
                      padding: '0.75rem 1rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#64748B',
                      textTransform: 'uppercase',
                    }}
                  >
                    Due Date
                  </th>
                  <th
                    style={{
                      padding: '0.75rem 1rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#64748B',
                      textTransform: 'uppercase',
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '1rem', maxWidth: '280px' }}>
                      <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.875rem' }}>
                        {task.title}
                      </div>
                      {task.description && (
                        <div
                          style={{
                            color: '#64748B',
                            fontSize: '0.8125rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {task.description}
                        </div>
                      )}
                      {(task.customerName || task.siteName) && (
                        <div
                          style={{
                            marginTop: '0.35rem',
                            fontSize: '0.75rem',
                            color: '#164CFF',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                          }}
                        >
                          <span
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <Icon name="building" size={12} color="#164CFF" />
                            {task.customerName || 'Customer'}
                          </span>
                          {task.siteName && (
                            <span
                              style={{
                                color: '#64748B',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                              }}
                            >
                              • <Icon name="pin" size={12} color="#64748B" /> {task.siteName}
                            </span>
                          )}
                        </div>
                      )}
                      {task.status === 'VERIFIED' && (
                        <div
                          style={{
                            marginTop: '0.25rem',
                            fontSize: '0.75rem',
                            color: '#059669',
                            fontWeight: 500,
                          }}
                        >
                          ✓ Verified {task.verifierName ? `by ${task.verifierName}` : ''}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {task.requiresPhotoProof && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              fontSize: '0.7rem',
                              padding: '0.15rem 0.4rem',
                              backgroundColor: '#F0FDF4',
                              color: '#166534',
                              borderRadius: '4px',
                              fontWeight: 600,
                              width: 'fit-content',
                            }}
                          >
                            <Icon name="camera" size={12} color="#166534" /> Photo Proof
                          </span>
                        )}
                        {task.requiresSignature && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              fontSize: '0.7rem',
                              padding: '0.15rem 0.4rem',
                              backgroundColor: '#EFF6FF',
                              color: '#1E40AF',
                              borderRadius: '4px',
                              fontWeight: 600,
                              width: 'fit-content',
                            }}
                          >
                            <Icon name="signature" size={12} color="#1E40AF" /> Signature
                          </span>
                        )}
                        {!task.requiresPhotoProof && !task.requiresSignature && (
                          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Standard</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>{getStatusBadge(task.status)}</td>
                    <td style={{ padding: '1rem' }}>{getPriorityBadge(task.priority)}</td>
                    <td style={{ padding: '1rem' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          flexWrap: 'wrap',
                        }}
                      >
                        {task.assignees.length === 0 ? (
                          <span style={{ color: '#94A3B8', fontSize: '0.8125rem' }}>
                            Unassigned
                          </span>
                        ) : (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                            {task.assignees.map((a) => (
                              <span
                                key={a.id}
                                style={{
                                  padding: '0.15rem 0.5rem',
                                  backgroundColor: '#F1F5F9',
                                  color: '#334155',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  fontWeight: 500,
                                }}
                              >
                                {a.name}
                              </span>
                            ))}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => openAssignModal(task)}
                          title="Assign or edit team members"
                          style={{
                            padding: '0.15rem 0.45rem',
                            border: '1px solid #CBD5E1',
                            borderRadius: '4px',
                            backgroundColor: '#FFFFFF',
                            color: '#2563EB',
                            fontSize: '0.7rem',
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          {task.assignees.length === 0 ? '+ Assign' : 'Edit'}
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.8125rem', color: '#64748B' }}>
                      {task.dueAt ? new Date(task.dueAt).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {task.status === 'COMPLETED' && canVerify && (
                        <button
                          onClick={() => openReviewModal(task)}
                          style={{
                            padding: '0.4rem 0.85rem',
                            backgroundColor: '#047857',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 1px 2px rgba(4, 120, 87, 0.2)',
                          }}
                        >
                          Review & Verify
                        </button>
                      )}
                      {task.status === 'VERIFIED' && (
                        <button
                          onClick={() => openReviewModal(task)}
                          style={{
                            padding: '0.35rem 0.75rem',
                            backgroundColor: '#F1F5F9',
                            color: '#334155',
                            border: '1px solid #CBD5E1',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          View Proofs
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Create Task Modal */}
        {isModalOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
              padding: '1rem',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                maxWidth: '560px',
                width: '100%',
                padding: '2rem',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                maxHeight: '90vh',
                overflowY: 'auto',
              }}
            >
              <h2
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  margin: '0 0 1rem 0',
                  color: '#0F172A',
                }}
              >
                Create New Task
              </h2>

              <form onSubmit={handleCreateTask}>
                <div style={{ marginBottom: '1rem' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: '#334155',
                      marginBottom: '0.25rem',
                    }}
                  >
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. HVAC Maintenance Unit 4B"
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: '#334155',
                      marginBottom: '0.25rem',
                    }}
                  >
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Provide operational details..."
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    marginBottom: '1rem',
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: '#334155',
                        marginBottom: '0.25rem',
                      }}
                    >
                      Customer
                    </label>
                    <select
                      value={newCustomerId}
                      onChange={(e) => setNewCustomerId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        border: '1px solid #CBD5E1',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        boxSizing: 'border-box',
                        backgroundColor: '#FFFFFF',
                      }}
                    >
                      <option value="">None (Internal)</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: '#334155',
                        marginBottom: '0.25rem',
                      }}
                    >
                      Customer Site
                    </label>
                    <select
                      value={newSiteId}
                      onChange={(e) => setNewSiteId(e.target.value)}
                      disabled={!newCustomerId || !sitesByCustomer[newCustomerId]?.length}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        border: '1px solid #CBD5E1',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        boxSizing: 'border-box',
                        backgroundColor: !newCustomerId ? '#F1F5F9' : '#FFFFFF',
                      }}
                    >
                      <option value="">None</option>
                      {newCustomerId &&
                        sitesByCustomer[newCustomerId]?.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    marginBottom: '1rem',
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: '#334155',
                        marginBottom: '0.25rem',
                      }}
                    >
                      Priority
                    </label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value as any)}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        border: '1px solid #CBD5E1',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        boxSizing: 'border-box',
                        backgroundColor: '#FFFFFF',
                      }}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: '#334155',
                        marginBottom: '0.25rem',
                      }}
                    >
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={newDueAt}
                      onChange={(e) => setNewDueAt(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        border: '1px solid #CBD5E1',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* Assign Team Members Selector */}
                <div style={{ marginBottom: '1rem' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: '#334155',
                      marginBottom: '0.25rem',
                    }}
                  >
                    Assign Team Members
                  </label>
                  {members.length === 0 ? (
                    <div style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>
                      No team members available in this workspace.
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.35rem',
                        maxHeight: '110px',
                        overflowY: 'auto',
                        padding: '0.5rem',
                        border: '1px solid #CBD5E1',
                        borderRadius: '6px',
                      }}
                    >
                      {members.map((m) => {
                        const isSelected = newAssigneeIds.includes(m.id);
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setNewAssigneeIds(newAssigneeIds.filter((id) => id !== m.id));
                              } else {
                                setNewAssigneeIds([...newAssigneeIds, m.id]);
                              }
                            }}
                            style={{
                              padding: '0.25rem 0.55rem',
                              borderRadius: '16px',
                              border: isSelected ? '1px solid #2563EB' : '1px solid #CBD5E1',
                              backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                              color: isSelected ? '#1D4ED8' : '#334155',
                              fontSize: '0.75rem',
                              fontWeight: isSelected ? 600 : 500,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                            }}
                          >
                            <span>{isSelected ? '✓' : '+'}</span>
                            <span>{m.name}</span>
                            <span style={{ fontSize: '0.65rem', color: '#94A3B8' }}>
                              ({m.roleName})
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Proof Requirements Toggles */}
                <div
                  style={{
                    marginBottom: '1.25rem',
                    padding: '0.75rem',
                    backgroundColor: '#F8FAFC',
                    borderRadius: '6px',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      color: '#334155',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Proof of Work Requirements
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.8125rem',
                        color: '#1E293B',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={newRequiresPhotoProof}
                        onChange={(e) => setNewRequiresPhotoProof(e.target.checked)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      <span
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <Icon name="camera" size={14} color="#0F172A" /> Require Geotagged Photo
                        Proof
                      </span>
                    </label>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.8125rem',
                        color: '#1E293B',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={newRequiresSignature}
                        onChange={(e) => setNewRequiresSignature(e.target.checked)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      <span>✍️ Require On-Glass Customer Signature</span>
                    </label>
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: '#334155',
                      marginBottom: '0.25rem',
                    }}
                  >
                    Checklist Items (All must be completed prior to task close)
                  </label>
                  {newChecklist.map((item, index) => (
                    <input
                      key={index}
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const copy = [...newChecklist];
                        copy[index] = e.target.value;
                        setNewChecklist(copy);
                      }}
                      placeholder={`Checklist item #${index + 1}`}
                      style={{
                        width: '100%',
                        padding: '0.4rem 0.75rem',
                        border: '1px solid #CBD5E1',
                        borderRadius: '6px',
                        fontSize: '0.8125rem',
                        boxSizing: 'border-box',
                        marginBottom: '0.35rem',
                      }}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => setNewChecklist([...newChecklist, ''])}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#164CFF',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: '0.2rem 0',
                    }}
                  >
                    + Add checklist item
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#475569',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      padding: '0.5rem 1.25rem',
                      backgroundColor: '#164CFF',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#FFFFFF',
                      cursor: 'pointer',
                    }}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Verification Review Modal */}
        {reviewTask && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 110,
              padding: '1.5rem',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                maxWidth: '680px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '2rem',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1.25rem',
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
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        backgroundColor: reviewTask.status === 'VERIFIED' ? '#ECFDF5' : '#FEF3C7',
                        color: reviewTask.status === 'VERIFIED' ? '#047857' : '#B45309',
                      }}
                    >
                      {reviewTask.status}
                    </span>
                    <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>
                      ID: {reviewTask.id.slice(0, 8)}...
                    </span>
                  </div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    {reviewTask.title}
                  </h2>
                  {reviewTask.customerName && (
                    <p
                      style={{
                        margin: '0.25rem 0 0 0',
                        fontSize: '0.8125rem',
                        color: '#475569',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                      }}
                    >
                      <span
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <Icon name="building" size={13} color="#475569" /> {reviewTask.customerName}
                      </span>
                      {reviewTask.siteName && (
                        <span
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          • <Icon name="pin" size={13} color="#475569" /> {reviewTask.siteName}
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setReviewTask(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.25rem',
                    color: '#94A3B8',
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Requirements & Checklist Summary */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  marginBottom: '1.5rem',
                  backgroundColor: '#F8FAFC',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#64748B',
                      textTransform: 'uppercase',
                    }}
                  >
                    Proof Requirements
                  </div>
                  <div style={{ marginTop: '0.35rem', fontSize: '0.8125rem', color: '#1E293B' }}>
                    <div>
                      Photo Proof: {reviewTask.requiresPhotoProof ? '✅ Required' : 'Optional'}
                    </div>
                    <div>
                      Signature: {reviewTask.requiresSignature ? '✅ Required' : 'Optional'}
                    </div>
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#64748B',
                      textTransform: 'uppercase',
                    }}
                  >
                    Verification Details
                  </div>
                  <div style={{ marginTop: '0.35rem', fontSize: '0.8125rem', color: '#1E293B' }}>
                    <div>Verifier: {reviewTask.verifierName || 'None'}</div>
                    <div>
                      Date:{' '}
                      {reviewTask.verifiedAt
                        ? new Date(reviewTask.verifiedAt).toLocaleString()
                        : 'Pending'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Proofs Section */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3
                  style={{
                    fontSize: '0.9375rem',
                    fontWeight: 700,
                    color: '#0F172A',
                    marginBottom: '0.75rem',
                  }}
                >
                  Submitted Proofs of Work ({taskProofs.length})
                </h3>

                {isLoadingProofs ? (
                  <div
                    style={{
                      padding: '2rem',
                      textAlign: 'center',
                      color: '#64748B',
                      fontSize: '0.875rem',
                    }}
                  >
                    Loading uploaded proofs...
                  </div>
                ) : taskProofs.length === 0 ? (
                  <div
                    style={{
                      padding: '1.5rem',
                      backgroundColor: '#F1F5F9',
                      borderRadius: '8px',
                      textAlign: 'center',
                      color: '#64748B',
                      fontSize: '0.8125rem',
                    }}
                  >
                    No proofs recorded for this task.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {taskProofs.map((p) => (
                      <div
                        key={p.id}
                        style={{
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px',
                          padding: '1rem',
                          backgroundColor: '#FFFFFF',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '0.5rem',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              backgroundColor: p.proofType === 'SIGNATURE' ? '#EFF6FF' : '#F0FDF4',
                              color: p.proofType === 'SIGNATURE' ? '#1D4ED8' : '#15803D',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                            }}
                          >
                            <Icon
                              name={p.proofType === 'SIGNATURE' ? 'signature' : 'camera'}
                              size={12}
                              color={p.proofType === 'SIGNATURE' ? '#1D4ED8' : '#15803D'}
                            />
                            <span>
                              {p.proofType === 'SIGNATURE' ? 'ON-GLASS SIGNATURE' : 'PHOTO PROOF'}
                            </span>
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                            {new Date(p.createdAt).toLocaleString()}
                          </span>
                        </div>

                        {p.proofType === 'SIGNATURE' && (
                          <div
                            style={{
                              backgroundColor: '#F8FAFC',
                              padding: '0.75rem',
                              borderRadius: '6px',
                              border: '1px solid #E2E8F0',
                              marginBottom: '0.5rem',
                            }}
                          >
                            <div
                              style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0F172A' }}
                            >
                              Signer: {p.signerName || 'Customer Representative'}
                            </div>
                            {p.signerPhone && (
                              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                                Phone: {p.signerPhone}
                              </div>
                            )}
                            <div
                              style={{
                                marginTop: '0.5rem',
                                padding: '1rem',
                                backgroundColor: '#FFFFFF',
                                border: '1px dashed #CBD5E1',
                                borderRadius: '4px',
                                textAlign: 'center',
                                fontStyle: 'italic',
                                color: '#164CFF',
                                fontFamily: 'cursive',
                                fontSize: '1.25rem',
                              }}
                            >
                              {p.signerName || 'Digitally Signed On-Glass'}
                            </div>
                          </div>
                        )}

                        {p.proofType === 'PHOTO' && (
                          <div style={{ marginBottom: '0.5rem' }}>
                            <div
                              style={{
                                width: '100%',
                                height: '200px',
                                backgroundColor: '#0F172A',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#94A3B8',
                                fontSize: '0.8125rem',
                                overflow: 'hidden',
                                position: 'relative',
                              }}
                            >
                              {p.fileUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={p.fileUrl}
                                  alt="Proof thumbnail"
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              ) : (
                                <span>📷 Geotagged Field Photo ({p.fileKey})</span>
                              )}
                              {p.watermarkMetadata && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    bottom: '8px',
                                    left: '8px',
                                    backgroundColor: 'rgba(0,0,0,0.7)',
                                    color: '#FFFFFF',
                                    fontSize: '0.7rem',
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '4px',
                                    fontFamily: 'monospace',
                                  }}
                                >
                                  GPS: {String((p.watermarkMetadata as any).latitude ?? '')},{' '}
                                  {String((p.watermarkMetadata as any).longitude ?? '')}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {p.notes && (
                          <div
                            style={{ fontSize: '0.8125rem', color: '#475569', marginTop: '0.5rem' }}
                          >
                            <span style={{ fontWeight: 600 }}>Notes: </span>
                            {p.notes}
                          </div>
                        )}
                        <div
                          style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.25rem' }}
                        >
                          Uploaded by: {p.userName || p.userId}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Manager Verification Actions */}
              {reviewTask.status === 'COMPLETED' && canVerify && (
                <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '1.25rem' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: '#334155',
                      marginBottom: '0.25rem',
                    }}
                  >
                    Manager Verification Review Notes
                  </label>
                  <textarea
                    rows={2}
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    placeholder="Enter approval feedback or rejection reasons..."
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box',
                      marginBottom: '1rem',
                    }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button
                      type="button"
                      disabled={isSubmittingVerification}
                      onClick={() => handleReviewAction('REJECT')}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#FEF2F2',
                        color: '#DC2626',
                        border: '1px solid #FCA5A5',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {isSubmittingVerification
                        ? 'Processing...'
                        : 'Reject Proofs (Return to In Progress)'}
                    </button>
                    <button
                      type="button"
                      disabled={isSubmittingVerification}
                      onClick={() => handleReviewAction('VERIFY')}
                      style={{
                        padding: '0.5rem 1.25rem',
                        backgroundColor: '#047857',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(4, 120, 87, 0.25)',
                      }}
                    >
                      {isSubmittingVerification ? 'Verifying...' : 'Approve & Mark Verified'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Assign / Reassign Task Modal */}
        {assigningTask && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 110,
              padding: '1.5rem',
            }}
          >
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                maxWidth: '480px',
                width: '100%',
                padding: '2rem',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              }}
            >
              <h3
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  margin: '0 0 0.5rem 0',
                  color: '#0F172A',
                }}
              >
                Assign Task: {assigningTask.title}
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0 0 1rem 0' }}>
                Select workspace members to assign to this task.
              </p>
              <form onSubmit={handleSaveAssignees}>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.4rem',
                    maxHeight: '180px',
                    overflowY: 'auto',
                    padding: '0.6rem',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    marginBottom: '1.25rem',
                  }}
                >
                  {members.length === 0 ? (
                    <div style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>
                      No members available in this workspace.
                    </div>
                  ) : (
                    members.map((m) => {
                      const isSelected = editAssigneeIds.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setEditAssigneeIds(editAssigneeIds.filter((id) => id !== m.id));
                            } else {
                              setEditAssigneeIds([...editAssigneeIds, m.id]);
                            }
                          }}
                          style={{
                            padding: '0.3rem 0.65rem',
                            borderRadius: '16px',
                            border: isSelected ? '1px solid #2563EB' : '1px solid #CBD5E1',
                            backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                            color: isSelected ? '#1D4ED8' : '#334155',
                            fontSize: '0.8125rem',
                            fontWeight: isSelected ? 600 : 500,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                        >
                          <span>{isSelected ? '✓' : '+'}</span>
                          <span>{m.name}</span>
                          <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                            ({m.roleName})
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setAssigningTask(null)}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      backgroundColor: '#FFFFFF',
                      color: '#475569',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingAssign}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: '#2563EB',
                      color: '#FFFFFF',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: isSubmittingAssign ? 'not-allowed' : 'pointer',
                      opacity: isSubmittingAssign ? 0.7 : 1,
                    }}
                  >
                    {isSubmittingAssign ? 'Saving...' : 'Save Assignments'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

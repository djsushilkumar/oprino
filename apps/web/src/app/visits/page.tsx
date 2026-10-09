'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { HeaderNav } from '../../components/HeaderNav';
import { webApi, getStoredToken } from '../../lib/api';
import type {
  MeResponse,
  Visit,
  Customer,
  CustomerSite,
  TaskResponse,
} from '@oprino/contracts';

export default function VisitsPage() {
  const router = useRouter();
  const [context, setContext] = useState<MeResponse | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sitesByCustomer, setSitesByCustomer] = useState<Record<string, CustomerSite[]>>({});
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');

  // Schedule Visit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [plannedTime, setPlannedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Phase 04: Route Sequencing State
  const [isReordering, setIsReordering] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [reorderSuccess, setReorderSuccess] = useState<string | null>(null);

  const moveVisit = (index: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= visits.length) return;
    const updated = [...visits];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setVisits(updated);
  };

  const handleSaveRouteOrder = async () => {
    if (visits.length === 0) return;
    const targetUserId = visits[0]?.userId || context?.user?.id;
    if (!targetUserId) return;
    const targetDate = dateFilter || new Date().toISOString().slice(0, 10);

    try {
      setIsSavingOrder(true);
      setError(null);
      await webApi.reorderVisits({
        userId: targetUserId,
        routeDate: targetDate,
        orderedVisitIds: visits.map((v) => v.id),
      });
      setReorderSuccess('Route sequence saved successfully!');
      setTimeout(() => setReorderSuccess(null), 3500);
      setIsReordering(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to reorder visits');
    } finally {
      setIsSavingOrder(false);
    }
  };

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

      const filters: Record<string, string> = {};
      if (statusFilter !== 'ALL') filters.status = statusFilter;
      if (dateFilter) filters.date = dateFilter;

      const [visitsRes, customersRes, tasksRes] = await Promise.all([
        webApi.listVisits(filters),
        webApi.listCustomers(),
        webApi.listTasks({}),
      ]);

      setVisits(visitsRes.visits);
      setCustomers(customersRes.customers);
      setTasks(tasksRes.tasks);
    } catch (err: any) {
      if (err.status === 401) {
        router.push('/auth/signin');
      } else {
        setError(err.message || 'Failed to load visits');
      }
    } finally {
      setIsLoading(false);
    }
  }, [router, statusFilter, dateFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load sites when customer is selected in modal
  useEffect(() => {
    if (!selectedCustomerId) return;
    if (sitesByCustomer[selectedCustomerId]) return;

    webApi.listCustomerSites(selectedCustomerId).then((res) => {
      setSitesByCustomer((prev) => ({ ...prev, [selectedCustomerId]: res.sites }));
    });
  }, [selectedCustomerId, sitesByCustomer]);

  const handleSignOut = async () => {
    await webApi.signOut();
    router.push('/auth/signin');
  };

  const handleScheduleVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) return;

    try {
      setIsSubmitting(true);
      setError(null);

      await webApi.createVisit({
        customerId: selectedCustomerId,
        siteId: selectedSiteId || undefined,
        taskId: selectedTaskId || undefined,
        plannedAt: plannedTime ? new Date(plannedTime).toISOString() : undefined,
        notes: notes.trim() || undefined,
      });

      setIsModalOpen(false);
      setSelectedCustomerId('');
      setSelectedSiteId('');
      setSelectedTaskId('');
      setPlannedTime('');
      setNotes('');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to schedule visit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CHECKED_OUT':
        return { bg: '#D1FAE5', color: '#065F46', text: 'Checked Out' };
      case 'CHECKED_IN':
        return { bg: '#DBEAFE', color: '#1E40AF', text: 'Checked In (Active)' };
      case 'CANCELLED':
        return { bg: '#FEE2E2', color: '#991B1B', text: 'Cancelled' };
      default:
        return { bg: '#F1F5F9', color: '#475569', text: 'Planned' };
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
      <HeaderNav context={context} onSignOut={handleSignOut} />

      <main style={{ flex: 1, padding: '2rem', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Field Visits & Dispatch
            </h1>
            <p style={{ color: '#64748B', marginTop: '0.25rem', fontSize: '0.875rem' }}>
              Schedule on-site customer visits, track real-time GPS check-ins, and inspect durations
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              padding: '0.625rem 1.25rem',
              backgroundColor: '#4F46E5',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
            }}
          >
            <span>+</span> Schedule Visit
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0.25rem' }}>
            {['ALL', 'PLANNED', 'CHECKED_IN', 'CHECKED_OUT'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '0.35rem 0.75rem',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  backgroundColor: statusFilter === st ? '#4F46E5' : 'transparent',
                  color: statusFilter === st ? '#FFFFFF' : '#64748B',
                  cursor: 'pointer',
                }}
              >
                {st === 'ALL' ? 'All Visits' : st.replace('_', ' ')}
              </button>
            ))}
          </div>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{
              padding: '0.45rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '0.8125rem',
              color: '#334155',
              backgroundColor: '#FFFFFF',
            }}
          />

          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748B',
                fontSize: '0.75rem',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Clear Date
            </button>
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={() => setIsReordering(!isReordering)}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                border: isReordering ? '1px solid #4F46E5' : '1px solid #CBD5E1',
                fontSize: '0.8125rem',
                fontWeight: 600,
                backgroundColor: isReordering ? '#EEF2FF' : '#FFFFFF',
                color: isReordering ? '#4F46E5' : '#475569',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <span>⇅</span> {isReordering ? 'Exit Sequencing' : 'Reorder Stops'}
            </button>

            {isReordering && (
              <button
                onClick={handleSaveRouteOrder}
                disabled={isSavingOrder || visits.length === 0}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                  cursor: isSavingOrder ? 'wait' : 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
              >
                {isSavingOrder ? 'Saving...' : 'Save Route Order'}
              </button>
            )}
          </div>
        </div>

        {reorderSuccess && (
          <div
            style={{
              padding: '0.875rem 1rem',
              backgroundColor: '#ECFDF5',
              border: '1px solid #A7F3D0',
              borderRadius: '8px',
              color: '#065F46',
              marginBottom: '1.5rem',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            ✓ {reorderSuccess}
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: '8px',
              color: '#991B1B',
              marginBottom: '1.5rem',
              fontSize: '0.875rem',
            }}
          >
            {error}
          </div>
        )}

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: '#64748B' }}>
            Loading field visits...
          </div>
        ) : visits.length === 0 ? (
          <div
            style={{
              padding: '4rem 2rem',
              textAlign: 'center',
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              border: '1px dashed #CBD5E1',
            }}
          >
            <p style={{ fontSize: '1rem', color: '#64748B', marginBottom: '1rem' }}>
              No field visits match the selected filter.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#EEF2FF',
                color: '#4F46E5',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Dispatch First Visit
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
            {visits.map((visit, index) => {
              const badge = getStatusBadge(visit.status);

              return (
                <div
                  key={visit.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    padding: '1.5rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    {/* Badge, Stop Sequence & Controls */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 800,
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            backgroundColor: '#F1F5F9',
                            color: '#334155',
                            border: '1px solid #CBD5E1',
                          }}
                        >
                          Stop #{visit.sequenceOrder ?? index + 1}
                        </span>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.6rem',
                            borderRadius: '9999px',
                            backgroundColor: badge.bg,
                            color: badge.color,
                          }}
                        >
                          {badge.text}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {isReordering && (
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            <button
                              onClick={() => moveVisit(index, 'UP')}
                              disabled={index === 0}
                              style={{
                                padding: '0.2rem 0.45rem',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                borderRadius: '4px',
                                border: '1px solid #CBD5E1',
                                backgroundColor: index === 0 ? '#F8FAFC' : '#FFFFFF',
                                color: index === 0 ? '#CBD5E1' : '#334155',
                                cursor: index === 0 ? 'not-allowed' : 'pointer',
                              }}
                              title="Move stop earlier"
                            >
                              ▲
                            </button>
                            <button
                              onClick={() => moveVisit(index, 'DOWN')}
                              disabled={index === visits.length - 1}
                              style={{
                                padding: '0.2rem 0.45rem',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                borderRadius: '4px',
                                border: '1px solid #CBD5E1',
                                backgroundColor: index === visits.length - 1 ? '#F8FAFC' : '#FFFFFF',
                                color: index === visits.length - 1 ? '#CBD5E1' : '#334155',
                                cursor: index === visits.length - 1 ? 'not-allowed' : 'pointer',
                              }}
                              title="Move stop later"
                            >
                              ▼
                            </button>
                          </div>
                        )}

                        {visit.plannedAt && (
                          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                            📅 {new Date(visit.plannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Customer & Site */}
                    <div style={{ fontWeight: 700, fontSize: '1.0625rem', color: '#0F172A', marginBottom: '0.25rem' }}>
                      {visit.customerName || 'Customer Visit'}
                    </div>
                    {visit.siteName && (
                      <div style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem' }}>
                        📍 {visit.siteName}
                      </div>
                    )}

                    {visit.taskTitle && (
                      <div style={{ fontSize: '0.8125rem', color: '#4F46E5', backgroundColor: '#EEF2FF', padding: '0.25rem 0.5rem', borderRadius: '4px', display: 'inline-block', marginBottom: '0.75rem' }}>
                        Task: {visit.taskTitle}
                      </div>
                    )}

                    {visit.notes && (
                      <div style={{ fontSize: '0.8125rem', color: '#64748B', backgroundColor: '#F8FAFC', padding: '0.5rem', borderRadius: '6px', marginBottom: '0.75rem', fontStyle: 'italic' }}>
                        "{visit.notes}"
                      </div>
                    )}
                  </div>

                  {/* Visit Footer: Tech & GPS Stats */}
                  <div style={{ paddingTop: '0.75rem', borderTop: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748B', marginBottom: '0.25rem' }}>
                      <span>Technician:</span>
                      <span style={{ fontWeight: 600, color: '#334155' }}>{visit.userName || 'Assigned Tech'}</span>
                    </div>

                    {visit.checkInTime && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748B', marginBottom: '0.25rem' }}>
                        <span>Check-In:</span>
                        <span style={{ fontWeight: 600, color: '#1E40AF' }}>
                          {new Date(visit.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {visit.checkInLatitude != null && ` (${visit.checkInLatitude.toFixed(3)}, ${visit.checkInLongitude?.toFixed(3)})`}
                        </span>
                      </div>
                    )}

                    {visit.checkOutTime && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748B' }}>
                        <span>Duration:</span>
                        <span style={{ fontWeight: 700, color: '#065F46' }}>
                          {visit.durationMinutes} min
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Schedule Visit Modal */}
        {isModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
              backdropFilter: 'blur(2px)',
            }}
          >
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '520px',
                padding: '2rem',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              }}
            >
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginTop: 0 }}>
                Schedule Field Visit
              </h2>
              <form onSubmit={handleScheduleVisit}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                    Select Customer *
                  </label>
                  <select
                    required
                    value={selectedCustomerId}
                    onChange={(e) => {
                      setSelectedCustomerId(e.target.value);
                      setSelectedSiteId('');
                    }}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
                  >
                    <option value="">-- Choose Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.companyName ? `(${c.companyName})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                    Select Facility / Site
                  </label>
                  <select
                    value={selectedSiteId}
                    onChange={(e) => setSelectedSiteId(e.target.value)}
                    disabled={!selectedCustomerId}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
                  >
                    <option value="">-- Choose Site (Optional) --</option>
                    {(sitesByCustomer[selectedCustomerId] || []).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.address})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                    Link Operational Task (Optional)
                  </label>
                  <select
                    value={selectedTaskId}
                    onChange={(e) => setSelectedTaskId(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
                  >
                    <option value="">-- No Linked Task --</option>
                    {tasks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title} [{t.status}]
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                    Scheduled Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={plannedTime}
                    onChange={(e) => setPlannedTime(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                    Visit Instructions / Notes
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Check in with security gate, request badge for chiller plant..."
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={{ padding: '0.5rem 1rem', backgroundColor: '#F1F5F9', border: 'none', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{ padding: '0.5rem 1.25rem', backgroundColor: '#4F46E5', border: 'none', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 600, color: '#FFFFFF', cursor: 'pointer' }}
                  >
                    {isSubmitting ? 'Scheduling...' : 'Dispatch Visit'}
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

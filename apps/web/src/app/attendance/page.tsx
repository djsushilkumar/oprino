'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { HeaderNav } from '../../components/HeaderNav';
import { Icon } from '../../components/Icon';
import { webApi, getStoredToken } from '../../lib/api';
import type { MeResponse, TeamAttendanceResponse, AttendanceSessionResponse } from '@oprino/contracts';

export default function AttendancePage() {
  const router = useRouter();
  const [context, setContext] = useState<MeResponse | null>(null);
  const [teamData, setTeamData] = useState<TeamAttendanceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selfie Preview Modal State (BLK-004)
  const [previewSession, setPreviewSession] = useState<AttendanceSessionResponse | null>(null);

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

      // If user has team attendance permission, load team view; otherwise load personal history
      const hasTeamRead = meRes.permissions?.includes('attendance.team.read') ?? false;
      if (hasTeamRead) {
        const teamRes = await webApi.getTeamAttendance();
        setTeamData(teamRes);
      } else {
        const [currentRes, historyRes] = await Promise.all([
          webApi.getCurrentAttendance(),
          webApi.getAttendanceHistory(),
        ]);
        setTeamData({
          onDutyCount: currentRes.dutyState === 'ON_DUTY' ? 1 : 0,
          offDutyCount: historyRes.sessions.length,
          activeSessions: currentRes.activeSession ? [currentRes.activeSession] : [],
          history: historyRes.sessions,
        });
      }
    } catch (err: any) {
      if (err.status === 401) {
        router.push('/auth/signin');
      } else {
        setError(err.message || 'Failed to load attendance data');
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

  const formatDuration = (mins?: number | null) => {
    if (mins === undefined || mins === null) return '—';
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hours === 0) return `${remainingMins}m`;
    return `${hours}h ${remainingMins}m`;
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
      <HeaderNav context={context} onSignOut={handleSignOut} />

      <main style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '2rem 1.5rem', flex: 1 }}>
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
              Attendance & Duty Hours
            </h1>
            <p style={{ color: '#64748B', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
              Real-time duty visibility, shifts, verified selfies, and duty-hours GPS proof.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => router.push('/settings')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#EEF2FF',
                border: '1px solid #C7D2FE',
                borderRadius: '6px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: '#4338CA',
                cursor: 'pointer',
              }}
            >
              Policy Settings
            </button>
            <button
              onClick={() => loadData()}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: '#334155',
                cursor: 'pointer',
              }}
            >
              Refresh
            </button>
          </div>
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

        {/* Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          <div style={{ padding: '1.25rem', backgroundColor: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
              Currently On Duty
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10B981', marginTop: '0.5rem' }}>
              {teamData?.onDutyCount ?? 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.25rem' }}>Active staff on shift</div>
          </div>

          <div style={{ padding: '1.25rem', backgroundColor: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
              Punched Out (Recent)
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#475569', marginTop: '0.5rem' }}>
              {teamData?.offDutyCount ?? 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.25rem' }}>Completed shifts recorded</div>
          </div>
        </div>

        {/* Section 1: Active On-Duty Staff */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0F172A', marginBottom: '1rem' }}>
            Currently On Duty ({teamData?.activeSessions.length ?? 0})
          </h2>

          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            {isLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B', fontSize: '0.875rem' }}>
                Loading attendance...
              </div>
            ) : teamData?.activeSessions.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B', fontSize: '0.875rem' }}>
                No workers currently on duty in this workspace.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Worker</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Shift</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Punch In Time</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Verification Evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {teamData?.activeSessions.map((session: AttendanceSessionResponse) => {
                    const hasSelfie = !!session.selfieMediaKey;
                    const hasGps = session.punchInLatitude !== null && session.punchInLatitude !== undefined;

                    return (
                      <tr key={session.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.875rem' }}>{session.userName || 'Employee'}</div>
                          <div style={{ color: '#64748B', fontSize: '0.75rem' }}>{session.userEmail}</div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ padding: '0.2rem 0.5rem', backgroundColor: '#ECFDF5', color: '#059669', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                            ON DUTY
                          </span>
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.8125rem', color: '#475569' }}>
                          {session.shiftName || 'General Shift'}
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.8125rem', color: '#334155' }}>
                          {new Date(session.punchInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(session.punchInTime).toLocaleDateString()})
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {hasSelfie && (
                              <button
                                onClick={() => setPreviewSession(session)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  padding: '0.25rem 0.6rem',
                                  borderRadius: '6px',
                                  border: '1px solid #10B981',
                                  backgroundColor: '#ECFDF5',
                                  color: '#047857',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                <Icon name="camera" size={14} color="#047857" />
                                <span>Selfie Proof</span>
                              </button>
                            )}

                            {hasGps && (
                              <span
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '6px',
                                  backgroundColor: '#EFF6FF',
                                  color: '#1E40AF',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                }}
                              >
                                📍 GPS (±{Math.round(session.punchInAccuracy ?? 0)}m)
                              </span>
                            )}

                            {!hasSelfie && !hasGps && (
                              <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>Standard Punch</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Section 2: Completed Shifts History */}
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0F172A', marginBottom: '1rem' }}>
            Recent Duty Sessions ({teamData?.history.length ?? 0})
          </h2>

          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            {isLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B', fontSize: '0.875rem' }}>
                Loading session history...
              </div>
            ) : teamData?.history.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B', fontSize: '0.875rem' }}>
                No completed duty sessions logged yet.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Worker</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Shift</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Punch In</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Punch Out</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Duration</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Verification Evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {teamData?.history.map((session: AttendanceSessionResponse) => {
                    const hasSelfie = !!session.selfieMediaKey;
                    const hasGps = session.punchInLatitude !== null && session.punchInLatitude !== undefined;

                    return (
                      <tr key={session.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.875rem' }}>{session.userName || 'Employee'}</div>
                          <div style={{ color: '#64748B', fontSize: '0.75rem' }}>{session.userEmail}</div>
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.8125rem', color: '#475569' }}>
                          {session.shiftName || 'General Shift'}
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.8125rem', color: '#334155' }}>
                          {new Date(session.punchInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(session.punchInTime).toLocaleDateString()})
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.8125rem', color: '#334155' }}>
                          {session.punchOutTime
                            ? `${new Date(session.punchOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${new Date(session.punchOutTime).toLocaleDateString()})`
                            : '—'}
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.8125rem', fontWeight: 600, color: '#0F172A' }}>
                          {formatDuration(session.durationMinutes)}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {hasSelfie && (
                              <button
                                onClick={() => setPreviewSession(session)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  padding: '0.25rem 0.6rem',
                                  borderRadius: '6px',
                                  border: '1px solid #10B981',
                                  backgroundColor: '#ECFDF5',
                                  color: '#047857',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                <Icon name="camera" size={14} color="#047857" />
                                <span>Selfie Proof</span>
                              </button>
                            )}

                            {hasGps && (
                              <span
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '6px',
                                  backgroundColor: '#EFF6FF',
                                  color: '#1E40AF',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                }}
                              >
                                📍 GPS (±{Math.round(session.punchInAccuracy ?? 0)}m)
                              </span>
                            )}

                            {!hasSelfie && !hasGps && (
                              <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>Standard Punch</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* Selfie Verification Evidence Modal (BLK-004) */}
      {previewSession && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(3px)',
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
              maxWidth: '500px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
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
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#0F172A' }}>
                  Selfie Attendance Evidence
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8125rem', color: '#64748B' }}>
                  Frontline attendance photograph captured at punch in.
                </p>
              </div>
              <button
                onClick={() => setPreviewSession(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', color: '#64748B', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              {previewSession.selfieMediaKey ? (
                <div
                  style={{
                    width: '280px',
                    height: '280px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '2px solid #E2E8F0',
                    backgroundColor: '#F1F5F9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <img
                    src={webApi.getMediaFileUrl(previewSession.selfieMediaKey)}
                    alt="Attendance Selfie"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      // Fallback placeholder if image not accessible
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div style={{ color: '#64748B', padding: '2rem' }}>No photo recorded for this session.</div>
              )}

              <div style={{ width: '100%', backgroundColor: '#F8FAFC', borderRadius: '10px', padding: '1rem', fontSize: '0.8125rem', color: '#334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ color: '#64748B' }}>Worker:</span>
                  <span style={{ fontWeight: 600 }}>{previewSession.userName || 'Employee'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ color: '#64748B' }}>Punch In Time:</span>
                  <span style={{ fontWeight: 600 }}>{new Date(previewSession.punchInTime).toLocaleString()}</span>
                </div>
                {previewSession.punchInLatitude !== null && previewSession.punchInLatitude !== undefined && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ color: '#64748B' }}>GPS Coordinates:</span>
                    <span style={{ fontWeight: 600 }}>
                      {previewSession.punchInLatitude.toFixed(5)}, {previewSession.punchInLongitude?.toFixed(5)} (±{Math.round(previewSession.punchInAccuracy ?? 0)}m)
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Shift:</span>
                  <span style={{ fontWeight: 600 }}>{previewSession.shiftName || 'General Shift'}</span>
                </div>
              </div>

              <div
                style={{
                  fontSize: '0.75rem',
                  color: '#64748B',
                  textAlign: 'center',
                  lineHeight: 1.4,
                  backgroundColor: '#FFFBEB',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #FEF3C7',
                }}
              >
                <strong>Compliance Notice:</strong> This photographic proof is stored in multi-tenant isolated media storage and provided for manager visual verification under company policy. Automated biometric facial identification is not conducted.
              </div>
            </div>

            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setPreviewSession(null)}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#334155',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { HeaderNav } from '../../components/HeaderNav';
import { webApi, getStoredToken } from '../../lib/api';
import type { MeResponse, TeamAttendanceResponse, AttendanceSessionResponse } from '@oprino/contracts';

export default function AttendancePage() {
  const router = useRouter();
  const [context, setContext] = useState<MeResponse | null>(null);
  const [teamData, setTeamData] = useState<TeamAttendanceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
              Real-time duty visibility, shifts, and verified work durations.
            </p>
          </div>

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
                  </tr>
                </thead>
                <tbody>
                  {teamData?.activeSessions.map((session: AttendanceSessionResponse) => (
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
                    </tr>
                  ))}
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
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Late Arrival</th>
                  </tr>
                </thead>
                <tbody>
                  {teamData?.history.map((session: AttendanceSessionResponse) => (
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
                        {session.isLate ? (
                          <span style={{ padding: '0.15rem 0.5rem', backgroundColor: '#FEF3C7', color: '#D97706', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                            Late ({session.lateMinutes}m)
                          </span>
                        ) : (
                          <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>On Time</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { HeaderNav } from '../../components/HeaderNav';
import { Icon } from '../../components/Icon';
import { webApi } from '../../lib/api';
import type { MeResponse, WorkspaceSettings } from '@oprino/contracts';

export default function SettingsPage() {
  const router = useRouter();
  const [context, setContext] = useState<MeResponse | null>(null);
  const [settings, setSettings] = useState<WorkspaceSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [retentionDays, setRetentionDays] = useState<7 | 30 | 90 | 180>(30);
  const [attendancePolicy, setAttendancePolicy] = useState<
    'SIMPLE' | 'GPS_REQUIRED' | 'SELFIE_REQUIRED' | 'GPS_AND_SELFIE_REQUIRED' | 'GEOFENCE_REQUIRED'
  >('SIMPLE');

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const meRes = await webApi.getMe();
      if (!meRes.activeWorkspace) {
        router.push('/onboarding/workspace');
        return;
      }
      setContext(meRes);

      const res = await webApi.getWorkspaceSettings();
      setSettings(res.settings);
      setRetentionDays(res.settings.locationRetentionDays);
      setAttendancePolicy(res.settings.attendancePolicy);
    } catch (err: any) {
      if (err.status === 401) {
        router.push('/auth/signin');
      } else {
        setError(err.message || 'Failed to load workspace settings');
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

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      const res = await webApi.updateWorkspaceSettings({
        locationRetentionDays: retentionDays,
        attendancePolicy,
      });

      setSettings(res.settings);
      setSuccessMessage('Workspace compliance and retention settings updated successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  const isOwnerOrAdmin =
    context?.role?.name?.toLowerCase() === 'owner' ||
    context?.role?.name?.toLowerCase() === 'admin' ||
    context?.permissions?.includes('workspace.settings.manage');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      <HeaderNav context={context} onSignOut={handleSignOut} />

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
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
              Workspace Policy & Retention
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
            Configure GPS telemetry lifecycle pruning and frontline attendance verification rules.
          </p>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div
            style={{
              backgroundColor: '#ECFDF5',
              border: '1px solid #6EE7B7',
              borderRadius: '8px',
              padding: '0.875rem 1.25rem',
              color: '#065F46',
              fontSize: '0.9375rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{successMessage}</span>
            <button
              onClick={() => setSuccessMessage(null)}
              style={{ background: 'none', border: 'none', color: '#065F46', cursor: 'pointer', fontWeight: 700 }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Error Alert */}
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

        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
            Loading workspace settings...
          </div>
        ) : (
          <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* CARD 1: GPS Retention (BLK-006) */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                padding: '1.75rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: '#EEF2FF',
                    color: '#164CFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="clock" size={20} color="#164CFF" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                    GPS Data Retention Policy (BLK-006)
                  </h2>
                  <p style={{ margin: '0.15rem 0 0', fontSize: '0.8125rem', color: '#64748B' }}>
                    Automated duty-hours telemetry pruning to ensure privacy compliance and reduce storage overhead.
                  </p>
                </div>
              </div>

              <div style={{ marginTop: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginBottom: '0.5rem' }}>
                  Select Retention Duration
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                  {[
                    { days: 7, label: '7 Days', desc: 'Minimal storage, immediate compliance.' },
                    { days: 30, label: '30 Days (Default)', desc: 'Recommended balance for monthly audits.' },
                    { days: 90, label: '90 Days', desc: 'Quarterly review & historical dispute resolution.' },
                    { days: 180, label: '180 Days', desc: 'Extended multi-month compliance archive.' },
                  ].map((opt) => (
                    <label
                      key={opt.days}
                      style={{
                        border: retentionDays === opt.days ? '2px solid #164CFF' : '1px solid #CBD5E1',
                        backgroundColor: retentionDays === opt.days ? '#EEF2FF' : '#FFFFFF',
                        borderRadius: '10px',
                        padding: '1rem',
                        cursor: isOwnerOrAdmin ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.35rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                          type="radio"
                          name="retention"
                          disabled={!isOwnerOrAdmin}
                          checked={retentionDays === opt.days}
                          onChange={() => setRetentionDays(opt.days as any)}
                        />
                        <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#0F172A' }}>
                          {opt.label}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#64748B', lineHeight: 1.3 }}>
                        {opt.desc}
                      </span>
                    </label>
                  ))}
                </div>

                <div
                  style={{
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    padding: '0.85rem 1rem',
                    marginTop: '1rem',
                    fontSize: '0.8125rem',
                    color: '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Icon name="shield" size={16} color="#164CFF" />
                  <span>
                    Pruning runs nightly via isolated workspace transactions. Data belonging to other companies is never accessed or affected.
                  </span>
                </div>
              </div>
            </div>

            {/* CARD 2: Attendance Verification Policy (BLK-004) */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                padding: '1.75rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: '#ECFDF5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="camera" size={20} color="#059669" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                    Frontline Attendance Verification Policy (BLK-004)
                  </h2>
                  <p style={{ margin: '0.15rem 0 0', fontSize: '0.8125rem', color: '#64748B' }}>
                    Control required proofs when field employees Punch In and Punch Out on the mobile app.
                  </p>
                </div>
              </div>

              <div style={{ marginTop: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginBottom: '0.5rem' }}>
                  Enforcement Level
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                  {[
                    {
                      id: 'SIMPLE',
                      label: 'Simple Attendance',
                      desc: 'Workers punch in directly without mandatory photographic or GPS checks.',
                    },
                    {
                      id: 'GPS_REQUIRED',
                      label: 'GPS Verification',
                      desc: 'Requires valid mobile device GPS coordinates to record shift start.',
                    },
                    {
                      id: 'SELFIE_REQUIRED',
                      label: 'Selfie Verification',
                      desc: 'Requires front-camera photographic evidence capture on punch-in.',
                    },
                    {
                      id: 'GPS_AND_SELFIE_REQUIRED',
                      label: 'GPS + Selfie (Strict)',
                      desc: 'Requires both GPS coordinates and front-camera selfie evidence before duty begins.',
                    },
                    {
                      id: 'GEOFENCE_REQUIRED',
                      label: 'Geofence Bound',
                      desc: 'Requires employee device to be within an authorized customer site geofence.',
                    },
                  ].map((policy) => (
                    <label
                      key={policy.id}
                      style={{
                        border: attendancePolicy === policy.id ? '2px solid #164CFF' : '1px solid #CBD5E1',
                        backgroundColor: attendancePolicy === policy.id ? '#EEF2FF' : '#FFFFFF',
                        borderRadius: '10px',
                        padding: '1rem',
                        cursor: isOwnerOrAdmin ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.35rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                          type="radio"
                          name="attendancePolicy"
                          disabled={!isOwnerOrAdmin}
                          checked={attendancePolicy === policy.id}
                          onChange={() => setAttendancePolicy(policy.id as any)}
                        />
                        <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#0F172A' }}>
                          {policy.label}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#64748B', lineHeight: 1.3 }}>
                        {policy.desc}
                      </span>
                    </label>
                  ))}
                </div>

                <div
                  style={{
                    backgroundColor: '#FFFBEB',
                    border: '1px solid #FCD34D',
                    borderRadius: '8px',
                    padding: '0.85rem 1rem',
                    marginTop: '1rem',
                    fontSize: '0.8125rem',
                    color: '#B45309',
                    lineHeight: 1.4,
                  }}
                >
                  <strong>Compliance Note:</strong> Photographic selfie capture serves as visual verification of attendance for managers. Facial recognition or automated biometric matching is not claimed or performed.
                </div>
              </div>
            </div>

            {/* Submit Button */}
            {isOwnerOrAdmin ? (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    padding: '0.75rem 2rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#164CFF',
                    color: '#FFFFFF',
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 4px rgba(22, 76, 255, 0.2)',
                    opacity: isSaving ? 0.7 : 1,
                  }}
                >
                  {isSaving ? 'Saving Changes...' : 'Save Workspace Policies'}
                </button>
              </div>
            ) : (
              <div style={{ fontSize: '0.875rem', color: '#64748B', fontStyle: 'italic', textAlign: 'right' }}>
                Only workspace Owners and Administrators can modify retention and compliance policies.
              </div>
            )}
          </form>
        )}
      </main>
    </div>
  );
}

'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { HeaderNav } from '../../components/HeaderNav';
import { Icon } from '../../components/Icon';
import { webApi, getStoredToken, getStoredWorkspaceId, getApiBaseUrl } from '../../lib/api';
import type {
  MeResponse,
  LiveWorkerLocation,
  Geofence,
  LocationHistoryResponse,
  LocationPoint,
} from '@oprino/contracts';

export default function LiveMapPage() {
  const router = useRouter();
  const [context, setContext] = useState<MeResponse | null>(null);
  const [workers, setWorkers] = useState<LiveWorkerLocation[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<LiveWorkerLocation | null>(null);
  const [historyData, setHistoryData] = useState<LocationHistoryResponse | null>(null);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [isHistoryMode, setIsHistoryMode] = useState<boolean>(false);
  const [historyDate, setHistoryDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );

  const [isSseConnected, setIsSseConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal for new geofence
  const [isGeofenceModalOpen, setIsGeofenceModalOpen] = useState<boolean>(false);
  const [newFenceName, setNewFenceName] = useState<string>('');
  const [newFenceDesc, setNewFenceDesc] = useState<string>('');
  const [newFenceLat, setNewFenceLat] = useState<number>(28.6139);
  const [newFenceLon, setNewFenceLon] = useState<number>(77.209);
  const [newFenceRadius, setNewFenceRadius] = useState<number>(150);
  const [newFenceType, setNewFenceType] = useState<'OFFICE' | 'CUSTOMER_SITE' | 'CHECKPOINT'>('OFFICE');

  const sseRef = useRef<EventSource | null>(null);

  // Load Initial Data
  const loadInitialData = useCallback(async () => {
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

      const [workersRes, geofencesRes] = await Promise.all([
        webApi.getLiveWorkers().catch(() => ({ workers: [] })),
        webApi.listGeofences().catch(() => ({ geofences: [] })),
      ]);

      setWorkers(workersRes.workers);
      setGeofences(geofencesRes.geofences);
    } catch (err: any) {
      if (err.status === 401) {
        router.push('/auth/signin');
      } else {
        setError(err.message || 'Failed to initialize live map');
      }
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Connect to SSE Stream with Polling Fallback
  useEffect(() => {
    const token = getStoredToken();
    const workspaceId = getStoredWorkspaceId();
    if (!token || !workspaceId) return;

    const apiUrl = getApiBaseUrl();

    try {
      // Establish EventSource with authentication credentials in query params
      const streamUrl = new URL(`${apiUrl}/v1/telemetry/stream`);
      streamUrl.searchParams.set('token', token);
      streamUrl.searchParams.set('workspaceId', workspaceId);
      const es = new EventSource(streamUrl.toString());
      sseRef.current = es;

      es.onopen = () => {
        setIsSseConnected(true);
      };

      es.addEventListener('connected', () => {
        setIsSseConnected(true);
      });

      es.addEventListener('location_update', (event) => {
        try {
          const payload = JSON.parse(event.data);
          setWorkers((prev) => {
            const index = prev.findIndex((w) => w.userId === payload.userId);
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = {
                ...updated[index],
                latitude: payload.latitude,
                longitude: payload.longitude,
                accuracy: payload.accuracy,
                speed: payload.speed,
                heading: payload.heading,
                batteryLevel: payload.batteryLevel,
                isCharging: payload.isCharging,
                recordedAt: payload.recordedAt,
              };
              return updated;
            }
            return prev;
          });
        } catch {
          // ignore malformed frame
        }
      });

      es.onerror = () => {
        setIsSseConnected(false);
      };
    } catch {
      setIsSseConnected(false);
    }

    // Backup polling every 10 seconds if SSE is down
    const interval = setInterval(() => {
      if (!isSseConnected) {
        webApi.getLiveWorkers().then((res) => setWorkers(res.workers)).catch(() => {});
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      if (sseRef.current) {
        sseRef.current.close();
      }
    };
  }, [isSseConnected]);

  // Load Breadcrumb History
  const loadHistory = async (userId: string, date: string) => {
    try {
      setIsLoading(true);
      const res = await webApi.getLocationHistory(userId, date);
      setHistoryData(res);
      setHistoryIndex(res.points.length > 0 ? res.points.length - 1 : 0);
      setIsHistoryMode(true);
    } catch (err: any) {
      alert(`Could not load breadcrumbs: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Create Geofence Handler
  const handleCreateGeofence = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await webApi.createGeofence({
        name: newFenceName,
        description: newFenceDesc || undefined,
        latitude: newFenceLat,
        longitude: newFenceLon,
        radiusMeters: newFenceRadius,
        geofenceType: newFenceType,
      });

      setGeofences((prev) => [created, ...prev]);
      setIsGeofenceModalOpen(false);
      setNewFenceName('');
      setNewFenceDesc('');
    } catch (err: any) {
      alert(`Failed to create geofence: ${err.message}`);
    }
  };

  // Delete Geofence Handler
  const handleDeleteGeofence = async (id: string) => {
    if (!confirm('Are you sure you want to remove this geofence?')) return;
    try {
      await webApi.deleteGeofence(id);
      setGeofences((prev) => prev.filter((g) => g.id !== id));
    } catch (err: any) {
      alert(`Failed to delete geofence: ${err.message}`);
    }
  };

  // Bounds for interactive Radar Canvas
  const centerLat = 28.6139;
  const centerLon = 77.209;
  const mapScale = 4000; // SVG pixels per degree

  const projectToSvg = (lat: number, lon: number) => {
    const x = 400 + (lon - centerLon) * mapScale;
    const y = 300 - (lat - centerLat) * mapScale;
    return { x, y };
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
      <HeaderNav context={context} onSignOut={() => router.push('/auth/signin')} />

      {/* Main Container */}
      <main style={{ flex: 1, padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Top Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                Live Field Operations Map
              </h1>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '9999px',
                  backgroundColor: isSseConnected ? '#ECFDF5' : '#FEF3C7',
                  color: isSseConnected ? '#059669' : '#D97706',
                  border: `1px solid ${isSseConnected ? '#A7F3D0' : '#FDE68A'}`,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: isSseConnected ? '#10B981' : '#F59E0B',
                  }}
                />
                {isSseConnected ? 'Live SSE Stream Active' : 'Polling Sync Mode (10s)'}
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#64748B', margin: '0.25rem 0 0' }}>
              Real-time duty-hours tracking, vector radar, and geofenced workforce boundaries.
            </p>
          </div>

          {/* Action Chips & Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#FFFFFF',
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: '#334155',
              }}
            >
              <span>On-Duty Technicians:</span>
              <span style={{ color: '#4F46E5', fontWeight: 700 }}>{workers.length}</span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#FFFFFF',
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: '#334155',
              }}
            >
              <span>Geofences:</span>
              <span style={{ color: '#059669', fontWeight: 700 }}>{geofences.length}</span>
            </div>

            <button
              onClick={() => setIsGeofenceModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#0F172A',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              + Add Geofence
            </button>
          </div>
        </div>

        {/* Privacy Invariant Banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1.25rem',
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: '8px',
            fontSize: '0.8125rem',
            color: '#1E40AF',
          }}
        >
          <Icon name="lock" size={18} color="#1E40AF" />
          <div>
            <strong>Duty-Hours-Only Tracking Invariant:</strong> Location tracking operates strictly during active,
            verified work shifts. Off-duty location tracking never occurs. Peer visibility remains disabled by default.
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '8px',
              color: '#DC2626',
              fontSize: '0.875rem',
            }}
          >
            {error}
          </div>
        )}

        {/* Live Operations Workspace Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.25rem', flex: 1, minHeight: '560px' }}>
          {/* Left Column: Interactive Vector Radar Canvas */}
          <div
            style={{
              backgroundColor: '#0F172A',
              borderRadius: '12px',
              border: '1px solid #1E293B',
              overflow: 'hidden',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
          >
            {/* Map Top Bar Controls */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 1.25rem',
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(8px)',
                borderBottom: '1px solid #1E293B',
                zIndex: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#94A3B8', fontSize: '0.75rem', fontWeight: 600 }}>MAP VIEW</span>
                <span style={{ color: '#38BDF8', fontSize: '0.75rem', fontWeight: 700 }}>● VECTOR RADAR</span>
              </div>

              {isHistoryMode && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ color: '#E2E8F0', fontSize: '0.75rem', fontWeight: 600 }}>
                    Playback Mode ({historyData?.points.length || 0} points)
                  </span>
                  <button
                    onClick={() => {
                      setIsHistoryMode(false);
                      setHistoryData(null);
                    }}
                    style={{
                      padding: '0.25rem 0.6rem',
                      backgroundColor: '#334155',
                      color: '#F8FAFC',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    Exit History
                  </button>
                </div>
              )}
            </div>

            {/* SVG Vector Map Rendering */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 800 600"
                style={{ width: '100%', height: '100%', display: 'block' }}
              >
                <defs>
                  {/* Grid Pattern */}
                  <pattern id="radar-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1E293B" strokeWidth="1" />
                  </pattern>
                </defs>

                {/* Background Grid */}
                <rect width="800" height="600" fill="#0B1120" />
                <rect width="800" height="600" fill="url(#radar-grid)" />

                {/* Range Rings */}
                <circle cx="400" cy="300" r="100" fill="none" stroke="#1E293B" strokeWidth="1" strokeDasharray="4 4" />
                <circle cx="400" cy="300" r="200" fill="none" stroke="#1E293B" strokeWidth="1" strokeDasharray="4 4" />

                {/* Render Geofences */}
                {geofences.map((fence) => {
                  const pt = projectToSvg(fence.latitude, fence.longitude);
                  const radiusPixels = (fence.radiusMeters / 111320) * mapScale;

                  return (
                    <g key={fence.id}>
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={Math.max(12, radiusPixels)}
                        fill="rgba(16, 185, 129, 0.12)"
                        stroke="#10B981"
                        strokeWidth="1.5"
                        strokeDasharray="4 2"
                      />
                      <circle cx={pt.x} cy={pt.y} r="3" fill="#10B981" />
                      <text
                        x={pt.x}
                        y={pt.y - Math.max(14, radiusPixels) - 6}
                        fill="#34D399"
                        fontSize="10"
                        fontWeight="600"
                        textAnchor="middle"
                      >
                        {fence.name} ({fence.radiusMeters}m)
                      </text>
                    </g>
                  );
                })}

                {/* Render Historical Trail if in History Mode */}
                {isHistoryMode && historyData && historyData.points.length > 1 && (
                  <g>
                    <polyline
                      fill="none"
                      stroke="#818CF8"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray="6 4"
                      points={historyData.points
                        .slice(0, historyIndex + 1)
                        .map((p: LocationPoint) => {
                          const pt = projectToSvg(p.latitude, p.longitude);
                          return `${pt.x},${pt.y}`;
                        })
                        .join(' ')}
                    />
                    {historyData.points.slice(0, historyIndex + 1).map((p: LocationPoint, idx: number) => {
                      const pt = projectToSvg(p.latitude, p.longitude);
                      return (
                        <circle
                          key={p.id || idx}
                          cx={pt.x}
                          cy={pt.y}
                          r={idx === historyIndex ? 5 : 2}
                          fill={idx === historyIndex ? '#4F46E5' : '#A5B4FC'}
                        />
                      );
                    })}
                  </g>
                )}

                {/* Render Live On-Duty Workers */}
                {!isHistoryMode &&
                  workers.map((worker) => {
                    const pt = projectToSvg(worker.latitude, worker.longitude);
                    const isSelected = selectedWorker?.userId === worker.userId;

                    return (
                      <g
                        key={worker.userId}
                        onClick={() => setSelectedWorker(worker)}
                        style={{ cursor: 'pointer' }}
                      >
                        {/* Pulse Ring */}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isSelected ? '18' : '12'}
                          fill="none"
                          stroke={isSelected ? '#38BDF8' : '#6366F1'}
                          strokeWidth="2"
                          opacity="0.8"
                        />
                        {/* Worker Center Pin */}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="7"
                          fill={isSelected ? '#38BDF8' : '#4F46E5'}
                        />
                        <text
                          x={pt.x}
                          y={pt.y + 3}
                          fill="#FFFFFF"
                          fontSize="7"
                          fontWeight="700"
                          textAnchor="middle"
                        >
                          {worker.userName ? worker.userName[0].toUpperCase() : 'T'}
                        </text>
                        {/* Worker Label */}
                        <text
                          x={pt.x}
                          y={pt.y + 22}
                          fill="#F8FAFC"
                          fontSize="10"
                          fontWeight="600"
                          textAnchor="middle"
                        >
                          {worker.userName}
                        </text>
                        {worker.speed && worker.speed > 0.5 ? (
                          <text
                            x={pt.x}
                            y={pt.y + 33}
                            fill="#38BDF8"
                            fontSize="8"
                            textAnchor="middle"
                          >
                            {(worker.speed * 3.6).toFixed(1)} km/h
                          </text>
                        ) : null}
                      </g>
                    );
                  })}
              </svg>
            </div>

            {/* Bottom Scrubber (History Mode Only) */}
            {isHistoryMode && historyData && historyData.points.length > 0 && (
              <div
                style={{
                  padding: '0.85rem 1.25rem',
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  borderTop: '1px solid #1E293B',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  zIndex: 10,
                }}
              >
                <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>SCRUBBER:</span>
                <input
                  type="range"
                  min="0"
                  max={historyData.points.length - 1}
                  value={historyIndex}
                  onChange={(e) => setHistoryIndex(Number(e.target.value))}
                  style={{ flex: 1, accentColor: '#4F46E5', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.75rem', color: '#E2E8F0', fontWeight: 600, minWidth: '130px' }}>
                  {historyData.points[historyIndex]
                    ? new Date(historyData.points[historyIndex].recordedAt).toLocaleTimeString()
                    : ''}
                </span>
              </div>
            )}
          </div>

          {/* Right Column: Worker Details & Active Roster */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Selected Worker Panel */}
            {selectedWorker ? (
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                      {selectedWorker.userName}
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{selectedWorker.userEmail}</span>
                  </div>
                  <span
                    style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      backgroundColor: '#ECFDF5',
                      color: '#059669',
                    }}
                  >
                    ON DUTY
                  </span>
                </div>

                {/* Worker Metrics Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div style={{ backgroundColor: '#F8FAFC', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                    <span style={{ fontSize: '0.6875rem', color: '#64748B', display: 'block' }}>Speed</span>
                    <strong style={{ fontSize: '0.875rem', color: '#0F172A' }}>
                      {selectedWorker.speed ? `${(selectedWorker.speed * 3.6).toFixed(1)} km/h` : '0.0 km/h'}
                    </strong>
                  </div>
                  <div style={{ backgroundColor: '#F8FAFC', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                    <span style={{ fontSize: '0.6875rem', color: '#64748B', display: 'block' }}>Battery</span>
                    <strong style={{ fontSize: '0.875rem', color: '#0F172A' }}>
                      {selectedWorker.batteryLevel
                        ? `${Math.round(selectedWorker.batteryLevel * 100)}% ${selectedWorker.isCharging ? '⚡' : ''}`
                        : 'Unknown'}
                    </strong>
                  </div>
                  <div style={{ backgroundColor: '#F8FAFC', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                    <span style={{ fontSize: '0.6875rem', color: '#64748B', display: 'block' }}>Accuracy</span>
                    <strong style={{ fontSize: '0.875rem', color: '#0F172A' }}>
                      ±{selectedWorker.accuracy.toFixed(1)}m
                    </strong>
                  </div>
                  <div style={{ backgroundColor: '#F8FAFC', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                    <span style={{ fontSize: '0.6875rem', color: '#64748B', display: 'block' }}>Activity</span>
                    <strong style={{ fontSize: '0.875rem', color: '#0F172A', textTransform: 'capitalize' }}>
                      {selectedWorker.activityType || 'stationary'}
                    </strong>
                  </div>
                </div>

                {/* Current Active Task */}
                {selectedWorker.currentTaskTitle && (
                  <div
                    style={{
                      padding: '0.5rem 0.75rem',
                      backgroundColor: '#EEF2FF',
                      border: '1px solid #C7D2FE',
                      borderRadius: '6px',
                    }}
                  >
                    <span style={{ fontSize: '0.6875rem', color: '#4F46E5', fontWeight: 600 }}>CURRENT TASK</span>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1E1B4B' }}>
                      {selectedWorker.currentTaskTitle}
                    </div>
                  </div>
                )}

                {/* Breadcrumbs Action */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <input
                    type="date"
                    value={historyDate}
                    onChange={(e) => setHistoryDate(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '0.4rem 0.6rem',
                      fontSize: '0.75rem',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                    }}
                  />
                  <button
                    onClick={() => loadHistory(selectedWorker.userId, historyDate)}
                    style={{
                      padding: '0.4rem 0.85rem',
                      backgroundColor: '#4F46E5',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    View Breadcrumbs
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  border: '1px dashed #CBD5E1',
                  textAlign: 'center',
                  color: '#64748B',
                  fontSize: '0.875rem',
                }}
              >
                Click any technician pin on the radar to inspect live metrics and trail history.
              </div>
            )}

            {/* Active On-Duty Roster List */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                padding: '1.25rem',
                border: '1px solid #E2E8F0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                Active On-Duty Roster ({workers.length})
              </h3>

              {workers.length === 0 ? (
                <div style={{ fontSize: '0.8125rem', color: '#94A3B8', textAlign: 'center', padding: '2rem 0' }}>
                  No technicians currently on duty.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
                  {workers.map((worker) => (
                    <div
                      key={worker.userId}
                      onClick={() => setSelectedWorker(worker)}
                      style={{
                        padding: '0.6rem 0.75rem',
                        backgroundColor: selectedWorker?.userId === worker.userId ? '#F1F5F9' : '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '0.8125rem', color: '#0F172A', display: 'block' }}>
                          {worker.userName}
                        </strong>
                        <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                          Last update: {new Date(worker.recordedAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: '#10B981',
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Create Geofence Modal */}
      {isGeofenceModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              padding: '1.5rem',
              width: '100%',
              maxWidth: '460px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', margin: '0 0 1rem' }}>
              Create New Geofence
            </h2>

            <form onSubmit={handleCreateGeofence} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block' }}>
                  Boundary Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. North Terminal Depot"
                  value={newFenceName}
                  onChange={(e) => setNewFenceName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    marginTop: '0.25rem',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block' }}>
                  Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Logistics and dispatch hub"
                  value={newFenceDesc}
                  onChange={(e) => setNewFenceDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    marginTop: '0.25rem',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block' }}>
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={newFenceLat}
                    onChange={(e) => setNewFenceLat(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      marginTop: '0.25rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block' }}>
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={newFenceLon}
                    onChange={(e) => setNewFenceLon(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      marginTop: '0.25rem',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block' }}>
                    Radius (Meters)
                  </label>
                  <input
                    type="number"
                    required
                    min="10"
                    max="10000"
                    value={newFenceRadius}
                    onChange={(e) => setNewFenceRadius(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      marginTop: '0.25rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block' }}>
                    Type
                  </label>
                  <select
                    value={newFenceType}
                    onChange={(e) => setNewFenceType(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      marginTop: '0.25rem',
                    }}
                  >
                    <option value="OFFICE">Office Hub</option>
                    <option value="CUSTOMER_SITE">Customer Site</option>
                    <option value="CHECKPOINT">Checkpoint</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsGeofenceModalOpen(false)}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    backgroundColor: '#FFFFFF',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.5rem 1.25rem',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: '#0F172A',
                    color: '#FFFFFF',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Save Geofence
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

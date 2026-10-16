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
} from '@oprino/contracts';
import type * as MapLibreGL from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// Helper to generate a polygon circle for MapLibre GeoJSON layer
function createGeoJsonCircle(centerLng: number, centerLat: number, radiusMeters: number, points = 48): [number, number][] {
  const coords: [number, number][] = [];
  const km = radiusMeters / 1000;
  const distanceX = km / (111.32 * Math.cos((centerLat * Math.PI) / 180));
  const distanceY = km / 110.574;

  for (let i = 0; i <= points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);
    coords.push([centerLng + x, centerLat + y]);
  }
  return coords;
}

import { escapeHtml } from '../../lib/html-utils.js';

export default function LiveMapPage() {
  const router = useRouter();
  const [context, setContext] = useState<MeResponse | null>(null);
  const [workers, setWorkers] = useState<LiveWorkerLocation[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<LiveWorkerLocation | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'IDLE'>('ALL');

  // Breadcrumbs History Mode
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

  // MapLibre references
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreGL.Map | null>(null);
  const markersRef = useRef<Map<string, MapLibreGL.Marker>>(new Map());
  const latestWorkersRef = useRef<Map<string, LiveWorkerLocation>>(new Map());
  const hasInitiallyFittedRef = useRef<boolean>(false);
  const historyMarkerRef = useRef<MapLibreGL.Marker | null>(null);
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

  // Connect to SSE Stream via short-lived single-use streaming ticket
  // Strictly protects bearer token from leaking into query parameters or browser history
  const connectSseStream = useCallback(async () => {
    const token = getStoredToken();
    const workspaceId = getStoredWorkspaceId();
    if (!token || !workspaceId) return;

    try {
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }

      // 1. Acquire single-use streaming ticket
      const { ticket } = await webApi.getStreamTicket();
      const apiUrl = getApiBaseUrl();

      // 2. Establish EventSource with short-lived ticket
      const streamUrl = `${apiUrl}/v1/telemetry/stream?ticket=${encodeURIComponent(ticket)}`;
      const es = new EventSource(streamUrl);
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
            } else if (payload.dutyStatus === 'ON_DUTY') {
              return [...prev, payload];
            }
            return prev;
          });
        } catch {
          // ignore malformed frame
        }
      });

      es.onerror = () => {
        setIsSseConnected(false);
        if (es.readyState === EventSource.CLOSED) {
          // Retry connection with a new ticket after backoff
          setTimeout(() => {
            connectSseStream();
          }, 8000);
        }
      };
    } catch {
      setIsSseConnected(false);
    }
  }, []);

  useEffect(() => {
    connectSseStream();

    // Backup polling fallback every 15s if SSE disconnects
    const pollInterval = setInterval(() => {
      if (!isSseConnected) {
        webApi.getLiveWorkers().then((res) => setWorkers(res.workers)).catch(() => {});
      }
    }, 15000);

    return () => {
      clearInterval(pollInterval);
      if (sseRef.current) {
        sseRef.current.close();
      }
    };
  }, [connectSseStream, isSseConnected]);

  // Initialize MapLibre GL
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    let isMounted = true;

    async function initMap() {
      const maplibregl = await import('maplibre-gl');
      if (!isMounted || !mapContainerRef.current) return;

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: {
          version: 8,
          sources: {
            'carto-dark': {
              type: 'raster',
              tiles: [
                'https://a.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png',
                'https://b.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png',
                'https://c.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png',
              ],
              tileSize: 256,
              attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
            },
          },
          layers: [
            {
              id: 'carto-dark-layer',
              type: 'raster',
              source: 'carto-dark',
              minzoom: 0,
              maxzoom: 19,
            },
          ],
        },
        center: [77.209, 28.6139],
        zoom: 12,
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
      mapRef.current = map;

      map.on('load', () => {
        // Geofences layer source
        map.addSource('geofences-source', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [],
          },
        });

        map.addLayer({
          id: 'geofences-fill',
          type: 'fill',
          source: 'geofences-source',
          paint: {
            'fill-color': '#10B981',
            'fill-opacity': 0.12,
          },
        });

        map.addLayer({
          id: 'geofences-line',
          type: 'line',
          source: 'geofences-source',
          paint: {
            'line-color': '#10B981',
            'line-width': 2,
            'line-dasharray': [2, 2],
          },
        });

        // Route line source
        map.addSource('route-line-source', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [],
          },
        });

        map.addLayer({
          id: 'route-line-glow',
          type: 'line',
          source: 'route-line-source',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#38BDF8',
            'line-width': 6,
            'line-opacity': 0.4,
          },
        });

        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route-line-source',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#6366F1',
            'line-width': 3,
          },
        });
      });
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update Geofences GeoJSON on Map
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const source = map.getSource('geofences-source') as MapLibreGL.GeoJSONSource | undefined;
    if (!source) return;

    const features = geofences.map((fence) => ({
      type: 'Feature' as const,
      properties: {
        id: fence.id,
        name: fence.name,
      },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [createGeoJsonCircle(fence.longitude, fence.latitude, fence.radiusMeters)],
      },
    }));

    source.setData({
      type: 'FeatureCollection',
      features,
    });
  }, [geofences]);

  // Update Live Worker Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove stale markers not in active workers list
    const activeUserIds = new Set(workers.map((w) => w.userId));
    markersRef.current.forEach((marker, userId) => {
      if (!activeUserIds.has(userId)) {
        marker.remove();
        markersRef.current.delete(userId);
        latestWorkersRef.current.delete(userId);
      }
    });

    if (isHistoryMode) {
      // In history mode, hide worker markers
      markersRef.current.forEach((m) => m.remove());
      return;
    }

    // Dynamic bounds calculation
    import('maplibre-gl').then((maplibregl) => {
      const currentMap = mapRef.current;
      if (!currentMap) return;

      const bounds = new maplibregl.LngLatBounds();
      let hasValidCoords = false;

      workers.forEach((worker) => {
        if (!worker.latitude || !worker.longitude) return;

        hasValidCoords = true;
        bounds.extend([worker.longitude, worker.latitude]);
        latestWorkersRef.current.set(worker.userId, worker);

        const isSelected = selectedWorker?.userId === worker.userId;
        const now = Date.now();
        const recordedTime = new Date(worker.recordedAt).getTime();
        const isStale = now - recordedTime > 5 * 60 * 1000; // > 5 mins
        const isMoving = worker.speed && worker.speed > 0.8;

        let marker = markersRef.current.get(worker.userId);

        if (!marker) {
          const el = document.createElement('div');
          el.className = 'oprino-worker-marker';
          el.style.cursor = 'pointer';

          el.addEventListener('click', () => {
            const currentWorker = latestWorkersRef.current.get(worker.userId) || worker;
            setSelectedWorker(currentWorker);
            currentMap.flyTo({
              center: [currentWorker.longitude, currentWorker.latitude],
              zoom: 15,
              speed: 1.2,
            });
          });

          marker = new maplibregl.Marker({ element: el })
            .setLngLat([worker.longitude, worker.latitude])
            .addTo(currentMap);

          markersRef.current.set(worker.userId, marker);
        } else {
          marker.setLngLat([worker.longitude, worker.latitude]);
        }

        if (!marker) return;

        // Update DOM element content safely (neutralizing DOM XSS)
        const el = marker.getElement();
        const initial = worker.userName ? worker.userName[0].toUpperCase() : 'T';
        const color = isSelected ? '#38BDF8' : isStale ? '#F59E0B' : '#6366F1';
        const speedText = worker.speed && worker.speed > 0.5 ? `${(worker.speed * 3.6).toFixed(0)} km/h` : '';
        const safeInitial = escapeHtml(initial);
        const safeUserName = escapeHtml(worker.userName);
        const safeSpeedText = speedText ? escapeHtml(speedText) : '';

        el.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; pointer-events: auto;">
            <div style="position: relative; width: 34px; height: 34px;">
              <div style="
                position: absolute;
                inset: -4px;
                border-radius: 50%;
                background-color: ${color};
                opacity: 0.3;
                animation: ${isMoving ? 'pulse 1.5s infinite' : 'none'};
              "></div>
              <div style="
                position: relative;
                width: 34px;
                height: 34px;
                border-radius: 50%;
                background-color: #0F172A;
                border: 2px solid ${color};
                display: flex;
                align-items: center;
                justify-content: center;
                color: #FFFFFF;
                font-weight: 700;
                font-size: 13px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
              ">
                ${safeInitial}
              </div>
            </div>
            <div style="
              margin-top: 4px;
              background-color: rgba(15, 23, 42, 0.9);
              border: 1px solid rgba(255, 255, 255, 0.15);
              padding: 2px 6px;
              border-radius: 4px;
              color: #F8FAFC;
              font-size: 10px;
              font-weight: 600;
              white-space: nowrap;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            ">
              ${safeUserName} ${safeSpeedText ? `• ${safeSpeedText}` : ''}
            </div>
          </div>
        `;
      });

      // Fit bounds only on initial render or when manually triggered to prevent continuous viewport snapping
      if (!hasInitiallyFittedRef.current && hasValidCoords && !selectedWorker && workers.length > 0) {
        hasInitiallyFittedRef.current = true;
        currentMap.fitBounds(bounds, {
          padding: 60,
          maxZoom: 14,
          duration: 1000,
        });
      }
    });
  }, [workers, selectedWorker, isHistoryMode]);

  // Update Route Line & Scrubber Marker in History Mode
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const source = map.getSource('route-line-source') as MapLibreGL.GeoJSONSource | undefined;
    if (!source) return;

    if (!isHistoryMode || !historyData || historyData.points.length === 0) {
      source.setData({
        type: 'FeatureCollection',
        features: [],
      });
      if (historyMarkerRef.current) {
        historyMarkerRef.current.remove();
        historyMarkerRef.current = null;
      }
      return;
    }

    const coordinates: [number, number][] = historyData.points.map((p) => [p.longitude, p.latitude]);

    source.setData({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates,
          },
        },
      ],
    });

    // Fit map to full route path
    import('maplibre-gl').then((maplibregl) => {
      const currentMap = mapRef.current;
      if (!currentMap) return;

      const bounds = new maplibregl.LngLatBounds();
      coordinates.forEach((c) => bounds.extend(c));
      currentMap.fitBounds(bounds, { padding: 60, maxZoom: 15 });

      // Update Scrubber playback marker
      const activePoint = historyData.points[historyIndex];
      if (activePoint) {
        if (!historyMarkerRef.current) {
          const el = document.createElement('div');
          el.innerHTML = `
            <div style="
              width: 18px;
              height: 18px;
              border-radius: 50%;
              background-color: #38BDF8;
              border: 3px solid #FFFFFF;
              box-shadow: 0 0 10px #38BDF8;
            "></div>
          `;
          historyMarkerRef.current = new maplibregl.Marker({ element: el })
            .setLngLat([activePoint.longitude, activePoint.latitude])
            .addTo(currentMap);
        } else {
          historyMarkerRef.current.setLngLat([activePoint.longitude, activePoint.latitude]);
        }
      }
    });
  }, [isHistoryMode, historyData, historyIndex]);

  // Load Breadcrumb History for Selected Worker
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

  // Filtered workers list
  const filteredWorkers = workers.filter((worker) => {
    const matchesSearch =
      worker.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (worker.userEmail || '').toLowerCase().includes(searchQuery.toLowerCase());

    const isMoving = worker.speed && worker.speed > 0.8;
    if (statusFilter === 'ACTIVE') return matchesSearch && isMoving;
    if (statusFilter === 'IDLE') return matchesSearch && !isMoving;
    return matchesSearch;
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
      <HeaderNav context={context} onSignOut={() => router.push('/auth/signin')} />

      {/* Main Container */}
      <main style={{ flex: 1, padding: '1.25rem 2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                {isSseConnected ? 'Live SSE Ticket Stream Active' : 'Polling Sync Mode (15s)'}
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#64748B', margin: '0.25rem 0 0' }}>
              Real-device GPS telemetry, open MapLibre vector cartography, and geofenced workforce boundaries.
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
              <span>On-Duty Field Crew:</span>
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
            padding: '0.65rem 1.25rem',
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
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 340px',
            gap: '1.25rem',
            flex: 1,
            minHeight: '620px',
          }}
        >
          {/* Left Column: MapLibre Geographic Map Canvas */}
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
                padding: '0.65rem 1.25rem',
                backgroundColor: 'rgba(15, 23, 42, 0.92)',
                backdropFilter: 'blur(8px)',
                borderBottom: '1px solid #1E293B',
                zIndex: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ color: '#94A3B8', fontSize: '0.75rem', fontWeight: 600 }}>MAP LAYER</span>
                <span style={{ color: '#38BDF8', fontSize: '0.75rem', fontWeight: 700 }}>
                  ● MAPLIBRE OPEN VECTOR
                </span>
                <span style={{ color: '#64748B', fontSize: '0.75rem' }}>| Zero-Cost OSM Cartography</span>
              </div>

              {isHistoryMode && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ color: '#E2E8F0', fontSize: '0.75rem', fontWeight: 600 }}>
                    Route Playback Mode ({historyData?.points.length || 0} breadcrumbs)
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
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Exit Route Playback
                  </button>
                </div>
              )}
            </div>

            {/* MapLibre Container */}
            <div
              ref={mapContainerRef}
              style={{
                flex: 1,
                width: '100%',
                height: '100%',
                position: 'relative',
              }}
            />

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
                <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>TIMELINE SCRUBBER:</span>
                <input
                  type="range"
                  min="0"
                  max={historyData.points.length - 1}
                  value={historyIndex}
                  onChange={(e) => setHistoryIndex(Number(e.target.value))}
                  style={{ flex: 1, accentColor: '#38BDF8', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.75rem', color: '#E2E8F0', fontWeight: 600, minWidth: '150px' }}>
                  {historyData.points[historyIndex]
                    ? `${new Date(historyData.points[historyIndex].recordedAt).toLocaleTimeString()} (${((historyData.points[historyIndex].speed || 0) * 3.6).toFixed(1)} km/h)`
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
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
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
                    <button
                      onClick={() => setSelectedWorker(null)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#94A3B8',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        padding: '0 0.2rem',
                      }}
                    >
                      ✕
                    </button>
                  </div>
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
                    <span style={{ fontSize: '0.6875rem', color: '#64748B', display: 'block' }}>GPS Accuracy</span>
                    <strong style={{ fontSize: '0.875rem', color: '#0F172A' }}>
                      ±{selectedWorker.accuracy.toFixed(1)}m
                    </strong>
                  </div>
                  <div style={{ backgroundColor: '#F8FAFC', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                    <span style={{ fontSize: '0.6875rem', color: '#64748B', display: 'block' }}>Coordinates</span>
                    <strong style={{ fontSize: '0.75rem', color: '#0F172A' }}>
                      {selectedWorker.latitude.toFixed(4)}, {selectedWorker.longitude.toFixed(4)}
                    </strong>
                  </div>
                  <div style={{ backgroundColor: '#F8FAFC', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                    <span style={{ fontSize: '0.6875rem', color: '#64748B', display: 'block' }}>Last Recorded Fix</span>
                    <strong style={{ fontSize: '0.75rem', color: '#0F172A' }}>
                      {new Date(selectedWorker.recordedAt).toLocaleTimeString()}
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
                    <span style={{ fontSize: '0.6875rem', color: '#4F46E5', fontWeight: 600 }}>CURRENT ASSIGNED TASK</span>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1E1B4B' }}>
                      {selectedWorker.currentTaskTitle}
                    </div>
                  </div>
                )}

                {/* Daily Breadcrumbs Action */}
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
                    View Route
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
                Click any employee marker on the map to inspect live GPS telemetry and daily route trails.
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  Active Field Crew ({filteredWorkers.length})
                </h3>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  {(['ALL', 'ACTIVE', 'IDLE'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setStatusFilter(tab)}
                      style={{
                        padding: '0.15rem 0.45rem',
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        backgroundColor: statusFilter === tab ? '#0F172A' : '#F1F5F9',
                        color: statusFilter === tab ? '#FFFFFF' : '#64748B',
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Box */}
              <input
                type="text"
                placeholder="Filter by technician name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.35rem 0.6rem',
                  fontSize: '0.75rem',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                }}
              />

              {filteredWorkers.length === 0 ? (
                <div style={{ fontSize: '0.8125rem', color: '#94A3B8', textAlign: 'center', padding: '2rem 0' }}>
                  No matching technicians on duty.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
                  {filteredWorkers.map((worker) => {
                    const isSelected = selectedWorker?.userId === worker.userId;
                    const isMoving = worker.speed && worker.speed > 0.8;

                    return (
                      <div
                        key={worker.userId}
                        onClick={() => {
                          setSelectedWorker(worker);
                          mapRef.current?.flyTo({
                            center: [worker.longitude, worker.latitude],
                            zoom: 15,
                            speed: 1.2,
                          });
                        }}
                        style={{
                          padding: '0.6rem 0.75rem',
                          backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                          border: `1px solid ${isSelected ? '#93C5FD' : '#E2E8F0'}`,
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: '0.8125rem', color: '#0F172A', display: 'block' }}>
                            {worker.userName}
                          </strong>
                          <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                            {isMoving ? `Moving • ${(worker.speed! * 3.6).toFixed(1)} km/h` : 'Stationary'} • ±{worker.accuracy.toFixed(0)}m
                          </span>
                        </div>
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: isMoving ? '#38BDF8' : '#10B981',
                          }}
                        />
                      </div>
                    );
                  })}
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

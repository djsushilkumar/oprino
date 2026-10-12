import 'dart:async';
import 'dart:math' as math;
import 'package:drift/drift.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:oprino_api/oprino_api.dart';
import '../database/database.dart';
import '../network/api_client_provider.dart';
import '../storage/secure_storage_service.dart';
import 'real_location_hardware_adapter.dart';

// =============================================================================
// HARDWARE / PLATFORM ADAPTER ABSTRACTION
// =============================================================================

abstract class LocationHardwareAdapter {
  Stream<LocationPoint> get locationStream;
  Future<void> startTracking();
  Future<void> stopTracking();
  Future<LocationPoint?> getCurrentPosition();
}

/// In-memory / simulated hardware adapter for tests and mobile runtimes.
/// Emits mock GPS fixes and can be manually stimulated via [emitLocation].
class SimulatedLocationHardwareAdapter implements LocationHardwareAdapter {
  final _controller = StreamController<LocationPoint>.broadcast();
  Timer? _timer;
  double _lat = 28.6139;
  double _lng = 77.2090;

  @override
  Stream<LocationPoint> get locationStream => _controller.stream;

  @override
  Future<void> startTracking() async {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 15), (_) {
      _lat += 0.0001;
      _lng += 0.0001;
      emitLocation(
        LocationPoint(
          id: SecureStorageService.generateUuidV4(),
          recordedAt: DateTime.now(),
          latitude: _lat,
          longitude: _lng,
          accuracy: 8.5,
          speed: 2.1,
          heading: 135.0,
          batteryLevel: 0.92,
          isCharging: false,
          activityType: 'walking',
          isMoving: true,
        ),
      );
    });
  }

  @override
  Future<void> stopTracking() async {
    _timer?.cancel();
    _timer = null;
  }

  @override
  Future<LocationPoint?> getCurrentPosition() async {
    return LocationPoint(
      id: SecureStorageService.generateUuidV4(),
      recordedAt: DateTime.now(),
      latitude: _lat,
      longitude: _lng,
      accuracy: 8.5,
      speed: 0.0,
      heading: 0.0,
      batteryLevel: 0.92,
      isCharging: false,
      activityType: 'still',
      isMoving: false,
    );
  }

  void emitLocation(LocationPoint point) {
    if (!_controller.isClosed) {
      _controller.add(point);
    }
  }

  void dispose() {
    _timer?.cancel();
    _controller.close();
  }
}

// =============================================================================
// RIVERPOD PROVIDERS
// =============================================================================

/// Toggle between real device GPS hardware and simulation mode (e.g. for integration tests)
final useSimulatedLocationProvider = StateProvider<bool>((ref) => false);

final locationHardwareAdapterProvider = Provider<LocationHardwareAdapter>((ref) {
  final useSimulated = ref.watch(useSimulatedLocationProvider);
  if (useSimulated) {
    final adapter = SimulatedLocationHardwareAdapter();
    ref.onDispose(() => adapter.dispose());
    return adapter;
  }
  final adapter = RealLocationHardwareAdapter();
  ref.onDispose(() => adapter.dispose());
  return adapter;
});

final locationServiceProvider = Provider<LocationService>((ref) {
  final client = ref.watch(apiClientProvider);
  final adapter = ref.watch(locationHardwareAdapterProvider);
  final db = ref.watch(databaseProvider);
  final service = LocationService(client: client, adapter: adapter, db: db);
  ref.onDispose(() => service.dispose());
  return service;
});

final isTrackingActiveProvider = StateNotifierProvider<TrackingActiveNotifier, bool>((ref) {
  final service = ref.watch(locationServiceProvider);
  return TrackingActiveNotifier(service);
});

final latestLocationProvider = StateNotifierProvider<LatestLocationNotifier, LocationPoint?>((ref) {
  final service = ref.watch(locationServiceProvider);
  return LatestLocationNotifier(service);
});

final nearbyGeofencesProvider = StateNotifierProvider<NearbyGeofencesNotifier, List<CheckGeofenceProximityResponse>>((ref) {
  final service = ref.watch(locationServiceProvider);
  return NearbyGeofencesNotifier(service);
});

// =============================================================================
// STATE NOTIFIERS
// =============================================================================

class TrackingActiveNotifier extends StateNotifier<bool> {
  final LocationService _service;
  StreamSubscription<bool>? _sub;

  TrackingActiveNotifier(this._service) : super(_service.isTrackingActive) {
    _sub = _service.trackingStateStream.listen((active) => state = active);
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }
}

class LatestLocationNotifier extends StateNotifier<LocationPoint?> {
  final LocationService _service;
  StreamSubscription<LocationPoint?>? _sub;

  LatestLocationNotifier(this._service) : super(_service.latestLocation) {
    _sub = _service.locationStream.listen((loc) => state = loc);
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }
}

class NearbyGeofencesNotifier extends StateNotifier<List<CheckGeofenceProximityResponse>> {
  final LocationService _service;
  StreamSubscription<List<CheckGeofenceProximityResponse>>? _sub;

  NearbyGeofencesNotifier(this._service) : super(_service.nearbyGeofences) {
    _sub = _service.geofenceProximityStream.listen((geos) => state = geos);
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }
}

// =============================================================================
// LOCATION SERVICE IMPLEMENTATION
// =============================================================================

class LocationService {
  final OprinoApiClient client;
  final LocationHardwareAdapter adapter;
  final AppDatabase? db;

  bool _isTrackingActive = false;
  String? _currentWorkspaceId;
  String? _currentUserId;
  String? _currentSessionId;
  LocationPoint? _latestLocation;
  List<Geofence> _cachedGeofences = [];
  List<CheckGeofenceProximityResponse> _nearbyGeofences = [];
  final List<LocationPoint> _pointBuffer = [];

  StreamSubscription<LocationPoint>? _hardwareSub;

  final _trackingStateController = StreamController<bool>.broadcast();
  final _locationController = StreamController<LocationPoint?>.broadcast();
  final _geofenceController = StreamController<List<CheckGeofenceProximityResponse>>.broadcast();

  LocationService({
    required this.client,
    required this.adapter,
    this.db,
  });

  bool get isTrackingActive => _isTrackingActive;
  String? get currentWorkspaceId => _currentWorkspaceId;
  String? get currentUserId => _currentUserId;
  LocationPoint? get latestLocation => _latestLocation;
  List<CheckGeofenceProximityResponse> get nearbyGeofences => List.unmodifiable(_nearbyGeofences);
  List<LocationPoint> get pointBuffer => List.unmodifiable(_pointBuffer);

  /// Captures current fix on-demand for geotagging proofs and site visits.
  Future<LocationPoint?> getCurrentFix() async {
    return _latestLocation ?? await adapter.getCurrentPosition();
  }

  Stream<bool> get trackingStateStream => _trackingStateController.stream;
  Stream<LocationPoint?> get locationStream => _locationController.stream;
  Stream<List<CheckGeofenceProximityResponse>> get geofenceProximityStream => _geofenceController.stream;

  /// Activates GPS pipeline when an employee punches in (Duty State: ON_DUTY).
  /// Requires verified authenticated workspace and user identity. Never accepts placeholders.
  /// Lifecycle is fail-safe: any adapter/permission error immediately cleans up tracking state.
  Future<void> startTracking({
    required String workspaceId,
    required String userId,
    String? sessionId,
  }) async {
    if (workspaceId.trim().isEmpty) {
      throw ArgumentError.value(workspaceId, 'workspaceId', 'workspaceId cannot be empty');
    }
    if (userId.trim().isEmpty) {
      throw ArgumentError.value(userId, 'userId', 'userId cannot be empty');
    }

    if (_isTrackingActive && _currentWorkspaceId == workspaceId && _currentUserId == userId) return;

    _isTrackingActive = true;
    _currentWorkspaceId = workspaceId;
    _currentUserId = userId;
    _currentSessionId = sessionId;
    _trackingStateController.add(true);

    try {
      _hardwareSub?.cancel();
      _hardwareSub = adapter.locationStream.listen((point) {
        recordBreadcrumb(point);
      });

      await adapter.startTracking();

      // Capture initial fix
      final initialPos = await adapter.getCurrentPosition();
      if (initialPos != null) {
        await recordBreadcrumb(initialPos);
      }

      // Load workspace geofences
      await refreshGeofences();
    } catch (err) {
      // Fail-safe cleanup: If adapter throws (e.g. Permission Denied or hardware failure),
      // ensure tracking state is synchronously reset to inactive so tracking is NEVER left active unexpectedly.
      await stopTracking();
      rethrow;
    }
  }

  /// Synchronously terminates GPS tracking and unhooks hardware when punching out (Duty State: OFF_DUTY).
  /// Strictly respects Duty-Hours-Only Invariant: Zero off-duty breadcrumbs collected or sent.
  /// Decouples capture from synchronization: previously captured on-duty points in SQLite are preserved
  /// and will synchronize whenever network is available.
  Future<void> stopTracking() async {
    // 1. Immediately unhook hardware to prevent collecting off-duty points
    await _hardwareSub?.cancel();
    _hardwareSub = null;

    try {
      await adapter.stopTracking();
    } catch (_) {}

    final flushingWs = _currentWorkspaceId;
    final flushingUser = _currentUserId;

    // 2. Mark tracking inactive and reset duty context BEFORE flush so zero off-duty points can be accepted
    _isTrackingActive = false;
    _currentWorkspaceId = null;
    _currentUserId = null;
    _currentSessionId = null;
    _trackingStateController.add(false);

    // 3. Reset in-memory volatile point buffer.
    _pointBuffer.clear();
    _latestLocation = null;
    _locationController.add(null);
    _nearbyGeofences = [];
    _geofenceController.add([]);

    // 4. Transmit any remaining on-duty points with specific workspace and user scope
    if (flushingWs != null && flushingUser != null) {
      await flushQueue(workspaceId: flushingWs, userId: flushingUser);
    }
  }

  /// Ingests a raw GPS fix.
  /// Enforces Duty-Hours-Only Invariant: Points while OFF_DUTY or without verified user identity are immediately hard-dropped.
  Future<void> recordBreadcrumb(LocationPoint point) async {
    if (!_isTrackingActive || _currentWorkspaceId == null || _currentUserId == null) {
      // Hard drop off-duty points or unauthenticated telemetry
      return;
    }

    _latestLocation = point;
    _locationController.add(point);
    _pointBuffer.add(point);

    // Persist to durable SQLite queue
    if (db != null) {
      try {
        await db!.into(db!.cachedLocations).insert(
              CachedLocationsCompanion.insert(
                id: point.id,
                workspaceId: _currentWorkspaceId!,
                userId: _currentUserId!,
                sessionId: Value(_currentSessionId),
                latitude: point.latitude,
                longitude: point.longitude,
                accuracy: point.accuracy,
                speed: Value(point.speed),
                heading: Value(point.heading),
                batteryLevel: Value(point.batteryLevel),
                isCharging: Value(point.isCharging),
                activityType: Value(point.activityType),
                isMoving: Value(point.isMoving),
                recordedAt: point.recordedAt,
                status: const Value('PENDING'),
                attemptCount: const Value(0),
                createdAt: Value(DateTime.now()),
              ),
            );
      } catch (_) {
        // Fallback: in-memory buffer continues to retain point
      }
    }

    _evaluateGeofenceProximity(point);

    // Auto-flush batch when queue reaches 5 points
    if (_pointBuffer.length >= 5) {
      await flushQueue(workspaceId: _currentWorkspaceId, userId: _currentUserId);
    }
  }

  /// Flushes pending location points to server ingestion endpoint.
  /// Filters strictly by authenticated workspaceId and userId to prevent multi-tenant cross-contamination.
  /// Implements lossless per-point acknowledgment semantics.
  Future<void> flushQueue({String? workspaceId, String? userId}) async {
    final targetWorkspaceId = workspaceId ?? _currentWorkspaceId;
    final targetUserId = userId ?? _currentUserId;

    if (targetWorkspaceId == null || targetUserId == null) {
      // Cannot flush without authenticated tenant/user scope
      return;
    }

    if (db != null) {
      final pending = await (db!.select(db!.cachedLocations)
            ..where((l) =>
                l.workspaceId.equals(targetWorkspaceId) &
                l.userId.equals(targetUserId) &
                (l.status.equals('PENDING') | l.status.equals('FAILED')))
            ..orderBy([(l) => OrderingTerm.asc(l.recordedAt)])
            ..limit(30))
          .get();

      if (pending.isEmpty) {
        _pointBuffer.clear();
        return;
      }

      final batch = pending.map((l) {
        return LocationPoint(
          id: l.id,
          recordedAt: l.recordedAt,
          latitude: l.latitude,
          longitude: l.longitude,
          accuracy: l.accuracy,
          speed: l.speed ?? 0.0,
          heading: l.heading ?? 0.0,
          batteryLevel: l.batteryLevel ?? 1.0,
          isCharging: l.isCharging ?? false,
          activityType: l.activityType ?? 'still',
          isMoving: l.isMoving ?? false,
        );
      }).toList();

      final ids = pending.map((l) => l.id).toList();

      try {
        final response = await client.ingestLocationBreadcrumbs(batch);

        final acceptedSet = response.acceptedIds != null
            ? response.acceptedIds!.toSet()
            : (response.accepted == batch.length ? ids.toSet() : <String>{});
        final rejectedSet = response.rejectedIds?.toSet() ?? <String>{};

        // 1. Lossless per-point acknowledgment: delete ONLY server-accepted records
        if (acceptedSet.isNotEmpty) {
          await (db!.delete(db!.cachedLocations)..where((l) => l.id.isIn(acceptedSet))).go();
        }

        // 2. Never delete rejected records: mark them as REJECTED for auditability
        if (rejectedSet.isNotEmpty) {
          await (db!.update(db!.cachedLocations)..where((l) => l.id.isIn(rejectedSet))).write(
            CachedLocationsCompanion(
              status: const Value('REJECTED'),
              lastError: Value(response.reason ?? 'Server rejected point'),
            ),
          );
        }

        // 3. Unresolved / unacknowledged records remain safe: revert to PENDING for retry
        final unresolved = ids.where((id) => !acceptedSet.contains(id) && !rejectedSet.contains(id)).toList();
        if (unresolved.isNotEmpty) {
          await (db!.update(db!.cachedLocations)..where((l) => l.id.isIn(unresolved))).write(
            const CachedLocationsCompanion(
              status: Value('PENDING'),
            ),
          );
        }

        _pointBuffer.clear();
      } catch (_) {
        // Network error: points remain safely persisted in SQLite
      }
    } else {
      if (!_isTrackingActive || _pointBuffer.isEmpty) return;

      final batch = List<LocationPoint>.from(_pointBuffer);
      _pointBuffer.clear();

      try {
        await client.ingestLocationBreadcrumbs(batch);
      } catch (_) {
        // If offline and still on duty, restore into buffer (up to 200 items max)
        if (_isTrackingActive && _pointBuffer.length < 200) {
          _pointBuffer.insertAll(0, batch);
        }
      }
    }
  }

  /// Fetches active geofences for the current workspace.
  Future<void> refreshGeofences() async {
    if (!_isTrackingActive) return;
    try {
      final res = await client.listGeofences();
      _cachedGeofences = res.geofences.where((g) => g.isActive).toList();
      if (_latestLocation != null) {
        _evaluateGeofenceProximity(_latestLocation!);
      }
    } catch (_) {
      // Fallback: keep existing cached geofences if offline
    }
  }

  /// Evaluates distances from current point to cached workspace geofences using Haversine formula.
  void _evaluateGeofenceProximity(LocationPoint point) {
    if (_cachedGeofences.isEmpty) {
      _nearbyGeofences = [];
      _geofenceController.add([]);
      return;
    }

    final results = <CheckGeofenceProximityResponse>[];

    for (final geo in _cachedGeofences) {
      final distance = _calculateHaversineDistance(
        point.latitude,
        point.longitude,
        geo.latitude,
        geo.longitude,
      );

      final isInside = distance <= geo.radiusMeters;
      // Include geofences if inside or within 1000m
      if (distance <= 1000.0) {
        results.add(
          CheckGeofenceProximityResponse(
            geofenceId: geo.id,
            geofenceName: geo.name,
            distanceMeters: distance,
            radiusMeters: geo.radiusMeters,
            isInside: isInside,
          ),
        );
      }
    }

    results.sort((a, b) => a.distanceMeters.compareTo(b.distanceMeters));
    _nearbyGeofences = results;
    _geofenceController.add(results);
  }

  /// Calculates distance in meters between two coordinates.
  static double _calculateHaversineDistance(
    double lat1,
    double lon1,
    double lat2,
    double lon2,
  ) {
    const earthRadiusMeters = 6371000.0;
    final dLat = (lat2 - lat1) * (math.pi / 180.0);
    final dLon = (lon2 - lon1) * (math.pi / 180.0);

    final a = math.sin(dLat / 2) * math.sin(dLat / 2) +
        math.cos(lat1 * (math.pi / 180.0)) *
            math.cos(lat2 * (math.pi / 180.0)) *
            math.sin(dLon / 2) *
            math.sin(dLon / 2);

    final c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
    return earthRadiusMeters * c;
  }

  void dispose() {
    _hardwareSub?.cancel();
    _trackingStateController.close();
    _locationController.close();
    _geofenceController.close();
  }
}

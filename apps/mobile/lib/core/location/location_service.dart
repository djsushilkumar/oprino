import 'dart:async';
import 'dart:math' as math;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:oprino_api/oprino_api.dart';
import '../network/api_client_provider.dart';
import '../storage/secure_storage_service.dart';

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

final locationHardwareAdapterProvider = Provider<LocationHardwareAdapter>((ref) {
  final adapter = SimulatedLocationHardwareAdapter();
  ref.onDispose(() => adapter.dispose());
  return adapter;
});

final locationServiceProvider = Provider<LocationService>((ref) {
  final client = ref.watch(apiClientProvider);
  final adapter = ref.watch(locationHardwareAdapterProvider);
  final service = LocationService(client: client, adapter: adapter);
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

  bool _isTrackingActive = false;
  String? _currentWorkspaceId;
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
  });

  bool get isTrackingActive => _isTrackingActive;
  String? get currentWorkspaceId => _currentWorkspaceId;
  LocationPoint? get latestLocation => _latestLocation;
  List<CheckGeofenceProximityResponse> get nearbyGeofences => List.unmodifiable(_nearbyGeofences);
  List<LocationPoint> get pointBuffer => List.unmodifiable(_pointBuffer);

  Stream<bool> get trackingStateStream => _trackingStateController.stream;
  Stream<LocationPoint?> get locationStream => _locationController.stream;
  Stream<List<CheckGeofenceProximityResponse>> get geofenceProximityStream => _geofenceController.stream;

  /// Activates GPS pipeline when an employee punches in (Duty State: ON_DUTY).
  Future<void> startTracking({required String workspaceId}) async {
    if (_isTrackingActive && _currentWorkspaceId == workspaceId) return;

    _isTrackingActive = true;
    _currentWorkspaceId = workspaceId;
    _trackingStateController.add(true);

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
  }

  /// Synchronously terminates GPS tracking and unhooks hardware when punching out (Duty State: OFF_DUTY).
  /// Strictly respects Duty-Hours-Only Invariant: Zero off-duty breadcrumbs collected or sent.
  Future<void> stopTracking() async {
    _isTrackingActive = false;
    _currentWorkspaceId = null;
    _trackingStateController.add(false);

    await _hardwareSub?.cancel();
    _hardwareSub = null;

    await adapter.stopTracking();

    // Drop and clear any un-transmitted points to prevent leakage outside shift
    _pointBuffer.clear();
    _latestLocation = null;
    _locationController.add(null);
    _nearbyGeofences = [];
    _geofenceController.add([]);
  }

  /// Ingests a raw GPS fix.
  /// Enforces Duty-Hours-Only Invariant: Points while OFF_DUTY are immediately hard-dropped.
  Future<void> recordBreadcrumb(LocationPoint point) async {
    if (!_isTrackingActive || _currentWorkspaceId == null) {
      // Hard drop off-duty points
      return;
    }

    _latestLocation = point;
    _locationController.add(point);
    _pointBuffer.add(point);

    _evaluateGeofenceProximity(point);

    // Auto-flush batch when queue reaches 5 points
    if (_pointBuffer.length >= 5) {
      await flushQueue();
    }
  }

  /// Flushes pending location points to server ingestion endpoint.
  Future<void> flushQueue() async {
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

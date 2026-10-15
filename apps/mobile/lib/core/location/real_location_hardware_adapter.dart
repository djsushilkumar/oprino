import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import 'package:oprino_api/oprino_api.dart';
import '../storage/secure_storage_service.dart';
import 'location_service.dart';

/// Real device hardware location adapter using open-source `geolocator`.
/// Configured for battery-conscious, high-accuracy field tracking with
/// native Android foreground service and iOS background location capabilities.
class RealLocationHardwareAdapter implements LocationHardwareAdapter {
  final _controller = StreamController<LocationPoint>.broadcast();
  StreamSubscription<Position>? _positionSub;
  bool _isTracking = false;

  @override
  Stream<LocationPoint> get locationStream => _controller.stream;

  bool get isTracking => _isTracking;

  /// Validates location permissions and services before tracking starts.
  /// Throws descriptive exceptions to allow caller to handle permission workflows.
  Future<void> ensurePermissions() async {
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      throw LocationServiceDisabledException();
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        throw PermissionDeniedException('Location permissions are denied');
      }
    }

    if (permission == LocationPermission.deniedForever) {
      throw PermissionDeniedException(
        'Location permissions are permanently denied. Please enable them in system settings.',
      );
    }
  }

  @override
  Future<void> startTracking() async {
    if (_isTracking) return;

    await ensurePermissions();

    late final LocationSettings locationSettings;

    if (defaultTargetPlatform == TargetPlatform.android) {
      locationSettings = AndroidSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 15, // Minimum 15 meters movement before generating event
        intervalDuration: const Duration(seconds: 15),
        foregroundNotificationConfig: const ForegroundNotificationConfig(
          notificationTitle: 'Oprino Duty GPS Active',
          notificationText: 'Tracking authorized field operations',
          enableWakeLock: true,
          setOngoing: true,
        ),
      );
    } else if (defaultTargetPlatform == TargetPlatform.iOS) {
      locationSettings = AppleSettings(
        accuracy: LocationAccuracy.high,
        activityType: ActivityType.fitness,
        distanceFilter: 15,
        pauseLocationUpdatesAutomatically: false,
        showBackgroundLocationIndicator: true,
      );
    } else {
      locationSettings = const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 15,
      );
    }

    _isTracking = true;
    _positionSub?.cancel();
    _positionSub = Geolocator.getPositionStream(locationSettings: locationSettings)
        .listen(
      (position) {
        final point = _mapPositionToLocationPoint(position);
        if (!_controller.isClosed) {
          _controller.add(point);
        }
      },
      onError: (err) {
        debugPrint('[RealLocationAdapter] Position stream error: $err');
      },
    );
  }

  @override
  Future<void> stopTracking() async {
    _isTracking = false;
    await _positionSub?.cancel();
    _positionSub = null;
  }

  @override
  Future<LocationPoint?> getCurrentPosition() async {
    try {
      await ensurePermissions();
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 10),
        ),
      );
      return _mapPositionToLocationPoint(position);
    } catch (err) {
      debugPrint('[RealLocationAdapter] getCurrentPosition failed: $err');
      return null;
    }
  }

  LocationPoint _mapPositionToLocationPoint(Position pos) {
    return LocationPoint(
      id: SecureStorageService.generateUuidV4(),
      recordedAt: pos.timestamp,
      latitude: pos.latitude,
      longitude: pos.longitude,
      accuracy: pos.accuracy,
      speed: pos.speed >= 0 ? pos.speed : 0.0,
      heading: pos.heading >= 0 ? pos.heading : 0.0,
      batteryLevel: 1.0, // Default baseline when hardware battery sensor is unavailable
      isCharging: false,
      activityType: pos.speed > 1.5 ? 'moving' : 'still',
      isMoving: pos.speed > 0.8,
    );
  }

  void dispose() {
    _isTracking = false;
    _positionSub?.cancel();
    _controller.close();
  }
}

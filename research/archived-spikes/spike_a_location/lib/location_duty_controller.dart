import 'dart:async';

enum DutyTrackingState {
  offDuty,
  onDutyActive,
  onDutyStationary,
  stopping,
  expired,
}

class LocationBreadcrumb {
  final String id;
  final double latitude;
  final double longitude;
  final double accuracy;
  final DateTime timestamp;
  final bool isStationary;

  const LocationBreadcrumb({
    required this.id,
    required this.latitude,
    required this.longitude,
    required this.accuracy,
    required this.timestamp,
    this.isStationary = false,
  });
}

abstract class NativeLocationServiceAdapter {
  Future<void> startTracking();
  Future<void> stopTracking();
  Future<bool> isTracking();
  Future<void> purgeNativeQueueBefore(DateTime cutoff);
  Future<void> purgeNativeQueueAfter(DateTime cutoff);
}

class MockNativeLocationAdapter implements NativeLocationServiceAdapter {
  bool _active = false;
  final List<LocationBreadcrumb> nativeQueue = [];
  int stopLatencyMs = 12; // Simulated hardware stopping latency

  @override
  Future<void> startTracking() async {
    _active = true;
  }

  @override
  Future<void> stopTracking() async {
    final sw = Stopwatch()..start();
    await Future.delayed(Duration(milliseconds: stopLatencyMs));
    _active = false;
    sw.stop();
  }

  @override
  Future<bool> isTracking() async => _active;

  @override
  Future<void> purgeNativeQueueBefore(DateTime cutoff) async {
    nativeQueue.removeWhere((p) => p.timestamp.isBefore(cutoff));
  }

  @override
  Future<void> purgeNativeQueueAfter(DateTime cutoff) async {
    nativeQueue.removeWhere((p) => p.timestamp.isAfter(cutoff));
  }
}

class LocationDutyController {
  final NativeLocationServiceAdapter nativeAdapter;
  DutyTrackingState _state = DutyTrackingState.offDuty;
  DateTime? _shiftStartTime;
  DateTime? _shiftEndTime;
  DateTime? _punchOutTime;
  Timer? _deadlineWatchdogTimer;

  DutyTrackingState get state => _state;
  DateTime? get shiftStartTime => _shiftStartTime;
  DateTime? get punchOutTime => _punchOutTime;

  LocationDutyController({required this.nativeAdapter});

  /// Punch In: starts native tracking service and arms automatic duty deadline watchdog
  Future<void> punchIn({required DateTime startTime, Duration? maxDutyLimit}) async {
    if (_state != DutyTrackingState.offDuty) {
      throw StateError('Cannot punch in while already on duty');
    }

    _shiftStartTime = startTime;
    _punchOutTime = null;
    _state = DutyTrackingState.onDutyActive;

    await nativeAdapter.startTracking();

    // Arm automatic deadline watchdog (e.g. max 14 hours or explicit shift limit)
    final limit = maxDutyLimit ?? const Duration(hours: 14);
    _deadlineWatchdogTimer?.cancel();
    _deadlineWatchdogTimer = Timer(limit, () {
      triggerAutomaticDeadlineCutoff();
    });
  }

  /// Explicit Punch Out: stops native tracking, disarms timer, purges post-duty telemetry
  Future<int> punchOut({required DateTime timestamp}) async {
    if (_state == DutyTrackingState.offDuty) {
      return 0; // Already off duty
    }

    _state = DutyTrackingState.stopping;
    _punchOutTime = timestamp;
    _deadlineWatchdogTimer?.cancel();

    final stopwatch = Stopwatch()..start();

    // 1. Issue native GPS hardware stop request
    await nativeAdapter.stopTracking();
    stopwatch.stop();

    // 2. Immediate purge of any points buffered after the punch-out timestamp
    await nativeAdapter.purgeNativeQueueAfter(timestamp);

    _state = DutyTrackingState.offDuty;
    return stopwatch.elapsedMilliseconds;
  }

  /// Automatic Duty Deadline Cutoff: triggered by local timer if user forgets to punch out
  Future<int> triggerAutomaticDeadlineCutoff() async {
    final now = DateTime.now();
    _punchOutTime = now;
    _state = DutyTrackingState.stopping;

    final stopwatch = Stopwatch()..start();
    await nativeAdapter.stopTracking();
    stopwatch.stop();

    await nativeAdapter.purgeNativeQueueAfter(now);
    _state = DutyTrackingState.expired;

    return stopwatch.elapsedMilliseconds;
  }

  /// Ingest filter: ensures coordinates recorded outside duty boundaries are rejected
  static List<LocationBreadcrumb> filterIngestBatch({
    required List<LocationBreadcrumb> points,
    required DateTime shiftStart,
    required DateTime? punchOut,
  }) {
    return points.where((p) {
      if (p.timestamp.isBefore(shiftStart)) return false;
      if (punchOut != null && p.timestamp.isAfter(punchOut)) return false;
      return true;
    }).toList();
  }
}

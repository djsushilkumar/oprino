import 'package:spike_a_location/location_duty_controller.dart';
import 'package:test/test.dart';

void main() {
  group('SPIKE A — Background Location & Duty Privacy Validation', () {
    test('1. Explicit Punch Out -> Native Stop Latency & Post-Duty Purge', () async {
      final adapter = MockNativeLocationAdapter();
      final controller = LocationDutyController(nativeAdapter: adapter);

      final now = DateTime.now();
      await controller.punchIn(startTime: now);
      expect(controller.state, DutyTrackingState.onDutyActive);
      expect(await adapter.isTracking(), isTrue);

      // Simulate breadcrumbs queued during shift
      adapter.nativeQueue.addAll([
        LocationBreadcrumb(
          id: '1',
          latitude: 28.6139,
          longitude: 77.2090,
          accuracy: 10.0,
          timestamp: now.add(const Duration(minutes: 5)),
        ),
        LocationBreadcrumb(
          id: '2',
          latitude: 28.6145,
          longitude: 77.2095,
          accuracy: 12.0,
          timestamp: now.add(const Duration(minutes: 15)),
        ),
      ]);

      // Punch out at T + 20 min
      final punchOutTime = now.add(const Duration(minutes: 20));

      // Simulate a point arriving after punch out due to GPS hardware delay (T + 21 min)
      adapter.nativeQueue.add(
        LocationBreadcrumb(
          id: '3_post_duty',
          latitude: 28.6200,
          longitude: 77.2150,
          accuracy: 8.0,
          timestamp: now.add(const Duration(minutes: 21)),
        ),
      );
      expect(adapter.nativeQueue.length, 3);

      // Measure Punch Out Stop Execution Latency
      final latencyMs = await controller.punchOut(timestamp: punchOutTime);
      print('   [MEASURED] Punch-out stop command latency: ${latencyMs}ms');

      expect(controller.state, DutyTrackingState.offDuty);
      expect(await adapter.isTracking(), isFalse);

      // Verify post-duty telemetry point (id: 3_post_duty) was immediately purged
      expect(adapter.nativeQueue.length, 2);
      expect(adapter.nativeQueue.any((p) => p.id == '3_post_duty'), isFalse);
    });

    test('2. Automatic Duty Deadline Safety Watchdog Trigger & Cutoff Latency', () async {
      final adapter = MockNativeLocationAdapter();
      final controller = LocationDutyController(nativeAdapter: adapter);

      final now = DateTime.now();
      // Arm watchdog with 50ms test limit
      await controller.punchIn(startTime: now, maxDutyLimit: const Duration(milliseconds: 50));
      expect(controller.state, DutyTrackingState.onDutyActive);

      // Wait for watchdog timer to trigger
      await Future.delayed(const Duration(milliseconds: 80));

      expect(controller.state, DutyTrackingState.expired);
      expect(await adapter.isTracking(), isFalse);
      expect(controller.punchOutTime, isNotNull);
    });

    test('3. Server Ingestion Gate: Strict Rejection of Off-Duty Coordinates', () {
      final shiftStart = DateTime.parse('2026-10-05T09:00:00Z');
      final punchOut = DateTime.parse('2026-10-05T17:00:00Z');

      final rawBatch = [
        // Pre-shift point (08:55) -> Must be rejected
        LocationBreadcrumb(
          id: 'p_pre',
          latitude: 28.6,
          longitude: 77.2,
          accuracy: 10,
          timestamp: DateTime.parse('2026-10-05T08:55:00Z'),
        ),
        // Valid duty point (10:30) -> Accepted
        LocationBreadcrumb(
          id: 'p_valid_1',
          latitude: 28.61,
          longitude: 77.21,
          accuracy: 8,
          timestamp: DateTime.parse('2026-10-05T10:30:00Z'),
        ),
        // Valid duty point (16:45) -> Accepted
        LocationBreadcrumb(
          id: 'p_valid_2',
          latitude: 28.62,
          longitude: 77.22,
          accuracy: 9,
          timestamp: DateTime.parse('2026-10-05T16:45:00Z'),
        ),
        // Post-shift point (17:05) -> Must be rejected
        LocationBreadcrumb(
          id: 'p_post',
          latitude: 28.63,
          longitude: 77.23,
          accuracy: 11,
          timestamp: DateTime.parse('2026-10-05T17:05:00Z'),
        ),
      ];

      final filtered = LocationDutyController.filterIngestBatch(
        points: rawBatch,
        shiftStart: shiftStart,
        punchOut: punchOut,
      );

      expect(filtered.length, 2);
      expect(filtered.map((p) => p.id), containsAll(['p_valid_1', 'p_valid_2']));
      expect(filtered.any((p) => p.id == 'p_pre'), isFalse);
      expect(filtered.any((p) => p.id == 'p_post'), isFalse);
    });
  });
}

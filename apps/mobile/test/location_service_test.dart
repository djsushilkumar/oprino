import 'dart:convert';
import 'dart:typed_data';
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:oprino_api/oprino_api.dart';
import 'package:oprino_mobile/core/location/location_service.dart';

class _RecordingAdapter implements HttpClientAdapter {
  final List<RequestOptions> requests = [];
  final List<dynamic> geofencesToReturn;

  _RecordingAdapter({this.geofencesToReturn = const []});

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    requests.add(options);

    if (options.path == '/v1/telemetry/locations' && options.method == 'POST') {
      final body = options.data as Map<String, dynamic>;
      final locations = body['locations'] as List;
      final responseData = {
        'accepted': locations.length,
        'dropped': 0,
        'reason': null,
        'serverTimestamp': DateTime.now().toIso8601String(),
      };
      return ResponseBody.fromString(
        jsonEncode(responseData),
        200,
        headers: {
          Headers.contentTypeHeader: [Headers.jsonContentType],
        },
      );
    }

    if (options.path == '/v1/geofences' && options.method == 'GET') {
      final responseData = {
        'geofences': geofencesToReturn,
      };
      return ResponseBody.fromString(
        jsonEncode(responseData),
        200,
        headers: {
          Headers.contentTypeHeader: [Headers.jsonContentType],
        },
      );
    }

    return ResponseBody.fromString(
      jsonEncode({'message': 'Not found'}),
      404,
      headers: {
        Headers.contentTypeHeader: [Headers.jsonContentType],
      },
    );
  }

  @override
  void close({bool force = false}) {}
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late SimulatedLocationHardwareAdapter hardware;
  late _RecordingAdapter mockHttp;
  late OprinoApiClient client;
  late LocationService service;

  final sampleGeofence = {
    'id': 'g-test-100',
    'workspaceId': 'w-workspace-1',
    'name': 'Headquarters Office',
    'description': 'Main Tech Hub',
    'latitude': 28.6139,
    'longitude': 77.2090,
    'radiusMeters': 100.0,
    'geofenceType': 'OFFICE',
    'isActive': true,
    'createdBy': 'u-user-1',
    'createdAt': '2026-10-08T08:00:00.000Z',
    'updatedAt': '2026-10-08T08:00:00.000Z',
  };

  setUp(() {
    hardware = SimulatedLocationHardwareAdapter();
    mockHttp = _RecordingAdapter(geofencesToReturn: [sampleGeofence]);
    client = OprinoApiClient();
    client.dio.httpClientAdapter = mockHttp;
    service = LocationService(client: client, adapter: hardware);
  });

  tearDown(() {
    service.dispose();
    hardware.dispose();
  });

  group('LocationService Duty-Hours-Only Tracking Invariant (Phase 02C)', () {
    test('1. Strictly drops off-duty location fixes: 0 network calls, 0 buffer retention', () async {
      expect(service.isTrackingActive, isFalse);
      expect(service.currentWorkspaceId, isNull);

      final point = LocationPoint(
        id: 'loc-off-duty-1',
        recordedAt: DateTime.now(),
        latitude: 28.6139,
        longitude: 77.2090,
        accuracy: 10.0,
      );

      // Attempt to record point while off-duty
      await service.recordBreadcrumb(point);

      expect(service.pointBuffer, isEmpty);
      expect(service.latestLocation, isNull);
      expect(mockHttp.requests, isEmpty);
    });

    test('2. Starts tracking upon ON_DUTY shift activation and collects breadcrumbs', () async {
      await service.startTracking(workspaceId: 'w-workspace-1');

      expect(service.isTrackingActive, isTrue);
      expect(service.currentWorkspaceId, equals('w-workspace-1'));

      final point1 = LocationPoint(
        id: 'loc-on-duty-1',
        recordedAt: DateTime.now(),
        latitude: 28.6140,
        longitude: 77.2091,
        accuracy: 8.0,
      );

      await service.recordBreadcrumb(point1);

      expect(service.latestLocation?.id, equals('loc-on-duty-1'));
      expect(service.pointBuffer.any((p) => p.id == 'loc-on-duty-1'), isTrue);
    });

    test('3. Evaluates geofence proximity correctly when inside and outside radius', () async {
      await service.startTracking(workspaceId: 'w-workspace-1');
      await service.refreshGeofences();

      // Point exactly at HQ Office coordinates (28.6139, 77.2090) -> distance ~ 0m, inside
      final insidePoint = LocationPoint(
        id: 'loc-inside',
        recordedAt: DateTime.now(),
        latitude: 28.6139,
        longitude: 77.2090,
        accuracy: 5.0,
      );
      await service.recordBreadcrumb(insidePoint);

      expect(service.nearbyGeofences, isNotEmpty);
      final hqProximity = service.nearbyGeofences.firstWhere((g) => g.geofenceId == 'g-test-100');
      expect(hqProximity.isInside, isTrue);
      expect(hqProximity.distanceMeters, lessThan(10.0));

      // Point ~ 400m away -> outside 100m radius
      final outsidePoint = LocationPoint(
        id: 'loc-outside',
        recordedAt: DateTime.now(),
        latitude: 28.6175,
        longitude: 77.2090,
        accuracy: 5.0,
      );
      await service.recordBreadcrumb(outsidePoint);

      final hqOutside = service.nearbyGeofences.firstWhere((g) => g.geofenceId == 'g-test-100');
      expect(hqOutside.isInside, isFalse);
      expect(hqOutside.distanceMeters, greaterThan(100.0));
    });

    test('4. Flushes location batches to ingestion API endpoint and unhooks synchronously on punch out', () async {
      await service.startTracking(workspaceId: 'w-workspace-1');

      // Record 3 points
      for (int i = 0; i < 3; i++) {
        await service.recordBreadcrumb(
          LocationPoint(
            id: 'loc-batch-$i',
            recordedAt: DateTime.now(),
            latitude: 28.6140 + (i * 0.0001),
            longitude: 77.2091 + (i * 0.0001),
            accuracy: 6.0,
          ),
        );
      }

      await service.flushQueue();

      // Verify POST /v1/telemetry/locations was invoked with batch
      final ingestRequests = mockHttp.requests.where((r) => r.path == '/v1/telemetry/locations').toList();
      expect(ingestRequests, isNotEmpty);
      final lastReqData = ingestRequests.last.data as Map<String, dynamic>;
      final sentLocations = lastReqData['locations'] as List;
      expect(sentLocations.length, greaterThanOrEqualTo(3));

      // Synchronously stop tracking (Punch Out transition)
      await service.stopTracking();

      expect(service.isTrackingActive, isFalse);
      expect(service.currentWorkspaceId, isNull);
      expect(service.latestLocation, isNull);
      expect(service.pointBuffer, isEmpty);
      expect(service.nearbyGeofences, isEmpty);

      // Verify points emitted afterwards are dropped immediately
      await service.recordBreadcrumb(
        LocationPoint(
          id: 'loc-post-duty',
          recordedAt: DateTime.now(),
          latitude: 28.6140,
          longitude: 77.2091,
          accuracy: 5.0,
        ),
      );
      expect(service.pointBuffer, isEmpty);
    });
  });
}

import 'dart:convert';
import 'dart:typed_data';
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:drift/native.dart';
import 'package:oprino_api/oprino_api.dart';
import 'package:oprino_mobile/core/database/database.dart';
import 'package:oprino_mobile/core/location/location_service.dart';
import 'package:oprino_mobile/core/config/app_config.dart';
import 'package:oprino_mobile/core/sync/sync_service.dart';

class _RecordingAdapter implements HttpClientAdapter {
  final List<RequestOptions> requests = [];
  final List<dynamic> geofencesToReturn;
  bool simulateNetworkError = false;
  Map<String, dynamic>? Function(RequestOptions options)? onTelemetryIngest;

  _RecordingAdapter({this.geofencesToReturn = const []});

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    if (simulateNetworkError) {
      throw DioException(
        requestOptions: options,
        error: 'Simulated network offline',
        type: DioExceptionType.connectionError,
      );
    }
    requests.add(options);

    if (options.path == '/v1/telemetry/locations' && options.method == 'POST') {
      final body = options.data as Map<String, dynamic>;
      final locations = body['locations'] as List;

      Map<String, dynamic> responseData;
      if (onTelemetryIngest != null) {
        final custom = onTelemetryIngest!(options);
        responseData = custom ?? {
          'accepted': locations.length,
          'dropped': 0,
          'reason': null,
          'serverTimestamp': DateTime.now().toIso8601String(),
          'acceptedIds': locations.map((l) => l['id']).toList(),
          'rejectedIds': <String>[],
        };
      } else {
        responseData = {
          'accepted': locations.length,
          'dropped': 0,
          'reason': null,
          'serverTimestamp': DateTime.now().toIso8601String(),
          'acceptedIds': locations.map((l) => l['id']).toList(),
          'rejectedIds': <String>[],
        };
      }

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

class FaultyLocationHardwareAdapter extends SimulatedLocationHardwareAdapter {
  bool shouldThrowOnStart = false;

  @override
  Future<void> startTracking() async {
    if (shouldThrowOnStart) {
      throw Exception('Location permission denied by user (PERMISSION_DENIED)');
    }
    await super.startTracking();
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late FaultyLocationHardwareAdapter hardware;
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
    hardware = FaultyLocationHardwareAdapter();
    mockHttp = _RecordingAdapter(geofencesToReturn: [sampleGeofence]);
    client = OprinoApiClient(baseUrl: AppConfig.localPilot.apiBaseUrl);
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

    test('2. Requires verified identity and starts tracking upon ON_DUTY shift activation', () async {
      // Must reject empty workspaceId or userId
      expect(
        () => service.startTracking(workspaceId: '', userId: 'u-user-1'),
        throwsArgumentError,
      );
      expect(
        () => service.startTracking(workspaceId: 'w-workspace-1', userId: ''),
        throwsArgumentError,
      );

      await service.startTracking(workspaceId: 'w-workspace-1', userId: 'u-user-1');

      expect(service.isTrackingActive, isTrue);
      expect(service.currentWorkspaceId, equals('w-workspace-1'));
      expect(service.currentUserId, equals('u-user-1'));

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

    test('3. Permission denied during tracking startup fails safe (tracking immediately inactive)', () async {
      hardware.shouldThrowOnStart = true;

      await expectLater(
        service.startTracking(workspaceId: 'w-workspace-1', userId: 'u-user-1'),
        throwsA(isA<Exception>()),
      );

      // Invariant: Fail-safe cleanup ensures isTrackingActive is reset to false
      expect(service.isTrackingActive, isFalse);
      expect(service.currentWorkspaceId, isNull);
      expect(service.currentUserId, isNull);
    });

    test('4. Evaluates geofence proximity correctly when inside and outside radius', () async {
      await service.startTracking(workspaceId: 'w-workspace-1', userId: 'u-user-1');
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

    test('5. Tracking stop immediately at punch-out: Zero off-duty points collected', () async {
      await service.startTracking(workspaceId: 'w-workspace-1', userId: 'u-user-1');

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

      // Synchronously stop tracking (Punch Out transition)
      await service.stopTracking();

      expect(service.isTrackingActive, isFalse);
      expect(service.currentWorkspaceId, isNull);
      expect(service.currentUserId, isNull);
      expect(service.latestLocation, isNull);
      expect(service.pointBuffer, isEmpty);
      expect(service.nearbyGeofences, isEmpty);

      // Invariant: Points emitted after punch-out are immediately dropped
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
      expect(service.latestLocation, isNull);
    });
  });

  group('Durable Offline SQLite GPS Queue & Synchronization Hardening', () {
    late AppDatabase db;
    late LocationService dbService;
    late SyncService syncService;

    setUp(() {
      db = AppDatabase(NativeDatabase.memory());
      dbService = LocationService(
        client: client,
        adapter: hardware,
        db: db,
      );
      syncService = SyncService(db: db, client: client);
    });

    tearDown(() async {
      dbService.dispose();
      await db.close();
    });

    test('1. On-duty GPS points persist directly to SQLite CachedLocations table with verified identity', () async {
      await dbService.startTracking(
        workspaceId: 'w-workspace-1',
        userId: 'u-emp-1',
        sessionId: 's-sess-1',
      );

      final pt = LocationPoint(
        id: 'loc-sqlite-1',
        recordedAt: DateTime.now(),
        latitude: 28.6145,
        longitude: 77.2095,
        accuracy: 6.5,
        speed: 1.5,
        heading: 90.0,
        batteryLevel: 0.88,
        isCharging: false,
        activityType: 'walking',
        isMoving: true,
      );

      await dbService.recordBreadcrumb(pt);

      final rows = await db.select(db.cachedLocations).get();
      expect(rows, hasLength(2)); // initial fix + pt
      final savedPt = rows.firstWhere((r) => r.id == 'loc-sqlite-1');
      expect(savedPt.workspaceId, equals('w-workspace-1'));
      expect(savedPt.userId, equals('u-emp-1'));
      expect(savedPt.sessionId, equals('s-sess-1'));
      expect(savedPt.status, equals('PENDING'));
    });

    test('2. Offline punch-out followed by network recovery preserves and drains points', () async {
      mockHttp.requests.clear();

      await dbService.startTracking(
        workspaceId: 'w-workspace-1',
        userId: 'u-emp-1',
        sessionId: 's-sess-1',
      );

      await dbService.recordBreadcrumb(
        LocationPoint(
          id: 'loc-offline-1',
          recordedAt: DateTime.now(),
          latitude: 28.6140,
          longitude: 77.2090,
          accuracy: 8.0,
        ),
      );
      await dbService.recordBreadcrumb(
        LocationPoint(
          id: 'loc-offline-2',
          recordedAt: DateTime.now(),
          latitude: 28.6142,
          longitude: 77.2092,
          accuracy: 7.5,
        ),
      );

      expect(await db.select(db.cachedLocations).get(), hasLength(3)); // initial + 2

      // Simulate network offline during punch out
      mockHttp.simulateNetworkError = true;
      await dbService.stopTracking();

      // Tracking terminated immediately
      expect(dbService.isTrackingActive, isFalse);

      // Invariant: Points recorded during valid duty session are preserved in SQLite
      final preservedRows = await db.select(db.cachedLocations).get();
      expect(preservedRows, hasLength(3));

      // Network recovers: Sync drains pending points
      mockHttp.simulateNetworkError = false;
      final flushedCount = await syncService.flushPendingLocations(
        workspaceId: 'w-workspace-1',
        userId: 'u-emp-1',
      );
      expect(flushedCount, equals(3));

      final remainingRows = await db.select(db.cachedLocations).get();
      expect(remainingRows, isEmpty);
    });

    test('3. Partial accepted/dropped response: Only accepted points deleted; rejected/unacknowledged preserved', () async {
      await dbService.startTracking(
        workspaceId: 'w-workspace-1',
        userId: 'u-emp-1',
        sessionId: 's-sess-1',
      );

      // Record 3 distinct points
      final ptValid = LocationPoint(
        id: 'loc-valid-ack',
        recordedAt: DateTime.now(),
        latitude: 28.6140,
        longitude: 77.2090,
        accuracy: 8.0,
      );
      final ptRejected = LocationPoint(
        id: 'loc-rejected-bad',
        recordedAt: DateTime.now(),
        latitude: 28.6142,
        longitude: 77.2092,
        accuracy: 95.0, // bad accuracy
      );
      final ptUnacknowledged = LocationPoint(
        id: 'loc-unacknowledged',
        recordedAt: DateTime.now(),
        latitude: 28.6144,
        longitude: 77.2094,
        accuracy: 9.0,
      );

      await dbService.recordBreadcrumb(ptValid);
      await dbService.recordBreadcrumb(ptRejected);
      await dbService.recordBreadcrumb(ptUnacknowledged);

      // Configure server mock for partial response
      mockHttp.onTelemetryIngest = (options) {
        return {
          'accepted': 1,
          'dropped': 1,
          'reason': 'QUALITY_FILTER',
          'serverTimestamp': DateTime.now().toIso8601String(),
          'acceptedIds': ['loc-valid-ack'],
          'rejectedIds': ['loc-rejected-bad'],
          // 'loc-unacknowledged' omitted intentionally
        };
      };

      // Flush batch
      await syncService.flushPendingLocations(
        workspaceId: 'w-workspace-1',
        userId: 'u-emp-1',
      );

      final remaining = await db.select(db.cachedLocations).get();

      // Accepted point MUST be deleted
      expect(remaining.any((r) => r.id == 'loc-valid-ack'), isFalse);

      // Rejected point MUST NEVER be deleted; must be marked REJECTED
      final rejectedRow = remaining.firstWhere((r) => r.id == 'loc-rejected-bad');
      expect(rejectedRow.status, equals('REJECTED'));
      expect(rejectedRow.lastError, equals('QUALITY_FILTER'));

      // Unacknowledged point MUST NEVER be deleted; must revert to PENDING for retry
      final unackRow = remaining.firstWhere((r) => r.id == 'loc-unacknowledged');
      expect(unackRow.status, equals('PENDING'));
    });

    test('4. Two companies using one device: Strict tenant workspace isolation', () async {
      // Company Alpha (Workspace A)
      await syncService.queueLocation(
        id: 'loc-comp-alpha-1',
        workspaceId: 'w-alpha',
        userId: 'u-shared-user',
        latitude: 28.6140,
        longitude: 77.2090,
        accuracy: 5.0,
        recordedAt: DateTime.now(),
      );

      // Company Beta (Workspace B)
      await syncService.queueLocation(
        id: 'loc-comp-beta-1',
        workspaceId: 'w-beta',
        userId: 'u-shared-user',
        latitude: 19.0760,
        longitude: 72.8777,
        accuracy: 6.0,
        recordedAt: DateTime.now(),
      );

      mockHttp.requests.clear();

      // Flush Company Alpha only
      final alphaFlushed = await syncService.flushPendingLocations(
        workspaceId: 'w-alpha',
        userId: 'u-shared-user',
      );
      expect(alphaFlushed, equals(1));

      // Verify request payload contained ONLY Company Alpha point
      final alphaReq = mockHttp.requests.last.data as Map<String, dynamic>;
      final alphaLocations = alphaReq['locations'] as List;
      expect(alphaLocations, hasLength(1));
      expect(alphaLocations.first['id'], equals('loc-comp-alpha-1'));

      // Invariant: Company Beta point remains untouched in SQLite
      final betaRow = await (db.select(db.cachedLocations)..where((l) => l.id.equals('loc-comp-beta-1'))).getSingle();
      expect(betaRow.status, equals('PENDING'));
      expect(betaRow.workspaceId, equals('w-beta'));
    });

    test('5. Logout/login as another user with queued GPS data: Strict user identity isolation', () async {
      // User Jane logs in, records points for Workspace Alpha
      await syncService.queueLocation(
        id: 'loc-user-jane-1',
        workspaceId: 'w-alpha',
        userId: 'u-jane',
        latitude: 28.6140,
        longitude: 77.2090,
        accuracy: 5.0,
        recordedAt: DateTime.now(),
      );

      // Jane logs out. User John logs in to same device/workspace.
      mockHttp.requests.clear();

      // John triggers sync for his own account
      final johnFlushed = await syncService.flushPendingLocations(
        workspaceId: 'w-alpha',
        userId: 'u-john',
      );
      expect(johnFlushed, equals(0)); // 0 points for John
      expect(mockHttp.requests, isEmpty); // Zero requests sent

      // Jane's pending points remain preserved in SQLite without leakage
      final janeRows = await (db.select(db.cachedLocations)..where((l) => l.userId.equals('u-jane'))).get();
      expect(janeRows, hasLength(1));
      expect(janeRows.first.id, equals('loc-user-jane-1'));
    });

    test('6. Queue draining beyond 30 points: Bounded multi-batch drainage', () async {
      // Insert 65 queued points (requires 3 batches: 30 + 30 + 5)
      final now = DateTime.now();
      for (int i = 0; i < 65; i++) {
        await syncService.queueLocation(
          id: 'loc-drain-$i',
          workspaceId: 'w-drain',
          userId: 'u-drain-user',
          latitude: 28.6140 + (i * 0.0001),
          longitude: 77.2090 + (i * 0.0001),
          accuracy: 5.0,
          recordedAt: now.add(Duration(seconds: i)),
        );
      }

      final initialCount = await (db.select(db.cachedLocations)..where((l) => l.userId.equals('u-drain-user'))).get();
      expect(initialCount, hasLength(65));

      // Run bounded drain
      final totalDrained = await syncService.drainPendingLocations(
        workspaceId: 'w-drain',
        userId: 'u-drain-user',
        maxBatches: 10,
        batchSize: 30,
      );

      expect(totalDrained, equals(65));

      final remainingCount = await (db.select(db.cachedLocations)..where((l) => l.userId.equals('u-drain-user'))).get();
      expect(remainingCount, isEmpty);
    });
  });
}

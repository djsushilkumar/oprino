// ignore_for_file: deprecated_member_use
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:drift/native.dart';
import 'package:drift/drift.dart' hide isNull, isNotNull;
import 'package:dio/dio.dart';
import 'package:oprino_mobile/core/database/database.dart';
import 'package:oprino_mobile/core/network/media_upload_service.dart';
import 'package:oprino_mobile/core/sync/sync_service.dart';
import 'package:oprino_mobile/features/attendance/presentation/widgets/attendance_selfie_sheet.dart';
import 'package:oprino_mobile/features/tasks/presentation/widgets/proof_viewer_sheet.dart';
import 'package:oprino_api/oprino_api.dart';

class _MockApiClient extends OprinoApiClient {
  _MockApiClient() : super(dio: Dio());

  bool punchInCalled = false;
  String? lastPunchInSelfieKey;
  bool confirmProofCalled = false;
  String? lastConfirmProofFileKey;
  bool verifyTaskCalled = false;
  String? lastVerifyAction;

  @override
  Future<MediaUploadUrlResponse> requestAttendanceSelfieUploadUrl({
    String fileName = 'selfie.jpg',
  }) async {
    return const MediaUploadUrlResponse(
      uploadUrl: 'https://storage.staging.oprino.com/selfies/upload?sig=abc',
      fileKey: 'ws-1/attendance/user-1/selfie_123.jpg',
      expiresInSeconds: 600,
    );
  }

  @override
  Future<MediaUploadUrlResponse> requestMediaUploadUrl({
    required String taskId,
    String? visitId,
    required String proofType,
    required String fileName,
    required String mimeType,
    int? fileSizeBytes,
  }) async {
    return MediaUploadUrlResponse(
      uploadUrl: 'https://storage.staging.oprino.com/proofs/upload?sig=xyz',
      fileKey: 'ws-1/proofs/$taskId/proof_123.jpg',
      expiresInSeconds: 600,
    );
  }

  @override
  Future<MediaDownloadUrlResponse> requestMediaDownloadUrl({
    required String fileKey,
  }) async {
    return MediaDownloadUrlResponse(
      downloadUrl: 'https://storage.staging.oprino.com/download/$fileKey?token=short_lived',
      fileKey: fileKey,
      expiresInSeconds: 900,
    );
  }

  @override
  Future<AttendanceSessionResponse> punchIn({
    required String idempotencyKey,
    String? shiftId,
    String? note,
    String? selfieMediaKey,
    double? latitude,
    double? longitude,
    double? accuracy,
  }) async {
    punchInCalled = true;
    lastPunchInSelfieKey = selfieMediaKey;
    return AttendanceSessionResponse(
      id: 'session-1',
      workspaceId: 'ws-1',
      userId: 'user-1',
      status: 'ON_DUTY',
      punchInTime: DateTime.now(),
      punchInLatitude: latitude,
      punchInLongitude: longitude,
      punchInAccuracy: accuracy,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
  }

  bool punchOutCalled = false;

  @override
  Future<AttendanceSessionResponse> punchOut({
    required String idempotencyKey,
    String? note,
  }) async {
    punchOutCalled = true;
    return AttendanceSessionResponse(
      id: 'session-1',
      workspaceId: 'ws-1',
      userId: 'user-1',
      status: 'OFF_DUTY',
      punchInTime: DateTime.now().subtract(const Duration(hours: 8)),
      punchOutTime: DateTime.now(),
      createdAt: DateTime.now().subtract(const Duration(hours: 8)),
      updatedAt: DateTime.now(),
    );
  }

  @override
  Future<TaskProof> confirmMediaUpload({
    required String taskId,
    String? visitId,
    required String proofType,
    required String fileKey,
    int? fileSizeBytes,
    String? mimeType,
    String? signerName,
    String? signerPhone,
    Map<String, dynamic>? watermarkMetadata,
    String? notes,
  }) async {
    confirmProofCalled = true;
    lastConfirmProofFileKey = fileKey;
    return TaskProof(
      id: 'proof-1',
      workspaceId: 'ws-1',
      taskId: taskId,
      userId: 'user-1',
      proofType: proofType,
      fileKey: fileKey,
      notes: notes,
      createdAt: DateTime.now(),
    );
  }

  @override
  Future<TaskResponse> verifyTask({
    required String taskId,
    required String action,
    String? notes,
  }) async {
    verifyTaskCalled = true;
    lastVerifyAction = action;
    return TaskResponse(
      id: taskId,
      workspaceId: 'ws-1',
      title: 'Task 1',
      status: 'VERIFIED',
      simplifiedStatus: 'COMPLETED',
      priority: 'MEDIUM',
      version: 2,
      createdBy: 'user-1',
      assignees: const [],
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
  }
}

class _MockFailingApiClient extends _MockApiClient {
  @override
  Future<MediaUploadUrlResponse> requestAttendanceSelfieUploadUrl({
    String fileName = 'selfie.jpg',
  }) async {
    throw DioException(
      requestOptions: RequestOptions(path: '/v1/media/attendance-selfie-url'),
      error: 'Network connection failed (offline)',
    );
  }

  @override
  Future<MediaUploadUrlResponse> requestMediaUploadUrl({
    required String taskId,
    String? visitId,
    required String proofType,
    required String fileName,
    required String mimeType,
    int? fileSizeBytes,
  }) async {
    throw DioException(
      requestOptions: RequestOptions(path: '/v1/media/upload-url'),
      error: 'Network connection failed (offline)',
    );
  }
}

class _MockRejectionApiClient extends _MockApiClient {
  @override
  Future<AttendanceSessionResponse> punchIn({
    required String idempotencyKey,
    String? shiftId,
    String? note,
    String? selfieMediaKey,
    double? latitude,
    double? longitude,
    double? accuracy,
  }) async {
    throw DioException(
      requestOptions: RequestOptions(path: '/v1/attendance/punch-in'),
      message: 'Outside assigned work perimeter',
      response: Response(
        statusCode: 422,
        requestOptions: RequestOptions(path: '/v1/attendance/punch-in'),
        data: {'error': 'GEOFENCE_REJECTED', 'message': 'Outside assigned work perimeter'},
      ),
    );
  }
}

class _TestMediaUploadService extends MediaUploadService {
  _TestMediaUploadService({required super.client, super.baseDirectory});

  @override
  Future<void> uploadBinaryBytes({
    required String uploadUrl,
    required List<int> bytes,
    String contentType = 'image/jpeg',
  }) async {
    // Simulated instant direct upload without external sockets
  }

}

class _WidgetFailingMediaUploadService extends _TestMediaUploadService {
  _WidgetFailingMediaUploadService({required super.client, super.baseDirectory});

  @override
  Future<String> savePendingImageFile({
    required String prefix,
    required List<int> bytes,
  }) async {
    return 'pending_media/${prefix}_test_local.jpg';
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late AppDatabase testDb;
  late _MockApiClient mockClient;
  late _TestMediaUploadService mediaService;
  late SyncService syncService;

  setUp(() {
    testDb = AppDatabase(NativeDatabase.memory());
    mockClient = _MockApiClient();
    mediaService = _TestMediaUploadService(client: mockClient, baseDirectory: Directory.systemTemp);
    syncService = SyncService(db: testDb, client: mockClient, mediaService: mediaService, autoProcessOutbox: false);
  });

  tearDown(() async {
    await testDb.close();
  });

  group('Phase 4A: Mobile Media Storage & Offline Reliability Tests', () {
    test('1. MediaUploadService generates valid synthetic JPEG bytes and parses responses', () {
      final bytes = MediaUploadService.createSyntheticJpeg();
      expect(bytes.isNotEmpty, isTrue);
      // Valid JPEG Magic bytes: FF D8 ... FF D9
      expect(bytes.first, equals(0xFF));
      expect(bytes[1], equals(0xD8));
      expect(bytes[bytes.length - 2], equals(0xFF));
      expect(bytes.last, equals(0xD9));
    });

    test('2. MediaUploadService saves pending image locally and safely deletes after delivery', () async {
      final bytes = MediaUploadService.createSyntheticJpeg();
      final filePath = await mediaService.savePendingImageFile(prefix: 'test_selfie', bytes: bytes);

      final file = File(filePath);
      expect(await file.exists(), isTrue);
      expect(await file.length(), equals(bytes.length));

      await mediaService.deleteLocalMediaFile(filePath);
      expect(await file.exists(), isFalse);
    });

    test('3. MediaUploadService requests attendance selfie and proof upload URLs', () async {
      final selfieRes = await mediaService.requestAttendanceSelfieUploadUrl(fileName: 'selfie.jpg');
      expect(selfieRes.uploadUrl, contains('https://storage.staging.oprino.com/selfies/upload'));
      expect(selfieRes.fileKey, equals('ws-1/attendance/user-1/selfie_123.jpg'));
      expect(selfieRes.expiresInSeconds, equals(600));

      final proofRes = await mediaService.requestTaskProofUploadUrl(
        taskId: 'task-99',
        proofType: 'PHOTO',
        fileName: 'proof.jpg',
      );
      expect(proofRes.uploadUrl, contains('https://storage.staging.oprino.com/proofs/upload'));
      expect(proofRes.fileKey, equals('ws-1/proofs/task-99/proof_123.jpg'));

      final downloadRes = await mediaService.requestMediaDownloadUrl(fileKey: proofRes.fileKey);
      expect(downloadRes.downloadUrl, contains('short_lived'));
      expect(downloadRes.expiresInSeconds, equals(900));
    });

    test('4. SyncService: Queues offline punch-in with local file, syncs binary, calls punch-in, and cleans up', () async {
      final bytes = MediaUploadService.createSyntheticJpeg();
      final localPath = await mediaService.savePendingImageFile(prefix: 'offline_punch', bytes: bytes);
      expect(await File(localPath).exists(), isTrue);

      await syncService.queuePunchIn(
        workspaceId: 'ws-1',
        localFilePath: localPath,
        latitude: 28.6139,
        longitude: 77.2090,
        accuracy: 5.0,
      );

      // Verify outbox mutation was queued
      final mutations = await testDb.select(testDb.outboxMutations).get();
      expect(mutations.length, equals(1));
      expect(mutations.first.mutationType, equals('PUNCH_IN'));
      expect(mutations.first.payload, contains('offline_punch'));

      // Verify optimistic duty state
      final attendance = await testDb.select(testDb.cachedAttendance).get();
      expect(attendance.first.dutyState, equals('ON_DUTY'));

      // Run sync processing
      await syncService.processOutbox();

      // Verify API client was called with confirmed selfie key
      expect(mockClient.punchInCalled, isTrue);
      expect(mockClient.lastPunchInSelfieKey, equals('ws-1/attendance/user-1/selfie_123.jpg'));

      // Verify outbox mutation removed on success
      final remainingMutations = await testDb.select(testDb.outboxMutations).get();
      expect(remainingMutations.isEmpty, isTrue);

      // Verify local file cleaned up to prevent biometric data accumulation on device
      expect(await File(localPath).exists(), isFalse);
    });

    test('5. SyncService: Queues offline proof confirmation, syncs binary, calls confirm, and cleans up', () async {
      final bytes = MediaUploadService.createSyntheticJpeg();
      final localPath = await mediaService.savePendingImageFile(prefix: 'offline_task_proof', bytes: bytes);
      expect(await File(localPath).exists(), isTrue);

      await syncService.queueProofConfirmation(
        workspaceId: 'ws-1',
        taskId: 'task-123',
        userId: 'user-1',
        proofType: 'PHOTO',
        fileKey: 'pending_key',
        localFilePath: localPath,
        isBinaryUploaded: false,
        notes: 'Filter installed',
      );

      final proofsBefore = await testDb.select(testDb.cachedTaskProofs).get();
      expect(proofsBefore.length, equals(1));
      expect(proofsBefore.first.fileKey, equals('pending_key'));

      // Run sync processing
      await syncService.processOutbox();

      // Verify confirm was called with newly allocated durable fileKey
      expect(mockClient.confirmProofCalled, isTrue);
      expect(mockClient.lastConfirmProofFileKey, equals('ws-1/proofs/task-123/proof_123.jpg'));

      // Verify cached proof updated with server key
      final proofsAfter = await testDb.select(testDb.cachedTaskProofs).get();
      expect(proofsAfter.first.fileKey, equals('ws-1/proofs/task-123/proof_123.jpg'));

      // Verify local file cleaned up
      expect(await File(localPath).exists(), isFalse);
    });

    test('6. SyncService: Queues manager task verification and updates local task status', () async {
      await testDb.into(testDb.cachedTasks).insert(
            CachedTasksCompanion.insert(
              id: 'task-123',
              workspaceId: 'ws-1',
              title: 'Refrigeration Repair',
              status: 'COMPLETED',
              simplifiedStatus: 'COMPLETED',
              priority: 'HIGH',
              createdAt: DateTime.now(),
              updatedAt: DateTime.now(),
            ),
          );

      await syncService.queueTaskVerification(
        workspaceId: 'ws-1',
        taskId: 'task-123',
        action: 'APPROVE',
        notes: 'Quality verified by supervisor',
      );

      // Optimistically verified
      final task = await (testDb.select(testDb.cachedTasks)..where((t) => t.id.equals('task-123'))).getSingle();
      expect(task.status, equals('VERIFIED'));
      expect(task.verifierName, equals('Supervisor'));

      // Process outbox
      await syncService.processOutbox();
      expect(mockClient.verifyTaskCalled, isTrue);
      expect(mockClient.lastVerifyAction, equals('APPROVE'));
    });

    testWidgets('7. AttendanceSelfieSheet: Live capture, geotag banner, and online upload flow', (WidgetTester tester) async {
      String? confirmedKey;
      String? confirmedLocal;

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            mediaUploadServiceProvider.overrideWithValue(mediaService),
          ],
          child: MaterialApp(
            home: Scaffold(
              body: AttendanceSelfieSheet(
                workspaceId: 'ws-1',
                userId: 'user-1',
                currentLatitude: 28.6139,
                currentLongitude: 77.2090,
                accuracy: 10.0,
                onConfirm: ({
                  String? selfieMediaKey,
                  String? localFilePath,
                  required double? latitude,
                  required double? longitude,
                  required double? accuracy,
                  required DateTime timestamp,
                }) {
                  confirmedKey = selfieMediaKey;
                  confirmedLocal = localFilePath;
                },
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Attendance Selfie Verification'), findsOneWidget);
      expect(find.text('Live Camera'), findsOneWidget);
      expect(find.text('28.6139, 77.2090 (±10m)'), findsOneWidget);

      // Tap Capture Selfie
      await tester.tap(find.text('Capture Selfie'));
      await tester.pumpAndSettle();

      expect(find.text('Captured'), findsOneWidget);
      expect(find.text('Confirm & Punch In'), findsOneWidget);

      // Confirm & Punch In (triggers online upload)
      await tester.tap(find.text('Confirm & Punch In'));
      await tester.pumpAndSettle();

      expect(confirmedKey, equals('ws-1/attendance/user-1/selfie_123.jpg'));
      expect(confirmedLocal, isNull);
    });

    testWidgets('8. AttendanceSelfieSheet: Seamless offline fallback when network is unavailable', (WidgetTester tester) async {
      final failingClient = _MockFailingApiClient();
      final failingMediaService = _WidgetFailingMediaUploadService(client: failingClient, baseDirectory: Directory.systemTemp);

      String? confirmedKey;
      String? confirmedLocal;

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            mediaUploadServiceProvider.overrideWithValue(failingMediaService),
          ],
          child: MaterialApp(
            home: Scaffold(
              body: AttendanceSelfieSheet(
                workspaceId: 'ws-1',
                userId: 'user-1',
                currentLatitude: 28.6139,
                currentLongitude: 77.2090,
                accuracy: 10.0,
                onConfirm: ({
                  String? selfieMediaKey,
                  String? localFilePath,
                  required double? latitude,
                  required double? longitude,
                  required double? accuracy,
                  required DateTime timestamp,
                }) {
                  confirmedKey = selfieMediaKey;
                  confirmedLocal = localFilePath;
                },
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Tap Capture Selfie
      await tester.tap(find.text('Capture Selfie'));
      await tester.pumpAndSettle();

      // Tap Confirm & Punch In (network fails -> saves locally)
      await tester.tap(find.text('Confirm & Punch In'));
      await tester.pumpAndSettle();

      // Confirmed key is null (not uploaded to cloud yet), localFilePath is populated!
      expect(confirmedKey, isNull);
      expect(confirmedLocal, isNotNull);
      expect(confirmedLocal, equals('pending_media/selfie_user-1_test_local.jpg'));
    });

    testWidgets('9. ProofViewerSheet: Displays metadata and requests download URL', (WidgetTester tester) async {
      final mockProof = CachedTaskProof(
        id: 'proof-100',
        workspaceId: 'ws-1',
        taskId: 'task-100',
        userId: 'user-1',
        proofType: 'PHOTO',
        fileKey: 'ws-1/proofs/task-100/photo.jpg',
        watermarkJson: '{"latitude": 28.6139, "longitude": 77.209, "accuracy": 4.5}',
        notes: 'Compressor check passed',
        createdAt: DateTime.now(),
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            mediaUploadServiceProvider.overrideWithValue(mediaService),
          ],
          child: MaterialApp(
            home: Scaffold(
              body: ProofViewerSheet(proof: mockProof),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Field Photo Proof Evidence'), findsOneWidget);
      expect(find.textContaining('28.6139'), findsOneWidget);
      expect(find.textContaining('77.209'), findsOneWidget);
      expect(find.text('Work Notes: Compressor check passed'), findsOneWidget);
      expect(find.text('Storage Key: ws-1/proofs/task-100/photo.jpg'), findsOneWidget);
    });

    test('10. App restart & process termination: Offline selfie & mutation survive restart and sync with fresh presigned URL', () async {
      // Step 1: Save local selfie file in private durable storage
      final fakeSelfieBytes = MediaUploadService.createSyntheticJpeg();
      final localPath = await mediaService.savePendingImageFile(
        prefix: 'restart_test_selfie',
        bytes: fakeSelfieBytes,
      );
      expect(await File(localPath).exists(), isTrue, reason: 'Durable file must exist before app termination');

      // Step 2: Queue offline punch-in mutation
      final idempKey = await syncService.queuePunchIn(
        workspaceId: 'ws-1',
        shiftId: 'shift-100',
        note: 'Starting shift before app crash',
        localFilePath: localPath,
        latitude: 28.6139,
        longitude: 77.2090,
      );

      // Verify mutation is queued and local cached state is optimistic
      final initialMutation = await (testDb.select(testDb.outboxMutations)..where((m) => m.idempotencyKey.equals(idempKey))).getSingle();
      expect(initialMutation.status, equals('PENDING'));
      final preCrashAttendance = await (testDb.select(testDb.cachedAttendance)..where((a) => a.workspaceId.equals('ws-1'))).getSingleOrNull();
      expect(preCrashAttendance?.dutyState, equals('ON_DUTY'));

      // Step 3: Simulate App Crash / Force-Close & Process Restart
      // Re-instantiate SyncService from the same persistent database and storage
      final restartedClient = _MockApiClient();
      final restartedSyncService = SyncService(
        db: testDb,
        client: restartedClient,
        mediaService: mediaService,
        autoProcessOutbox: false,
      );

      // Verify after restart: pending mutation & local file still exist intact!
      final postRestartMutations = await (testDb.select(testDb.outboxMutations)..where((m) => m.status.equals('PENDING'))).get();
      expect(postRestartMutations.length, equals(1));
      expect(postRestartMutations.first.idempotencyKey, equals(idempKey));
      expect(await File(localPath).exists(), isTrue, reason: 'Pending media must not be purged on restart');

      // Step 4: Restore Connectivity & Process Outbox
      await restartedSyncService.processOutbox();

      // Verify remote upload and punch-in execution
      expect(restartedClient.punchInCalled, isTrue);
      expect(restartedClient.lastPunchInSelfieKey, equals('ws-1/attendance/user-1/selfie_123.jpg'));

      // Verify canonical server confirmed attendance
      final postSyncAttendance = await (testDb.select(testDb.cachedAttendance)..where((a) => a.workspaceId.equals('ws-1'))).getSingle();
      expect(postSyncAttendance.dutyState, equals('ON_DUTY'));
      expect(postSyncAttendance.activeSessionId, equals('session-1'));

      // Verify local file is purged only AFTER confirmed completion
      expect(await File(localPath).exists(), isFalse, reason: 'Temporary local media must be safely removed after confirmation');

      // Verify outbox mutation is removed on success
      final remainingMutations = await (testDb.select(testDb.outboxMutations)..where((m) => m.idempotencyKey.equals(idempKey))).get();
      expect(remainingMutations.isEmpty, isTrue);
    });

    test('11. Server Rejection (4xx): Rolls back optimistic duty state to NOT_STARTED and preserves evidence', () async {
      final fakeSelfieBytes = MediaUploadService.createSyntheticJpeg();
      final localPath = await mediaService.savePendingImageFile(
        prefix: 'rejection_test_selfie',
        bytes: fakeSelfieBytes,
      );
      expect(await File(localPath).exists(), isTrue);

      // Queue offline punch-in
      final idempKey = await syncService.queuePunchIn(
        workspaceId: 'ws-1',
        shiftId: 'shift-999',
        note: 'Attempt outside geofence',
        localFilePath: localPath,
      );

      // State is optimistically ON_DUTY before sync
      final preAttendance = await (testDb.select(testDb.cachedAttendance)..where((a) => a.workspaceId.equals('ws-1'))).getSingle();
      expect(preAttendance.dutyState, equals('ON_DUTY'));

      // Process outbox with rejecting client
      final rejectionClient = _MockRejectionApiClient();
      final rejectingSync = SyncService(
        db: testDb,
        client: rejectionClient,
        mediaService: mediaService,
        autoProcessOutbox: false,
      );

      // Process outbox (handles error)
      try {
        await rejectingSync.processOutbox();
      } catch (_) {}

      // Verify mutation is marked FAILED (never silently ignored or turned into confirmed)
      final failedMutation = await (testDb.select(testDb.outboxMutations)..where((m) => m.idempotencyKey.equals(idempKey))).getSingle();
      expect(failedMutation.status, equals('FAILED'));
      expect(failedMutation.lastError, contains('Outside assigned work perimeter'));

      // Verify duty state is ROLLED BACK to NOT_STARTED (No off-duty tracking masquerading as duty)
      final rolledBackAttendance = await (testDb.select(testDb.cachedAttendance)..where((a) => a.workspaceId.equals('ws-1'))).getSingle();
      expect(rolledBackAttendance.dutyState, equals('NOT_STARTED'));

      // Verify local selfie evidence is preserved for auditing / worker retry
      expect(await File(localPath).exists(), isTrue, reason: 'Evidence must be preserved when sync is rejected');

      // Clean up test file
      await File(localPath).delete();
    });

    test('12. Task Proof offline restart & recovery: Preserves proof across restarts and cleans up after confirmation', () async {
      final fakeProofBytes = MediaUploadService.createSyntheticJpeg();
      final localPath = await mediaService.savePendingImageFile(
        prefix: 'proof_restart_test',
        bytes: fakeProofBytes,
      );
      expect(await File(localPath).exists(), isTrue);

      // Queue media proof confirmation offline
      final idempKey = await syncService.queueProofConfirmation(
        workspaceId: 'ws-1',
        taskId: 'task-777',
        userId: 'user-1',
        proofType: 'PHOTO',
        fileKey: 'pending_key',
        localFilePath: localPath,
        isBinaryUploaded: false,
        notes: 'HVAC unit repaired',
      );

      // App crash / restart simulation
      final restartedClient = _MockApiClient();
      final restartedSync = SyncService(
        db: testDb,
        client: restartedClient,
        mediaService: mediaService,
        autoProcessOutbox: false,
      );

      // Verify pending outbox entry persists across restarts
      final pendingMutations = await (testDb.select(testDb.outboxMutations)..where((m) => m.status.equals('PENDING'))).get();
      expect(pendingMutations.any((m) => m.idempotencyKey == idempKey), isTrue);
      expect(await File(localPath).exists(), isTrue);

      // Reconnect and process outbox
      await restartedSync.processOutbox();

      expect(restartedClient.confirmProofCalled, isTrue);
      expect(restartedClient.lastConfirmProofFileKey, equals('ws-1/proofs/task-777/proof_123.jpg'));
      expect(await File(localPath).exists(), isFalse, reason: 'Local proof photo deleted only after remote confirmation');

      final remainingMutations = await (testDb.select(testDb.outboxMutations)..where((m) => m.idempotencyKey.equals(idempKey))).get();
      expect(remainingMutations.isEmpty, isTrue);
    });

    test('13. Duty-Hours Privacy Invariant: Punch-out immediately sets OFF_DUTY and terminates tracking', () async {
      // First ensure user is ON_DUTY
      await testDb.into(testDb.cachedAttendance).insertOnConflictUpdate(
            CachedAttendanceCompanion.insert(
              id: 'active_state_ws-1',
              workspaceId: 'ws-1',
              dutyState: 'ON_DUTY',
              activeSessionId: const Value('session-active-1'),
              punchInTime: Value(DateTime.now()),
              lastUpdated: Value(DateTime.now()),
            ),
          );

      // Queue punch-out
      final idempKey = await syncService.queuePunchOut(
        workspaceId: 'ws-1',
        note: 'End of shift',
      );

      // Immediately upon queuing, local cached duty state must be OFF_DUTY to terminate tracking
      final immediateDutyState = await (testDb.select(testDb.cachedAttendance)..where((a) => a.workspaceId.equals('ws-1'))).getSingle();
      expect(immediateDutyState.dutyState, equals('OFF_DUTY'));

      // Synchronize punch out
      await syncService.processOutbox();

      final postSyncDutyState = await (testDb.select(testDb.cachedAttendance)..where((a) => a.workspaceId.equals('ws-1'))).getSingle();
      expect(postSyncDutyState.dutyState, equals('OFF_DUTY'));

      final remainingMutations = await (testDb.select(testDb.outboxMutations)..where((m) => m.idempotencyKey.equals(idempKey))).get();
      expect(remainingMutations.isEmpty, isTrue);
    });
  });
}

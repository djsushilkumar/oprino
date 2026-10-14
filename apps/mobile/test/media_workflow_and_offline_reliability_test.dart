// ignore_for_file: deprecated_member_use
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:drift/native.dart';
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
  });
}

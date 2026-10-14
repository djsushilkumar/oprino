import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:drift/native.dart';
import 'package:oprino_mobile/core/database/database.dart';
import 'package:oprino_mobile/core/network/api_client_provider.dart';
import 'package:oprino_mobile/core/sync/sync_service.dart';
import 'package:oprino_mobile/features/auth/presentation/auth_state_notifier.dart';
import 'package:oprino_mobile/core/network/media_upload_service.dart';
import 'package:oprino_mobile/features/tasks/presentation/widgets/customer_signature_sheet.dart';
import 'package:oprino_mobile/features/tasks/presentation/widgets/photo_proof_sheet.dart';
import 'package:oprino_mobile/features/tasks/presentation/task_detail_screen.dart';
import 'package:oprino_mobile/features/visits/presentation/visits_view.dart';
import 'package:oprino_api/oprino_api.dart';

class _TestMediaUploadService extends MediaUploadService {
  _TestMediaUploadService({required super.client});

  @override
  Future<MediaUploadUrlResponse> requestTaskProofUploadUrl({
    required String taskId,
    String? visitId,
    required String proofType,
    required String fileName,
    String mimeType = 'image/jpeg',
    int? fileSizeBytes,
  }) async {
    return MediaUploadUrlResponse(
      uploadUrl: 'http://127.0.0.1:3001/v1/media/storage/upload/test',
      fileKey: 'ws-test/proofs/$taskId/proof.jpg',
      expiresInSeconds: 600,
    );
  }

  @override
  Future<void> uploadBinaryBytes({
    required String uploadUrl,
    required List<int> bytes,
    String contentType = 'image/jpeg',
  }) async {}

  @override
  Future<String> savePendingImageFile({
    required String prefix,
    required List<int> bytes,
  }) async {
    return '/tmp/$prefix.jpg';
  }
}

class _TestSyncService extends SyncService {
  List<CachedTask> testTasks = [];
  List<CachedChecklistItem> testChecklist = [];
  List<CachedVisit> testVisits = [];
  List<CachedTaskProof> testProofs = [];

  _TestSyncService({required super.db, required super.client});

  @override
  Future<void> syncDownAttendance(String workspaceId) async {}

  @override
  Future<void> syncDownTasks(String workspaceId) async {}

  @override
  Future<void> syncDownVisits(String workspaceId) async {}

  @override
  Future<void> syncDownTaskProofs(String taskId) async {}

  @override
  Future<void> processOutbox() async {}

  @override
  Stream<List<OutboxMutation>> watchPendingMutations() => Stream.value([]);

  @override
  Stream<CachedAttendanceData?> watchAttendance(String workspaceId) => Stream.value(null);

  @override
  Stream<List<CachedTask>> watchTasks(String workspaceId) => Stream.value(testTasks);

  @override
  Stream<List<CachedChecklistItem>> watchChecklist(String taskId) => Stream.value(testChecklist);

  @override
  Stream<List<CachedVisit>> watchVisits(String workspaceId) => Stream.value(testVisits);

  @override
  Stream<List<CachedTaskProof>> watchTaskProofs(String taskId) => Stream.value(testProofs);

  @override
  Future<String> queueChecklistToggle({
    required String workspaceId,
    required String taskId,
    required String itemId,
    required bool isCompleted,
  }) async {
    final idx = testChecklist.indexWhere((i) => i.id == itemId);
    if (idx != -1) {
      final old = testChecklist[idx];
      testChecklist[idx] = CachedChecklistItem(
        id: old.id,
        taskId: old.taskId,
        title: old.title,
        isCompleted: isCompleted,
        sortOrder: old.sortOrder,
        completedAt: isCompleted ? DateTime.now() : null,
      );
    }
    return 'mut-chk-test';
  }
}

class _MockAuthNotifier extends StateNotifier<AuthState> implements AuthNotifier {
  _MockAuthNotifier(super.state);

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  late AppDatabase testDb;
  late OprinoApiClient testClient;

  const mockContext = MeResponse(
    user: AuthUser(
      id: 'u1111111-2222-3333-4444-555555555555',
      email: 'field.lead@acme.com',
      name: 'Alex Johnson',
      emailVerified: true,
    ),
    activeWorkspace: ActiveWorkspaceInfo(
      id: 'w1111111-2222-3333-4444-555555555555',
      name: 'Apex Field Services',
      slug: 'apex-field-services',
      status: 'ACTIVE',
    ),
    membership: MembershipInfo(
      id: 'm1111111-2222-3333-4444-555555555555',
      status: 'active',
    ),
    role: RoleInfo(
      id: 'r1111111-2222-3333-4444-555555555555',
      name: 'Field Technician',
    ),
    permissions: ['tasks.view', 'tasks.update'],
    currentInstallation: null,
  );

  setUp(() {
    FlutterSecureStorage.setMockInitialValues({});
    testDb = AppDatabase(NativeDatabase.memory());
    testClient = OprinoApiClient();
  });

  tearDown(() async {
    await testDb.close();
  });

  testWidgets('1. CustomerSignatureSheet validates required signer name and canvas strokes', (WidgetTester tester) async {
    String? capturedName;
    String? capturedPhone;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: CustomerSignatureSheet(
            taskId: 't-1',
            onConfirm: ({
              required String signerName,
              String? signerPhone,
              required List<List<Offset>> strokes,
            }) {
              capturedName = signerName;
              capturedPhone = signerPhone;
            },
          ),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Customer On-Glass Signature'), findsOneWidget);

    // Attempting submit without name shows validation error
    await tester.tap(find.text('Confirm & Save Signature'));
    await tester.pumpAndSettle();
    expect(find.text('Please enter customer signer name.'), findsOneWidget);

    // Enter name
    await tester.enterText(find.byType(TextField).first, 'John Customer');
    await tester.pumpAndSettle();

    // Still missing signature strokes
    await tester.tap(find.text('Confirm & Save Signature'));
    await tester.pumpAndSettle();
    expect(find.text('Please provide on-glass customer signature.'), findsOneWidget);

    // Draw stroke on the signature box
    final canvasFinder = find.byKey(const Key('signature_canvas'));
    await tester.ensureVisible(canvasFinder);
    await tester.pumpAndSettle();

    final center = tester.getCenter(canvasFinder);
    final gesture = await tester.startGesture(center);
    await gesture.moveBy(const Offset(60, 20));
    await gesture.up();
    await tester.pumpAndSettle();

    // Confirm signature
    final confirmFinder = find.text('Confirm & Save Signature');
    await tester.ensureVisible(confirmFinder);
    await tester.pumpAndSettle();
    await tester.tap(confirmFinder);
    await tester.pumpAndSettle();

    expect(capturedName, equals('John Customer'));
    expect(capturedPhone, isNull);
  });

  testWidgets('2. PhotoProofSheet displays watermark banner and confirms geotagged proof', (WidgetTester tester) async {
    String? confirmedNotes;
    double? confirmedLat;

    final testMediaService = _TestMediaUploadService(client: testClient);

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          mediaUploadServiceProvider.overrideWithValue(testMediaService),
        ],
        child: MaterialApp(
          home: Scaffold(
            body: PhotoProofSheet(
              taskId: 't-1',
              currentLatitude: 37.77492,
              currentLongitude: -122.41941,
              accuracy: 3.5,
              onConfirm: ({
                required String fileKey,
                String? localFilePath,
                required bool isBinaryUploaded,
                required String notes,
                required double latitude,
                required double longitude,
                required double accuracy,
                required DateTime timestamp,
              }) {
                confirmedNotes = notes;
                confirmedLat = latitude;
              },
            ),
          ),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Capture Geotagged Photo Proof'), findsOneWidget);
    expect(find.text('GPS: 37.77492, -122.41941'), findsOneWidget);
    expect(find.text('±3.5m'), findsOneWidget);

    // Enter notes
    await tester.enterText(find.byType(TextField), 'Compressor pressure verified.');
    await tester.pumpAndSettle();

    await tester.tap(find.text('Confirm & Save Geotagged Proof'));
    await tester.pumpAndSettle();

    expect(confirmedNotes, equals('Compressor pressure verified.'));
    expect(confirmedLat, equals(37.77492));
  });

  testWidgets('3. TaskDetailScreen enforces mandatory checklist and photo proof before completion', (WidgetTester tester) async {
    const wsId = 'w1111111-2222-3333-4444-555555555555';
    const taskId = 't-mandatory-check';

    final sync = _TestSyncService(db: testDb, client: testClient);

    sync.testTasks = [
      CachedTask(
        id: taskId,
        workspaceId: wsId,
        title: 'Critical Generator Service',
        status: 'IN_PROGRESS',
        simplifiedStatus: 'IN_PROGRESS',
        priority: 'URGENT',
        customerName: 'General Hospital',
        siteName: 'Main Building ICU',
        requiresPhotoProof: true,
        requiresSignature: true,
        version: 1,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      ),
    ];

    sync.testChecklist = [
      CachedChecklistItem(
        id: 'chk-1',
        taskId: taskId,
        title: 'Check oil viscosity',
        isCompleted: false,
        sortOrder: 0,
      ),
    ];

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          databaseProvider.overrideWithValue(testDb),
          apiClientProvider.overrideWithValue(testClient),
          syncServiceProvider.overrideWithValue(sync),
          authStateProvider.overrideWith((ref) => _MockAuthNotifier(
                const AuthState.authenticated(
                  context: mockContext,
                  workspaces: [],
                ),
              )),
        ],
        child: const MaterialApp(
          home: TaskDetailScreen(
            taskId: taskId,
            title: 'Critical Generator Service',
            initialStatus: 'IN_PROGRESS',
            priority: 'URGENT',
            version: 1,
            customerName: 'General Hospital',
            siteName: 'Main Building ICU',
            requiresPhotoProof: true,
            requiresSignature: true,
          ),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Critical Generator Service'), findsOneWidget);
    expect(find.text('General Hospital'), findsOneWidget);
    expect(find.text('📷 Photo Proof Required'), findsOneWidget);
    expect(find.text('✍️ On-Glass Signature Required'), findsOneWidget);
    expect(find.text('Check oil viscosity'), findsOneWidget);

    // Tap "Mark Completed" while checklist is incomplete
    await tester.tap(find.text('Mark Completed'));
    await tester.pumpAndSettle();

    // Verify error banner is shown
    expect(
      find.text('Cannot complete task: 1 checklist items are still incomplete. All checklist items must be checked off.'),
      findsOneWidget,
    );

    // Now check off the checklist item
    await tester.ensureVisible(find.byType(Checkbox).first);
    await tester.pumpAndSettle();
    await tester.tap(find.byType(Checkbox).first);
    await tester.pumpAndSettle();

    // Try "Mark Completed" again -> now checklist passes, but photo proof is missing!
    await tester.ensureVisible(find.text('Mark Completed'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Mark Completed'));
    await tester.pumpAndSettle();

    expect(
      find.text('Cannot complete task: Mandatory geotagged photo proof must be captured first.'),
      findsOneWidget,
    );
  });

  testWidgets('4. VisitsView renders customer visits list and empty states', (WidgetTester tester) async {
    const wsId = 'w1111111-2222-3333-4444-555555555555';

    final sync = _TestSyncService(db: testDb, client: testClient);

    sync.testVisits = [
      CachedVisit(
        id: 'v-101',
        workspaceId: wsId,
        customerId: 'c-1',
        customerName: 'Metro Telecom Corp',
        siteName: 'Cell Tower #9',
        userId: 'u1111111-2222-3333-4444-555555555555',
        status: 'SCHEDULED',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      ),
    ];

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          databaseProvider.overrideWithValue(testDb),
          apiClientProvider.overrideWithValue(testClient),
          syncServiceProvider.overrideWithValue(sync),
          authStateProvider.overrideWith((ref) => _MockAuthNotifier(
                const AuthState.authenticated(
                  context: mockContext,
                  workspaces: [],
                ),
              )),
        ],
        child: const MaterialApp(
          home: Scaffold(body: VisitsView()),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Metro Telecom Corp'), findsOneWidget);
    expect(find.text('Cell Tower #9'), findsOneWidget);
    expect(find.text('Check In (GPS Geofence)'), findsOneWidget);
  });
}

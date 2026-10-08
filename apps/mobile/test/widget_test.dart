import 'dart:typed_data';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:drift/native.dart';
import 'package:oprino_mobile/main.dart';
import 'package:oprino_mobile/core/database/database.dart';
import 'package:oprino_mobile/core/network/api_client_provider.dart';
import 'package:oprino_mobile/core/sync/sync_service.dart';
import 'package:oprino_mobile/features/auth/presentation/auth_state_notifier.dart';
import 'package:oprino_mobile/features/auth/presentation/device_revoked_screen.dart';
import 'package:oprino_mobile/features/shell/presentation/app_shell_screen.dart';
import 'package:oprino_api/oprino_api.dart';

class _FakeOfflineAdapter implements HttpClientAdapter {
  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    throw DioException(
      requestOptions: options,
      error: 'Simulated offline network state',
      type: DioExceptionType.connectionError,
    );
  }

  @override
  void close({bool force = false}) {}
}

class _TestSyncService extends SyncService {
  _TestSyncService({required super.db, required super.client});

  @override
  Future<void> syncDownAttendance(String workspaceId) async {}

  @override
  Future<void> syncDownTasks(String workspaceId) async {}

  @override
  Future<void> processOutbox() async {}

  // Return simple in-memory streams to avoid Drift's internal polling timer
  // which survives test teardown and causes 'A Timer is still pending' errors.
  @override
  Stream<List<OutboxMutation>> watchPendingMutations() => Stream.value([]);

  @override
  Stream<CachedAttendanceData?> watchAttendance(String workspaceId) => Stream.value(null);

  @override
  Stream<List<CachedTask>> watchTasks(String workspaceId) => Stream.value([]);
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  late AppDatabase testDb;
  late OprinoApiClient testClient;

  setUp(() {
    FlutterSecureStorage.setMockInitialValues({});
    testDb = AppDatabase(NativeDatabase.memory());
    testClient = OprinoApiClient();
    testClient.dio.httpClientAdapter = _FakeOfflineAdapter();
  });

  tearDown(() async {
    await testDb.close();
  });

  testWidgets('1. Boots cleanly and displays SignInScreen with branding by default', (WidgetTester tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          databaseProvider.overrideWithValue(testDb),
        ],
        child: const OprinoMobileApp(),
      ),
    );

    await tester.pumpAndSettle();

    // Verify canonical brand wordmark
    expect(find.text('oprino'), findsOneWidget);

    // Verify subtitle & Sign In title
    expect(find.text('Operations & Workforce SaaS Platform'), findsOneWidget);
    expect(find.text('Sign In'), findsNWidgets(2)); // Card header and button label

    // Verify Email and Password fields
    expect(find.byType(TextField), findsNWidgets(2));

    // Verify Device Governance footer
    expect(find.text('Device Governance (ADR-006)'), findsOneWidget);
  });

  testWidgets('2. Displays DeviceRevokedScreen when device is revoked', (WidgetTester tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          databaseProvider.overrideWithValue(testDb),
          authStateProvider.overrideWith((ref) => _MockAuthNotifier(
                const AuthState.deviceRevoked(reason: 'Admin has revoked this phone.'),
              )),
        ],
        child: const MaterialApp(
          home: DeviceRevokedScreen(),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Device Access Revoked'), findsOneWidget);
    expect(find.text('Admin has revoked this phone.'), findsOneWidget);
    expect(find.text('Reset Installation & Return to Sign In'), findsOneWidget);
  });

  testWidgets('3. Displays AppShellScreen with active workspace, tasks, and attendance tabs', (WidgetTester tester) async {
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
        name: 'Manager',
      ),
      permissions: ['workspace.read', 'members.read', 'devices.read'],
      currentInstallation: null,
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          databaseProvider.overrideWithValue(testDb),
          apiClientProvider.overrideWithValue(testClient),
          syncServiceProvider.overrideWithValue(_TestSyncService(db: testDb, client: testClient)),
          authStateProvider.overrideWith((ref) => _MockAuthNotifier(
                const AuthState.authenticated(
                  context: mockContext,
                  workspaces: [
                    WorkspaceListItem(
                      id: 'w1111111-2222-3333-4444-555555555555',
                      name: 'Apex Field Services',
                      slug: 'apex-field-services',
                      status: 'ACTIVE',
                      membershipStatus: 'active',
                      roleName: 'Manager',
                    ),
                  ],
                ),
              )),
        ],
        child: const MaterialApp(
          home: AppShellScreen(),
        ),
      ),
    );

    await tester.pumpAndSettle();

    // Verify brand wordmark
    expect(find.text('oprino'), findsOneWidget);

    // Initial tab is Attendance (Tab 0)
    expect(find.text('Attendance'), findsWidgets);
    expect(find.text('OFF DUTY'), findsOneWidget);
    expect(find.text('Punch In (Start Duty)'), findsOneWidget);
    expect(find.text('GPS Telemetry & Geofencing'), findsOneWidget);
    expect(find.text('STANDBY (OFF)'), findsOneWidget);

    // Switch to Tasks Tab (Tab 1)
    await tester.tap(find.text('Tasks'));
    await tester.pumpAndSettle();
    expect(find.text('No assigned tasks'), findsOneWidget);
    expect(find.text('To Do'), findsOneWidget);

    // Switch to Profile Tab (Tab 2)
    await tester.tap(find.text('Profile'));
    await tester.pumpAndSettle();

    // Verify Active Workspace display
    expect(find.text('Apex Field Services'), findsOneWidget);
    expect(find.text('Active Tenant'), findsOneWidget);

    // Verify User & Role
    expect(find.text('Alex Johnson'), findsOneWidget);
    expect(find.text('field.lead@acme.com'), findsOneWidget);
    expect(find.text('Manager'), findsOneWidget);

    // Verify Duty-Hours Invariant statement (may be scrolled down in profile view)
    expect(
      find.text(
        'Duty-Hours Invariant: Off-duty location tracking NEVER occurs. Peer visibility OFF by default.',
        skipOffstage: false,
      ),
      findsOneWidget,
    );
  });

  test('4. SyncService queues offline mutations to outbox and updates local state optimistically', () async {
    final sync = SyncService(db: testDb, client: testClient, autoProcessOutbox: false);

    const wsId = 'w1111111-2222-3333-4444-555555555555';

    // 1. Queue offline Punch In
    await sync.queuePunchIn(
      workspaceId: wsId,
      shiftId: 'shift-123',
    );

    // Verify outbox mutation was stored in PENDING state
    final allMutationsStep1 = await testDb.select(testDb.outboxMutations).get();
    expect(allMutationsStep1.length, equals(1));
    expect(allMutationsStep1.first.entityType, equals('ATTENDANCE'));
    expect(allMutationsStep1.first.mutationType, equals('PUNCH_IN'));
    expect(allMutationsStep1.first.status, equals('PENDING'));
    expect(allMutationsStep1.first.idempotencyKey.isNotEmpty, isTrue);

    // Verify local attendance state updated optimistically to ON_DUTY
    final attendance = await (testDb.select(testDb.cachedAttendance)..where((a) => a.workspaceId.equals(wsId))).getSingleOrNull();
    expect(attendance, isNotNull);
    expect(attendance!.dutyState, equals('ON_DUTY'));

    // 2. Insert cached task and queue transition
    await testDb.into(testDb.cachedTasks).insert(
          CachedTasksCompanion.insert(
            id: 'task-100',
            workspaceId: wsId,
            title: 'Emergency Site Inspection',
            status: 'ASSIGNED',
            simplifiedStatus: 'TO_DO',
            priority: 'HIGH',
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          ),
        );

    await sync.queueTaskTransition(
      workspaceId: wsId,
      taskId: 'task-100',
      targetStatus: 'ACCEPTED',
      version: 1,
    );

    final allMutationsStep2 = await testDb.select(testDb.outboxMutations).get();
    expect(allMutationsStep2.length, equals(2));
    expect(allMutationsStep2.any((m) => m.mutationType == 'PUNCH_IN'), isTrue);
    expect(allMutationsStep2.any((m) => m.mutationType == 'TRANSITION'), isTrue);

    // Verify optimistic task update
    final localTask = await (testDb.select(testDb.cachedTasks)..where((t) => t.id.equals('task-100'))).getSingle();
    expect(localTask.status, equals('ACCEPTED'));

    // 3. Verify sync engine processing (draining with simulated offline error)
    await sync.processOutbox();
    final allMutationsStep3 = await testDb.select(testDb.outboxMutations).get();
    expect(allMutationsStep3.every((m) => m.status == 'FAILED'), isTrue);
    expect(allMutationsStep3.every((m) => m.attemptCount == 1), isTrue);
  });
}

class _MockAuthNotifier extends StateNotifier<AuthState> implements AuthNotifier {
  _MockAuthNotifier(super.state);

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:oprino_mobile/main.dart';
import 'package:oprino_mobile/features/auth/presentation/auth_state_notifier.dart';
import 'package:oprino_mobile/features/auth/presentation/device_revoked_screen.dart';
import 'package:oprino_mobile/features/shell/presentation/app_shell_screen.dart';
import 'package:oprino_api/oprino_api.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    FlutterSecureStorage.setMockInitialValues({});
  });

  testWidgets('1. Boots cleanly and displays SignInScreen with branding by default', (WidgetTester tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: OprinoMobileApp(),
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

  testWidgets('3. Displays AppShellScreen with active workspace and permissions when authenticated', (WidgetTester tester) async {
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

    // Verify Active Workspace display
    expect(find.text('Apex Field Services'), findsOneWidget);
    expect(find.text('Active Tenant'), findsOneWidget);

    // Verify User & Role
    expect(find.text('Alex Johnson'), findsOneWidget);
    expect(find.text('field.lead@acme.com'), findsOneWidget);
    expect(find.text('Manager'), findsOneWidget);

    // Verify Duty-Hours Invariant statement
    expect(
      find.text('Duty-Hours Invariant: Off-duty location tracking NEVER occurs. Peer visibility OFF by default.'),
      findsOneWidget,
    );
  });
}

class _MockAuthNotifier extends StateNotifier<AuthState> implements AuthNotifier {
  _MockAuthNotifier(super.state);

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

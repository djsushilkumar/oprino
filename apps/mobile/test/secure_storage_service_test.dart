import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:oprino_mobile/core/storage/secure_storage_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late SecureStorageService storageService;

  setUp(() {
    FlutterSecureStorage.setMockInitialValues({});
    storageService = SecureStorageService();
  });

  group('SecureStorageService Foundation (Phase 02A)', () {
    test('1. Installation ID: generates cryptographically valid UUIDv4 on first access', () async {
      final id = await storageService.getOrCreateInstallationId();

      expect(id, isNotEmpty);
      // Valid RFC 4122 UUIDv4 pattern: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      final uuidRegex = RegExp(
        r'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
        caseSensitive: false,
      );
      expect(uuidRegex.hasMatch(id), isTrue, reason: 'Must match UUIDv4 specification');

      // Subsequent read returns identical ID
      final secondRead = await storageService.getOrCreateInstallationId();
      expect(secondRead, equals(id));
    });

    test('2. Auth token persistence: saves, retrieves, and clears session token', () async {
      expect(await storageService.getSessionToken(), isNull);

      const token = 'test-better-auth-session-token-12345';
      await storageService.saveSessionToken(token);
      expect(await storageService.getSessionToken(), equals(token));

      await storageService.clearSessionToken();
      expect(await storageService.getSessionToken(), isNull);
    });

    test('3. Workspace context persistence: saves and retrieves active workspace ID', () async {
      expect(await storageService.getActiveWorkspaceId(), isNull);

      const wsId = 'w1111111-2222-4333-8444-555555555555';
      await storageService.saveActiveWorkspaceId(wsId);
      expect(await storageService.getActiveWorkspaceId(), equals(wsId));

      await storageService.clearActiveWorkspaceId();
      expect(await storageService.getActiveWorkspaceId(), isNull);
    });

    test('4. Logout invariant: clears session token and workspace context, but preserves installation ID', () async {
      final installationId = await storageService.getOrCreateInstallationId();
      await storageService.saveSessionToken('auth-token');
      await storageService.saveActiveWorkspaceId('workspace-id');

      await storageService.clearAuthSession();

      expect(await storageService.getSessionToken(), isNull);
      expect(await storageService.getActiveWorkspaceId(), isNull);
      // Installation ID MUST be preserved across logouts
      expect(await storageService.getOrCreateInstallationId(), equals(installationId));
    });

    test('5. Device revocation: sets revoked flag and clears auth session', () async {
      final installationId = await storageService.getOrCreateInstallationId();
      await storageService.saveSessionToken('auth-token');
      await storageService.saveActiveWorkspaceId('workspace-id');

      expect(await storageService.isInstallationRevoked(), isFalse);

      await storageService.handleDeviceRevocation();

      expect(await storageService.isInstallationRevoked(), isTrue);
      expect(await storageService.getSessionToken(), isNull);
      expect(await storageService.getActiveWorkspaceId(), isNull);
      expect(await storageService.getOrCreateInstallationId(), equals(installationId));
    });

    test('6. Installation reset: creates fresh UUIDv4 and clears revoked flag', () async {
      final initialId = await storageService.getOrCreateInstallationId();
      await storageService.handleDeviceRevocation();
      expect(await storageService.isInstallationRevoked(), isTrue);

      final resetId = await storageService.resetInstallationId();

      expect(resetId, isNot(equals(initialId)));
      expect(await storageService.isInstallationRevoked(), isFalse);
      expect(await storageService.getOrCreateInstallationId(), equals(resetId));
    });
  });
}

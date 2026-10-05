import 'package:spike_e_security/installation_identity_service.dart';
import 'package:test/test.dart';

void main() {
  group('SPIKE E — Secure Storage & Installation Identity Validation', () {
    test('1. Cryptographically Random Installation ID Generation & Persistence', () async {
      final storage = MockPlatformSecureStorage();
      final manager = InstallationIdentityManager(storage: storage);

      // First run: Generates new ID
      final id1 = await manager.getOrCreateInstallationId();
      expect(id1, startsWith('inst_'));
      expect(id1.length, greaterThan(36));

      // Subsequent read returns identical ID
      final id2 = await manager.getOrCreateInstallationId();
      expect(id2, equals(id1));
    });

    test('2. Namespace Separation (Installation ID vs. Auth Session)', () async {
      final storage = MockPlatformSecureStorage();
      final manager = InstallationIdentityManager(storage: storage);

      final installationId = await manager.getOrCreateInstallationId();
      await manager.storeSession(token: 'better_auth_token_xyz', workspaceId: 'ws_tenant_1');

      // Verify each exists in its respective namespace
      final storedInstallation = await storage.read(
        namespace: InstallationIdentityManager.nsInstallation,
        key: InstallationIdentityManager.keyInstallationId,
      );
      final storedSession = await storage.read(
        namespace: InstallationIdentityManager.nsAuthSession,
        key: InstallationIdentityManager.keySessionToken,
      );

      expect(storedInstallation, equals(installationId));
      expect(storedSession, equals('better_auth_token_xyz'));

      // Ensure cross-namespace isolation
      final leakageCheck = await storage.read(
        namespace: InstallationIdentityManager.nsInstallation,
        key: InstallationIdentityManager.keySessionToken,
      );
      expect(leakageCheck, isNull);
    });

    test('3. App Restart & Cold Boot Survival', () async {
      final storage = MockPlatformSecureStorage();

      // Session 1: App creates installation and signs in
      String savedInstallationId;
      {
        final manager1 = InstallationIdentityManager(storage: storage);
        savedInstallationId = await manager1.getOrCreateInstallationId();
        await manager1.storeSession(token: 'session_persisted_token', workspaceId: 'ws_acme');
      }

      // Session 2: Cold boot (new manager instance pointing to persistent Keystore/Keychain)
      {
        final manager2 = InstallationIdentityManager(storage: storage);
        final restoredId = await manager2.getOrCreateInstallationId();
        final restoredToken = await manager2.getSessionToken();
        final restoredWorkspace = await manager2.getActiveWorkspaceId();

        expect(restoredId, equals(savedInstallationId));
        expect(restoredToken, equals('session_persisted_token'));
        expect(restoredWorkspace, equals('ws_acme'));
      }
    });

    test('4. User Logout: Purges Session, Preserves Installation ID', () async {
      final storage = MockPlatformSecureStorage();
      final manager = InstallationIdentityManager(storage: storage);

      final installationId = await manager.getOrCreateInstallationId();
      await manager.storeSession(token: 'token_to_purge', workspaceId: 'ws_acme');

      // Execute Logout
      await manager.logout();

      // Verify session is cleared
      expect(await manager.getSessionToken(), isNull);
      expect(await manager.getActiveWorkspaceId(), isNull);

      // Verify Installation ID is retained
      expect(await manager.getOrCreateInstallationId(), equals(installationId));
    });

    test('5. Reinstall Simulation: Produces Fresh Installation ID', () async {
      final storage = MockPlatformSecureStorage();

      // App Instance 1
      final manager1 = InstallationIdentityManager(storage: storage);
      final initialId = await manager1.getOrCreateInstallationId();

      // Simulate App Uninstall: OS clears application container and Keystore/Keychain app data
      await storage.wipeAll();

      // App Instance 2 (Reinstalled)
      final manager2 = InstallationIdentityManager(storage: storage);
      final freshId = await manager2.getOrCreateInstallationId();

      expect(freshId, isNot(equals(initialId)));
      expect(freshId, startsWith('inst_'));
    });

    test('6. Diagnostic Metadata Separation (Non-Identity Telemetry)', () {
      const metadata = DiagnosticMetadata(
        brand: 'Xiaomi',
        model: 'Redmi Note 12',
        osVersion: 'Android 13 (API 33)',
        appVersion: '1.0.0+10',
      );

      final map = metadata.toMap();
      // Verify no invasive identifiers exist
      expect(map.containsKey('imei'), isFalse);
      expect(map.containsKey('mac_address'), isFalse);
      expect(map.containsKey('android_id'), isFalse);
      expect(map.containsKey('advertising_id'), isFalse);

      expect(map['brand'], 'Xiaomi');
      expect(map['model'], 'Redmi Note 12');
    });

    test('7. Remote Wipe Flow: Immediate Credential & Cache Clearance', () async {
      final storage = MockPlatformSecureStorage();
      final manager = InstallationIdentityManager(storage: storage);

      await manager.getOrCreateInstallationId();
      await manager.storeSession(token: 'compromised_session_token', workspaceId: 'ws_acme');

      var cachedDataPurged = false;
      void mockPurgeCachedData() {
        cachedDataPurged = true;
      }

      // Execute Remote Wipe
      await manager.executeRemoteWipe(purgeCachedDomainData: mockPurgeCachedData);

      // Session must be purged
      expect(await manager.getSessionToken(), isNull);
      expect(await manager.getActiveWorkspaceId(), isNull);
      // Domain data purge callback must have executed
      expect(cachedDataPurged, isTrue);
    });
  });
}

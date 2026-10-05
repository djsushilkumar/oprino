import 'dart:math';
import 'package:uuid/uuid.dart';

/// In-memory/mock implementation of platform-backed secure storage (Android Keystore / iOS Keychain)
abstract class SecureStorageProvider {
  Future<void> write({required String namespace, required String key, required String value});
  Future<String?> read({required String namespace, required String key});
  Future<void> delete({required String namespace, required String key});
  Future<void> clearNamespace(String namespace);
  Future<void> wipeAll();
}

class MockPlatformSecureStorage implements SecureStorageProvider {
  final Map<String, Map<String, String>> _storage = {};

  @override
  Future<void> write({required String namespace, required String key, required String value}) async {
    _storage.putIfAbsent(namespace, () => {})[key] = value;
  }

  @override
  Future<String?> read({required String namespace, required String key}) async {
    return _storage[namespace]?[key];
  }

  @override
  Future<void> delete({required String namespace, required String key}) async {
    _storage[namespace]?.remove(key);
  }

  @override
  Future<void> clearNamespace(String namespace) async {
    _storage[namespace]?.clear();
  }

  @override
  Future<void> wipeAll() async {
    _storage.clear();
  }
}

class DiagnosticMetadata {
  final String brand;
  final String model;
  final String osVersion;
  final String appVersion;

  const DiagnosticMetadata({
    required this.brand,
    required this.model,
    required this.osVersion,
    required this.appVersion,
  });

  Map<String, String> toMap() => {
        'brand': brand,
        'model': model,
        'osVersion': osVersion,
        'appVersion': appVersion,
      };
}

class InstallationIdentityManager {
  static const String nsInstallation = 'oprino_installation';
  static const String nsAuthSession = 'oprino_auth_session';

  static const String keyInstallationId = 'installation_id';
  static const String keySessionToken = 'session_token';
  static const String keyActiveWorkspaceId = 'active_workspace_id';

  final SecureStorageProvider storage;
  final Uuid _uuid;

  InstallationIdentityManager({required this.storage, Uuid? uuid}) : _uuid = uuid ?? const Uuid();

  /// Obtains the existing Installation ID or generates a cryptographically random UUIDv4
  Future<String> getOrCreateInstallationId() async {
    final existingId = await storage.read(namespace: nsInstallation, key: keyInstallationId);
    if (existingId != null && existingId.isNotEmpty) {
      return existingId;
    }

    // Generate cryptographically secure UUIDv4
    final newId = 'inst_${_uuid.v4()}';
    await storage.write(namespace: nsInstallation, key: keyInstallationId, value: newId);
    return newId;
  }

  /// Store authenticated session credentials
  Future<void> storeSession({required String token, required String workspaceId}) async {
    await storage.write(namespace: nsAuthSession, key: keySessionToken, value: token);
    await storage.write(namespace: nsAuthSession, key: keyActiveWorkspaceId, value: workspaceId);
  }

  /// Retrieve session token
  Future<String?> getSessionToken() => storage.read(namespace: nsAuthSession, key: keySessionToken);

  /// Retrieve active workspace ID
  Future<String?> getActiveWorkspaceId() =>
      storage.read(namespace: nsAuthSession, key: keyActiveWorkspaceId);

  /// User Logout: clears session credentials while preserving Installation ID
  Future<void> logout() async {
    await storage.clearNamespace(nsAuthSession);
  }

  /// Remote Wipe execution: triggered when server revokes session/installation.
  /// Clears local credentials and flags domain database for purge.
  Future<void> executeRemoteWipe({required Function() purgeCachedDomainData}) async {
    // 1. Clear session credentials immediately
    await storage.clearNamespace(nsAuthSession);

    // 2. Execute local domain cache purge (Drift tables, offline blobs)
    purgeCachedDomainData();
  }
}

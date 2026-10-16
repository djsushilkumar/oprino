import 'dart:math';
import 'dart:typed_data';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorageService {
  final FlutterSecureStorage _storage;

  SecureStorageService({FlutterSecureStorage? storage})
      : _storage = storage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(encryptedSharedPreferences: true),
              iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock_this_device),
            );

  // Separate namespaces for governance & session isolation
  static const String _installationKey = 'oprino_device:installation_id';
  static const String _sessionTokenKey = 'oprino_auth:session_token';
  static const String _workspaceKey = 'oprino_workspace:active_id';
  static const String _revokedKey = 'oprino_device:revoked_flag';

  /// Generates an RFC 4122 cryptographically secure UUIDv4 identifier.
  /// Strictly avoids IMEI, MAC, Android ID, Advertising ID, or hardware fingerprints.
  static String generateUuidV4() {
    final random = Random.secure();
    final bytes = Uint8List(16);
    for (var i = 0; i < 16; i++) {
      bytes[i] = random.nextInt(256);
    }
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant (10xx)
    final hex = bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
    return '${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}';
  }

  Future<String> getOrCreateInstallationId() async {
    String? id = await _storage.read(key: _installationKey);
    if (id == null || id.isEmpty) {
      id = generateUuidV4();
      await _storage.write(key: _installationKey, value: id);
    }
    return id;
  }

  Future<String?> getSessionToken() async {
    return _storage.read(key: _sessionTokenKey);
  }

  Future<void> saveSessionToken(String token) async {
    await _storage.write(key: _sessionTokenKey, value: token);
  }

  Future<void> clearSessionToken() async {
    await _storage.delete(key: _sessionTokenKey);
  }

  Future<String?> getActiveWorkspaceId() async {
    return _storage.read(key: _workspaceKey);
  }

  Future<void> saveActiveWorkspaceId(String workspaceId) async {
    await _storage.write(key: _workspaceKey, value: workspaceId);
  }

  Future<void> clearActiveWorkspaceId() async {
    await _storage.delete(key: _workspaceKey);
  }

  Future<bool> isInstallationRevoked() async {
    final val = await _storage.read(key: _revokedKey);
    return val == 'true';
  }

  Future<void> setInstallationRevoked(bool revoked) async {
    if (revoked) {
      await _storage.write(key: _revokedKey, value: 'true');
    } else {
      await _storage.delete(key: _revokedKey);
    }
  }

  /// On logout: clears session token and active workspace ID, but PRESERVES installation ID.
  Future<void> clearAuthSession() async {
    await _storage.delete(key: _sessionTokenKey);
    await _storage.delete(key: _workspaceKey);
  }

  /// On device revocation: marks installation revoked and wipes auth credentials.
  /// Installation ID is preserved so the device can identify itself as revoked.
  Future<void> handleDeviceRevocation() async {
    await clearAuthSession();
    await setInstallationRevoked(true);
  }
}

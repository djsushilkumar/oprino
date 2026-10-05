import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorageService {
  final FlutterSecureStorage _storage;

  SecureStorageService({FlutterSecureStorage? storage})
      : _storage = storage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(encryptedSharedPreferences: true),
              iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock_this_device),
            );

  static const String _installationKey = 'oprino_installation:id';
  static const String _sessionTokenKey = 'oprino_auth_session:token';

  Future<String> getOrCreateInstallationId() async {
    String? id = await _storage.read(key: _installationKey);
    if (id == null) {
      id = 'inst_${DateTime.now().millisecondsSinceEpoch}_${(1000 + DateTime.now().microsecond % 9000)}';
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

  Future<void> clearSession() async {
    await _storage.delete(key: _sessionTokenKey);
  }
}

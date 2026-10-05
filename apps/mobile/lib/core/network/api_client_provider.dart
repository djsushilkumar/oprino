import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:oprino_api/oprino_api.dart';
import '../config/app_config.dart';
import '../storage/secure_storage_service.dart';
import '../database/database.dart';
import 'auth_interceptor.dart';

final appConfigProvider = Provider<AppConfig>((ref) {
  return AppConfig.development;
});

final secureStorageProvider = Provider<SecureStorageService>((ref) {
  return SecureStorageService();
});

final databaseProvider = Provider<AppDatabase>((ref) {
  final db = AppDatabase();
  ref.onDispose(() => db.close());
  return db;
});

final authInterceptorProvider = Provider<AuthInterceptor>((ref) {
  final storage = ref.watch(secureStorageProvider);
  return AuthInterceptor(
    storage: storage,
  );
});

final apiClientProvider = Provider<OprinoApiClient>((ref) {
  final config = ref.watch(appConfigProvider);
  final interceptor = ref.watch(authInterceptorProvider);

  final client = OprinoApiClient(baseUrl: config.apiBaseUrl);
  client.dio.interceptors.add(interceptor);

  return client;
});

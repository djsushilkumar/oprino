import 'package:dio/dio.dart';
import '../storage/secure_storage_service.dart';

class AuthInterceptor extends Interceptor {
  final SecureStorageService storage;
  void Function()? onRevocationDetected;
  void Function()? onSessionExpired;

  AuthInterceptor({
    required this.storage,
    this.onRevocationDetected,
    this.onSessionExpired,
  });

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    try {
      // 1. Ensure Origin header is present
      options.headers['Origin'] = 'oprino://app';

      // 2. Attach cryptographically random Installation ID
      final installationId = await storage.getOrCreateInstallationId();
      options.headers['X-Installation-Id'] = installationId;

      // 3. Attach Bearer session token if available
      final token = await storage.getSessionToken();
      if (token != null && token.isNotEmpty) {
        options.headers['Authorization'] = 'Bearer $token';
      }

      // 4. Attach Active Workspace Context if available
      final workspaceId = await storage.getActiveWorkspaceId();
      if (workspaceId != null && workspaceId.isNotEmpty) {
        options.headers['X-Workspace-Id'] = workspaceId;
      }
    } catch (_) {
      // Ignore secure storage read errors during request preparation
    }

    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    final statusCode = err.response?.statusCode;

    if (statusCode == 401) {
      final responseData = err.response?.data;
      String? errorCode;
      String? errorMessage;

      if (responseData is Map) {
        if (responseData['error'] is Map) {
          final errObj = responseData['error'] as Map;
          errorCode = errObj['code']?.toString() ?? errObj['name']?.toString();
          errorMessage = errObj['message']?.toString();
        } else {
          errorCode = responseData['error']?.toString() ?? responseData['code']?.toString();
          errorMessage = responseData['message']?.toString();
        }
      }

      final isDeviceRevoked = errorCode == 'DEVICE_REVOKED' ||
          (errorMessage != null && errorMessage.toLowerCase().contains('revoked'));

      if (isDeviceRevoked) {
        // Clear auth credentials and mark device as revoked
        await storage.handleDeviceRevocation();
        onRevocationDetected?.call();
      } else {
        // Normal session expiration / invalid credentials
        await storage.clearAuthSession();
        onSessionExpired?.call();
      }
    }

    handler.next(err);
  }
}

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:oprino_mobile/core/network/auth_interceptor.dart';
import 'package:oprino_mobile/core/storage/secure_storage_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late SecureStorageService storageService;

  setUp(() {
    FlutterSecureStorage.setMockInitialValues({});
    storageService = SecureStorageService();
  });

  group('AuthInterceptor Tests', () {
    test('1. Injects Origin and X-Installation-Id headers by default', () async {
      final interceptor = AuthInterceptor(storage: storageService);
      final options = RequestOptions(path: '/v1/version');

      final handler = _TestRequestInterceptorHandler();
      interceptor.onRequest(options, handler);

      // Await async execution
      await Future.delayed(const Duration(milliseconds: 50));

      expect(options.headers['Origin'], equals('oprino://app'));
      expect(options.headers['X-Installation-Id'], isNotNull);
      expect(options.headers['Authorization'], isNull);
      expect(options.headers['X-Workspace-Id'], isNull);
    });

    test('2. Injects Authorization Bearer and X-Workspace-Id when set in storage', () async {
      await storageService.saveSessionToken('mock-bearer-token-12345');
      await storageService.saveActiveWorkspaceId('mock-workspace-id-67890');

      final interceptor = AuthInterceptor(storage: storageService);
      final options = RequestOptions(path: '/v1/me');

      final handler = _TestRequestInterceptorHandler();
      interceptor.onRequest(options, handler);

      await Future.delayed(const Duration(milliseconds: 50));

      expect(options.headers['Authorization'], equals('Bearer mock-bearer-token-12345'));
      expect(options.headers['X-Workspace-Id'], equals('mock-workspace-id-67890'));
      expect(options.headers['Origin'], equals('oprino://app'));
      expect(options.headers['X-Installation-Id'], isNotNull);
    });

    test('3. Handles generic 401 error: clears auth session and notifies callback', () async {
      await storageService.saveSessionToken('expired-token');
      await storageService.saveActiveWorkspaceId('workspace-id');

      bool sessionExpiredCalled = false;
      bool revocationCalled = false;

      final interceptor = AuthInterceptor(
        storage: storageService,
        onSessionExpired: () => sessionExpiredCalled = true,
        onRevocationDetected: () => revocationCalled = true,
      );

      final dioError = DioException(
        requestOptions: RequestOptions(path: '/v1/me'),
        response: Response(
          requestOptions: RequestOptions(path: '/v1/me'),
          statusCode: 401,
          data: {'error': 'UNAUTHORIZED', 'message': 'Session expired'},
        ),
      );

      final errorHandler = _TestErrorInterceptorHandler();
      interceptor.onError(dioError, errorHandler);

      await Future.delayed(const Duration(milliseconds: 50));

      expect(sessionExpiredCalled, isTrue);
      expect(revocationCalled, isFalse);
      expect(await storageService.getSessionToken(), isNull);
      expect(await storageService.isInstallationRevoked(), isFalse);
    });

    test('4. Handles 401 DEVICE_REVOKED: marks revoked and triggers revocation callback', () async {
      await storageService.saveSessionToken('valid-token');
      await storageService.saveActiveWorkspaceId('workspace-id');

      bool sessionExpiredCalled = false;
      bool revocationCalled = false;

      final interceptor = AuthInterceptor(
        storage: storageService,
        onSessionExpired: () => sessionExpiredCalled = true,
        onRevocationDetected: () => revocationCalled = true,
      );

      final dioError = DioException(
        requestOptions: RequestOptions(path: '/v1/me'),
        response: Response(
          requestOptions: RequestOptions(path: '/v1/me'),
          statusCode: 401,
          data: {'error': 'DEVICE_REVOKED', 'message': 'Device installation has been revoked'},
        ),
      );

      final errorHandler = _TestErrorInterceptorHandler();
      interceptor.onError(dioError, errorHandler);

      await Future.delayed(const Duration(milliseconds: 50));

      expect(revocationCalled, isTrue);
      expect(sessionExpiredCalled, isFalse);
      expect(await storageService.getSessionToken(), isNull);
      expect(await storageService.isInstallationRevoked(), isTrue);
    });

    test('5. Handles 401 nested ApiError format: marks revoked and triggers revocation callback', () async {
      await storageService.saveSessionToken('valid-token');
      await storageService.saveActiveWorkspaceId('workspace-id');

      bool sessionExpiredCalled = false;
      bool revocationCalled = false;

      final interceptor = AuthInterceptor(
        storage: storageService,
        onSessionExpired: () => sessionExpiredCalled = true,
        onRevocationDetected: () => revocationCalled = true,
      );

      final dioError = DioException(
        requestOptions: RequestOptions(path: '/v1/me'),
        response: Response(
          requestOptions: RequestOptions(path: '/v1/me'),
          statusCode: 401,
          data: {
            'statusCode': 401,
            'error': {'code': 'DEVICE_REVOKED', 'message': 'Device installation has been revoked'},
          },
        ),
      );

      final errorHandler = _TestErrorInterceptorHandler();
      interceptor.onError(dioError, errorHandler);

      await Future.delayed(const Duration(milliseconds: 50));

      expect(revocationCalled, isTrue);
      expect(sessionExpiredCalled, isFalse);
      expect(await storageService.getSessionToken(), isNull);
      expect(await storageService.isInstallationRevoked(), isTrue);
    });
  });
}

class _TestRequestInterceptorHandler extends RequestInterceptorHandler {
  @override
  void next(RequestOptions requestOptions) {}
}

class _TestErrorInterceptorHandler extends ErrorInterceptorHandler {
  @override
  void next(DioException err) {}
}

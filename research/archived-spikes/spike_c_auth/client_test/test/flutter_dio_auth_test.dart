import 'dart:io';
import 'package:dio/dio.dart';
import 'package:test/test.dart';
import 'package:uuid/uuid.dart';

class MockSecureStorage {
  final Map<String, String> _sessionStore = {};
  final Map<String, String> _installationStore = {};

  void setSessionToken(String token) => _sessionStore['session_token'] = token;
  String? getSessionToken() => _sessionStore['session_token'];
  void clearSession() => _sessionStore.clear();

  void setInstallationId(String id) => _installationStore['installation_id'] = id;
  String? getInstallationId() => _installationStore['installation_id'];
}

class OprinoAuthInterceptor extends Interceptor {
  final MockSecureStorage storage;

  OprinoAuthInterceptor({required this.storage});

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    // Mandate native trusted origin header for Better Auth CSRF validation
    options.headers['Origin'] = 'oprino://app';

    final token = storage.getSessionToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }

    final installationId = storage.getInstallationId();
    if (installationId != null) {
      options.headers['X-Installation-Id'] = installationId;
    }

    handler.next(options);
  }
}

void main() {
  const uuid = Uuid();
  late Dio dio;
  late MockSecureStorage storage;
  const baseUrl = 'http://127.0.0.1:3088';

  setUpAll(() async {
    storage = MockSecureStorage();
    storage.setInstallationId('inst_${uuid.v4()}');

    dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 5),
      receiveTimeout: const Duration(seconds: 5),
    ));

    dio.interceptors.add(OprinoAuthInterceptor(storage: storage));
  });

  group('SPIKE C — Complete Flutter / Dio Client Auth Validation', () {
    test('1. Email Sign Up & Sign In via Better Auth with Bearer Token Capture', () async {
      final email = 'field.worker.${DateTime.now().millisecondsSinceEpoch}@oprino.com';
      const password = 'securePassword123!';

      // Sign Up
      final signupRes = await dio.post('/api/auth/sign-up/email', data: {
        'email': email,
        'password': password,
        'name': 'Aakash Verma',
      });
      expect(signupRes.statusCode, 200);

      // Sign In
      final signinRes = await dio.post('/api/auth/sign-in/email', data: {
        'email': email,
        'password': password,
      });
      expect(signinRes.statusCode, 200);

      final token = signinRes.data['token'];
      expect(token, isNotNull);
      expect(token.toString().length, greaterThan(16));

      // Persist to namespaced secure storage
      storage.setSessionToken(token.toString());
      expect(storage.getSessionToken(), equals(token));
    });

    test('2. Device Installation Registration & Authenticated GET /v1/me', () async {
      // Register installation
      final regRes = await dio.post('/v1/devices/register', data: {
        'installationId': storage.getInstallationId(),
        'workspaceId': 'ws_delhi_hvac',
        'deviceModel': 'Samsung Galaxy S23',
        'osVersion': 'Android 14',
      });
      expect(regRes.statusCode, 200);
      expect(regRes.data['status'], 'APPROVED');

      // Authenticated request with interceptor
      final meRes = await dio.get('/v1/me');
      expect(meRes.statusCode, 200);
      expect(meRes.data['session']['activeWorkspaceId'], 'ws_delhi_hvac');
      expect(meRes.data['session']['installationId'], storage.getInstallationId());
    });

    test('3. Dynamic Workspace Switch', () async {
      final switchRes = await dio.post('/v1/workspaces/switch', data: {
        'targetWorkspaceId': 'ws_mumbai_facilities',
      });
      expect(switchRes.statusCode, 200);

      final meRes = await dio.get('/v1/me');
      expect(meRes.data['session']['activeWorkspaceId'], 'ws_mumbai_facilities');
    });

    test('4. Administrative Device Revocation Rejection', () async {
      final currentInstallation = storage.getInstallationId()!;
      // Admin revokes device
      await dio.post('/v1/admin/devices/revoke', data: {
        'installationId': currentInstallation,
      });

      // Subsequent authenticated requests from this installation must fail with HTTP 401/403
      expect(
        () async => await dio.get('/v1/me'),
        throwsA(isA<DioException>().having(
          (e) => e.response?.statusCode,
          'statusCode',
          anyOf(401, 403),
        )),
      );
    });

    test('5. Reinstall Flow with New Installation ID & New Session', () async {
      final email = 'field.worker.reinstall@oprino.com';
      const password = 'securePassword123!';

      // Create user
      await dio.post('/api/auth/sign-up/email', data: {
        'email': email,
        'password': password,
        'name': 'Sunil Kumar',
      });

      // Reinstall happens: Secure storage wiped -> fresh Installation ID
      storage.clearSession();
      final newInstallationId = 'inst_${uuid.v4()}';
      storage.setInstallationId(newInstallationId);

      // Sign In on new installation
      final signinRes = await dio.post('/api/auth/sign-in/email', data: {
        'email': email,
        'password': password,
      });
      storage.setSessionToken(signinRes.data['token'].toString());

      // Register new installation
      final regRes = await dio.post('/v1/devices/register', data: {
        'installationId': newInstallationId,
        'workspaceId': 'ws_delhi_hvac',
        'deviceModel': 'Xiaomi Redmi 12',
        'osVersion': 'Android 13',
      });
      expect(regRes.statusCode, 200);

      final meRes = await dio.get('/v1/me');
      expect(meRes.statusCode, 200);
      expect(meRes.data['session']['installationId'], equals(newInstallationId));
    });

    test('6. User Logout & Session Replay Protection', () async {
      final activeToken = storage.getSessionToken()!;

      // Logout
      final logoutRes = await dio.post('/api/auth/sign-out');
      expect(logoutRes.statusCode, 200);
      storage.clearSession();

      // Replay old token
      final replayDio = Dio(BaseOptions(baseUrl: baseUrl));
      expect(
        () async => await replayDio.get(
          '/v1/me',
          options: Options(headers: {
            'Authorization': 'Bearer $activeToken',
            'Origin': 'oprino://app',
          }),
        ),
        throwsA(isA<DioException>().having(
          (e) => e.response?.statusCode,
          'statusCode',
          401,
        )),
      );
    });
  });
}

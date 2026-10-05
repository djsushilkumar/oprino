// GENERATED CODE - DO NOT MODIFY BY HAND
// Generated from OpenAPI 3.1 specification by @oprino/contracts

import 'package:dio/dio.dart';
import 'model/health_response.dart';
import 'model/version_response.dart';
import 'model/api_error.dart';
import 'model/auth_models.dart';
import 'model/workspace_models.dart';
import 'model/me_models.dart';
import 'model/device_models.dart';

class OprinoApiClient {
  final Dio dio;

  OprinoApiClient({
    Dio? dio,
    String baseUrl = 'http://10.0.2.2:3000',
  }) : dio = dio ??
            Dio(BaseOptions(
              baseUrl: baseUrl,
              connectTimeout: const Duration(seconds: 10),
              receiveTimeout: const Duration(seconds: 10),
              headers: {
                'Origin': 'oprino://app',
                'Accept': 'application/json',
              },
            ));

  Future<HealthResponse> getHealth() async {
    try {
      final response = await dio.get<Map<String, dynamic>>('/health');
      return HealthResponse.fromJson(response.data!);
    } on DioException catch (e) {
      _handleDioException(e);
      rethrow;
    }
  }

  Future<VersionResponse> getVersion() async {
    try {
      final response = await dio.get<Map<String, dynamic>>('/v1/version');
      return VersionResponse.fromJson(response.data!);
    } on DioException catch (e) {
      _handleDioException(e);
      rethrow;
    }
  }

  Future<AuthResponse> signUp({
    required String email,
    required String password,
    required String name,
  }) async {
    try {
      final response = await dio.post<Map<String, dynamic>>(
        '/v1/auth/signup',
        data: {
          'email': email,
          'password': password,
          'name': name,
        },
      );
      return AuthResponse.fromJson(response.data!);
    } on DioException catch (e) {
      _handleDioException(e);
      rethrow;
    }
  }

  Future<AuthResponse> signIn({
    required String email,
    required String password,
  }) async {
    try {
      final response = await dio.post<Map<String, dynamic>>(
        '/v1/auth/signin',
        data: {
          'email': email,
          'password': password,
        },
      );
      return AuthResponse.fromJson(response.data!);
    } on DioException catch (e) {
      _handleDioException(e);
      rethrow;
    }
  }

  Future<SignOutResponse> signOut() async {
    try {
      final response = await dio.post<Map<String, dynamic>>('/v1/auth/signout');
      return SignOutResponse.fromJson(response.data!);
    } on DioException catch (e) {
      _handleDioException(e);
      rethrow;
    }
  }

  Future<MeResponse> getMe() async {
    try {
      final response = await dio.get<Map<String, dynamic>>('/v1/me');
      return MeResponse.fromJson(response.data!);
    } on DioException catch (e) {
      _handleDioException(e);
      rethrow;
    }
  }

  Future<WorkspaceResponse> createWorkspace({
    required String name,
    String? slug,
  }) async {
    try {
      final response = await dio.post<Map<String, dynamic>>(
        '/v1/workspaces',
        data: {
          'name': name,
          if (slug != null) 'slug': slug,
        },
      );
      return WorkspaceResponse.fromJson(response.data!);
    } on DioException catch (e) {
      _handleDioException(e);
      rethrow;
    }
  }

  Future<ListWorkspacesResponse> listWorkspaces() async {
    try {
      final response = await dio.get<Map<String, dynamic>>('/v1/workspaces');
      return ListWorkspacesResponse.fromJson(response.data!);
    } on DioException catch (e) {
      _handleDioException(e);
      rethrow;
    }
  }

  Future<SwitchWorkspaceResponse> switchWorkspace({
    required String workspaceId,
  }) async {
    try {
      final response = await dio.post<Map<String, dynamic>>(
        '/v1/session/workspace',
        data: {
          'workspaceId': workspaceId,
        },
      );
      return SwitchWorkspaceResponse.fromJson(response.data!);
    } on DioException catch (e) {
      _handleDioException(e);
      rethrow;
    }
  }

  Future<DeviceResponse> registerDevice({
    required String installationId,
    required String platform,
    String? deviceModel,
    String? osVersion,
    String? appVersion,
    String? pushToken,
  }) async {
    try {
      final response = await dio.post<Map<String, dynamic>>(
        '/v1/devices/register',
        data: {
          'installationId': installationId,
          'platform': platform,
          if (deviceModel != null) 'deviceModel': deviceModel,
          if (osVersion != null) 'osVersion': osVersion,
          if (appVersion != null) 'appVersion': appVersion,
          if (pushToken != null) 'pushToken': pushToken,
        },
      );
      return DeviceResponse.fromJson(response.data!);
    } on DioException catch (e) {
      _handleDioException(e);
      rethrow;
    }
  }

  Future<ListDevicesResponse> listDevices() async {
    try {
      final response = await dio.get<Map<String, dynamic>>('/v1/devices');
      return ListDevicesResponse.fromJson(response.data!);
    } on DioException catch (e) {
      _handleDioException(e);
      rethrow;
    }
  }

  Future<RevokeDeviceResponse> revokeDevice({
    required String installationId,
  }) async {
    try {
      final response = await dio.post<Map<String, dynamic>>(
        '/v1/devices/revoke',
        data: {
          'installationId': installationId,
        },
      );
      return RevokeDeviceResponse.fromJson(response.data!);
    } on DioException catch (e) {
      _handleDioException(e);
      rethrow;
    }
  }

  void _handleDioException(DioException e) {
    if (e.response?.data is Map<String, dynamic>) {
      throw ApiError.fromJson(e.response!.data as Map<String, dynamic>);
    }
  }
}

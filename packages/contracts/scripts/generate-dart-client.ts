import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const openApiPath = path.resolve(rootDir, 'dist', 'openapi.json');
const targetDartDir = path.resolve(rootDir, '..', '..', 'generated', 'dart-api');

if (!fs.existsSync(openApiPath)) {
  console.error(`OpenAPI spec not found at ${openApiPath}. Please run export:openapi first.`);
  process.exit(1);
}

const spec = JSON.parse(fs.readFileSync(openApiPath, 'utf-8'));

const modelDir = path.resolve(targetDartDir, 'lib', 'src', 'model');
const srcDir = path.resolve(targetDartDir, 'lib', 'src');
const libDir = path.resolve(targetDartDir, 'lib');

fs.mkdirSync(modelDir, { recursive: true });

// 1. HealthResponse
const healthResponseContent = `// GENERATED CODE - DO NOT MODIFY BY HAND
// Generated from OpenAPI 3.1 specification by @oprino/contracts

class HealthResponse {
  final String status;
  final DateTime timestamp;
  final Map<String, String> services;

  const HealthResponse({
    required this.status,
    required this.timestamp,
    required this.services,
  });

  factory HealthResponse.fromJson(Map<String, dynamic> json) {
    return HealthResponse(
      status: json['status'] as String,
      timestamp: DateTime.parse(json['timestamp'] as String),
      services: (json['services'] as Map<String, dynamic>).map(
        (key, value) => MapEntry(key, value as String),
      ),
    );
  }

  Map<String, dynamic> toJson() => {
        'status': status,
        'timestamp': timestamp.toIso8601String(),
        'services': services,
      };
}
`;
fs.writeFileSync(path.resolve(modelDir, 'health_response.dart'), healthResponseContent, 'utf-8');

// 2. VersionResponse
const versionResponseContent = `// GENERATED CODE - DO NOT MODIFY BY HAND
// Generated from OpenAPI 3.1 specification by @oprino/contracts

class VersionResponse {
  final String name;
  final String version;
  final String environment;
  final String? gitCommit;
  final Map<String, dynamic> architecture;

  const VersionResponse({
    required this.name,
    required this.version,
    required this.environment,
    this.gitCommit,
    required this.architecture,
  });

  factory VersionResponse.fromJson(Map<String, dynamic> json) {
    return VersionResponse(
      name: json['name'] as String,
      version: json['version'] as String,
      environment: json['environment'] as String,
      gitCommit: json['gitCommit'] as String?,
      architecture: json['architecture'] as Map<String, dynamic>,
    );
  }

  Map<String, dynamic> toJson() => {
        'name': name,
        'version': version,
        'environment': environment,
        if (gitCommit != null) 'gitCommit': gitCommit,
        'architecture': architecture,
      };
}
`;
fs.writeFileSync(path.resolve(modelDir, 'version_response.dart'), versionResponseContent, 'utf-8');

// 3. ApiError
const apiErrorContent = `// GENERATED CODE - DO NOT MODIFY BY HAND
// Generated from OpenAPI 3.1 specification by @oprino/contracts

class ApiError implements Exception {
  final int statusCode;
  final String error;
  final String message;
  final List<dynamic>? details;

  const ApiError({
    required this.statusCode,
    required this.error,
    required this.message,
    this.details,
  });

  factory ApiError.fromJson(Map<String, dynamic> json) {
    return ApiError(
      statusCode: json['statusCode'] as int? ?? 500,
      error: json['error'] as String? ?? 'Error',
      message: json['message'] as String? ?? 'An unexpected error occurred',
      details: json['details'] as List<dynamic>?,
    );
  }

  @override
  String toString() => 'ApiError(status: $statusCode, error: $error, message: $message)';
}
`;
fs.writeFileSync(path.resolve(modelDir, 'api_error.dart'), apiErrorContent, 'utf-8');

// 4. Auth Models
const authModelsContent = `// GENERATED CODE - DO NOT MODIFY BY HAND
// Generated from OpenAPI 3.1 specification by @oprino/contracts

class AuthUser {
  final String id;
  final String email;
  final String name;
  final bool emailVerified;
  final String? image;

  const AuthUser({
    required this.id,
    required this.email,
    required this.name,
    required this.emailVerified,
    this.image,
  });

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: json['id'] as String,
      email: json['email'] as String,
      name: json['name'] as String,
      emailVerified: json['emailVerified'] as bool? ?? false,
      image: json['image'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'name': name,
        'emailVerified': emailVerified,
        if (image != null) 'image': image,
      };
}

class AuthResponse {
  final String token;
  final AuthUser user;
  final String? activeWorkspaceId;

  const AuthResponse({
    required this.token,
    required this.user,
    this.activeWorkspaceId,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      token: json['token'] as String,
      user: AuthUser.fromJson(json['user'] as Map<String, dynamic>),
      activeWorkspaceId: json['activeWorkspaceId'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'token': token,
        'user': user.toJson(),
        if (activeWorkspaceId != null) 'activeWorkspaceId': activeWorkspaceId,
      };
}

class SignOutResponse {
  final bool success;

  const SignOutResponse({required this.success});

  factory SignOutResponse.fromJson(Map<String, dynamic> json) {
    return SignOutResponse(
      success: json['success'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() => {'success': success};
}
`;
fs.writeFileSync(path.resolve(modelDir, 'auth_models.dart'), authModelsContent, 'utf-8');

// 5. Workspace Models
const workspaceModelsContent = `// GENERATED CODE - DO NOT MODIFY BY HAND
// Generated from OpenAPI 3.1 specification by @oprino/contracts

class WorkspaceResponse {
  final String id;
  final String name;
  final String slug;
  final String status;
  final String role;
  final List<String> permissions;
  final DateTime createdAt;

  const WorkspaceResponse({
    required this.id,
    required this.name,
    required this.slug,
    required this.status,
    required this.role,
    required this.permissions,
    required this.createdAt,
  });

  factory WorkspaceResponse.fromJson(Map<String, dynamic> json) {
    return WorkspaceResponse(
      id: json['id'] as String,
      name: json['name'] as String,
      slug: json['slug'] as String,
      status: json['status'] as String,
      role: json['role'] as String,
      permissions: (json['permissions'] as List<dynamic>).map((e) => e as String).toList(),
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'slug': slug,
        'status': status,
        'role': role,
        'permissions': permissions,
        'createdAt': createdAt.toIso8601String(),
      };
}

class WorkspaceListItem {
  final String id;
  final String name;
  final String slug;
  final String status;
  final String membershipStatus;
  final String roleName;

  const WorkspaceListItem({
    required this.id,
    required this.name,
    required this.slug,
    required this.status,
    required this.membershipStatus,
    required this.roleName,
  });

  factory WorkspaceListItem.fromJson(Map<String, dynamic> json) {
    return WorkspaceListItem(
      id: json['id'] as String,
      name: json['name'] as String,
      slug: json['slug'] as String,
      status: json['status'] as String,
      membershipStatus: json['membershipStatus'] as String,
      roleName: json['roleName'] as String,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'slug': slug,
        'status': status,
        'membershipStatus': membershipStatus,
        'roleName': roleName,
      };
}

class ListWorkspacesResponse {
  final List<WorkspaceListItem> workspaces;

  const ListWorkspacesResponse({required this.workspaces});

  factory ListWorkspacesResponse.fromJson(Map<String, dynamic> json) {
    return ListWorkspacesResponse(
      workspaces: (json['workspaces'] as List<dynamic>)
          .map((e) => WorkspaceListItem.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() => {
        'workspaces': workspaces.map((w) => w.toJson()).toList(),
      };
}

class SwitchWorkspaceResponse {
  final String activeWorkspaceId;
  final String name;
  final String role;
  final List<String> permissions;

  const SwitchWorkspaceResponse({
    required this.activeWorkspaceId,
    required this.name,
    required this.role,
    required this.permissions,
  });

  factory SwitchWorkspaceResponse.fromJson(Map<String, dynamic> json) {
    return SwitchWorkspaceResponse(
      activeWorkspaceId: json['activeWorkspaceId'] as String,
      name: json['name'] as String,
      role: json['role'] as String,
      permissions: (json['permissions'] as List<dynamic>).map((e) => e as String).toList(),
    );
  }

  Map<String, dynamic> toJson() => {
        'activeWorkspaceId': activeWorkspaceId,
        'name': name,
        'role': role,
        'permissions': permissions,
      };
}
`;
fs.writeFileSync(path.resolve(modelDir, 'workspace_models.dart'), workspaceModelsContent, 'utf-8');

// 6. Me & Session Context Models
const meModelsContent = `// GENERATED CODE - DO NOT MODIFY BY HAND
// Generated from OpenAPI 3.1 specification by @oprino/contracts

import 'auth_models.dart';

class ActiveWorkspaceInfo {
  final String id;
  final String name;
  final String slug;
  final String status;

  const ActiveWorkspaceInfo({
    required this.id,
    required this.name,
    required this.slug,
    required this.status,
  });

  factory ActiveWorkspaceInfo.fromJson(Map<String, dynamic> json) {
    return ActiveWorkspaceInfo(
      id: json['id'] as String,
      name: json['name'] as String,
      slug: json['slug'] as String,
      status: json['status'] as String,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'slug': slug,
        'status': status,
      };
}

class MembershipInfo {
  final String id;
  final String status;

  const MembershipInfo({required this.id, required this.status});

  factory MembershipInfo.fromJson(Map<String, dynamic> json) {
    return MembershipInfo(
      id: json['id'] as String,
      status: json['status'] as String,
    );
  }

  Map<String, dynamic> toJson() => {'id': id, 'status': status};
}

class RoleInfo {
  final String id;
  final String name;

  const RoleInfo({required this.id, required this.name});

  factory RoleInfo.fromJson(Map<String, dynamic> json) {
    return RoleInfo(
      id: json['id'] as String,
      name: json['name'] as String,
    );
  }

  Map<String, dynamic> toJson() => {'id': id, 'name': name};
}

class InstallationInfo {
  final String id;
  final String installationId;
  final String status;
  final bool isTrusted;

  const InstallationInfo({
    required this.id,
    required this.installationId,
    required this.status,
    required this.isTrusted,
  });

  factory InstallationInfo.fromJson(Map<String, dynamic> json) {
    return InstallationInfo(
      id: json['id'] as String,
      installationId: json['installationId'] as String,
      status: json['status'] as String,
      isTrusted: json['isTrusted'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'installationId': installationId,
        'status': status,
        'isTrusted': isTrusted,
      };
}

class MeResponse {
  final AuthUser user;
  final ActiveWorkspaceInfo? activeWorkspace;
  final MembershipInfo? membership;
  final RoleInfo? role;
  final List<String> permissions;
  final InstallationInfo? currentInstallation;

  const MeResponse({
    required this.user,
    this.activeWorkspace,
    this.membership,
    this.role,
    required this.permissions,
    this.currentInstallation,
  });

  factory MeResponse.fromJson(Map<String, dynamic> json) {
    return MeResponse(
      user: AuthUser.fromJson(json['user'] as Map<String, dynamic>),
      activeWorkspace: json['activeWorkspace'] != null
          ? ActiveWorkspaceInfo.fromJson(json['activeWorkspace'] as Map<String, dynamic>)
          : null,
      membership: json['membership'] != null
          ? MembershipInfo.fromJson(json['membership'] as Map<String, dynamic>)
          : null,
      role: json['role'] != null
          ? RoleInfo.fromJson(json['role'] as Map<String, dynamic>)
          : null,
      permissions: (json['permissions'] as List<dynamic>? ?? []).map((e) => e as String).toList(),
      currentInstallation: json['currentInstallation'] != null
          ? InstallationInfo.fromJson(json['currentInstallation'] as Map<String, dynamic>)
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'user': user.toJson(),
        if (activeWorkspace != null) 'activeWorkspace': activeWorkspace!.toJson(),
        if (membership != null) 'membership': membership!.toJson(),
        if (role != null) 'role': role!.toJson(),
        'permissions': permissions,
        if (currentInstallation != null) 'currentInstallation': currentInstallation!.toJson(),
      };
}
`;
fs.writeFileSync(path.resolve(modelDir, 'me_models.dart'), meModelsContent, 'utf-8');

// 7. Device Models
const deviceModelsContent = `// GENERATED CODE - DO NOT MODIFY BY HAND
// Generated from OpenAPI 3.1 specification by @oprino/contracts

class DeviceResponse {
  final String id;
  final String installationId;
  final String platform;
  final String? deviceModel;
  final String? osVersion;
  final String? appVersion;
  final String status;
  final bool isTrusted;
  final DateTime lastActiveAt;

  const DeviceResponse({
    required this.id,
    required this.installationId,
    required this.platform,
    this.deviceModel,
    this.osVersion,
    this.appVersion,
    required this.status,
    required this.isTrusted,
    required this.lastActiveAt,
  });

  factory DeviceResponse.fromJson(Map<String, dynamic> json) {
    return DeviceResponse(
      id: json['id'] as String,
      installationId: json['installationId'] as String,
      platform: json['platform'] as String,
      deviceModel: json['deviceModel'] as String?,
      osVersion: json['osVersion'] as String?,
      appVersion: json['appVersion'] as String?,
      status: json['status'] as String,
      isTrusted: json['isTrusted'] as bool? ?? true,
      lastActiveAt: DateTime.parse(json['lastActiveAt'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'installationId': installationId,
        'platform': platform,
        if (deviceModel != null) 'deviceModel': deviceModel,
        if (osVersion != null) 'osVersion': osVersion,
        if (appVersion != null) 'appVersion': appVersion,
        'status': status,
        'isTrusted': isTrusted,
        'lastActiveAt': lastActiveAt.toIso8601String(),
      };
}

class ListDevicesResponse {
  final List<DeviceResponse> devices;

  const ListDevicesResponse({required this.devices});

  factory ListDevicesResponse.fromJson(Map<String, dynamic> json) {
    return ListDevicesResponse(
      devices: (json['devices'] as List<dynamic>)
          .map((e) => DeviceResponse.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() => {
        'devices': devices.map((d) => d.toJson()).toList(),
      };
}

class RevokeDeviceResponse {
  final bool success;
  final String message;

  const RevokeDeviceResponse({required this.success, required this.message});

  factory RevokeDeviceResponse.fromJson(Map<String, dynamic> json) {
    return RevokeDeviceResponse(
      success: json['success'] as bool? ?? true,
      message: json['message'] as String? ?? 'Revoked',
    );
  }

  Map<String, dynamic> toJson() => {
        'success': success,
        'message': message,
      };
}
`;
fs.writeFileSync(path.resolve(modelDir, 'device_models.dart'), deviceModelsContent, 'utf-8');

// 8. Generate ApiClient
const apiClientContent = `// GENERATED CODE - DO NOT MODIFY BY HAND
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
`;
fs.writeFileSync(path.resolve(srcDir, 'api_client.dart'), apiClientContent, 'utf-8');

// 9. Generate Root Library Export
const oprinoApiContent = `// GENERATED CODE - DO NOT MODIFY BY HAND
// Generated from OpenAPI 3.1 specification by @oprino/contracts

library oprino_api;

export 'src/api_client.dart';
export 'src/model/health_response.dart';
export 'src/model/version_response.dart';
export 'src/model/api_error.dart';
export 'src/model/auth_models.dart';
export 'src/model/workspace_models.dart';
export 'src/model/me_models.dart';
export 'src/model/device_models.dart';
`;
fs.writeFileSync(path.resolve(libDir, 'oprino_api.dart'), oprinoApiContent, 'utf-8');

console.log(`✓ Generated Dart API client from OpenAPI ${spec.openapi} into generated/dart-api`);

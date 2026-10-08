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

// 8. Task Models (Phase 02B)
const taskModelsContent = `// GENERATED CODE - DO NOT MODIFY BY HAND
// Generated from OpenAPI 3.1 specification by @oprino/contracts

class TaskAssignee {
  final String id;
  final String taskId;
  final String userId;
  final String name;
  final String email;
  final DateTime assignedAt;

  const TaskAssignee({
    required this.id,
    required this.taskId,
    required this.userId,
    required this.name,
    required this.email,
    required this.assignedAt,
  });

  factory TaskAssignee.fromJson(Map<String, dynamic> json) {
    return TaskAssignee(
      id: json['id'] as String,
      taskId: json['taskId'] as String,
      userId: json['userId'] as String,
      name: json['name'] as String,
      email: json['email'] as String,
      assignedAt: DateTime.parse(json['assignedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'taskId': taskId,
        'userId': userId,
        'name': name,
        'email': email,
        'assignedAt': assignedAt.toIso8601String(),
      };
}

class TaskChecklistItem {
  final String id;
  final String taskId;
  final String title;
  final bool isCompleted;
  final int sortOrder;
  final String? completedBy;
  final DateTime? completedAt;
  final DateTime createdAt;

  const TaskChecklistItem({
    required this.id,
    required this.taskId,
    required this.title,
    required this.isCompleted,
    required this.sortOrder,
    this.completedBy,
    this.completedAt,
    required this.createdAt,
  });

  factory TaskChecklistItem.fromJson(Map<String, dynamic> json) {
    return TaskChecklistItem(
      id: json['id'] as String,
      taskId: json['taskId'] as String,
      title: json['title'] as String,
      isCompleted: json['isCompleted'] as bool? ?? false,
      sortOrder: json['sortOrder'] as int? ?? 0,
      completedBy: json['completedBy'] as String?,
      completedAt: json['completedAt'] != null
          ? DateTime.parse(json['completedAt'] as String)
          : null,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'taskId': taskId,
        'title': title,
        'isCompleted': isCompleted,
        'sortOrder': sortOrder,
        if (completedBy != null) 'completedBy': completedBy,
        if (completedAt != null) 'completedAt': completedAt!.toIso8601String(),
        'createdAt': createdAt.toIso8601String(),
      };
}

class TaskComment {
  final String id;
  final String taskId;
  final String authorId;
  final String authorName;
  final String content;
  final DateTime createdAt;

  const TaskComment({
    required this.id,
    required this.taskId,
    required this.authorId,
    required this.authorName,
    required this.content,
    required this.createdAt,
  });

  factory TaskComment.fromJson(Map<String, dynamic> json) {
    return TaskComment(
      id: json['id'] as String,
      taskId: json['taskId'] as String,
      authorId: json['authorId'] as String,
      authorName: json['authorName'] as String,
      content: json['content'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'taskId': taskId,
        'authorId': authorId,
        'authorName': authorName,
        'content': content,
        'createdAt': createdAt.toIso8601String(),
      };
}

class TaskActivity {
  final String id;
  final String taskId;
  final String actorId;
  final String actorName;
  final String action;
  final String? fromStatus;
  final String? toStatus;
  final Map<String, dynamic>? details;
  final DateTime createdAt;

  const TaskActivity({
    required this.id,
    required this.taskId,
    required this.actorId,
    required this.actorName,
    required this.action,
    this.fromStatus,
    this.toStatus,
    this.details,
    required this.createdAt,
  });

  factory TaskActivity.fromJson(Map<String, dynamic> json) {
    return TaskActivity(
      id: json['id'] as String,
      taskId: json['taskId'] as String,
      actorId: json['actorId'] as String,
      actorName: json['actorName'] as String,
      action: json['action'] as String,
      fromStatus: json['fromStatus'] as String?,
      toStatus: json['toStatus'] as String?,
      details: json['details'] as Map<String, dynamic>?,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'taskId': taskId,
        'actorId': actorId,
        'actorName': actorName,
        'action': action,
        if (fromStatus != null) 'fromStatus': fromStatus,
        if (toStatus != null) 'toStatus': toStatus,
        if (details != null) 'details': details,
        'createdAt': createdAt.toIso8601String(),
      };
}

class TaskResponse {
  final String id;
  final String workspaceId;
  final String title;
  final String? description;
  final String status;
  final String simplifiedStatus;
  final String priority;
  final DateTime? dueAt;
  final String createdBy;
  final String? creatorName;
  final int version;
  final List<TaskAssignee> assignees;
  final List<TaskChecklistItem> checklist;
  final List<TaskComment> comments;
  final List<TaskActivity> activities;
  final DateTime createdAt;
  final DateTime updatedAt;

  const TaskResponse({
    required this.id,
    required this.workspaceId,
    required this.title,
    this.description,
    required this.status,
    required this.simplifiedStatus,
    required this.priority,
    this.dueAt,
    required this.createdBy,
    this.creatorName,
    required this.version,
    required this.assignees,
    this.checklist = const [],
    this.comments = const [],
    this.activities = const [],
    required this.createdAt,
    required this.updatedAt,
  });

  factory TaskResponse.fromJson(Map<String, dynamic> json) {
    return TaskResponse(
      id: json['id'] as String,
      workspaceId: json['workspaceId'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      status: json['status'] as String,
      simplifiedStatus: json['simplifiedStatus'] as String? ?? 'TO_DO',
      priority: json['priority'] as String? ?? 'MEDIUM',
      dueAt: json['dueAt'] != null ? DateTime.parse(json['dueAt'] as String) : null,
      createdBy: json['createdBy'] as String,
      creatorName: json['creatorName'] as String?,
      version: json['version'] as int? ?? 1,
      assignees: (json['assignees'] as List<dynamic>? ?? [])
          .map((e) => TaskAssignee.fromJson(e as Map<String, dynamic>))
          .toList(),
      checklist: (json['checklist'] as List<dynamic>? ?? [])
          .map((e) => TaskChecklistItem.fromJson(e as Map<String, dynamic>))
          .toList(),
      comments: (json['comments'] as List<dynamic>? ?? [])
          .map((e) => TaskComment.fromJson(e as Map<String, dynamic>))
          .toList(),
      activities: (json['activities'] as List<dynamic>? ?? [])
          .map((e) => TaskActivity.fromJson(e as Map<String, dynamic>))
          .toList(),
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'workspaceId': workspaceId,
        'title': title,
        if (description != null) 'description': description,
        'status': status,
        'simplifiedStatus': simplifiedStatus,
        'priority': priority,
        if (dueAt != null) 'dueAt': dueAt!.toIso8601String(),
        'createdBy': createdBy,
        if (creatorName != null) 'creatorName': creatorName,
        'version': version,
        'assignees': assignees.map((e) => e.toJson()).toList(),
        'checklist': checklist.map((e) => e.toJson()).toList(),
        'comments': comments.map((e) => e.toJson()).toList(),
        'activities': activities.map((e) => e.toJson()).toList(),
        'createdAt': createdAt.toIso8601String(),
        'updatedAt': updatedAt.toIso8601String(),
      };
}

class ListTasksResponse {
  final List<TaskResponse> tasks;
  final int total;

  const ListTasksResponse({required this.tasks, required this.total});

  factory ListTasksResponse.fromJson(Map<String, dynamic> json) {
    return ListTasksResponse(
      tasks: (json['tasks'] as List<dynamic>)
          .map((e) => TaskResponse.fromJson(e as Map<String, dynamic>))
          .toList(),
      total: json['total'] as int? ?? (json['tasks'] as List<dynamic>).length,
    );
  }

  Map<String, dynamic> toJson() => {
        'tasks': tasks.map((e) => e.toJson()).toList(),
        'total': total,
      };
}
`;
fs.writeFileSync(path.resolve(modelDir, 'task_models.dart'), taskModelsContent, 'utf-8');

// 9. Attendance Models (Phase 02B)
const attendanceModelsContent = `// GENERATED CODE - DO NOT MODIFY BY HAND
// Generated from OpenAPI 3.1 specification by @oprino/contracts

class AttendanceShift {
  final String id;
  final String workspaceId;
  final String name;
  final String startTime;
  final String endTime;
  final String timezone;
  final bool isActive;
  final DateTime createdAt;
  final DateTime updatedAt;

  const AttendanceShift({
    required this.id,
    required this.workspaceId,
    required this.name,
    required this.startTime,
    required this.endTime,
    required this.timezone,
    required this.isActive,
    required this.createdAt,
    required this.updatedAt,
  });

  factory AttendanceShift.fromJson(Map<String, dynamic> json) {
    return AttendanceShift(
      id: json['id'] as String,
      workspaceId: json['workspaceId'] as String,
      name: json['name'] as String,
      startTime: json['startTime'] as String,
      endTime: json['endTime'] as String,
      timezone: json['timezone'] as String? ?? 'UTC',
      isActive: json['isActive'] as bool? ?? true,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'workspaceId': workspaceId,
        'name': name,
        'startTime': startTime,
        'endTime': endTime,
        'timezone': timezone,
        'isActive': isActive,
        'createdAt': createdAt.toIso8601String(),
        'updatedAt': updatedAt.toIso8601String(),
      };
}

class ListShiftsResponse {
  final List<AttendanceShift> shifts;

  const ListShiftsResponse({required this.shifts});

  factory ListShiftsResponse.fromJson(Map<String, dynamic> json) {
    return ListShiftsResponse(
      shifts: (json['shifts'] as List<dynamic>)
          .map((e) => AttendanceShift.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() => {
        'shifts': shifts.map((e) => e.toJson()).toList(),
      };
}

class AttendanceSessionResponse {
  final String id;
  final String workspaceId;
  final String userId;
  final String? userName;
  final String? userEmail;
  final String? shiftId;
  final String? shiftName;
  final String status;
  final DateTime punchInTime;
  final DateTime? punchOutTime;
  final int? durationMinutes;
  final bool isLate;
  final int lateMinutes;
  final bool isManualAdjustment;
  final String? adjustmentNote;
  final DateTime createdAt;
  final DateTime updatedAt;

  const AttendanceSessionResponse({
    required this.id,
    required this.workspaceId,
    required this.userId,
    this.userName,
    this.userEmail,
    this.shiftId,
    this.shiftName,
    required this.status,
    required this.punchInTime,
    this.punchOutTime,
    this.durationMinutes,
    this.isLate = false,
    this.lateMinutes = 0,
    this.isManualAdjustment = false,
    this.adjustmentNote,
    required this.createdAt,
    required this.updatedAt,
  });

  factory AttendanceSessionResponse.fromJson(Map<String, dynamic> json) {
    return AttendanceSessionResponse(
      id: json['id'] as String,
      workspaceId: json['workspaceId'] as String,
      userId: json['userId'] as String,
      userName: json['userName'] as String?,
      userEmail: json['userEmail'] as String?,
      shiftId: json['shiftId'] as String?,
      shiftName: json['shiftName'] as String?,
      status: json['status'] as String,
      punchInTime: DateTime.parse(json['punchInTime'] as String),
      punchOutTime: json['punchOutTime'] != null
          ? DateTime.parse(json['punchOutTime'] as String)
          : null,
      durationMinutes: json['durationMinutes'] as int?,
      isLate: json['isLate'] as bool? ?? false,
      lateMinutes: json['lateMinutes'] as int? ?? 0,
      isManualAdjustment: json['isManualAdjustment'] as bool? ?? false,
      adjustmentNote: json['adjustmentNote'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'workspaceId': workspaceId,
        'userId': userId,
        if (userName != null) 'userName': userName,
        if (userEmail != null) 'userEmail': userEmail,
        if (shiftId != null) 'shiftId': shiftId,
        if (shiftName != null) 'shiftName': shiftName,
        'status': status,
        'punchInTime': punchInTime.toIso8601String(),
        if (punchOutTime != null) 'punchOutTime': punchOutTime!.toIso8601String(),
        if (durationMinutes != null) 'durationMinutes': durationMinutes,
        'isLate': isLate,
        'lateMinutes': lateMinutes,
        'isManualAdjustment': isManualAdjustment,
        if (adjustmentNote != null) 'adjustmentNote': adjustmentNote,
        'createdAt': createdAt.toIso8601String(),
        'updatedAt': updatedAt.toIso8601String(),
      };
}

class CurrentAttendanceResponse {
  final String dutyState;
  final AttendanceSessionResponse? activeSession;
  final AttendanceSessionResponse? lastSession;
  final AttendanceShift? assignedShift;
  final DateTime serverTime;

  const CurrentAttendanceResponse({
    required this.dutyState,
    this.activeSession,
    this.lastSession,
    this.assignedShift,
    required this.serverTime,
  });

  factory CurrentAttendanceResponse.fromJson(Map<String, dynamic> json) {
    return CurrentAttendanceResponse(
      dutyState: json['dutyState'] as String,
      activeSession: json['activeSession'] != null
          ? AttendanceSessionResponse.fromJson(json['activeSession'] as Map<String, dynamic>)
          : null,
      lastSession: json['lastSession'] != null
          ? AttendanceSessionResponse.fromJson(json['lastSession'] as Map<String, dynamic>)
          : null,
      assignedShift: json['assignedShift'] != null
          ? AttendanceShift.fromJson(json['assignedShift'] as Map<String, dynamic>)
          : null,
      serverTime: DateTime.parse(json['serverTime'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'dutyState': dutyState,
        if (activeSession != null) 'activeSession': activeSession!.toJson(),
        if (lastSession != null) 'lastSession': lastSession!.toJson(),
        if (assignedShift != null) 'assignedShift': assignedShift!.toJson(),
        'serverTime': serverTime.toIso8601String(),
      };
}

class AttendanceHistoryResponse {
  final List<AttendanceSessionResponse> sessions;
  final int total;

  const AttendanceHistoryResponse({required this.sessions, required this.total});

  factory AttendanceHistoryResponse.fromJson(Map<String, dynamic> json) {
    return AttendanceHistoryResponse(
      sessions: (json['sessions'] as List<dynamic>)
          .map((e) => AttendanceSessionResponse.fromJson(e as Map<String, dynamic>))
          .toList(),
      total: json['total'] as int? ?? (json['sessions'] as List<dynamic>).length,
    );
  }

  Map<String, dynamic> toJson() => {
        'sessions': sessions.map((e) => e.toJson()).toList(),
        'total': total,
      };
}

class TeamAttendanceResponse {
  final int onDutyCount;
  final int offDutyCount;
  final List<AttendanceSessionResponse> activeSessions;
  final List<AttendanceSessionResponse> history;

  const TeamAttendanceResponse({
    required this.onDutyCount,
    required this.offDutyCount,
    required this.activeSessions,
    required this.history,
  });

  factory TeamAttendanceResponse.fromJson(Map<String, dynamic> json) {
    return TeamAttendanceResponse(
      onDutyCount: json['onDutyCount'] as int? ?? 0,
      offDutyCount: json['offDutyCount'] as int? ?? 0,
      activeSessions: (json['activeSessions'] as List<dynamic>? ?? [])
          .map((e) => AttendanceSessionResponse.fromJson(e as Map<String, dynamic>))
          .toList(),
      history: (json['history'] as List<dynamic>? ?? [])
          .map((e) => AttendanceSessionResponse.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() => {
        'onDutyCount': onDutyCount,
        'offDutyCount': offDutyCount,
        'activeSessions': activeSessions.map((e) => e.toJson()).toList(),
        'history': history.map((e) => e.toJson()).toList(),
      };
}
`;
fs.writeFileSync(path.resolve(modelDir, 'attendance_models.dart'), attendanceModelsContent, 'utf-8');

// 10. Generate Telemetry Models (Phase 02C)
const telemetryModelsContent = `// GENERATED CODE - DO NOT MODIFY BY HAND
// Generated from OpenAPI 3.1 specification by @oprino/contracts

class LocationPoint {
  final String id;
  final DateTime recordedAt;
  final double latitude;
  final double longitude;
  final double accuracy;
  final double? speed;
  final double? heading;
  final double? altitude;
  final double? batteryLevel;
  final bool? isCharging;
  final String? activityType;
  final bool? isMoving;

  const LocationPoint({
    required this.id,
    required this.recordedAt,
    required this.latitude,
    required this.longitude,
    required this.accuracy,
    this.speed,
    this.heading,
    this.altitude,
    this.batteryLevel,
    this.isCharging,
    this.activityType,
    this.isMoving,
  });

  factory LocationPoint.fromJson(Map<String, dynamic> json) {
    return LocationPoint(
      id: json['id'] as String,
      recordedAt: DateTime.parse(json['recordedAt'] as String),
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      accuracy: (json['accuracy'] as num).toDouble(),
      speed: (json['speed'] as num?)?.toDouble(),
      heading: (json['heading'] as num?)?.toDouble(),
      altitude: (json['altitude'] as num?)?.toDouble(),
      batteryLevel: (json['batteryLevel'] as num?)?.toDouble(),
      isCharging: json['isCharging'] as bool?,
      activityType: json['activityType'] as String?,
      isMoving: json['isMoving'] as bool?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'recordedAt': recordedAt.toIso8601String(),
        'latitude': latitude,
        'longitude': longitude,
        'accuracy': accuracy,
        if (speed != null) 'speed': speed,
        if (heading != null) 'heading': heading,
        if (altitude != null) 'altitude': altitude,
        if (batteryLevel != null) 'batteryLevel': batteryLevel,
        if (isCharging != null) 'isCharging': isCharging,
        if (activityType != null) 'activityType': activityType,
        if (isMoving != null) 'isMoving': isMoving,
      };
}

class LocationIngestBatchRequest {
  final List<LocationPoint> locations;

  const LocationIngestBatchRequest({required this.locations});

  factory LocationIngestBatchRequest.fromJson(Map<String, dynamic> json) {
    return LocationIngestBatchRequest(
      locations: (json['locations'] as List<dynamic>)
          .map((e) => LocationPoint.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() => {
        'locations': locations.map((e) => e.toJson()).toList(),
      };
}

class LocationIngestResponse {
  final int accepted;
  final int dropped;
  final String? reason;
  final DateTime serverTimestamp;

  const LocationIngestResponse({
    required this.accepted,
    required this.dropped,
    this.reason,
    required this.serverTimestamp,
  });

  factory LocationIngestResponse.fromJson(Map<String, dynamic> json) {
    return LocationIngestResponse(
      accepted: json['accepted'] as int? ?? 0,
      dropped: json['dropped'] as int? ?? 0,
      reason: json['reason'] as String?,
      serverTimestamp: DateTime.parse(json['serverTimestamp'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'accepted': accepted,
        'dropped': dropped,
        if (reason != null) 'reason': reason,
        'serverTimestamp': serverTimestamp.toIso8601String(),
      };
}

class LiveWorkerLocation {
  final String userId;
  final String userName;
  final String? userEmail;
  final String dutyStatus;
  final String? sessionId;
  final DateTime recordedAt;
  final double latitude;
  final double longitude;
  final double accuracy;
  final double? speed;
  final double? heading;
  final double? batteryLevel;
  final bool? isCharging;
  final String? activityType;
  final bool? isMoving;
  final String? currentTaskId;
  final String? currentTaskTitle;

  const LiveWorkerLocation({
    required this.userId,
    required this.userName,
    this.userEmail,
    required this.dutyStatus,
    this.sessionId,
    required this.recordedAt,
    required this.latitude,
    required this.longitude,
    required this.accuracy,
    this.speed,
    this.heading,
    this.batteryLevel,
    this.isCharging,
    this.activityType,
    this.isMoving,
    this.currentTaskId,
    this.currentTaskTitle,
  });

  factory LiveWorkerLocation.fromJson(Map<String, dynamic> json) {
    return LiveWorkerLocation(
      userId: json['userId'] as String,
      userName: json['userName'] as String,
      userEmail: json['userEmail'] as String?,
      dutyStatus: json['dutyStatus'] as String,
      sessionId: json['sessionId'] as String?,
      recordedAt: DateTime.parse(json['recordedAt'] as String),
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      accuracy: (json['accuracy'] as num).toDouble(),
      speed: (json['speed'] as num?)?.toDouble(),
      heading: (json['heading'] as num?)?.toDouble(),
      batteryLevel: (json['batteryLevel'] as num?)?.toDouble(),
      isCharging: json['isCharging'] as bool?,
      activityType: json['activityType'] as String?,
      isMoving: json['isMoving'] as bool?,
      currentTaskId: json['currentTaskId'] as String?,
      currentTaskTitle: json['currentTaskTitle'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'userId': userId,
        'userName': userName,
        if (userEmail != null) 'userEmail': userEmail,
        'dutyStatus': dutyStatus,
        if (sessionId != null) 'sessionId': sessionId,
        'recordedAt': recordedAt.toIso8601String(),
        'latitude': latitude,
        'longitude': longitude,
        'accuracy': accuracy,
        if (speed != null) 'speed': speed,
        if (heading != null) 'heading': heading,
        if (batteryLevel != null) 'batteryLevel': batteryLevel,
        if (isCharging != null) 'isCharging': isCharging,
        if (activityType != null) 'activityType': activityType,
        if (isMoving != null) 'isMoving': isMoving,
        if (currentTaskId != null) 'currentTaskId': currentTaskId,
        if (currentTaskTitle != null) 'currentTaskTitle': currentTaskTitle,
      };
}

class ListLiveWorkersResponse {
  final List<LiveWorkerLocation> workers;

  const ListLiveWorkersResponse({required this.workers});

  factory ListLiveWorkersResponse.fromJson(Map<String, dynamic> json) {
    return ListLiveWorkersResponse(
      workers: (json['workers'] as List<dynamic>)
          .map((e) => LiveWorkerLocation.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() => {
        'workers': workers.map((e) => e.toJson()).toList(),
      };
}

class LocationHistoryResponse {
  final String userId;
  final String? userName;
  final String date;
  final double totalDistanceMeters;
  final int totalDurationMinutes;
  final List<LocationPoint> points;

  const LocationHistoryResponse({
    required this.userId,
    this.userName,
    required this.date,
    required this.totalDistanceMeters,
    required this.totalDurationMinutes,
    required this.points,
  });

  factory LocationHistoryResponse.fromJson(Map<String, dynamic> json) {
    return LocationHistoryResponse(
      userId: json['userId'] as String,
      userName: json['userName'] as String?,
      date: json['date'] as String,
      totalDistanceMeters: (json['totalDistanceMeters'] as num?)?.toDouble() ?? 0.0,
      totalDurationMinutes: json['totalDurationMinutes'] as int? ?? 0,
      points: (json['points'] as List<dynamic>)
          .map((e) => LocationPoint.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() => {
        'userId': userId,
        if (userName != null) 'userName': userName,
        'date': date,
        'totalDistanceMeters': totalDistanceMeters,
        'totalDurationMinutes': totalDurationMinutes,
        'points': points.map((e) => e.toJson()).toList(),
      };
}

class Geofence {
  final String id;
  final String workspaceId;
  final String name;
  final String? description;
  final double latitude;
  final double longitude;
  final double radiusMeters;
  final String geofenceType;
  final bool isActive;
  final String createdBy;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Geofence({
    required this.id,
    required this.workspaceId,
    required this.name,
    this.description,
    required this.latitude,
    required this.longitude,
    required this.radiusMeters,
    required this.geofenceType,
    required this.isActive,
    required this.createdBy,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Geofence.fromJson(Map<String, dynamic> json) {
    return Geofence(
      id: json['id'] as String,
      workspaceId: json['workspaceId'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      radiusMeters: (json['radiusMeters'] as num).toDouble(),
      geofenceType: json['geofenceType'] as String,
      isActive: json['isActive'] as bool? ?? true,
      createdBy: json['createdBy'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'workspaceId': workspaceId,
        'name': name,
        if (description != null) 'description': description,
        'latitude': latitude,
        'longitude': longitude,
        'radiusMeters': radiusMeters,
        'geofenceType': geofenceType,
        'isActive': isActive,
        'createdBy': createdBy,
        'createdAt': createdAt.toIso8601String(),
        'updatedAt': updatedAt.toIso8601String(),
      };
}

class CreateGeofenceRequest {
  final String name;
  final String? description;
  final double latitude;
  final double longitude;
  final double radiusMeters;
  final String geofenceType;

  const CreateGeofenceRequest({
    required this.name,
    this.description,
    required this.latitude,
    required this.longitude,
    this.radiusMeters = 100.0,
    this.geofenceType = 'OFFICE',
  });

  Map<String, dynamic> toJson() => {
        'name': name,
        if (description != null) 'description': description,
        'latitude': latitude,
        'longitude': longitude,
        'radiusMeters': radiusMeters,
        'geofenceType': geofenceType,
      };
}

class ListGeofencesResponse {
  final List<Geofence> geofences;

  const ListGeofencesResponse({required this.geofences});

  factory ListGeofencesResponse.fromJson(Map<String, dynamic> json) {
    return ListGeofencesResponse(
      geofences: (json['geofences'] as List<dynamic>)
          .map((e) => Geofence.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() => {
        'geofences': geofences.map((e) => e.toJson()).toList(),
      };
}

class CheckGeofenceProximityRequest {
  final String geofenceId;
  final double latitude;
  final double longitude;

  const CheckGeofenceProximityRequest({
    required this.geofenceId,
    required this.latitude,
    required this.longitude,
  });

  Map<String, dynamic> toJson() => {
        'geofenceId': geofenceId,
        'latitude': latitude,
        'longitude': longitude,
      };
}

class CheckGeofenceProximityResponse {
  final String geofenceId;
  final String geofenceName;
  final double distanceMeters;
  final double radiusMeters;
  final bool isInside;

  const CheckGeofenceProximityResponse({
    required this.geofenceId,
    required this.geofenceName,
    required this.distanceMeters,
    required this.radiusMeters,
    required this.isInside,
  });

  factory CheckGeofenceProximityResponse.fromJson(Map<String, dynamic> json) {
    return CheckGeofenceProximityResponse(
      geofenceId: json['geofenceId'] as String,
      geofenceName: json['geofenceName'] as String,
      distanceMeters: (json['distanceMeters'] as num).toDouble(),
      radiusMeters: (json['radiusMeters'] as num).toDouble(),
      isInside: json['isInside'] as bool,
    );
  }

  Map<String, dynamic> toJson() => {
        'geofenceId': geofenceId,
        'geofenceName': geofenceName,
        'distanceMeters': distanceMeters,
        'radiusMeters': radiusMeters,
        'isInside': isInside,
      };
}
`;
fs.writeFileSync(path.resolve(modelDir, 'telemetry_models.dart'), telemetryModelsContent, 'utf-8');

// 11. Generate ApiClient
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
import 'model/task_models.dart';
import 'model/attendance_models.dart';
import 'model/telemetry_models.dart';

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

  // --- System ---

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
      final response = await dio.get<Map<String, dynamic>>('/version');
      return VersionResponse.fromJson(response.data!);
    } on DioException catch (e) {
      _handleDioException(e);
      rethrow;
    }
  }

  // --- Auth ---

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

  // --- Identity / Session ---

  Future<MeResponse> getMe() async {
    try {
      final response = await dio.get<Map<String, dynamic>>('/v1/me');
      return MeResponse.fromJson(response.data!);
    } on DioException catch (e) {
      _handleDioException(e);
      rethrow;
    }
  }

  // --- Workspaces ---

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

  // --- Devices ---

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

  // --- Tasks (Phase 02B) ---

  Future<TaskResponse> createTask({
    required String title,
    String? description,
    String priority = 'MEDIUM',
    String? dueAt,
    List<String>? assigneeIds,
    List<String>? checklist,
  }) async {
    try {
      final response = await dio.post<Map<String, dynamic>>(
        '/v1/tasks',
        data: {
          'title': title,
          if (description != null) 'description': description,
          'priority': priority,
          if (dueAt != null) 'dueAt': dueAt,
          if (assigneeIds != null) 'assigneeIds': assigneeIds,
          if (checklist != null) 'checklist': checklist,
        },
      );
      return TaskResponse.fromJson(response.data!);
    } on DioException catch (e) {
      _handleDioException(e);
      rethrow;
    }
  }

  Future<ListTasksResponse> listTasks({
    String? status,
    String? assigneeId,
    String? priority,
    String? overdue,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        if (status != null) 'status': status,
        if (assigneeId != null) 'assigneeId': assigneeId,
        if (priority != null) 'priority': priority,
        if (overdue != null) 'overdue': overdue,
      };
      final response = await dio.get<Map<String, dynamic>>(
        '/v1/tasks',
        queryParameters: queryParams,
      );
      return ListTasksResponse.fromJson(response.data!);
    } on DioException catch (e) {
      _handleDioException(e);
      rethrow;
    }
  }

  Future<TaskResponse> getTaskById(String taskId) async {
    try {
      final response = await dio.get<Map<String, dynamic>>('/v1/tasks/$taskId');
      return TaskResponse.fromJson(response.data!);
    } on DioException catch (e) {
      _handleDioException(e);
      rethrow;
    }
  }

  Future<TaskResponse> updateTask(
    String taskId, {
    String? title,
    String? description,
    String? priority,
    String? dueAt,
    List<String>? assigneeIds,
    required int version,
  }) async {
    try {
      final response = await dio.patch<Map<String, dynamic>>(
        '/v1/tasks/$taskId',
        data: {
          if (title != null) 'title': title,
          if (description != null) 'description': description,
          if (priority != null) 'priority': priority,
          if (dueAt != null) 'dueAt': dueAt,
          if (assigneeIds != null) 'assigneeIds': assigneeIds,
          'version': version,
        },
      );
      return TaskResponse.fromJson(response.data!);
    } on DioException catch (e) {
      _handleDioException(e);
      rethrow;
    }
  }

  Future<TaskResponse> transitionTask(
    String taskId, {
    required String status,
    required int version,
    String? comment,
  }) async {
    try {
      final response = await dio.post<Map<String, dynamic>>(
        '/v1/tasks/$taskId/transition',
        data: {
          'status': status,
          'version': version,
          if (comment != null) 'comment': comment,
        },
      );
      return TaskResponse.fromJson(response.data!);
    } on DioException catch (e) {
      _handleDioException(e);
      rethrow;
    }
  }

  Future<TaskChecklistItem> createChecklistItem(
    String taskId, {
    required String title,
    int? sortOrder,
  }) async {
    try {
      final response = await dio.post<Map<String, dynamic>>(
        '/v1/tasks/$taskId/checklist',
        data: {
          'title': title,
          if (sortOrder != null) 'sortOrder': sortOrder,
        },
      );
      return TaskChecklistItem.fromJson(response.data!);
    } on DioException catch (e) {
      _handleDioException(e);
      rethrow;
    }
  }

  Future<TaskChecklistItem> updateChecklistItem(
    String taskId,
    String itemId, {
    required bool isCompleted,
  }) async {
    try {
      final response = await dio.patch<Map<String, dynamic>>(
        '/v1/tasks/$taskId/checklist/$itemId',
        data: {
          'isCompleted': isCompleted,
        },
      );
      return TaskChecklistItem.fromJson(response.data!);
    } on DioException catch (e) {
      _handleDioException(e);
      rethrow;
    }
  }

  Future<TaskComment> createTaskComment(
    String taskId, {
    required String content,
  }) async {
    try {
      final response = await dio.post<Map<String, dynamic>>(
        '/v1/tasks/$taskId/comments',
        data: {
          'content': content,
        },
      );
      return TaskComment.fromJson(response.data!);
    } on DioException catch (e) {
      _handleDioException(e);
      rethrow;
    }
  }

  // --- Attendance (Phase 02B) ---

  Future<AttendanceSessionResponse> punchIn({
    required String idempotencyKey,
    String? shiftId,
    String? note,
  }) async {
    try {
      final response = await dio.post<Map<String, dynamic>>(
        '/v1/attendance/punch-in',
        data: {
          'idempotencyKey': idempotencyKey,
          if (shiftId != null) 'shiftId': shiftId,
          if (note != null) 'note': note,
        },
      );
      return AttendanceSessionResponse.fromJson(response.data!);
    } on DioException catch (e) {
      _handleDioException(e);
      rethrow;
    }
  }

  Future<AttendanceSessionResponse> punchOut({
    required String idempotencyKey,
    String? note,
  }) async {
    try {
      final response = await dio.post<Map<String, dynamic>>(
        '/v1/attendance/punch-out',
        data: {
          'idempotencyKey': idempotencyKey,
          if (note != null) 'note': note,
        },
      );
      return AttendanceSessionResponse.fromJson(response.data!);
    } on DioException catch (e) {
      _handleDioException(e);
      rethrow;
    }
  }

  Future<CurrentAttendanceResponse> getCurrentAttendance() async {
    try {
      final response = await dio.get<Map<String, dynamic>>('/v1/attendance/current');
      return CurrentAttendanceResponse.fromJson(response.data!);
    } on DioException catch (e) {
      _handleDioException(e);
      rethrow;
    }
  }

  Future<AttendanceHistoryResponse> getAttendanceHistory({
    String? limit,
    String? offset,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        if (limit != null) 'limit': limit,
        if (offset != null) 'offset': offset,
      };
      final response = await dio.get<Map<String, dynamic>>(
        '/v1/attendance/history',
        queryParameters: queryParams,
      );
      return AttendanceHistoryResponse.fromJson(response.data!);
    } on DioException catch (e) {
      _handleDioException(e);
      rethrow;
    }
  }

  Future<TeamAttendanceResponse> getTeamAttendance() async {
    try {
      final response = await dio.get<Map<String, dynamic>>('/v1/attendance/team');
      return TeamAttendanceResponse.fromJson(response.data!);
    } on DioException catch (e) {
      _handleDioException(e);
      rethrow;
    }
  }

  Future<AttendanceShift> createShift({
    required String name,
    required String startTime,
    required String endTime,
    String? timezone,
  }) async {
    try {
      final response = await dio.post<Map<String, dynamic>>(
        '/v1/attendance/shifts',
        data: {
          'name': name,
          'startTime': startTime,
          'endTime': endTime,
          if (timezone != null) 'timezone': timezone,
        },
      );
      return AttendanceShift.fromJson(response.data!);
    } on DioException catch (e) {
      _handleDioException(e);
      rethrow;
    }
  }

  Future<ListShiftsResponse> listShifts() async {
    try {
      final response = await dio.get<Map<String, dynamic>>('/v1/attendance/shifts');
      return ListShiftsResponse.fromJson(response.data!);
    } on DioException catch (e) {
      _handleDioException(e);
      rethrow;
    }
  }

  // --- Telemetry & Geofencing (Phase 02C) ---

  Future<LocationIngestResponse> ingestLocationBreadcrumbs(List<LocationPoint> locations) async {
    try {
      final response = await dio.post<Map<String, dynamic>>(
        '/v1/telemetry/locations',
        data: {
          'locations': locations.map((e) => e.toJson()).toList(),
        },
      );
      return LocationIngestResponse.fromJson(response.data!);
    } on DioException catch (e) {
      _handleDioException(e);
      rethrow;
    }
  }

  Future<ListLiveWorkersResponse> getLiveWorkerLocations() async {
    try {
      final response = await dio.get<Map<String, dynamic>>('/v1/telemetry/live');
      return ListLiveWorkersResponse.fromJson(response.data!);
    } on DioException catch (e) {
      _handleDioException(e);
      rethrow;
    }
  }

  Future<LocationHistoryResponse> getLocationHistory({
    required String userId,
    required String date,
  }) async {
    try {
      final response = await dio.get<Map<String, dynamic>>(
        '/v1/telemetry/history',
        queryParameters: {
          'userId': userId,
          'date': date,
        },
      );
      return LocationHistoryResponse.fromJson(response.data!);
    } on DioException catch (e) {
      _handleDioException(e);
      rethrow;
    }
  }

  Future<ListGeofencesResponse> listGeofences() async {
    try {
      final response = await dio.get<Map<String, dynamic>>('/v1/geofences');
      return ListGeofencesResponse.fromJson(response.data!);
    } on DioException catch (e) {
      _handleDioException(e);
      rethrow;
    }
  }

  Future<Geofence> createGeofence({
    required String name,
    required double latitude,
    required double longitude,
    double radiusMeters = 100.0,
    String geofenceType = 'OFFICE',
    String? description,
  }) async {
    try {
      final response = await dio.post<Map<String, dynamic>>(
        '/v1/geofences',
        data: {
          'name': name,
          'latitude': latitude,
          'longitude': longitude,
          'radiusMeters': radiusMeters,
          'geofenceType': geofenceType,
          if (description != null) 'description': description,
        },
      );
      return Geofence.fromJson(response.data!);
    } on DioException catch (e) {
      _handleDioException(e);
      rethrow;
    }
  }

  Future<CheckGeofenceProximityResponse> checkGeofenceProximity({
    required String geofenceId,
    required double latitude,
    required double longitude,
  }) async {
    try {
      final response = await dio.post<Map<String, dynamic>>(
        '/v1/geofences/check-proximity',
        data: {
          'geofenceId': geofenceId,
          'latitude': latitude,
          'longitude': longitude,
        },
      );
      return CheckGeofenceProximityResponse.fromJson(response.data!);
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

// 12. Generate Root Library Export
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
export 'src/model/task_models.dart';
export 'src/model/attendance_models.dart';
export 'src/model/telemetry_models.dart';
`;
fs.writeFileSync(path.resolve(libDir, 'oprino_api.dart'), oprinoApiContent, 'utf-8');

console.log(`✓ Generated Dart API client from OpenAPI ${spec.openapi} into generated/dart-api`);


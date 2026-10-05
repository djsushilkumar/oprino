// GENERATED CODE - DO NOT MODIFY BY HAND
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

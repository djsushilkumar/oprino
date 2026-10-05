// GENERATED CODE - DO NOT MODIFY BY HAND
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

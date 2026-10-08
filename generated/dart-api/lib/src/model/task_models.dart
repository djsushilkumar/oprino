// GENERATED CODE - DO NOT MODIFY BY HAND
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
  final String? customerId;
  final String? customerName;
  final String? siteId;
  final String? siteName;
  final bool requiresSignature;
  final bool requiresPhotoProof;
  final String? verifiedBy;
  final String? verifierName;
  final DateTime? verifiedAt;
  final String? verificationNotes;
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
    this.customerId,
    this.customerName,
    this.siteId,
    this.siteName,
    this.requiresSignature = false,
    this.requiresPhotoProof = false,
    this.verifiedBy,
    this.verifierName,
    this.verifiedAt,
    this.verificationNotes,
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
      customerId: json['customerId'] as String?,
      customerName: json['customerName'] as String?,
      siteId: json['siteId'] as String?,
      siteName: json['siteName'] as String?,
      requiresSignature: json['requiresSignature'] as bool? ?? false,
      requiresPhotoProof: json['requiresPhotoProof'] as bool? ?? false,
      verifiedBy: json['verifiedBy'] as String?,
      verifierName: json['verifierName'] as String?,
      verifiedAt: json['verifiedAt'] != null ? DateTime.parse(json['verifiedAt'] as String) : null,
      verificationNotes: json['verificationNotes'] as String?,
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
        if (customerId != null) 'customerId': customerId,
        if (customerName != null) 'customerName': customerName,
        if (siteId != null) 'siteId': siteId,
        if (siteName != null) 'siteName': siteName,
        'requiresSignature': requiresSignature,
        'requiresPhotoProof': requiresPhotoProof,
        if (verifiedBy != null) 'verifiedBy': verifiedBy,
        if (verifierName != null) 'verifierName': verifierName,
        if (verifiedAt != null) 'verifiedAt': verifiedAt!.toIso8601String(),
        if (verificationNotes != null) 'verificationNotes': verificationNotes,
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

class VerifyTaskRequest {
  final String action;
  final String? notes;

  const VerifyTaskRequest({required this.action, this.notes});

  factory VerifyTaskRequest.fromJson(Map<String, dynamic> json) {
    return VerifyTaskRequest(
      action: json['action'] as String,
      notes: json['notes'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'action': action,
        if (notes != null) 'notes': notes,
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

// GENERATED CODE - DO NOT MODIFY BY HAND
// Generated from OpenAPI 3.1 specification by @oprino/contracts

class Visit {
  final String id;
  final String workspaceId;
  final String customerId;
  final String? customerName;
  final String? siteId;
  final String? siteName;
  final String? taskId;
  final String? taskTitle;
  final String userId;
  final String? userName;
  final String status;
  final DateTime? plannedAt;
  final DateTime? checkInTime;
  final DateTime? checkOutTime;
  final double? checkInLatitude;
  final double? checkInLongitude;
  final double? checkOutLatitude;
  final double? checkOutLongitude;
  final int durationMinutes;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Visit({
    required this.id,
    required this.workspaceId,
    required this.customerId,
    this.customerName,
    this.siteId,
    this.siteName,
    this.taskId,
    this.taskTitle,
    required this.userId,
    this.userName,
    required this.status,
    this.plannedAt,
    this.checkInTime,
    this.checkOutTime,
    this.checkInLatitude,
    this.checkInLongitude,
    this.checkOutLatitude,
    this.checkOutLongitude,
    this.durationMinutes = 0,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Visit.fromJson(Map<String, dynamic> json) {
    return Visit(
      id: json['id'] as String,
      workspaceId: json['workspaceId'] as String,
      customerId: json['customerId'] as String,
      customerName: json['customerName'] as String?,
      siteId: json['siteId'] as String?,
      siteName: json['siteName'] as String?,
      taskId: json['taskId'] as String?,
      taskTitle: json['taskTitle'] as String?,
      userId: json['userId'] as String,
      userName: json['userName'] as String?,
      status: json['status'] as String,
      plannedAt: json['plannedAt'] != null ? DateTime.parse(json['plannedAt'] as String) : null,
      checkInTime: json['checkInTime'] != null ? DateTime.parse(json['checkInTime'] as String) : null,
      checkOutTime: json['checkOutTime'] != null ? DateTime.parse(json['checkOutTime'] as String) : null,
      checkInLatitude: (json['checkInLatitude'] as num?)?.toDouble(),
      checkInLongitude: (json['checkInLongitude'] as num?)?.toDouble(),
      checkOutLatitude: (json['checkOutLatitude'] as num?)?.toDouble(),
      checkOutLongitude: (json['checkOutLongitude'] as num?)?.toDouble(),
      durationMinutes: json['durationMinutes'] as int? ?? 0,
      notes: json['notes'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'workspaceId': workspaceId,
        'customerId': customerId,
        if (customerName != null) 'customerName': customerName,
        if (siteId != null) 'siteId': siteId,
        if (siteName != null) 'siteName': siteName,
        if (taskId != null) 'taskId': taskId,
        if (taskTitle != null) 'taskTitle': taskTitle,
        'userId': userId,
        if (userName != null) 'userName': userName,
        'status': status,
        if (plannedAt != null) 'plannedAt': plannedAt!.toIso8601String(),
        if (checkInTime != null) 'checkInTime': checkInTime!.toIso8601String(),
        if (checkOutTime != null) 'checkOutTime': checkOutTime!.toIso8601String(),
        if (checkInLatitude != null) 'checkInLatitude': checkInLatitude,
        if (checkInLongitude != null) 'checkInLongitude': checkInLongitude,
        if (checkOutLatitude != null) 'checkOutLatitude': checkOutLatitude,
        if (checkOutLongitude != null) 'checkOutLongitude': checkOutLongitude,
        'durationMinutes': durationMinutes,
        if (notes != null) 'notes': notes,
        'createdAt': createdAt.toIso8601String(),
        'updatedAt': updatedAt.toIso8601String(),
      };
}

class ListVisitsResponse {
  final List<Visit> visits;
  final int total;

  const ListVisitsResponse({required this.visits, required this.total});

  factory ListVisitsResponse.fromJson(Map<String, dynamic> json) {
    return ListVisitsResponse(
      visits: (json['visits'] as List<dynamic>)
          .map((e) => Visit.fromJson(e as Map<String, dynamic>))
          .toList(),
      total: json['total'] as int? ?? (json['visits'] as List<dynamic>).length,
    );
  }

  Map<String, dynamic> toJson() => {
        'visits': visits.map((v) => v.toJson()).toList(),
        'total': total,
      };
}

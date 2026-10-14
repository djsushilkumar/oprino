// GENERATED CODE - DO NOT MODIFY BY HAND
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
  final String? selfieMediaKey;
  final double? punchInLatitude;
  final double? punchInLongitude;
  final double? punchInAccuracy;
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
    this.selfieMediaKey,
    this.punchInLatitude,
    this.punchInLongitude,
    this.punchInAccuracy,
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
      selfieMediaKey: json['selfieMediaKey'] as String?,
      punchInLatitude: (json['punchInLatitude'] as num?)?.toDouble(),
      punchInLongitude: (json['punchInLongitude'] as num?)?.toDouble(),
      punchInAccuracy: (json['punchInAccuracy'] as num?)?.toDouble(),
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
        if (selfieMediaKey != null) 'selfieMediaKey': selfieMediaKey,
        if (punchInLatitude != null) 'punchInLatitude': punchInLatitude,
        if (punchInLongitude != null) 'punchInLongitude': punchInLongitude,
        if (punchInAccuracy != null) 'punchInAccuracy': punchInAccuracy,
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

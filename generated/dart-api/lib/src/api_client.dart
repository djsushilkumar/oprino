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
import 'model/task_models.dart';
import 'model/attendance_models.dart';

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

  void _handleDioException(DioException e) {
    if (e.response?.data is Map<String, dynamic>) {
      throw ApiError.fromJson(e.response!.data as Map<String, dynamic>);
    }
  }
}

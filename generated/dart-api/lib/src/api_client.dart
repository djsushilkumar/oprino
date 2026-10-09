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
import 'model/telemetry_models.dart';
import 'model/customer_models.dart';
import 'model/visit_models.dart';
import 'model/proof_models.dart';
import 'model/sync_models.dart';

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

  // --- Customers & Customer Sites (Phase 03) ---

  Future<Customer> createCustomer({
    required String name,
    String? companyName,
    String? email,
    String? phone,
    String? notes,
  }) async {
    try {
      final response = await dio.post<Map<String, dynamic>>(
        '/v1/customers',
        data: {
          'name': name,
          if (companyName != null) 'companyName': companyName,
          if (email != null) 'email': email,
          if (phone != null) 'phone': phone,
          if (notes != null) 'notes': notes,
        },
      );
      return Customer.fromJson(response.data!);
    } on DioException catch (e) {
      _handleDioException(e);
      rethrow;
    }
  }

  Future<ListCustomersResponse> listCustomers({int page = 1, int limit = 50}) async {
    try {
      final response = await dio.get<Map<String, dynamic>>(
        '/v1/customers',
        queryParameters: {
          'page': page,
          'limit': limit,
        },
      );
      return ListCustomersResponse.fromJson(response.data!);
    } on DioException catch (e) {
      _handleDioException(e);
      rethrow;
    }
  }

  Future<CustomerSite> createCustomerSite({
    required String customerId,
    required String name,
    required String address,
    double? latitude,
    double? longitude,
    double geofenceRadiusMeters = 100.0,
    String? contactName,
    String? contactPhone,
    String? notes,
  }) async {
    try {
      final response = await dio.post<Map<String, dynamic>>(
        '/v1/customers/$customerId/sites',
        data: {
          'name': name,
          'address': address,
          if (latitude != null) 'latitude': latitude,
          if (longitude != null) 'longitude': longitude,
          'geofenceRadiusMeters': geofenceRadiusMeters,
          if (contactName != null) 'contactName': contactName,
          if (contactPhone != null) 'contactPhone': contactPhone,
          if (notes != null) 'notes': notes,
        },
      );
      return CustomerSite.fromJson(response.data!);
    } on DioException catch (e) {
      _handleDioException(e);
      rethrow;
    }
  }

  Future<ListCustomerSitesResponse> listCustomerSites({required String customerId}) async {
    try {
      final response = await dio.get<Map<String, dynamic>>(
        '/v1/customers/$customerId/sites',
      );
      return ListCustomerSitesResponse.fromJson(response.data!);
    } on DioException catch (e) {
      _handleDioException(e);
      rethrow;
    }
  }

  // --- Visits (Phase 03) ---

  Future<Visit> createVisit({
    required String customerId,
    String? siteId,
    String? taskId,
    String? userId,
    String? plannedAt,
    String? notes,
  }) async {
    try {
      final response = await dio.post<Map<String, dynamic>>(
        '/v1/visits',
        data: {
          'customerId': customerId,
          if (siteId != null) 'siteId': siteId,
          if (taskId != null) 'taskId': taskId,
          if (userId != null) 'userId': userId,
          if (plannedAt != null) 'plannedAt': plannedAt,
          if (notes != null) 'notes': notes,
        },
      );
      return Visit.fromJson(response.data!);
    } on DioException catch (e) {
      _handleDioException(e);
      rethrow;
    }
  }

  Future<ListVisitsResponse> listVisits({
    String? status,
    String? userId,
    String? customerId,
  }) async {
    try {
      final response = await dio.get<Map<String, dynamic>>(
        '/v1/visits',
        queryParameters: {
          if (status != null) 'status': status,
          if (userId != null) 'userId': userId,
          if (customerId != null) 'customerId': customerId,
        },
      );
      return ListVisitsResponse.fromJson(response.data!);
    } on DioException catch (e) {
      _handleDioException(e);
      rethrow;
    }
  }

  Future<Visit> checkInVisit({
    required String visitId,
    required double latitude,
    required double longitude,
    double? accuracy,
    String? notes,
  }) async {
    try {
      final response = await dio.post<Map<String, dynamic>>(
        '/v1/visits/$visitId/check-in',
        data: {
          'latitude': latitude,
          'longitude': longitude,
          if (accuracy != null) 'accuracy': accuracy,
          if (notes != null) 'notes': notes,
        },
      );
      return Visit.fromJson(response.data!);
    } on DioException catch (e) {
      _handleDioException(e);
      rethrow;
    }
  }

  Future<Visit> checkOutVisit({
    required String visitId,
    required double latitude,
    required double longitude,
    double? accuracy,
    String? notes,
  }) async {
    try {
      final response = await dio.post<Map<String, dynamic>>(
        '/v1/visits/$visitId/check-out',
        data: {
          'latitude': latitude,
          'longitude': longitude,
          if (accuracy != null) 'accuracy': accuracy,
          if (notes != null) 'notes': notes,
        },
      );
      return Visit.fromJson(response.data!);
    } on DioException catch (e) {
      _handleDioException(e);
      rethrow;
    }
  }

  // --- Proof of Work & Media (Phase 03) ---

  Future<MediaUploadUrlResponse> requestMediaUploadUrl({
    required String taskId,
    String? visitId,
    required String proofType,
    required String fileName,
    required String mimeType,
    int? fileSizeBytes,
  }) async {
    try {
      final response = await dio.post<Map<String, dynamic>>(
        '/v1/media/upload-url',
        data: {
          'taskId': taskId,
          if (visitId != null) 'visitId': visitId,
          'proofType': proofType,
          'fileName': fileName,
          'mimeType': mimeType,
          if (fileSizeBytes != null) 'fileSizeBytes': fileSizeBytes,
        },
      );
      return MediaUploadUrlResponse.fromJson(response.data!);
    } on DioException catch (e) {
      _handleDioException(e);
      rethrow;
    }
  }

  Future<TaskProof> confirmMediaUpload({
    required String taskId,
    String? visitId,
    required String proofType,
    required String fileKey,
    int? fileSizeBytes,
    String? mimeType,
    String? signerName,
    String? signerPhone,
    Map<String, dynamic>? watermarkMetadata,
    String? notes,
  }) async {
    try {
      final response = await dio.post<Map<String, dynamic>>(
        '/v1/media/confirm',
        data: {
          'taskId': taskId,
          if (visitId != null) 'visitId': visitId,
          'proofType': proofType,
          'fileKey': fileKey,
          if (fileSizeBytes != null) 'fileSizeBytes': fileSizeBytes,
          if (mimeType != null) 'mimeType': mimeType,
          if (signerName != null) 'signerName': signerName,
          if (signerPhone != null) 'signerPhone': signerPhone,
          if (watermarkMetadata != null) 'watermarkMetadata': watermarkMetadata,
          if (notes != null) 'notes': notes,
        },
      );
      return TaskProof.fromJson(response.data!);
    } on DioException catch (e) {
      _handleDioException(e);
      rethrow;
    }
  }

  Future<ListTaskProofsResponse> listTaskProofs({required String taskId}) async {
    try {
      final response = await dio.get<Map<String, dynamic>>(
        '/v1/tasks/$taskId/proofs',
      );
      return ListTaskProofsResponse.fromJson(response.data!);
    } on DioException catch (e) {
      _handleDioException(e);
      rethrow;
    }
  }

  Future<TaskResponse> verifyTask({
    required String taskId,
    required String action,
    String? notes,
  }) async {
    try {
      final response = await dio.post<Map<String, dynamic>>(
        '/v1/tasks/$taskId/verify',
        data: {
          'action': action,
          if (notes != null) 'notes': notes,
        },
      );
      return TaskResponse.fromJson(response.data!);
    } on DioException catch (e) {
      _handleDioException(e);
      rethrow;
    }
  }

  // --- Phase 04: Advanced Scheduling & Sync ---

  Future<SyncBatchResponse> syncMutationsBatch({
    required List<SyncMutationEnvelope> mutations,
  }) async {
    try {
      final response = await dio.post<Map<String, dynamic>>(
        '/v1/sync/mutations',
        data: {
          'mutations': mutations.map((m) => m.toJson()).toList(),
        },
      );
      return SyncBatchResponse.fromJson(response.data!);
    } on DioException catch (e) {
      _handleDioException(e);
      rethrow;
    }
  }

  Future<ListVisitsResponse> reorderVisits({
    required String userId,
    required String routeDate,
    required List<String> orderedVisitIds,
  }) async {
    try {
      final response = await dio.put<Map<String, dynamic>>(
        '/v1/visits/sequence',
        data: {
          'userId': userId,
          'routeDate': routeDate,
          'orderedVisitIds': orderedVisitIds,
        },
      );
      return ListVisitsResponse.fromJson(response.data!);
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

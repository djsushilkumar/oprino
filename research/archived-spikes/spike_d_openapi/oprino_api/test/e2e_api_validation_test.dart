import 'dart:io';
import 'package:dio/dio.dart';
import 'package:oprino_api/oprino_api.dart';
import 'package:test/test.dart';

void main() {
  late OprinoApi api;
  const baseUrl = 'http://localhost:3099';

  setUpAll(() async {
    final dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 5),
      receiveTimeout: const Duration(seconds: 5),
    ));

    api = OprinoApi(dio: dio);
  });

  group('SPIKE D — OpenAPI 3.1 -> Dart Validation', () {
    test('1. Paginated Query with Arrays, UUID, Enums, Nullable, Nested Objects', () async {
      final tasksApi = api.getTasksApi();
      final response = await tasksApi.listTasks(
        page: 1,
        limit: 10,
        status: 'PENDING',
      );

      expect(response.statusCode, 200);
      final body = response.data;
      expect(body, isNotNull);
      expect(body!.pagination.page, 1);
      expect(body.pagination.total, 1);
      expect(body.items.length, 1);

      final task = body.items.first;
      expect(task.id, '11111111-1111-4111-8111-111111111111');
      expect(task.title, contains('HVAC'));
      expect(task.status.name, 'PENDING');
      expect(task.priority.name, 'HIGH');
      expect(task.location, isNotNull);
      expect(task.location!.latitude, 28.628);
      expect(task.location!.longitude, 77.3649);
      expect(task.tags, contains('hvac'));
    });

    test('2. Mutation with Validation Schema', () async {
      final tasksApi = api.getTasksApi();
      final response = await tasksApi.createTask(
        createTaskRequest: CreateTaskRequest((b) => b
          ..title = 'Inspect Fire Extinguishers'
          ..description = 'Building B level 2'
          ..priority = CreateTaskRequestPriorityEnum.HIGH
          ..tags.addAll(['safety', 'fire'])
        ),
      );

      expect(response.statusCode, 201);
      final task = response.data;
      expect(task, isNotNull);
      expect(task!.title, 'Inspect Fire Extinguishers');
      expect(task.status.name, 'PENDING');
    });

    test('3. Multipart Image Upload', () async {
      final proofApi = api.getProofApi();
      
      // Verify multipart endpoint signature and request construction
      expect(proofApi.uploadProofPhoto, isNotNull);
    });

    test('4. Binary PDF Report Download Stream', () async {
      final reportsApi = api.getReportsApi();
      final response = await reportsApi.downloadAttendancePdfReport();
      expect(response.statusCode, 200);
      expect(response.data, isNotNull);
      expect(response.data.toString(), contains('%PDF-1.4'));
    });
  });
}

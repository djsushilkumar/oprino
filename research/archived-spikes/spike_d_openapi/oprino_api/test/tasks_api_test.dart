import 'package:test/test.dart';
import 'package:oprino_api/oprino_api.dart';


/// tests for TasksApi
void main() {
  final instance = OprinoApi().getTasksApi();

  group(TasksApi, () {
    // Create a new operational task
    //
    //Future<ListTasks200ResponseItemsInner> createTask(CreateTaskRequest createTaskRequest) async
    test('test createTask', () async {
      // TODO
    });

    // List tasks with pagination and status filter
    //
    //Future<ListTasks200Response> listTasks({ int page, int limit, String status, String search }) async
    test('test listTasks', () async {
      // TODO
    });

  });
}

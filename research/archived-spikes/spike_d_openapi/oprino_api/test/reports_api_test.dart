import 'package:test/test.dart';
import 'package:oprino_api/oprino_api.dart';


/// tests for ReportsApi
void main() {
  final instance = OprinoApi().getReportsApi();

  group(ReportsApi, () {
    // Generate and download attendance PDF summary
    //
    //Future<String> downloadAttendancePdfReport() async
    test('test downloadAttendancePdfReport', () async {
      // TODO
    });

  });
}

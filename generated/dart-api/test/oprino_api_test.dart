import 'package:test/test.dart';
import 'package:oprino_api/oprino_api.dart';

void main() {
  group('Oprino API Dart Client Models', () {
    test('HealthResponse deserializes properly', () {
      final json = {
        'status': 'ok',
        'timestamp': '2026-10-05T12:00:00.000Z',
        'services': {
          'database': 'connected',
          'redis': 'connected',
        },
      };

      final health = HealthResponse.fromJson(json);
      expect(health.status, equals('ok'));
      expect(health.services['database'], equals('connected'));
      expect(health.services['redis'], equals('connected'));
    });

    test('VersionResponse deserializes properly', () {
      final json = {
        'name': 'oprino-api',
        'version': '0.1.0',
        'environment': 'development',
        'gitCommit': '5fc3468',
        'architecture': {
          'framework': 'Fastify + TypeScript',
          'database': 'PostgreSQL 18 + PostGIS 3.6',
          'mobile': 'Flutter 3.47 Stable',
        },
      };

      final version = VersionResponse.fromJson(json);
      expect(version.name, equals('oprino-api'));
      expect(version.version, equals('0.1.0'));
      expect(version.architecture['database'], equals('PostgreSQL 18 + PostGIS 3.6'));
    });
  });
}

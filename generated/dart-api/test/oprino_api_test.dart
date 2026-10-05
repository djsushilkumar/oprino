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

    test('AuthResponse deserializes properly', () {
      final json = {
        'token': 'oprino_tok_12345',
        'user': {
          'id': 'u1-uuid',
          'email': 'user@oprino.com',
          'name': 'Field Technician',
          'emailVerified': true,
        },
        'activeWorkspaceId': 'w1-uuid',
      };

      final auth = AuthResponse.fromJson(json);
      expect(auth.token, equals('oprino_tok_12345'));
      expect(auth.user.email, equals('user@oprino.com'));
      expect(auth.activeWorkspaceId, equals('w1-uuid'));
    });

    test('WorkspaceResponse deserializes properly', () {
      final json = {
        'id': 'w1-uuid',
        'name': 'Acme Services',
        'slug': 'acme-services',
        'status': 'ACTIVE',
        'role': 'Owner/Admin',
        'permissions': ['workspace.read', 'workspace.manage'],
        'createdAt': '2026-10-05T12:00:00.000Z',
      };

      final ws = WorkspaceResponse.fromJson(json);
      expect(ws.name, equals('Acme Services'));
      expect(ws.permissions, contains('workspace.read'));
    });

    test('MeResponse deserializes properly', () {
      final json = {
        'user': {
          'id': 'u1-uuid',
          'email': 'user@oprino.com',
          'name': 'Field Technician',
          'emailVerified': true,
        },
        'activeWorkspace': {
          'id': 'w1-uuid',
          'name': 'Acme Services',
          'slug': 'acme-services',
          'status': 'ACTIVE',
        },
        'role': {
          'id': 'r1-uuid',
          'name': 'Employee',
        },
        'permissions': ['workspace.read'],
      };

      final me = MeResponse.fromJson(json);
      expect(me.user.name, equals('Field Technician'));
      expect(me.activeWorkspace?.name, equals('Acme Services'));
      expect(me.role?.name, equals('Employee'));
      expect(me.permissions, equals(['workspace.read']));
    });

    test('DeviceResponse deserializes properly', () {
      final json = {
        'id': 'd1-uuid',
        'installationId': 'inst-12345',
        'platform': 'android',
        'deviceModel': 'Pixel 8',
        'status': 'active',
        'isTrusted': true,
        'lastActiveAt': '2026-10-05T12:00:00.000Z',
      };

      final dev = DeviceResponse.fromJson(json);
      expect(dev.installationId, equals('inst-12345'));
      expect(dev.isTrusted, isTrue);
    });
  });
}

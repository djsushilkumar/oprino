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

    test('TaskResponse deserializes properly with assignees and checklist', () {
      final json = {
        'id': 't1-uuid',
        'workspaceId': 'w1-uuid',
        'title': 'HVAC Filter Replacement',
        'description': 'Replace intake filters',
        'status': 'ASSIGNED',
        'simplifiedStatus': 'TO_DO',
        'priority': 'HIGH',
        'dueAt': '2026-10-06T18:00:00.000Z',
        'createdBy': 'u1-uuid',
        'creatorName': 'Manager Bob',
        'version': 1,
        'assignees': [
          {
            'id': 'a1-uuid',
            'taskId': 't1-uuid',
            'userId': 'u2-uuid',
            'name': 'Jane Tech',
            'email': 'jane@example.com',
            'assignedAt': '2026-10-05T12:00:00.000Z',
          }
        ],
        'checklist': [
          {
            'id': 'c1-uuid',
            'taskId': 't1-uuid',
            'title': 'Turn off power',
            'isCompleted': false,
            'sortOrder': 0,
            'createdAt': '2026-10-05T12:00:00.000Z',
          }
        ],
        'comments': [],
        'activities': [],
        'createdAt': '2026-10-05T12:00:00.000Z',
        'updatedAt': '2026-10-05T12:00:00.000Z',
      };

      final task = TaskResponse.fromJson(json);
      expect(task.title, equals('HVAC Filter Replacement'));
      expect(task.status, equals('ASSIGNED'));
      expect(task.simplifiedStatus, equals('TO_DO'));
      expect(task.assignees.length, equals(1));
      expect(task.assignees.first.name, equals('Jane Tech'));
      expect(task.checklist.length, equals(1));
      expect(task.checklist.first.title, equals('Turn off power'));
    });

    test('CurrentAttendanceResponse deserializes properly', () {
      final json = {
        'dutyState': 'ON_DUTY',
        'activeSession': {
          'id': 's1-uuid',
          'workspaceId': 'w1-uuid',
          'userId': 'u1-uuid',
          'userName': 'Jane Tech',
          'status': 'ON_DUTY',
          'punchInTime': '2026-10-05T09:00:00.000Z',
          'durationMinutes': 120,
          'isLate': false,
          'lateMinutes': 0,
          'isManualAdjustment': false,
          'createdAt': '2026-10-05T09:00:00.000Z',
          'updatedAt': '2026-10-05T09:00:00.000Z',
        },
        'serverTime': '2026-10-05T11:00:00.000Z',
      };

      final current = CurrentAttendanceResponse.fromJson(json);
      expect(current.dutyState, equals('ON_DUTY'));
      expect(current.activeSession?.userName, equals('Jane Tech'));
      expect(current.activeSession?.durationMinutes, equals(120));
    });
  });
}

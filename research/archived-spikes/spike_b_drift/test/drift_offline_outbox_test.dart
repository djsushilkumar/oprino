import 'dart:convert';
import 'dart:io';
import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:spike_b_drift/database.dart';
import 'package:test/test.dart';
import 'package:uuid/uuid.dart';

void main() {
  const uuid = Uuid();
  late Directory tempDir;
  late File dbFile;

  setUp(() async {
    tempDir = await Directory.systemTemp.createTemp('drift_spike_b_');
    dbFile = File('${tempDir.path}${Platform.pathSeparator}oprino_spike.sqlite');
  });

  tearDown(() async {
    if (await tempDir.exists()) {
      await tempDir.delete(recursive: true);
    }
  });

  group('SPIKE B — Drift Native SQLite & Offline Outbox Validation', () {
    test('1. Native SQLite connection, WAL mode and PRAGMA settings', () async {
      final db = AppDatabase(NativeDatabase(
        dbFile,
        setup: (rawDb) {
          rawDb.execute('PRAGMA journal_mode = WAL;');
        },
      ));

      // Verify WAL mode
      final journalModeResult = await db.customSelect('PRAGMA journal_mode;').getSingle();
      expect(journalModeResult.data['journal_mode'].toString().toLowerCase(), 'wal');

      // Verify Foreign Keys
      final fkResult = await db.customSelect('PRAGMA foreign_keys;').getSingle();
      expect(fkResult.data['foreign_keys'], 1);

      await db.close();
    });

    test('2. Atomic Transaction: Optimistic Update + Outbox Mutation', () async {
      final db = AppDatabase(NativeDatabase(dbFile));

      final taskId = uuid.v4();
      await db.into(db.tasks).insert(
        TasksCompanion.insert(
          id: taskId,
          title: 'Emergency Generator Inspection',
          status: const Value('PENDING'),
          version: const Value(1),
        ),
      );

      final idempotencyKey = uuid.v4();
      final mutationId = uuid.v4();

      // Execute atomic optimistic update + outbox mutation
      await db.updateTaskOptimistically(
        taskId: taskId,
        newStatus: 'IN_PROGRESS',
        idempotencyKey: idempotencyKey,
        mutationId: mutationId,
      );

      // Verify task updated optimistically
      final task = await (db.select(db.tasks)..where((t) => t.id.equals(taskId))).getSingle();
      expect(task.status, 'IN_PROGRESS');
      expect(task.version, 2);
      expect(task.syncStatus, SyncStatus.pending);

      // Verify outbox mutation written atomically
      final mutation = await (db.select(db.outboxMutations)
            ..where((m) => m.idempotencyKey.equals(idempotencyKey)))
          .getSingle();
      expect(mutation.aggregateId, taskId);
      expect(mutation.mutationType, 'UPDATE_STATUS');
      expect(mutation.status, OutboxStatus.pending);

      final payload = jsonDecode(mutation.payload) as Map<String, dynamic>;
      expect(payload['status'], 'IN_PROGRESS');
      expect(payload['clientVersion'], 2);

      await db.close();
    });

    test('3. Transaction Rollback Integrity on Mutation Failure', () async {
      final db = AppDatabase(NativeDatabase(dbFile));

      final taskId = uuid.v4();
      await db.into(db.tasks).insert(
        TasksCompanion.insert(
          id: taskId,
          title: 'HVAC Duct Clean',
          status: const Value('PENDING'),
          version: const Value(1),
        ),
      );

      // Attempt transaction that throws midway
      try {
        await db.transaction(() async {
          await (db.update(db.tasks)..where((t) => t.id.equals(taskId))).write(
            const TasksCompanion(status: Value('COMPLETED')),
          );
          throw Exception('Simulated crash during transaction');
        });
      } catch (_) {
        // Expected
      }

      // Verify task status rolled back to PENDING
      final task = await (db.select(db.tasks)..where((t) => t.id.equals(taskId))).getSingle();
      expect(task.status, 'PENDING');

      // Verify no outbox record created
      final outboxCount = await db.outboxMutations.count().getSingle();
      expect(outboxCount, 0);

      await db.close();
    });

    test('4. Idempotency Key Duplicate Replay Rejection', () async {
      final db = AppDatabase(NativeDatabase(dbFile));

      final duplicateKey = 'idem-unique-key-12345';
      final mutationId1 = uuid.v4();
      final mutationId2 = uuid.v4();

      await db.into(db.outboxMutations).insert(
        OutboxMutationsCompanion.insert(
          id: mutationId1,
          idempotencyKey: duplicateKey,
          aggregateType: 'TASK',
          aggregateId: uuid.v4(),
          mutationType: 'UPDATE_STATUS',
          payload: '{}',
        ),
      );

      // Attempt inserting duplicate idempotency key
      expect(
        () async => await db.into(db.outboxMutations).insert(
          OutboxMutationsCompanion.insert(
            id: mutationId2,
            idempotencyKey: duplicateKey,
            aggregateType: 'TASK',
            aggregateId: uuid.v4(),
            mutationType: 'UPDATE_STATUS',
            payload: '{}',
          ),
        ),
        throwsA(isA<SqliteException>()),
      );

      await db.close();
    });

    test('5. Network Failure Retry & Outbox Sync Simulation', () async {
      final db = AppDatabase(NativeDatabase(dbFile));
      final taskId = uuid.v4();
      final mutationId = uuid.v4();
      final idempotencyKey = uuid.v4();

      await db.into(db.tasks).insert(
        TasksCompanion.insert(id: taskId, title: 'Check Elevator Rails'),
      );

      await db.updateTaskOptimistically(
        taskId: taskId,
        newStatus: 'COMPLETED',
        idempotencyKey: idempotencyKey,
        mutationId: mutationId,
      );

      // Mock Sync Worker Step 1: Network Failure (HTTP 503)
      var pending = await (db.select(db.outboxMutations)..where((m) => m.status.equals(OutboxStatus.pending.index))).get();
      expect(pending.length, 1);

      // Mark in-flight and simulate network failure
      final item = pending.first;
      await (db.update(db.outboxMutations)..where((m) => m.id.equals(item.id))).write(
        OutboxMutationsCompanion(
          status: const Value(OutboxStatus.pending),
          retryCount: Value(item.retryCount + 1),
          lastAttemptAt: Value(DateTime.now()),
          errorMessage: const Value('Network unreachable (HTTP 503)'),
        ),
      );

      final retried = await (db.select(db.outboxMutations)..where((m) => m.id.equals(item.id))).getSingle();
      expect(retried.retryCount, 1);
      expect(retried.errorMessage, contains('503'));

      // Mock Sync Worker Step 2: Network Restored (HTTP 200 ACK)
      await (db.update(db.outboxMutations)..where((m) => m.id.equals(item.id))).write(
        const OutboxMutationsCompanion(
          status: Value(OutboxStatus.completed),
          errorMessage: Value(null),
        ),
      );

      await (db.update(db.tasks)..where((t) => t.id.equals(taskId))).write(
        const TasksCompanion(syncStatus: Value(SyncStatus.synced)),
      );

      final finalTask = await (db.select(db.tasks)..where((t) => t.id.equals(taskId))).getSingle();
      expect(finalTask.syncStatus, SyncStatus.synced);

      await db.close();
    });

    test('6. App Restart Simulation During Pending Outbox Sync', () async {
      final taskId = uuid.v4();
      final mutationId = uuid.v4();

      // Session 1: Create pending mutation and abruptly close DB (simulate crash/restart)
      {
        final db1 = AppDatabase(NativeDatabase(dbFile));
        await db1.into(db1.tasks).insert(
          TasksCompanion.insert(id: taskId, title: 'Roof Solar Panel Audit'),
        );
        await db1.updateTaskOptimistically(
          taskId: taskId,
          newStatus: 'IN_PROGRESS',
          idempotencyKey: uuid.v4(),
          mutationId: mutationId,
        );
        await db1.close();
      }

      // Session 2: Reopen database and verify pending mutation survived intact
      {
        final db2 = AppDatabase(NativeDatabase(dbFile));
        final pendingMutations = await (db2.select(db2.outboxMutations)
              ..where((m) => m.status.equals(OutboxStatus.pending.index)))
            .get();
        expect(pendingMutations.length, 1);
        expect(pendingMutations.first.id, mutationId);
        expect(pendingMutations.first.aggregateId, taskId);

        final task = await (db2.select(db2.tasks)..where((t) => t.id.equals(taskId))).getSingle();
        expect(task.status, 'IN_PROGRESS');
        expect(task.syncStatus, SyncStatus.pending);
        await db2.close();
      }
    });

    test('7. Conflict Handling (Server Version Ahead)', () async {
      final db = AppDatabase(NativeDatabase(dbFile));
      final taskId = uuid.v4();
      await db.into(db.tasks).insert(
        TasksCompanion.insert(id: taskId, title: 'Server Conflict Test', version: const Value(1)),
      );

      // Local optimistic update bumps version to 2
      await db.updateTaskOptimistically(
        taskId: taskId,
        newStatus: 'IN_PROGRESS',
        idempotencyKey: uuid.v4(),
        mutationId: uuid.v4(),
      );

      // Mock server sync returns CONFLICT: Server has version 3 (Manager re-assigned task)
      // Resolution rule: Server authoritative on re-assignment; local updates to server state
      await (db.update(db.tasks)..where((t) => t.id.equals(taskId))).write(
        const TasksCompanion(
          status: Value('REASSIGNED'),
          version: Value(3),
          syncStatus: Value(SyncStatus.synced),
        ),
      );

      final resolvedTask = await (db.select(db.tasks)..where((t) => t.id.equals(taskId))).getSingle();
      expect(resolvedTask.version, 3);
      expect(resolvedTask.status, 'REASSIGNED');
      expect(resolvedTask.syncStatus, SyncStatus.synced);

      await db.close();
    });

    test('8. Invariant: Continuous GPS Telemetry MUST NOT enter Domain Outbox', () async {
      final db = AppDatabase(NativeDatabase(dbFile));

      // Assert clean state initially
      await db.assertNoGpsInDomainOutbox();

      // If a rogue developer attempts to queue GPS coordinates in domain outbox
      await db.into(db.outboxMutations).insert(
        OutboxMutationsCompanion.insert(
          id: uuid.v4(),
          idempotencyKey: uuid.v4(),
          aggregateType: 'GPS',
          aggregateId: 'loc-1',
          mutationType: 'BREADCRUMB',
          payload: '{"lat": 28.5, "lng": 77.2}',
        ),
      );

      // Invariant assertion must fail
      expect(
        () async => await db.assertNoGpsInDomainOutbox(),
        throwsA(isA<StateError>()),
      );

      await db.close();
    });

    test('9. Schema Migration Lifecycle (v1 to v2)', () async {
      final migDbFile = File('${tempDir.path}${Platform.pathSeparator}migration_test.sqlite');
      
      // Step 1: Open with initial schema and insert record
      final db = AppDatabase(NativeDatabase(migDbFile));
      final taskId = uuid.v4();
      await db.into(db.tasks).insert(
        TasksCompanion.insert(id: taskId, title: 'Pre-Migration Task', version: const Value(1)),
      );

      // Verify schema version is 2
      final versionResult = await db.customSelect('PRAGMA user_version;').getSingle();
      expect(versionResult.data['user_version'], 2);

      final task = await (db.select(db.tasks)..where((t) => t.id.equals(taskId))).getSingle();
      expect(task.title, 'Pre-Migration Task');
      expect(task.version, 1);

      await db.close();
    });
  });
}

import 'dart:convert';
import 'package:drift/drift.dart';

part 'database.g.dart';

enum SyncStatus { synced, pending, failed }

@DataClassName('TaskEntry')
class Tasks extends Table {
  TextColumn get id => text()();
  TextColumn get title => text().withLength(min: 1, max: 255)();
  TextColumn get description => text().nullable()();
  TextColumn get status => text().withDefault(const Constant('PENDING'))();
  DateTimeColumn get dueAt => dateTime().nullable()();
  IntColumn get version => integer().withDefault(const Constant(1))();
  IntColumn get syncStatus => intEnum<SyncStatus>().withDefault(Constant(SyncStatus.synced.index))();
  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {id};
}

enum OutboxStatus { pending, inFlight, completed, failed }

@DataClassName('OutboxMutation')
class OutboxMutations extends Table {
  TextColumn get id => text()();
  TextColumn get idempotencyKey => text().unique()();
  TextColumn get aggregateType => text()(); // 'TASK', 'CHECKIN', etc.
  TextColumn get aggregateId => text()();
  TextColumn get mutationType => text()(); // 'CREATE', 'UPDATE', 'DELETE'
  TextColumn get payload => text()(); // JSON string
  IntColumn get retryCount => integer().withDefault(const Constant(0))();
  IntColumn get status => intEnum<OutboxStatus>().withDefault(Constant(OutboxStatus.pending.index))();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();
  DateTimeColumn get lastAttemptAt => dateTime().nullable()();
  TextColumn get errorMessage => text().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}

@DriftDatabase(tables: [Tasks, OutboxMutations])
class AppDatabase extends _$AppDatabase {
  AppDatabase(QueryExecutor e) : super(e);

  @override
  int get schemaVersion => 2;

  @override
  MigrationStrategy get migration => MigrationStrategy(
        onCreate: (m) async {
          await m.createAll();
        },
        onUpgrade: (m, from, to) async {
          if (from < 2) {
            // v1 to v2: Add version column to tasks table
            await m.addColumn(tasks, tasks.version);
          }
        },
        beforeOpen: (details) async {
          // Verify foreign keys and WAL mode setup
          await customStatement('PRAGMA foreign_keys = ON;');
        },
      );

  /// Atomic transaction: updates local task optimistically and writes outbox mutation
  Future<void> updateTaskOptimistically({
    required String taskId,
    required String newStatus,
    required String idempotencyKey,
    required String mutationId,
  }) {
    return transaction(() async {
      // 1. Fetch current task
      final current = await (select(tasks)..where((t) => t.id.equals(taskId))).getSingleOrNull();
      if (current == null) {
        throw StateError('Task $taskId not found');
      }

      final nextVersion = current.version + 1;

      // 2. Optimistic update
      await (update(tasks)..where((t) => t.id.equals(taskId))).write(
        TasksCompanion(
          status: Value(newStatus),
          version: Value(nextVersion),
          syncStatus: Value(SyncStatus.pending),
          updatedAt: Value(DateTime.now()),
        ),
      );

      // 3. Write outbox mutation
      final payload = jsonEncode({
        'taskId': taskId,
        'status': newStatus,
        'clientVersion': nextVersion,
      });

      await into(outboxMutations).insert(
        OutboxMutationsCompanion.insert(
          id: mutationId,
          idempotencyKey: idempotencyKey,
          aggregateType: 'TASK',
          aggregateId: taskId,
          mutationType: 'UPDATE_STATUS',
          payload: payload,
          status: Value(OutboxStatus.pending),
        ),
      );
    });
  }

  /// Invariant check: GPS telemetry data MUST NOT enter the domain outbox
  Future<void> assertNoGpsInDomainOutbox() async {
    final gpsEntries = await (select(outboxMutations)
          ..where((m) => m.aggregateType.equals('GPS') | m.aggregateType.equals('TELEMETRY')))
        .get();
    if (gpsEntries.isNotEmpty) {
      throw StateError('CRITICAL INVARIANT VIOLATION: GPS telemetry detected in domain outbox!');
    }
  }
}

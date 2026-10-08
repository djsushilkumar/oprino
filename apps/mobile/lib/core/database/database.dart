import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';

part 'database.g.dart';

/// OFFLINE CLIENT MODEL: Outbox Mutations Queue
/// Captures offline operational intents for reliable, idempotent replay.
class OutboxMutations extends Table {
  TextColumn get id => text()();
  TextColumn get workspaceId => text()();
  TextColumn get entityType => text()(); // 'TASK', 'CHECKLIST', 'ATTENDANCE'
  TextColumn get entityId => text()();
  TextColumn get mutationType => text()(); // 'TRANSITION', 'CHECKLIST_UPDATE', 'PUNCH_IN', 'PUNCH_OUT'
  TextColumn get payload => text()();
  TextColumn get idempotencyKey => text().unique()();
  IntColumn get attemptCount => integer().withDefault(const Constant(0))();
  TextColumn get status => text().withDefault(const Constant('PENDING'))(); // 'PENDING', 'SYNCING', 'FAILED', 'SYNCED'
  TextColumn get lastError => text().nullable()();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();
  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {id};
}

/// OFFLINE CLIENT MODEL: Cached Assigned Tasks
class CachedTasks extends Table {
  TextColumn get id => text()();
  TextColumn get workspaceId => text()();
  TextColumn get title => text()();
  TextColumn get description => text().nullable()();
  TextColumn get status => text()();
  TextColumn get simplifiedStatus => text()();
  TextColumn get priority => text()();
  DateTimeColumn get dueAt => dateTime().nullable()();
  IntColumn get version => integer().withDefault(const Constant(1))();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

/// OFFLINE CLIENT MODEL: Cached Checklist Items
class CachedChecklistItems extends Table {
  TextColumn get id => text()();
  TextColumn get taskId => text()();
  TextColumn get title => text()();
  BoolColumn get isCompleted => boolean().withDefault(const Constant(false))();
  IntColumn get sortOrder => integer().withDefault(const Constant(0))();
  DateTimeColumn get completedAt => dateTime().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}

/// OFFLINE CLIENT MODEL: Cached Attendance State
class CachedAttendance extends Table {
  TextColumn get id => text()(); // singleton per workspace e.g. "active_state_<workspaceId>"
  TextColumn get workspaceId => text()();
  TextColumn get dutyState => text()(); // 'NOT_STARTED', 'ON_DUTY', 'OFF_DUTY'
  TextColumn get activeSessionId => text().nullable()();
  DateTimeColumn get punchInTime => dateTime().nullable()();
  TextColumn get shiftName => text().nullable()();
  DateTimeColumn get lastUpdated => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {id};
}

@DriftDatabase(tables: [
  OutboxMutations,
  CachedTasks,
  CachedChecklistItems,
  CachedAttendance,
])
class AppDatabase extends _$AppDatabase {
  AppDatabase([QueryExecutor? e]) : super(e ?? _openConnection());

  @override
  int get schemaVersion => 2;

  @override
  MigrationStrategy get migration => MigrationStrategy(
        onCreate: (m) async {
          await m.createAll();
        },
        onUpgrade: (m, from, to) async {
          if (from < 2) {
            await m.createTable(cachedTasks);
            await m.createTable(cachedChecklistItems);
            await m.createTable(cachedAttendance);
            // Add columns to outbox if needed
            await m.addColumn(outboxMutations, outboxMutations.lastError);
            await m.addColumn(outboxMutations, outboxMutations.updatedAt);
          }
        },
      );

  static QueryExecutor _openConnection() {
    return driftDatabase(
      name: 'oprino_mobile_db',
      native: const DriftNativeOptions(
        shareAcrossIsolates: true,
      ),
    );
  }
}

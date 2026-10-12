import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';

part 'database.g.dart';

/// OFFLINE CLIENT MODEL: Outbox Mutations Queue
/// Captures offline operational intents for reliable, idempotent replay.
class OutboxMutations extends Table {
  TextColumn get id => text()();
  TextColumn get workspaceId => text()();
  TextColumn get entityType => text()(); // 'TASK', 'CHECKLIST', 'ATTENDANCE', 'VISIT', 'PROOF'
  TextColumn get entityId => text()();
  TextColumn get mutationType => text()(); // 'TRANSITION', 'CHECKLIST_UPDATE', 'PUNCH_IN', 'PUNCH_OUT', 'VISIT_CHECK_IN', 'VISIT_CHECK_OUT', 'CONFIRM_PROOF'
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
  TextColumn get customerId => text().nullable()();
  TextColumn get customerName => text().nullable()();
  TextColumn get siteId => text().nullable()();
  TextColumn get siteName => text().nullable()();
  BoolColumn get requiresPhotoProof => boolean().withDefault(const Constant(false))();
  BoolColumn get requiresSignature => boolean().withDefault(const Constant(false))();
  TextColumn get verifierName => text().nullable()();
  DateTimeColumn get verifiedAt => dateTime().nullable()();
  TextColumn get verificationNotes => text().nullable()();
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

/// OFFLINE CLIENT MODEL: Cached Field Visits
class CachedVisits extends Table {
  TextColumn get id => text()();
  TextColumn get workspaceId => text()();
  TextColumn get customerId => text()();
  TextColumn get customerName => text().nullable()();
  TextColumn get siteId => text().nullable()();
  TextColumn get siteName => text().nullable()();
  TextColumn get taskId => text().nullable()();
  TextColumn get userId => text()();
  TextColumn get status => text()(); // 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
  DateTimeColumn get scheduledAt => dateTime().nullable()();
  DateTimeColumn get checkInTime => dateTime().nullable()();
  RealColumn get checkInLat => real().nullable()();
  RealColumn get checkInLng => real().nullable()();
  DateTimeColumn get checkOutTime => dateTime().nullable()();
  RealColumn get checkOutLat => real().nullable()();
  RealColumn get checkOutLng => real().nullable()();
  IntColumn get durationMinutes => integer().nullable()();
  IntColumn get sequenceOrder => integer().nullable()();
  TextColumn get routeDate => text().nullable()();
  TextColumn get notes => text().nullable()();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

/// OFFLINE CLIENT MODEL: Cached Task Proofs
class CachedTaskProofs extends Table {
  TextColumn get id => text()();
  TextColumn get workspaceId => text()();
  TextColumn get taskId => text()();
  TextColumn get visitId => text().nullable()();
  TextColumn get userId => text()();
  TextColumn get proofType => text()(); // 'PHOTO', 'SIGNATURE', 'DOCUMENT'
  TextColumn get fileKey => text()();
  TextColumn get fileUrl => text().nullable()();
  TextColumn get signerName => text().nullable()();
  TextColumn get signerPhone => text().nullable()();
  TextColumn get watermarkJson => text().nullable()();
  TextColumn get notes => text().nullable()();
  DateTimeColumn get createdAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

/// OFFLINE CLIENT MODEL: Cached GPS Locations Queue
/// Durable local persistence for duty-hours GPS fixes.
/// Decouples capture from synchronization to guarantee zero data loss
/// during offline operations, app crashes, and shifts ending offline.
class CachedLocations extends Table {
  TextColumn get id => text()();
  TextColumn get workspaceId => text()();
  TextColumn get userId => text()();
  TextColumn get sessionId => text().nullable()();
  RealColumn get latitude => real()();
  RealColumn get longitude => real()();
  RealColumn get accuracy => real()();
  RealColumn get speed => real().nullable()();
  RealColumn get heading => real().nullable()();
  RealColumn get altitude => real().nullable()();
  RealColumn get batteryLevel => real().nullable()();
  BoolColumn get isCharging => boolean().nullable()();
  TextColumn get activityType => text().nullable()();
  BoolColumn get isMoving => boolean().nullable()();
  DateTimeColumn get recordedAt => dateTime()();
  TextColumn get status => text().withDefault(const Constant('PENDING'))(); // 'PENDING', 'SYNCING', 'SYNCED', 'FAILED'
  IntColumn get attemptCount => integer().withDefault(const Constant(0))();
  TextColumn get lastError => text().nullable()();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {id};
}

@DriftDatabase(tables: [
  OutboxMutations,
  CachedTasks,
  CachedChecklistItems,
  CachedAttendance,
  CachedVisits,
  CachedTaskProofs,
  CachedLocations,
])
class AppDatabase extends _$AppDatabase {
  AppDatabase([QueryExecutor? e]) : super(e ?? _openConnection());

  @override
  int get schemaVersion => 5;

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
            await m.addColumn(outboxMutations, outboxMutations.lastError);
            await m.addColumn(outboxMutations, outboxMutations.updatedAt);
          }
          if (from < 3) {
            await m.addColumn(cachedTasks, cachedTasks.customerId);
            await m.addColumn(cachedTasks, cachedTasks.customerName);
            await m.addColumn(cachedTasks, cachedTasks.siteId);
            await m.addColumn(cachedTasks, cachedTasks.siteName);
            await m.addColumn(cachedTasks, cachedTasks.requiresPhotoProof);
            await m.addColumn(cachedTasks, cachedTasks.requiresSignature);
            await m.addColumn(cachedTasks, cachedTasks.verifierName);
            await m.addColumn(cachedTasks, cachedTasks.verifiedAt);
            await m.addColumn(cachedTasks, cachedTasks.verificationNotes);
            await m.createTable(cachedVisits);
            await m.createTable(cachedTaskProofs);
          }
          if (from < 4) {
            await m.addColumn(cachedVisits, cachedVisits.sequenceOrder);
            await m.addColumn(cachedVisits, cachedVisits.routeDate);
          }
          if (from < 5) {
            await m.createTable(cachedLocations);
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

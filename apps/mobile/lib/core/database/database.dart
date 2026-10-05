import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';

part 'database.g.dart';

class OutboxMutations extends Table {
  TextColumn get id => text()();
  TextColumn get workspaceId => text()();
  TextColumn get entityType => text()();
  TextColumn get entityId => text()();
  TextColumn get mutationType => text()(); // INSERT, UPDATE, DELETE
  TextColumn get payload => text()();
  TextColumn get idempotencyKey => text().unique()();
  IntColumn get attemptCount => integer().withDefault(const Constant(0))();
  TextColumn get status => text().withDefault(const Constant('PENDING'))(); // PENDING, SYNCING, FAILED
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {id};
}

@DriftDatabase(tables: [OutboxMutations])
class AppDatabase extends _$AppDatabase {
  AppDatabase([QueryExecutor? e]) : super(e ?? _openConnection());

  @override
  int get schemaVersion => 1;

  static QueryExecutor _openConnection() {
    return driftDatabase(
      name: 'oprino_mobile_db',
      native: const DriftNativeOptions(
        shareAcrossIsolates: true,
      ),
    );
  }
}

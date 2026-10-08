import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:drift/drift.dart';
import 'package:oprino_api/oprino_api.dart';
import '../database/database.dart';
import '../network/api_client_provider.dart';
import '../storage/secure_storage_service.dart';


final syncServiceProvider = Provider<SyncService>((ref) {
  final db = ref.watch(databaseProvider);
  final client = ref.watch(apiClientProvider);
  return SyncService(db: db, client: client);
});

class SyncService {
  final AppDatabase db;
  final OprinoApiClient client;
  final bool autoProcessOutbox;

  SyncService({
    required this.db,
    required this.client,
    this.autoProcessOutbox = true,
  });

  // =========================================================================
  // QUEUE OFFLINE MUTATIONS (Optimistic Local Write + Outbox)
  // =========================================================================

  /// Queues Punch In mutation and optimistically updates local duty state.
  Future<String> queuePunchIn({
    required String workspaceId,
    String? shiftId,
    String? note,
  }) async {
    final mutationId = SecureStorageService.generateUuidV4();
    final idempotencyKey = 'mut-punch-in-$mutationId';
    final now = DateTime.now();

    final payload = jsonEncode({
      'shiftId': shiftId,
      'note': note,
    });

    await db.transaction(() async {
      // 1. Insert into outbox
      await db.into(db.outboxMutations).insert(
            OutboxMutationsCompanion.insert(
              id: mutationId,
              workspaceId: workspaceId,
              entityType: 'ATTENDANCE',
              entityId: workspaceId,
              mutationType: 'PUNCH_IN',
              payload: payload,
              idempotencyKey: idempotencyKey,
              createdAt: Value(now),
              updatedAt: Value(now),
            ),
          );

      // 2. Optimistically update local attendance cache
      await db.into(db.cachedAttendance).insertOnConflictUpdate(
            CachedAttendanceCompanion.insert(
              id: 'active_state_$workspaceId',
              workspaceId: workspaceId,
              dutyState: 'ON_DUTY',
              punchInTime: Value(now),
              lastUpdated: Value(now),
            ),
          );
    });

    // Fire background sync attempt
    if (autoProcessOutbox) processOutbox().ignore();
    return idempotencyKey;
  }

  /// Queues Punch Out mutation and optimistically updates local duty state.
  Future<String> queuePunchOut({
    required String workspaceId,
    String? note,
  }) async {
    final mutationId = SecureStorageService.generateUuidV4();
    final idempotencyKey = 'mut-punch-out-$mutationId';
    final now = DateTime.now();

    final payload = jsonEncode({'note': note});

    await db.transaction(() async {
      await db.into(db.outboxMutations).insert(
            OutboxMutationsCompanion.insert(
              id: mutationId,
              workspaceId: workspaceId,
              entityType: 'ATTENDANCE',
              entityId: workspaceId,
              mutationType: 'PUNCH_OUT',
              payload: payload,
              idempotencyKey: idempotencyKey,
              createdAt: Value(now),
              updatedAt: Value(now),
            ),
          );

      await db.into(db.cachedAttendance).insertOnConflictUpdate(
            CachedAttendanceCompanion.insert(
              id: 'active_state_$workspaceId',
              workspaceId: workspaceId,
              dutyState: 'OFF_DUTY',
              lastUpdated: Value(now),
            ),
          );
    });

    if (autoProcessOutbox) processOutbox().ignore();
    return idempotencyKey;
  }

  /// Queues Task Status Transition mutation and optimistically updates cached task.
  Future<String> queueTaskTransition({
    required String workspaceId,
    required String taskId,
    required String targetStatus,
    required int version,
    String? comment,
  }) async {
    final mutationId = SecureStorageService.generateUuidV4();
    final idempotencyKey = 'mut-trans-$mutationId';
    final now = DateTime.now();

    final payload = jsonEncode({
      'status': targetStatus,
      'version': version,
      'comment': comment,
    });

    await db.transaction(() async {
      await db.into(db.outboxMutations).insert(
            OutboxMutationsCompanion.insert(
              id: mutationId,
              workspaceId: workspaceId,
              entityType: 'TASK',
              entityId: taskId,
              mutationType: 'TRANSITION',
              payload: payload,
              idempotencyKey: idempotencyKey,
              createdAt: Value(now),
              updatedAt: Value(now),
            ),
          );

      // Optimistic update of local task
      await (db.update(db.cachedTasks)..where((t) => t.id.equals(taskId))).write(
        CachedTasksCompanion(
          status: Value(targetStatus),
          version: Value(version + 1),
          updatedAt: Value(now),
        ),
      );
    });

    if (autoProcessOutbox) processOutbox().ignore();
    return idempotencyKey;
  }

  /// Queues checklist completion toggle.
  Future<String> queueChecklistToggle({
    required String workspaceId,
    required String taskId,
    required String itemId,
    required bool isCompleted,
  }) async {
    final mutationId = SecureStorageService.generateUuidV4();
    final idempotencyKey = 'mut-chk-$mutationId';
    final now = DateTime.now();

    final payload = jsonEncode({'isCompleted': isCompleted});

    await db.transaction(() async {
      await db.into(db.outboxMutations).insert(
            OutboxMutationsCompanion.insert(
              id: mutationId,
              workspaceId: workspaceId,
              entityType: 'CHECKLIST',
              entityId: itemId,
              mutationType: 'CHECKLIST_UPDATE',
              payload: payload,
              idempotencyKey: idempotencyKey,
              createdAt: Value(now),
              updatedAt: Value(now),
            ),
          );

      await (db.update(db.cachedChecklistItems)..where((c) => c.id.equals(itemId))).write(
        CachedChecklistItemsCompanion(
          isCompleted: Value(isCompleted),
          completedAt: Value(isCompleted ? now : null),
        ),
      );
    });

    if (autoProcessOutbox) processOutbox().ignore();
    return idempotencyKey;
  }

  // =========================================================================
  // SYNC ENGINE: PROCESS OUTBOX MUTATIONS
  // =========================================================================

  /// Drains pending outbox mutations via the API client.
  Future<void> processOutbox() async {
    final pending = await (db.select(db.outboxMutations)
          ..where((m) => m.status.equals('PENDING') | m.status.equals('FAILED'))
          ..orderBy([(m) => OrderingTerm.asc(m.createdAt)]))
        .get();

    for (final mutation in pending) {
      try {
        // Mark as SYNCING
        await (db.update(db.outboxMutations)..where((m) => m.id.equals(mutation.id))).write(
          OutboxMutationsCompanion(
            status: const Value('SYNCING'),
            attemptCount: Value(mutation.attemptCount + 1),
            updatedAt: Value(DateTime.now()),
          ),
        );

        final data = jsonDecode(mutation.payload) as Map<String, dynamic>;

        switch (mutation.mutationType) {
          case 'PUNCH_IN':
            await client.punchIn(
              idempotencyKey: mutation.idempotencyKey,
              shiftId: data['shiftId'] as String?,
              note: data['note'] as String?,
            );
            break;

          case 'PUNCH_OUT':
            await client.punchOut(
              idempotencyKey: mutation.idempotencyKey,
              note: data['note'] as String?,
            );
            break;

          case 'TRANSITION':
            await client.transitionTask(
              mutation.entityId,
              status: data['status'] as String,
              version: data['version'] as int,
              comment: data['comment'] as String?,
            );
            break;

          case 'CHECKLIST_UPDATE':
            // EntityId is itemId
            // Note: client.updateChecklistItem takes taskId, itemId, isCompleted
            // We can parse or pass taskId in payload
            final taskId = data['taskId'] as String? ?? '';
            if (taskId.isNotEmpty) {
              await client.updateChecklistItem(
                taskId,
                mutation.entityId,
                isCompleted: data['isCompleted'] as bool,
              );
            }
            break;
        }

        // Successfully acknowledged: remove from outbox
        await (db.delete(db.outboxMutations)..where((m) => m.id.equals(mutation.id))).go();
      } catch (err) {
        // Record failure and retry count
        await (db.update(db.outboxMutations)..where((m) => m.id.equals(mutation.id))).write(
          OutboxMutationsCompanion(
            status: const Value('FAILED'),
            lastError: Value(err.toString()),
            updatedAt: Value(DateTime.now()),
          ),
        );
      }
    }
  }

  // =========================================================================
  // SYNC DOWN / REFRESH FROM SERVER
  // =========================================================================

  Future<void> syncDownTasks(String workspaceId) async {
    try {
      final res = await client.listTasks();
      await db.transaction(() async {
        for (final task in res.tasks) {
          await db.into(db.cachedTasks).insertOnConflictUpdate(
                CachedTasksCompanion.insert(
                  id: task.id,
                  workspaceId: task.workspaceId,
                  title: task.title,
                  description: Value(task.description),
                  status: task.status,
                  simplifiedStatus: task.simplifiedStatus,
                  priority: task.priority,
                  dueAt: Value(task.dueAt),
                  version: Value(task.version),
                  createdAt: task.createdAt,
                  updatedAt: task.updatedAt,
                ),
              );

          for (final item in task.checklist) {
            await db.into(db.cachedChecklistItems).insertOnConflictUpdate(
                  CachedChecklistItemsCompanion.insert(
                    id: item.id,
                    taskId: task.id,
                    title: item.title,
                    isCompleted: Value(item.isCompleted),
                    sortOrder: Value(item.sortOrder),
                    completedAt: Value(item.completedAt),
                  ),
                );
          }
        }
      });
    } catch (_) {
      // Offline fallback: use local cache
    }
  }

  Future<void> syncDownAttendance(String workspaceId) async {
    try {
      final res = await client.getCurrentAttendance();
      await db.into(db.cachedAttendance).insertOnConflictUpdate(
            CachedAttendanceCompanion.insert(
              id: 'active_state_$workspaceId',
              workspaceId: workspaceId,
              dutyState: res.dutyState,
              activeSessionId: Value(res.activeSession?.id),
              punchInTime: Value(res.activeSession?.punchInTime),
              shiftName: Value(res.activeSession?.shiftName),
              lastUpdated: Value(DateTime.now()),
            ),
          );
    } catch (_) {
      // Offline fallback
    }
  }

  // =========================================================================
  // STREAM WATCHERS FOR REACTIVE UI
  // =========================================================================

  Stream<List<CachedTask>> watchTasks(String workspaceId) {
    return (db.select(db.cachedTasks)
          ..where((t) => t.workspaceId.equals(workspaceId))
          ..orderBy([(t) => OrderingTerm.desc(t.createdAt)]))
        .watch();
  }

  Stream<List<CachedChecklistItem>> watchChecklist(String taskId) {
    return (db.select(db.cachedChecklistItems)
          ..where((c) => c.taskId.equals(taskId))
          ..orderBy([(c) => OrderingTerm.asc(c.sortOrder)]))
        .watch();
  }

  Stream<CachedAttendanceData?> watchAttendance(String workspaceId) {
    return (db.select(db.cachedAttendance)
          ..where((a) => a.id.equals('active_state_$workspaceId')))
        .watchSingleOrNull();
  }

  Stream<List<OutboxMutation>> watchPendingMutations() {
    return (db.select(db.outboxMutations)
          ..where((m) => m.status.equals('PENDING') | m.status.equals('SYNCING'))
          ..orderBy([(m) => OrderingTerm.asc(m.createdAt)]))
        .watch();
  }
}

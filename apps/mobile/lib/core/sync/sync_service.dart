import 'dart:convert';
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:drift/drift.dart';
import 'package:oprino_api/oprino_api.dart';
import '../database/database.dart';
import '../network/api_client_provider.dart';
import '../network/media_upload_service.dart';
import '../storage/secure_storage_service.dart';

final syncServiceProvider = Provider<SyncService>((ref) {
  final db = ref.watch(databaseProvider);
  final client = ref.watch(apiClientProvider);
  final mediaService = ref.watch(mediaUploadServiceProvider);
  return SyncService(db: db, client: client, mediaService: mediaService);
});

class SyncService {
  final AppDatabase db;
  final OprinoApiClient client;
  final MediaUploadService? mediaService;
  final bool autoProcessOutbox;

  SyncService({
    required this.db,
    required this.client,
    this.mediaService,
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
    String? selfieMediaKey,
    String? localFilePath,
    double? latitude,
    double? longitude,
    double? accuracy,
  }) async {
    final mutationId = SecureStorageService.generateUuidV4();
    final idempotencyKey = 'mut-punch-in-$mutationId';
    final now = DateTime.now();

    final payload = jsonEncode({
      'shiftId': shiftId,
      'note': note,
      'selfieMediaKey': selfieMediaKey,
      'localFilePath': localFilePath,
      'latitude': latitude,
      'longitude': longitude,
      'accuracy': accuracy,
    });

    await db.transaction(() async {
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

    final payload = jsonEncode({
      'taskId': taskId,
      'isCompleted': isCompleted,
    });

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

  /// Queues Visit Check-in mutation with GPS coordinates.
  Future<String> queueVisitCheckIn({
    required String workspaceId,
    required String visitId,
    required double latitude,
    required double longitude,
    double? accuracy,
    String? notes,
  }) async {
    final mutationId = SecureStorageService.generateUuidV4();
    final idempotencyKey = 'mut-vis-in-$mutationId';
    final now = DateTime.now();

    final payload = jsonEncode({
      'latitude': latitude,
      'longitude': longitude,
      'accuracy': accuracy,
      'notes': notes,
    });

    await db.transaction(() async {
      await db.into(db.outboxMutations).insert(
            OutboxMutationsCompanion.insert(
              id: mutationId,
              workspaceId: workspaceId,
              entityType: 'VISIT',
              entityId: visitId,
              mutationType: 'VISIT_CHECK_IN',
              payload: payload,
              idempotencyKey: idempotencyKey,
              createdAt: Value(now),
              updatedAt: Value(now),
            ),
          );

      await (db.update(db.cachedVisits)..where((v) => v.id.equals(visitId))).write(
        CachedVisitsCompanion(
          status: const Value('IN_PROGRESS'),
          checkInTime: Value(now),
          checkInLat: Value(latitude),
          checkInLng: Value(longitude),
          updatedAt: Value(now),
        ),
      );
    });

    if (autoProcessOutbox) processOutbox().ignore();
    return idempotencyKey;
  }

  /// Queues Visit Check-out mutation with GPS coordinates.
  Future<String> queueVisitCheckOut({
    required String workspaceId,
    required String visitId,
    required double latitude,
    required double longitude,
    double? accuracy,
    String? notes,
  }) async {
    final mutationId = SecureStorageService.generateUuidV4();
    final idempotencyKey = 'mut-vis-out-$mutationId';
    final now = DateTime.now();

    final payload = jsonEncode({
      'latitude': latitude,
      'longitude': longitude,
      'accuracy': accuracy,
      'notes': notes,
    });

    await db.transaction(() async {
      await db.into(db.outboxMutations).insert(
            OutboxMutationsCompanion.insert(
              id: mutationId,
              workspaceId: workspaceId,
              entityType: 'VISIT',
              entityId: visitId,
              mutationType: 'VISIT_CHECK_OUT',
              payload: payload,
              idempotencyKey: idempotencyKey,
              createdAt: Value(now),
              updatedAt: Value(now),
            ),
          );

      await (db.update(db.cachedVisits)..where((v) => v.id.equals(visitId))).write(
        CachedVisitsCompanion(
          status: const Value('COMPLETED'),
          checkOutTime: Value(now),
          checkOutLat: Value(latitude),
          checkOutLng: Value(longitude),
          updatedAt: Value(now),
        ),
      );
    });

    if (autoProcessOutbox) processOutbox().ignore();
    return idempotencyKey;
  }

  /// Queues Proof of Work (Photo or Signature) upload confirmation.
  Future<String> queueProofConfirmation({
    required String workspaceId,
    required String taskId,
    String? visitId,
    required String userId,
    required String proofType,
    required String fileKey,
    String? fileUrl,
    String? localFilePath,
    bool isBinaryUploaded = true,
    String? signerName,
    String? signerPhone,
    Map<String, dynamic>? watermarkMetadata,
    String? notes,
  }) async {
    final mutationId = SecureStorageService.generateUuidV4();
    final idempotencyKey = 'mut-proof-$mutationId';
    final now = DateTime.now();

    final payload = jsonEncode({
      'taskId': taskId,
      'visitId': visitId,
      'proofType': proofType,
      'fileKey': fileKey,
      'localFilePath': localFilePath,
      'isBinaryUploaded': isBinaryUploaded,
      'signerName': signerName,
      'signerPhone': signerPhone,
      'watermarkMetadata': watermarkMetadata,
      'notes': notes,
    });

    await db.transaction(() async {
      await db.into(db.outboxMutations).insert(
            OutboxMutationsCompanion.insert(
               id: mutationId,
               workspaceId: workspaceId,
               entityType: 'PROOF',
               entityId: mutationId,
               mutationType: 'CONFIRM_PROOF',
               payload: payload,
               idempotencyKey: idempotencyKey,
               createdAt: Value(now),
               updatedAt: Value(now),
             ),
           );

      await db.into(db.cachedTaskProofs).insertOnConflictUpdate(
            CachedTaskProofsCompanion.insert(
              id: mutationId,
              workspaceId: workspaceId,
              taskId: taskId,
              visitId: Value(visitId),
              userId: userId,
              proofType: proofType,
              fileKey: fileKey,
              fileUrl: Value(fileUrl),
              signerName: Value(signerName),
              signerPhone: Value(signerPhone),
              watermarkJson: Value(watermarkMetadata != null ? jsonEncode(watermarkMetadata) : null),
              notes: Value(notes),
              createdAt: now,
            ),
          );
    });

    if (autoProcessOutbox) processOutbox().ignore();
    return idempotencyKey;
  }

  /// Queues Task Verification mutation by supervisor/manager.
  Future<String> queueTaskVerification({
    required String workspaceId,
    required String taskId,
    required String action, // 'APPROVE' or 'REJECT'
    String? notes,
  }) async {
    final mutationId = SecureStorageService.generateUuidV4();
    final idempotencyKey = 'mut-verify-$mutationId';
    final now = DateTime.now();

    final payload = jsonEncode({
      'taskId': taskId,
      'action': action,
      'notes': notes,
    });

    await db.transaction(() async {
      await db.into(db.outboxMutations).insert(
            OutboxMutationsCompanion.insert(
              id: mutationId,
              workspaceId: workspaceId,
              entityType: 'TASK',
              entityId: taskId,
              mutationType: 'VERIFY_TASK',
              payload: payload,
              idempotencyKey: idempotencyKey,
              createdAt: Value(now),
              updatedAt: Value(now),
            ),
          );

      if (action == 'APPROVE') {
        await (db.update(db.cachedTasks)..where((t) => t.id.equals(taskId))).write(
          CachedTasksCompanion(
            status: const Value('VERIFIED'),
            verifierName: const Value('Supervisor'),
            verifiedAt: Value(now),
            verificationNotes: Value(notes),
            updatedAt: Value(now),
          ),
        );
      }
    });

    if (autoProcessOutbox) processOutbox().ignore();
    return idempotencyKey;
  }

  // =========================================================================
  // SYNC ENGINE: PROCESS OUTBOX MUTATIONS
  // =========================================================================

  /// Phase 04: Flushes pending outbox mutations in a single batch to /v1/sync/mutations.
  /// Resolves conflicts server-side according to SYNC-CONFLICT-MATRIX.md.
  Future<SyncBatchResponse?> processOutboxBatch({int batchSize = 25}) async {
    final pending = await (db.select(db.outboxMutations)
          ..where((m) => m.status.equals('PENDING') | m.status.equals('FAILED'))
          ..orderBy([(m) => OrderingTerm.asc(m.createdAt)])
          ..limit(batchSize))
        .get();

    if (pending.isEmpty) return null;

    final envelopes = pending.map((m) {
      return SyncMutationEnvelope(
        mutationId: m.id,
        entityType: m.entityType,
        entityId: m.entityId,
        mutationType: m.mutationType,
        payload: jsonDecode(m.payload) as Map<String, dynamic>,
        idempotencyKey: m.idempotencyKey,
        clientTimestamp: m.createdAt,
      );
    }).toList();

    try {
      final response = await client.syncMutationsBatch(mutations: envelopes);

      final resultMap = {for (final r in response.results) r.mutationId: r};

      for (final m in pending) {
        final result = resultMap[m.id];
        if (result != null &&
            (result.status == 'APPLIED' ||
                result.status == 'DUPLICATE_ACK' ||
                result.status == 'APPLIED_OVERRIDE' ||
                result.status == 'MERGED_PARTIAL' ||
                result.status == 'DUPLICATE' ||
                result.status == 'CONFLICT')) {
          await (db.update(db.outboxMutations)..where((row) => row.id.equals(m.id))).write(
            OutboxMutationsCompanion(
              status: const Value('SYNCED'),
              updatedAt: Value(DateTime.now()),
            ),
          );
        } else if (result != null &&
            (result.status == 'REJECTED_STALE' || result.status == 'ERROR')) {
          await (db.update(db.outboxMutations)..where((row) => row.id.equals(m.id))).write(
            OutboxMutationsCompanion(
              status: const Value('FAILED'),
              lastError: Value(result.error ?? result.status),
              updatedAt: Value(DateTime.now()),
            ),
          );
        }
      }

      return response;
    } catch (_) {
      // Offline fallback: fall through to sequential processing
      await processOutbox();
      return null;
    }
  }

  /// Drains pending outbox mutations via the API client.
  Future<void> processOutbox() async {
    final pending = await (db.select(db.outboxMutations)
          ..where((m) => m.status.equals('PENDING') | m.status.equals('FAILED'))
          ..orderBy([(m) => OrderingTerm.asc(m.createdAt)]))
        .get();

    for (final mutation in pending) {
      try {
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
            String? selfieKey = data['selfieMediaKey'] as String?;
            final localSelfiePath = data['localFilePath'] as String?;

            // If selfie was captured offline and not yet uploaded to storage:
            if (localSelfiePath != null && (selfieKey == null || selfieKey.isEmpty) && mediaService != null) {
              final localFile = File(localSelfiePath);
              if (await localFile.exists()) {
                final bytes = await localFile.readAsBytes();
                final uploadMeta = await mediaService!.requestAttendanceSelfieUploadUrl(
                  fileName: 'selfie.jpg',
                );
                await mediaService!.uploadBinaryBytes(
                  uploadUrl: uploadMeta.uploadUrl,
                  bytes: bytes,
                  contentType: 'image/jpeg',
                );
                selfieKey = uploadMeta.fileKey;

                // Persist uploaded key in payload for retry resilience
                data['selfieMediaKey'] = selfieKey;
                await (db.update(db.outboxMutations)..where((m) => m.id.equals(mutation.id))).write(
                  OutboxMutationsCompanion(
                    payload: Value(jsonEncode(data)),
                    updatedAt: Value(DateTime.now()),
                  ),
                );
              }
            }

            try {
              final punchRes = await client.punchIn(
                idempotencyKey: mutation.idempotencyKey,
                shiftId: data['shiftId'] as String?,
                note: data['note'] as String?,
                selfieMediaKey: selfieKey,
                latitude: (data['latitude'] as num?)?.toDouble(),
                longitude: (data['longitude'] as num?)?.toDouble(),
                accuracy: (data['accuracy'] as num?)?.toDouble(),
              );

              // Server confirmed! Update cached attendance with server canonical session ID and punch time
              await db.into(db.cachedAttendance).insertOnConflictUpdate(
                    CachedAttendanceCompanion.insert(
                      id: 'active_state_${mutation.workspaceId}',
                      workspaceId: mutation.workspaceId,
                      dutyState: punchRes.status == 'ON_DUTY' ? 'ON_DUTY' : 'NOT_STARTED',
                      activeSessionId: Value(punchRes.id),
                      punchInTime: Value(punchRes.punchInTime),
                      lastUpdated: Value(DateTime.now()),
                    ),
                  );

              // Cleanup local temporary selfie file after confirmed delivery
              if (localSelfiePath != null && mediaService != null) {
                await mediaService!.deleteLocalMediaFile(localSelfiePath);
              }
            } on DioException catch (dioErr) {
              final statusCode = dioErr.response?.statusCode;
              // If client error (4xx: rejection by business rules, invalid shift, geofence mismatch, etc.)
              if (statusCode != null && statusCode >= 400 && statusCode < 500 && statusCode != 408 && statusCode != 429) {
                // Roll back optimistic ON_DUTY state to prevent masquerading unverified punch as duty
                await db.into(db.cachedAttendance).insertOnConflictUpdate(
                      CachedAttendanceCompanion.insert(
                        id: 'active_state_${mutation.workspaceId}',
                        workspaceId: mutation.workspaceId,
                        dutyState: 'NOT_STARTED',
                        lastUpdated: Value(DateTime.now()),
                      ),
                    );
              }
              rethrow;
            }
            break;

          case 'PUNCH_OUT':
            await client.punchOut(
              idempotencyKey: mutation.idempotencyKey,
              note: data['note'] as String?,
            );
            await db.into(db.cachedAttendance).insertOnConflictUpdate(
                  CachedAttendanceCompanion.insert(
                    id: 'active_state_${mutation.workspaceId}',
                    workspaceId: mutation.workspaceId,
                    dutyState: 'OFF_DUTY',
                    lastUpdated: Value(DateTime.now()),
                  ),
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
            final taskId = data['taskId'] as String? ?? '';
            if (taskId.isNotEmpty) {
              await client.updateChecklistItem(
                taskId,
                mutation.entityId,
                isCompleted: data['isCompleted'] as bool,
              );
            }
            break;

          case 'VISIT_CHECK_IN':
            await client.checkInVisit(
              visitId: mutation.entityId,
              latitude: (data['latitude'] as num).toDouble(),
              longitude: (data['longitude'] as num).toDouble(),
              accuracy: (data['accuracy'] as num?)?.toDouble(),
              notes: data['notes'] as String?,
            );
            break;

          case 'VISIT_CHECK_OUT':
            await client.checkOutVisit(
              visitId: mutation.entityId,
              latitude: (data['latitude'] as num).toDouble(),
              longitude: (data['longitude'] as num).toDouble(),
              accuracy: (data['accuracy'] as num?)?.toDouble(),
              notes: data['notes'] as String?,
            );
            break;

          case 'CONFIRM_PROOF':
            String fileKey = data['fileKey'] as String;
            final localProofPath = data['localFilePath'] as String?;
            final isBinaryUploaded = data['isBinaryUploaded'] as bool? ?? true;

            // If proof photo was saved offline and binary not yet uploaded:
            if (!isBinaryUploaded && localProofPath != null && mediaService != null) {
              final localFile = File(localProofPath);
              if (await localFile.exists()) {
                final bytes = await localFile.readAsBytes();
                final uploadMeta = await mediaService!.requestTaskProofUploadUrl(
                  taskId: data['taskId'] as String,
                  visitId: data['visitId'] as String?,
                  proofType: data['proofType'] as String,
                  fileName: 'photo_proof.jpg',
                  mimeType: 'image/jpeg',
                  fileSizeBytes: bytes.length,
                );
                await mediaService!.uploadBinaryBytes(
                  uploadUrl: uploadMeta.uploadUrl,
                  bytes: bytes,
                  contentType: 'image/jpeg',
                );
                fileKey = uploadMeta.fileKey;
                data['fileKey'] = fileKey;
                data['isBinaryUploaded'] = true;

                // Update cached proof entry with durable fileKey
                await (db.update(db.cachedTaskProofs)..where((p) => p.id.equals(mutation.entityId))).write(
                  CachedTaskProofsCompanion(fileKey: Value(fileKey)),
                );

                await (db.update(db.outboxMutations)..where((m) => m.id.equals(mutation.id))).write(
                  OutboxMutationsCompanion(
                    payload: Value(jsonEncode(data)),
                    updatedAt: Value(DateTime.now()),
                  ),
                );
              }
            }

            await client.confirmMediaUpload(
              taskId: data['taskId'] as String,
              visitId: data['visitId'] as String?,
              proofType: data['proofType'] as String,
              fileKey: fileKey,
              signerName: data['signerName'] as String?,
              signerPhone: data['signerPhone'] as String?,
              watermarkMetadata: data['watermarkMetadata'] as Map<String, dynamic>?,
              notes: data['notes'] as String?,
            );

            // Cleanup local photo file after confirmed delivery
            if (localProofPath != null && mediaService != null) {
              await mediaService!.deleteLocalMediaFile(localProofPath);
            }
            break;

          case 'VERIFY_TASK':
            await client.verifyTask(
              taskId: data['taskId'] as String,
              action: data['action'] as String,
              notes: data['notes'] as String?,
            );
            break;
        }

        // Successfully acknowledged: remove from outbox
        await (db.delete(db.outboxMutations)..where((m) => m.id.equals(mutation.id))).go();
      } catch (err) {
        String errMsg = err.toString();
        if (err is DioException) {
          final resData = err.response?.data;
          if (resData is Map && resData['message'] != null) {
            errMsg = resData['message'].toString();
          } else if (err.message != null && err.message!.isNotEmpty) {
            errMsg = err.message!;
          }
        }
        // Record failure and retry count
        await (db.update(db.outboxMutations)..where((m) => m.id.equals(mutation.id))).write(
          OutboxMutationsCompanion(
            status: const Value('FAILED'),
            lastError: Value(errMsg),
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
                  customerId: Value(task.customerId),
                  customerName: Value(task.customerName),
                  siteId: Value(task.siteId),
                  siteName: Value(task.siteName),
                  requiresPhotoProof: Value(task.requiresPhotoProof),
                  requiresSignature: Value(task.requiresSignature),
                  verifierName: Value(task.verifierName),
                  verifiedAt: Value(task.verifiedAt),
                  verificationNotes: Value(task.verificationNotes),
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

  Future<void> syncDownVisits(String workspaceId) async {
    try {
      final res = await client.listVisits();
      await db.transaction(() async {
        for (final visit in res.visits) {
          await db.into(db.cachedVisits).insertOnConflictUpdate(
                CachedVisitsCompanion.insert(
                  id: visit.id,
                  workspaceId: visit.workspaceId,
                  customerId: visit.customerId,
                  customerName: Value(visit.customerName),
                  siteId: Value(visit.siteId),
                  siteName: Value(visit.siteName),
                  taskId: Value(visit.taskId),
                  userId: visit.userId,
                  status: visit.status,
                  scheduledAt: Value(visit.plannedAt),
                  checkInTime: Value(visit.checkInTime),
                  checkInLat: Value(visit.checkInLatitude),
                  checkInLng: Value(visit.checkInLongitude),
                  checkOutTime: Value(visit.checkOutTime),
                  checkOutLat: Value(visit.checkOutLatitude),
                  checkOutLng: Value(visit.checkOutLongitude),
                  durationMinutes: Value(visit.durationMinutes),
                  sequenceOrder: Value(visit.sequenceOrder),
                  routeDate: Value(visit.routeDate),
                  notes: Value(visit.notes),
                  createdAt: visit.createdAt,
                  updatedAt: visit.updatedAt,
                ),
              );
        }
      });
    } catch (_) {
      // Offline fallback
    }
  }

  Future<void> syncDownTaskProofs(String taskId) async {
    try {
      final res = await client.listTaskProofs(taskId: taskId);
      await db.transaction(() async {
        for (final proof in res.proofs) {
          await db.into(db.cachedTaskProofs).insertOnConflictUpdate(
                CachedTaskProofsCompanion.insert(
                  id: proof.id,
                  workspaceId: proof.workspaceId,
                  taskId: proof.taskId,
                  visitId: Value(proof.visitId),
                  userId: proof.userId,
                  proofType: proof.proofType,
                  fileKey: proof.fileKey,
                  fileUrl: Value(proof.fileUrl),
                  signerName: Value(proof.signerName),
                  signerPhone: Value(proof.signerPhone),
                  watermarkJson: Value(proof.watermarkMetadata != null ? jsonEncode(proof.watermarkMetadata) : null),
                  notes: Value(proof.notes),
                  createdAt: proof.createdAt,
                ),
              );
        }
      });
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

  Stream<OutboxMutation?> watchPendingAttendanceMutation(String workspaceId) {
    return (db.select(db.outboxMutations)
          ..where((m) => m.workspaceId.equals(workspaceId) & m.entityType.equals('ATTENDANCE'))
          ..orderBy([(m) => OrderingTerm.desc(m.createdAt)])
          ..limit(1))
        .watchSingleOrNull();
  }

  Stream<List<CachedVisit>> watchVisits(String workspaceId) {
    return (db.select(db.cachedVisits)
          ..where((v) => v.workspaceId.equals(workspaceId))
          ..orderBy([(v) => OrderingTerm.desc(v.createdAt)]))
        .watch();
  }

  Stream<List<CachedTaskProof>> watchTaskProofs(String taskId) {
    return (db.select(db.cachedTaskProofs)
          ..where((p) => p.taskId.equals(taskId))
          ..orderBy([(p) => OrderingTerm.desc(p.createdAt)]))
        .watch();
  }

  Stream<List<OutboxMutation>> watchPendingMutations() {
    return (db.select(db.outboxMutations)
          ..where((m) => m.status.equals('PENDING') | m.status.equals('SYNCING'))
          ..orderBy([(m) => OrderingTerm.asc(m.createdAt)]))
        .watch();
  }

  // =========================================================================
  // DURABLE OFFLINE GPS QUEUE & SYNCHRONIZATION
  // =========================================================================

  /// Persists a captured on-duty GPS fix into the local SQLite durable queue.
  Future<void> queueLocation({
    required String id,
    required String workspaceId,
    required String userId,
    String? sessionId,
    required double latitude,
    required double longitude,
    required double accuracy,
    double? speed,
    double? heading,
    double? altitude,
    double? batteryLevel,
    bool? isCharging,
    String? activityType,
    bool? isMoving,
    required DateTime recordedAt,
  }) async {
    await db.into(db.cachedLocations).insert(
          CachedLocationsCompanion.insert(
            id: id,
            workspaceId: workspaceId,
            userId: userId,
            sessionId: Value(sessionId),
            latitude: latitude,
            longitude: longitude,
            accuracy: accuracy,
            speed: Value(speed),
            heading: Value(heading),
            altitude: Value(altitude),
            batteryLevel: Value(batteryLevel),
            isCharging: Value(isCharging),
            activityType: Value(activityType),
            isMoving: Value(isMoving),
            recordedAt: recordedAt,
            status: const Value('PENDING'),
            attemptCount: const Value(0),
            createdAt: Value(DateTime.now()),
          ),
        );
  }

  /// Flushes pending GPS locations in batches from SQLite to the server ingestion endpoint.
  /// Strictly filters by authenticated workspaceId and userId to prevent cross-tenant/user data leakage.
  /// Implements lossless per-point acknowledgment semantics:
  /// - ONLY points acknowledged in response.acceptedIds are deleted.
  /// - Points in response.rejectedIds are updated to REJECTED with error reason (never deleted).
  /// - Points unacknowledged in response are returned to PENDING for retry.
  Future<int> flushPendingLocations({
    required String workspaceId,
    required String userId,
    int batchSize = 30,
  }) async {
    final pending = await (db.select(db.cachedLocations)
          ..where((l) =>
              l.workspaceId.equals(workspaceId) &
              l.userId.equals(userId) &
              (l.status.equals('PENDING') | l.status.equals('FAILED')))
          ..orderBy([(l) => OrderingTerm.asc(l.recordedAt)])
          ..limit(batchSize))
        .get();

    if (pending.isEmpty) return 0;

    final batch = pending.map((l) {
      return LocationPoint(
        id: l.id,
        recordedAt: l.recordedAt,
        latitude: l.latitude,
        longitude: l.longitude,
        accuracy: l.accuracy,
        speed: l.speed ?? 0.0,
        heading: l.heading ?? 0.0,
        batteryLevel: l.batteryLevel ?? 1.0,
        isCharging: l.isCharging ?? false,
        activityType: l.activityType ?? 'still',
        isMoving: l.isMoving ?? false,
      );
    }).toList();

    final ids = pending.map((l) => l.id).toList();

    await (db.update(db.cachedLocations)..where((l) => l.id.isIn(ids))).write(
      const CachedLocationsCompanion(
        status: Value('SYNCING'),
      ),
    );

    try {
      final response = await client.ingestLocationBreadcrumbs(batch);

      final acceptedSet = response.acceptedIds != null
          ? response.acceptedIds!.toSet()
          : (response.accepted == batch.length ? ids.toSet() : <String>{});
      final rejectedSet = response.rejectedIds?.toSet() ?? <String>{};

      // 1. Lossless per-point acknowledgment: delete ONLY server-accepted records
      if (acceptedSet.isNotEmpty) {
        await (db.delete(db.cachedLocations)..where((l) => l.id.isIn(acceptedSet))).go();
      }

      // 2. Never delete rejected records: mark them as REJECTED for auditability
      if (rejectedSet.isNotEmpty) {
        await (db.update(db.cachedLocations)..where((l) => l.id.isIn(rejectedSet))).write(
          CachedLocationsCompanion(
            status: const Value('REJECTED'),
            lastError: Value(response.reason ?? 'Server rejected point'),
          ),
        );
      }

      // 3. Unresolved / unacknowledged records remain safe: revert to PENDING for retry
      final unresolved = ids.where((id) => !acceptedSet.contains(id) && !rejectedSet.contains(id)).toList();
      if (unresolved.isNotEmpty) {
        await (db.update(db.cachedLocations)..where((l) => l.id.isIn(unresolved))).write(
          const CachedLocationsCompanion(
            status: Value('PENDING'),
          ),
        );
      }

      return acceptedSet.length;
    } catch (err) {
      // Offline fallback: mark as FAILED and increment attemptCount; NEVER delete records
      for (final l in pending) {
        await (db.update(db.cachedLocations)..where((row) => row.id.equals(l.id))).write(
          CachedLocationsCompanion(
            status: const Value('FAILED'),
            attemptCount: Value(l.attemptCount + 1),
            lastError: Value(err.toString()),
          ),
        );
      }
      return 0;
    }
  }

  /// Drains pending GPS locations across multiple bounded batches without collecting new off-duty points.
  /// Bounded to [maxBatches] (default 10) to prevent infinite loops during large queues.
  Future<int> drainPendingLocations({
    required String workspaceId,
    required String userId,
    int maxBatches = 10,
    int batchSize = 30,
  }) async {
    int totalSynced = 0;
    int batchesRun = 0;

    while (batchesRun < maxBatches) {
      final synced = await flushPendingLocations(
        workspaceId: workspaceId,
        userId: userId,
        batchSize: batchSize,
      );
      if (synced == 0) break;
      totalSynced += synced;
      batchesRun++;
    }

    return totalSynced;
  }

  Stream<List<CachedLocation>> watchPendingLocations({String? workspaceId, String? userId}) {
    final query = db.select(db.cachedLocations);
    if (workspaceId != null && userId != null) {
      query.where((l) =>
          l.workspaceId.equals(workspaceId) &
          l.userId.equals(userId) &
          (l.status.equals('PENDING') | l.status.equals('SYNCING')));
    } else if (workspaceId != null) {
      query.where((l) =>
          l.workspaceId.equals(workspaceId) &
          (l.status.equals('PENDING') | l.status.equals('SYNCING')));
    } else {
      query.where((l) => l.status.equals('PENDING') | l.status.equals('SYNCING'));
    }
    return (query..orderBy([(l) => OrderingTerm.asc(l.recordedAt)])).watch();
  }
}

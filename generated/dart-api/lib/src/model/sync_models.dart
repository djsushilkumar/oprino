// GENERATED CODE - DO NOT MODIFY BY HAND
// Generated from OpenAPI 3.1 specification by @oprino/contracts

class SyncMutationEnvelope {
  final String mutationId;
  final String entityType;
  final String entityId;
  final String mutationType;
  final Map<String, dynamic> payload;
  final String idempotencyKey;
  final DateTime clientTimestamp;

  const SyncMutationEnvelope({
    required this.mutationId,
    required this.entityType,
    required this.entityId,
    required this.mutationType,
    required this.payload,
    required this.idempotencyKey,
    required this.clientTimestamp,
  });

  factory SyncMutationEnvelope.fromJson(Map<String, dynamic> json) {
    return SyncMutationEnvelope(
      mutationId: json['mutationId'] as String,
      entityType: json['entityType'] as String,
      entityId: json['entityId'] as String,
      mutationType: json['mutationType'] as String,
      payload: json['payload'] as Map<String, dynamic>,
      idempotencyKey: json['idempotencyKey'] as String,
      clientTimestamp: DateTime.parse(json['clientTimestamp'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'mutationId': mutationId,
        'entityType': entityType,
        'entityId': entityId,
        'mutationType': mutationType,
        'payload': payload,
        'idempotencyKey': idempotencyKey,
        'clientTimestamp': clientTimestamp.toIso8601String(),
      };
}

class SyncProcessedResult {
  final String mutationId;
  final String status;
  final String? conflictAction;
  final String? error;

  const SyncProcessedResult({
    required this.mutationId,
    required this.status,
    this.conflictAction,
    this.error,
  });

  factory SyncProcessedResult.fromJson(Map<String, dynamic> json) {
    return SyncProcessedResult(
      mutationId: json['mutationId'] as String,
      status: json['status'] as String,
      conflictAction: json['conflictAction'] as String?,
      error: json['error'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'mutationId': mutationId,
        'status': status,
        if (conflictAction != null) 'conflictAction': conflictAction,
        if (error != null) 'error': error,
      };
}

class SyncBatchResponse {
  final int processedCount;
  final int appliedCount;
  final int conflictCount;
  final int duplicateCount;
  final int errorCount;
  final List<SyncProcessedResult> results;

  const SyncBatchResponse({
    required this.processedCount,
    required this.appliedCount,
    required this.conflictCount,
    required this.duplicateCount,
    required this.errorCount,
    required this.results,
  });

  factory SyncBatchResponse.fromJson(Map<String, dynamic> json) {
    return SyncBatchResponse(
      processedCount: json['processedCount'] as int,
      appliedCount: json['appliedCount'] as int,
      conflictCount: json['conflictCount'] as int,
      duplicateCount: json['duplicateCount'] as int,
      errorCount: json['errorCount'] as int,
      results: (json['results'] as List<dynamic>)
          .map((e) => SyncProcessedResult.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() => {
        'processedCount': processedCount,
        'appliedCount': appliedCount,
        'conflictCount': conflictCount,
        'duplicateCount': duplicateCount,
        'errorCount': errorCount,
        'results': results.map((r) => r.toJson()).toList(),
      };
}

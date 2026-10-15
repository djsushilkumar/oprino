// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'database.dart';

// ignore_for_file: type=lint
class $OutboxMutationsTable extends OutboxMutations
    with TableInfo<$OutboxMutationsTable, OutboxMutation> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $OutboxMutationsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _workspaceIdMeta =
      const VerificationMeta('workspaceId');
  @override
  late final GeneratedColumn<String> workspaceId = GeneratedColumn<String>(
      'workspace_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _entityTypeMeta =
      const VerificationMeta('entityType');
  @override
  late final GeneratedColumn<String> entityType = GeneratedColumn<String>(
      'entity_type', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _entityIdMeta =
      const VerificationMeta('entityId');
  @override
  late final GeneratedColumn<String> entityId = GeneratedColumn<String>(
      'entity_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _mutationTypeMeta =
      const VerificationMeta('mutationType');
  @override
  late final GeneratedColumn<String> mutationType = GeneratedColumn<String>(
      'mutation_type', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _payloadMeta =
      const VerificationMeta('payload');
  @override
  late final GeneratedColumn<String> payload = GeneratedColumn<String>(
      'payload', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _idempotencyKeyMeta =
      const VerificationMeta('idempotencyKey');
  @override
  late final GeneratedColumn<String> idempotencyKey = GeneratedColumn<String>(
      'idempotency_key', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: true,
      defaultConstraints: GeneratedColumn.constraintIsAlways('UNIQUE'));
  static const VerificationMeta _attemptCountMeta =
      const VerificationMeta('attemptCount');
  @override
  late final GeneratedColumn<int> attemptCount = GeneratedColumn<int>(
      'attempt_count', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
      'status', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant('PENDING'));
  static const VerificationMeta _lastErrorMeta =
      const VerificationMeta('lastError');
  @override
  late final GeneratedColumn<String> lastError = GeneratedColumn<String>(
      'last_error', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _createdAtMeta =
      const VerificationMeta('createdAt');
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
      'created_at', aliasedName, false,
      type: DriftSqlType.dateTime,
      requiredDuringInsert: false,
      defaultValue: currentDateAndTime);
  static const VerificationMeta _updatedAtMeta =
      const VerificationMeta('updatedAt');
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
      'updated_at', aliasedName, false,
      type: DriftSqlType.dateTime,
      requiredDuringInsert: false,
      defaultValue: currentDateAndTime);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        workspaceId,
        entityType,
        entityId,
        mutationType,
        payload,
        idempotencyKey,
        attemptCount,
        status,
        lastError,
        createdAt,
        updatedAt
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'outbox_mutations';
  @override
  VerificationContext validateIntegrity(Insertable<OutboxMutation> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('workspace_id')) {
      context.handle(
          _workspaceIdMeta,
          workspaceId.isAcceptableOrUnknown(
              data['workspace_id']!, _workspaceIdMeta));
    } else if (isInserting) {
      context.missing(_workspaceIdMeta);
    }
    if (data.containsKey('entity_type')) {
      context.handle(
          _entityTypeMeta,
          entityType.isAcceptableOrUnknown(
              data['entity_type']!, _entityTypeMeta));
    } else if (isInserting) {
      context.missing(_entityTypeMeta);
    }
    if (data.containsKey('entity_id')) {
      context.handle(_entityIdMeta,
          entityId.isAcceptableOrUnknown(data['entity_id']!, _entityIdMeta));
    } else if (isInserting) {
      context.missing(_entityIdMeta);
    }
    if (data.containsKey('mutation_type')) {
      context.handle(
          _mutationTypeMeta,
          mutationType.isAcceptableOrUnknown(
              data['mutation_type']!, _mutationTypeMeta));
    } else if (isInserting) {
      context.missing(_mutationTypeMeta);
    }
    if (data.containsKey('payload')) {
      context.handle(_payloadMeta,
          payload.isAcceptableOrUnknown(data['payload']!, _payloadMeta));
    } else if (isInserting) {
      context.missing(_payloadMeta);
    }
    if (data.containsKey('idempotency_key')) {
      context.handle(
          _idempotencyKeyMeta,
          idempotencyKey.isAcceptableOrUnknown(
              data['idempotency_key']!, _idempotencyKeyMeta));
    } else if (isInserting) {
      context.missing(_idempotencyKeyMeta);
    }
    if (data.containsKey('attempt_count')) {
      context.handle(
          _attemptCountMeta,
          attemptCount.isAcceptableOrUnknown(
              data['attempt_count']!, _attemptCountMeta));
    }
    if (data.containsKey('status')) {
      context.handle(_statusMeta,
          status.isAcceptableOrUnknown(data['status']!, _statusMeta));
    }
    if (data.containsKey('last_error')) {
      context.handle(_lastErrorMeta,
          lastError.isAcceptableOrUnknown(data['last_error']!, _lastErrorMeta));
    }
    if (data.containsKey('created_at')) {
      context.handle(_createdAtMeta,
          createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta));
    }
    if (data.containsKey('updated_at')) {
      context.handle(_updatedAtMeta,
          updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  OutboxMutation map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return OutboxMutation(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      workspaceId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}workspace_id'])!,
      entityType: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}entity_type'])!,
      entityId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}entity_id'])!,
      mutationType: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}mutation_type'])!,
      payload: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}payload'])!,
      idempotencyKey: attachedDatabase.typeMapping.read(
          DriftSqlType.string, data['${effectivePrefix}idempotency_key'])!,
      attemptCount: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}attempt_count'])!,
      status: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}status'])!,
      lastError: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}last_error']),
      createdAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}created_at'])!,
      updatedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}updated_at'])!,
    );
  }

  @override
  $OutboxMutationsTable createAlias(String alias) {
    return $OutboxMutationsTable(attachedDatabase, alias);
  }
}

class OutboxMutation extends DataClass implements Insertable<OutboxMutation> {
  final String id;
  final String workspaceId;
  final String entityType;
  final String entityId;
  final String mutationType;
  final String payload;
  final String idempotencyKey;
  final int attemptCount;
  final String status;
  final String? lastError;
  final DateTime createdAt;
  final DateTime updatedAt;
  const OutboxMutation(
      {required this.id,
      required this.workspaceId,
      required this.entityType,
      required this.entityId,
      required this.mutationType,
      required this.payload,
      required this.idempotencyKey,
      required this.attemptCount,
      required this.status,
      this.lastError,
      required this.createdAt,
      required this.updatedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['workspace_id'] = Variable<String>(workspaceId);
    map['entity_type'] = Variable<String>(entityType);
    map['entity_id'] = Variable<String>(entityId);
    map['mutation_type'] = Variable<String>(mutationType);
    map['payload'] = Variable<String>(payload);
    map['idempotency_key'] = Variable<String>(idempotencyKey);
    map['attempt_count'] = Variable<int>(attemptCount);
    map['status'] = Variable<String>(status);
    if (!nullToAbsent || lastError != null) {
      map['last_error'] = Variable<String>(lastError);
    }
    map['created_at'] = Variable<DateTime>(createdAt);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    return map;
  }

  OutboxMutationsCompanion toCompanion(bool nullToAbsent) {
    return OutboxMutationsCompanion(
      id: Value(id),
      workspaceId: Value(workspaceId),
      entityType: Value(entityType),
      entityId: Value(entityId),
      mutationType: Value(mutationType),
      payload: Value(payload),
      idempotencyKey: Value(idempotencyKey),
      attemptCount: Value(attemptCount),
      status: Value(status),
      lastError: lastError == null && nullToAbsent
          ? const Value.absent()
          : Value(lastError),
      createdAt: Value(createdAt),
      updatedAt: Value(updatedAt),
    );
  }

  factory OutboxMutation.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return OutboxMutation(
      id: serializer.fromJson<String>(json['id']),
      workspaceId: serializer.fromJson<String>(json['workspaceId']),
      entityType: serializer.fromJson<String>(json['entityType']),
      entityId: serializer.fromJson<String>(json['entityId']),
      mutationType: serializer.fromJson<String>(json['mutationType']),
      payload: serializer.fromJson<String>(json['payload']),
      idempotencyKey: serializer.fromJson<String>(json['idempotencyKey']),
      attemptCount: serializer.fromJson<int>(json['attemptCount']),
      status: serializer.fromJson<String>(json['status']),
      lastError: serializer.fromJson<String?>(json['lastError']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'workspaceId': serializer.toJson<String>(workspaceId),
      'entityType': serializer.toJson<String>(entityType),
      'entityId': serializer.toJson<String>(entityId),
      'mutationType': serializer.toJson<String>(mutationType),
      'payload': serializer.toJson<String>(payload),
      'idempotencyKey': serializer.toJson<String>(idempotencyKey),
      'attemptCount': serializer.toJson<int>(attemptCount),
      'status': serializer.toJson<String>(status),
      'lastError': serializer.toJson<String?>(lastError),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
    };
  }

  OutboxMutation copyWith(
          {String? id,
          String? workspaceId,
          String? entityType,
          String? entityId,
          String? mutationType,
          String? payload,
          String? idempotencyKey,
          int? attemptCount,
          String? status,
          Value<String?> lastError = const Value.absent(),
          DateTime? createdAt,
          DateTime? updatedAt}) =>
      OutboxMutation(
        id: id ?? this.id,
        workspaceId: workspaceId ?? this.workspaceId,
        entityType: entityType ?? this.entityType,
        entityId: entityId ?? this.entityId,
        mutationType: mutationType ?? this.mutationType,
        payload: payload ?? this.payload,
        idempotencyKey: idempotencyKey ?? this.idempotencyKey,
        attemptCount: attemptCount ?? this.attemptCount,
        status: status ?? this.status,
        lastError: lastError.present ? lastError.value : this.lastError,
        createdAt: createdAt ?? this.createdAt,
        updatedAt: updatedAt ?? this.updatedAt,
      );
  OutboxMutation copyWithCompanion(OutboxMutationsCompanion data) {
    return OutboxMutation(
      id: data.id.present ? data.id.value : this.id,
      workspaceId:
          data.workspaceId.present ? data.workspaceId.value : this.workspaceId,
      entityType:
          data.entityType.present ? data.entityType.value : this.entityType,
      entityId: data.entityId.present ? data.entityId.value : this.entityId,
      mutationType: data.mutationType.present
          ? data.mutationType.value
          : this.mutationType,
      payload: data.payload.present ? data.payload.value : this.payload,
      idempotencyKey: data.idempotencyKey.present
          ? data.idempotencyKey.value
          : this.idempotencyKey,
      attemptCount: data.attemptCount.present
          ? data.attemptCount.value
          : this.attemptCount,
      status: data.status.present ? data.status.value : this.status,
      lastError: data.lastError.present ? data.lastError.value : this.lastError,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('OutboxMutation(')
          ..write('id: $id, ')
          ..write('workspaceId: $workspaceId, ')
          ..write('entityType: $entityType, ')
          ..write('entityId: $entityId, ')
          ..write('mutationType: $mutationType, ')
          ..write('payload: $payload, ')
          ..write('idempotencyKey: $idempotencyKey, ')
          ..write('attemptCount: $attemptCount, ')
          ..write('status: $status, ')
          ..write('lastError: $lastError, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
      id,
      workspaceId,
      entityType,
      entityId,
      mutationType,
      payload,
      idempotencyKey,
      attemptCount,
      status,
      lastError,
      createdAt,
      updatedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is OutboxMutation &&
          other.id == this.id &&
          other.workspaceId == this.workspaceId &&
          other.entityType == this.entityType &&
          other.entityId == this.entityId &&
          other.mutationType == this.mutationType &&
          other.payload == this.payload &&
          other.idempotencyKey == this.idempotencyKey &&
          other.attemptCount == this.attemptCount &&
          other.status == this.status &&
          other.lastError == this.lastError &&
          other.createdAt == this.createdAt &&
          other.updatedAt == this.updatedAt);
}

class OutboxMutationsCompanion extends UpdateCompanion<OutboxMutation> {
  final Value<String> id;
  final Value<String> workspaceId;
  final Value<String> entityType;
  final Value<String> entityId;
  final Value<String> mutationType;
  final Value<String> payload;
  final Value<String> idempotencyKey;
  final Value<int> attemptCount;
  final Value<String> status;
  final Value<String?> lastError;
  final Value<DateTime> createdAt;
  final Value<DateTime> updatedAt;
  final Value<int> rowid;
  const OutboxMutationsCompanion({
    this.id = const Value.absent(),
    this.workspaceId = const Value.absent(),
    this.entityType = const Value.absent(),
    this.entityId = const Value.absent(),
    this.mutationType = const Value.absent(),
    this.payload = const Value.absent(),
    this.idempotencyKey = const Value.absent(),
    this.attemptCount = const Value.absent(),
    this.status = const Value.absent(),
    this.lastError = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  OutboxMutationsCompanion.insert({
    required String id,
    required String workspaceId,
    required String entityType,
    required String entityId,
    required String mutationType,
    required String payload,
    required String idempotencyKey,
    this.attemptCount = const Value.absent(),
    this.status = const Value.absent(),
    this.lastError = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        workspaceId = Value(workspaceId),
        entityType = Value(entityType),
        entityId = Value(entityId),
        mutationType = Value(mutationType),
        payload = Value(payload),
        idempotencyKey = Value(idempotencyKey);
  static Insertable<OutboxMutation> custom({
    Expression<String>? id,
    Expression<String>? workspaceId,
    Expression<String>? entityType,
    Expression<String>? entityId,
    Expression<String>? mutationType,
    Expression<String>? payload,
    Expression<String>? idempotencyKey,
    Expression<int>? attemptCount,
    Expression<String>? status,
    Expression<String>? lastError,
    Expression<DateTime>? createdAt,
    Expression<DateTime>? updatedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (workspaceId != null) 'workspace_id': workspaceId,
      if (entityType != null) 'entity_type': entityType,
      if (entityId != null) 'entity_id': entityId,
      if (mutationType != null) 'mutation_type': mutationType,
      if (payload != null) 'payload': payload,
      if (idempotencyKey != null) 'idempotency_key': idempotencyKey,
      if (attemptCount != null) 'attempt_count': attemptCount,
      if (status != null) 'status': status,
      if (lastError != null) 'last_error': lastError,
      if (createdAt != null) 'created_at': createdAt,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  OutboxMutationsCompanion copyWith(
      {Value<String>? id,
      Value<String>? workspaceId,
      Value<String>? entityType,
      Value<String>? entityId,
      Value<String>? mutationType,
      Value<String>? payload,
      Value<String>? idempotencyKey,
      Value<int>? attemptCount,
      Value<String>? status,
      Value<String?>? lastError,
      Value<DateTime>? createdAt,
      Value<DateTime>? updatedAt,
      Value<int>? rowid}) {
    return OutboxMutationsCompanion(
      id: id ?? this.id,
      workspaceId: workspaceId ?? this.workspaceId,
      entityType: entityType ?? this.entityType,
      entityId: entityId ?? this.entityId,
      mutationType: mutationType ?? this.mutationType,
      payload: payload ?? this.payload,
      idempotencyKey: idempotencyKey ?? this.idempotencyKey,
      attemptCount: attemptCount ?? this.attemptCount,
      status: status ?? this.status,
      lastError: lastError ?? this.lastError,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (workspaceId.present) {
      map['workspace_id'] = Variable<String>(workspaceId.value);
    }
    if (entityType.present) {
      map['entity_type'] = Variable<String>(entityType.value);
    }
    if (entityId.present) {
      map['entity_id'] = Variable<String>(entityId.value);
    }
    if (mutationType.present) {
      map['mutation_type'] = Variable<String>(mutationType.value);
    }
    if (payload.present) {
      map['payload'] = Variable<String>(payload.value);
    }
    if (idempotencyKey.present) {
      map['idempotency_key'] = Variable<String>(idempotencyKey.value);
    }
    if (attemptCount.present) {
      map['attempt_count'] = Variable<int>(attemptCount.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (lastError.present) {
      map['last_error'] = Variable<String>(lastError.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('OutboxMutationsCompanion(')
          ..write('id: $id, ')
          ..write('workspaceId: $workspaceId, ')
          ..write('entityType: $entityType, ')
          ..write('entityId: $entityId, ')
          ..write('mutationType: $mutationType, ')
          ..write('payload: $payload, ')
          ..write('idempotencyKey: $idempotencyKey, ')
          ..write('attemptCount: $attemptCount, ')
          ..write('status: $status, ')
          ..write('lastError: $lastError, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $CachedTasksTable extends CachedTasks
    with TableInfo<$CachedTasksTable, CachedTask> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $CachedTasksTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _workspaceIdMeta =
      const VerificationMeta('workspaceId');
  @override
  late final GeneratedColumn<String> workspaceId = GeneratedColumn<String>(
      'workspace_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _titleMeta = const VerificationMeta('title');
  @override
  late final GeneratedColumn<String> title = GeneratedColumn<String>(
      'title', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _descriptionMeta =
      const VerificationMeta('description');
  @override
  late final GeneratedColumn<String> description = GeneratedColumn<String>(
      'description', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
      'status', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _simplifiedStatusMeta =
      const VerificationMeta('simplifiedStatus');
  @override
  late final GeneratedColumn<String> simplifiedStatus = GeneratedColumn<String>(
      'simplified_status', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _priorityMeta =
      const VerificationMeta('priority');
  @override
  late final GeneratedColumn<String> priority = GeneratedColumn<String>(
      'priority', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _dueAtMeta = const VerificationMeta('dueAt');
  @override
  late final GeneratedColumn<DateTime> dueAt = GeneratedColumn<DateTime>(
      'due_at', aliasedName, true,
      type: DriftSqlType.dateTime, requiredDuringInsert: false);
  static const VerificationMeta _customerIdMeta =
      const VerificationMeta('customerId');
  @override
  late final GeneratedColumn<String> customerId = GeneratedColumn<String>(
      'customer_id', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _customerNameMeta =
      const VerificationMeta('customerName');
  @override
  late final GeneratedColumn<String> customerName = GeneratedColumn<String>(
      'customer_name', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _siteIdMeta = const VerificationMeta('siteId');
  @override
  late final GeneratedColumn<String> siteId = GeneratedColumn<String>(
      'site_id', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _siteNameMeta =
      const VerificationMeta('siteName');
  @override
  late final GeneratedColumn<String> siteName = GeneratedColumn<String>(
      'site_name', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _requiresPhotoProofMeta =
      const VerificationMeta('requiresPhotoProof');
  @override
  late final GeneratedColumn<bool> requiresPhotoProof = GeneratedColumn<bool>(
      'requires_photo_proof', aliasedName, false,
      type: DriftSqlType.bool,
      requiredDuringInsert: false,
      defaultConstraints: GeneratedColumn.constraintIsAlways(
          'CHECK ("requires_photo_proof" IN (0, 1))'),
      defaultValue: const Constant(false));
  static const VerificationMeta _requiresSignatureMeta =
      const VerificationMeta('requiresSignature');
  @override
  late final GeneratedColumn<bool> requiresSignature = GeneratedColumn<bool>(
      'requires_signature', aliasedName, false,
      type: DriftSqlType.bool,
      requiredDuringInsert: false,
      defaultConstraints: GeneratedColumn.constraintIsAlways(
          'CHECK ("requires_signature" IN (0, 1))'),
      defaultValue: const Constant(false));
  static const VerificationMeta _verifierNameMeta =
      const VerificationMeta('verifierName');
  @override
  late final GeneratedColumn<String> verifierName = GeneratedColumn<String>(
      'verifier_name', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _verifiedAtMeta =
      const VerificationMeta('verifiedAt');
  @override
  late final GeneratedColumn<DateTime> verifiedAt = GeneratedColumn<DateTime>(
      'verified_at', aliasedName, true,
      type: DriftSqlType.dateTime, requiredDuringInsert: false);
  static const VerificationMeta _verificationNotesMeta =
      const VerificationMeta('verificationNotes');
  @override
  late final GeneratedColumn<String> verificationNotes =
      GeneratedColumn<String>('verification_notes', aliasedName, true,
          type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _versionMeta =
      const VerificationMeta('version');
  @override
  late final GeneratedColumn<int> version = GeneratedColumn<int>(
      'version', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const Constant(1));
  static const VerificationMeta _createdAtMeta =
      const VerificationMeta('createdAt');
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
      'created_at', aliasedName, false,
      type: DriftSqlType.dateTime, requiredDuringInsert: true);
  static const VerificationMeta _updatedAtMeta =
      const VerificationMeta('updatedAt');
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
      'updated_at', aliasedName, false,
      type: DriftSqlType.dateTime, requiredDuringInsert: true);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        workspaceId,
        title,
        description,
        status,
        simplifiedStatus,
        priority,
        dueAt,
        customerId,
        customerName,
        siteId,
        siteName,
        requiresPhotoProof,
        requiresSignature,
        verifierName,
        verifiedAt,
        verificationNotes,
        version,
        createdAt,
        updatedAt
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'cached_tasks';
  @override
  VerificationContext validateIntegrity(Insertable<CachedTask> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('workspace_id')) {
      context.handle(
          _workspaceIdMeta,
          workspaceId.isAcceptableOrUnknown(
              data['workspace_id']!, _workspaceIdMeta));
    } else if (isInserting) {
      context.missing(_workspaceIdMeta);
    }
    if (data.containsKey('title')) {
      context.handle(
          _titleMeta, title.isAcceptableOrUnknown(data['title']!, _titleMeta));
    } else if (isInserting) {
      context.missing(_titleMeta);
    }
    if (data.containsKey('description')) {
      context.handle(
          _descriptionMeta,
          description.isAcceptableOrUnknown(
              data['description']!, _descriptionMeta));
    }
    if (data.containsKey('status')) {
      context.handle(_statusMeta,
          status.isAcceptableOrUnknown(data['status']!, _statusMeta));
    } else if (isInserting) {
      context.missing(_statusMeta);
    }
    if (data.containsKey('simplified_status')) {
      context.handle(
          _simplifiedStatusMeta,
          simplifiedStatus.isAcceptableOrUnknown(
              data['simplified_status']!, _simplifiedStatusMeta));
    } else if (isInserting) {
      context.missing(_simplifiedStatusMeta);
    }
    if (data.containsKey('priority')) {
      context.handle(_priorityMeta,
          priority.isAcceptableOrUnknown(data['priority']!, _priorityMeta));
    } else if (isInserting) {
      context.missing(_priorityMeta);
    }
    if (data.containsKey('due_at')) {
      context.handle(
          _dueAtMeta, dueAt.isAcceptableOrUnknown(data['due_at']!, _dueAtMeta));
    }
    if (data.containsKey('customer_id')) {
      context.handle(
          _customerIdMeta,
          customerId.isAcceptableOrUnknown(
              data['customer_id']!, _customerIdMeta));
    }
    if (data.containsKey('customer_name')) {
      context.handle(
          _customerNameMeta,
          customerName.isAcceptableOrUnknown(
              data['customer_name']!, _customerNameMeta));
    }
    if (data.containsKey('site_id')) {
      context.handle(_siteIdMeta,
          siteId.isAcceptableOrUnknown(data['site_id']!, _siteIdMeta));
    }
    if (data.containsKey('site_name')) {
      context.handle(_siteNameMeta,
          siteName.isAcceptableOrUnknown(data['site_name']!, _siteNameMeta));
    }
    if (data.containsKey('requires_photo_proof')) {
      context.handle(
          _requiresPhotoProofMeta,
          requiresPhotoProof.isAcceptableOrUnknown(
              data['requires_photo_proof']!, _requiresPhotoProofMeta));
    }
    if (data.containsKey('requires_signature')) {
      context.handle(
          _requiresSignatureMeta,
          requiresSignature.isAcceptableOrUnknown(
              data['requires_signature']!, _requiresSignatureMeta));
    }
    if (data.containsKey('verifier_name')) {
      context.handle(
          _verifierNameMeta,
          verifierName.isAcceptableOrUnknown(
              data['verifier_name']!, _verifierNameMeta));
    }
    if (data.containsKey('verified_at')) {
      context.handle(
          _verifiedAtMeta,
          verifiedAt.isAcceptableOrUnknown(
              data['verified_at']!, _verifiedAtMeta));
    }
    if (data.containsKey('verification_notes')) {
      context.handle(
          _verificationNotesMeta,
          verificationNotes.isAcceptableOrUnknown(
              data['verification_notes']!, _verificationNotesMeta));
    }
    if (data.containsKey('version')) {
      context.handle(_versionMeta,
          version.isAcceptableOrUnknown(data['version']!, _versionMeta));
    }
    if (data.containsKey('created_at')) {
      context.handle(_createdAtMeta,
          createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta));
    } else if (isInserting) {
      context.missing(_createdAtMeta);
    }
    if (data.containsKey('updated_at')) {
      context.handle(_updatedAtMeta,
          updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta));
    } else if (isInserting) {
      context.missing(_updatedAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  CachedTask map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return CachedTask(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      workspaceId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}workspace_id'])!,
      title: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}title'])!,
      description: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}description']),
      status: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}status'])!,
      simplifiedStatus: attachedDatabase.typeMapping.read(
          DriftSqlType.string, data['${effectivePrefix}simplified_status'])!,
      priority: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}priority'])!,
      dueAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}due_at']),
      customerId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}customer_id']),
      customerName: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}customer_name']),
      siteId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}site_id']),
      siteName: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}site_name']),
      requiresPhotoProof: attachedDatabase.typeMapping.read(
          DriftSqlType.bool, data['${effectivePrefix}requires_photo_proof'])!,
      requiresSignature: attachedDatabase.typeMapping.read(
          DriftSqlType.bool, data['${effectivePrefix}requires_signature'])!,
      verifierName: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}verifier_name']),
      verifiedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}verified_at']),
      verificationNotes: attachedDatabase.typeMapping.read(
          DriftSqlType.string, data['${effectivePrefix}verification_notes']),
      version: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}version'])!,
      createdAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}created_at'])!,
      updatedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}updated_at'])!,
    );
  }

  @override
  $CachedTasksTable createAlias(String alias) {
    return $CachedTasksTable(attachedDatabase, alias);
  }
}

class CachedTask extends DataClass implements Insertable<CachedTask> {
  final String id;
  final String workspaceId;
  final String title;
  final String? description;
  final String status;
  final String simplifiedStatus;
  final String priority;
  final DateTime? dueAt;
  final String? customerId;
  final String? customerName;
  final String? siteId;
  final String? siteName;
  final bool requiresPhotoProof;
  final bool requiresSignature;
  final String? verifierName;
  final DateTime? verifiedAt;
  final String? verificationNotes;
  final int version;
  final DateTime createdAt;
  final DateTime updatedAt;
  const CachedTask(
      {required this.id,
      required this.workspaceId,
      required this.title,
      this.description,
      required this.status,
      required this.simplifiedStatus,
      required this.priority,
      this.dueAt,
      this.customerId,
      this.customerName,
      this.siteId,
      this.siteName,
      required this.requiresPhotoProof,
      required this.requiresSignature,
      this.verifierName,
      this.verifiedAt,
      this.verificationNotes,
      required this.version,
      required this.createdAt,
      required this.updatedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['workspace_id'] = Variable<String>(workspaceId);
    map['title'] = Variable<String>(title);
    if (!nullToAbsent || description != null) {
      map['description'] = Variable<String>(description);
    }
    map['status'] = Variable<String>(status);
    map['simplified_status'] = Variable<String>(simplifiedStatus);
    map['priority'] = Variable<String>(priority);
    if (!nullToAbsent || dueAt != null) {
      map['due_at'] = Variable<DateTime>(dueAt);
    }
    if (!nullToAbsent || customerId != null) {
      map['customer_id'] = Variable<String>(customerId);
    }
    if (!nullToAbsent || customerName != null) {
      map['customer_name'] = Variable<String>(customerName);
    }
    if (!nullToAbsent || siteId != null) {
      map['site_id'] = Variable<String>(siteId);
    }
    if (!nullToAbsent || siteName != null) {
      map['site_name'] = Variable<String>(siteName);
    }
    map['requires_photo_proof'] = Variable<bool>(requiresPhotoProof);
    map['requires_signature'] = Variable<bool>(requiresSignature);
    if (!nullToAbsent || verifierName != null) {
      map['verifier_name'] = Variable<String>(verifierName);
    }
    if (!nullToAbsent || verifiedAt != null) {
      map['verified_at'] = Variable<DateTime>(verifiedAt);
    }
    if (!nullToAbsent || verificationNotes != null) {
      map['verification_notes'] = Variable<String>(verificationNotes);
    }
    map['version'] = Variable<int>(version);
    map['created_at'] = Variable<DateTime>(createdAt);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    return map;
  }

  CachedTasksCompanion toCompanion(bool nullToAbsent) {
    return CachedTasksCompanion(
      id: Value(id),
      workspaceId: Value(workspaceId),
      title: Value(title),
      description: description == null && nullToAbsent
          ? const Value.absent()
          : Value(description),
      status: Value(status),
      simplifiedStatus: Value(simplifiedStatus),
      priority: Value(priority),
      dueAt:
          dueAt == null && nullToAbsent ? const Value.absent() : Value(dueAt),
      customerId: customerId == null && nullToAbsent
          ? const Value.absent()
          : Value(customerId),
      customerName: customerName == null && nullToAbsent
          ? const Value.absent()
          : Value(customerName),
      siteId:
          siteId == null && nullToAbsent ? const Value.absent() : Value(siteId),
      siteName: siteName == null && nullToAbsent
          ? const Value.absent()
          : Value(siteName),
      requiresPhotoProof: Value(requiresPhotoProof),
      requiresSignature: Value(requiresSignature),
      verifierName: verifierName == null && nullToAbsent
          ? const Value.absent()
          : Value(verifierName),
      verifiedAt: verifiedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(verifiedAt),
      verificationNotes: verificationNotes == null && nullToAbsent
          ? const Value.absent()
          : Value(verificationNotes),
      version: Value(version),
      createdAt: Value(createdAt),
      updatedAt: Value(updatedAt),
    );
  }

  factory CachedTask.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return CachedTask(
      id: serializer.fromJson<String>(json['id']),
      workspaceId: serializer.fromJson<String>(json['workspaceId']),
      title: serializer.fromJson<String>(json['title']),
      description: serializer.fromJson<String?>(json['description']),
      status: serializer.fromJson<String>(json['status']),
      simplifiedStatus: serializer.fromJson<String>(json['simplifiedStatus']),
      priority: serializer.fromJson<String>(json['priority']),
      dueAt: serializer.fromJson<DateTime?>(json['dueAt']),
      customerId: serializer.fromJson<String?>(json['customerId']),
      customerName: serializer.fromJson<String?>(json['customerName']),
      siteId: serializer.fromJson<String?>(json['siteId']),
      siteName: serializer.fromJson<String?>(json['siteName']),
      requiresPhotoProof: serializer.fromJson<bool>(json['requiresPhotoProof']),
      requiresSignature: serializer.fromJson<bool>(json['requiresSignature']),
      verifierName: serializer.fromJson<String?>(json['verifierName']),
      verifiedAt: serializer.fromJson<DateTime?>(json['verifiedAt']),
      verificationNotes:
          serializer.fromJson<String?>(json['verificationNotes']),
      version: serializer.fromJson<int>(json['version']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'workspaceId': serializer.toJson<String>(workspaceId),
      'title': serializer.toJson<String>(title),
      'description': serializer.toJson<String?>(description),
      'status': serializer.toJson<String>(status),
      'simplifiedStatus': serializer.toJson<String>(simplifiedStatus),
      'priority': serializer.toJson<String>(priority),
      'dueAt': serializer.toJson<DateTime?>(dueAt),
      'customerId': serializer.toJson<String?>(customerId),
      'customerName': serializer.toJson<String?>(customerName),
      'siteId': serializer.toJson<String?>(siteId),
      'siteName': serializer.toJson<String?>(siteName),
      'requiresPhotoProof': serializer.toJson<bool>(requiresPhotoProof),
      'requiresSignature': serializer.toJson<bool>(requiresSignature),
      'verifierName': serializer.toJson<String?>(verifierName),
      'verifiedAt': serializer.toJson<DateTime?>(verifiedAt),
      'verificationNotes': serializer.toJson<String?>(verificationNotes),
      'version': serializer.toJson<int>(version),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
    };
  }

  CachedTask copyWith(
          {String? id,
          String? workspaceId,
          String? title,
          Value<String?> description = const Value.absent(),
          String? status,
          String? simplifiedStatus,
          String? priority,
          Value<DateTime?> dueAt = const Value.absent(),
          Value<String?> customerId = const Value.absent(),
          Value<String?> customerName = const Value.absent(),
          Value<String?> siteId = const Value.absent(),
          Value<String?> siteName = const Value.absent(),
          bool? requiresPhotoProof,
          bool? requiresSignature,
          Value<String?> verifierName = const Value.absent(),
          Value<DateTime?> verifiedAt = const Value.absent(),
          Value<String?> verificationNotes = const Value.absent(),
          int? version,
          DateTime? createdAt,
          DateTime? updatedAt}) =>
      CachedTask(
        id: id ?? this.id,
        workspaceId: workspaceId ?? this.workspaceId,
        title: title ?? this.title,
        description: description.present ? description.value : this.description,
        status: status ?? this.status,
        simplifiedStatus: simplifiedStatus ?? this.simplifiedStatus,
        priority: priority ?? this.priority,
        dueAt: dueAt.present ? dueAt.value : this.dueAt,
        customerId: customerId.present ? customerId.value : this.customerId,
        customerName:
            customerName.present ? customerName.value : this.customerName,
        siteId: siteId.present ? siteId.value : this.siteId,
        siteName: siteName.present ? siteName.value : this.siteName,
        requiresPhotoProof: requiresPhotoProof ?? this.requiresPhotoProof,
        requiresSignature: requiresSignature ?? this.requiresSignature,
        verifierName:
            verifierName.present ? verifierName.value : this.verifierName,
        verifiedAt: verifiedAt.present ? verifiedAt.value : this.verifiedAt,
        verificationNotes: verificationNotes.present
            ? verificationNotes.value
            : this.verificationNotes,
        version: version ?? this.version,
        createdAt: createdAt ?? this.createdAt,
        updatedAt: updatedAt ?? this.updatedAt,
      );
  CachedTask copyWithCompanion(CachedTasksCompanion data) {
    return CachedTask(
      id: data.id.present ? data.id.value : this.id,
      workspaceId:
          data.workspaceId.present ? data.workspaceId.value : this.workspaceId,
      title: data.title.present ? data.title.value : this.title,
      description:
          data.description.present ? data.description.value : this.description,
      status: data.status.present ? data.status.value : this.status,
      simplifiedStatus: data.simplifiedStatus.present
          ? data.simplifiedStatus.value
          : this.simplifiedStatus,
      priority: data.priority.present ? data.priority.value : this.priority,
      dueAt: data.dueAt.present ? data.dueAt.value : this.dueAt,
      customerId:
          data.customerId.present ? data.customerId.value : this.customerId,
      customerName: data.customerName.present
          ? data.customerName.value
          : this.customerName,
      siteId: data.siteId.present ? data.siteId.value : this.siteId,
      siteName: data.siteName.present ? data.siteName.value : this.siteName,
      requiresPhotoProof: data.requiresPhotoProof.present
          ? data.requiresPhotoProof.value
          : this.requiresPhotoProof,
      requiresSignature: data.requiresSignature.present
          ? data.requiresSignature.value
          : this.requiresSignature,
      verifierName: data.verifierName.present
          ? data.verifierName.value
          : this.verifierName,
      verifiedAt:
          data.verifiedAt.present ? data.verifiedAt.value : this.verifiedAt,
      verificationNotes: data.verificationNotes.present
          ? data.verificationNotes.value
          : this.verificationNotes,
      version: data.version.present ? data.version.value : this.version,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('CachedTask(')
          ..write('id: $id, ')
          ..write('workspaceId: $workspaceId, ')
          ..write('title: $title, ')
          ..write('description: $description, ')
          ..write('status: $status, ')
          ..write('simplifiedStatus: $simplifiedStatus, ')
          ..write('priority: $priority, ')
          ..write('dueAt: $dueAt, ')
          ..write('customerId: $customerId, ')
          ..write('customerName: $customerName, ')
          ..write('siteId: $siteId, ')
          ..write('siteName: $siteName, ')
          ..write('requiresPhotoProof: $requiresPhotoProof, ')
          ..write('requiresSignature: $requiresSignature, ')
          ..write('verifierName: $verifierName, ')
          ..write('verifiedAt: $verifiedAt, ')
          ..write('verificationNotes: $verificationNotes, ')
          ..write('version: $version, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
      id,
      workspaceId,
      title,
      description,
      status,
      simplifiedStatus,
      priority,
      dueAt,
      customerId,
      customerName,
      siteId,
      siteName,
      requiresPhotoProof,
      requiresSignature,
      verifierName,
      verifiedAt,
      verificationNotes,
      version,
      createdAt,
      updatedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is CachedTask &&
          other.id == this.id &&
          other.workspaceId == this.workspaceId &&
          other.title == this.title &&
          other.description == this.description &&
          other.status == this.status &&
          other.simplifiedStatus == this.simplifiedStatus &&
          other.priority == this.priority &&
          other.dueAt == this.dueAt &&
          other.customerId == this.customerId &&
          other.customerName == this.customerName &&
          other.siteId == this.siteId &&
          other.siteName == this.siteName &&
          other.requiresPhotoProof == this.requiresPhotoProof &&
          other.requiresSignature == this.requiresSignature &&
          other.verifierName == this.verifierName &&
          other.verifiedAt == this.verifiedAt &&
          other.verificationNotes == this.verificationNotes &&
          other.version == this.version &&
          other.createdAt == this.createdAt &&
          other.updatedAt == this.updatedAt);
}

class CachedTasksCompanion extends UpdateCompanion<CachedTask> {
  final Value<String> id;
  final Value<String> workspaceId;
  final Value<String> title;
  final Value<String?> description;
  final Value<String> status;
  final Value<String> simplifiedStatus;
  final Value<String> priority;
  final Value<DateTime?> dueAt;
  final Value<String?> customerId;
  final Value<String?> customerName;
  final Value<String?> siteId;
  final Value<String?> siteName;
  final Value<bool> requiresPhotoProof;
  final Value<bool> requiresSignature;
  final Value<String?> verifierName;
  final Value<DateTime?> verifiedAt;
  final Value<String?> verificationNotes;
  final Value<int> version;
  final Value<DateTime> createdAt;
  final Value<DateTime> updatedAt;
  final Value<int> rowid;
  const CachedTasksCompanion({
    this.id = const Value.absent(),
    this.workspaceId = const Value.absent(),
    this.title = const Value.absent(),
    this.description = const Value.absent(),
    this.status = const Value.absent(),
    this.simplifiedStatus = const Value.absent(),
    this.priority = const Value.absent(),
    this.dueAt = const Value.absent(),
    this.customerId = const Value.absent(),
    this.customerName = const Value.absent(),
    this.siteId = const Value.absent(),
    this.siteName = const Value.absent(),
    this.requiresPhotoProof = const Value.absent(),
    this.requiresSignature = const Value.absent(),
    this.verifierName = const Value.absent(),
    this.verifiedAt = const Value.absent(),
    this.verificationNotes = const Value.absent(),
    this.version = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  CachedTasksCompanion.insert({
    required String id,
    required String workspaceId,
    required String title,
    this.description = const Value.absent(),
    required String status,
    required String simplifiedStatus,
    required String priority,
    this.dueAt = const Value.absent(),
    this.customerId = const Value.absent(),
    this.customerName = const Value.absent(),
    this.siteId = const Value.absent(),
    this.siteName = const Value.absent(),
    this.requiresPhotoProof = const Value.absent(),
    this.requiresSignature = const Value.absent(),
    this.verifierName = const Value.absent(),
    this.verifiedAt = const Value.absent(),
    this.verificationNotes = const Value.absent(),
    this.version = const Value.absent(),
    required DateTime createdAt,
    required DateTime updatedAt,
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        workspaceId = Value(workspaceId),
        title = Value(title),
        status = Value(status),
        simplifiedStatus = Value(simplifiedStatus),
        priority = Value(priority),
        createdAt = Value(createdAt),
        updatedAt = Value(updatedAt);
  static Insertable<CachedTask> custom({
    Expression<String>? id,
    Expression<String>? workspaceId,
    Expression<String>? title,
    Expression<String>? description,
    Expression<String>? status,
    Expression<String>? simplifiedStatus,
    Expression<String>? priority,
    Expression<DateTime>? dueAt,
    Expression<String>? customerId,
    Expression<String>? customerName,
    Expression<String>? siteId,
    Expression<String>? siteName,
    Expression<bool>? requiresPhotoProof,
    Expression<bool>? requiresSignature,
    Expression<String>? verifierName,
    Expression<DateTime>? verifiedAt,
    Expression<String>? verificationNotes,
    Expression<int>? version,
    Expression<DateTime>? createdAt,
    Expression<DateTime>? updatedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (workspaceId != null) 'workspace_id': workspaceId,
      if (title != null) 'title': title,
      if (description != null) 'description': description,
      if (status != null) 'status': status,
      if (simplifiedStatus != null) 'simplified_status': simplifiedStatus,
      if (priority != null) 'priority': priority,
      if (dueAt != null) 'due_at': dueAt,
      if (customerId != null) 'customer_id': customerId,
      if (customerName != null) 'customer_name': customerName,
      if (siteId != null) 'site_id': siteId,
      if (siteName != null) 'site_name': siteName,
      if (requiresPhotoProof != null)
        'requires_photo_proof': requiresPhotoProof,
      if (requiresSignature != null) 'requires_signature': requiresSignature,
      if (verifierName != null) 'verifier_name': verifierName,
      if (verifiedAt != null) 'verified_at': verifiedAt,
      if (verificationNotes != null) 'verification_notes': verificationNotes,
      if (version != null) 'version': version,
      if (createdAt != null) 'created_at': createdAt,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  CachedTasksCompanion copyWith(
      {Value<String>? id,
      Value<String>? workspaceId,
      Value<String>? title,
      Value<String?>? description,
      Value<String>? status,
      Value<String>? simplifiedStatus,
      Value<String>? priority,
      Value<DateTime?>? dueAt,
      Value<String?>? customerId,
      Value<String?>? customerName,
      Value<String?>? siteId,
      Value<String?>? siteName,
      Value<bool>? requiresPhotoProof,
      Value<bool>? requiresSignature,
      Value<String?>? verifierName,
      Value<DateTime?>? verifiedAt,
      Value<String?>? verificationNotes,
      Value<int>? version,
      Value<DateTime>? createdAt,
      Value<DateTime>? updatedAt,
      Value<int>? rowid}) {
    return CachedTasksCompanion(
      id: id ?? this.id,
      workspaceId: workspaceId ?? this.workspaceId,
      title: title ?? this.title,
      description: description ?? this.description,
      status: status ?? this.status,
      simplifiedStatus: simplifiedStatus ?? this.simplifiedStatus,
      priority: priority ?? this.priority,
      dueAt: dueAt ?? this.dueAt,
      customerId: customerId ?? this.customerId,
      customerName: customerName ?? this.customerName,
      siteId: siteId ?? this.siteId,
      siteName: siteName ?? this.siteName,
      requiresPhotoProof: requiresPhotoProof ?? this.requiresPhotoProof,
      requiresSignature: requiresSignature ?? this.requiresSignature,
      verifierName: verifierName ?? this.verifierName,
      verifiedAt: verifiedAt ?? this.verifiedAt,
      verificationNotes: verificationNotes ?? this.verificationNotes,
      version: version ?? this.version,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (workspaceId.present) {
      map['workspace_id'] = Variable<String>(workspaceId.value);
    }
    if (title.present) {
      map['title'] = Variable<String>(title.value);
    }
    if (description.present) {
      map['description'] = Variable<String>(description.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (simplifiedStatus.present) {
      map['simplified_status'] = Variable<String>(simplifiedStatus.value);
    }
    if (priority.present) {
      map['priority'] = Variable<String>(priority.value);
    }
    if (dueAt.present) {
      map['due_at'] = Variable<DateTime>(dueAt.value);
    }
    if (customerId.present) {
      map['customer_id'] = Variable<String>(customerId.value);
    }
    if (customerName.present) {
      map['customer_name'] = Variable<String>(customerName.value);
    }
    if (siteId.present) {
      map['site_id'] = Variable<String>(siteId.value);
    }
    if (siteName.present) {
      map['site_name'] = Variable<String>(siteName.value);
    }
    if (requiresPhotoProof.present) {
      map['requires_photo_proof'] = Variable<bool>(requiresPhotoProof.value);
    }
    if (requiresSignature.present) {
      map['requires_signature'] = Variable<bool>(requiresSignature.value);
    }
    if (verifierName.present) {
      map['verifier_name'] = Variable<String>(verifierName.value);
    }
    if (verifiedAt.present) {
      map['verified_at'] = Variable<DateTime>(verifiedAt.value);
    }
    if (verificationNotes.present) {
      map['verification_notes'] = Variable<String>(verificationNotes.value);
    }
    if (version.present) {
      map['version'] = Variable<int>(version.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('CachedTasksCompanion(')
          ..write('id: $id, ')
          ..write('workspaceId: $workspaceId, ')
          ..write('title: $title, ')
          ..write('description: $description, ')
          ..write('status: $status, ')
          ..write('simplifiedStatus: $simplifiedStatus, ')
          ..write('priority: $priority, ')
          ..write('dueAt: $dueAt, ')
          ..write('customerId: $customerId, ')
          ..write('customerName: $customerName, ')
          ..write('siteId: $siteId, ')
          ..write('siteName: $siteName, ')
          ..write('requiresPhotoProof: $requiresPhotoProof, ')
          ..write('requiresSignature: $requiresSignature, ')
          ..write('verifierName: $verifierName, ')
          ..write('verifiedAt: $verifiedAt, ')
          ..write('verificationNotes: $verificationNotes, ')
          ..write('version: $version, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $CachedChecklistItemsTable extends CachedChecklistItems
    with TableInfo<$CachedChecklistItemsTable, CachedChecklistItem> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $CachedChecklistItemsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _taskIdMeta = const VerificationMeta('taskId');
  @override
  late final GeneratedColumn<String> taskId = GeneratedColumn<String>(
      'task_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _titleMeta = const VerificationMeta('title');
  @override
  late final GeneratedColumn<String> title = GeneratedColumn<String>(
      'title', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _isCompletedMeta =
      const VerificationMeta('isCompleted');
  @override
  late final GeneratedColumn<bool> isCompleted = GeneratedColumn<bool>(
      'is_completed', aliasedName, false,
      type: DriftSqlType.bool,
      requiredDuringInsert: false,
      defaultConstraints: GeneratedColumn.constraintIsAlways(
          'CHECK ("is_completed" IN (0, 1))'),
      defaultValue: const Constant(false));
  static const VerificationMeta _sortOrderMeta =
      const VerificationMeta('sortOrder');
  @override
  late final GeneratedColumn<int> sortOrder = GeneratedColumn<int>(
      'sort_order', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _completedAtMeta =
      const VerificationMeta('completedAt');
  @override
  late final GeneratedColumn<DateTime> completedAt = GeneratedColumn<DateTime>(
      'completed_at', aliasedName, true,
      type: DriftSqlType.dateTime, requiredDuringInsert: false);
  @override
  List<GeneratedColumn> get $columns =>
      [id, taskId, title, isCompleted, sortOrder, completedAt];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'cached_checklist_items';
  @override
  VerificationContext validateIntegrity(
      Insertable<CachedChecklistItem> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('task_id')) {
      context.handle(_taskIdMeta,
          taskId.isAcceptableOrUnknown(data['task_id']!, _taskIdMeta));
    } else if (isInserting) {
      context.missing(_taskIdMeta);
    }
    if (data.containsKey('title')) {
      context.handle(
          _titleMeta, title.isAcceptableOrUnknown(data['title']!, _titleMeta));
    } else if (isInserting) {
      context.missing(_titleMeta);
    }
    if (data.containsKey('is_completed')) {
      context.handle(
          _isCompletedMeta,
          isCompleted.isAcceptableOrUnknown(
              data['is_completed']!, _isCompletedMeta));
    }
    if (data.containsKey('sort_order')) {
      context.handle(_sortOrderMeta,
          sortOrder.isAcceptableOrUnknown(data['sort_order']!, _sortOrderMeta));
    }
    if (data.containsKey('completed_at')) {
      context.handle(
          _completedAtMeta,
          completedAt.isAcceptableOrUnknown(
              data['completed_at']!, _completedAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  CachedChecklistItem map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return CachedChecklistItem(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      taskId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}task_id'])!,
      title: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}title'])!,
      isCompleted: attachedDatabase.typeMapping
          .read(DriftSqlType.bool, data['${effectivePrefix}is_completed'])!,
      sortOrder: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}sort_order'])!,
      completedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}completed_at']),
    );
  }

  @override
  $CachedChecklistItemsTable createAlias(String alias) {
    return $CachedChecklistItemsTable(attachedDatabase, alias);
  }
}

class CachedChecklistItem extends DataClass
    implements Insertable<CachedChecklistItem> {
  final String id;
  final String taskId;
  final String title;
  final bool isCompleted;
  final int sortOrder;
  final DateTime? completedAt;
  const CachedChecklistItem(
      {required this.id,
      required this.taskId,
      required this.title,
      required this.isCompleted,
      required this.sortOrder,
      this.completedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['task_id'] = Variable<String>(taskId);
    map['title'] = Variable<String>(title);
    map['is_completed'] = Variable<bool>(isCompleted);
    map['sort_order'] = Variable<int>(sortOrder);
    if (!nullToAbsent || completedAt != null) {
      map['completed_at'] = Variable<DateTime>(completedAt);
    }
    return map;
  }

  CachedChecklistItemsCompanion toCompanion(bool nullToAbsent) {
    return CachedChecklistItemsCompanion(
      id: Value(id),
      taskId: Value(taskId),
      title: Value(title),
      isCompleted: Value(isCompleted),
      sortOrder: Value(sortOrder),
      completedAt: completedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(completedAt),
    );
  }

  factory CachedChecklistItem.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return CachedChecklistItem(
      id: serializer.fromJson<String>(json['id']),
      taskId: serializer.fromJson<String>(json['taskId']),
      title: serializer.fromJson<String>(json['title']),
      isCompleted: serializer.fromJson<bool>(json['isCompleted']),
      sortOrder: serializer.fromJson<int>(json['sortOrder']),
      completedAt: serializer.fromJson<DateTime?>(json['completedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'taskId': serializer.toJson<String>(taskId),
      'title': serializer.toJson<String>(title),
      'isCompleted': serializer.toJson<bool>(isCompleted),
      'sortOrder': serializer.toJson<int>(sortOrder),
      'completedAt': serializer.toJson<DateTime?>(completedAt),
    };
  }

  CachedChecklistItem copyWith(
          {String? id,
          String? taskId,
          String? title,
          bool? isCompleted,
          int? sortOrder,
          Value<DateTime?> completedAt = const Value.absent()}) =>
      CachedChecklistItem(
        id: id ?? this.id,
        taskId: taskId ?? this.taskId,
        title: title ?? this.title,
        isCompleted: isCompleted ?? this.isCompleted,
        sortOrder: sortOrder ?? this.sortOrder,
        completedAt: completedAt.present ? completedAt.value : this.completedAt,
      );
  CachedChecklistItem copyWithCompanion(CachedChecklistItemsCompanion data) {
    return CachedChecklistItem(
      id: data.id.present ? data.id.value : this.id,
      taskId: data.taskId.present ? data.taskId.value : this.taskId,
      title: data.title.present ? data.title.value : this.title,
      isCompleted:
          data.isCompleted.present ? data.isCompleted.value : this.isCompleted,
      sortOrder: data.sortOrder.present ? data.sortOrder.value : this.sortOrder,
      completedAt:
          data.completedAt.present ? data.completedAt.value : this.completedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('CachedChecklistItem(')
          ..write('id: $id, ')
          ..write('taskId: $taskId, ')
          ..write('title: $title, ')
          ..write('isCompleted: $isCompleted, ')
          ..write('sortOrder: $sortOrder, ')
          ..write('completedAt: $completedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode =>
      Object.hash(id, taskId, title, isCompleted, sortOrder, completedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is CachedChecklistItem &&
          other.id == this.id &&
          other.taskId == this.taskId &&
          other.title == this.title &&
          other.isCompleted == this.isCompleted &&
          other.sortOrder == this.sortOrder &&
          other.completedAt == this.completedAt);
}

class CachedChecklistItemsCompanion
    extends UpdateCompanion<CachedChecklistItem> {
  final Value<String> id;
  final Value<String> taskId;
  final Value<String> title;
  final Value<bool> isCompleted;
  final Value<int> sortOrder;
  final Value<DateTime?> completedAt;
  final Value<int> rowid;
  const CachedChecklistItemsCompanion({
    this.id = const Value.absent(),
    this.taskId = const Value.absent(),
    this.title = const Value.absent(),
    this.isCompleted = const Value.absent(),
    this.sortOrder = const Value.absent(),
    this.completedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  CachedChecklistItemsCompanion.insert({
    required String id,
    required String taskId,
    required String title,
    this.isCompleted = const Value.absent(),
    this.sortOrder = const Value.absent(),
    this.completedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        taskId = Value(taskId),
        title = Value(title);
  static Insertable<CachedChecklistItem> custom({
    Expression<String>? id,
    Expression<String>? taskId,
    Expression<String>? title,
    Expression<bool>? isCompleted,
    Expression<int>? sortOrder,
    Expression<DateTime>? completedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (taskId != null) 'task_id': taskId,
      if (title != null) 'title': title,
      if (isCompleted != null) 'is_completed': isCompleted,
      if (sortOrder != null) 'sort_order': sortOrder,
      if (completedAt != null) 'completed_at': completedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  CachedChecklistItemsCompanion copyWith(
      {Value<String>? id,
      Value<String>? taskId,
      Value<String>? title,
      Value<bool>? isCompleted,
      Value<int>? sortOrder,
      Value<DateTime?>? completedAt,
      Value<int>? rowid}) {
    return CachedChecklistItemsCompanion(
      id: id ?? this.id,
      taskId: taskId ?? this.taskId,
      title: title ?? this.title,
      isCompleted: isCompleted ?? this.isCompleted,
      sortOrder: sortOrder ?? this.sortOrder,
      completedAt: completedAt ?? this.completedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (taskId.present) {
      map['task_id'] = Variable<String>(taskId.value);
    }
    if (title.present) {
      map['title'] = Variable<String>(title.value);
    }
    if (isCompleted.present) {
      map['is_completed'] = Variable<bool>(isCompleted.value);
    }
    if (sortOrder.present) {
      map['sort_order'] = Variable<int>(sortOrder.value);
    }
    if (completedAt.present) {
      map['completed_at'] = Variable<DateTime>(completedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('CachedChecklistItemsCompanion(')
          ..write('id: $id, ')
          ..write('taskId: $taskId, ')
          ..write('title: $title, ')
          ..write('isCompleted: $isCompleted, ')
          ..write('sortOrder: $sortOrder, ')
          ..write('completedAt: $completedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $CachedAttendanceTable extends CachedAttendance
    with TableInfo<$CachedAttendanceTable, CachedAttendanceData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $CachedAttendanceTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _workspaceIdMeta =
      const VerificationMeta('workspaceId');
  @override
  late final GeneratedColumn<String> workspaceId = GeneratedColumn<String>(
      'workspace_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _dutyStateMeta =
      const VerificationMeta('dutyState');
  @override
  late final GeneratedColumn<String> dutyState = GeneratedColumn<String>(
      'duty_state', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _activeSessionIdMeta =
      const VerificationMeta('activeSessionId');
  @override
  late final GeneratedColumn<String> activeSessionId = GeneratedColumn<String>(
      'active_session_id', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _punchInTimeMeta =
      const VerificationMeta('punchInTime');
  @override
  late final GeneratedColumn<DateTime> punchInTime = GeneratedColumn<DateTime>(
      'punch_in_time', aliasedName, true,
      type: DriftSqlType.dateTime, requiredDuringInsert: false);
  static const VerificationMeta _shiftNameMeta =
      const VerificationMeta('shiftName');
  @override
  late final GeneratedColumn<String> shiftName = GeneratedColumn<String>(
      'shift_name', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _lastUpdatedMeta =
      const VerificationMeta('lastUpdated');
  @override
  late final GeneratedColumn<DateTime> lastUpdated = GeneratedColumn<DateTime>(
      'last_updated', aliasedName, false,
      type: DriftSqlType.dateTime,
      requiredDuringInsert: false,
      defaultValue: currentDateAndTime);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        workspaceId,
        dutyState,
        activeSessionId,
        punchInTime,
        shiftName,
        lastUpdated
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'cached_attendance';
  @override
  VerificationContext validateIntegrity(
      Insertable<CachedAttendanceData> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('workspace_id')) {
      context.handle(
          _workspaceIdMeta,
          workspaceId.isAcceptableOrUnknown(
              data['workspace_id']!, _workspaceIdMeta));
    } else if (isInserting) {
      context.missing(_workspaceIdMeta);
    }
    if (data.containsKey('duty_state')) {
      context.handle(_dutyStateMeta,
          dutyState.isAcceptableOrUnknown(data['duty_state']!, _dutyStateMeta));
    } else if (isInserting) {
      context.missing(_dutyStateMeta);
    }
    if (data.containsKey('active_session_id')) {
      context.handle(
          _activeSessionIdMeta,
          activeSessionId.isAcceptableOrUnknown(
              data['active_session_id']!, _activeSessionIdMeta));
    }
    if (data.containsKey('punch_in_time')) {
      context.handle(
          _punchInTimeMeta,
          punchInTime.isAcceptableOrUnknown(
              data['punch_in_time']!, _punchInTimeMeta));
    }
    if (data.containsKey('shift_name')) {
      context.handle(_shiftNameMeta,
          shiftName.isAcceptableOrUnknown(data['shift_name']!, _shiftNameMeta));
    }
    if (data.containsKey('last_updated')) {
      context.handle(
          _lastUpdatedMeta,
          lastUpdated.isAcceptableOrUnknown(
              data['last_updated']!, _lastUpdatedMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  CachedAttendanceData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return CachedAttendanceData(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      workspaceId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}workspace_id'])!,
      dutyState: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}duty_state'])!,
      activeSessionId: attachedDatabase.typeMapping.read(
          DriftSqlType.string, data['${effectivePrefix}active_session_id']),
      punchInTime: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}punch_in_time']),
      shiftName: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}shift_name']),
      lastUpdated: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}last_updated'])!,
    );
  }

  @override
  $CachedAttendanceTable createAlias(String alias) {
    return $CachedAttendanceTable(attachedDatabase, alias);
  }
}

class CachedAttendanceData extends DataClass
    implements Insertable<CachedAttendanceData> {
  final String id;
  final String workspaceId;
  final String dutyState;
  final String? activeSessionId;
  final DateTime? punchInTime;
  final String? shiftName;
  final DateTime lastUpdated;
  const CachedAttendanceData(
      {required this.id,
      required this.workspaceId,
      required this.dutyState,
      this.activeSessionId,
      this.punchInTime,
      this.shiftName,
      required this.lastUpdated});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['workspace_id'] = Variable<String>(workspaceId);
    map['duty_state'] = Variable<String>(dutyState);
    if (!nullToAbsent || activeSessionId != null) {
      map['active_session_id'] = Variable<String>(activeSessionId);
    }
    if (!nullToAbsent || punchInTime != null) {
      map['punch_in_time'] = Variable<DateTime>(punchInTime);
    }
    if (!nullToAbsent || shiftName != null) {
      map['shift_name'] = Variable<String>(shiftName);
    }
    map['last_updated'] = Variable<DateTime>(lastUpdated);
    return map;
  }

  CachedAttendanceCompanion toCompanion(bool nullToAbsent) {
    return CachedAttendanceCompanion(
      id: Value(id),
      workspaceId: Value(workspaceId),
      dutyState: Value(dutyState),
      activeSessionId: activeSessionId == null && nullToAbsent
          ? const Value.absent()
          : Value(activeSessionId),
      punchInTime: punchInTime == null && nullToAbsent
          ? const Value.absent()
          : Value(punchInTime),
      shiftName: shiftName == null && nullToAbsent
          ? const Value.absent()
          : Value(shiftName),
      lastUpdated: Value(lastUpdated),
    );
  }

  factory CachedAttendanceData.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return CachedAttendanceData(
      id: serializer.fromJson<String>(json['id']),
      workspaceId: serializer.fromJson<String>(json['workspaceId']),
      dutyState: serializer.fromJson<String>(json['dutyState']),
      activeSessionId: serializer.fromJson<String?>(json['activeSessionId']),
      punchInTime: serializer.fromJson<DateTime?>(json['punchInTime']),
      shiftName: serializer.fromJson<String?>(json['shiftName']),
      lastUpdated: serializer.fromJson<DateTime>(json['lastUpdated']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'workspaceId': serializer.toJson<String>(workspaceId),
      'dutyState': serializer.toJson<String>(dutyState),
      'activeSessionId': serializer.toJson<String?>(activeSessionId),
      'punchInTime': serializer.toJson<DateTime?>(punchInTime),
      'shiftName': serializer.toJson<String?>(shiftName),
      'lastUpdated': serializer.toJson<DateTime>(lastUpdated),
    };
  }

  CachedAttendanceData copyWith(
          {String? id,
          String? workspaceId,
          String? dutyState,
          Value<String?> activeSessionId = const Value.absent(),
          Value<DateTime?> punchInTime = const Value.absent(),
          Value<String?> shiftName = const Value.absent(),
          DateTime? lastUpdated}) =>
      CachedAttendanceData(
        id: id ?? this.id,
        workspaceId: workspaceId ?? this.workspaceId,
        dutyState: dutyState ?? this.dutyState,
        activeSessionId: activeSessionId.present
            ? activeSessionId.value
            : this.activeSessionId,
        punchInTime: punchInTime.present ? punchInTime.value : this.punchInTime,
        shiftName: shiftName.present ? shiftName.value : this.shiftName,
        lastUpdated: lastUpdated ?? this.lastUpdated,
      );
  CachedAttendanceData copyWithCompanion(CachedAttendanceCompanion data) {
    return CachedAttendanceData(
      id: data.id.present ? data.id.value : this.id,
      workspaceId:
          data.workspaceId.present ? data.workspaceId.value : this.workspaceId,
      dutyState: data.dutyState.present ? data.dutyState.value : this.dutyState,
      activeSessionId: data.activeSessionId.present
          ? data.activeSessionId.value
          : this.activeSessionId,
      punchInTime:
          data.punchInTime.present ? data.punchInTime.value : this.punchInTime,
      shiftName: data.shiftName.present ? data.shiftName.value : this.shiftName,
      lastUpdated:
          data.lastUpdated.present ? data.lastUpdated.value : this.lastUpdated,
    );
  }

  @override
  String toString() {
    return (StringBuffer('CachedAttendanceData(')
          ..write('id: $id, ')
          ..write('workspaceId: $workspaceId, ')
          ..write('dutyState: $dutyState, ')
          ..write('activeSessionId: $activeSessionId, ')
          ..write('punchInTime: $punchInTime, ')
          ..write('shiftName: $shiftName, ')
          ..write('lastUpdated: $lastUpdated')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, workspaceId, dutyState, activeSessionId,
      punchInTime, shiftName, lastUpdated);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is CachedAttendanceData &&
          other.id == this.id &&
          other.workspaceId == this.workspaceId &&
          other.dutyState == this.dutyState &&
          other.activeSessionId == this.activeSessionId &&
          other.punchInTime == this.punchInTime &&
          other.shiftName == this.shiftName &&
          other.lastUpdated == this.lastUpdated);
}

class CachedAttendanceCompanion extends UpdateCompanion<CachedAttendanceData> {
  final Value<String> id;
  final Value<String> workspaceId;
  final Value<String> dutyState;
  final Value<String?> activeSessionId;
  final Value<DateTime?> punchInTime;
  final Value<String?> shiftName;
  final Value<DateTime> lastUpdated;
  final Value<int> rowid;
  const CachedAttendanceCompanion({
    this.id = const Value.absent(),
    this.workspaceId = const Value.absent(),
    this.dutyState = const Value.absent(),
    this.activeSessionId = const Value.absent(),
    this.punchInTime = const Value.absent(),
    this.shiftName = const Value.absent(),
    this.lastUpdated = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  CachedAttendanceCompanion.insert({
    required String id,
    required String workspaceId,
    required String dutyState,
    this.activeSessionId = const Value.absent(),
    this.punchInTime = const Value.absent(),
    this.shiftName = const Value.absent(),
    this.lastUpdated = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        workspaceId = Value(workspaceId),
        dutyState = Value(dutyState);
  static Insertable<CachedAttendanceData> custom({
    Expression<String>? id,
    Expression<String>? workspaceId,
    Expression<String>? dutyState,
    Expression<String>? activeSessionId,
    Expression<DateTime>? punchInTime,
    Expression<String>? shiftName,
    Expression<DateTime>? lastUpdated,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (workspaceId != null) 'workspace_id': workspaceId,
      if (dutyState != null) 'duty_state': dutyState,
      if (activeSessionId != null) 'active_session_id': activeSessionId,
      if (punchInTime != null) 'punch_in_time': punchInTime,
      if (shiftName != null) 'shift_name': shiftName,
      if (lastUpdated != null) 'last_updated': lastUpdated,
      if (rowid != null) 'rowid': rowid,
    });
  }

  CachedAttendanceCompanion copyWith(
      {Value<String>? id,
      Value<String>? workspaceId,
      Value<String>? dutyState,
      Value<String?>? activeSessionId,
      Value<DateTime?>? punchInTime,
      Value<String?>? shiftName,
      Value<DateTime>? lastUpdated,
      Value<int>? rowid}) {
    return CachedAttendanceCompanion(
      id: id ?? this.id,
      workspaceId: workspaceId ?? this.workspaceId,
      dutyState: dutyState ?? this.dutyState,
      activeSessionId: activeSessionId ?? this.activeSessionId,
      punchInTime: punchInTime ?? this.punchInTime,
      shiftName: shiftName ?? this.shiftName,
      lastUpdated: lastUpdated ?? this.lastUpdated,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (workspaceId.present) {
      map['workspace_id'] = Variable<String>(workspaceId.value);
    }
    if (dutyState.present) {
      map['duty_state'] = Variable<String>(dutyState.value);
    }
    if (activeSessionId.present) {
      map['active_session_id'] = Variable<String>(activeSessionId.value);
    }
    if (punchInTime.present) {
      map['punch_in_time'] = Variable<DateTime>(punchInTime.value);
    }
    if (shiftName.present) {
      map['shift_name'] = Variable<String>(shiftName.value);
    }
    if (lastUpdated.present) {
      map['last_updated'] = Variable<DateTime>(lastUpdated.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('CachedAttendanceCompanion(')
          ..write('id: $id, ')
          ..write('workspaceId: $workspaceId, ')
          ..write('dutyState: $dutyState, ')
          ..write('activeSessionId: $activeSessionId, ')
          ..write('punchInTime: $punchInTime, ')
          ..write('shiftName: $shiftName, ')
          ..write('lastUpdated: $lastUpdated, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $CachedVisitsTable extends CachedVisits
    with TableInfo<$CachedVisitsTable, CachedVisit> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $CachedVisitsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _workspaceIdMeta =
      const VerificationMeta('workspaceId');
  @override
  late final GeneratedColumn<String> workspaceId = GeneratedColumn<String>(
      'workspace_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _customerIdMeta =
      const VerificationMeta('customerId');
  @override
  late final GeneratedColumn<String> customerId = GeneratedColumn<String>(
      'customer_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _customerNameMeta =
      const VerificationMeta('customerName');
  @override
  late final GeneratedColumn<String> customerName = GeneratedColumn<String>(
      'customer_name', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _siteIdMeta = const VerificationMeta('siteId');
  @override
  late final GeneratedColumn<String> siteId = GeneratedColumn<String>(
      'site_id', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _siteNameMeta =
      const VerificationMeta('siteName');
  @override
  late final GeneratedColumn<String> siteName = GeneratedColumn<String>(
      'site_name', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _taskIdMeta = const VerificationMeta('taskId');
  @override
  late final GeneratedColumn<String> taskId = GeneratedColumn<String>(
      'task_id', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _userIdMeta = const VerificationMeta('userId');
  @override
  late final GeneratedColumn<String> userId = GeneratedColumn<String>(
      'user_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
      'status', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _scheduledAtMeta =
      const VerificationMeta('scheduledAt');
  @override
  late final GeneratedColumn<DateTime> scheduledAt = GeneratedColumn<DateTime>(
      'scheduled_at', aliasedName, true,
      type: DriftSqlType.dateTime, requiredDuringInsert: false);
  static const VerificationMeta _checkInTimeMeta =
      const VerificationMeta('checkInTime');
  @override
  late final GeneratedColumn<DateTime> checkInTime = GeneratedColumn<DateTime>(
      'check_in_time', aliasedName, true,
      type: DriftSqlType.dateTime, requiredDuringInsert: false);
  static const VerificationMeta _checkInLatMeta =
      const VerificationMeta('checkInLat');
  @override
  late final GeneratedColumn<double> checkInLat = GeneratedColumn<double>(
      'check_in_lat', aliasedName, true,
      type: DriftSqlType.double, requiredDuringInsert: false);
  static const VerificationMeta _checkInLngMeta =
      const VerificationMeta('checkInLng');
  @override
  late final GeneratedColumn<double> checkInLng = GeneratedColumn<double>(
      'check_in_lng', aliasedName, true,
      type: DriftSqlType.double, requiredDuringInsert: false);
  static const VerificationMeta _checkOutTimeMeta =
      const VerificationMeta('checkOutTime');
  @override
  late final GeneratedColumn<DateTime> checkOutTime = GeneratedColumn<DateTime>(
      'check_out_time', aliasedName, true,
      type: DriftSqlType.dateTime, requiredDuringInsert: false);
  static const VerificationMeta _checkOutLatMeta =
      const VerificationMeta('checkOutLat');
  @override
  late final GeneratedColumn<double> checkOutLat = GeneratedColumn<double>(
      'check_out_lat', aliasedName, true,
      type: DriftSqlType.double, requiredDuringInsert: false);
  static const VerificationMeta _checkOutLngMeta =
      const VerificationMeta('checkOutLng');
  @override
  late final GeneratedColumn<double> checkOutLng = GeneratedColumn<double>(
      'check_out_lng', aliasedName, true,
      type: DriftSqlType.double, requiredDuringInsert: false);
  static const VerificationMeta _durationMinutesMeta =
      const VerificationMeta('durationMinutes');
  @override
  late final GeneratedColumn<int> durationMinutes = GeneratedColumn<int>(
      'duration_minutes', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _sequenceOrderMeta =
      const VerificationMeta('sequenceOrder');
  @override
  late final GeneratedColumn<int> sequenceOrder = GeneratedColumn<int>(
      'sequence_order', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _routeDateMeta =
      const VerificationMeta('routeDate');
  @override
  late final GeneratedColumn<String> routeDate = GeneratedColumn<String>(
      'route_date', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _notesMeta = const VerificationMeta('notes');
  @override
  late final GeneratedColumn<String> notes = GeneratedColumn<String>(
      'notes', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _createdAtMeta =
      const VerificationMeta('createdAt');
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
      'created_at', aliasedName, false,
      type: DriftSqlType.dateTime, requiredDuringInsert: true);
  static const VerificationMeta _updatedAtMeta =
      const VerificationMeta('updatedAt');
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
      'updated_at', aliasedName, false,
      type: DriftSqlType.dateTime, requiredDuringInsert: true);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        workspaceId,
        customerId,
        customerName,
        siteId,
        siteName,
        taskId,
        userId,
        status,
        scheduledAt,
        checkInTime,
        checkInLat,
        checkInLng,
        checkOutTime,
        checkOutLat,
        checkOutLng,
        durationMinutes,
        sequenceOrder,
        routeDate,
        notes,
        createdAt,
        updatedAt
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'cached_visits';
  @override
  VerificationContext validateIntegrity(Insertable<CachedVisit> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('workspace_id')) {
      context.handle(
          _workspaceIdMeta,
          workspaceId.isAcceptableOrUnknown(
              data['workspace_id']!, _workspaceIdMeta));
    } else if (isInserting) {
      context.missing(_workspaceIdMeta);
    }
    if (data.containsKey('customer_id')) {
      context.handle(
          _customerIdMeta,
          customerId.isAcceptableOrUnknown(
              data['customer_id']!, _customerIdMeta));
    } else if (isInserting) {
      context.missing(_customerIdMeta);
    }
    if (data.containsKey('customer_name')) {
      context.handle(
          _customerNameMeta,
          customerName.isAcceptableOrUnknown(
              data['customer_name']!, _customerNameMeta));
    }
    if (data.containsKey('site_id')) {
      context.handle(_siteIdMeta,
          siteId.isAcceptableOrUnknown(data['site_id']!, _siteIdMeta));
    }
    if (data.containsKey('site_name')) {
      context.handle(_siteNameMeta,
          siteName.isAcceptableOrUnknown(data['site_name']!, _siteNameMeta));
    }
    if (data.containsKey('task_id')) {
      context.handle(_taskIdMeta,
          taskId.isAcceptableOrUnknown(data['task_id']!, _taskIdMeta));
    }
    if (data.containsKey('user_id')) {
      context.handle(_userIdMeta,
          userId.isAcceptableOrUnknown(data['user_id']!, _userIdMeta));
    } else if (isInserting) {
      context.missing(_userIdMeta);
    }
    if (data.containsKey('status')) {
      context.handle(_statusMeta,
          status.isAcceptableOrUnknown(data['status']!, _statusMeta));
    } else if (isInserting) {
      context.missing(_statusMeta);
    }
    if (data.containsKey('scheduled_at')) {
      context.handle(
          _scheduledAtMeta,
          scheduledAt.isAcceptableOrUnknown(
              data['scheduled_at']!, _scheduledAtMeta));
    }
    if (data.containsKey('check_in_time')) {
      context.handle(
          _checkInTimeMeta,
          checkInTime.isAcceptableOrUnknown(
              data['check_in_time']!, _checkInTimeMeta));
    }
    if (data.containsKey('check_in_lat')) {
      context.handle(
          _checkInLatMeta,
          checkInLat.isAcceptableOrUnknown(
              data['check_in_lat']!, _checkInLatMeta));
    }
    if (data.containsKey('check_in_lng')) {
      context.handle(
          _checkInLngMeta,
          checkInLng.isAcceptableOrUnknown(
              data['check_in_lng']!, _checkInLngMeta));
    }
    if (data.containsKey('check_out_time')) {
      context.handle(
          _checkOutTimeMeta,
          checkOutTime.isAcceptableOrUnknown(
              data['check_out_time']!, _checkOutTimeMeta));
    }
    if (data.containsKey('check_out_lat')) {
      context.handle(
          _checkOutLatMeta,
          checkOutLat.isAcceptableOrUnknown(
              data['check_out_lat']!, _checkOutLatMeta));
    }
    if (data.containsKey('check_out_lng')) {
      context.handle(
          _checkOutLngMeta,
          checkOutLng.isAcceptableOrUnknown(
              data['check_out_lng']!, _checkOutLngMeta));
    }
    if (data.containsKey('duration_minutes')) {
      context.handle(
          _durationMinutesMeta,
          durationMinutes.isAcceptableOrUnknown(
              data['duration_minutes']!, _durationMinutesMeta));
    }
    if (data.containsKey('sequence_order')) {
      context.handle(
          _sequenceOrderMeta,
          sequenceOrder.isAcceptableOrUnknown(
              data['sequence_order']!, _sequenceOrderMeta));
    }
    if (data.containsKey('route_date')) {
      context.handle(_routeDateMeta,
          routeDate.isAcceptableOrUnknown(data['route_date']!, _routeDateMeta));
    }
    if (data.containsKey('notes')) {
      context.handle(
          _notesMeta, notes.isAcceptableOrUnknown(data['notes']!, _notesMeta));
    }
    if (data.containsKey('created_at')) {
      context.handle(_createdAtMeta,
          createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta));
    } else if (isInserting) {
      context.missing(_createdAtMeta);
    }
    if (data.containsKey('updated_at')) {
      context.handle(_updatedAtMeta,
          updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta));
    } else if (isInserting) {
      context.missing(_updatedAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  CachedVisit map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return CachedVisit(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      workspaceId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}workspace_id'])!,
      customerId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}customer_id'])!,
      customerName: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}customer_name']),
      siteId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}site_id']),
      siteName: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}site_name']),
      taskId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}task_id']),
      userId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}user_id'])!,
      status: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}status'])!,
      scheduledAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}scheduled_at']),
      checkInTime: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}check_in_time']),
      checkInLat: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}check_in_lat']),
      checkInLng: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}check_in_lng']),
      checkOutTime: attachedDatabase.typeMapping.read(
          DriftSqlType.dateTime, data['${effectivePrefix}check_out_time']),
      checkOutLat: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}check_out_lat']),
      checkOutLng: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}check_out_lng']),
      durationMinutes: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}duration_minutes']),
      sequenceOrder: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}sequence_order']),
      routeDate: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}route_date']),
      notes: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}notes']),
      createdAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}created_at'])!,
      updatedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}updated_at'])!,
    );
  }

  @override
  $CachedVisitsTable createAlias(String alias) {
    return $CachedVisitsTable(attachedDatabase, alias);
  }
}

class CachedVisit extends DataClass implements Insertable<CachedVisit> {
  final String id;
  final String workspaceId;
  final String customerId;
  final String? customerName;
  final String? siteId;
  final String? siteName;
  final String? taskId;
  final String userId;
  final String status;
  final DateTime? scheduledAt;
  final DateTime? checkInTime;
  final double? checkInLat;
  final double? checkInLng;
  final DateTime? checkOutTime;
  final double? checkOutLat;
  final double? checkOutLng;
  final int? durationMinutes;
  final int? sequenceOrder;
  final String? routeDate;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;
  const CachedVisit(
      {required this.id,
      required this.workspaceId,
      required this.customerId,
      this.customerName,
      this.siteId,
      this.siteName,
      this.taskId,
      required this.userId,
      required this.status,
      this.scheduledAt,
      this.checkInTime,
      this.checkInLat,
      this.checkInLng,
      this.checkOutTime,
      this.checkOutLat,
      this.checkOutLng,
      this.durationMinutes,
      this.sequenceOrder,
      this.routeDate,
      this.notes,
      required this.createdAt,
      required this.updatedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['workspace_id'] = Variable<String>(workspaceId);
    map['customer_id'] = Variable<String>(customerId);
    if (!nullToAbsent || customerName != null) {
      map['customer_name'] = Variable<String>(customerName);
    }
    if (!nullToAbsent || siteId != null) {
      map['site_id'] = Variable<String>(siteId);
    }
    if (!nullToAbsent || siteName != null) {
      map['site_name'] = Variable<String>(siteName);
    }
    if (!nullToAbsent || taskId != null) {
      map['task_id'] = Variable<String>(taskId);
    }
    map['user_id'] = Variable<String>(userId);
    map['status'] = Variable<String>(status);
    if (!nullToAbsent || scheduledAt != null) {
      map['scheduled_at'] = Variable<DateTime>(scheduledAt);
    }
    if (!nullToAbsent || checkInTime != null) {
      map['check_in_time'] = Variable<DateTime>(checkInTime);
    }
    if (!nullToAbsent || checkInLat != null) {
      map['check_in_lat'] = Variable<double>(checkInLat);
    }
    if (!nullToAbsent || checkInLng != null) {
      map['check_in_lng'] = Variable<double>(checkInLng);
    }
    if (!nullToAbsent || checkOutTime != null) {
      map['check_out_time'] = Variable<DateTime>(checkOutTime);
    }
    if (!nullToAbsent || checkOutLat != null) {
      map['check_out_lat'] = Variable<double>(checkOutLat);
    }
    if (!nullToAbsent || checkOutLng != null) {
      map['check_out_lng'] = Variable<double>(checkOutLng);
    }
    if (!nullToAbsent || durationMinutes != null) {
      map['duration_minutes'] = Variable<int>(durationMinutes);
    }
    if (!nullToAbsent || sequenceOrder != null) {
      map['sequence_order'] = Variable<int>(sequenceOrder);
    }
    if (!nullToAbsent || routeDate != null) {
      map['route_date'] = Variable<String>(routeDate);
    }
    if (!nullToAbsent || notes != null) {
      map['notes'] = Variable<String>(notes);
    }
    map['created_at'] = Variable<DateTime>(createdAt);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    return map;
  }

  CachedVisitsCompanion toCompanion(bool nullToAbsent) {
    return CachedVisitsCompanion(
      id: Value(id),
      workspaceId: Value(workspaceId),
      customerId: Value(customerId),
      customerName: customerName == null && nullToAbsent
          ? const Value.absent()
          : Value(customerName),
      siteId:
          siteId == null && nullToAbsent ? const Value.absent() : Value(siteId),
      siteName: siteName == null && nullToAbsent
          ? const Value.absent()
          : Value(siteName),
      taskId:
          taskId == null && nullToAbsent ? const Value.absent() : Value(taskId),
      userId: Value(userId),
      status: Value(status),
      scheduledAt: scheduledAt == null && nullToAbsent
          ? const Value.absent()
          : Value(scheduledAt),
      checkInTime: checkInTime == null && nullToAbsent
          ? const Value.absent()
          : Value(checkInTime),
      checkInLat: checkInLat == null && nullToAbsent
          ? const Value.absent()
          : Value(checkInLat),
      checkInLng: checkInLng == null && nullToAbsent
          ? const Value.absent()
          : Value(checkInLng),
      checkOutTime: checkOutTime == null && nullToAbsent
          ? const Value.absent()
          : Value(checkOutTime),
      checkOutLat: checkOutLat == null && nullToAbsent
          ? const Value.absent()
          : Value(checkOutLat),
      checkOutLng: checkOutLng == null && nullToAbsent
          ? const Value.absent()
          : Value(checkOutLng),
      durationMinutes: durationMinutes == null && nullToAbsent
          ? const Value.absent()
          : Value(durationMinutes),
      sequenceOrder: sequenceOrder == null && nullToAbsent
          ? const Value.absent()
          : Value(sequenceOrder),
      routeDate: routeDate == null && nullToAbsent
          ? const Value.absent()
          : Value(routeDate),
      notes:
          notes == null && nullToAbsent ? const Value.absent() : Value(notes),
      createdAt: Value(createdAt),
      updatedAt: Value(updatedAt),
    );
  }

  factory CachedVisit.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return CachedVisit(
      id: serializer.fromJson<String>(json['id']),
      workspaceId: serializer.fromJson<String>(json['workspaceId']),
      customerId: serializer.fromJson<String>(json['customerId']),
      customerName: serializer.fromJson<String?>(json['customerName']),
      siteId: serializer.fromJson<String?>(json['siteId']),
      siteName: serializer.fromJson<String?>(json['siteName']),
      taskId: serializer.fromJson<String?>(json['taskId']),
      userId: serializer.fromJson<String>(json['userId']),
      status: serializer.fromJson<String>(json['status']),
      scheduledAt: serializer.fromJson<DateTime?>(json['scheduledAt']),
      checkInTime: serializer.fromJson<DateTime?>(json['checkInTime']),
      checkInLat: serializer.fromJson<double?>(json['checkInLat']),
      checkInLng: serializer.fromJson<double?>(json['checkInLng']),
      checkOutTime: serializer.fromJson<DateTime?>(json['checkOutTime']),
      checkOutLat: serializer.fromJson<double?>(json['checkOutLat']),
      checkOutLng: serializer.fromJson<double?>(json['checkOutLng']),
      durationMinutes: serializer.fromJson<int?>(json['durationMinutes']),
      sequenceOrder: serializer.fromJson<int?>(json['sequenceOrder']),
      routeDate: serializer.fromJson<String?>(json['routeDate']),
      notes: serializer.fromJson<String?>(json['notes']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'workspaceId': serializer.toJson<String>(workspaceId),
      'customerId': serializer.toJson<String>(customerId),
      'customerName': serializer.toJson<String?>(customerName),
      'siteId': serializer.toJson<String?>(siteId),
      'siteName': serializer.toJson<String?>(siteName),
      'taskId': serializer.toJson<String?>(taskId),
      'userId': serializer.toJson<String>(userId),
      'status': serializer.toJson<String>(status),
      'scheduledAt': serializer.toJson<DateTime?>(scheduledAt),
      'checkInTime': serializer.toJson<DateTime?>(checkInTime),
      'checkInLat': serializer.toJson<double?>(checkInLat),
      'checkInLng': serializer.toJson<double?>(checkInLng),
      'checkOutTime': serializer.toJson<DateTime?>(checkOutTime),
      'checkOutLat': serializer.toJson<double?>(checkOutLat),
      'checkOutLng': serializer.toJson<double?>(checkOutLng),
      'durationMinutes': serializer.toJson<int?>(durationMinutes),
      'sequenceOrder': serializer.toJson<int?>(sequenceOrder),
      'routeDate': serializer.toJson<String?>(routeDate),
      'notes': serializer.toJson<String?>(notes),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
    };
  }

  CachedVisit copyWith(
          {String? id,
          String? workspaceId,
          String? customerId,
          Value<String?> customerName = const Value.absent(),
          Value<String?> siteId = const Value.absent(),
          Value<String?> siteName = const Value.absent(),
          Value<String?> taskId = const Value.absent(),
          String? userId,
          String? status,
          Value<DateTime?> scheduledAt = const Value.absent(),
          Value<DateTime?> checkInTime = const Value.absent(),
          Value<double?> checkInLat = const Value.absent(),
          Value<double?> checkInLng = const Value.absent(),
          Value<DateTime?> checkOutTime = const Value.absent(),
          Value<double?> checkOutLat = const Value.absent(),
          Value<double?> checkOutLng = const Value.absent(),
          Value<int?> durationMinutes = const Value.absent(),
          Value<int?> sequenceOrder = const Value.absent(),
          Value<String?> routeDate = const Value.absent(),
          Value<String?> notes = const Value.absent(),
          DateTime? createdAt,
          DateTime? updatedAt}) =>
      CachedVisit(
        id: id ?? this.id,
        workspaceId: workspaceId ?? this.workspaceId,
        customerId: customerId ?? this.customerId,
        customerName:
            customerName.present ? customerName.value : this.customerName,
        siteId: siteId.present ? siteId.value : this.siteId,
        siteName: siteName.present ? siteName.value : this.siteName,
        taskId: taskId.present ? taskId.value : this.taskId,
        userId: userId ?? this.userId,
        status: status ?? this.status,
        scheduledAt: scheduledAt.present ? scheduledAt.value : this.scheduledAt,
        checkInTime: checkInTime.present ? checkInTime.value : this.checkInTime,
        checkInLat: checkInLat.present ? checkInLat.value : this.checkInLat,
        checkInLng: checkInLng.present ? checkInLng.value : this.checkInLng,
        checkOutTime:
            checkOutTime.present ? checkOutTime.value : this.checkOutTime,
        checkOutLat: checkOutLat.present ? checkOutLat.value : this.checkOutLat,
        checkOutLng: checkOutLng.present ? checkOutLng.value : this.checkOutLng,
        durationMinutes: durationMinutes.present
            ? durationMinutes.value
            : this.durationMinutes,
        sequenceOrder:
            sequenceOrder.present ? sequenceOrder.value : this.sequenceOrder,
        routeDate: routeDate.present ? routeDate.value : this.routeDate,
        notes: notes.present ? notes.value : this.notes,
        createdAt: createdAt ?? this.createdAt,
        updatedAt: updatedAt ?? this.updatedAt,
      );
  CachedVisit copyWithCompanion(CachedVisitsCompanion data) {
    return CachedVisit(
      id: data.id.present ? data.id.value : this.id,
      workspaceId:
          data.workspaceId.present ? data.workspaceId.value : this.workspaceId,
      customerId:
          data.customerId.present ? data.customerId.value : this.customerId,
      customerName: data.customerName.present
          ? data.customerName.value
          : this.customerName,
      siteId: data.siteId.present ? data.siteId.value : this.siteId,
      siteName: data.siteName.present ? data.siteName.value : this.siteName,
      taskId: data.taskId.present ? data.taskId.value : this.taskId,
      userId: data.userId.present ? data.userId.value : this.userId,
      status: data.status.present ? data.status.value : this.status,
      scheduledAt:
          data.scheduledAt.present ? data.scheduledAt.value : this.scheduledAt,
      checkInTime:
          data.checkInTime.present ? data.checkInTime.value : this.checkInTime,
      checkInLat:
          data.checkInLat.present ? data.checkInLat.value : this.checkInLat,
      checkInLng:
          data.checkInLng.present ? data.checkInLng.value : this.checkInLng,
      checkOutTime: data.checkOutTime.present
          ? data.checkOutTime.value
          : this.checkOutTime,
      checkOutLat:
          data.checkOutLat.present ? data.checkOutLat.value : this.checkOutLat,
      checkOutLng:
          data.checkOutLng.present ? data.checkOutLng.value : this.checkOutLng,
      durationMinutes: data.durationMinutes.present
          ? data.durationMinutes.value
          : this.durationMinutes,
      sequenceOrder: data.sequenceOrder.present
          ? data.sequenceOrder.value
          : this.sequenceOrder,
      routeDate: data.routeDate.present ? data.routeDate.value : this.routeDate,
      notes: data.notes.present ? data.notes.value : this.notes,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('CachedVisit(')
          ..write('id: $id, ')
          ..write('workspaceId: $workspaceId, ')
          ..write('customerId: $customerId, ')
          ..write('customerName: $customerName, ')
          ..write('siteId: $siteId, ')
          ..write('siteName: $siteName, ')
          ..write('taskId: $taskId, ')
          ..write('userId: $userId, ')
          ..write('status: $status, ')
          ..write('scheduledAt: $scheduledAt, ')
          ..write('checkInTime: $checkInTime, ')
          ..write('checkInLat: $checkInLat, ')
          ..write('checkInLng: $checkInLng, ')
          ..write('checkOutTime: $checkOutTime, ')
          ..write('checkOutLat: $checkOutLat, ')
          ..write('checkOutLng: $checkOutLng, ')
          ..write('durationMinutes: $durationMinutes, ')
          ..write('sequenceOrder: $sequenceOrder, ')
          ..write('routeDate: $routeDate, ')
          ..write('notes: $notes, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hashAll([
        id,
        workspaceId,
        customerId,
        customerName,
        siteId,
        siteName,
        taskId,
        userId,
        status,
        scheduledAt,
        checkInTime,
        checkInLat,
        checkInLng,
        checkOutTime,
        checkOutLat,
        checkOutLng,
        durationMinutes,
        sequenceOrder,
        routeDate,
        notes,
        createdAt,
        updatedAt
      ]);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is CachedVisit &&
          other.id == this.id &&
          other.workspaceId == this.workspaceId &&
          other.customerId == this.customerId &&
          other.customerName == this.customerName &&
          other.siteId == this.siteId &&
          other.siteName == this.siteName &&
          other.taskId == this.taskId &&
          other.userId == this.userId &&
          other.status == this.status &&
          other.scheduledAt == this.scheduledAt &&
          other.checkInTime == this.checkInTime &&
          other.checkInLat == this.checkInLat &&
          other.checkInLng == this.checkInLng &&
          other.checkOutTime == this.checkOutTime &&
          other.checkOutLat == this.checkOutLat &&
          other.checkOutLng == this.checkOutLng &&
          other.durationMinutes == this.durationMinutes &&
          other.sequenceOrder == this.sequenceOrder &&
          other.routeDate == this.routeDate &&
          other.notes == this.notes &&
          other.createdAt == this.createdAt &&
          other.updatedAt == this.updatedAt);
}

class CachedVisitsCompanion extends UpdateCompanion<CachedVisit> {
  final Value<String> id;
  final Value<String> workspaceId;
  final Value<String> customerId;
  final Value<String?> customerName;
  final Value<String?> siteId;
  final Value<String?> siteName;
  final Value<String?> taskId;
  final Value<String> userId;
  final Value<String> status;
  final Value<DateTime?> scheduledAt;
  final Value<DateTime?> checkInTime;
  final Value<double?> checkInLat;
  final Value<double?> checkInLng;
  final Value<DateTime?> checkOutTime;
  final Value<double?> checkOutLat;
  final Value<double?> checkOutLng;
  final Value<int?> durationMinutes;
  final Value<int?> sequenceOrder;
  final Value<String?> routeDate;
  final Value<String?> notes;
  final Value<DateTime> createdAt;
  final Value<DateTime> updatedAt;
  final Value<int> rowid;
  const CachedVisitsCompanion({
    this.id = const Value.absent(),
    this.workspaceId = const Value.absent(),
    this.customerId = const Value.absent(),
    this.customerName = const Value.absent(),
    this.siteId = const Value.absent(),
    this.siteName = const Value.absent(),
    this.taskId = const Value.absent(),
    this.userId = const Value.absent(),
    this.status = const Value.absent(),
    this.scheduledAt = const Value.absent(),
    this.checkInTime = const Value.absent(),
    this.checkInLat = const Value.absent(),
    this.checkInLng = const Value.absent(),
    this.checkOutTime = const Value.absent(),
    this.checkOutLat = const Value.absent(),
    this.checkOutLng = const Value.absent(),
    this.durationMinutes = const Value.absent(),
    this.sequenceOrder = const Value.absent(),
    this.routeDate = const Value.absent(),
    this.notes = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  CachedVisitsCompanion.insert({
    required String id,
    required String workspaceId,
    required String customerId,
    this.customerName = const Value.absent(),
    this.siteId = const Value.absent(),
    this.siteName = const Value.absent(),
    this.taskId = const Value.absent(),
    required String userId,
    required String status,
    this.scheduledAt = const Value.absent(),
    this.checkInTime = const Value.absent(),
    this.checkInLat = const Value.absent(),
    this.checkInLng = const Value.absent(),
    this.checkOutTime = const Value.absent(),
    this.checkOutLat = const Value.absent(),
    this.checkOutLng = const Value.absent(),
    this.durationMinutes = const Value.absent(),
    this.sequenceOrder = const Value.absent(),
    this.routeDate = const Value.absent(),
    this.notes = const Value.absent(),
    required DateTime createdAt,
    required DateTime updatedAt,
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        workspaceId = Value(workspaceId),
        customerId = Value(customerId),
        userId = Value(userId),
        status = Value(status),
        createdAt = Value(createdAt),
        updatedAt = Value(updatedAt);
  static Insertable<CachedVisit> custom({
    Expression<String>? id,
    Expression<String>? workspaceId,
    Expression<String>? customerId,
    Expression<String>? customerName,
    Expression<String>? siteId,
    Expression<String>? siteName,
    Expression<String>? taskId,
    Expression<String>? userId,
    Expression<String>? status,
    Expression<DateTime>? scheduledAt,
    Expression<DateTime>? checkInTime,
    Expression<double>? checkInLat,
    Expression<double>? checkInLng,
    Expression<DateTime>? checkOutTime,
    Expression<double>? checkOutLat,
    Expression<double>? checkOutLng,
    Expression<int>? durationMinutes,
    Expression<int>? sequenceOrder,
    Expression<String>? routeDate,
    Expression<String>? notes,
    Expression<DateTime>? createdAt,
    Expression<DateTime>? updatedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (workspaceId != null) 'workspace_id': workspaceId,
      if (customerId != null) 'customer_id': customerId,
      if (customerName != null) 'customer_name': customerName,
      if (siteId != null) 'site_id': siteId,
      if (siteName != null) 'site_name': siteName,
      if (taskId != null) 'task_id': taskId,
      if (userId != null) 'user_id': userId,
      if (status != null) 'status': status,
      if (scheduledAt != null) 'scheduled_at': scheduledAt,
      if (checkInTime != null) 'check_in_time': checkInTime,
      if (checkInLat != null) 'check_in_lat': checkInLat,
      if (checkInLng != null) 'check_in_lng': checkInLng,
      if (checkOutTime != null) 'check_out_time': checkOutTime,
      if (checkOutLat != null) 'check_out_lat': checkOutLat,
      if (checkOutLng != null) 'check_out_lng': checkOutLng,
      if (durationMinutes != null) 'duration_minutes': durationMinutes,
      if (sequenceOrder != null) 'sequence_order': sequenceOrder,
      if (routeDate != null) 'route_date': routeDate,
      if (notes != null) 'notes': notes,
      if (createdAt != null) 'created_at': createdAt,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  CachedVisitsCompanion copyWith(
      {Value<String>? id,
      Value<String>? workspaceId,
      Value<String>? customerId,
      Value<String?>? customerName,
      Value<String?>? siteId,
      Value<String?>? siteName,
      Value<String?>? taskId,
      Value<String>? userId,
      Value<String>? status,
      Value<DateTime?>? scheduledAt,
      Value<DateTime?>? checkInTime,
      Value<double?>? checkInLat,
      Value<double?>? checkInLng,
      Value<DateTime?>? checkOutTime,
      Value<double?>? checkOutLat,
      Value<double?>? checkOutLng,
      Value<int?>? durationMinutes,
      Value<int?>? sequenceOrder,
      Value<String?>? routeDate,
      Value<String?>? notes,
      Value<DateTime>? createdAt,
      Value<DateTime>? updatedAt,
      Value<int>? rowid}) {
    return CachedVisitsCompanion(
      id: id ?? this.id,
      workspaceId: workspaceId ?? this.workspaceId,
      customerId: customerId ?? this.customerId,
      customerName: customerName ?? this.customerName,
      siteId: siteId ?? this.siteId,
      siteName: siteName ?? this.siteName,
      taskId: taskId ?? this.taskId,
      userId: userId ?? this.userId,
      status: status ?? this.status,
      scheduledAt: scheduledAt ?? this.scheduledAt,
      checkInTime: checkInTime ?? this.checkInTime,
      checkInLat: checkInLat ?? this.checkInLat,
      checkInLng: checkInLng ?? this.checkInLng,
      checkOutTime: checkOutTime ?? this.checkOutTime,
      checkOutLat: checkOutLat ?? this.checkOutLat,
      checkOutLng: checkOutLng ?? this.checkOutLng,
      durationMinutes: durationMinutes ?? this.durationMinutes,
      sequenceOrder: sequenceOrder ?? this.sequenceOrder,
      routeDate: routeDate ?? this.routeDate,
      notes: notes ?? this.notes,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (workspaceId.present) {
      map['workspace_id'] = Variable<String>(workspaceId.value);
    }
    if (customerId.present) {
      map['customer_id'] = Variable<String>(customerId.value);
    }
    if (customerName.present) {
      map['customer_name'] = Variable<String>(customerName.value);
    }
    if (siteId.present) {
      map['site_id'] = Variable<String>(siteId.value);
    }
    if (siteName.present) {
      map['site_name'] = Variable<String>(siteName.value);
    }
    if (taskId.present) {
      map['task_id'] = Variable<String>(taskId.value);
    }
    if (userId.present) {
      map['user_id'] = Variable<String>(userId.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (scheduledAt.present) {
      map['scheduled_at'] = Variable<DateTime>(scheduledAt.value);
    }
    if (checkInTime.present) {
      map['check_in_time'] = Variable<DateTime>(checkInTime.value);
    }
    if (checkInLat.present) {
      map['check_in_lat'] = Variable<double>(checkInLat.value);
    }
    if (checkInLng.present) {
      map['check_in_lng'] = Variable<double>(checkInLng.value);
    }
    if (checkOutTime.present) {
      map['check_out_time'] = Variable<DateTime>(checkOutTime.value);
    }
    if (checkOutLat.present) {
      map['check_out_lat'] = Variable<double>(checkOutLat.value);
    }
    if (checkOutLng.present) {
      map['check_out_lng'] = Variable<double>(checkOutLng.value);
    }
    if (durationMinutes.present) {
      map['duration_minutes'] = Variable<int>(durationMinutes.value);
    }
    if (sequenceOrder.present) {
      map['sequence_order'] = Variable<int>(sequenceOrder.value);
    }
    if (routeDate.present) {
      map['route_date'] = Variable<String>(routeDate.value);
    }
    if (notes.present) {
      map['notes'] = Variable<String>(notes.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('CachedVisitsCompanion(')
          ..write('id: $id, ')
          ..write('workspaceId: $workspaceId, ')
          ..write('customerId: $customerId, ')
          ..write('customerName: $customerName, ')
          ..write('siteId: $siteId, ')
          ..write('siteName: $siteName, ')
          ..write('taskId: $taskId, ')
          ..write('userId: $userId, ')
          ..write('status: $status, ')
          ..write('scheduledAt: $scheduledAt, ')
          ..write('checkInTime: $checkInTime, ')
          ..write('checkInLat: $checkInLat, ')
          ..write('checkInLng: $checkInLng, ')
          ..write('checkOutTime: $checkOutTime, ')
          ..write('checkOutLat: $checkOutLat, ')
          ..write('checkOutLng: $checkOutLng, ')
          ..write('durationMinutes: $durationMinutes, ')
          ..write('sequenceOrder: $sequenceOrder, ')
          ..write('routeDate: $routeDate, ')
          ..write('notes: $notes, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $CachedTaskProofsTable extends CachedTaskProofs
    with TableInfo<$CachedTaskProofsTable, CachedTaskProof> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $CachedTaskProofsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _workspaceIdMeta =
      const VerificationMeta('workspaceId');
  @override
  late final GeneratedColumn<String> workspaceId = GeneratedColumn<String>(
      'workspace_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _taskIdMeta = const VerificationMeta('taskId');
  @override
  late final GeneratedColumn<String> taskId = GeneratedColumn<String>(
      'task_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _visitIdMeta =
      const VerificationMeta('visitId');
  @override
  late final GeneratedColumn<String> visitId = GeneratedColumn<String>(
      'visit_id', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _userIdMeta = const VerificationMeta('userId');
  @override
  late final GeneratedColumn<String> userId = GeneratedColumn<String>(
      'user_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _proofTypeMeta =
      const VerificationMeta('proofType');
  @override
  late final GeneratedColumn<String> proofType = GeneratedColumn<String>(
      'proof_type', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _fileKeyMeta =
      const VerificationMeta('fileKey');
  @override
  late final GeneratedColumn<String> fileKey = GeneratedColumn<String>(
      'file_key', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _fileUrlMeta =
      const VerificationMeta('fileUrl');
  @override
  late final GeneratedColumn<String> fileUrl = GeneratedColumn<String>(
      'file_url', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _signerNameMeta =
      const VerificationMeta('signerName');
  @override
  late final GeneratedColumn<String> signerName = GeneratedColumn<String>(
      'signer_name', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _signerPhoneMeta =
      const VerificationMeta('signerPhone');
  @override
  late final GeneratedColumn<String> signerPhone = GeneratedColumn<String>(
      'signer_phone', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _watermarkJsonMeta =
      const VerificationMeta('watermarkJson');
  @override
  late final GeneratedColumn<String> watermarkJson = GeneratedColumn<String>(
      'watermark_json', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _notesMeta = const VerificationMeta('notes');
  @override
  late final GeneratedColumn<String> notes = GeneratedColumn<String>(
      'notes', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _createdAtMeta =
      const VerificationMeta('createdAt');
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
      'created_at', aliasedName, false,
      type: DriftSqlType.dateTime, requiredDuringInsert: true);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        workspaceId,
        taskId,
        visitId,
        userId,
        proofType,
        fileKey,
        fileUrl,
        signerName,
        signerPhone,
        watermarkJson,
        notes,
        createdAt
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'cached_task_proofs';
  @override
  VerificationContext validateIntegrity(Insertable<CachedTaskProof> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('workspace_id')) {
      context.handle(
          _workspaceIdMeta,
          workspaceId.isAcceptableOrUnknown(
              data['workspace_id']!, _workspaceIdMeta));
    } else if (isInserting) {
      context.missing(_workspaceIdMeta);
    }
    if (data.containsKey('task_id')) {
      context.handle(_taskIdMeta,
          taskId.isAcceptableOrUnknown(data['task_id']!, _taskIdMeta));
    } else if (isInserting) {
      context.missing(_taskIdMeta);
    }
    if (data.containsKey('visit_id')) {
      context.handle(_visitIdMeta,
          visitId.isAcceptableOrUnknown(data['visit_id']!, _visitIdMeta));
    }
    if (data.containsKey('user_id')) {
      context.handle(_userIdMeta,
          userId.isAcceptableOrUnknown(data['user_id']!, _userIdMeta));
    } else if (isInserting) {
      context.missing(_userIdMeta);
    }
    if (data.containsKey('proof_type')) {
      context.handle(_proofTypeMeta,
          proofType.isAcceptableOrUnknown(data['proof_type']!, _proofTypeMeta));
    } else if (isInserting) {
      context.missing(_proofTypeMeta);
    }
    if (data.containsKey('file_key')) {
      context.handle(_fileKeyMeta,
          fileKey.isAcceptableOrUnknown(data['file_key']!, _fileKeyMeta));
    } else if (isInserting) {
      context.missing(_fileKeyMeta);
    }
    if (data.containsKey('file_url')) {
      context.handle(_fileUrlMeta,
          fileUrl.isAcceptableOrUnknown(data['file_url']!, _fileUrlMeta));
    }
    if (data.containsKey('signer_name')) {
      context.handle(
          _signerNameMeta,
          signerName.isAcceptableOrUnknown(
              data['signer_name']!, _signerNameMeta));
    }
    if (data.containsKey('signer_phone')) {
      context.handle(
          _signerPhoneMeta,
          signerPhone.isAcceptableOrUnknown(
              data['signer_phone']!, _signerPhoneMeta));
    }
    if (data.containsKey('watermark_json')) {
      context.handle(
          _watermarkJsonMeta,
          watermarkJson.isAcceptableOrUnknown(
              data['watermark_json']!, _watermarkJsonMeta));
    }
    if (data.containsKey('notes')) {
      context.handle(
          _notesMeta, notes.isAcceptableOrUnknown(data['notes']!, _notesMeta));
    }
    if (data.containsKey('created_at')) {
      context.handle(_createdAtMeta,
          createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta));
    } else if (isInserting) {
      context.missing(_createdAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  CachedTaskProof map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return CachedTaskProof(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      workspaceId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}workspace_id'])!,
      taskId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}task_id'])!,
      visitId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}visit_id']),
      userId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}user_id'])!,
      proofType: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}proof_type'])!,
      fileKey: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}file_key'])!,
      fileUrl: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}file_url']),
      signerName: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}signer_name']),
      signerPhone: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}signer_phone']),
      watermarkJson: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}watermark_json']),
      notes: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}notes']),
      createdAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}created_at'])!,
    );
  }

  @override
  $CachedTaskProofsTable createAlias(String alias) {
    return $CachedTaskProofsTable(attachedDatabase, alias);
  }
}

class CachedTaskProof extends DataClass implements Insertable<CachedTaskProof> {
  final String id;
  final String workspaceId;
  final String taskId;
  final String? visitId;
  final String userId;
  final String proofType;
  final String fileKey;
  final String? fileUrl;
  final String? signerName;
  final String? signerPhone;
  final String? watermarkJson;
  final String? notes;
  final DateTime createdAt;
  const CachedTaskProof(
      {required this.id,
      required this.workspaceId,
      required this.taskId,
      this.visitId,
      required this.userId,
      required this.proofType,
      required this.fileKey,
      this.fileUrl,
      this.signerName,
      this.signerPhone,
      this.watermarkJson,
      this.notes,
      required this.createdAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['workspace_id'] = Variable<String>(workspaceId);
    map['task_id'] = Variable<String>(taskId);
    if (!nullToAbsent || visitId != null) {
      map['visit_id'] = Variable<String>(visitId);
    }
    map['user_id'] = Variable<String>(userId);
    map['proof_type'] = Variable<String>(proofType);
    map['file_key'] = Variable<String>(fileKey);
    if (!nullToAbsent || fileUrl != null) {
      map['file_url'] = Variable<String>(fileUrl);
    }
    if (!nullToAbsent || signerName != null) {
      map['signer_name'] = Variable<String>(signerName);
    }
    if (!nullToAbsent || signerPhone != null) {
      map['signer_phone'] = Variable<String>(signerPhone);
    }
    if (!nullToAbsent || watermarkJson != null) {
      map['watermark_json'] = Variable<String>(watermarkJson);
    }
    if (!nullToAbsent || notes != null) {
      map['notes'] = Variable<String>(notes);
    }
    map['created_at'] = Variable<DateTime>(createdAt);
    return map;
  }

  CachedTaskProofsCompanion toCompanion(bool nullToAbsent) {
    return CachedTaskProofsCompanion(
      id: Value(id),
      workspaceId: Value(workspaceId),
      taskId: Value(taskId),
      visitId: visitId == null && nullToAbsent
          ? const Value.absent()
          : Value(visitId),
      userId: Value(userId),
      proofType: Value(proofType),
      fileKey: Value(fileKey),
      fileUrl: fileUrl == null && nullToAbsent
          ? const Value.absent()
          : Value(fileUrl),
      signerName: signerName == null && nullToAbsent
          ? const Value.absent()
          : Value(signerName),
      signerPhone: signerPhone == null && nullToAbsent
          ? const Value.absent()
          : Value(signerPhone),
      watermarkJson: watermarkJson == null && nullToAbsent
          ? const Value.absent()
          : Value(watermarkJson),
      notes:
          notes == null && nullToAbsent ? const Value.absent() : Value(notes),
      createdAt: Value(createdAt),
    );
  }

  factory CachedTaskProof.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return CachedTaskProof(
      id: serializer.fromJson<String>(json['id']),
      workspaceId: serializer.fromJson<String>(json['workspaceId']),
      taskId: serializer.fromJson<String>(json['taskId']),
      visitId: serializer.fromJson<String?>(json['visitId']),
      userId: serializer.fromJson<String>(json['userId']),
      proofType: serializer.fromJson<String>(json['proofType']),
      fileKey: serializer.fromJson<String>(json['fileKey']),
      fileUrl: serializer.fromJson<String?>(json['fileUrl']),
      signerName: serializer.fromJson<String?>(json['signerName']),
      signerPhone: serializer.fromJson<String?>(json['signerPhone']),
      watermarkJson: serializer.fromJson<String?>(json['watermarkJson']),
      notes: serializer.fromJson<String?>(json['notes']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'workspaceId': serializer.toJson<String>(workspaceId),
      'taskId': serializer.toJson<String>(taskId),
      'visitId': serializer.toJson<String?>(visitId),
      'userId': serializer.toJson<String>(userId),
      'proofType': serializer.toJson<String>(proofType),
      'fileKey': serializer.toJson<String>(fileKey),
      'fileUrl': serializer.toJson<String?>(fileUrl),
      'signerName': serializer.toJson<String?>(signerName),
      'signerPhone': serializer.toJson<String?>(signerPhone),
      'watermarkJson': serializer.toJson<String?>(watermarkJson),
      'notes': serializer.toJson<String?>(notes),
      'createdAt': serializer.toJson<DateTime>(createdAt),
    };
  }

  CachedTaskProof copyWith(
          {String? id,
          String? workspaceId,
          String? taskId,
          Value<String?> visitId = const Value.absent(),
          String? userId,
          String? proofType,
          String? fileKey,
          Value<String?> fileUrl = const Value.absent(),
          Value<String?> signerName = const Value.absent(),
          Value<String?> signerPhone = const Value.absent(),
          Value<String?> watermarkJson = const Value.absent(),
          Value<String?> notes = const Value.absent(),
          DateTime? createdAt}) =>
      CachedTaskProof(
        id: id ?? this.id,
        workspaceId: workspaceId ?? this.workspaceId,
        taskId: taskId ?? this.taskId,
        visitId: visitId.present ? visitId.value : this.visitId,
        userId: userId ?? this.userId,
        proofType: proofType ?? this.proofType,
        fileKey: fileKey ?? this.fileKey,
        fileUrl: fileUrl.present ? fileUrl.value : this.fileUrl,
        signerName: signerName.present ? signerName.value : this.signerName,
        signerPhone: signerPhone.present ? signerPhone.value : this.signerPhone,
        watermarkJson:
            watermarkJson.present ? watermarkJson.value : this.watermarkJson,
        notes: notes.present ? notes.value : this.notes,
        createdAt: createdAt ?? this.createdAt,
      );
  CachedTaskProof copyWithCompanion(CachedTaskProofsCompanion data) {
    return CachedTaskProof(
      id: data.id.present ? data.id.value : this.id,
      workspaceId:
          data.workspaceId.present ? data.workspaceId.value : this.workspaceId,
      taskId: data.taskId.present ? data.taskId.value : this.taskId,
      visitId: data.visitId.present ? data.visitId.value : this.visitId,
      userId: data.userId.present ? data.userId.value : this.userId,
      proofType: data.proofType.present ? data.proofType.value : this.proofType,
      fileKey: data.fileKey.present ? data.fileKey.value : this.fileKey,
      fileUrl: data.fileUrl.present ? data.fileUrl.value : this.fileUrl,
      signerName:
          data.signerName.present ? data.signerName.value : this.signerName,
      signerPhone:
          data.signerPhone.present ? data.signerPhone.value : this.signerPhone,
      watermarkJson: data.watermarkJson.present
          ? data.watermarkJson.value
          : this.watermarkJson,
      notes: data.notes.present ? data.notes.value : this.notes,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('CachedTaskProof(')
          ..write('id: $id, ')
          ..write('workspaceId: $workspaceId, ')
          ..write('taskId: $taskId, ')
          ..write('visitId: $visitId, ')
          ..write('userId: $userId, ')
          ..write('proofType: $proofType, ')
          ..write('fileKey: $fileKey, ')
          ..write('fileUrl: $fileUrl, ')
          ..write('signerName: $signerName, ')
          ..write('signerPhone: $signerPhone, ')
          ..write('watermarkJson: $watermarkJson, ')
          ..write('notes: $notes, ')
          ..write('createdAt: $createdAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
      id,
      workspaceId,
      taskId,
      visitId,
      userId,
      proofType,
      fileKey,
      fileUrl,
      signerName,
      signerPhone,
      watermarkJson,
      notes,
      createdAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is CachedTaskProof &&
          other.id == this.id &&
          other.workspaceId == this.workspaceId &&
          other.taskId == this.taskId &&
          other.visitId == this.visitId &&
          other.userId == this.userId &&
          other.proofType == this.proofType &&
          other.fileKey == this.fileKey &&
          other.fileUrl == this.fileUrl &&
          other.signerName == this.signerName &&
          other.signerPhone == this.signerPhone &&
          other.watermarkJson == this.watermarkJson &&
          other.notes == this.notes &&
          other.createdAt == this.createdAt);
}

class CachedTaskProofsCompanion extends UpdateCompanion<CachedTaskProof> {
  final Value<String> id;
  final Value<String> workspaceId;
  final Value<String> taskId;
  final Value<String?> visitId;
  final Value<String> userId;
  final Value<String> proofType;
  final Value<String> fileKey;
  final Value<String?> fileUrl;
  final Value<String?> signerName;
  final Value<String?> signerPhone;
  final Value<String?> watermarkJson;
  final Value<String?> notes;
  final Value<DateTime> createdAt;
  final Value<int> rowid;
  const CachedTaskProofsCompanion({
    this.id = const Value.absent(),
    this.workspaceId = const Value.absent(),
    this.taskId = const Value.absent(),
    this.visitId = const Value.absent(),
    this.userId = const Value.absent(),
    this.proofType = const Value.absent(),
    this.fileKey = const Value.absent(),
    this.fileUrl = const Value.absent(),
    this.signerName = const Value.absent(),
    this.signerPhone = const Value.absent(),
    this.watermarkJson = const Value.absent(),
    this.notes = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  CachedTaskProofsCompanion.insert({
    required String id,
    required String workspaceId,
    required String taskId,
    this.visitId = const Value.absent(),
    required String userId,
    required String proofType,
    required String fileKey,
    this.fileUrl = const Value.absent(),
    this.signerName = const Value.absent(),
    this.signerPhone = const Value.absent(),
    this.watermarkJson = const Value.absent(),
    this.notes = const Value.absent(),
    required DateTime createdAt,
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        workspaceId = Value(workspaceId),
        taskId = Value(taskId),
        userId = Value(userId),
        proofType = Value(proofType),
        fileKey = Value(fileKey),
        createdAt = Value(createdAt);
  static Insertable<CachedTaskProof> custom({
    Expression<String>? id,
    Expression<String>? workspaceId,
    Expression<String>? taskId,
    Expression<String>? visitId,
    Expression<String>? userId,
    Expression<String>? proofType,
    Expression<String>? fileKey,
    Expression<String>? fileUrl,
    Expression<String>? signerName,
    Expression<String>? signerPhone,
    Expression<String>? watermarkJson,
    Expression<String>? notes,
    Expression<DateTime>? createdAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (workspaceId != null) 'workspace_id': workspaceId,
      if (taskId != null) 'task_id': taskId,
      if (visitId != null) 'visit_id': visitId,
      if (userId != null) 'user_id': userId,
      if (proofType != null) 'proof_type': proofType,
      if (fileKey != null) 'file_key': fileKey,
      if (fileUrl != null) 'file_url': fileUrl,
      if (signerName != null) 'signer_name': signerName,
      if (signerPhone != null) 'signer_phone': signerPhone,
      if (watermarkJson != null) 'watermark_json': watermarkJson,
      if (notes != null) 'notes': notes,
      if (createdAt != null) 'created_at': createdAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  CachedTaskProofsCompanion copyWith(
      {Value<String>? id,
      Value<String>? workspaceId,
      Value<String>? taskId,
      Value<String?>? visitId,
      Value<String>? userId,
      Value<String>? proofType,
      Value<String>? fileKey,
      Value<String?>? fileUrl,
      Value<String?>? signerName,
      Value<String?>? signerPhone,
      Value<String?>? watermarkJson,
      Value<String?>? notes,
      Value<DateTime>? createdAt,
      Value<int>? rowid}) {
    return CachedTaskProofsCompanion(
      id: id ?? this.id,
      workspaceId: workspaceId ?? this.workspaceId,
      taskId: taskId ?? this.taskId,
      visitId: visitId ?? this.visitId,
      userId: userId ?? this.userId,
      proofType: proofType ?? this.proofType,
      fileKey: fileKey ?? this.fileKey,
      fileUrl: fileUrl ?? this.fileUrl,
      signerName: signerName ?? this.signerName,
      signerPhone: signerPhone ?? this.signerPhone,
      watermarkJson: watermarkJson ?? this.watermarkJson,
      notes: notes ?? this.notes,
      createdAt: createdAt ?? this.createdAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (workspaceId.present) {
      map['workspace_id'] = Variable<String>(workspaceId.value);
    }
    if (taskId.present) {
      map['task_id'] = Variable<String>(taskId.value);
    }
    if (visitId.present) {
      map['visit_id'] = Variable<String>(visitId.value);
    }
    if (userId.present) {
      map['user_id'] = Variable<String>(userId.value);
    }
    if (proofType.present) {
      map['proof_type'] = Variable<String>(proofType.value);
    }
    if (fileKey.present) {
      map['file_key'] = Variable<String>(fileKey.value);
    }
    if (fileUrl.present) {
      map['file_url'] = Variable<String>(fileUrl.value);
    }
    if (signerName.present) {
      map['signer_name'] = Variable<String>(signerName.value);
    }
    if (signerPhone.present) {
      map['signer_phone'] = Variable<String>(signerPhone.value);
    }
    if (watermarkJson.present) {
      map['watermark_json'] = Variable<String>(watermarkJson.value);
    }
    if (notes.present) {
      map['notes'] = Variable<String>(notes.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('CachedTaskProofsCompanion(')
          ..write('id: $id, ')
          ..write('workspaceId: $workspaceId, ')
          ..write('taskId: $taskId, ')
          ..write('visitId: $visitId, ')
          ..write('userId: $userId, ')
          ..write('proofType: $proofType, ')
          ..write('fileKey: $fileKey, ')
          ..write('fileUrl: $fileUrl, ')
          ..write('signerName: $signerName, ')
          ..write('signerPhone: $signerPhone, ')
          ..write('watermarkJson: $watermarkJson, ')
          ..write('notes: $notes, ')
          ..write('createdAt: $createdAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $CachedLocationsTable extends CachedLocations
    with TableInfo<$CachedLocationsTable, CachedLocation> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $CachedLocationsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _workspaceIdMeta =
      const VerificationMeta('workspaceId');
  @override
  late final GeneratedColumn<String> workspaceId = GeneratedColumn<String>(
      'workspace_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _userIdMeta = const VerificationMeta('userId');
  @override
  late final GeneratedColumn<String> userId = GeneratedColumn<String>(
      'user_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _sessionIdMeta =
      const VerificationMeta('sessionId');
  @override
  late final GeneratedColumn<String> sessionId = GeneratedColumn<String>(
      'session_id', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _latitudeMeta =
      const VerificationMeta('latitude');
  @override
  late final GeneratedColumn<double> latitude = GeneratedColumn<double>(
      'latitude', aliasedName, false,
      type: DriftSqlType.double, requiredDuringInsert: true);
  static const VerificationMeta _longitudeMeta =
      const VerificationMeta('longitude');
  @override
  late final GeneratedColumn<double> longitude = GeneratedColumn<double>(
      'longitude', aliasedName, false,
      type: DriftSqlType.double, requiredDuringInsert: true);
  static const VerificationMeta _accuracyMeta =
      const VerificationMeta('accuracy');
  @override
  late final GeneratedColumn<double> accuracy = GeneratedColumn<double>(
      'accuracy', aliasedName, false,
      type: DriftSqlType.double, requiredDuringInsert: true);
  static const VerificationMeta _speedMeta = const VerificationMeta('speed');
  @override
  late final GeneratedColumn<double> speed = GeneratedColumn<double>(
      'speed', aliasedName, true,
      type: DriftSqlType.double, requiredDuringInsert: false);
  static const VerificationMeta _headingMeta =
      const VerificationMeta('heading');
  @override
  late final GeneratedColumn<double> heading = GeneratedColumn<double>(
      'heading', aliasedName, true,
      type: DriftSqlType.double, requiredDuringInsert: false);
  static const VerificationMeta _altitudeMeta =
      const VerificationMeta('altitude');
  @override
  late final GeneratedColumn<double> altitude = GeneratedColumn<double>(
      'altitude', aliasedName, true,
      type: DriftSqlType.double, requiredDuringInsert: false);
  static const VerificationMeta _batteryLevelMeta =
      const VerificationMeta('batteryLevel');
  @override
  late final GeneratedColumn<double> batteryLevel = GeneratedColumn<double>(
      'battery_level', aliasedName, true,
      type: DriftSqlType.double, requiredDuringInsert: false);
  static const VerificationMeta _isChargingMeta =
      const VerificationMeta('isCharging');
  @override
  late final GeneratedColumn<bool> isCharging = GeneratedColumn<bool>(
      'is_charging', aliasedName, true,
      type: DriftSqlType.bool,
      requiredDuringInsert: false,
      defaultConstraints: GeneratedColumn.constraintIsAlways(
          'CHECK ("is_charging" IN (0, 1))'));
  static const VerificationMeta _activityTypeMeta =
      const VerificationMeta('activityType');
  @override
  late final GeneratedColumn<String> activityType = GeneratedColumn<String>(
      'activity_type', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _isMovingMeta =
      const VerificationMeta('isMoving');
  @override
  late final GeneratedColumn<bool> isMoving = GeneratedColumn<bool>(
      'is_moving', aliasedName, true,
      type: DriftSqlType.bool,
      requiredDuringInsert: false,
      defaultConstraints:
          GeneratedColumn.constraintIsAlways('CHECK ("is_moving" IN (0, 1))'));
  static const VerificationMeta _recordedAtMeta =
      const VerificationMeta('recordedAt');
  @override
  late final GeneratedColumn<DateTime> recordedAt = GeneratedColumn<DateTime>(
      'recorded_at', aliasedName, false,
      type: DriftSqlType.dateTime, requiredDuringInsert: true);
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
      'status', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant('PENDING'));
  static const VerificationMeta _attemptCountMeta =
      const VerificationMeta('attemptCount');
  @override
  late final GeneratedColumn<int> attemptCount = GeneratedColumn<int>(
      'attempt_count', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _lastErrorMeta =
      const VerificationMeta('lastError');
  @override
  late final GeneratedColumn<String> lastError = GeneratedColumn<String>(
      'last_error', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _createdAtMeta =
      const VerificationMeta('createdAt');
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
      'created_at', aliasedName, false,
      type: DriftSqlType.dateTime,
      requiredDuringInsert: false,
      defaultValue: currentDateAndTime);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        workspaceId,
        userId,
        sessionId,
        latitude,
        longitude,
        accuracy,
        speed,
        heading,
        altitude,
        batteryLevel,
        isCharging,
        activityType,
        isMoving,
        recordedAt,
        status,
        attemptCount,
        lastError,
        createdAt
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'cached_locations';
  @override
  VerificationContext validateIntegrity(Insertable<CachedLocation> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('workspace_id')) {
      context.handle(
          _workspaceIdMeta,
          workspaceId.isAcceptableOrUnknown(
              data['workspace_id']!, _workspaceIdMeta));
    } else if (isInserting) {
      context.missing(_workspaceIdMeta);
    }
    if (data.containsKey('user_id')) {
      context.handle(_userIdMeta,
          userId.isAcceptableOrUnknown(data['user_id']!, _userIdMeta));
    } else if (isInserting) {
      context.missing(_userIdMeta);
    }
    if (data.containsKey('session_id')) {
      context.handle(_sessionIdMeta,
          sessionId.isAcceptableOrUnknown(data['session_id']!, _sessionIdMeta));
    }
    if (data.containsKey('latitude')) {
      context.handle(_latitudeMeta,
          latitude.isAcceptableOrUnknown(data['latitude']!, _latitudeMeta));
    } else if (isInserting) {
      context.missing(_latitudeMeta);
    }
    if (data.containsKey('longitude')) {
      context.handle(_longitudeMeta,
          longitude.isAcceptableOrUnknown(data['longitude']!, _longitudeMeta));
    } else if (isInserting) {
      context.missing(_longitudeMeta);
    }
    if (data.containsKey('accuracy')) {
      context.handle(_accuracyMeta,
          accuracy.isAcceptableOrUnknown(data['accuracy']!, _accuracyMeta));
    } else if (isInserting) {
      context.missing(_accuracyMeta);
    }
    if (data.containsKey('speed')) {
      context.handle(
          _speedMeta, speed.isAcceptableOrUnknown(data['speed']!, _speedMeta));
    }
    if (data.containsKey('heading')) {
      context.handle(_headingMeta,
          heading.isAcceptableOrUnknown(data['heading']!, _headingMeta));
    }
    if (data.containsKey('altitude')) {
      context.handle(_altitudeMeta,
          altitude.isAcceptableOrUnknown(data['altitude']!, _altitudeMeta));
    }
    if (data.containsKey('battery_level')) {
      context.handle(
          _batteryLevelMeta,
          batteryLevel.isAcceptableOrUnknown(
              data['battery_level']!, _batteryLevelMeta));
    }
    if (data.containsKey('is_charging')) {
      context.handle(
          _isChargingMeta,
          isCharging.isAcceptableOrUnknown(
              data['is_charging']!, _isChargingMeta));
    }
    if (data.containsKey('activity_type')) {
      context.handle(
          _activityTypeMeta,
          activityType.isAcceptableOrUnknown(
              data['activity_type']!, _activityTypeMeta));
    }
    if (data.containsKey('is_moving')) {
      context.handle(_isMovingMeta,
          isMoving.isAcceptableOrUnknown(data['is_moving']!, _isMovingMeta));
    }
    if (data.containsKey('recorded_at')) {
      context.handle(
          _recordedAtMeta,
          recordedAt.isAcceptableOrUnknown(
              data['recorded_at']!, _recordedAtMeta));
    } else if (isInserting) {
      context.missing(_recordedAtMeta);
    }
    if (data.containsKey('status')) {
      context.handle(_statusMeta,
          status.isAcceptableOrUnknown(data['status']!, _statusMeta));
    }
    if (data.containsKey('attempt_count')) {
      context.handle(
          _attemptCountMeta,
          attemptCount.isAcceptableOrUnknown(
              data['attempt_count']!, _attemptCountMeta));
    }
    if (data.containsKey('last_error')) {
      context.handle(_lastErrorMeta,
          lastError.isAcceptableOrUnknown(data['last_error']!, _lastErrorMeta));
    }
    if (data.containsKey('created_at')) {
      context.handle(_createdAtMeta,
          createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  CachedLocation map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return CachedLocation(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      workspaceId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}workspace_id'])!,
      userId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}user_id'])!,
      sessionId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}session_id']),
      latitude: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}latitude'])!,
      longitude: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}longitude'])!,
      accuracy: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}accuracy'])!,
      speed: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}speed']),
      heading: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}heading']),
      altitude: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}altitude']),
      batteryLevel: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}battery_level']),
      isCharging: attachedDatabase.typeMapping
          .read(DriftSqlType.bool, data['${effectivePrefix}is_charging']),
      activityType: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}activity_type']),
      isMoving: attachedDatabase.typeMapping
          .read(DriftSqlType.bool, data['${effectivePrefix}is_moving']),
      recordedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}recorded_at'])!,
      status: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}status'])!,
      attemptCount: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}attempt_count'])!,
      lastError: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}last_error']),
      createdAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}created_at'])!,
    );
  }

  @override
  $CachedLocationsTable createAlias(String alias) {
    return $CachedLocationsTable(attachedDatabase, alias);
  }
}

class CachedLocation extends DataClass implements Insertable<CachedLocation> {
  final String id;
  final String workspaceId;
  final String userId;
  final String? sessionId;
  final double latitude;
  final double longitude;
  final double accuracy;
  final double? speed;
  final double? heading;
  final double? altitude;
  final double? batteryLevel;
  final bool? isCharging;
  final String? activityType;
  final bool? isMoving;
  final DateTime recordedAt;
  final String status;
  final int attemptCount;
  final String? lastError;
  final DateTime createdAt;
  const CachedLocation(
      {required this.id,
      required this.workspaceId,
      required this.userId,
      this.sessionId,
      required this.latitude,
      required this.longitude,
      required this.accuracy,
      this.speed,
      this.heading,
      this.altitude,
      this.batteryLevel,
      this.isCharging,
      this.activityType,
      this.isMoving,
      required this.recordedAt,
      required this.status,
      required this.attemptCount,
      this.lastError,
      required this.createdAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['workspace_id'] = Variable<String>(workspaceId);
    map['user_id'] = Variable<String>(userId);
    if (!nullToAbsent || sessionId != null) {
      map['session_id'] = Variable<String>(sessionId);
    }
    map['latitude'] = Variable<double>(latitude);
    map['longitude'] = Variable<double>(longitude);
    map['accuracy'] = Variable<double>(accuracy);
    if (!nullToAbsent || speed != null) {
      map['speed'] = Variable<double>(speed);
    }
    if (!nullToAbsent || heading != null) {
      map['heading'] = Variable<double>(heading);
    }
    if (!nullToAbsent || altitude != null) {
      map['altitude'] = Variable<double>(altitude);
    }
    if (!nullToAbsent || batteryLevel != null) {
      map['battery_level'] = Variable<double>(batteryLevel);
    }
    if (!nullToAbsent || isCharging != null) {
      map['is_charging'] = Variable<bool>(isCharging);
    }
    if (!nullToAbsent || activityType != null) {
      map['activity_type'] = Variable<String>(activityType);
    }
    if (!nullToAbsent || isMoving != null) {
      map['is_moving'] = Variable<bool>(isMoving);
    }
    map['recorded_at'] = Variable<DateTime>(recordedAt);
    map['status'] = Variable<String>(status);
    map['attempt_count'] = Variable<int>(attemptCount);
    if (!nullToAbsent || lastError != null) {
      map['last_error'] = Variable<String>(lastError);
    }
    map['created_at'] = Variable<DateTime>(createdAt);
    return map;
  }

  CachedLocationsCompanion toCompanion(bool nullToAbsent) {
    return CachedLocationsCompanion(
      id: Value(id),
      workspaceId: Value(workspaceId),
      userId: Value(userId),
      sessionId: sessionId == null && nullToAbsent
          ? const Value.absent()
          : Value(sessionId),
      latitude: Value(latitude),
      longitude: Value(longitude),
      accuracy: Value(accuracy),
      speed:
          speed == null && nullToAbsent ? const Value.absent() : Value(speed),
      heading: heading == null && nullToAbsent
          ? const Value.absent()
          : Value(heading),
      altitude: altitude == null && nullToAbsent
          ? const Value.absent()
          : Value(altitude),
      batteryLevel: batteryLevel == null && nullToAbsent
          ? const Value.absent()
          : Value(batteryLevel),
      isCharging: isCharging == null && nullToAbsent
          ? const Value.absent()
          : Value(isCharging),
      activityType: activityType == null && nullToAbsent
          ? const Value.absent()
          : Value(activityType),
      isMoving: isMoving == null && nullToAbsent
          ? const Value.absent()
          : Value(isMoving),
      recordedAt: Value(recordedAt),
      status: Value(status),
      attemptCount: Value(attemptCount),
      lastError: lastError == null && nullToAbsent
          ? const Value.absent()
          : Value(lastError),
      createdAt: Value(createdAt),
    );
  }

  factory CachedLocation.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return CachedLocation(
      id: serializer.fromJson<String>(json['id']),
      workspaceId: serializer.fromJson<String>(json['workspaceId']),
      userId: serializer.fromJson<String>(json['userId']),
      sessionId: serializer.fromJson<String?>(json['sessionId']),
      latitude: serializer.fromJson<double>(json['latitude']),
      longitude: serializer.fromJson<double>(json['longitude']),
      accuracy: serializer.fromJson<double>(json['accuracy']),
      speed: serializer.fromJson<double?>(json['speed']),
      heading: serializer.fromJson<double?>(json['heading']),
      altitude: serializer.fromJson<double?>(json['altitude']),
      batteryLevel: serializer.fromJson<double?>(json['batteryLevel']),
      isCharging: serializer.fromJson<bool?>(json['isCharging']),
      activityType: serializer.fromJson<String?>(json['activityType']),
      isMoving: serializer.fromJson<bool?>(json['isMoving']),
      recordedAt: serializer.fromJson<DateTime>(json['recordedAt']),
      status: serializer.fromJson<String>(json['status']),
      attemptCount: serializer.fromJson<int>(json['attemptCount']),
      lastError: serializer.fromJson<String?>(json['lastError']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'workspaceId': serializer.toJson<String>(workspaceId),
      'userId': serializer.toJson<String>(userId),
      'sessionId': serializer.toJson<String?>(sessionId),
      'latitude': serializer.toJson<double>(latitude),
      'longitude': serializer.toJson<double>(longitude),
      'accuracy': serializer.toJson<double>(accuracy),
      'speed': serializer.toJson<double?>(speed),
      'heading': serializer.toJson<double?>(heading),
      'altitude': serializer.toJson<double?>(altitude),
      'batteryLevel': serializer.toJson<double?>(batteryLevel),
      'isCharging': serializer.toJson<bool?>(isCharging),
      'activityType': serializer.toJson<String?>(activityType),
      'isMoving': serializer.toJson<bool?>(isMoving),
      'recordedAt': serializer.toJson<DateTime>(recordedAt),
      'status': serializer.toJson<String>(status),
      'attemptCount': serializer.toJson<int>(attemptCount),
      'lastError': serializer.toJson<String?>(lastError),
      'createdAt': serializer.toJson<DateTime>(createdAt),
    };
  }

  CachedLocation copyWith(
          {String? id,
          String? workspaceId,
          String? userId,
          Value<String?> sessionId = const Value.absent(),
          double? latitude,
          double? longitude,
          double? accuracy,
          Value<double?> speed = const Value.absent(),
          Value<double?> heading = const Value.absent(),
          Value<double?> altitude = const Value.absent(),
          Value<double?> batteryLevel = const Value.absent(),
          Value<bool?> isCharging = const Value.absent(),
          Value<String?> activityType = const Value.absent(),
          Value<bool?> isMoving = const Value.absent(),
          DateTime? recordedAt,
          String? status,
          int? attemptCount,
          Value<String?> lastError = const Value.absent(),
          DateTime? createdAt}) =>
      CachedLocation(
        id: id ?? this.id,
        workspaceId: workspaceId ?? this.workspaceId,
        userId: userId ?? this.userId,
        sessionId: sessionId.present ? sessionId.value : this.sessionId,
        latitude: latitude ?? this.latitude,
        longitude: longitude ?? this.longitude,
        accuracy: accuracy ?? this.accuracy,
        speed: speed.present ? speed.value : this.speed,
        heading: heading.present ? heading.value : this.heading,
        altitude: altitude.present ? altitude.value : this.altitude,
        batteryLevel:
            batteryLevel.present ? batteryLevel.value : this.batteryLevel,
        isCharging: isCharging.present ? isCharging.value : this.isCharging,
        activityType:
            activityType.present ? activityType.value : this.activityType,
        isMoving: isMoving.present ? isMoving.value : this.isMoving,
        recordedAt: recordedAt ?? this.recordedAt,
        status: status ?? this.status,
        attemptCount: attemptCount ?? this.attemptCount,
        lastError: lastError.present ? lastError.value : this.lastError,
        createdAt: createdAt ?? this.createdAt,
      );
  CachedLocation copyWithCompanion(CachedLocationsCompanion data) {
    return CachedLocation(
      id: data.id.present ? data.id.value : this.id,
      workspaceId:
          data.workspaceId.present ? data.workspaceId.value : this.workspaceId,
      userId: data.userId.present ? data.userId.value : this.userId,
      sessionId: data.sessionId.present ? data.sessionId.value : this.sessionId,
      latitude: data.latitude.present ? data.latitude.value : this.latitude,
      longitude: data.longitude.present ? data.longitude.value : this.longitude,
      accuracy: data.accuracy.present ? data.accuracy.value : this.accuracy,
      speed: data.speed.present ? data.speed.value : this.speed,
      heading: data.heading.present ? data.heading.value : this.heading,
      altitude: data.altitude.present ? data.altitude.value : this.altitude,
      batteryLevel: data.batteryLevel.present
          ? data.batteryLevel.value
          : this.batteryLevel,
      isCharging:
          data.isCharging.present ? data.isCharging.value : this.isCharging,
      activityType: data.activityType.present
          ? data.activityType.value
          : this.activityType,
      isMoving: data.isMoving.present ? data.isMoving.value : this.isMoving,
      recordedAt:
          data.recordedAt.present ? data.recordedAt.value : this.recordedAt,
      status: data.status.present ? data.status.value : this.status,
      attemptCount: data.attemptCount.present
          ? data.attemptCount.value
          : this.attemptCount,
      lastError: data.lastError.present ? data.lastError.value : this.lastError,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('CachedLocation(')
          ..write('id: $id, ')
          ..write('workspaceId: $workspaceId, ')
          ..write('userId: $userId, ')
          ..write('sessionId: $sessionId, ')
          ..write('latitude: $latitude, ')
          ..write('longitude: $longitude, ')
          ..write('accuracy: $accuracy, ')
          ..write('speed: $speed, ')
          ..write('heading: $heading, ')
          ..write('altitude: $altitude, ')
          ..write('batteryLevel: $batteryLevel, ')
          ..write('isCharging: $isCharging, ')
          ..write('activityType: $activityType, ')
          ..write('isMoving: $isMoving, ')
          ..write('recordedAt: $recordedAt, ')
          ..write('status: $status, ')
          ..write('attemptCount: $attemptCount, ')
          ..write('lastError: $lastError, ')
          ..write('createdAt: $createdAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
      id,
      workspaceId,
      userId,
      sessionId,
      latitude,
      longitude,
      accuracy,
      speed,
      heading,
      altitude,
      batteryLevel,
      isCharging,
      activityType,
      isMoving,
      recordedAt,
      status,
      attemptCount,
      lastError,
      createdAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is CachedLocation &&
          other.id == this.id &&
          other.workspaceId == this.workspaceId &&
          other.userId == this.userId &&
          other.sessionId == this.sessionId &&
          other.latitude == this.latitude &&
          other.longitude == this.longitude &&
          other.accuracy == this.accuracy &&
          other.speed == this.speed &&
          other.heading == this.heading &&
          other.altitude == this.altitude &&
          other.batteryLevel == this.batteryLevel &&
          other.isCharging == this.isCharging &&
          other.activityType == this.activityType &&
          other.isMoving == this.isMoving &&
          other.recordedAt == this.recordedAt &&
          other.status == this.status &&
          other.attemptCount == this.attemptCount &&
          other.lastError == this.lastError &&
          other.createdAt == this.createdAt);
}

class CachedLocationsCompanion extends UpdateCompanion<CachedLocation> {
  final Value<String> id;
  final Value<String> workspaceId;
  final Value<String> userId;
  final Value<String?> sessionId;
  final Value<double> latitude;
  final Value<double> longitude;
  final Value<double> accuracy;
  final Value<double?> speed;
  final Value<double?> heading;
  final Value<double?> altitude;
  final Value<double?> batteryLevel;
  final Value<bool?> isCharging;
  final Value<String?> activityType;
  final Value<bool?> isMoving;
  final Value<DateTime> recordedAt;
  final Value<String> status;
  final Value<int> attemptCount;
  final Value<String?> lastError;
  final Value<DateTime> createdAt;
  final Value<int> rowid;
  const CachedLocationsCompanion({
    this.id = const Value.absent(),
    this.workspaceId = const Value.absent(),
    this.userId = const Value.absent(),
    this.sessionId = const Value.absent(),
    this.latitude = const Value.absent(),
    this.longitude = const Value.absent(),
    this.accuracy = const Value.absent(),
    this.speed = const Value.absent(),
    this.heading = const Value.absent(),
    this.altitude = const Value.absent(),
    this.batteryLevel = const Value.absent(),
    this.isCharging = const Value.absent(),
    this.activityType = const Value.absent(),
    this.isMoving = const Value.absent(),
    this.recordedAt = const Value.absent(),
    this.status = const Value.absent(),
    this.attemptCount = const Value.absent(),
    this.lastError = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  CachedLocationsCompanion.insert({
    required String id,
    required String workspaceId,
    required String userId,
    this.sessionId = const Value.absent(),
    required double latitude,
    required double longitude,
    required double accuracy,
    this.speed = const Value.absent(),
    this.heading = const Value.absent(),
    this.altitude = const Value.absent(),
    this.batteryLevel = const Value.absent(),
    this.isCharging = const Value.absent(),
    this.activityType = const Value.absent(),
    this.isMoving = const Value.absent(),
    required DateTime recordedAt,
    this.status = const Value.absent(),
    this.attemptCount = const Value.absent(),
    this.lastError = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        workspaceId = Value(workspaceId),
        userId = Value(userId),
        latitude = Value(latitude),
        longitude = Value(longitude),
        accuracy = Value(accuracy),
        recordedAt = Value(recordedAt);
  static Insertable<CachedLocation> custom({
    Expression<String>? id,
    Expression<String>? workspaceId,
    Expression<String>? userId,
    Expression<String>? sessionId,
    Expression<double>? latitude,
    Expression<double>? longitude,
    Expression<double>? accuracy,
    Expression<double>? speed,
    Expression<double>? heading,
    Expression<double>? altitude,
    Expression<double>? batteryLevel,
    Expression<bool>? isCharging,
    Expression<String>? activityType,
    Expression<bool>? isMoving,
    Expression<DateTime>? recordedAt,
    Expression<String>? status,
    Expression<int>? attemptCount,
    Expression<String>? lastError,
    Expression<DateTime>? createdAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (workspaceId != null) 'workspace_id': workspaceId,
      if (userId != null) 'user_id': userId,
      if (sessionId != null) 'session_id': sessionId,
      if (latitude != null) 'latitude': latitude,
      if (longitude != null) 'longitude': longitude,
      if (accuracy != null) 'accuracy': accuracy,
      if (speed != null) 'speed': speed,
      if (heading != null) 'heading': heading,
      if (altitude != null) 'altitude': altitude,
      if (batteryLevel != null) 'battery_level': batteryLevel,
      if (isCharging != null) 'is_charging': isCharging,
      if (activityType != null) 'activity_type': activityType,
      if (isMoving != null) 'is_moving': isMoving,
      if (recordedAt != null) 'recorded_at': recordedAt,
      if (status != null) 'status': status,
      if (attemptCount != null) 'attempt_count': attemptCount,
      if (lastError != null) 'last_error': lastError,
      if (createdAt != null) 'created_at': createdAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  CachedLocationsCompanion copyWith(
      {Value<String>? id,
      Value<String>? workspaceId,
      Value<String>? userId,
      Value<String?>? sessionId,
      Value<double>? latitude,
      Value<double>? longitude,
      Value<double>? accuracy,
      Value<double?>? speed,
      Value<double?>? heading,
      Value<double?>? altitude,
      Value<double?>? batteryLevel,
      Value<bool?>? isCharging,
      Value<String?>? activityType,
      Value<bool?>? isMoving,
      Value<DateTime>? recordedAt,
      Value<String>? status,
      Value<int>? attemptCount,
      Value<String?>? lastError,
      Value<DateTime>? createdAt,
      Value<int>? rowid}) {
    return CachedLocationsCompanion(
      id: id ?? this.id,
      workspaceId: workspaceId ?? this.workspaceId,
      userId: userId ?? this.userId,
      sessionId: sessionId ?? this.sessionId,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      accuracy: accuracy ?? this.accuracy,
      speed: speed ?? this.speed,
      heading: heading ?? this.heading,
      altitude: altitude ?? this.altitude,
      batteryLevel: batteryLevel ?? this.batteryLevel,
      isCharging: isCharging ?? this.isCharging,
      activityType: activityType ?? this.activityType,
      isMoving: isMoving ?? this.isMoving,
      recordedAt: recordedAt ?? this.recordedAt,
      status: status ?? this.status,
      attemptCount: attemptCount ?? this.attemptCount,
      lastError: lastError ?? this.lastError,
      createdAt: createdAt ?? this.createdAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (workspaceId.present) {
      map['workspace_id'] = Variable<String>(workspaceId.value);
    }
    if (userId.present) {
      map['user_id'] = Variable<String>(userId.value);
    }
    if (sessionId.present) {
      map['session_id'] = Variable<String>(sessionId.value);
    }
    if (latitude.present) {
      map['latitude'] = Variable<double>(latitude.value);
    }
    if (longitude.present) {
      map['longitude'] = Variable<double>(longitude.value);
    }
    if (accuracy.present) {
      map['accuracy'] = Variable<double>(accuracy.value);
    }
    if (speed.present) {
      map['speed'] = Variable<double>(speed.value);
    }
    if (heading.present) {
      map['heading'] = Variable<double>(heading.value);
    }
    if (altitude.present) {
      map['altitude'] = Variable<double>(altitude.value);
    }
    if (batteryLevel.present) {
      map['battery_level'] = Variable<double>(batteryLevel.value);
    }
    if (isCharging.present) {
      map['is_charging'] = Variable<bool>(isCharging.value);
    }
    if (activityType.present) {
      map['activity_type'] = Variable<String>(activityType.value);
    }
    if (isMoving.present) {
      map['is_moving'] = Variable<bool>(isMoving.value);
    }
    if (recordedAt.present) {
      map['recorded_at'] = Variable<DateTime>(recordedAt.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (attemptCount.present) {
      map['attempt_count'] = Variable<int>(attemptCount.value);
    }
    if (lastError.present) {
      map['last_error'] = Variable<String>(lastError.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('CachedLocationsCompanion(')
          ..write('id: $id, ')
          ..write('workspaceId: $workspaceId, ')
          ..write('userId: $userId, ')
          ..write('sessionId: $sessionId, ')
          ..write('latitude: $latitude, ')
          ..write('longitude: $longitude, ')
          ..write('accuracy: $accuracy, ')
          ..write('speed: $speed, ')
          ..write('heading: $heading, ')
          ..write('altitude: $altitude, ')
          ..write('batteryLevel: $batteryLevel, ')
          ..write('isCharging: $isCharging, ')
          ..write('activityType: $activityType, ')
          ..write('isMoving: $isMoving, ')
          ..write('recordedAt: $recordedAt, ')
          ..write('status: $status, ')
          ..write('attemptCount: $attemptCount, ')
          ..write('lastError: $lastError, ')
          ..write('createdAt: $createdAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

abstract class _$AppDatabase extends GeneratedDatabase {
  _$AppDatabase(QueryExecutor e) : super(e);
  $AppDatabaseManager get managers => $AppDatabaseManager(this);
  late final $OutboxMutationsTable outboxMutations =
      $OutboxMutationsTable(this);
  late final $CachedTasksTable cachedTasks = $CachedTasksTable(this);
  late final $CachedChecklistItemsTable cachedChecklistItems =
      $CachedChecklistItemsTable(this);
  late final $CachedAttendanceTable cachedAttendance =
      $CachedAttendanceTable(this);
  late final $CachedVisitsTable cachedVisits = $CachedVisitsTable(this);
  late final $CachedTaskProofsTable cachedTaskProofs =
      $CachedTaskProofsTable(this);
  late final $CachedLocationsTable cachedLocations =
      $CachedLocationsTable(this);
  @override
  Iterable<TableInfo<Table, Object?>> get allTables =>
      allSchemaEntities.whereType<TableInfo<Table, Object?>>();
  @override
  List<DatabaseSchemaEntity> get allSchemaEntities => [
        outboxMutations,
        cachedTasks,
        cachedChecklistItems,
        cachedAttendance,
        cachedVisits,
        cachedTaskProofs,
        cachedLocations
      ];
}

typedef $$OutboxMutationsTableCreateCompanionBuilder = OutboxMutationsCompanion
    Function({
  required String id,
  required String workspaceId,
  required String entityType,
  required String entityId,
  required String mutationType,
  required String payload,
  required String idempotencyKey,
  Value<int> attemptCount,
  Value<String> status,
  Value<String?> lastError,
  Value<DateTime> createdAt,
  Value<DateTime> updatedAt,
  Value<int> rowid,
});
typedef $$OutboxMutationsTableUpdateCompanionBuilder = OutboxMutationsCompanion
    Function({
  Value<String> id,
  Value<String> workspaceId,
  Value<String> entityType,
  Value<String> entityId,
  Value<String> mutationType,
  Value<String> payload,
  Value<String> idempotencyKey,
  Value<int> attemptCount,
  Value<String> status,
  Value<String?> lastError,
  Value<DateTime> createdAt,
  Value<DateTime> updatedAt,
  Value<int> rowid,
});

class $$OutboxMutationsTableFilterComposer
    extends Composer<_$AppDatabase, $OutboxMutationsTable> {
  $$OutboxMutationsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get workspaceId => $composableBuilder(
      column: $table.workspaceId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get entityType => $composableBuilder(
      column: $table.entityType, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get entityId => $composableBuilder(
      column: $table.entityId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get mutationType => $composableBuilder(
      column: $table.mutationType, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get payload => $composableBuilder(
      column: $table.payload, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get idempotencyKey => $composableBuilder(
      column: $table.idempotencyKey,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get attemptCount => $composableBuilder(
      column: $table.attemptCount, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get status => $composableBuilder(
      column: $table.status, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get lastError => $composableBuilder(
      column: $table.lastError, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnFilters(column));
}

class $$OutboxMutationsTableOrderingComposer
    extends Composer<_$AppDatabase, $OutboxMutationsTable> {
  $$OutboxMutationsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get workspaceId => $composableBuilder(
      column: $table.workspaceId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get entityType => $composableBuilder(
      column: $table.entityType, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get entityId => $composableBuilder(
      column: $table.entityId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get mutationType => $composableBuilder(
      column: $table.mutationType,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get payload => $composableBuilder(
      column: $table.payload, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get idempotencyKey => $composableBuilder(
      column: $table.idempotencyKey,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get attemptCount => $composableBuilder(
      column: $table.attemptCount,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get status => $composableBuilder(
      column: $table.status, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get lastError => $composableBuilder(
      column: $table.lastError, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnOrderings(column));
}

class $$OutboxMutationsTableAnnotationComposer
    extends Composer<_$AppDatabase, $OutboxMutationsTable> {
  $$OutboxMutationsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get workspaceId => $composableBuilder(
      column: $table.workspaceId, builder: (column) => column);

  GeneratedColumn<String> get entityType => $composableBuilder(
      column: $table.entityType, builder: (column) => column);

  GeneratedColumn<String> get entityId =>
      $composableBuilder(column: $table.entityId, builder: (column) => column);

  GeneratedColumn<String> get mutationType => $composableBuilder(
      column: $table.mutationType, builder: (column) => column);

  GeneratedColumn<String> get payload =>
      $composableBuilder(column: $table.payload, builder: (column) => column);

  GeneratedColumn<String> get idempotencyKey => $composableBuilder(
      column: $table.idempotencyKey, builder: (column) => column);

  GeneratedColumn<int> get attemptCount => $composableBuilder(
      column: $table.attemptCount, builder: (column) => column);

  GeneratedColumn<String> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);

  GeneratedColumn<String> get lastError =>
      $composableBuilder(column: $table.lastError, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
}

class $$OutboxMutationsTableTableManager extends RootTableManager<
    _$AppDatabase,
    $OutboxMutationsTable,
    OutboxMutation,
    $$OutboxMutationsTableFilterComposer,
    $$OutboxMutationsTableOrderingComposer,
    $$OutboxMutationsTableAnnotationComposer,
    $$OutboxMutationsTableCreateCompanionBuilder,
    $$OutboxMutationsTableUpdateCompanionBuilder,
    (
      OutboxMutation,
      BaseReferences<_$AppDatabase, $OutboxMutationsTable, OutboxMutation>
    ),
    OutboxMutation,
    PrefetchHooks Function()> {
  $$OutboxMutationsTableTableManager(
      _$AppDatabase db, $OutboxMutationsTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$OutboxMutationsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$OutboxMutationsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$OutboxMutationsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> id = const Value.absent(),
            Value<String> workspaceId = const Value.absent(),
            Value<String> entityType = const Value.absent(),
            Value<String> entityId = const Value.absent(),
            Value<String> mutationType = const Value.absent(),
            Value<String> payload = const Value.absent(),
            Value<String> idempotencyKey = const Value.absent(),
            Value<int> attemptCount = const Value.absent(),
            Value<String> status = const Value.absent(),
            Value<String?> lastError = const Value.absent(),
            Value<DateTime> createdAt = const Value.absent(),
            Value<DateTime> updatedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              OutboxMutationsCompanion(
            id: id,
            workspaceId: workspaceId,
            entityType: entityType,
            entityId: entityId,
            mutationType: mutationType,
            payload: payload,
            idempotencyKey: idempotencyKey,
            attemptCount: attemptCount,
            status: status,
            lastError: lastError,
            createdAt: createdAt,
            updatedAt: updatedAt,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String id,
            required String workspaceId,
            required String entityType,
            required String entityId,
            required String mutationType,
            required String payload,
            required String idempotencyKey,
            Value<int> attemptCount = const Value.absent(),
            Value<String> status = const Value.absent(),
            Value<String?> lastError = const Value.absent(),
            Value<DateTime> createdAt = const Value.absent(),
            Value<DateTime> updatedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              OutboxMutationsCompanion.insert(
            id: id,
            workspaceId: workspaceId,
            entityType: entityType,
            entityId: entityId,
            mutationType: mutationType,
            payload: payload,
            idempotencyKey: idempotencyKey,
            attemptCount: attemptCount,
            status: status,
            lastError: lastError,
            createdAt: createdAt,
            updatedAt: updatedAt,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$OutboxMutationsTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $OutboxMutationsTable,
    OutboxMutation,
    $$OutboxMutationsTableFilterComposer,
    $$OutboxMutationsTableOrderingComposer,
    $$OutboxMutationsTableAnnotationComposer,
    $$OutboxMutationsTableCreateCompanionBuilder,
    $$OutboxMutationsTableUpdateCompanionBuilder,
    (
      OutboxMutation,
      BaseReferences<_$AppDatabase, $OutboxMutationsTable, OutboxMutation>
    ),
    OutboxMutation,
    PrefetchHooks Function()>;
typedef $$CachedTasksTableCreateCompanionBuilder = CachedTasksCompanion
    Function({
  required String id,
  required String workspaceId,
  required String title,
  Value<String?> description,
  required String status,
  required String simplifiedStatus,
  required String priority,
  Value<DateTime?> dueAt,
  Value<String?> customerId,
  Value<String?> customerName,
  Value<String?> siteId,
  Value<String?> siteName,
  Value<bool> requiresPhotoProof,
  Value<bool> requiresSignature,
  Value<String?> verifierName,
  Value<DateTime?> verifiedAt,
  Value<String?> verificationNotes,
  Value<int> version,
  required DateTime createdAt,
  required DateTime updatedAt,
  Value<int> rowid,
});
typedef $$CachedTasksTableUpdateCompanionBuilder = CachedTasksCompanion
    Function({
  Value<String> id,
  Value<String> workspaceId,
  Value<String> title,
  Value<String?> description,
  Value<String> status,
  Value<String> simplifiedStatus,
  Value<String> priority,
  Value<DateTime?> dueAt,
  Value<String?> customerId,
  Value<String?> customerName,
  Value<String?> siteId,
  Value<String?> siteName,
  Value<bool> requiresPhotoProof,
  Value<bool> requiresSignature,
  Value<String?> verifierName,
  Value<DateTime?> verifiedAt,
  Value<String?> verificationNotes,
  Value<int> version,
  Value<DateTime> createdAt,
  Value<DateTime> updatedAt,
  Value<int> rowid,
});

class $$CachedTasksTableFilterComposer
    extends Composer<_$AppDatabase, $CachedTasksTable> {
  $$CachedTasksTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get workspaceId => $composableBuilder(
      column: $table.workspaceId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get title => $composableBuilder(
      column: $table.title, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get description => $composableBuilder(
      column: $table.description, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get status => $composableBuilder(
      column: $table.status, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get simplifiedStatus => $composableBuilder(
      column: $table.simplifiedStatus,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get priority => $composableBuilder(
      column: $table.priority, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get dueAt => $composableBuilder(
      column: $table.dueAt, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get customerId => $composableBuilder(
      column: $table.customerId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get customerName => $composableBuilder(
      column: $table.customerName, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get siteId => $composableBuilder(
      column: $table.siteId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get siteName => $composableBuilder(
      column: $table.siteName, builder: (column) => ColumnFilters(column));

  ColumnFilters<bool> get requiresPhotoProof => $composableBuilder(
      column: $table.requiresPhotoProof,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<bool> get requiresSignature => $composableBuilder(
      column: $table.requiresSignature,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get verifierName => $composableBuilder(
      column: $table.verifierName, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get verifiedAt => $composableBuilder(
      column: $table.verifiedAt, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get verificationNotes => $composableBuilder(
      column: $table.verificationNotes,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get version => $composableBuilder(
      column: $table.version, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnFilters(column));
}

class $$CachedTasksTableOrderingComposer
    extends Composer<_$AppDatabase, $CachedTasksTable> {
  $$CachedTasksTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get workspaceId => $composableBuilder(
      column: $table.workspaceId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get title => $composableBuilder(
      column: $table.title, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get description => $composableBuilder(
      column: $table.description, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get status => $composableBuilder(
      column: $table.status, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get simplifiedStatus => $composableBuilder(
      column: $table.simplifiedStatus,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get priority => $composableBuilder(
      column: $table.priority, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get dueAt => $composableBuilder(
      column: $table.dueAt, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get customerId => $composableBuilder(
      column: $table.customerId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get customerName => $composableBuilder(
      column: $table.customerName,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get siteId => $composableBuilder(
      column: $table.siteId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get siteName => $composableBuilder(
      column: $table.siteName, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<bool> get requiresPhotoProof => $composableBuilder(
      column: $table.requiresPhotoProof,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<bool> get requiresSignature => $composableBuilder(
      column: $table.requiresSignature,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get verifierName => $composableBuilder(
      column: $table.verifierName,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get verifiedAt => $composableBuilder(
      column: $table.verifiedAt, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get verificationNotes => $composableBuilder(
      column: $table.verificationNotes,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get version => $composableBuilder(
      column: $table.version, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnOrderings(column));
}

class $$CachedTasksTableAnnotationComposer
    extends Composer<_$AppDatabase, $CachedTasksTable> {
  $$CachedTasksTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get workspaceId => $composableBuilder(
      column: $table.workspaceId, builder: (column) => column);

  GeneratedColumn<String> get title =>
      $composableBuilder(column: $table.title, builder: (column) => column);

  GeneratedColumn<String> get description => $composableBuilder(
      column: $table.description, builder: (column) => column);

  GeneratedColumn<String> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);

  GeneratedColumn<String> get simplifiedStatus => $composableBuilder(
      column: $table.simplifiedStatus, builder: (column) => column);

  GeneratedColumn<String> get priority =>
      $composableBuilder(column: $table.priority, builder: (column) => column);

  GeneratedColumn<DateTime> get dueAt =>
      $composableBuilder(column: $table.dueAt, builder: (column) => column);

  GeneratedColumn<String> get customerId => $composableBuilder(
      column: $table.customerId, builder: (column) => column);

  GeneratedColumn<String> get customerName => $composableBuilder(
      column: $table.customerName, builder: (column) => column);

  GeneratedColumn<String> get siteId =>
      $composableBuilder(column: $table.siteId, builder: (column) => column);

  GeneratedColumn<String> get siteName =>
      $composableBuilder(column: $table.siteName, builder: (column) => column);

  GeneratedColumn<bool> get requiresPhotoProof => $composableBuilder(
      column: $table.requiresPhotoProof, builder: (column) => column);

  GeneratedColumn<bool> get requiresSignature => $composableBuilder(
      column: $table.requiresSignature, builder: (column) => column);

  GeneratedColumn<String> get verifierName => $composableBuilder(
      column: $table.verifierName, builder: (column) => column);

  GeneratedColumn<DateTime> get verifiedAt => $composableBuilder(
      column: $table.verifiedAt, builder: (column) => column);

  GeneratedColumn<String> get verificationNotes => $composableBuilder(
      column: $table.verificationNotes, builder: (column) => column);

  GeneratedColumn<int> get version =>
      $composableBuilder(column: $table.version, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
}

class $$CachedTasksTableTableManager extends RootTableManager<
    _$AppDatabase,
    $CachedTasksTable,
    CachedTask,
    $$CachedTasksTableFilterComposer,
    $$CachedTasksTableOrderingComposer,
    $$CachedTasksTableAnnotationComposer,
    $$CachedTasksTableCreateCompanionBuilder,
    $$CachedTasksTableUpdateCompanionBuilder,
    (CachedTask, BaseReferences<_$AppDatabase, $CachedTasksTable, CachedTask>),
    CachedTask,
    PrefetchHooks Function()> {
  $$CachedTasksTableTableManager(_$AppDatabase db, $CachedTasksTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$CachedTasksTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$CachedTasksTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$CachedTasksTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> id = const Value.absent(),
            Value<String> workspaceId = const Value.absent(),
            Value<String> title = const Value.absent(),
            Value<String?> description = const Value.absent(),
            Value<String> status = const Value.absent(),
            Value<String> simplifiedStatus = const Value.absent(),
            Value<String> priority = const Value.absent(),
            Value<DateTime?> dueAt = const Value.absent(),
            Value<String?> customerId = const Value.absent(),
            Value<String?> customerName = const Value.absent(),
            Value<String?> siteId = const Value.absent(),
            Value<String?> siteName = const Value.absent(),
            Value<bool> requiresPhotoProof = const Value.absent(),
            Value<bool> requiresSignature = const Value.absent(),
            Value<String?> verifierName = const Value.absent(),
            Value<DateTime?> verifiedAt = const Value.absent(),
            Value<String?> verificationNotes = const Value.absent(),
            Value<int> version = const Value.absent(),
            Value<DateTime> createdAt = const Value.absent(),
            Value<DateTime> updatedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              CachedTasksCompanion(
            id: id,
            workspaceId: workspaceId,
            title: title,
            description: description,
            status: status,
            simplifiedStatus: simplifiedStatus,
            priority: priority,
            dueAt: dueAt,
            customerId: customerId,
            customerName: customerName,
            siteId: siteId,
            siteName: siteName,
            requiresPhotoProof: requiresPhotoProof,
            requiresSignature: requiresSignature,
            verifierName: verifierName,
            verifiedAt: verifiedAt,
            verificationNotes: verificationNotes,
            version: version,
            createdAt: createdAt,
            updatedAt: updatedAt,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String id,
            required String workspaceId,
            required String title,
            Value<String?> description = const Value.absent(),
            required String status,
            required String simplifiedStatus,
            required String priority,
            Value<DateTime?> dueAt = const Value.absent(),
            Value<String?> customerId = const Value.absent(),
            Value<String?> customerName = const Value.absent(),
            Value<String?> siteId = const Value.absent(),
            Value<String?> siteName = const Value.absent(),
            Value<bool> requiresPhotoProof = const Value.absent(),
            Value<bool> requiresSignature = const Value.absent(),
            Value<String?> verifierName = const Value.absent(),
            Value<DateTime?> verifiedAt = const Value.absent(),
            Value<String?> verificationNotes = const Value.absent(),
            Value<int> version = const Value.absent(),
            required DateTime createdAt,
            required DateTime updatedAt,
            Value<int> rowid = const Value.absent(),
          }) =>
              CachedTasksCompanion.insert(
            id: id,
            workspaceId: workspaceId,
            title: title,
            description: description,
            status: status,
            simplifiedStatus: simplifiedStatus,
            priority: priority,
            dueAt: dueAt,
            customerId: customerId,
            customerName: customerName,
            siteId: siteId,
            siteName: siteName,
            requiresPhotoProof: requiresPhotoProof,
            requiresSignature: requiresSignature,
            verifierName: verifierName,
            verifiedAt: verifiedAt,
            verificationNotes: verificationNotes,
            version: version,
            createdAt: createdAt,
            updatedAt: updatedAt,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$CachedTasksTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $CachedTasksTable,
    CachedTask,
    $$CachedTasksTableFilterComposer,
    $$CachedTasksTableOrderingComposer,
    $$CachedTasksTableAnnotationComposer,
    $$CachedTasksTableCreateCompanionBuilder,
    $$CachedTasksTableUpdateCompanionBuilder,
    (CachedTask, BaseReferences<_$AppDatabase, $CachedTasksTable, CachedTask>),
    CachedTask,
    PrefetchHooks Function()>;
typedef $$CachedChecklistItemsTableCreateCompanionBuilder
    = CachedChecklistItemsCompanion Function({
  required String id,
  required String taskId,
  required String title,
  Value<bool> isCompleted,
  Value<int> sortOrder,
  Value<DateTime?> completedAt,
  Value<int> rowid,
});
typedef $$CachedChecklistItemsTableUpdateCompanionBuilder
    = CachedChecklistItemsCompanion Function({
  Value<String> id,
  Value<String> taskId,
  Value<String> title,
  Value<bool> isCompleted,
  Value<int> sortOrder,
  Value<DateTime?> completedAt,
  Value<int> rowid,
});

class $$CachedChecklistItemsTableFilterComposer
    extends Composer<_$AppDatabase, $CachedChecklistItemsTable> {
  $$CachedChecklistItemsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get taskId => $composableBuilder(
      column: $table.taskId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get title => $composableBuilder(
      column: $table.title, builder: (column) => ColumnFilters(column));

  ColumnFilters<bool> get isCompleted => $composableBuilder(
      column: $table.isCompleted, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get sortOrder => $composableBuilder(
      column: $table.sortOrder, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get completedAt => $composableBuilder(
      column: $table.completedAt, builder: (column) => ColumnFilters(column));
}

class $$CachedChecklistItemsTableOrderingComposer
    extends Composer<_$AppDatabase, $CachedChecklistItemsTable> {
  $$CachedChecklistItemsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get taskId => $composableBuilder(
      column: $table.taskId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get title => $composableBuilder(
      column: $table.title, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<bool> get isCompleted => $composableBuilder(
      column: $table.isCompleted, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get sortOrder => $composableBuilder(
      column: $table.sortOrder, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get completedAt => $composableBuilder(
      column: $table.completedAt, builder: (column) => ColumnOrderings(column));
}

class $$CachedChecklistItemsTableAnnotationComposer
    extends Composer<_$AppDatabase, $CachedChecklistItemsTable> {
  $$CachedChecklistItemsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get taskId =>
      $composableBuilder(column: $table.taskId, builder: (column) => column);

  GeneratedColumn<String> get title =>
      $composableBuilder(column: $table.title, builder: (column) => column);

  GeneratedColumn<bool> get isCompleted => $composableBuilder(
      column: $table.isCompleted, builder: (column) => column);

  GeneratedColumn<int> get sortOrder =>
      $composableBuilder(column: $table.sortOrder, builder: (column) => column);

  GeneratedColumn<DateTime> get completedAt => $composableBuilder(
      column: $table.completedAt, builder: (column) => column);
}

class $$CachedChecklistItemsTableTableManager extends RootTableManager<
    _$AppDatabase,
    $CachedChecklistItemsTable,
    CachedChecklistItem,
    $$CachedChecklistItemsTableFilterComposer,
    $$CachedChecklistItemsTableOrderingComposer,
    $$CachedChecklistItemsTableAnnotationComposer,
    $$CachedChecklistItemsTableCreateCompanionBuilder,
    $$CachedChecklistItemsTableUpdateCompanionBuilder,
    (
      CachedChecklistItem,
      BaseReferences<_$AppDatabase, $CachedChecklistItemsTable,
          CachedChecklistItem>
    ),
    CachedChecklistItem,
    PrefetchHooks Function()> {
  $$CachedChecklistItemsTableTableManager(
      _$AppDatabase db, $CachedChecklistItemsTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$CachedChecklistItemsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$CachedChecklistItemsTableOrderingComposer(
                  $db: db, $table: table),
          createComputedFieldComposer: () =>
              $$CachedChecklistItemsTableAnnotationComposer(
                  $db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> id = const Value.absent(),
            Value<String> taskId = const Value.absent(),
            Value<String> title = const Value.absent(),
            Value<bool> isCompleted = const Value.absent(),
            Value<int> sortOrder = const Value.absent(),
            Value<DateTime?> completedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              CachedChecklistItemsCompanion(
            id: id,
            taskId: taskId,
            title: title,
            isCompleted: isCompleted,
            sortOrder: sortOrder,
            completedAt: completedAt,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String id,
            required String taskId,
            required String title,
            Value<bool> isCompleted = const Value.absent(),
            Value<int> sortOrder = const Value.absent(),
            Value<DateTime?> completedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              CachedChecklistItemsCompanion.insert(
            id: id,
            taskId: taskId,
            title: title,
            isCompleted: isCompleted,
            sortOrder: sortOrder,
            completedAt: completedAt,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$CachedChecklistItemsTableProcessedTableManager
    = ProcessedTableManager<
        _$AppDatabase,
        $CachedChecklistItemsTable,
        CachedChecklistItem,
        $$CachedChecklistItemsTableFilterComposer,
        $$CachedChecklistItemsTableOrderingComposer,
        $$CachedChecklistItemsTableAnnotationComposer,
        $$CachedChecklistItemsTableCreateCompanionBuilder,
        $$CachedChecklistItemsTableUpdateCompanionBuilder,
        (
          CachedChecklistItem,
          BaseReferences<_$AppDatabase, $CachedChecklistItemsTable,
              CachedChecklistItem>
        ),
        CachedChecklistItem,
        PrefetchHooks Function()>;
typedef $$CachedAttendanceTableCreateCompanionBuilder
    = CachedAttendanceCompanion Function({
  required String id,
  required String workspaceId,
  required String dutyState,
  Value<String?> activeSessionId,
  Value<DateTime?> punchInTime,
  Value<String?> shiftName,
  Value<DateTime> lastUpdated,
  Value<int> rowid,
});
typedef $$CachedAttendanceTableUpdateCompanionBuilder
    = CachedAttendanceCompanion Function({
  Value<String> id,
  Value<String> workspaceId,
  Value<String> dutyState,
  Value<String?> activeSessionId,
  Value<DateTime?> punchInTime,
  Value<String?> shiftName,
  Value<DateTime> lastUpdated,
  Value<int> rowid,
});

class $$CachedAttendanceTableFilterComposer
    extends Composer<_$AppDatabase, $CachedAttendanceTable> {
  $$CachedAttendanceTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get workspaceId => $composableBuilder(
      column: $table.workspaceId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get dutyState => $composableBuilder(
      column: $table.dutyState, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get activeSessionId => $composableBuilder(
      column: $table.activeSessionId,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get punchInTime => $composableBuilder(
      column: $table.punchInTime, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get shiftName => $composableBuilder(
      column: $table.shiftName, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get lastUpdated => $composableBuilder(
      column: $table.lastUpdated, builder: (column) => ColumnFilters(column));
}

class $$CachedAttendanceTableOrderingComposer
    extends Composer<_$AppDatabase, $CachedAttendanceTable> {
  $$CachedAttendanceTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get workspaceId => $composableBuilder(
      column: $table.workspaceId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get dutyState => $composableBuilder(
      column: $table.dutyState, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get activeSessionId => $composableBuilder(
      column: $table.activeSessionId,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get punchInTime => $composableBuilder(
      column: $table.punchInTime, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get shiftName => $composableBuilder(
      column: $table.shiftName, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get lastUpdated => $composableBuilder(
      column: $table.lastUpdated, builder: (column) => ColumnOrderings(column));
}

class $$CachedAttendanceTableAnnotationComposer
    extends Composer<_$AppDatabase, $CachedAttendanceTable> {
  $$CachedAttendanceTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get workspaceId => $composableBuilder(
      column: $table.workspaceId, builder: (column) => column);

  GeneratedColumn<String> get dutyState =>
      $composableBuilder(column: $table.dutyState, builder: (column) => column);

  GeneratedColumn<String> get activeSessionId => $composableBuilder(
      column: $table.activeSessionId, builder: (column) => column);

  GeneratedColumn<DateTime> get punchInTime => $composableBuilder(
      column: $table.punchInTime, builder: (column) => column);

  GeneratedColumn<String> get shiftName =>
      $composableBuilder(column: $table.shiftName, builder: (column) => column);

  GeneratedColumn<DateTime> get lastUpdated => $composableBuilder(
      column: $table.lastUpdated, builder: (column) => column);
}

class $$CachedAttendanceTableTableManager extends RootTableManager<
    _$AppDatabase,
    $CachedAttendanceTable,
    CachedAttendanceData,
    $$CachedAttendanceTableFilterComposer,
    $$CachedAttendanceTableOrderingComposer,
    $$CachedAttendanceTableAnnotationComposer,
    $$CachedAttendanceTableCreateCompanionBuilder,
    $$CachedAttendanceTableUpdateCompanionBuilder,
    (
      CachedAttendanceData,
      BaseReferences<_$AppDatabase, $CachedAttendanceTable,
          CachedAttendanceData>
    ),
    CachedAttendanceData,
    PrefetchHooks Function()> {
  $$CachedAttendanceTableTableManager(
      _$AppDatabase db, $CachedAttendanceTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$CachedAttendanceTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$CachedAttendanceTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$CachedAttendanceTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> id = const Value.absent(),
            Value<String> workspaceId = const Value.absent(),
            Value<String> dutyState = const Value.absent(),
            Value<String?> activeSessionId = const Value.absent(),
            Value<DateTime?> punchInTime = const Value.absent(),
            Value<String?> shiftName = const Value.absent(),
            Value<DateTime> lastUpdated = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              CachedAttendanceCompanion(
            id: id,
            workspaceId: workspaceId,
            dutyState: dutyState,
            activeSessionId: activeSessionId,
            punchInTime: punchInTime,
            shiftName: shiftName,
            lastUpdated: lastUpdated,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String id,
            required String workspaceId,
            required String dutyState,
            Value<String?> activeSessionId = const Value.absent(),
            Value<DateTime?> punchInTime = const Value.absent(),
            Value<String?> shiftName = const Value.absent(),
            Value<DateTime> lastUpdated = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              CachedAttendanceCompanion.insert(
            id: id,
            workspaceId: workspaceId,
            dutyState: dutyState,
            activeSessionId: activeSessionId,
            punchInTime: punchInTime,
            shiftName: shiftName,
            lastUpdated: lastUpdated,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$CachedAttendanceTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $CachedAttendanceTable,
    CachedAttendanceData,
    $$CachedAttendanceTableFilterComposer,
    $$CachedAttendanceTableOrderingComposer,
    $$CachedAttendanceTableAnnotationComposer,
    $$CachedAttendanceTableCreateCompanionBuilder,
    $$CachedAttendanceTableUpdateCompanionBuilder,
    (
      CachedAttendanceData,
      BaseReferences<_$AppDatabase, $CachedAttendanceTable,
          CachedAttendanceData>
    ),
    CachedAttendanceData,
    PrefetchHooks Function()>;
typedef $$CachedVisitsTableCreateCompanionBuilder = CachedVisitsCompanion
    Function({
  required String id,
  required String workspaceId,
  required String customerId,
  Value<String?> customerName,
  Value<String?> siteId,
  Value<String?> siteName,
  Value<String?> taskId,
  required String userId,
  required String status,
  Value<DateTime?> scheduledAt,
  Value<DateTime?> checkInTime,
  Value<double?> checkInLat,
  Value<double?> checkInLng,
  Value<DateTime?> checkOutTime,
  Value<double?> checkOutLat,
  Value<double?> checkOutLng,
  Value<int?> durationMinutes,
  Value<int?> sequenceOrder,
  Value<String?> routeDate,
  Value<String?> notes,
  required DateTime createdAt,
  required DateTime updatedAt,
  Value<int> rowid,
});
typedef $$CachedVisitsTableUpdateCompanionBuilder = CachedVisitsCompanion
    Function({
  Value<String> id,
  Value<String> workspaceId,
  Value<String> customerId,
  Value<String?> customerName,
  Value<String?> siteId,
  Value<String?> siteName,
  Value<String?> taskId,
  Value<String> userId,
  Value<String> status,
  Value<DateTime?> scheduledAt,
  Value<DateTime?> checkInTime,
  Value<double?> checkInLat,
  Value<double?> checkInLng,
  Value<DateTime?> checkOutTime,
  Value<double?> checkOutLat,
  Value<double?> checkOutLng,
  Value<int?> durationMinutes,
  Value<int?> sequenceOrder,
  Value<String?> routeDate,
  Value<String?> notes,
  Value<DateTime> createdAt,
  Value<DateTime> updatedAt,
  Value<int> rowid,
});

class $$CachedVisitsTableFilterComposer
    extends Composer<_$AppDatabase, $CachedVisitsTable> {
  $$CachedVisitsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get workspaceId => $composableBuilder(
      column: $table.workspaceId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get customerId => $composableBuilder(
      column: $table.customerId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get customerName => $composableBuilder(
      column: $table.customerName, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get siteId => $composableBuilder(
      column: $table.siteId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get siteName => $composableBuilder(
      column: $table.siteName, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get taskId => $composableBuilder(
      column: $table.taskId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get userId => $composableBuilder(
      column: $table.userId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get status => $composableBuilder(
      column: $table.status, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get scheduledAt => $composableBuilder(
      column: $table.scheduledAt, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get checkInTime => $composableBuilder(
      column: $table.checkInTime, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get checkInLat => $composableBuilder(
      column: $table.checkInLat, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get checkInLng => $composableBuilder(
      column: $table.checkInLng, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get checkOutTime => $composableBuilder(
      column: $table.checkOutTime, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get checkOutLat => $composableBuilder(
      column: $table.checkOutLat, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get checkOutLng => $composableBuilder(
      column: $table.checkOutLng, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get durationMinutes => $composableBuilder(
      column: $table.durationMinutes,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get sequenceOrder => $composableBuilder(
      column: $table.sequenceOrder, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get routeDate => $composableBuilder(
      column: $table.routeDate, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get notes => $composableBuilder(
      column: $table.notes, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnFilters(column));
}

class $$CachedVisitsTableOrderingComposer
    extends Composer<_$AppDatabase, $CachedVisitsTable> {
  $$CachedVisitsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get workspaceId => $composableBuilder(
      column: $table.workspaceId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get customerId => $composableBuilder(
      column: $table.customerId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get customerName => $composableBuilder(
      column: $table.customerName,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get siteId => $composableBuilder(
      column: $table.siteId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get siteName => $composableBuilder(
      column: $table.siteName, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get taskId => $composableBuilder(
      column: $table.taskId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get userId => $composableBuilder(
      column: $table.userId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get status => $composableBuilder(
      column: $table.status, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get scheduledAt => $composableBuilder(
      column: $table.scheduledAt, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get checkInTime => $composableBuilder(
      column: $table.checkInTime, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get checkInLat => $composableBuilder(
      column: $table.checkInLat, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get checkInLng => $composableBuilder(
      column: $table.checkInLng, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get checkOutTime => $composableBuilder(
      column: $table.checkOutTime,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get checkOutLat => $composableBuilder(
      column: $table.checkOutLat, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get checkOutLng => $composableBuilder(
      column: $table.checkOutLng, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get durationMinutes => $composableBuilder(
      column: $table.durationMinutes,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get sequenceOrder => $composableBuilder(
      column: $table.sequenceOrder,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get routeDate => $composableBuilder(
      column: $table.routeDate, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get notes => $composableBuilder(
      column: $table.notes, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnOrderings(column));
}

class $$CachedVisitsTableAnnotationComposer
    extends Composer<_$AppDatabase, $CachedVisitsTable> {
  $$CachedVisitsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get workspaceId => $composableBuilder(
      column: $table.workspaceId, builder: (column) => column);

  GeneratedColumn<String> get customerId => $composableBuilder(
      column: $table.customerId, builder: (column) => column);

  GeneratedColumn<String> get customerName => $composableBuilder(
      column: $table.customerName, builder: (column) => column);

  GeneratedColumn<String> get siteId =>
      $composableBuilder(column: $table.siteId, builder: (column) => column);

  GeneratedColumn<String> get siteName =>
      $composableBuilder(column: $table.siteName, builder: (column) => column);

  GeneratedColumn<String> get taskId =>
      $composableBuilder(column: $table.taskId, builder: (column) => column);

  GeneratedColumn<String> get userId =>
      $composableBuilder(column: $table.userId, builder: (column) => column);

  GeneratedColumn<String> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);

  GeneratedColumn<DateTime> get scheduledAt => $composableBuilder(
      column: $table.scheduledAt, builder: (column) => column);

  GeneratedColumn<DateTime> get checkInTime => $composableBuilder(
      column: $table.checkInTime, builder: (column) => column);

  GeneratedColumn<double> get checkInLat => $composableBuilder(
      column: $table.checkInLat, builder: (column) => column);

  GeneratedColumn<double> get checkInLng => $composableBuilder(
      column: $table.checkInLng, builder: (column) => column);

  GeneratedColumn<DateTime> get checkOutTime => $composableBuilder(
      column: $table.checkOutTime, builder: (column) => column);

  GeneratedColumn<double> get checkOutLat => $composableBuilder(
      column: $table.checkOutLat, builder: (column) => column);

  GeneratedColumn<double> get checkOutLng => $composableBuilder(
      column: $table.checkOutLng, builder: (column) => column);

  GeneratedColumn<int> get durationMinutes => $composableBuilder(
      column: $table.durationMinutes, builder: (column) => column);

  GeneratedColumn<int> get sequenceOrder => $composableBuilder(
      column: $table.sequenceOrder, builder: (column) => column);

  GeneratedColumn<String> get routeDate =>
      $composableBuilder(column: $table.routeDate, builder: (column) => column);

  GeneratedColumn<String> get notes =>
      $composableBuilder(column: $table.notes, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
}

class $$CachedVisitsTableTableManager extends RootTableManager<
    _$AppDatabase,
    $CachedVisitsTable,
    CachedVisit,
    $$CachedVisitsTableFilterComposer,
    $$CachedVisitsTableOrderingComposer,
    $$CachedVisitsTableAnnotationComposer,
    $$CachedVisitsTableCreateCompanionBuilder,
    $$CachedVisitsTableUpdateCompanionBuilder,
    (
      CachedVisit,
      BaseReferences<_$AppDatabase, $CachedVisitsTable, CachedVisit>
    ),
    CachedVisit,
    PrefetchHooks Function()> {
  $$CachedVisitsTableTableManager(_$AppDatabase db, $CachedVisitsTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$CachedVisitsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$CachedVisitsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$CachedVisitsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> id = const Value.absent(),
            Value<String> workspaceId = const Value.absent(),
            Value<String> customerId = const Value.absent(),
            Value<String?> customerName = const Value.absent(),
            Value<String?> siteId = const Value.absent(),
            Value<String?> siteName = const Value.absent(),
            Value<String?> taskId = const Value.absent(),
            Value<String> userId = const Value.absent(),
            Value<String> status = const Value.absent(),
            Value<DateTime?> scheduledAt = const Value.absent(),
            Value<DateTime?> checkInTime = const Value.absent(),
            Value<double?> checkInLat = const Value.absent(),
            Value<double?> checkInLng = const Value.absent(),
            Value<DateTime?> checkOutTime = const Value.absent(),
            Value<double?> checkOutLat = const Value.absent(),
            Value<double?> checkOutLng = const Value.absent(),
            Value<int?> durationMinutes = const Value.absent(),
            Value<int?> sequenceOrder = const Value.absent(),
            Value<String?> routeDate = const Value.absent(),
            Value<String?> notes = const Value.absent(),
            Value<DateTime> createdAt = const Value.absent(),
            Value<DateTime> updatedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              CachedVisitsCompanion(
            id: id,
            workspaceId: workspaceId,
            customerId: customerId,
            customerName: customerName,
            siteId: siteId,
            siteName: siteName,
            taskId: taskId,
            userId: userId,
            status: status,
            scheduledAt: scheduledAt,
            checkInTime: checkInTime,
            checkInLat: checkInLat,
            checkInLng: checkInLng,
            checkOutTime: checkOutTime,
            checkOutLat: checkOutLat,
            checkOutLng: checkOutLng,
            durationMinutes: durationMinutes,
            sequenceOrder: sequenceOrder,
            routeDate: routeDate,
            notes: notes,
            createdAt: createdAt,
            updatedAt: updatedAt,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String id,
            required String workspaceId,
            required String customerId,
            Value<String?> customerName = const Value.absent(),
            Value<String?> siteId = const Value.absent(),
            Value<String?> siteName = const Value.absent(),
            Value<String?> taskId = const Value.absent(),
            required String userId,
            required String status,
            Value<DateTime?> scheduledAt = const Value.absent(),
            Value<DateTime?> checkInTime = const Value.absent(),
            Value<double?> checkInLat = const Value.absent(),
            Value<double?> checkInLng = const Value.absent(),
            Value<DateTime?> checkOutTime = const Value.absent(),
            Value<double?> checkOutLat = const Value.absent(),
            Value<double?> checkOutLng = const Value.absent(),
            Value<int?> durationMinutes = const Value.absent(),
            Value<int?> sequenceOrder = const Value.absent(),
            Value<String?> routeDate = const Value.absent(),
            Value<String?> notes = const Value.absent(),
            required DateTime createdAt,
            required DateTime updatedAt,
            Value<int> rowid = const Value.absent(),
          }) =>
              CachedVisitsCompanion.insert(
            id: id,
            workspaceId: workspaceId,
            customerId: customerId,
            customerName: customerName,
            siteId: siteId,
            siteName: siteName,
            taskId: taskId,
            userId: userId,
            status: status,
            scheduledAt: scheduledAt,
            checkInTime: checkInTime,
            checkInLat: checkInLat,
            checkInLng: checkInLng,
            checkOutTime: checkOutTime,
            checkOutLat: checkOutLat,
            checkOutLng: checkOutLng,
            durationMinutes: durationMinutes,
            sequenceOrder: sequenceOrder,
            routeDate: routeDate,
            notes: notes,
            createdAt: createdAt,
            updatedAt: updatedAt,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$CachedVisitsTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $CachedVisitsTable,
    CachedVisit,
    $$CachedVisitsTableFilterComposer,
    $$CachedVisitsTableOrderingComposer,
    $$CachedVisitsTableAnnotationComposer,
    $$CachedVisitsTableCreateCompanionBuilder,
    $$CachedVisitsTableUpdateCompanionBuilder,
    (
      CachedVisit,
      BaseReferences<_$AppDatabase, $CachedVisitsTable, CachedVisit>
    ),
    CachedVisit,
    PrefetchHooks Function()>;
typedef $$CachedTaskProofsTableCreateCompanionBuilder
    = CachedTaskProofsCompanion Function({
  required String id,
  required String workspaceId,
  required String taskId,
  Value<String?> visitId,
  required String userId,
  required String proofType,
  required String fileKey,
  Value<String?> fileUrl,
  Value<String?> signerName,
  Value<String?> signerPhone,
  Value<String?> watermarkJson,
  Value<String?> notes,
  required DateTime createdAt,
  Value<int> rowid,
});
typedef $$CachedTaskProofsTableUpdateCompanionBuilder
    = CachedTaskProofsCompanion Function({
  Value<String> id,
  Value<String> workspaceId,
  Value<String> taskId,
  Value<String?> visitId,
  Value<String> userId,
  Value<String> proofType,
  Value<String> fileKey,
  Value<String?> fileUrl,
  Value<String?> signerName,
  Value<String?> signerPhone,
  Value<String?> watermarkJson,
  Value<String?> notes,
  Value<DateTime> createdAt,
  Value<int> rowid,
});

class $$CachedTaskProofsTableFilterComposer
    extends Composer<_$AppDatabase, $CachedTaskProofsTable> {
  $$CachedTaskProofsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get workspaceId => $composableBuilder(
      column: $table.workspaceId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get taskId => $composableBuilder(
      column: $table.taskId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get visitId => $composableBuilder(
      column: $table.visitId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get userId => $composableBuilder(
      column: $table.userId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get proofType => $composableBuilder(
      column: $table.proofType, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get fileKey => $composableBuilder(
      column: $table.fileKey, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get fileUrl => $composableBuilder(
      column: $table.fileUrl, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get signerName => $composableBuilder(
      column: $table.signerName, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get signerPhone => $composableBuilder(
      column: $table.signerPhone, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get watermarkJson => $composableBuilder(
      column: $table.watermarkJson, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get notes => $composableBuilder(
      column: $table.notes, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnFilters(column));
}

class $$CachedTaskProofsTableOrderingComposer
    extends Composer<_$AppDatabase, $CachedTaskProofsTable> {
  $$CachedTaskProofsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get workspaceId => $composableBuilder(
      column: $table.workspaceId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get taskId => $composableBuilder(
      column: $table.taskId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get visitId => $composableBuilder(
      column: $table.visitId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get userId => $composableBuilder(
      column: $table.userId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get proofType => $composableBuilder(
      column: $table.proofType, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get fileKey => $composableBuilder(
      column: $table.fileKey, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get fileUrl => $composableBuilder(
      column: $table.fileUrl, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get signerName => $composableBuilder(
      column: $table.signerName, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get signerPhone => $composableBuilder(
      column: $table.signerPhone, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get watermarkJson => $composableBuilder(
      column: $table.watermarkJson,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get notes => $composableBuilder(
      column: $table.notes, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnOrderings(column));
}

class $$CachedTaskProofsTableAnnotationComposer
    extends Composer<_$AppDatabase, $CachedTaskProofsTable> {
  $$CachedTaskProofsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get workspaceId => $composableBuilder(
      column: $table.workspaceId, builder: (column) => column);

  GeneratedColumn<String> get taskId =>
      $composableBuilder(column: $table.taskId, builder: (column) => column);

  GeneratedColumn<String> get visitId =>
      $composableBuilder(column: $table.visitId, builder: (column) => column);

  GeneratedColumn<String> get userId =>
      $composableBuilder(column: $table.userId, builder: (column) => column);

  GeneratedColumn<String> get proofType =>
      $composableBuilder(column: $table.proofType, builder: (column) => column);

  GeneratedColumn<String> get fileKey =>
      $composableBuilder(column: $table.fileKey, builder: (column) => column);

  GeneratedColumn<String> get fileUrl =>
      $composableBuilder(column: $table.fileUrl, builder: (column) => column);

  GeneratedColumn<String> get signerName => $composableBuilder(
      column: $table.signerName, builder: (column) => column);

  GeneratedColumn<String> get signerPhone => $composableBuilder(
      column: $table.signerPhone, builder: (column) => column);

  GeneratedColumn<String> get watermarkJson => $composableBuilder(
      column: $table.watermarkJson, builder: (column) => column);

  GeneratedColumn<String> get notes =>
      $composableBuilder(column: $table.notes, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);
}

class $$CachedTaskProofsTableTableManager extends RootTableManager<
    _$AppDatabase,
    $CachedTaskProofsTable,
    CachedTaskProof,
    $$CachedTaskProofsTableFilterComposer,
    $$CachedTaskProofsTableOrderingComposer,
    $$CachedTaskProofsTableAnnotationComposer,
    $$CachedTaskProofsTableCreateCompanionBuilder,
    $$CachedTaskProofsTableUpdateCompanionBuilder,
    (
      CachedTaskProof,
      BaseReferences<_$AppDatabase, $CachedTaskProofsTable, CachedTaskProof>
    ),
    CachedTaskProof,
    PrefetchHooks Function()> {
  $$CachedTaskProofsTableTableManager(
      _$AppDatabase db, $CachedTaskProofsTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$CachedTaskProofsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$CachedTaskProofsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$CachedTaskProofsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> id = const Value.absent(),
            Value<String> workspaceId = const Value.absent(),
            Value<String> taskId = const Value.absent(),
            Value<String?> visitId = const Value.absent(),
            Value<String> userId = const Value.absent(),
            Value<String> proofType = const Value.absent(),
            Value<String> fileKey = const Value.absent(),
            Value<String?> fileUrl = const Value.absent(),
            Value<String?> signerName = const Value.absent(),
            Value<String?> signerPhone = const Value.absent(),
            Value<String?> watermarkJson = const Value.absent(),
            Value<String?> notes = const Value.absent(),
            Value<DateTime> createdAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              CachedTaskProofsCompanion(
            id: id,
            workspaceId: workspaceId,
            taskId: taskId,
            visitId: visitId,
            userId: userId,
            proofType: proofType,
            fileKey: fileKey,
            fileUrl: fileUrl,
            signerName: signerName,
            signerPhone: signerPhone,
            watermarkJson: watermarkJson,
            notes: notes,
            createdAt: createdAt,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String id,
            required String workspaceId,
            required String taskId,
            Value<String?> visitId = const Value.absent(),
            required String userId,
            required String proofType,
            required String fileKey,
            Value<String?> fileUrl = const Value.absent(),
            Value<String?> signerName = const Value.absent(),
            Value<String?> signerPhone = const Value.absent(),
            Value<String?> watermarkJson = const Value.absent(),
            Value<String?> notes = const Value.absent(),
            required DateTime createdAt,
            Value<int> rowid = const Value.absent(),
          }) =>
              CachedTaskProofsCompanion.insert(
            id: id,
            workspaceId: workspaceId,
            taskId: taskId,
            visitId: visitId,
            userId: userId,
            proofType: proofType,
            fileKey: fileKey,
            fileUrl: fileUrl,
            signerName: signerName,
            signerPhone: signerPhone,
            watermarkJson: watermarkJson,
            notes: notes,
            createdAt: createdAt,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$CachedTaskProofsTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $CachedTaskProofsTable,
    CachedTaskProof,
    $$CachedTaskProofsTableFilterComposer,
    $$CachedTaskProofsTableOrderingComposer,
    $$CachedTaskProofsTableAnnotationComposer,
    $$CachedTaskProofsTableCreateCompanionBuilder,
    $$CachedTaskProofsTableUpdateCompanionBuilder,
    (
      CachedTaskProof,
      BaseReferences<_$AppDatabase, $CachedTaskProofsTable, CachedTaskProof>
    ),
    CachedTaskProof,
    PrefetchHooks Function()>;
typedef $$CachedLocationsTableCreateCompanionBuilder = CachedLocationsCompanion
    Function({
  required String id,
  required String workspaceId,
  required String userId,
  Value<String?> sessionId,
  required double latitude,
  required double longitude,
  required double accuracy,
  Value<double?> speed,
  Value<double?> heading,
  Value<double?> altitude,
  Value<double?> batteryLevel,
  Value<bool?> isCharging,
  Value<String?> activityType,
  Value<bool?> isMoving,
  required DateTime recordedAt,
  Value<String> status,
  Value<int> attemptCount,
  Value<String?> lastError,
  Value<DateTime> createdAt,
  Value<int> rowid,
});
typedef $$CachedLocationsTableUpdateCompanionBuilder = CachedLocationsCompanion
    Function({
  Value<String> id,
  Value<String> workspaceId,
  Value<String> userId,
  Value<String?> sessionId,
  Value<double> latitude,
  Value<double> longitude,
  Value<double> accuracy,
  Value<double?> speed,
  Value<double?> heading,
  Value<double?> altitude,
  Value<double?> batteryLevel,
  Value<bool?> isCharging,
  Value<String?> activityType,
  Value<bool?> isMoving,
  Value<DateTime> recordedAt,
  Value<String> status,
  Value<int> attemptCount,
  Value<String?> lastError,
  Value<DateTime> createdAt,
  Value<int> rowid,
});

class $$CachedLocationsTableFilterComposer
    extends Composer<_$AppDatabase, $CachedLocationsTable> {
  $$CachedLocationsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get workspaceId => $composableBuilder(
      column: $table.workspaceId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get userId => $composableBuilder(
      column: $table.userId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get sessionId => $composableBuilder(
      column: $table.sessionId, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get latitude => $composableBuilder(
      column: $table.latitude, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get longitude => $composableBuilder(
      column: $table.longitude, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get accuracy => $composableBuilder(
      column: $table.accuracy, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get speed => $composableBuilder(
      column: $table.speed, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get heading => $composableBuilder(
      column: $table.heading, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get altitude => $composableBuilder(
      column: $table.altitude, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get batteryLevel => $composableBuilder(
      column: $table.batteryLevel, builder: (column) => ColumnFilters(column));

  ColumnFilters<bool> get isCharging => $composableBuilder(
      column: $table.isCharging, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get activityType => $composableBuilder(
      column: $table.activityType, builder: (column) => ColumnFilters(column));

  ColumnFilters<bool> get isMoving => $composableBuilder(
      column: $table.isMoving, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get recordedAt => $composableBuilder(
      column: $table.recordedAt, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get status => $composableBuilder(
      column: $table.status, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get attemptCount => $composableBuilder(
      column: $table.attemptCount, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get lastError => $composableBuilder(
      column: $table.lastError, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnFilters(column));
}

class $$CachedLocationsTableOrderingComposer
    extends Composer<_$AppDatabase, $CachedLocationsTable> {
  $$CachedLocationsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get workspaceId => $composableBuilder(
      column: $table.workspaceId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get userId => $composableBuilder(
      column: $table.userId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get sessionId => $composableBuilder(
      column: $table.sessionId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get latitude => $composableBuilder(
      column: $table.latitude, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get longitude => $composableBuilder(
      column: $table.longitude, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get accuracy => $composableBuilder(
      column: $table.accuracy, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get speed => $composableBuilder(
      column: $table.speed, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get heading => $composableBuilder(
      column: $table.heading, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get altitude => $composableBuilder(
      column: $table.altitude, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get batteryLevel => $composableBuilder(
      column: $table.batteryLevel,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<bool> get isCharging => $composableBuilder(
      column: $table.isCharging, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get activityType => $composableBuilder(
      column: $table.activityType,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<bool> get isMoving => $composableBuilder(
      column: $table.isMoving, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get recordedAt => $composableBuilder(
      column: $table.recordedAt, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get status => $composableBuilder(
      column: $table.status, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get attemptCount => $composableBuilder(
      column: $table.attemptCount,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get lastError => $composableBuilder(
      column: $table.lastError, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnOrderings(column));
}

class $$CachedLocationsTableAnnotationComposer
    extends Composer<_$AppDatabase, $CachedLocationsTable> {
  $$CachedLocationsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get workspaceId => $composableBuilder(
      column: $table.workspaceId, builder: (column) => column);

  GeneratedColumn<String> get userId =>
      $composableBuilder(column: $table.userId, builder: (column) => column);

  GeneratedColumn<String> get sessionId =>
      $composableBuilder(column: $table.sessionId, builder: (column) => column);

  GeneratedColumn<double> get latitude =>
      $composableBuilder(column: $table.latitude, builder: (column) => column);

  GeneratedColumn<double> get longitude =>
      $composableBuilder(column: $table.longitude, builder: (column) => column);

  GeneratedColumn<double> get accuracy =>
      $composableBuilder(column: $table.accuracy, builder: (column) => column);

  GeneratedColumn<double> get speed =>
      $composableBuilder(column: $table.speed, builder: (column) => column);

  GeneratedColumn<double> get heading =>
      $composableBuilder(column: $table.heading, builder: (column) => column);

  GeneratedColumn<double> get altitude =>
      $composableBuilder(column: $table.altitude, builder: (column) => column);

  GeneratedColumn<double> get batteryLevel => $composableBuilder(
      column: $table.batteryLevel, builder: (column) => column);

  GeneratedColumn<bool> get isCharging => $composableBuilder(
      column: $table.isCharging, builder: (column) => column);

  GeneratedColumn<String> get activityType => $composableBuilder(
      column: $table.activityType, builder: (column) => column);

  GeneratedColumn<bool> get isMoving =>
      $composableBuilder(column: $table.isMoving, builder: (column) => column);

  GeneratedColumn<DateTime> get recordedAt => $composableBuilder(
      column: $table.recordedAt, builder: (column) => column);

  GeneratedColumn<String> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);

  GeneratedColumn<int> get attemptCount => $composableBuilder(
      column: $table.attemptCount, builder: (column) => column);

  GeneratedColumn<String> get lastError =>
      $composableBuilder(column: $table.lastError, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);
}

class $$CachedLocationsTableTableManager extends RootTableManager<
    _$AppDatabase,
    $CachedLocationsTable,
    CachedLocation,
    $$CachedLocationsTableFilterComposer,
    $$CachedLocationsTableOrderingComposer,
    $$CachedLocationsTableAnnotationComposer,
    $$CachedLocationsTableCreateCompanionBuilder,
    $$CachedLocationsTableUpdateCompanionBuilder,
    (
      CachedLocation,
      BaseReferences<_$AppDatabase, $CachedLocationsTable, CachedLocation>
    ),
    CachedLocation,
    PrefetchHooks Function()> {
  $$CachedLocationsTableTableManager(
      _$AppDatabase db, $CachedLocationsTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$CachedLocationsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$CachedLocationsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$CachedLocationsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> id = const Value.absent(),
            Value<String> workspaceId = const Value.absent(),
            Value<String> userId = const Value.absent(),
            Value<String?> sessionId = const Value.absent(),
            Value<double> latitude = const Value.absent(),
            Value<double> longitude = const Value.absent(),
            Value<double> accuracy = const Value.absent(),
            Value<double?> speed = const Value.absent(),
            Value<double?> heading = const Value.absent(),
            Value<double?> altitude = const Value.absent(),
            Value<double?> batteryLevel = const Value.absent(),
            Value<bool?> isCharging = const Value.absent(),
            Value<String?> activityType = const Value.absent(),
            Value<bool?> isMoving = const Value.absent(),
            Value<DateTime> recordedAt = const Value.absent(),
            Value<String> status = const Value.absent(),
            Value<int> attemptCount = const Value.absent(),
            Value<String?> lastError = const Value.absent(),
            Value<DateTime> createdAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              CachedLocationsCompanion(
            id: id,
            workspaceId: workspaceId,
            userId: userId,
            sessionId: sessionId,
            latitude: latitude,
            longitude: longitude,
            accuracy: accuracy,
            speed: speed,
            heading: heading,
            altitude: altitude,
            batteryLevel: batteryLevel,
            isCharging: isCharging,
            activityType: activityType,
            isMoving: isMoving,
            recordedAt: recordedAt,
            status: status,
            attemptCount: attemptCount,
            lastError: lastError,
            createdAt: createdAt,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String id,
            required String workspaceId,
            required String userId,
            Value<String?> sessionId = const Value.absent(),
            required double latitude,
            required double longitude,
            required double accuracy,
            Value<double?> speed = const Value.absent(),
            Value<double?> heading = const Value.absent(),
            Value<double?> altitude = const Value.absent(),
            Value<double?> batteryLevel = const Value.absent(),
            Value<bool?> isCharging = const Value.absent(),
            Value<String?> activityType = const Value.absent(),
            Value<bool?> isMoving = const Value.absent(),
            required DateTime recordedAt,
            Value<String> status = const Value.absent(),
            Value<int> attemptCount = const Value.absent(),
            Value<String?> lastError = const Value.absent(),
            Value<DateTime> createdAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              CachedLocationsCompanion.insert(
            id: id,
            workspaceId: workspaceId,
            userId: userId,
            sessionId: sessionId,
            latitude: latitude,
            longitude: longitude,
            accuracy: accuracy,
            speed: speed,
            heading: heading,
            altitude: altitude,
            batteryLevel: batteryLevel,
            isCharging: isCharging,
            activityType: activityType,
            isMoving: isMoving,
            recordedAt: recordedAt,
            status: status,
            attemptCount: attemptCount,
            lastError: lastError,
            createdAt: createdAt,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$CachedLocationsTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $CachedLocationsTable,
    CachedLocation,
    $$CachedLocationsTableFilterComposer,
    $$CachedLocationsTableOrderingComposer,
    $$CachedLocationsTableAnnotationComposer,
    $$CachedLocationsTableCreateCompanionBuilder,
    $$CachedLocationsTableUpdateCompanionBuilder,
    (
      CachedLocation,
      BaseReferences<_$AppDatabase, $CachedLocationsTable, CachedLocation>
    ),
    CachedLocation,
    PrefetchHooks Function()>;

class $AppDatabaseManager {
  final _$AppDatabase _db;
  $AppDatabaseManager(this._db);
  $$OutboxMutationsTableTableManager get outboxMutations =>
      $$OutboxMutationsTableTableManager(_db, _db.outboxMutations);
  $$CachedTasksTableTableManager get cachedTasks =>
      $$CachedTasksTableTableManager(_db, _db.cachedTasks);
  $$CachedChecklistItemsTableTableManager get cachedChecklistItems =>
      $$CachedChecklistItemsTableTableManager(_db, _db.cachedChecklistItems);
  $$CachedAttendanceTableTableManager get cachedAttendance =>
      $$CachedAttendanceTableTableManager(_db, _db.cachedAttendance);
  $$CachedVisitsTableTableManager get cachedVisits =>
      $$CachedVisitsTableTableManager(_db, _db.cachedVisits);
  $$CachedTaskProofsTableTableManager get cachedTaskProofs =>
      $$CachedTaskProofsTableTableManager(_db, _db.cachedTaskProofs);
  $$CachedLocationsTableTableManager get cachedLocations =>
      $$CachedLocationsTableTableManager(_db, _db.cachedLocations);
}

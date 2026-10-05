// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'list_tasks200_response_items_inner.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const ListTasks200ResponseItemsInnerStatusEnum
    _$listTasks200ResponseItemsInnerStatusEnum_PENDING =
    const ListTasks200ResponseItemsInnerStatusEnum._('PENDING');
const ListTasks200ResponseItemsInnerStatusEnum
    _$listTasks200ResponseItemsInnerStatusEnum_IN_PROGRESS =
    const ListTasks200ResponseItemsInnerStatusEnum._('IN_PROGRESS');
const ListTasks200ResponseItemsInnerStatusEnum
    _$listTasks200ResponseItemsInnerStatusEnum_COMPLETED =
    const ListTasks200ResponseItemsInnerStatusEnum._('COMPLETED');
const ListTasks200ResponseItemsInnerStatusEnum
    _$listTasks200ResponseItemsInnerStatusEnum_CANCELLED =
    const ListTasks200ResponseItemsInnerStatusEnum._('CANCELLED');

ListTasks200ResponseItemsInnerStatusEnum
    _$listTasks200ResponseItemsInnerStatusEnumValueOf(String name) {
  switch (name) {
    case 'PENDING':
      return _$listTasks200ResponseItemsInnerStatusEnum_PENDING;
    case 'IN_PROGRESS':
      return _$listTasks200ResponseItemsInnerStatusEnum_IN_PROGRESS;
    case 'COMPLETED':
      return _$listTasks200ResponseItemsInnerStatusEnum_COMPLETED;
    case 'CANCELLED':
      return _$listTasks200ResponseItemsInnerStatusEnum_CANCELLED;
    default:
      throw new ArgumentError(name);
  }
}

final BuiltSet<ListTasks200ResponseItemsInnerStatusEnum>
    _$listTasks200ResponseItemsInnerStatusEnumValues = new BuiltSet<
        ListTasks200ResponseItemsInnerStatusEnum>(const <ListTasks200ResponseItemsInnerStatusEnum>[
  _$listTasks200ResponseItemsInnerStatusEnum_PENDING,
  _$listTasks200ResponseItemsInnerStatusEnum_IN_PROGRESS,
  _$listTasks200ResponseItemsInnerStatusEnum_COMPLETED,
  _$listTasks200ResponseItemsInnerStatusEnum_CANCELLED,
]);

const ListTasks200ResponseItemsInnerPriorityEnum
    _$listTasks200ResponseItemsInnerPriorityEnum_LOW =
    const ListTasks200ResponseItemsInnerPriorityEnum._('LOW');
const ListTasks200ResponseItemsInnerPriorityEnum
    _$listTasks200ResponseItemsInnerPriorityEnum_MEDIUM =
    const ListTasks200ResponseItemsInnerPriorityEnum._('MEDIUM');
const ListTasks200ResponseItemsInnerPriorityEnum
    _$listTasks200ResponseItemsInnerPriorityEnum_HIGH =
    const ListTasks200ResponseItemsInnerPriorityEnum._('HIGH');
const ListTasks200ResponseItemsInnerPriorityEnum
    _$listTasks200ResponseItemsInnerPriorityEnum_URGENT =
    const ListTasks200ResponseItemsInnerPriorityEnum._('URGENT');

ListTasks200ResponseItemsInnerPriorityEnum
    _$listTasks200ResponseItemsInnerPriorityEnumValueOf(String name) {
  switch (name) {
    case 'LOW':
      return _$listTasks200ResponseItemsInnerPriorityEnum_LOW;
    case 'MEDIUM':
      return _$listTasks200ResponseItemsInnerPriorityEnum_MEDIUM;
    case 'HIGH':
      return _$listTasks200ResponseItemsInnerPriorityEnum_HIGH;
    case 'URGENT':
      return _$listTasks200ResponseItemsInnerPriorityEnum_URGENT;
    default:
      throw new ArgumentError(name);
  }
}

final BuiltSet<ListTasks200ResponseItemsInnerPriorityEnum>
    _$listTasks200ResponseItemsInnerPriorityEnumValues = new BuiltSet<
        ListTasks200ResponseItemsInnerPriorityEnum>(const <ListTasks200ResponseItemsInnerPriorityEnum>[
  _$listTasks200ResponseItemsInnerPriorityEnum_LOW,
  _$listTasks200ResponseItemsInnerPriorityEnum_MEDIUM,
  _$listTasks200ResponseItemsInnerPriorityEnum_HIGH,
  _$listTasks200ResponseItemsInnerPriorityEnum_URGENT,
]);

Serializer<ListTasks200ResponseItemsInnerStatusEnum>
    _$listTasks200ResponseItemsInnerStatusEnumSerializer =
    new _$ListTasks200ResponseItemsInnerStatusEnumSerializer();
Serializer<ListTasks200ResponseItemsInnerPriorityEnum>
    _$listTasks200ResponseItemsInnerPriorityEnumSerializer =
    new _$ListTasks200ResponseItemsInnerPriorityEnumSerializer();

class _$ListTasks200ResponseItemsInnerStatusEnumSerializer
    implements PrimitiveSerializer<ListTasks200ResponseItemsInnerStatusEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'PENDING': 'PENDING',
    'IN_PROGRESS': 'IN_PROGRESS',
    'COMPLETED': 'COMPLETED',
    'CANCELLED': 'CANCELLED',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'PENDING': 'PENDING',
    'IN_PROGRESS': 'IN_PROGRESS',
    'COMPLETED': 'COMPLETED',
    'CANCELLED': 'CANCELLED',
  };

  @override
  final Iterable<Type> types = const <Type>[
    ListTasks200ResponseItemsInnerStatusEnum
  ];
  @override
  final String wireName = 'ListTasks200ResponseItemsInnerStatusEnum';

  @override
  Object serialize(Serializers serializers,
          ListTasks200ResponseItemsInnerStatusEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  ListTasks200ResponseItemsInnerStatusEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      ListTasks200ResponseItemsInnerStatusEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$ListTasks200ResponseItemsInnerPriorityEnumSerializer
    implements PrimitiveSerializer<ListTasks200ResponseItemsInnerPriorityEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'LOW': 'LOW',
    'MEDIUM': 'MEDIUM',
    'HIGH': 'HIGH',
    'URGENT': 'URGENT',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'LOW': 'LOW',
    'MEDIUM': 'MEDIUM',
    'HIGH': 'HIGH',
    'URGENT': 'URGENT',
  };

  @override
  final Iterable<Type> types = const <Type>[
    ListTasks200ResponseItemsInnerPriorityEnum
  ];
  @override
  final String wireName = 'ListTasks200ResponseItemsInnerPriorityEnum';

  @override
  Object serialize(Serializers serializers,
          ListTasks200ResponseItemsInnerPriorityEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  ListTasks200ResponseItemsInnerPriorityEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      ListTasks200ResponseItemsInnerPriorityEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$ListTasks200ResponseItemsInner extends ListTasks200ResponseItemsInner {
  @override
  final String id;
  @override
  final String title;
  @override
  final String? description;
  @override
  final ListTasks200ResponseItemsInnerStatusEnum status;
  @override
  final ListTasks200ResponseItemsInnerPriorityEnum priority;
  @override
  final String? assignedUserId;
  @override
  final ListTasks200ResponseItemsInnerLocation? location;
  @override
  final BuiltList<String> tags;
  @override
  final DateTime? dueAt;
  @override
  final DateTime createdAt;
  @override
  final DateTime updatedAt;

  factory _$ListTasks200ResponseItemsInner(
          [void Function(ListTasks200ResponseItemsInnerBuilder)? updates]) =>
      (new ListTasks200ResponseItemsInnerBuilder()..update(updates))._build();

  _$ListTasks200ResponseItemsInner._(
      {required this.id,
      required this.title,
      this.description,
      required this.status,
      required this.priority,
      this.assignedUserId,
      this.location,
      required this.tags,
      this.dueAt,
      required this.createdAt,
      required this.updatedAt})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        id, r'ListTasks200ResponseItemsInner', 'id');
    BuiltValueNullFieldError.checkNotNull(
        title, r'ListTasks200ResponseItemsInner', 'title');
    BuiltValueNullFieldError.checkNotNull(
        status, r'ListTasks200ResponseItemsInner', 'status');
    BuiltValueNullFieldError.checkNotNull(
        priority, r'ListTasks200ResponseItemsInner', 'priority');
    BuiltValueNullFieldError.checkNotNull(
        tags, r'ListTasks200ResponseItemsInner', 'tags');
    BuiltValueNullFieldError.checkNotNull(
        createdAt, r'ListTasks200ResponseItemsInner', 'createdAt');
    BuiltValueNullFieldError.checkNotNull(
        updatedAt, r'ListTasks200ResponseItemsInner', 'updatedAt');
  }

  @override
  ListTasks200ResponseItemsInner rebuild(
          void Function(ListTasks200ResponseItemsInnerBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ListTasks200ResponseItemsInnerBuilder toBuilder() =>
      new ListTasks200ResponseItemsInnerBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ListTasks200ResponseItemsInner &&
        id == other.id &&
        title == other.title &&
        description == other.description &&
        status == other.status &&
        priority == other.priority &&
        assignedUserId == other.assignedUserId &&
        location == other.location &&
        tags == other.tags &&
        dueAt == other.dueAt &&
        createdAt == other.createdAt &&
        updatedAt == other.updatedAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, title.hashCode);
    _$hash = $jc(_$hash, description.hashCode);
    _$hash = $jc(_$hash, status.hashCode);
    _$hash = $jc(_$hash, priority.hashCode);
    _$hash = $jc(_$hash, assignedUserId.hashCode);
    _$hash = $jc(_$hash, location.hashCode);
    _$hash = $jc(_$hash, tags.hashCode);
    _$hash = $jc(_$hash, dueAt.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, updatedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ListTasks200ResponseItemsInner')
          ..add('id', id)
          ..add('title', title)
          ..add('description', description)
          ..add('status', status)
          ..add('priority', priority)
          ..add('assignedUserId', assignedUserId)
          ..add('location', location)
          ..add('tags', tags)
          ..add('dueAt', dueAt)
          ..add('createdAt', createdAt)
          ..add('updatedAt', updatedAt))
        .toString();
  }
}

class ListTasks200ResponseItemsInnerBuilder
    implements
        Builder<ListTasks200ResponseItemsInner,
            ListTasks200ResponseItemsInnerBuilder> {
  _$ListTasks200ResponseItemsInner? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _title;
  String? get title => _$this._title;
  set title(String? title) => _$this._title = title;

  String? _description;
  String? get description => _$this._description;
  set description(String? description) => _$this._description = description;

  ListTasks200ResponseItemsInnerStatusEnum? _status;
  ListTasks200ResponseItemsInnerStatusEnum? get status => _$this._status;
  set status(ListTasks200ResponseItemsInnerStatusEnum? status) =>
      _$this._status = status;

  ListTasks200ResponseItemsInnerPriorityEnum? _priority;
  ListTasks200ResponseItemsInnerPriorityEnum? get priority => _$this._priority;
  set priority(ListTasks200ResponseItemsInnerPriorityEnum? priority) =>
      _$this._priority = priority;

  String? _assignedUserId;
  String? get assignedUserId => _$this._assignedUserId;
  set assignedUserId(String? assignedUserId) =>
      _$this._assignedUserId = assignedUserId;

  ListTasks200ResponseItemsInnerLocationBuilder? _location;
  ListTasks200ResponseItemsInnerLocationBuilder get location =>
      _$this._location ??= new ListTasks200ResponseItemsInnerLocationBuilder();
  set location(ListTasks200ResponseItemsInnerLocationBuilder? location) =>
      _$this._location = location;

  ListBuilder<String>? _tags;
  ListBuilder<String> get tags => _$this._tags ??= new ListBuilder<String>();
  set tags(ListBuilder<String>? tags) => _$this._tags = tags;

  DateTime? _dueAt;
  DateTime? get dueAt => _$this._dueAt;
  set dueAt(DateTime? dueAt) => _$this._dueAt = dueAt;

  DateTime? _createdAt;
  DateTime? get createdAt => _$this._createdAt;
  set createdAt(DateTime? createdAt) => _$this._createdAt = createdAt;

  DateTime? _updatedAt;
  DateTime? get updatedAt => _$this._updatedAt;
  set updatedAt(DateTime? updatedAt) => _$this._updatedAt = updatedAt;

  ListTasks200ResponseItemsInnerBuilder() {
    ListTasks200ResponseItemsInner._defaults(this);
  }

  ListTasks200ResponseItemsInnerBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _title = $v.title;
      _description = $v.description;
      _status = $v.status;
      _priority = $v.priority;
      _assignedUserId = $v.assignedUserId;
      _location = $v.location?.toBuilder();
      _tags = $v.tags.toBuilder();
      _dueAt = $v.dueAt;
      _createdAt = $v.createdAt;
      _updatedAt = $v.updatedAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ListTasks200ResponseItemsInner other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$ListTasks200ResponseItemsInner;
  }

  @override
  void update(void Function(ListTasks200ResponseItemsInnerBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ListTasks200ResponseItemsInner build() => _build();

  _$ListTasks200ResponseItemsInner _build() {
    _$ListTasks200ResponseItemsInner _$result;
    try {
      _$result = _$v ??
          new _$ListTasks200ResponseItemsInner._(
              id: BuiltValueNullFieldError.checkNotNull(
                  id, r'ListTasks200ResponseItemsInner', 'id'),
              title: BuiltValueNullFieldError.checkNotNull(
                  title, r'ListTasks200ResponseItemsInner', 'title'),
              description: description,
              status: BuiltValueNullFieldError.checkNotNull(
                  status, r'ListTasks200ResponseItemsInner', 'status'),
              priority: BuiltValueNullFieldError.checkNotNull(
                  priority, r'ListTasks200ResponseItemsInner', 'priority'),
              assignedUserId: assignedUserId,
              location: _location?.build(),
              tags: tags.build(),
              dueAt: dueAt,
              createdAt: BuiltValueNullFieldError.checkNotNull(
                  createdAt, r'ListTasks200ResponseItemsInner', 'createdAt'),
              updatedAt: BuiltValueNullFieldError.checkNotNull(
                  updatedAt, r'ListTasks200ResponseItemsInner', 'updatedAt'));
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'location';
        _location?.build();
        _$failedField = 'tags';
        tags.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'ListTasks200ResponseItemsInner', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

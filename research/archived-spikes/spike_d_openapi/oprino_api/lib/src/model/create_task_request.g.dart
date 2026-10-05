// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'create_task_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const CreateTaskRequestPriorityEnum _$createTaskRequestPriorityEnum_LOW =
    const CreateTaskRequestPriorityEnum._('LOW');
const CreateTaskRequestPriorityEnum _$createTaskRequestPriorityEnum_MEDIUM =
    const CreateTaskRequestPriorityEnum._('MEDIUM');
const CreateTaskRequestPriorityEnum _$createTaskRequestPriorityEnum_HIGH =
    const CreateTaskRequestPriorityEnum._('HIGH');
const CreateTaskRequestPriorityEnum _$createTaskRequestPriorityEnum_URGENT =
    const CreateTaskRequestPriorityEnum._('URGENT');

CreateTaskRequestPriorityEnum _$createTaskRequestPriorityEnumValueOf(
    String name) {
  switch (name) {
    case 'LOW':
      return _$createTaskRequestPriorityEnum_LOW;
    case 'MEDIUM':
      return _$createTaskRequestPriorityEnum_MEDIUM;
    case 'HIGH':
      return _$createTaskRequestPriorityEnum_HIGH;
    case 'URGENT':
      return _$createTaskRequestPriorityEnum_URGENT;
    default:
      throw new ArgumentError(name);
  }
}

final BuiltSet<CreateTaskRequestPriorityEnum>
    _$createTaskRequestPriorityEnumValues = new BuiltSet<
        CreateTaskRequestPriorityEnum>(const <CreateTaskRequestPriorityEnum>[
  _$createTaskRequestPriorityEnum_LOW,
  _$createTaskRequestPriorityEnum_MEDIUM,
  _$createTaskRequestPriorityEnum_HIGH,
  _$createTaskRequestPriorityEnum_URGENT,
]);

Serializer<CreateTaskRequestPriorityEnum>
    _$createTaskRequestPriorityEnumSerializer =
    new _$CreateTaskRequestPriorityEnumSerializer();

class _$CreateTaskRequestPriorityEnumSerializer
    implements PrimitiveSerializer<CreateTaskRequestPriorityEnum> {
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
  final Iterable<Type> types = const <Type>[CreateTaskRequestPriorityEnum];
  @override
  final String wireName = 'CreateTaskRequestPriorityEnum';

  @override
  Object serialize(
          Serializers serializers, CreateTaskRequestPriorityEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  CreateTaskRequestPriorityEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      CreateTaskRequestPriorityEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$CreateTaskRequest extends CreateTaskRequest {
  @override
  final String title;
  @override
  final String? description;
  @override
  final CreateTaskRequestPriorityEnum? priority;
  @override
  final String? assignedUserId;
  @override
  final ListTasks200ResponseItemsInnerLocation? location;
  @override
  final BuiltList<String>? tags;
  @override
  final DateTime? dueAt;

  factory _$CreateTaskRequest(
          [void Function(CreateTaskRequestBuilder)? updates]) =>
      (new CreateTaskRequestBuilder()..update(updates))._build();

  _$CreateTaskRequest._(
      {required this.title,
      this.description,
      this.priority,
      this.assignedUserId,
      this.location,
      this.tags,
      this.dueAt})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(title, r'CreateTaskRequest', 'title');
  }

  @override
  CreateTaskRequest rebuild(void Function(CreateTaskRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CreateTaskRequestBuilder toBuilder() =>
      new CreateTaskRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CreateTaskRequest &&
        title == other.title &&
        description == other.description &&
        priority == other.priority &&
        assignedUserId == other.assignedUserId &&
        location == other.location &&
        tags == other.tags &&
        dueAt == other.dueAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, title.hashCode);
    _$hash = $jc(_$hash, description.hashCode);
    _$hash = $jc(_$hash, priority.hashCode);
    _$hash = $jc(_$hash, assignedUserId.hashCode);
    _$hash = $jc(_$hash, location.hashCode);
    _$hash = $jc(_$hash, tags.hashCode);
    _$hash = $jc(_$hash, dueAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CreateTaskRequest')
          ..add('title', title)
          ..add('description', description)
          ..add('priority', priority)
          ..add('assignedUserId', assignedUserId)
          ..add('location', location)
          ..add('tags', tags)
          ..add('dueAt', dueAt))
        .toString();
  }
}

class CreateTaskRequestBuilder
    implements Builder<CreateTaskRequest, CreateTaskRequestBuilder> {
  _$CreateTaskRequest? _$v;

  String? _title;
  String? get title => _$this._title;
  set title(String? title) => _$this._title = title;

  String? _description;
  String? get description => _$this._description;
  set description(String? description) => _$this._description = description;

  CreateTaskRequestPriorityEnum? _priority;
  CreateTaskRequestPriorityEnum? get priority => _$this._priority;
  set priority(CreateTaskRequestPriorityEnum? priority) =>
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

  CreateTaskRequestBuilder() {
    CreateTaskRequest._defaults(this);
  }

  CreateTaskRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _title = $v.title;
      _description = $v.description;
      _priority = $v.priority;
      _assignedUserId = $v.assignedUserId;
      _location = $v.location?.toBuilder();
      _tags = $v.tags?.toBuilder();
      _dueAt = $v.dueAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CreateTaskRequest other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$CreateTaskRequest;
  }

  @override
  void update(void Function(CreateTaskRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CreateTaskRequest build() => _build();

  _$CreateTaskRequest _build() {
    _$CreateTaskRequest _$result;
    try {
      _$result = _$v ??
          new _$CreateTaskRequest._(
              title: BuiltValueNullFieldError.checkNotNull(
                  title, r'CreateTaskRequest', 'title'),
              description: description,
              priority: priority,
              assignedUserId: assignedUserId,
              location: _location?.build(),
              tags: _tags?.build(),
              dueAt: dueAt);
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'location';
        _location?.build();
        _$failedField = 'tags';
        _tags?.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'CreateTaskRequest', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

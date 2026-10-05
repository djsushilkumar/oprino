//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:oprino_api/src/model/list_tasks200_response_items_inner_location.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'create_task_request.g.dart';

/// CreateTaskRequest
///
/// Properties:
/// * [title] 
/// * [description] 
/// * [priority] 
/// * [assignedUserId] 
/// * [location] 
/// * [tags] 
/// * [dueAt] 
@BuiltValue()
abstract class CreateTaskRequest implements Built<CreateTaskRequest, CreateTaskRequestBuilder> {
  @BuiltValueField(wireName: r'title')
  String get title;

  @BuiltValueField(wireName: r'description')
  String? get description;

  @BuiltValueField(wireName: r'priority')
  CreateTaskRequestPriorityEnum? get priority;
  // enum priorityEnum {  LOW,  MEDIUM,  HIGH,  URGENT,  };

  @BuiltValueField(wireName: r'assignedUserId')
  String? get assignedUserId;

  @BuiltValueField(wireName: r'location')
  ListTasks200ResponseItemsInnerLocation? get location;

  @BuiltValueField(wireName: r'tags')
  BuiltList<String>? get tags;

  @BuiltValueField(wireName: r'dueAt')
  DateTime? get dueAt;

  CreateTaskRequest._();

  factory CreateTaskRequest([void updates(CreateTaskRequestBuilder b)]) = _$CreateTaskRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CreateTaskRequestBuilder b) => b
      ..priority = const CreateTaskRequestPriorityEnum._('MEDIUM')
      ..tags = ListBuilder();

  @BuiltValueSerializer(custom: true)
  static Serializer<CreateTaskRequest> get serializer => _$CreateTaskRequestSerializer();
}

class _$CreateTaskRequestSerializer implements PrimitiveSerializer<CreateTaskRequest> {
  @override
  final Iterable<Type> types = const [CreateTaskRequest, _$CreateTaskRequest];

  @override
  final String wireName = r'CreateTaskRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CreateTaskRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'title';
    yield serializers.serialize(
      object.title,
      specifiedType: const FullType(String),
    );
    if (object.description != null) {
      yield r'description';
      yield serializers.serialize(
        object.description,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.priority != null) {
      yield r'priority';
      yield serializers.serialize(
        object.priority,
        specifiedType: const FullType(CreateTaskRequestPriorityEnum),
      );
    }
    if (object.assignedUserId != null) {
      yield r'assignedUserId';
      yield serializers.serialize(
        object.assignedUserId,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.location != null) {
      yield r'location';
      yield serializers.serialize(
        object.location,
        specifiedType: const FullType.nullable(ListTasks200ResponseItemsInnerLocation),
      );
    }
    if (object.tags != null) {
      yield r'tags';
      yield serializers.serialize(
        object.tags,
        specifiedType: const FullType(BuiltList, [FullType(String)]),
      );
    }
    if (object.dueAt != null) {
      yield r'dueAt';
      yield serializers.serialize(
        object.dueAt,
        specifiedType: const FullType.nullable(DateTime),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    CreateTaskRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required CreateTaskRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'title':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.title = valueDes;
          break;
        case r'description':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.description = valueDes;
          break;
        case r'priority':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(CreateTaskRequestPriorityEnum),
          ) as CreateTaskRequestPriorityEnum;
          result.priority = valueDes;
          break;
        case r'assignedUserId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.assignedUserId = valueDes;
          break;
        case r'location':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(ListTasks200ResponseItemsInnerLocation),
          ) as ListTasks200ResponseItemsInnerLocation?;
          if (valueDes == null) continue;
          result.location.replace(valueDes);
          break;
        case r'tags':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.tags.replace(valueDes);
          break;
        case r'dueAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(DateTime),
          ) as DateTime?;
          if (valueDes == null) continue;
          result.dueAt = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CreateTaskRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CreateTaskRequestBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}

class CreateTaskRequestPriorityEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'LOW')
  static const CreateTaskRequestPriorityEnum LOW = _$createTaskRequestPriorityEnum_LOW;
  @BuiltValueEnumConst(wireName: r'MEDIUM')
  static const CreateTaskRequestPriorityEnum MEDIUM = _$createTaskRequestPriorityEnum_MEDIUM;
  @BuiltValueEnumConst(wireName: r'HIGH')
  static const CreateTaskRequestPriorityEnum HIGH = _$createTaskRequestPriorityEnum_HIGH;
  @BuiltValueEnumConst(wireName: r'URGENT')
  static const CreateTaskRequestPriorityEnum URGENT = _$createTaskRequestPriorityEnum_URGENT;

  static Serializer<CreateTaskRequestPriorityEnum> get serializer => _$createTaskRequestPriorityEnumSerializer;

  const CreateTaskRequestPriorityEnum._(String name): super(name);

  static BuiltSet<CreateTaskRequestPriorityEnum> get values => _$createTaskRequestPriorityEnumValues;
  static CreateTaskRequestPriorityEnum valueOf(String name) => _$createTaskRequestPriorityEnumValueOf(name);
}


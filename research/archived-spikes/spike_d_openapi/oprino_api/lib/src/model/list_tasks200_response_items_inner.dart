//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:oprino_api/src/model/list_tasks200_response_items_inner_location.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'list_tasks200_response_items_inner.g.dart';

/// ListTasks200ResponseItemsInner
///
/// Properties:
/// * [id] 
/// * [title] 
/// * [description] 
/// * [status] 
/// * [priority] 
/// * [assignedUserId] 
/// * [location] 
/// * [tags] 
/// * [dueAt] 
/// * [createdAt] 
/// * [updatedAt] 
@BuiltValue()
abstract class ListTasks200ResponseItemsInner implements Built<ListTasks200ResponseItemsInner, ListTasks200ResponseItemsInnerBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'title')
  String get title;

  @BuiltValueField(wireName: r'description')
  String? get description;

  @BuiltValueField(wireName: r'status')
  ListTasks200ResponseItemsInnerStatusEnum get status;
  // enum statusEnum {  PENDING,  IN_PROGRESS,  COMPLETED,  CANCELLED,  };

  @BuiltValueField(wireName: r'priority')
  ListTasks200ResponseItemsInnerPriorityEnum get priority;
  // enum priorityEnum {  LOW,  MEDIUM,  HIGH,  URGENT,  };

  @BuiltValueField(wireName: r'assignedUserId')
  String? get assignedUserId;

  @BuiltValueField(wireName: r'location')
  ListTasks200ResponseItemsInnerLocation? get location;

  @BuiltValueField(wireName: r'tags')
  BuiltList<String> get tags;

  @BuiltValueField(wireName: r'dueAt')
  DateTime? get dueAt;

  @BuiltValueField(wireName: r'createdAt')
  DateTime get createdAt;

  @BuiltValueField(wireName: r'updatedAt')
  DateTime get updatedAt;

  ListTasks200ResponseItemsInner._();

  factory ListTasks200ResponseItemsInner([void updates(ListTasks200ResponseItemsInnerBuilder b)]) = _$ListTasks200ResponseItemsInner;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ListTasks200ResponseItemsInnerBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ListTasks200ResponseItemsInner> get serializer => _$ListTasks200ResponseItemsInnerSerializer();
}

class _$ListTasks200ResponseItemsInnerSerializer implements PrimitiveSerializer<ListTasks200ResponseItemsInner> {
  @override
  final Iterable<Type> types = const [ListTasks200ResponseItemsInner, _$ListTasks200ResponseItemsInner];

  @override
  final String wireName = r'ListTasks200ResponseItemsInner';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ListTasks200ResponseItemsInner object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'title';
    yield serializers.serialize(
      object.title,
      specifiedType: const FullType(String),
    );
    yield r'description';
    yield object.description == null ? null : serializers.serialize(
      object.description,
      specifiedType: const FullType.nullable(String),
    );
    yield r'status';
    yield serializers.serialize(
      object.status,
      specifiedType: const FullType(ListTasks200ResponseItemsInnerStatusEnum),
    );
    yield r'priority';
    yield serializers.serialize(
      object.priority,
      specifiedType: const FullType(ListTasks200ResponseItemsInnerPriorityEnum),
    );
    yield r'assignedUserId';
    yield object.assignedUserId == null ? null : serializers.serialize(
      object.assignedUserId,
      specifiedType: const FullType.nullable(String),
    );
    yield r'location';
    yield object.location == null ? null : serializers.serialize(
      object.location,
      specifiedType: const FullType.nullable(ListTasks200ResponseItemsInnerLocation),
    );
    yield r'tags';
    yield serializers.serialize(
      object.tags,
      specifiedType: const FullType(BuiltList, [FullType(String)]),
    );
    yield r'dueAt';
    yield object.dueAt == null ? null : serializers.serialize(
      object.dueAt,
      specifiedType: const FullType.nullable(DateTime),
    );
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(DateTime),
    );
    yield r'updatedAt';
    yield serializers.serialize(
      object.updatedAt,
      specifiedType: const FullType(DateTime),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ListTasks200ResponseItemsInner object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ListTasks200ResponseItemsInnerBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
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
        case r'status':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ListTasks200ResponseItemsInnerStatusEnum),
          ) as ListTasks200ResponseItemsInnerStatusEnum;
          result.status = valueDes;
          break;
        case r'priority':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ListTasks200ResponseItemsInnerPriorityEnum),
          ) as ListTasks200ResponseItemsInnerPriorityEnum;
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
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.createdAt = valueDes;
          break;
        case r'updatedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.updatedAt = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ListTasks200ResponseItemsInner deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ListTasks200ResponseItemsInnerBuilder();
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

class ListTasks200ResponseItemsInnerStatusEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'PENDING')
  static const ListTasks200ResponseItemsInnerStatusEnum PENDING = _$listTasks200ResponseItemsInnerStatusEnum_PENDING;
  @BuiltValueEnumConst(wireName: r'IN_PROGRESS')
  static const ListTasks200ResponseItemsInnerStatusEnum IN_PROGRESS = _$listTasks200ResponseItemsInnerStatusEnum_IN_PROGRESS;
  @BuiltValueEnumConst(wireName: r'COMPLETED')
  static const ListTasks200ResponseItemsInnerStatusEnum COMPLETED = _$listTasks200ResponseItemsInnerStatusEnum_COMPLETED;
  @BuiltValueEnumConst(wireName: r'CANCELLED')
  static const ListTasks200ResponseItemsInnerStatusEnum CANCELLED = _$listTasks200ResponseItemsInnerStatusEnum_CANCELLED;

  static Serializer<ListTasks200ResponseItemsInnerStatusEnum> get serializer => _$listTasks200ResponseItemsInnerStatusEnumSerializer;

  const ListTasks200ResponseItemsInnerStatusEnum._(String name): super(name);

  static BuiltSet<ListTasks200ResponseItemsInnerStatusEnum> get values => _$listTasks200ResponseItemsInnerStatusEnumValues;
  static ListTasks200ResponseItemsInnerStatusEnum valueOf(String name) => _$listTasks200ResponseItemsInnerStatusEnumValueOf(name);
}

class ListTasks200ResponseItemsInnerPriorityEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'LOW')
  static const ListTasks200ResponseItemsInnerPriorityEnum LOW = _$listTasks200ResponseItemsInnerPriorityEnum_LOW;
  @BuiltValueEnumConst(wireName: r'MEDIUM')
  static const ListTasks200ResponseItemsInnerPriorityEnum MEDIUM = _$listTasks200ResponseItemsInnerPriorityEnum_MEDIUM;
  @BuiltValueEnumConst(wireName: r'HIGH')
  static const ListTasks200ResponseItemsInnerPriorityEnum HIGH = _$listTasks200ResponseItemsInnerPriorityEnum_HIGH;
  @BuiltValueEnumConst(wireName: r'URGENT')
  static const ListTasks200ResponseItemsInnerPriorityEnum URGENT = _$listTasks200ResponseItemsInnerPriorityEnum_URGENT;

  static Serializer<ListTasks200ResponseItemsInnerPriorityEnum> get serializer => _$listTasks200ResponseItemsInnerPriorityEnumSerializer;

  const ListTasks200ResponseItemsInnerPriorityEnum._(String name): super(name);

  static BuiltSet<ListTasks200ResponseItemsInnerPriorityEnum> get values => _$listTasks200ResponseItemsInnerPriorityEnumValues;
  static ListTasks200ResponseItemsInnerPriorityEnum valueOf(String name) => _$listTasks200ResponseItemsInnerPriorityEnumValueOf(name);
}


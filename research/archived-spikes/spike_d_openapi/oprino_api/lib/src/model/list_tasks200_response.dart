//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:oprino_api/src/model/list_tasks200_response_pagination.dart';
import 'package:built_collection/built_collection.dart';
import 'package:oprino_api/src/model/list_tasks200_response_items_inner.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'list_tasks200_response.g.dart';

/// ListTasks200Response
///
/// Properties:
/// * [items] 
/// * [pagination] 
@BuiltValue()
abstract class ListTasks200Response implements Built<ListTasks200Response, ListTasks200ResponseBuilder> {
  @BuiltValueField(wireName: r'items')
  BuiltList<ListTasks200ResponseItemsInner> get items;

  @BuiltValueField(wireName: r'pagination')
  ListTasks200ResponsePagination get pagination;

  ListTasks200Response._();

  factory ListTasks200Response([void updates(ListTasks200ResponseBuilder b)]) = _$ListTasks200Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ListTasks200ResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ListTasks200Response> get serializer => _$ListTasks200ResponseSerializer();
}

class _$ListTasks200ResponseSerializer implements PrimitiveSerializer<ListTasks200Response> {
  @override
  final Iterable<Type> types = const [ListTasks200Response, _$ListTasks200Response];

  @override
  final String wireName = r'ListTasks200Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ListTasks200Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'items';
    yield serializers.serialize(
      object.items,
      specifiedType: const FullType(BuiltList, [FullType(ListTasks200ResponseItemsInner)]),
    );
    yield r'pagination';
    yield serializers.serialize(
      object.pagination,
      specifiedType: const FullType(ListTasks200ResponsePagination),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ListTasks200Response object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ListTasks200ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'items':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(ListTasks200ResponseItemsInner)]),
          ) as BuiltList<ListTasks200ResponseItemsInner>;
          result.items.replace(valueDes);
          break;
        case r'pagination':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ListTasks200ResponsePagination),
          ) as ListTasks200ResponsePagination;
          result.pagination.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ListTasks200Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ListTasks200ResponseBuilder();
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


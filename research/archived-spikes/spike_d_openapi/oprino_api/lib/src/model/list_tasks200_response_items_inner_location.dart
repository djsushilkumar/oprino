//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'list_tasks200_response_items_inner_location.g.dart';

/// ListTasks200ResponseItemsInnerLocation
///
/// Properties:
/// * [latitude] 
/// * [longitude] 
/// * [accuracy] 
@BuiltValue()
abstract class ListTasks200ResponseItemsInnerLocation implements Built<ListTasks200ResponseItemsInnerLocation, ListTasks200ResponseItemsInnerLocationBuilder> {
  @BuiltValueField(wireName: r'latitude')
  num get latitude;

  @BuiltValueField(wireName: r'longitude')
  num get longitude;

  @BuiltValueField(wireName: r'accuracy')
  num? get accuracy;

  ListTasks200ResponseItemsInnerLocation._();

  factory ListTasks200ResponseItemsInnerLocation([void updates(ListTasks200ResponseItemsInnerLocationBuilder b)]) = _$ListTasks200ResponseItemsInnerLocation;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ListTasks200ResponseItemsInnerLocationBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ListTasks200ResponseItemsInnerLocation> get serializer => _$ListTasks200ResponseItemsInnerLocationSerializer();
}

class _$ListTasks200ResponseItemsInnerLocationSerializer implements PrimitiveSerializer<ListTasks200ResponseItemsInnerLocation> {
  @override
  final Iterable<Type> types = const [ListTasks200ResponseItemsInnerLocation, _$ListTasks200ResponseItemsInnerLocation];

  @override
  final String wireName = r'ListTasks200ResponseItemsInnerLocation';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ListTasks200ResponseItemsInnerLocation object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'latitude';
    yield serializers.serialize(
      object.latitude,
      specifiedType: const FullType(num),
    );
    yield r'longitude';
    yield serializers.serialize(
      object.longitude,
      specifiedType: const FullType(num),
    );
    if (object.accuracy != null) {
      yield r'accuracy';
      yield serializers.serialize(
        object.accuracy,
        specifiedType: const FullType.nullable(num),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    ListTasks200ResponseItemsInnerLocation object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ListTasks200ResponseItemsInnerLocationBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'latitude':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.latitude = valueDes;
          break;
        case r'longitude':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.longitude = valueDes;
          break;
        case r'accuracy':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(num),
          ) as num?;
          if (valueDes == null) continue;
          result.accuracy = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ListTasks200ResponseItemsInnerLocation deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ListTasks200ResponseItemsInnerLocationBuilder();
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


//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'list_tasks400_response_details_inner.g.dart';

/// ListTasks400ResponseDetailsInner
///
/// Properties:
/// * [path] 
/// * [message] 
@BuiltValue()
abstract class ListTasks400ResponseDetailsInner implements Built<ListTasks400ResponseDetailsInner, ListTasks400ResponseDetailsInnerBuilder> {
  @BuiltValueField(wireName: r'path')
  String get path;

  @BuiltValueField(wireName: r'message')
  String get message;

  ListTasks400ResponseDetailsInner._();

  factory ListTasks400ResponseDetailsInner([void updates(ListTasks400ResponseDetailsInnerBuilder b)]) = _$ListTasks400ResponseDetailsInner;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ListTasks400ResponseDetailsInnerBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ListTasks400ResponseDetailsInner> get serializer => _$ListTasks400ResponseDetailsInnerSerializer();
}

class _$ListTasks400ResponseDetailsInnerSerializer implements PrimitiveSerializer<ListTasks400ResponseDetailsInner> {
  @override
  final Iterable<Type> types = const [ListTasks400ResponseDetailsInner, _$ListTasks400ResponseDetailsInner];

  @override
  final String wireName = r'ListTasks400ResponseDetailsInner';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ListTasks400ResponseDetailsInner object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'path';
    yield serializers.serialize(
      object.path,
      specifiedType: const FullType(String),
    );
    yield r'message';
    yield serializers.serialize(
      object.message,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ListTasks400ResponseDetailsInner object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ListTasks400ResponseDetailsInnerBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'path':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.path = valueDes;
          break;
        case r'message':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.message = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ListTasks400ResponseDetailsInner deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ListTasks400ResponseDetailsInnerBuilder();
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


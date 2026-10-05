//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:oprino_api/src/model/list_tasks400_response_details_inner.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'list_tasks400_response.g.dart';

/// ListTasks400Response
///
/// Properties:
/// * [statusCode] 
/// * [error] 
/// * [message] 
/// * [details] 
@BuiltValue()
abstract class ListTasks400Response implements Built<ListTasks400Response, ListTasks400ResponseBuilder> {
  @BuiltValueField(wireName: r'statusCode')
  num get statusCode;

  @BuiltValueField(wireName: r'error')
  String get error;

  @BuiltValueField(wireName: r'message')
  String get message;

  @BuiltValueField(wireName: r'details')
  BuiltList<ListTasks400ResponseDetailsInner>? get details;

  ListTasks400Response._();

  factory ListTasks400Response([void updates(ListTasks400ResponseBuilder b)]) = _$ListTasks400Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ListTasks400ResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ListTasks400Response> get serializer => _$ListTasks400ResponseSerializer();
}

class _$ListTasks400ResponseSerializer implements PrimitiveSerializer<ListTasks400Response> {
  @override
  final Iterable<Type> types = const [ListTasks400Response, _$ListTasks400Response];

  @override
  final String wireName = r'ListTasks400Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ListTasks400Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'statusCode';
    yield serializers.serialize(
      object.statusCode,
      specifiedType: const FullType(num),
    );
    yield r'error';
    yield serializers.serialize(
      object.error,
      specifiedType: const FullType(String),
    );
    yield r'message';
    yield serializers.serialize(
      object.message,
      specifiedType: const FullType(String),
    );
    if (object.details != null) {
      yield r'details';
      yield serializers.serialize(
        object.details,
        specifiedType: const FullType(BuiltList, [FullType(ListTasks400ResponseDetailsInner)]),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    ListTasks400Response object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ListTasks400ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'statusCode':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.statusCode = valueDes;
          break;
        case r'error':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.error = valueDes;
          break;
        case r'message':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.message = valueDes;
          break;
        case r'details':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(ListTasks400ResponseDetailsInner)]),
          ) as BuiltList<ListTasks400ResponseDetailsInner>;
          result.details.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ListTasks400Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ListTasks400ResponseBuilder();
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


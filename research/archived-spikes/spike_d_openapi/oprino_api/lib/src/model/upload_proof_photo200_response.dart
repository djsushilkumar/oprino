//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'upload_proof_photo200_response.g.dart';

/// UploadProofPhoto200Response
///
/// Properties:
/// * [fileId] 
/// * [fileName] 
/// * [contentType] 
/// * [sizeBytes] 
/// * [uploadedAt] 
@BuiltValue()
abstract class UploadProofPhoto200Response implements Built<UploadProofPhoto200Response, UploadProofPhoto200ResponseBuilder> {
  @BuiltValueField(wireName: r'fileId')
  String get fileId;

  @BuiltValueField(wireName: r'fileName')
  String get fileName;

  @BuiltValueField(wireName: r'contentType')
  String get contentType;

  @BuiltValueField(wireName: r'sizeBytes')
  int get sizeBytes;

  @BuiltValueField(wireName: r'uploadedAt')
  DateTime get uploadedAt;

  UploadProofPhoto200Response._();

  factory UploadProofPhoto200Response([void updates(UploadProofPhoto200ResponseBuilder b)]) = _$UploadProofPhoto200Response;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UploadProofPhoto200ResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UploadProofPhoto200Response> get serializer => _$UploadProofPhoto200ResponseSerializer();
}

class _$UploadProofPhoto200ResponseSerializer implements PrimitiveSerializer<UploadProofPhoto200Response> {
  @override
  final Iterable<Type> types = const [UploadProofPhoto200Response, _$UploadProofPhoto200Response];

  @override
  final String wireName = r'UploadProofPhoto200Response';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UploadProofPhoto200Response object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'fileId';
    yield serializers.serialize(
      object.fileId,
      specifiedType: const FullType(String),
    );
    yield r'fileName';
    yield serializers.serialize(
      object.fileName,
      specifiedType: const FullType(String),
    );
    yield r'contentType';
    yield serializers.serialize(
      object.contentType,
      specifiedType: const FullType(String),
    );
    yield r'sizeBytes';
    yield serializers.serialize(
      object.sizeBytes,
      specifiedType: const FullType(int),
    );
    yield r'uploadedAt';
    yield serializers.serialize(
      object.uploadedAt,
      specifiedType: const FullType(DateTime),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    UploadProofPhoto200Response object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required UploadProofPhoto200ResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'fileId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.fileId = valueDes;
          break;
        case r'fileName':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.fileName = valueDes;
          break;
        case r'contentType':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.contentType = valueDes;
          break;
        case r'sizeBytes':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.sizeBytes = valueDes;
          break;
        case r'uploadedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.uploadedAt = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  UploadProofPhoto200Response deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UploadProofPhoto200ResponseBuilder();
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


// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'upload_proof_photo200_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$UploadProofPhoto200Response extends UploadProofPhoto200Response {
  @override
  final String fileId;
  @override
  final String fileName;
  @override
  final String contentType;
  @override
  final int sizeBytes;
  @override
  final DateTime uploadedAt;

  factory _$UploadProofPhoto200Response(
          [void Function(UploadProofPhoto200ResponseBuilder)? updates]) =>
      (new UploadProofPhoto200ResponseBuilder()..update(updates))._build();

  _$UploadProofPhoto200Response._(
      {required this.fileId,
      required this.fileName,
      required this.contentType,
      required this.sizeBytes,
      required this.uploadedAt})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        fileId, r'UploadProofPhoto200Response', 'fileId');
    BuiltValueNullFieldError.checkNotNull(
        fileName, r'UploadProofPhoto200Response', 'fileName');
    BuiltValueNullFieldError.checkNotNull(
        contentType, r'UploadProofPhoto200Response', 'contentType');
    BuiltValueNullFieldError.checkNotNull(
        sizeBytes, r'UploadProofPhoto200Response', 'sizeBytes');
    BuiltValueNullFieldError.checkNotNull(
        uploadedAt, r'UploadProofPhoto200Response', 'uploadedAt');
  }

  @override
  UploadProofPhoto200Response rebuild(
          void Function(UploadProofPhoto200ResponseBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  UploadProofPhoto200ResponseBuilder toBuilder() =>
      new UploadProofPhoto200ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UploadProofPhoto200Response &&
        fileId == other.fileId &&
        fileName == other.fileName &&
        contentType == other.contentType &&
        sizeBytes == other.sizeBytes &&
        uploadedAt == other.uploadedAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, fileId.hashCode);
    _$hash = $jc(_$hash, fileName.hashCode);
    _$hash = $jc(_$hash, contentType.hashCode);
    _$hash = $jc(_$hash, sizeBytes.hashCode);
    _$hash = $jc(_$hash, uploadedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'UploadProofPhoto200Response')
          ..add('fileId', fileId)
          ..add('fileName', fileName)
          ..add('contentType', contentType)
          ..add('sizeBytes', sizeBytes)
          ..add('uploadedAt', uploadedAt))
        .toString();
  }
}

class UploadProofPhoto200ResponseBuilder
    implements
        Builder<UploadProofPhoto200Response,
            UploadProofPhoto200ResponseBuilder> {
  _$UploadProofPhoto200Response? _$v;

  String? _fileId;
  String? get fileId => _$this._fileId;
  set fileId(String? fileId) => _$this._fileId = fileId;

  String? _fileName;
  String? get fileName => _$this._fileName;
  set fileName(String? fileName) => _$this._fileName = fileName;

  String? _contentType;
  String? get contentType => _$this._contentType;
  set contentType(String? contentType) => _$this._contentType = contentType;

  int? _sizeBytes;
  int? get sizeBytes => _$this._sizeBytes;
  set sizeBytes(int? sizeBytes) => _$this._sizeBytes = sizeBytes;

  DateTime? _uploadedAt;
  DateTime? get uploadedAt => _$this._uploadedAt;
  set uploadedAt(DateTime? uploadedAt) => _$this._uploadedAt = uploadedAt;

  UploadProofPhoto200ResponseBuilder() {
    UploadProofPhoto200Response._defaults(this);
  }

  UploadProofPhoto200ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _fileId = $v.fileId;
      _fileName = $v.fileName;
      _contentType = $v.contentType;
      _sizeBytes = $v.sizeBytes;
      _uploadedAt = $v.uploadedAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UploadProofPhoto200Response other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$UploadProofPhoto200Response;
  }

  @override
  void update(void Function(UploadProofPhoto200ResponseBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UploadProofPhoto200Response build() => _build();

  _$UploadProofPhoto200Response _build() {
    final _$result = _$v ??
        new _$UploadProofPhoto200Response._(
            fileId: BuiltValueNullFieldError.checkNotNull(
                fileId, r'UploadProofPhoto200Response', 'fileId'),
            fileName: BuiltValueNullFieldError.checkNotNull(
                fileName, r'UploadProofPhoto200Response', 'fileName'),
            contentType: BuiltValueNullFieldError.checkNotNull(
                contentType, r'UploadProofPhoto200Response', 'contentType'),
            sizeBytes: BuiltValueNullFieldError.checkNotNull(
                sizeBytes, r'UploadProofPhoto200Response', 'sizeBytes'),
            uploadedAt: BuiltValueNullFieldError.checkNotNull(
                uploadedAt, r'UploadProofPhoto200Response', 'uploadedAt'));
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'list_tasks400_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ListTasks400Response extends ListTasks400Response {
  @override
  final num statusCode;
  @override
  final String error;
  @override
  final String message;
  @override
  final BuiltList<ListTasks400ResponseDetailsInner>? details;

  factory _$ListTasks400Response(
          [void Function(ListTasks400ResponseBuilder)? updates]) =>
      (new ListTasks400ResponseBuilder()..update(updates))._build();

  _$ListTasks400Response._(
      {required this.statusCode,
      required this.error,
      required this.message,
      this.details})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        statusCode, r'ListTasks400Response', 'statusCode');
    BuiltValueNullFieldError.checkNotNull(
        error, r'ListTasks400Response', 'error');
    BuiltValueNullFieldError.checkNotNull(
        message, r'ListTasks400Response', 'message');
  }

  @override
  ListTasks400Response rebuild(
          void Function(ListTasks400ResponseBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ListTasks400ResponseBuilder toBuilder() =>
      new ListTasks400ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ListTasks400Response &&
        statusCode == other.statusCode &&
        error == other.error &&
        message == other.message &&
        details == other.details;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, statusCode.hashCode);
    _$hash = $jc(_$hash, error.hashCode);
    _$hash = $jc(_$hash, message.hashCode);
    _$hash = $jc(_$hash, details.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ListTasks400Response')
          ..add('statusCode', statusCode)
          ..add('error', error)
          ..add('message', message)
          ..add('details', details))
        .toString();
  }
}

class ListTasks400ResponseBuilder
    implements Builder<ListTasks400Response, ListTasks400ResponseBuilder> {
  _$ListTasks400Response? _$v;

  num? _statusCode;
  num? get statusCode => _$this._statusCode;
  set statusCode(num? statusCode) => _$this._statusCode = statusCode;

  String? _error;
  String? get error => _$this._error;
  set error(String? error) => _$this._error = error;

  String? _message;
  String? get message => _$this._message;
  set message(String? message) => _$this._message = message;

  ListBuilder<ListTasks400ResponseDetailsInner>? _details;
  ListBuilder<ListTasks400ResponseDetailsInner> get details =>
      _$this._details ??= new ListBuilder<ListTasks400ResponseDetailsInner>();
  set details(ListBuilder<ListTasks400ResponseDetailsInner>? details) =>
      _$this._details = details;

  ListTasks400ResponseBuilder() {
    ListTasks400Response._defaults(this);
  }

  ListTasks400ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _statusCode = $v.statusCode;
      _error = $v.error;
      _message = $v.message;
      _details = $v.details?.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ListTasks400Response other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$ListTasks400Response;
  }

  @override
  void update(void Function(ListTasks400ResponseBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ListTasks400Response build() => _build();

  _$ListTasks400Response _build() {
    _$ListTasks400Response _$result;
    try {
      _$result = _$v ??
          new _$ListTasks400Response._(
              statusCode: BuiltValueNullFieldError.checkNotNull(
                  statusCode, r'ListTasks400Response', 'statusCode'),
              error: BuiltValueNullFieldError.checkNotNull(
                  error, r'ListTasks400Response', 'error'),
              message: BuiltValueNullFieldError.checkNotNull(
                  message, r'ListTasks400Response', 'message'),
              details: _details?.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'details';
        _details?.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'ListTasks400Response', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

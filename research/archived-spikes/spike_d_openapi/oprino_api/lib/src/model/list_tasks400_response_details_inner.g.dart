// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'list_tasks400_response_details_inner.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ListTasks400ResponseDetailsInner
    extends ListTasks400ResponseDetailsInner {
  @override
  final String path;
  @override
  final String message;

  factory _$ListTasks400ResponseDetailsInner(
          [void Function(ListTasks400ResponseDetailsInnerBuilder)? updates]) =>
      (new ListTasks400ResponseDetailsInnerBuilder()..update(updates))._build();

  _$ListTasks400ResponseDetailsInner._(
      {required this.path, required this.message})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        path, r'ListTasks400ResponseDetailsInner', 'path');
    BuiltValueNullFieldError.checkNotNull(
        message, r'ListTasks400ResponseDetailsInner', 'message');
  }

  @override
  ListTasks400ResponseDetailsInner rebuild(
          void Function(ListTasks400ResponseDetailsInnerBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ListTasks400ResponseDetailsInnerBuilder toBuilder() =>
      new ListTasks400ResponseDetailsInnerBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ListTasks400ResponseDetailsInner &&
        path == other.path &&
        message == other.message;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, path.hashCode);
    _$hash = $jc(_$hash, message.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ListTasks400ResponseDetailsInner')
          ..add('path', path)
          ..add('message', message))
        .toString();
  }
}

class ListTasks400ResponseDetailsInnerBuilder
    implements
        Builder<ListTasks400ResponseDetailsInner,
            ListTasks400ResponseDetailsInnerBuilder> {
  _$ListTasks400ResponseDetailsInner? _$v;

  String? _path;
  String? get path => _$this._path;
  set path(String? path) => _$this._path = path;

  String? _message;
  String? get message => _$this._message;
  set message(String? message) => _$this._message = message;

  ListTasks400ResponseDetailsInnerBuilder() {
    ListTasks400ResponseDetailsInner._defaults(this);
  }

  ListTasks400ResponseDetailsInnerBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _path = $v.path;
      _message = $v.message;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ListTasks400ResponseDetailsInner other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$ListTasks400ResponseDetailsInner;
  }

  @override
  void update(void Function(ListTasks400ResponseDetailsInnerBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ListTasks400ResponseDetailsInner build() => _build();

  _$ListTasks400ResponseDetailsInner _build() {
    final _$result = _$v ??
        new _$ListTasks400ResponseDetailsInner._(
            path: BuiltValueNullFieldError.checkNotNull(
                path, r'ListTasks400ResponseDetailsInner', 'path'),
            message: BuiltValueNullFieldError.checkNotNull(
                message, r'ListTasks400ResponseDetailsInner', 'message'));
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'list_tasks200_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ListTasks200Response extends ListTasks200Response {
  @override
  final BuiltList<ListTasks200ResponseItemsInner> items;
  @override
  final ListTasks200ResponsePagination pagination;

  factory _$ListTasks200Response(
          [void Function(ListTasks200ResponseBuilder)? updates]) =>
      (new ListTasks200ResponseBuilder()..update(updates))._build();

  _$ListTasks200Response._({required this.items, required this.pagination})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        items, r'ListTasks200Response', 'items');
    BuiltValueNullFieldError.checkNotNull(
        pagination, r'ListTasks200Response', 'pagination');
  }

  @override
  ListTasks200Response rebuild(
          void Function(ListTasks200ResponseBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ListTasks200ResponseBuilder toBuilder() =>
      new ListTasks200ResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ListTasks200Response &&
        items == other.items &&
        pagination == other.pagination;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, items.hashCode);
    _$hash = $jc(_$hash, pagination.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ListTasks200Response')
          ..add('items', items)
          ..add('pagination', pagination))
        .toString();
  }
}

class ListTasks200ResponseBuilder
    implements Builder<ListTasks200Response, ListTasks200ResponseBuilder> {
  _$ListTasks200Response? _$v;

  ListBuilder<ListTasks200ResponseItemsInner>? _items;
  ListBuilder<ListTasks200ResponseItemsInner> get items =>
      _$this._items ??= new ListBuilder<ListTasks200ResponseItemsInner>();
  set items(ListBuilder<ListTasks200ResponseItemsInner>? items) =>
      _$this._items = items;

  ListTasks200ResponsePaginationBuilder? _pagination;
  ListTasks200ResponsePaginationBuilder get pagination =>
      _$this._pagination ??= new ListTasks200ResponsePaginationBuilder();
  set pagination(ListTasks200ResponsePaginationBuilder? pagination) =>
      _$this._pagination = pagination;

  ListTasks200ResponseBuilder() {
    ListTasks200Response._defaults(this);
  }

  ListTasks200ResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _items = $v.items.toBuilder();
      _pagination = $v.pagination.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ListTasks200Response other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$ListTasks200Response;
  }

  @override
  void update(void Function(ListTasks200ResponseBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ListTasks200Response build() => _build();

  _$ListTasks200Response _build() {
    _$ListTasks200Response _$result;
    try {
      _$result = _$v ??
          new _$ListTasks200Response._(
              items: items.build(), pagination: pagination.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'items';
        items.build();
        _$failedField = 'pagination';
        pagination.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'ListTasks200Response', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'list_tasks200_response_pagination.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ListTasks200ResponsePagination extends ListTasks200ResponsePagination {
  @override
  final int total;
  @override
  final int page;
  @override
  final int limit;
  @override
  final bool hasMore;

  factory _$ListTasks200ResponsePagination(
          [void Function(ListTasks200ResponsePaginationBuilder)? updates]) =>
      (new ListTasks200ResponsePaginationBuilder()..update(updates))._build();

  _$ListTasks200ResponsePagination._(
      {required this.total,
      required this.page,
      required this.limit,
      required this.hasMore})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        total, r'ListTasks200ResponsePagination', 'total');
    BuiltValueNullFieldError.checkNotNull(
        page, r'ListTasks200ResponsePagination', 'page');
    BuiltValueNullFieldError.checkNotNull(
        limit, r'ListTasks200ResponsePagination', 'limit');
    BuiltValueNullFieldError.checkNotNull(
        hasMore, r'ListTasks200ResponsePagination', 'hasMore');
  }

  @override
  ListTasks200ResponsePagination rebuild(
          void Function(ListTasks200ResponsePaginationBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ListTasks200ResponsePaginationBuilder toBuilder() =>
      new ListTasks200ResponsePaginationBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ListTasks200ResponsePagination &&
        total == other.total &&
        page == other.page &&
        limit == other.limit &&
        hasMore == other.hasMore;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, total.hashCode);
    _$hash = $jc(_$hash, page.hashCode);
    _$hash = $jc(_$hash, limit.hashCode);
    _$hash = $jc(_$hash, hasMore.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ListTasks200ResponsePagination')
          ..add('total', total)
          ..add('page', page)
          ..add('limit', limit)
          ..add('hasMore', hasMore))
        .toString();
  }
}

class ListTasks200ResponsePaginationBuilder
    implements
        Builder<ListTasks200ResponsePagination,
            ListTasks200ResponsePaginationBuilder> {
  _$ListTasks200ResponsePagination? _$v;

  int? _total;
  int? get total => _$this._total;
  set total(int? total) => _$this._total = total;

  int? _page;
  int? get page => _$this._page;
  set page(int? page) => _$this._page = page;

  int? _limit;
  int? get limit => _$this._limit;
  set limit(int? limit) => _$this._limit = limit;

  bool? _hasMore;
  bool? get hasMore => _$this._hasMore;
  set hasMore(bool? hasMore) => _$this._hasMore = hasMore;

  ListTasks200ResponsePaginationBuilder() {
    ListTasks200ResponsePagination._defaults(this);
  }

  ListTasks200ResponsePaginationBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _total = $v.total;
      _page = $v.page;
      _limit = $v.limit;
      _hasMore = $v.hasMore;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ListTasks200ResponsePagination other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$ListTasks200ResponsePagination;
  }

  @override
  void update(void Function(ListTasks200ResponsePaginationBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ListTasks200ResponsePagination build() => _build();

  _$ListTasks200ResponsePagination _build() {
    final _$result = _$v ??
        new _$ListTasks200ResponsePagination._(
            total: BuiltValueNullFieldError.checkNotNull(
                total, r'ListTasks200ResponsePagination', 'total'),
            page: BuiltValueNullFieldError.checkNotNull(
                page, r'ListTasks200ResponsePagination', 'page'),
            limit: BuiltValueNullFieldError.checkNotNull(
                limit, r'ListTasks200ResponsePagination', 'limit'),
            hasMore: BuiltValueNullFieldError.checkNotNull(
                hasMore, r'ListTasks200ResponsePagination', 'hasMore'));
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

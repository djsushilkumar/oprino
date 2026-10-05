// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'list_tasks200_response_items_inner_location.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ListTasks200ResponseItemsInnerLocation
    extends ListTasks200ResponseItemsInnerLocation {
  @override
  final num latitude;
  @override
  final num longitude;
  @override
  final num? accuracy;

  factory _$ListTasks200ResponseItemsInnerLocation(
          [void Function(ListTasks200ResponseItemsInnerLocationBuilder)?
              updates]) =>
      (new ListTasks200ResponseItemsInnerLocationBuilder()..update(updates))
          ._build();

  _$ListTasks200ResponseItemsInnerLocation._(
      {required this.latitude, required this.longitude, this.accuracy})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        latitude, r'ListTasks200ResponseItemsInnerLocation', 'latitude');
    BuiltValueNullFieldError.checkNotNull(
        longitude, r'ListTasks200ResponseItemsInnerLocation', 'longitude');
  }

  @override
  ListTasks200ResponseItemsInnerLocation rebuild(
          void Function(ListTasks200ResponseItemsInnerLocationBuilder)
              updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ListTasks200ResponseItemsInnerLocationBuilder toBuilder() =>
      new ListTasks200ResponseItemsInnerLocationBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ListTasks200ResponseItemsInnerLocation &&
        latitude == other.latitude &&
        longitude == other.longitude &&
        accuracy == other.accuracy;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, latitude.hashCode);
    _$hash = $jc(_$hash, longitude.hashCode);
    _$hash = $jc(_$hash, accuracy.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
            r'ListTasks200ResponseItemsInnerLocation')
          ..add('latitude', latitude)
          ..add('longitude', longitude)
          ..add('accuracy', accuracy))
        .toString();
  }
}

class ListTasks200ResponseItemsInnerLocationBuilder
    implements
        Builder<ListTasks200ResponseItemsInnerLocation,
            ListTasks200ResponseItemsInnerLocationBuilder> {
  _$ListTasks200ResponseItemsInnerLocation? _$v;

  num? _latitude;
  num? get latitude => _$this._latitude;
  set latitude(num? latitude) => _$this._latitude = latitude;

  num? _longitude;
  num? get longitude => _$this._longitude;
  set longitude(num? longitude) => _$this._longitude = longitude;

  num? _accuracy;
  num? get accuracy => _$this._accuracy;
  set accuracy(num? accuracy) => _$this._accuracy = accuracy;

  ListTasks200ResponseItemsInnerLocationBuilder() {
    ListTasks200ResponseItemsInnerLocation._defaults(this);
  }

  ListTasks200ResponseItemsInnerLocationBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _latitude = $v.latitude;
      _longitude = $v.longitude;
      _accuracy = $v.accuracy;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ListTasks200ResponseItemsInnerLocation other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$ListTasks200ResponseItemsInnerLocation;
  }

  @override
  void update(
      void Function(ListTasks200ResponseItemsInnerLocationBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ListTasks200ResponseItemsInnerLocation build() => _build();

  _$ListTasks200ResponseItemsInnerLocation _build() {
    final _$result = _$v ??
        new _$ListTasks200ResponseItemsInnerLocation._(
            latitude: BuiltValueNullFieldError.checkNotNull(latitude,
                r'ListTasks200ResponseItemsInnerLocation', 'latitude'),
            longitude: BuiltValueNullFieldError.checkNotNull(longitude,
                r'ListTasks200ResponseItemsInnerLocation', 'longitude'),
            accuracy: accuracy);
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint

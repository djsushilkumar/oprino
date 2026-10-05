//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_import

import 'package:one_of_serializer/any_of_serializer.dart';
import 'package:one_of_serializer/one_of_serializer.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/json_object.dart';
import 'package:built_value/serializer.dart';
import 'package:built_value/standard_json_plugin.dart';
import 'package:built_value/iso_8601_date_time_serializer.dart';
import 'package:oprino_api/src/date_serializer.dart';
import 'package:oprino_api/src/model/date.dart';

import 'package:oprino_api/src/model/create_task_request.dart';
import 'package:oprino_api/src/model/list_tasks200_response.dart';
import 'package:oprino_api/src/model/list_tasks200_response_items_inner.dart';
import 'package:oprino_api/src/model/list_tasks200_response_items_inner_location.dart';
import 'package:oprino_api/src/model/list_tasks200_response_pagination.dart';
import 'package:oprino_api/src/model/list_tasks400_response.dart';
import 'package:oprino_api/src/model/list_tasks400_response_details_inner.dart';
import 'package:oprino_api/src/model/upload_proof_photo200_response.dart';

part 'serializers.g.dart';

@SerializersFor([
  CreateTaskRequest,
  ListTasks200Response,
  ListTasks200ResponseItemsInner,
  ListTasks200ResponseItemsInnerLocation,
  ListTasks200ResponsePagination,
  ListTasks400Response,
  ListTasks400ResponseDetailsInner,
  UploadProofPhoto200Response,
])
Serializers serializers = (_$serializers.toBuilder()
      ..add(const OneOfSerializer())
      ..add(const AnyOfSerializer())
      ..add(const DateSerializer())
      ..add(Iso8601DateTimeSerializer()))
    .build();

Serializers standardSerializers =
    (serializers.toBuilder()..addPlugin(StandardJsonPlugin())).build();

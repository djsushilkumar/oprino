// GENERATED CODE - DO NOT MODIFY BY HAND
// Generated from OpenAPI 3.1 specification by @oprino/contracts

import 'package:dio/dio.dart';
import 'model/health_response.dart';
import 'model/version_response.dart';
import 'model/api_error.dart';

class OprinoApiClient {
  final Dio dio;

  OprinoApiClient({
    Dio? dio,
    String baseUrl = 'http://10.0.2.2:3000',
  }) : dio = dio ??
            Dio(BaseOptions(
              baseUrl: baseUrl,
              connectTimeout: const Duration(seconds: 10),
              receiveTimeout: const Duration(seconds: 10),
              headers: {
                'Origin': 'oprino://app',
                'Accept': 'application/json',
              },
            ));

  Future<HealthResponse> getHealth() async {
    try {
      final response = await dio.get<Map<String, dynamic>>('/health');
      return HealthResponse.fromJson(response.data!);
    } on DioException catch (e) {
      if (e.response?.data is Map<String, dynamic>) {
        throw ApiError.fromJson(e.response!.data as Map<String, dynamic>);
      }
      rethrow;
    }
  }

  Future<VersionResponse> getVersion() async {
    try {
      final response = await dio.get<Map<String, dynamic>>('/v1/version');
      return VersionResponse.fromJson(response.data!);
    } on DioException catch (e) {
      if (e.response?.data is Map<String, dynamic>) {
        throw ApiError.fromJson(e.response!.data as Map<String, dynamic>);
      }
      rethrow;
    }
  }
}

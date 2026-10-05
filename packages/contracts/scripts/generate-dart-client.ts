import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const openApiPath = path.resolve(rootDir, 'dist', 'openapi.json');
const targetDartDir = path.resolve(rootDir, '..', '..', 'generated', 'dart-api');

if (!fs.existsSync(openApiPath)) {
  console.error(`OpenAPI spec not found at ${openApiPath}. Please run export:openapi first.`);
  process.exit(1);
}

const spec = JSON.parse(fs.readFileSync(openApiPath, 'utf-8'));

const modelDir = path.resolve(targetDartDir, 'lib', 'src', 'model');
const srcDir = path.resolve(targetDartDir, 'lib', 'src');
const libDir = path.resolve(targetDartDir, 'lib');

fs.mkdirSync(modelDir, { recursive: true });

// 1. Generate HealthResponse
const healthResponseContent = `// GENERATED CODE - DO NOT MODIFY BY HAND
// Generated from OpenAPI 3.1 specification by @oprino/contracts

class HealthResponse {
  final String status;
  final DateTime timestamp;
  final Map<String, String> services;

  const HealthResponse({
    required this.status,
    required this.timestamp,
    required this.services,
  });

  factory HealthResponse.fromJson(Map<String, dynamic> json) {
    return HealthResponse(
      status: json['status'] as String,
      timestamp: DateTime.parse(json['timestamp'] as String),
      services: (json['services'] as Map<String, dynamic>).map(
        (key, value) => MapEntry(key, value as String),
      ),
    );
  }

  Map<String, dynamic> toJson() => {
        'status': status,
        'timestamp': timestamp.toIso8601String(),
        'services': services,
      };
}
`;

fs.writeFileSync(path.resolve(modelDir, 'health_response.dart'), healthResponseContent, 'utf-8');

// 2. Generate VersionResponse
const versionResponseContent = `// GENERATED CODE - DO NOT MODIFY BY HAND
// Generated from OpenAPI 3.1 specification by @oprino/contracts

class VersionResponse {
  final String name;
  final String version;
  final String environment;
  final String? gitCommit;
  final Map<String, dynamic> architecture;

  const VersionResponse({
    required this.name,
    required this.version,
    required this.environment,
    this.gitCommit,
    required this.architecture,
  });

  factory VersionResponse.fromJson(Map<String, dynamic> json) {
    return VersionResponse(
      name: json['name'] as String,
      version: json['version'] as String,
      environment: json['environment'] as String,
      gitCommit: json['gitCommit'] as String?,
      architecture: json['architecture'] as Map<String, dynamic>,
    );
  }

  Map<String, dynamic> toJson() => {
        'name': name,
        'version': version,
        'environment': environment,
        if (gitCommit != null) 'gitCommit': gitCommit,
        'architecture': architecture,
      };
}
`;

fs.writeFileSync(path.resolve(modelDir, 'version_response.dart'), versionResponseContent, 'utf-8');

// 3. Generate ApiError
const apiErrorContent = `// GENERATED CODE - DO NOT MODIFY BY HAND
// Generated from OpenAPI 3.1 specification by @oprino/contracts

class ApiError implements Exception {
  final int statusCode;
  final String error;
  final String message;
  final List<dynamic>? details;

  const ApiError({
    required this.statusCode,
    required this.error,
    required this.message,
    this.details,
  });

  factory ApiError.fromJson(Map<String, dynamic> json) {
    return ApiError(
      statusCode: json['statusCode'] as int,
      error: json['error'] as String,
      message: json['message'] as String,
      details: json['details'] as List<dynamic>?,
    );
  }

  @override
  String toString() => 'ApiError(status: $statusCode, error: $error, message: $message)';
}
`;

fs.writeFileSync(path.resolve(modelDir, 'api_error.dart'), apiErrorContent, 'utf-8');

// 4. Generate ApiClient
const apiClientContent = `// GENERATED CODE - DO NOT MODIFY BY HAND
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
`;

fs.writeFileSync(path.resolve(srcDir, 'api_client.dart'), apiClientContent, 'utf-8');

// 5. Generate Root Library Export
const oprinoApiContent = `// GENERATED CODE - DO NOT MODIFY BY HAND
// Generated from OpenAPI 3.1 specification by @oprino/contracts

library oprino_api;

export 'src/api_client.dart';
export 'src/model/health_response.dart';
export 'src/model/version_response.dart';
export 'src/model/api_error.dart';
`;

fs.writeFileSync(path.resolve(libDir, 'oprino_api.dart'), oprinoApiContent, 'utf-8');

console.log(`✓ Generated Dart API client from OpenAPI ${spec.openapi} into generated/dart-api`);

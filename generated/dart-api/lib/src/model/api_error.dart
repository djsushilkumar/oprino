// GENERATED CODE - DO NOT MODIFY BY HAND
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
      statusCode: json['statusCode'] as int? ?? 500,
      error: json['error'] as String? ?? 'Error',
      message: json['message'] as String? ?? 'An unexpected error occurred',
      details: json['details'] as List<dynamic>?,
    );
  }

  @override
  String toString() => 'ApiError(status: $statusCode, error: $error, message: $message)';
}

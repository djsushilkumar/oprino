// GENERATED CODE - DO NOT MODIFY BY HAND
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

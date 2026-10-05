// GENERATED CODE - DO NOT MODIFY BY HAND
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

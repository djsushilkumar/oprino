import 'package:flutter/foundation.dart';

enum EnvironmentType {
  localPilotDebug,
  cloudStagingDebug,
  production,
}

class AppConfig {
  final EnvironmentType environment;
  final String environmentName;
  final String apiBaseUrl;
  final bool isCleartextAllowed;

  const AppConfig({
    required this.environment,
    required this.environmentName,
    required this.apiBaseUrl,
    required this.isCleartextAllowed,
  });

  /// Validates whether a host is an authorized local loopback, Android emulator alias,
  /// or explicitly approved RFC-1918 private network interface.
  static bool isAuthorizedLocalHost(String host) {
    final lower = host.toLowerCase().trim();
    if (lower == 'localhost' || lower == '127.0.0.1' || lower == '::1' || lower == '10.0.2.2') {
      return true;
    }
    // 192.168.0.0/16
    final ipv4Pattern192 = RegExp(r'^192\.168\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$');
    if (ipv4Pattern192.hasMatch(lower)) {
      return true;
    }
    // 10.0.0.0/8
    final ipv4Pattern10 = RegExp(r'^10\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$');
    if (ipv4Pattern10.hasMatch(lower)) {
      return true;
    }
    // 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
    final ipv4Pattern172 = RegExp(r'^172\.(1[6-9]|2\d|3[0-1])\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$');
    if (ipv4Pattern172.hasMatch(lower)) {
      return true;
    }
    return false;
  }

  /// Normalizes an API base URL by stripping trailing slashes and redundant trailing '/v1'
  /// to prevent double '/v1/v1/' route concatenation when clients append endpoint paths.
  static String normalizeApiUrl(String url) {
    var trimmed = url.trim();
    while (trimmed.endsWith('/')) {
      trimmed = trimmed.substring(0, trimmed.length - 1);
    }
    if (trimmed.endsWith('/v1')) {
      trimmed = trimmed.substring(0, trimmed.length - 3);
    }
    return trimmed;
  }

  /// Resolves and validates an AppConfig instance given explicit parameters.
  /// Used by fromEnvironment() and automated unit test suites.
  static AppConfig resolve({
    required String rawEnv,
    String customUrl = '',
    bool isEmulator = false,
  }) {
    final normalizedEnv = rawEnv.toUpperCase().replaceAll('-', '_');

    if (normalizedEnv == 'LOCAL_PILOT_DEBUG' || normalizedEnv == 'PILOT' || normalizedEnv == 'DEVELOPMENT') {
      final rawBaseUrl = customUrl.isNotEmpty
          ? customUrl
          : (isEmulator ? 'http://10.0.2.2:3001' : 'http://localhost:3001');
      final baseUrl = normalizeApiUrl(rawBaseUrl);

      final uri = Uri.tryParse(baseUrl);
      if (uri == null || (!uri.isScheme('http') && !uri.isScheme('https'))) {
        throw ArgumentError('Invalid API_BASE_URL: "$baseUrl" is not a valid URI');
      }

      final host = uri.host.toLowerCase();
      if (host.isEmpty || !isAuthorizedLocalHost(host)) {
        throw ArgumentError(
          'Security barrier violation: LOCAL_PILOT_DEBUG must target authorized local loopback, '
          'Android emulator, or approved private network interfaces (e.g. localhost, 127.0.0.1, 10.0.2.2, 192.168.x.x), '
          'but received unauthorized host "$host" in "$baseUrl"',
        );
      }

      return AppConfig(
        environment: EnvironmentType.localPilotDebug,
        environmentName: 'LOCAL_PILOT_DEBUG',
        apiBaseUrl: baseUrl,
        isCleartextAllowed: true,
      );
    }

    if (normalizedEnv == 'CLOUD_STAGING_DEBUG' || normalizedEnv == 'STAGING') {
      final rawBaseUrl = customUrl.isNotEmpty ? customUrl : 'https://staging-api.oprino.com';
      final baseUrl = normalizeApiUrl(rawBaseUrl);
      final uri = Uri.tryParse(baseUrl);

      if (uri == null || !uri.isScheme('https') || uri.host.isEmpty) {
        throw ArgumentError(
          'Contradictory configuration: CLOUD_STAGING_DEBUG requires a secure HTTPS endpoint, '
          'but received "$baseUrl"',
        );
      }

      return AppConfig(
        environment: EnvironmentType.cloudStagingDebug,
        environmentName: 'CLOUD_STAGING_DEBUG',
        apiBaseUrl: baseUrl,
        isCleartextAllowed: false,
      );
    }

    if (normalizedEnv == 'PRODUCTION' || normalizedEnv == 'PROD') {
      final rawBaseUrl = customUrl.isNotEmpty ? customUrl : 'https://oprino-api.onrender.com';
      final baseUrl = normalizeApiUrl(rawBaseUrl);
      final uri = Uri.tryParse(baseUrl);

      if (uri == null || !uri.isScheme('https') || uri.host.isEmpty) {
        throw ArgumentError(
          'Contradictory configuration: PRODUCTION requires a secure HTTPS endpoint, '
          'but received "$baseUrl"',
        );
      }

      final host = uri.host.toLowerCase();
      if (isAuthorizedLocalHost(host)) {
        throw ArgumentError(
          'Security barrier violation: PRODUCTION endpoint cannot target local loopback or private networks, '
          'but received "$host" in "$baseUrl"',
        );
      }

      return AppConfig(
        environment: EnvironmentType.production,
        environmentName: 'PRODUCTION',
        apiBaseUrl: baseUrl,
        isCleartextAllowed: false,
      );
    }

    // Fail-closed security gate: Reject unapproved or unknown environments
    throw ArgumentError(
      'Unsupported or unverified environment: "$rawEnv". '
      'Allowed configurations are: LOCAL_PILOT_DEBUG, CLOUD_STAGING_DEBUG, PRODUCTION.',
    );
  }

  factory AppConfig.fromEnvironment({bool? isReleaseModeOverride}) {
    final effectiveReleaseMode = isReleaseModeOverride ?? kReleaseMode;

    if (effectiveReleaseMode) {
      const rawReleaseEnv = String.fromEnvironment('ENVIRONMENT', defaultValue: '');
      if (rawReleaseEnv.isEmpty) {
        throw StateError(
          'Security gate violation: Release mode requires explicit --dart-define=ENVIRONMENT=PRODUCTION. '
          'Silent fallback to development configuration is strictly forbidden in production builds.',
        );
      }
      final normalized = rawReleaseEnv.toUpperCase().replaceAll('-', '_');
      if (normalized != 'PRODUCTION' && normalized != 'PROD') {
        throw StateError(
          'Security gate violation: Release mode cannot target "$rawReleaseEnv". '
          'Production distribution builds must specify ENVIRONMENT=PRODUCTION.',
        );
      }
    }

    const rawEnv = String.fromEnvironment('ENVIRONMENT', defaultValue: 'LOCAL_PILOT_DEBUG');
    const customUrl = String.fromEnvironment('API_BASE_URL', defaultValue: '');
    const isEmulator = bool.fromEnvironment('EMULATOR', defaultValue: false);

    return AppConfig.resolve(
      rawEnv: rawEnv,
      customUrl: customUrl,
      isEmulator: isEmulator,
    );
  }

  static const AppConfig localPilot = AppConfig(
    environment: EnvironmentType.localPilotDebug,
    environmentName: 'LOCAL_PILOT_DEBUG',
    apiBaseUrl: 'http://localhost:3001',
    isCleartextAllowed: true,
  );

  static const AppConfig localEmulator = AppConfig(
    environment: EnvironmentType.localPilotDebug,
    environmentName: 'LOCAL_PILOT_DEBUG',
    apiBaseUrl: 'http://10.0.2.2:3001',
    isCleartextAllowed: true,
  );

  static const AppConfig cloudStaging = AppConfig(
    environment: EnvironmentType.cloudStagingDebug,
    environmentName: 'CLOUD_STAGING_DEBUG',
    apiBaseUrl: 'https://staging-api.oprino.com',
    isCleartextAllowed: false,
  );

  static const AppConfig production = AppConfig(
    environment: EnvironmentType.production,
    environmentName: 'PRODUCTION',
    apiBaseUrl: 'https://oprino-api.onrender.com',
    isCleartextAllowed: false,
  );
}

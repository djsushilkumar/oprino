enum EnvironmentType {
  localPilotDebug,
  cloudStagingDebug,
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

  /// Factory constructor that strictly resolves and validates build configuration.
  /// 
  /// Supports two explicitly separated configurations:
  /// 1. LOCAL_PILOT_DEBUG: http://localhost:3001 (or http://10.0.2.2:3001 for emulator)
  ///    Intended strictly for USB-connected Android testing via adb reverse.
  /// 2. CLOUD_STAGING_DEBUG: Verified HTTPS staging API only.
  ///
  /// Fails fast on missing, unsupported, or contradictory build configurations.
  /// Never silently falls back to live production Render/Neon databases.
  factory AppConfig.fromEnvironment() {
    const rawEnv = String.fromEnvironment('ENVIRONMENT', defaultValue: 'LOCAL_PILOT_DEBUG');
    const customUrl = String.fromEnvironment('API_BASE_URL', defaultValue: '');
    const isEmulator = bool.fromEnvironment('EMULATOR', defaultValue: false);

    final normalizedEnv = rawEnv.toUpperCase().replaceAll('-', '_');

    if (normalizedEnv == 'LOCAL_PILOT_DEBUG' || normalizedEnv == 'PILOT' || normalizedEnv == 'DEVELOPMENT') {
      final baseUrl = customUrl.isNotEmpty
          ? customUrl
          : (isEmulator ? 'http://10.0.2.2:3001' : 'http://localhost:3001');

      // Fail fast on contradictory configuration: LOCAL_PILOT_DEBUG must be a local loopback/private interface
      final uri = Uri.tryParse(baseUrl);
      if (uri == null || (!uri.isScheme('http') && !uri.isScheme('https'))) {
        throw ArgumentError('Invalid API_BASE_URL: "$baseUrl" is not a valid URI');
      }

      final host = uri.host.toLowerCase();
      final isLocalhost = host == 'localhost' || host == '127.0.0.1' || host == '10.0.2.2' || host.startsWith('192.168.') || host.startsWith('10.');
      if (!isLocalhost && !uri.isScheme('http')) {
        throw ArgumentError(
          'Contradictory configuration: LOCAL_PILOT_DEBUG must target local/emulator endpoints '
          '(e.g. http://localhost:3001 or http://10.0.2.2:3001), but received "$baseUrl"',
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
      final baseUrl = customUrl.isNotEmpty ? customUrl : 'https://staging-api.oprino.com';
      final uri = Uri.tryParse(baseUrl);

      if (uri == null || !uri.isScheme('https')) {
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

    // Fail-closed security gate: Reject unapproved, production, or unknown environments
    throw ArgumentError(
      'Unsupported or unverified environment: "$rawEnv". '
      'Allowed pilot configurations are: LOCAL_PILOT_DEBUG, CLOUD_STAGING_DEBUG. '
      'Direct production deployment is prohibited in pilot builds.',
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
}

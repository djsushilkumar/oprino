class AppConfig {
  final String environment;
  final String apiBaseUrl;

  const AppConfig({
    required this.environment,
    required this.apiBaseUrl,
  });

  /// Factory constructor that securely resolves endpoint from compile-time environment flags.
  /// Defaults to isolated local/pilot test endpoints; NEVER silently connects to production customer data.
  factory AppConfig.fromEnvironment() {
    const env = String.fromEnvironment('ENVIRONMENT', defaultValue: 'pilot');
    const customUrl = String.fromEnvironment('API_BASE_URL', defaultValue: '');
    if (customUrl.isNotEmpty) {
      return AppConfig(
        environment: env,
        apiBaseUrl: customUrl,
      );
    }

    switch (env) {
      case 'staging':
        return const AppConfig(
          environment: 'staging',
          apiBaseUrl: 'https://staging-api.oprino.com',
        );
      case 'emulator':
        return const AppConfig(
          environment: 'emulator',
          apiBaseUrl: 'http://10.0.2.2:3001',
        );
      case 'physicalDevice':
      case 'pilot':
      case 'development':
      default:
        return const AppConfig(
          environment: 'pilot',
          apiBaseUrl: 'http://localhost:3001',
        );
    }
  }

  static const AppConfig development = AppConfig(
    environment: 'development',
    apiBaseUrl: 'http://localhost:3001',
  );

  static const AppConfig emulator = AppConfig(
    environment: 'emulator',
    apiBaseUrl: 'http://10.0.2.2:3001',
  );

  static const AppConfig physicalDevice = AppConfig(
    environment: 'physicalDevice',
    apiBaseUrl: 'http://localhost:3001',
  );

  static const AppConfig staging = AppConfig(
    environment: 'staging',
    apiBaseUrl: 'https://staging-api.oprino.com',
  );
}


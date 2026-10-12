class AppConfig {
  final String environment;
  final String apiBaseUrl;

  const AppConfig({
    required this.environment,
    required this.apiBaseUrl,
  });

  static const AppConfig development = AppConfig(
    environment: 'development',
    apiBaseUrl: 'https://oprino-api.onrender.com',
  );

  static const AppConfig emulator = AppConfig(
    environment: 'development',
    apiBaseUrl: 'https://oprino-api.onrender.com',
  );

  static const AppConfig physicalDevice = AppConfig(
    environment: 'development',
    apiBaseUrl: 'https://oprino-api.onrender.com',
  );
}

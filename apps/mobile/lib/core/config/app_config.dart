class AppConfig {
  final String environment;
  final String apiBaseUrl;

  const AppConfig({
    required this.environment,
    required this.apiBaseUrl,
  });

  static const AppConfig development = AppConfig(
    environment: 'development',
    apiBaseUrl: 'http://10.0.2.2:3000', // Default Android emulator loopback
  );

  static const AppConfig physicalDevice = AppConfig(
    environment: 'development',
    apiBaseUrl: 'http://127.0.0.1:3000', // Over ADB reverse
  );
}

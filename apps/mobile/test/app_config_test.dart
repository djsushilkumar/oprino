import 'package:flutter_test/flutter_test.dart';
import 'package:oprino_mobile/core/config/app_config.dart';

void main() {
  group('AppConfig Endpoint Hardening & Fail-Fast Gates', () {
    test('1. Defaults safely to LOCAL_PILOT_DEBUG pointing to http://localhost:3001', () {
      final config = AppConfig.fromEnvironment();
      expect(config.environment, EnvironmentType.localPilotDebug);
      expect(config.environmentName, 'LOCAL_PILOT_DEBUG');
      expect(config.apiBaseUrl, 'http://localhost:3001');
      expect(config.isCleartextAllowed, isTrue);
    });

    test('2. Named constant localPilot targets http://localhost:3001 with cleartext enabled', () {
      const config = AppConfig.localPilot;
      expect(config.environment, EnvironmentType.localPilotDebug);
      expect(config.apiBaseUrl, 'http://localhost:3001');
      expect(config.isCleartextAllowed, isTrue);
    });

    test('3. Named constant localEmulator targets http://10.0.2.2:3001 with cleartext enabled', () {
      const config = AppConfig.localEmulator;
      expect(config.environment, EnvironmentType.localPilotDebug);
      expect(config.apiBaseUrl, 'http://10.0.2.2:3001');
      expect(config.isCleartextAllowed, isTrue);
    });

    test('4. Named constant cloudStaging requires HTTPS and prohibits cleartext traffic', () {
      const config = AppConfig.cloudStaging;
      expect(config.environment, EnvironmentType.cloudStagingDebug);
      expect(config.apiBaseUrl, startsWith('https://'));
      expect(config.isCleartextAllowed, isFalse);
    });
  });
}

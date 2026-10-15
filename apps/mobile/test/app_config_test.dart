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

    test('5. Named constant production requires HTTPS and prohibits cleartext traffic', () {
      const config = AppConfig.production;
      expect(config.environment, EnvironmentType.production);
      expect(config.apiBaseUrl, startsWith('https://'));
      expect(config.isCleartextAllowed, isFalse);
    });

    group('Positive Cases: Authorized Loopback & Private Interfaces', () {
      test('Allows localhost with explicit port', () {
        final config = AppConfig.resolve(rawEnv: 'LOCAL_PILOT_DEBUG', customUrl: 'http://localhost:3001');
        expect(config.apiBaseUrl, 'http://localhost:3001');
      });

      test('Allows 127.0.0.1 loopback', () {
        final config = AppConfig.resolve(rawEnv: 'LOCAL_PILOT_DEBUG', customUrl: 'http://127.0.0.1:3001');
        expect(config.apiBaseUrl, 'http://127.0.0.1:3001');
      });

      test('Allows 10.0.2.2 Android emulator alias', () {
        final config = AppConfig.resolve(rawEnv: 'LOCAL_PILOT_DEBUG', customUrl: 'http://10.0.2.2:3001');
        expect(config.apiBaseUrl, 'http://10.0.2.2:3001');
      });

      test('Allows 192.168.x.x private LAN IP', () {
        final config = AppConfig.resolve(rawEnv: 'LOCAL_PILOT_DEBUG', customUrl: 'http://192.168.1.150:3001');
        expect(config.apiBaseUrl, 'http://192.168.1.150:3001');
      });

      test('Allows 10.x.x.x private subnet IP', () {
        final config = AppConfig.resolve(rawEnv: 'LOCAL_PILOT_DEBUG', customUrl: 'http://10.5.0.2:8080');
        expect(config.apiBaseUrl, 'http://10.5.0.2:8080');
      });

      test('Allows 172.16-31.x.x private subnet IP', () {
        final config = AppConfig.resolve(rawEnv: 'LOCAL_PILOT_DEBUG', customUrl: 'http://172.24.0.10:3001');
        expect(config.apiBaseUrl, 'http://172.24.0.10:3001');
      });

      test('Allows local HTTPS development URLs', () {
        final config = AppConfig.resolve(rawEnv: 'LOCAL_PILOT_DEBUG', customUrl: 'https://localhost:3001');
        expect(config.apiBaseUrl, 'https://localhost:3001');
      });
    });

    group('Negative Cases: Rejection of External Hosts & Insecure Protocols', () {
      test('Rejects arbitrary external HTTP domain in LOCAL_PILOT_DEBUG', () {
        expect(
          () => AppConfig.resolve(rawEnv: 'LOCAL_PILOT_DEBUG', customUrl: 'http://evil.com/api'),
          throwsA(isA<ArgumentError>().having(
            (e) => e.message,
            'message',
            contains('Security barrier violation: LOCAL_PILOT_DEBUG must target authorized local loopback'),
          )),
        );
      });

      test('Rejects external public IP in LOCAL_PILOT_DEBUG', () {
        expect(
          () => AppConfig.resolve(rawEnv: 'LOCAL_PILOT_DEBUG', customUrl: 'http://8.8.8.8:3001'),
          throwsA(isA<ArgumentError>().having(
            (e) => e.message,
            'message',
            contains('Security barrier violation: LOCAL_PILOT_DEBUG must target authorized local loopback'),
          )),
        );
      });

      test('Rejects non-HTTP/HTTPS schemes', () {
        expect(
          () => AppConfig.resolve(rawEnv: 'LOCAL_PILOT_DEBUG', customUrl: 'ftp://localhost:3001'),
          throwsA(isA<ArgumentError>().having(
            (e) => e.message,
            'message',
            contains('is not a valid URI'),
          )),
        );
      });

      test('Rejects cleartext HTTP in CLOUD_STAGING_DEBUG', () {
        expect(
          () => AppConfig.resolve(rawEnv: 'CLOUD_STAGING_DEBUG', customUrl: 'http://staging-api.oprino.com'),
          throwsA(isA<ArgumentError>().having(
            (e) => e.message,
            'message',
            contains('requires a secure HTTPS endpoint'),
          )),
        );
      });

      test('Rejects cleartext HTTP in PRODUCTION', () {
        expect(
          () => AppConfig.resolve(rawEnv: 'PRODUCTION', customUrl: 'http://oprino-api.onrender.com'),
          throwsA(isA<ArgumentError>().having(
            (e) => e.message,
            'message',
            contains('requires a secure HTTPS endpoint'),
          )),
        );
      });

      test('Rejects unknown/unapproved environment names', () {
        expect(
          () => AppConfig.resolve(rawEnv: 'HACKED_ENV'),
          throwsA(isA<ArgumentError>().having(
            (e) => e.message,
            'message',
            contains('Unsupported or unverified environment'),
          )),
        );
      });
    });
  });
}

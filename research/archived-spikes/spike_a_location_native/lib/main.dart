import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_background_geolocation/flutter_background_geolocation.dart' as bg;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:dio/dio.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const OprinoNativeSpikeApp());
}

class OprinoNativeSpikeApp extends StatelessWidget {
  const OprinoNativeSpikeApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Oprino Native Location Spike',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF0D9488)),
        useMaterial3: true,
      ),
      home: const NativeValidationHarnessPage(),
    );
  }
}

class NativeValidationHarnessPage extends StatefulWidget {
  const NativeValidationHarnessPage({super.key});

  @override
  State<NativeValidationHarnessPage> createState() => _NativeValidationHarnessPageState();
}

class _NativeValidationHarnessPageState extends State<NativeValidationHarnessPage> {
  final List<String> _logs = [];
  final _secureStorage = const FlutterSecureStorage();
  
  bool _isDutyActive = false;
  DateTime? _shiftStartTime;
  DateTime? _punchOutTime;
  int? _softwareStopDispatchMs;
  int _breadcrumbsCount = 0;
  int _purgedPostDutyCount = 0;
  String _installationId = 'Uninitialized';
  String _sessionTokenStatus = 'No session';
  String _dutyState = 'OFF_DUTY';
  Timer? _deadlineWatchdog;

  @override
  void initState() {
    super.initState();
    _initPlugin();
    _initInstallationId().then((_) {
      _runAuthSmokeTest();
    });
  }

  void _log(String message) {
    final timestamp = DateTime.now().toIso8601String().substring(11, 23);
    final logLine = '[$timestamp] $message';
    print('[OPRINO_VALIDATION] $logLine');
    if (mounted) {
      setState(() {
        _logs.insert(0, logLine);
        if (_logs.length > 100) _logs.removeLast();
      });
    }
  }

  Future<void> _initInstallationId() async {
    String? id = await _secureStorage.read(key: 'oprino_installation:id');
    if (id == null) {
      id = 'inst_${DateTime.now().millisecondsSinceEpoch}_native';
      await _secureStorage.write(key: 'oprino_installation:id', value: id);
      _log('Generated fresh Installation ID: $id');
    } else {
      _log('Loaded existing Installation ID: $id');
    }
    setState(() => _installationId = id!);
  }

  Future<void> _initPlugin() async {
    bg.BackgroundGeolocation.onLocation((bg.Location location) {
      _log('Location acquired: [${location.coords.latitude}, ${location.coords.longitude}] '
          'acc: ${location.coords.accuracy}m speed: ${location.coords.speed}m/s');
      setState(() => _breadcrumbsCount++);
    }, (bg.LocationError error) {
      _log('Location error: code ${error.code}');
    });

    bg.BackgroundGeolocation.onMotionChange((bg.Location location) {
      _log('Motion change: moving=${location.isMoving}');
    });

    bg.BackgroundGeolocation.onProviderChange((bg.ProviderChangeEvent event) {
      _log('Provider change: gps=${event.gps} network=${event.network} status=${event.status}');
    });

    try {
      final state = await bg.BackgroundGeolocation.ready(bg.Config(
        desiredAccuracy: bg.Config.DESIRED_ACCURACY_HIGH,
        distanceFilter: 10.0,
        stopOnTerminate: true,
        startOnBoot: false,
        debug: false,
        logLevel: bg.Config.LOG_LEVEL_VERBOSE,
        autoSync: false,
        notification: bg.Notification(
          title: "Oprino Duty Shift Active",
          text: "Location services active during authorized work hours",
          color: "#0D9488",
          channelName: "Oprino Duty Location Service",
        ),
      ));
      _log('BackgroundGeolocation ready. Enabled: ${state.enabled}');
    } catch (e) {
      _log('BackgroundGeolocation init exception: $e');
    }
  }

  Future<void> _punchIn() async {
    _log('=== PUNCH IN INITIATED ===');
    _shiftStartTime = DateTime.now();
    _punchOutTime = null;
    _softwareStopDispatchMs = null;
    _breadcrumbsCount = 0;
    _purgedPostDutyCount = 0;

    await bg.BackgroundGeolocation.start();
    
    // Set 1-minute safety watchdog for testing automatic duty deadline
    _deadlineWatchdog?.cancel();
    _deadlineWatchdog = Timer(const Duration(minutes: 5), () {
      _log('WATCHDOG: Automatic duty deadline reached. Auto punching out.');
      _punchOut(isAutomaticDeadline: true);
    });

    setState(() {
      _isDutyActive = true;
      _dutyState = 'ACTIVE_SHIFT';
    });
    _log('Duty status: ACTIVE_SHIFT. Foreground service started.');
  }

  Future<void> _punchOut({bool isAutomaticDeadline = false}) async {
    final startDispatch = DateTime.now();
    _punchOutTime = startDispatch;
    _deadlineWatchdog?.cancel();

    _log('=== PUNCH OUT TRIGGERED (${isAutomaticDeadline ? "AUTOMATIC DEADLINE" : "EXPLICIT USER"}) ===');
    
    // 1. Issue native stop command
    await bg.BackgroundGeolocation.stop();
    final stopComplete = DateTime.now();
    final dispatchMs = stopComplete.difference(startDispatch).inMilliseconds;

    // 2. Queue inspection and post-duty purge
    final locations = await bg.BackgroundGeolocation.locations;
    int postDutyPurged = 0;
    for (final loc in locations) {
      final locTime = DateTime.parse(loc['timestamp'] as String);
      if (locTime.isAfter(startDispatch) || locTime.isAtSameMomentAs(startDispatch)) {
        postDutyPurged++;
      }
    }

    if (postDutyPurged > 0) {
      await bg.BackgroundGeolocation.destroyLocations();
      _log('PRIVACY SAFEGUARD: Purged $postDutyPurged post-duty coordinates from native queue.');
    } else {
      _log('PRIVACY SAFEGUARD: Zero post-duty coordinates discovered in native queue.');
    }

    setState(() {
      _isDutyActive = false;
      _dutyState = isAutomaticDeadline ? 'AUTO_EXPIRED' : 'PUNCHED_OUT';
      _softwareStopDispatchMs = dispatchMs;
      _purgedPostDutyCount = postDutyPurged;
    });

    _log('Native stop dispatch completed in ${dispatchMs}ms. Duty state: $_dutyState.');
    _log('Physical GPS shutdown latency remains an unverified physical-device measurement target.');
  }

  Future<void> _runAuthSmokeTest() async {
    _log('=== RUNNING BETTER AUTH SMOKE TEST (PHYSICAL ON-DEVICE) ===');
    final dio = Dio(BaseOptions(
      baseUrl: 'http://127.0.0.1:3088', // Over ADB reverse tcp:3088 tcp:3088
      connectTimeout: const Duration(seconds: 10),
      headers: {
        'Origin': 'oprino://app',
        'X-Installation-Id': _installationId,
      },
      validateStatus: (status) => true, // inspect all HTTP statuses
    ));

    try {
      // 0. Connectivity
      final pingRes = await dio.get('/api/auth/ok');
      _log('Backend ping /api/auth/ok status: ${pingRes.statusCode}');
      if (pingRes.statusCode != 200) {
        throw Exception('Backend returned ${pingRes.statusCode}');
      }

      // 1. Sign Up (if not already registered)
      _log('1. Testing Sign Up (Origin: oprino://app)...');
      final signUpRes = await dio.post('/api/auth/sign-up/email', data: {
        'email': 'technician.rajesh@acme.com',
        'password': 'securePassword123!',
        'name': 'Rajesh Sharma',
      });
      _log('Sign up status: ${signUpRes.statusCode}');

      // 2. Sign In to obtain opaque Bearer token
      _log('2. Testing Sign In & Bearer Session...');
      final signInRes = await dio.post('/api/auth/sign-in/email', data: {
        'email': 'technician.rajesh@acme.com',
        'password': 'securePassword123!',
      });
      _log('Sign in status: ${signInRes.statusCode}');
      if (signInRes.statusCode != 200) {
        throw Exception('Sign in failed: ${signInRes.data}');
      }
      final token = signInRes.data['token'] as String;
      _log('[PASS] Bearer token captured: ${token.substring(0, 16)}...');

      // 3. Secure Storage Persistence
      _log('3. Testing Secure Storage Persistence...');
      await _secureStorage.write(key: 'oprino_auth_session:token', value: token);
      final storedToken = await _secureStorage.read(key: 'oprino_auth_session:token');
      if (storedToken != token) throw Exception('Secure storage mismatch');
      _log('[PASS] Token persisted and read back securely from Keystore');
      setState(() => _sessionTokenStatus = 'Active Bearer (${token.substring(0, 8)}...)');

      // 4. Device Installation Registration
      final testRunInstId = '${_installationId}_run_${DateTime.now().millisecondsSinceEpoch}';
      _log('4. Registering Device Installation ($testRunInstId)...');
      final regRes = await dio.post(
        '/v1/devices/register',
        options: Options(headers: {'Authorization': 'Bearer $token'}),
        data: {
          'installationId': testRunInstId,
          'workspaceId': 'ws_field_ops_01',
          'deviceModel': 'OnePlus CPH2707',
          'osVersion': 'Android 16',
        },
      );
      _log('Device register status: ${regRes.statusCode}, body: ${regRes.data}');
      if (regRes.statusCode != 200) throw Exception('Device registration failed');
      _log('[PASS] Device registered and approved for workspace ws_field_ops_01');

      // 5. Authenticated Domain Request with Bearer and X-Installation-Id
      _log('5. Authenticated Request (GET /v1/me)...');
      final meRes = await dio.get(
        '/v1/me',
        options: Options(headers: {
          'Authorization': 'Bearer $token',
          'X-Installation-Id': testRunInstId,
        }),
      );
      _log('GET /v1/me status: ${meRes.statusCode}, user: ${meRes.data['user']?['email']}');
      if (meRes.statusCode != 200) throw Exception('Authenticated request failed');
      _log('[PASS] Authenticated request successful with active session & device governance');

      // 6. Workspace Switch
      _log('6. Testing Workspace Switch...');
      final switchRes = await dio.post(
        '/v1/workspaces/switch',
        options: Options(headers: {'Authorization': 'Bearer $token'}),
        data: {'targetWorkspaceId': 'ws_field_ops_02'},
      );
      _log('Workspace switch status: ${switchRes.statusCode}, active: ${switchRes.data['activeWorkspaceId']}');
      if (switchRes.statusCode != 200) throw Exception('Workspace switch failed');
      _log('[PASS] Workspace switched to ws_field_ops_02');

      // 7. Device Revocation & Rejection
      _log('7. Testing Administrative Device Revocation...');
      final revokeRes = await dio.post('/v1/admin/devices/revoke', data: {
        'installationId': testRunInstId,
      });
      _log('Admin revoke status: ${revokeRes.statusCode}');
      final postRevokeRes = await dio.get(
        '/v1/me',
        options: Options(headers: {
          'Authorization': 'Bearer $token',
          'X-Installation-Id': testRunInstId,
        }),
      );
      _log('Post-revocation GET /v1/me status: ${postRevokeRes.statusCode} (Expected: 401 or 403)');
      if (postRevokeRes.statusCode != 401 && postRevokeRes.statusCode != 403) {
        throw Exception('Revoked device was not rejected!');
      }
      _log('[PASS] Revoked session was rejected immediately with HTTP ${postRevokeRes.statusCode}');

      // 8. Re-register, Sign Out, and Replay Rejection
      _log('8. Testing Sign Out and Replay Rejection...');
      // Re-sign in to get fresh token
      final signIn2Res = await dio.post('/api/auth/sign-in/email', data: {
        'email': 'technician.rajesh@acme.com',
        'password': 'securePassword123!',
      });
      final freshToken = signIn2Res.data['token'] as String;
      // Re-register device
      await dio.post(
        '/v1/devices/register',
        options: Options(headers: {'Authorization': 'Bearer $freshToken'}),
        data: {
          'installationId': testRunInstId,
          'workspaceId': 'ws_field_ops_01',
          'deviceModel': 'OnePlus CPH2707',
          'osVersion': 'Android 16',
        },
      );
      // Now sign out
      final signOutRes = await dio.post(
        '/api/auth/sign-out',
        options: Options(headers: {
          'Authorization': 'Bearer $freshToken',
          'Origin': 'oprino://app',
        }),
      );
      _log('Sign out status: ${signOutRes.statusCode}');
      await _secureStorage.delete(key: 'oprino_auth_session:token');
      setState(() => _sessionTokenStatus = 'Logged Out (Cleaned)');

      // Replay attempt with logged out freshToken
      final replayRes = await dio.get(
        '/v1/me',
        options: Options(headers: {
          'Authorization': 'Bearer $freshToken',
          'X-Installation-Id': testRunInstId,
        }),
      );
      _log('Replay GET /v1/me with terminated session status: ${replayRes.statusCode} (Expected 401)');
      if (replayRes.statusCode != 401) {
        throw Exception('Terminated session was not rejected!');
      }
      _log('[PASS] Session terminated. Replay rejected with HTTP 401 Unauthorized.');
      _log('=== ALL BETTER AUTH SMOKE TESTS PASSED ON REAL DEVICE ===');
    } catch (e, st) {
      _log('[FAIL] Better Auth Smoke Test Failed: $e');
      print('Stack: $st');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Oprino Native Location Spike'),
        backgroundColor: const Color(0xFF0D9488),
        foregroundColor: Colors.white,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Card(
              elevation: 2,
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Installation ID: $_installationId', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    const SizedBox(height: 6),
                    Text('Duty State: $_dutyState', style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: _isDutyActive ? Colors.green : Colors.red,
                    )),
                    Text('Breadcrumbs Acquired: $_breadcrumbsCount'),
                    if (_softwareStopDispatchMs != null)
                      Text('Software Stop Dispatch Latency: ${_softwareStopDispatchMs}ms (software only)'),
                    if (_purgedPostDutyCount > 0)
                      Text('Purged Post-Duty Points: $_purgedPostDutyCount', style: const TextStyle(color: Colors.orange)),
                    Text('Session Status: $_sessionTokenStatus'),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _isDutyActive ? null : _punchIn,
                    icon: const Icon(Icons.play_arrow),
                    label: const Text('Punch In'),
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _isDutyActive ? () => _punchOut(isAutomaticDeadline: false) : null,
                    icon: const Icon(Icons.stop),
                    label: const Text('Punch Out'),
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            ElevatedButton.icon(
              onPressed: _runAuthSmokeTest,
              icon: const Icon(Icons.security),
              label: const Text('Run Better Auth Smoke Test'),
            ),
            const SizedBox(height: 12),
            const Text('Event Telemetry Log:', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 6),
            Expanded(
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.black87,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: ListView.builder(
                  itemCount: _logs.length,
                  itemBuilder: (context, index) => Text(
                    _logs[index],
                    style: const TextStyle(color: Colors.lightGreenAccent, fontFamily: 'monospace', fontSize: 11),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/oprino_theme.dart';
import '../../../core/network/api_client_provider.dart';

class AppShellScreen extends ConsumerStatefulWidget {
  const AppShellScreen({super.key});

  @override
  ConsumerState<AppShellScreen> createState() => _AppShellScreenState();
}

class _AppShellScreenState extends ConsumerState<AppShellScreen> {
  String _activeRole = 'FIELD_TECHNICIAN';
  String? _installationId;
  String _healthStatus = 'Unchecked';
  bool _isLoadingHealth = false;

  @override
  void initState() {
    super.initState();
    _loadInstallationId();
  }

  Future<void> _loadInstallationId() async {
    final storage = ref.read(secureStorageProvider);
    final id = await storage.getOrCreateInstallationId();
    if (mounted) {
      setState(() => _installationId = id);
    }
  }

  Future<void> _checkHealth() async {
    setState(() => _isLoadingHealth = true);
    try {
      final client = ref.read(apiClientProvider);
      final res = await client.getHealth();
      if (mounted) {
        setState(() {
          _healthStatus = 'Connected (${res.status}, DB: ${res.services['database']})';
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _healthStatus = 'API Unreachable ($e)';
        });
      }
    } finally {
      if (mounted) {
        setState(() => _isLoadingHealth = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: OprinoColors.navy,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.location_on, color: OprinoColors.mint, size: 20),
            ),
            const SizedBox(width: 10),
            const Text(
              'oprino',
              style: TextStyle(
                fontFamily: 'Outfit',
                fontSize: 22,
                fontWeight: FontWeight.w800,
                color: OprinoColors.navy,
                letterSpacing: -0.5,
              ),
            ),
          ],
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: _activeRole == 'FIELD_TECHNICIAN' ? const Color(0xFFE0F2FE) : const Color(0xFFFCE7F3),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Text(
              _activeRole == 'FIELD_TECHNICIAN' ? 'Field Mode' : 'Manager Mode',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: _activeRole == 'FIELD_TECHNICIAN' ? OprinoColors.ocean : const Color(0xFFBE185D),
              ),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Foundation Info Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Phase 01C Scaffolding Baseline',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: OprinoColors.navy),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Installation ID: ${_installationId ?? 'Loading...'}',
                      style: const TextStyle(fontSize: 12, color: OprinoColors.slate, fontFamily: 'monospace'),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Architecture: Flutter 3.47 Stable + Riverpod + Drift + Dio',
                      style: const TextStyle(fontSize: 13, color: OprinoColors.slate),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Health Check Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Backend API Health (Generated Client)',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: OprinoColors.navy),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Status: $_healthStatus',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: _healthStatus.startsWith('Connected') ? OprinoColors.success : OprinoColors.slate,
                      ),
                    ),
                    const SizedBox(height: 12),
                    ElevatedButton.icon(
                      onPressed: _isLoadingHealth ? null : _checkHealth,
                      icon: _isLoadingHealth
                          ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Icon(Icons.sync, size: 18),
                      label: const Text('Probe API Health'),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Role Switcher
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Unified Role Packaging (ADR-020)',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: OprinoColors.navy),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'One unified role-aware mobile application package. Switch perspective:',
                      style: TextStyle(fontSize: 13, color: OprinoColors.slate),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () => setState(() => _activeRole = 'FIELD_TECHNICIAN'),
                            style: OutlinedButton.styleFrom(
                              backgroundColor: _activeRole == 'FIELD_TECHNICIAN' ? OprinoColors.cobalt : Colors.transparent,
                              foregroundColor: _activeRole == 'FIELD_TECHNICIAN' ? Colors.white : OprinoColors.navy,
                            ),
                            child: const Text('Field Mode'),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () => setState(() => _activeRole = 'DISPATCHER_MANAGER'),
                            style: OutlinedButton.styleFrom(
                              backgroundColor: _activeRole == 'DISPATCHER_MANAGER' ? OprinoColors.cobalt : Colors.transparent,
                              foregroundColor: _activeRole == 'DISPATCHER_MANAGER' ? Colors.white : OprinoColors.navy,
                            ),
                            child: const Text('Manager Mode'),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

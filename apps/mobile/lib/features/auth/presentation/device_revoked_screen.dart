import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/oprino_theme.dart';
import '../../../core/network/api_client_provider.dart';
import '../../../core/widgets/oprino_brand_logo.dart';
import 'auth_state_notifier.dart';

class DeviceRevokedScreen extends ConsumerStatefulWidget {
  const DeviceRevokedScreen({super.key});

  @override
  ConsumerState<DeviceRevokedScreen> createState() => _DeviceRevokedScreenState();
}

class _DeviceRevokedScreenState extends ConsumerState<DeviceRevokedScreen> {
  String? _installationId;

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

  void _copyInstallationId() {
    if (_installationId != null) {
      Clipboard.setData(ClipboardData(text: _installationId!));
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Installation ID copied to clipboard'),
          duration: Duration(seconds: 2),
          backgroundColor: OprinoColors.navy,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFFEF2F2),
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const OprinoBrandLogo(
                    height: 36,
                    variant: OprinoLogoVariant.horizontal,
                  ),
                  const SizedBox(height: 32),
                  Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEE2E2),
                      shape: BoxShape.circle,
                      border: Border.all(color: const Color(0xFFFCA5A5), width: 2),
                    ),
                    child: const Center(
                      child: Icon(
                        Icons.phonelink_erase,
                        color: Color(0xFFDC2626),
                        size: 36,
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  const Text(
                    'Device Access Revoked',
                    style: TextStyle(
                      fontFamily: 'Outfit',
                      fontSize: 24,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF991B1B),
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 12),

                  Text(
                    authState.revocationReason ??
                        'This device installation was revoked by your workspace administrator. In accordance with zero-trust governance, all local credentials and tenant sessions have been cleared.',
                    style: const TextStyle(
                      fontSize: 14,
                      color: Color(0xFF7F1D1D),
                      height: 1.4,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 24),

                  // Installation Metadata Box
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFFFECACA)),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Revoked Installation Identifier',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF991B1B),
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                _installationId ?? 'Loading...',
                                style: const TextStyle(
                                  fontFamily: 'monospace',
                                  fontSize: 12,
                                  color: OprinoColors.navy,
                                ),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          onPressed: _copyInstallationId,
                          icon: const Icon(Icons.copy, size: 18, color: Color(0xFF991B1B)),
                          tooltip: 'Copy Installation ID',
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  const Text(
                    'Provide this Installation Identifier to your workspace administrator to request reactivation or approval.',
                    style: TextStyle(
                      fontSize: 12,
                      color: Color(0xFF991B1B),
                      fontStyle: FontStyle.italic,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 28),

                  // Action Buttons
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () {
                        ref.read(authStateProvider.notifier).checkSession();
                      },
                      icon: const Icon(Icons.refresh, size: 18),
                      label: const Text('Check Approval Status'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFDC2626),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      onPressed: () {
                        ref.read(authStateProvider.notifier).acknowledgeRevocationAndReturnToSignIn();
                      },
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFF991B1B),
                        side: const BorderSide(color: Color(0xFFFCA5A5)),
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: const Text('Return to Sign In'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

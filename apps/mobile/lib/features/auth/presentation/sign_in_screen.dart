import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/oprino_theme.dart';
import '../../../core/network/api_client_provider.dart';
import '../../../core/widgets/oprino_brand_logo.dart';
import 'auth_state_notifier.dart';

class SignInScreen extends ConsumerStatefulWidget {
  const SignInScreen({super.key});

  @override
  ConsumerState<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends ConsumerState<SignInScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
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

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _handleSignIn() {
    final email = _emailController.text.trim();
    final password = _passwordController.text;

    if (email.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter both email and password.')),
      );
      return;
    }

    ref.read(authStateProvider.notifier).signIn(
          email: email,
          password: password,
        );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);
    final isAuthenticating = authState.status == AuthStatus.authenticating;

    return Scaffold(
      backgroundColor: OprinoColors.paper,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 32.0),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Canonical Brand Logo
                  const Center(
                    child: OprinoBrandLogo(
                      height: 48,
                      variant: OprinoLogoVariant.horizontal,
                    ),
                  ),
                  const SizedBox(height: 8),

                  const Center(
                    child: Text(
                      'Operations & Workforce SaaS Platform',
                      style: TextStyle(
                        fontSize: 14,
                        color: OprinoColors.slate,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Error Banner
                  if (authState.errorMessage != null) ...[
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEF2F2),
                        border: Border.all(color: const Color(0xFFFCA5A5)),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.error_outline, color: Color(0xFFDC2626), size: 20),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              authState.errorMessage!,
                              style: const TextStyle(
                                color: Color(0xFFDC2626),
                                fontSize: 13,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Email Input Card
                  Card(
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: const BorderSide(color: OprinoColors.border),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(20.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          const Text(
                            'Sign In',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: OprinoColors.navy,
                            ),
                          ),
                          const SizedBox(height: 16),

                          // Email Field
                          TextField(
                            controller: _emailController,
                            keyboardType: TextInputType.emailAddress,
                            autocorrect: false,
                            decoration: const InputDecoration(
                              labelText: 'Email Address',
                              hintText: 'user@company.com',
                              prefixIcon: Icon(Icons.email_outlined, size: 20),
                            ),
                          ),
                          const SizedBox(height: 16),

                          // Password Field
                          TextField(
                            controller: _passwordController,
                            obscureText: _obscurePassword,
                            decoration: InputDecoration(
                              labelText: 'Password',
                              hintText: 'Enter your password',
                              prefixIcon: const Icon(Icons.lock_outline, size: 20),
                              suffixIcon: IconButton(
                                icon: Icon(
                                  _obscurePassword ? Icons.visibility_off : Icons.visibility,
                                  size: 20,
                                ),
                                onPressed: () {
                                  setState(() => _obscurePassword = !_obscurePassword);
                                },
                              ),
                            ),
                            onSubmitted: (_) => _handleSignIn(),
                          ),
                          const SizedBox(height: 24),

                          // Sign In Button
                          ElevatedButton(
                            onPressed: isAuthenticating ? null : _handleSignIn,
                            style: ElevatedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              backgroundColor: OprinoColors.cobalt,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                            child: isAuthenticating
                                ? const SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: Colors.white,
                                    ),
                                  )
                                : const Text(
                                    'Sign In',
                                    style: TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Device Governance Footer
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      border: Border.all(color: OprinoColors.border),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.verified_user_outlined, size: 16, color: OprinoColors.ocean),
                            const SizedBox(width: 6),
                            const Text(
                              'Device Governance (ADR-006)',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: OprinoColors.navy,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Installation ID: ${_installationId ?? 'Initializing...'}',
                          style: const TextStyle(
                            fontFamily: 'monospace',
                            fontSize: 11,
                            color: OprinoColors.slate,
                          ),
                        ),
                        const SizedBox(height: 2),
                        const Text(
                          'Hardware Fingerprinting: None (Pure Random UUIDv4)',
                          style: TextStyle(
                            fontSize: 11,
                            color: OprinoColors.slate,
                          ),
                        ),
                      ],
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

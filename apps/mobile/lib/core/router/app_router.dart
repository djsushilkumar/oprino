import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/presentation/auth_state_notifier.dart';
import '../../features/auth/presentation/sign_in_screen.dart';
import '../../features/auth/presentation/device_revoked_screen.dart';
import '../../features/shell/presentation/app_shell_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);

  return GoRouter(
    initialLocation: '/',
    redirect: (context, state) {
      final isRevoked = authState.status == AuthStatus.deviceRevoked;
      final isUnauthenticated = authState.status == AuthStatus.unauthenticated;
      final isAuthenticated = authState.status == AuthStatus.authenticated;

      final isGoingToRevoked = state.matchedLocation == '/revoked';
      final isGoingToSignIn = state.matchedLocation == '/signin';

      if (isRevoked && !isGoingToRevoked) {
        return '/revoked';
      }

      if (isUnauthenticated && !isGoingToSignIn) {
        return '/signin';
      }

      if (isAuthenticated && (isGoingToSignIn || isGoingToRevoked)) {
        return '/';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const AppShellScreen(),
      ),
      GoRoute(
        path: '/signin',
        builder: (context, state) => const SignInScreen(),
      ),
      GoRoute(
        path: '/revoked',
        builder: (context, state) => const DeviceRevokedScreen(),
      ),
    ],
  );
});

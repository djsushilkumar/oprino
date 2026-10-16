import 'dart:io' show Platform;
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:oprino_api/oprino_api.dart';
import '../../../core/network/api_client_provider.dart';
import '../../../core/network/auth_interceptor.dart';
import '../../../core/storage/secure_storage_service.dart';
import '../../../core/location/location_service.dart';

enum AuthStatus {
  initial,
  unauthenticated,
  authenticating,
  authenticated,
  deviceRevoked,
}

class AuthState {
  final AuthStatus status;
  final MeResponse? context;
  final List<WorkspaceListItem> workspaces;
  final String? errorMessage;
  final String? revocationReason;

  const AuthState({
    required this.status,
    this.context,
    this.workspaces = const [],
    this.errorMessage,
    this.revocationReason,
  });

  const AuthState.initial()
      : this(status: AuthStatus.initial);

  const AuthState.unauthenticated({String? errorMessage})
      : this(status: AuthStatus.unauthenticated, errorMessage: errorMessage);

  const AuthState.authenticating()
      : this(status: AuthStatus.authenticating);

  const AuthState.authenticated({
    required MeResponse context,
    required List<WorkspaceListItem> workspaces,
  }) : this(
          status: AuthStatus.authenticated,
          context: context,
          workspaces: workspaces,
        );

  const AuthState.deviceRevoked({required String reason})
      : this(status: AuthStatus.deviceRevoked, revocationReason: reason);

  AuthState copyWith({
    AuthStatus? status,
    MeResponse? context,
    List<WorkspaceListItem>? workspaces,
    String? errorMessage,
    String? revocationReason,
  }) {
    return AuthState(
      status: status ?? this.status,
      context: context ?? this.context,
      workspaces: workspaces ?? this.workspaces,
      errorMessage: errorMessage ?? this.errorMessage,
      revocationReason: revocationReason ?? this.revocationReason,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final OprinoApiClient client;
  final SecureStorageService storage;
  final LocationService? locationService;
  final AuthInterceptor? interceptor;

  AuthNotifier({
    required this.client,
    required this.storage,
    this.locationService,
    this.interceptor,
  }) : super(const AuthState.initial()) {
    interceptor?.onRevocationDetected = handleRevocationDetected;
    interceptor?.onSessionExpired = handleSessionExpired;
    checkSession();
  }

  Future<void> checkSession() async {
    try {
      final isRevoked = await storage.isInstallationRevoked();
      if (isRevoked) {
        state = const AuthState.deviceRevoked(
          reason: 'This installation was previously revoked by the workspace administrator.',
        );
        return;
      }

      final token = await storage.getSessionToken();
      if (token == null || token.isEmpty) {
        state = const AuthState.unauthenticated();
        return;
      }

      final me = await client.getMe();
      final wsList = await client.listWorkspaces();

      state = AuthState.authenticated(
        context: me,
        workspaces: wsList.workspaces,
      );
    } catch (e) {
      final isRevoked = await storage.isInstallationRevoked();
      if (isRevoked) {
        state = const AuthState.deviceRevoked(
          reason: 'This device installation was revoked.',
        );
        return;
      }

      // If network error (offline), do NOT purge stored credentials!
      if (e is DioException &&
          (e.type == DioExceptionType.connectionTimeout ||
           e.type == DioExceptionType.sendTimeout ||
           e.type == DioExceptionType.receiveTimeout ||
           e.type == DioExceptionType.connectionError)) {
        state = const AuthState.unauthenticated(
          errorMessage: 'Offline mode: unable to reach Oprino cloud services.',
        );
        return;
      }

      await storage.clearAuthSession();
      state = const AuthState.unauthenticated();
    }
  }

  Future<void> signIn({
    required String email,
    required String password,
  }) async {
    final isRevoked = await storage.isInstallationRevoked();
    if (isRevoked) {
      state = const AuthState.deviceRevoked(
        reason: 'This device installation is revoked. Contact your workspace administrator for assistance.',
      );
      return;
    }

    state = const AuthState.authenticating();

    try {
      final authRes = await client.signIn(email: email, password: password);
      await storage.setInstallationRevoked(false);
      await storage.saveSessionToken(authRes.token);

      if (authRes.activeWorkspaceId != null) {
        await storage.saveActiveWorkspaceId(authRes.activeWorkspaceId!);
      }

      // Register device with backend governance
      final installationId = await storage.getOrCreateInstallationId();
      String platformName = 'unknown';
      if (!kIsWeb) {
        platformName = Platform.isAndroid ? 'android' : (Platform.isIOS ? 'ios' : 'unknown');
      }

      try {
        await client.registerDevice(
          installationId: installationId,
          platform: platformName,
          deviceModel: 'Mobile Device',
          appVersion: '0.1.0',
        );
      } catch (devErr) {
        // Log device registration error; continue with auth context
      }

      final me = await client.getMe();
      final wsList = await client.listWorkspaces();

      state = AuthState.authenticated(
        context: me,
        workspaces: wsList.workspaces,
      );
    } on ApiError catch (e) {
      if (e.error == 'DEVICE_REVOKED') {
        await storage.handleDeviceRevocation();
        state = AuthState.deviceRevoked(reason: e.message);
      } else {
        state = AuthState.unauthenticated(errorMessage: e.message);
      }
    } catch (e) {
      state = AuthState.unauthenticated(errorMessage: e.toString());
    }
  }

  Future<void> switchWorkspace(String workspaceId) async {
    // Terminate tracking immediately upon switching companies to prevent cross-workspace location leakage
    await locationService?.stopTracking();

    try {
      await client.switchWorkspace(workspaceId: workspaceId);
      await storage.saveActiveWorkspaceId(workspaceId);

      final me = await client.getMe();
      final wsList = await client.listWorkspaces();

      state = AuthState.authenticated(
        context: me,
        workspaces: wsList.workspaces,
      );
    } catch (e) {
      // Keep previous state, log error
    }
  }

  Future<void> signOut() async {
    // Terminate tracking immediately upon logout to guarantee zero off-duty tracking
    await locationService?.stopTracking();

    try {
      await client.signOut();
    } catch (_) {
      // Ignore network errors on signout
    } finally {
      // Clear session token and active workspace; preserve installation ID
      await storage.clearAuthSession();
      state = const AuthState.unauthenticated();
    }
  }

  void handleRevocationDetected() {
    locationService?.stopTracking();
    state = const AuthState.deviceRevoked(
      reason: 'This device installation has been revoked by your workspace administrator.',
    );
  }

  void handleSessionExpired() {
    locationService?.stopTracking();
    state = const AuthState.unauthenticated(
      errorMessage: 'Your session has expired. Please sign in again.',
    );
  }

  void acknowledgeRevocationAndReturnToSignIn() {
    state = const AuthState.unauthenticated();
  }

}

final authStateProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final client = ref.watch(apiClientProvider);
  final storage = ref.watch(secureStorageProvider);
  final locationService = ref.watch(locationServiceProvider);
  final interceptor = ref.watch(authInterceptorProvider);
  return AuthNotifier(
    client: client,
    storage: storage,
    locationService: locationService,
    interceptor: interceptor,
  );
});

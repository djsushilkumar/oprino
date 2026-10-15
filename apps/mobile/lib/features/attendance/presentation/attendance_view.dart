import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/oprino_theme.dart';
import '../../../../core/sync/sync_service.dart';
import '../../../../core/database/database.dart';
import '../../../../core/location/location_service.dart';
import '../../auth/presentation/auth_state_notifier.dart';
import 'widgets/attendance_selfie_sheet.dart';

class AttendanceView extends ConsumerStatefulWidget {
  const AttendanceView({super.key});

  @override
  ConsumerState<AttendanceView> createState() => _AttendanceViewState();
}

class _AttendanceViewState extends ConsumerState<AttendanceView>
    with SingleTickerProviderStateMixin {
  late final Ticker _ticker;
  DateTime _now = DateTime.now();
  bool _isActioning = false;
  String? _actionError;

  @override
  void initState() {
    super.initState();
    _ticker = createTicker((elapsed) {
      if (mounted) {
        setState(() => _now = DateTime.now());
      }
    });

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _refreshAttendance();
    });
  }

  void _startTicker() {
    if (!_ticker.isActive) {
      _ticker.start();
    }
  }

  void _stopTicker() {
    if (_ticker.isActive) {
      _ticker.stop();
    }
  }

  @override
  void dispose() {
    _ticker.dispose();
    super.dispose();
  }

  void _refreshAttendance() {
    final auth = ref.read(authStateProvider);
    final wsId = auth.context?.activeWorkspace?.id;
    if (wsId != null) {
      ref.read(syncServiceProvider).syncDownAttendance(wsId);
    }
  }

  String _formatDuration(DateTime? start) {
    if (start == null) return '00:00:00';
    final diff = _now.difference(start);
    if (diff.isNegative) return '00:00:00';
    final hours = diff.inHours.toString().padLeft(2, '0');
    final minutes = (diff.inMinutes % 60).toString().padLeft(2, '0');
    final seconds = (diff.inSeconds % 60).toString().padLeft(2, '0');
    return '$hours:$minutes:$seconds';
  }

  Future<void> _handlePunchIn(String workspaceId) async {
    final auth = ref.read(authStateProvider);
    final userId = auth.context?.user.id;
    if (userId == null || userId.isEmpty) {
      setState(() => _actionError = 'Cannot punch in: Unauthenticated user identity.');
      return;
    }

    final loc = ref.read(latestLocationProvider);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => AttendanceSelfieSheet(
        workspaceId: workspaceId,
        userId: userId,
        currentLatitude: loc?.latitude,
        currentLongitude: loc?.longitude,
        accuracy: loc?.accuracy,
        onConfirm: ({
          String? selfieMediaKey,
          String? localFilePath,
          required double? latitude,
          required double? longitude,
          required double? accuracy,
          required DateTime timestamp,
        }) async {
          setState(() {
            _isActioning = true;
            _actionError = null;
          });

          try {
            final sync = ref.read(syncServiceProvider);
            await sync.queuePunchIn(
              workspaceId: workspaceId,
              note: 'Punched in from mobile with selfie verification',
              selfieMediaKey: selfieMediaKey,
              localFilePath: localFilePath,
              latitude: latitude,
              longitude: longitude,
              accuracy: accuracy,
            );
            if (workspaceId.isNotEmpty) {
              await ref.read(locationServiceProvider).startTracking(
                    workspaceId: workspaceId,
                    userId: userId,
                  );
            }
          } catch (e) {
            setState(() => _actionError = e.toString());
          } finally {
            if (mounted) setState(() => _isActioning = false);
          }
        },
      ),
    );
  }

  Future<void> _handlePunchOut(String workspaceId) async {
    setState(() {
      _isActioning = true;
      _actionError = null;
    });

    try {
      final sync = ref.read(syncServiceProvider);
      await sync.queuePunchOut(
        workspaceId: workspaceId,
        note: 'Punched out from mobile',
      );
      // Immediately terminate GPS tracking to honor Duty-Hours-Only Invariant: Zero off-duty points captured
      await ref.read(locationServiceProvider).stopTracking();

      // Durably drain any remaining on-duty points without collecting new off-duty telemetry
      final auth = ref.read(authStateProvider);
      final userId = auth.context?.user.id;
      if (userId != null && workspaceId.isNotEmpty) {
        sync.drainPendingLocations(workspaceId: workspaceId, userId: userId).ignore();
      }
    } catch (e) {
      setState(() => _actionError = e.toString());
    } finally {
      if (mounted) setState(() => _isActioning = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authStateProvider);
    final workspace = auth.context?.activeWorkspace;
    final workspaceId = workspace?.id ?? '';
    final userId = auth.context?.user.id;
    final sync = ref.watch(syncServiceProvider);
    final isTracking = ref.watch(isTrackingActiveProvider);
    final latestLocation = ref.watch(latestLocationProvider);
    final nearbyGeofences = ref.watch(nearbyGeofencesProvider);

    return StreamBuilder<CachedAttendanceData?>(
      stream: sync.watchAttendance(workspaceId),
      builder: (context, snapshot) {
        final attendance = snapshot.data;
        return StreamBuilder<OutboxMutation?>(
          stream: sync.watchPendingAttendanceMutation(workspaceId),
          builder: (context, mutationSnap) {
            final pendingMutation = mutationSnap.data;
            final isPunchInPending = pendingMutation != null && pendingMutation.mutationType == 'PUNCH_IN';
            final isSyncFailed = pendingMutation != null && pendingMutation.status == 'FAILED';
            final isOnDuty = attendance?.dutyState == 'ON_DUTY';
            final punchInTime = attendance?.punchInTime;

            if (isOnDuty && !isSyncFailed) {
              _startTicker();
              if (!isTracking && workspaceId.isNotEmpty && userId != null && userId.isNotEmpty) {
                WidgetsBinding.instance.addPostFrameCallback((_) {
                  if (mounted) {
                    ref.read(locationServiceProvider).startTracking(
                          workspaceId: workspaceId,
                          userId: userId,
                          sessionId: attendance?.activeSessionId,
                        );
                  }
                });
              }
            } else {
              _stopTicker();
              if (isTracking) {
                WidgetsBinding.instance.addPostFrameCallback((_) {
                  if (mounted) {
                    ref.read(locationServiceProvider).stopTracking();
                  }
                });
              }
            }

            Color cardBorderColor;
            Color cardBgColor;
            Color badgeBgColor;
            Color dotColor;
            Color badgeTextColor;
            String badgeText;

            if (isSyncFailed) {
              cardBorderColor = const Color(0xFFFCA5A5);
              cardBgColor = const Color(0xFFFFF5F5);
              badgeBgColor = const Color(0xFFFEE2E2);
              dotColor = const Color(0xFFDC2626);
              badgeTextColor = const Color(0xFF991B1B);
              badgeText = 'PUNCH-IN REJECTED / FAILED';
            } else if (isPunchInPending) {
              cardBorderColor = const Color(0xFFFDE68A);
              cardBgColor = const Color(0xFFFFFBEB);
              badgeBgColor = const Color(0xFFFEF3C7);
              dotColor = const Color(0xFFD97706);
              badgeTextColor = const Color(0xFF92400E);
              badgeText = 'ON DUTY (OFFLINE PENDING VERIFICATION)';
            } else if (isOnDuty) {
              cardBorderColor = const Color(0xFF86EFAC);
              cardBgColor = const Color(0xFFF0FDF4);
              badgeBgColor = const Color(0xFFDCFCE7);
              dotColor = const Color(0xFF16A34A);
              badgeTextColor = const Color(0xFF15803D);
              badgeText = 'CURRENTLY ON DUTY (SERVER CONFIRMED)';
            } else {
              cardBorderColor = OprinoColors.border;
              cardBgColor = Colors.white;
              badgeBgColor = const Color(0xFFF1F5F9);
              dotColor = OprinoColors.slate;
              badgeTextColor = OprinoColors.slate;
              badgeText = 'OFF DUTY';
            }

            return RefreshIndicator(
              onRefresh: () async => _refreshAttendance(),
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (_actionError != null)
                      Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEF2F2),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: const Color(0xFFFCA5A5)),
                        ),
                        child: Text(
                          _actionError!,
                          style: const TextStyle(color: Color(0xFF991B1B), fontSize: 13),
                        ),
                      ),

                    // Duty Status Hero Card
                    Card(
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                        side: BorderSide(
                          color: cardBorderColor,
                          width: isOnDuty || isPunchInPending || isSyncFailed ? 1.5 : 1.0,
                        ),
                      ),
                      color: cardBgColor,
                      child: Padding(
                        padding: const EdgeInsets.all(24.0),
                        child: Column(
                          children: [
                            // Status badge
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                              decoration: BoxDecoration(
                                color: badgeBgColor,
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Container(
                                    width: 8,
                                    height: 8,
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      color: dotColor,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    badgeText,
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 0.5,
                                      color: badgeTextColor,
                                    ),
                                  ),
                                ],
                              ),
                            ),

                            // Rejection / Offline Pending Banners
                            if (isSyncFailed) ...[
                              const SizedBox(height: 14),
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFEF2F2),
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(color: const Color(0xFFFCA5A5)),
                                ),
                                child: Column(
                                  children: [
                                    Row(
                                      children: [
                                        const Icon(Icons.error_outline, size: 18, color: Color(0xFF991B1B)),
                                        const SizedBox(width: 8),
                                        Expanded(
                                          child: Text(
                                            'Punch-in was rejected by the server: ${pendingMutation.lastError ?? 'Policy validation failure'}. Offline duty state has been cancelled.',
                                            style: const TextStyle(fontSize: 12, color: Color(0xFF991B1B), height: 1.3),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 10),
                                    ElevatedButton.icon(
                                      onPressed: _isActioning ? null : () => sync.processOutbox(),
                                      icon: const Icon(Icons.refresh, size: 16, color: Colors.white),
                                      label: const Text('Retry Sync Now', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white)),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: const Color(0xFFDC2626),
                                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ] else if (isPunchInPending) ...[
                              const SizedBox(height: 14),
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFEF3C7),
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(color: const Color(0xFFFDE68A)),
                                ),
                                child: const Row(
                                  children: [
                                    Icon(Icons.cloud_off, size: 18, color: Color(0xFF92400E)),
                                    SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        'Offline Punch Active: Selfie & GPS coordinates are safely recorded on your device. Once network is restored, your punch-in will be confirmed with the server.',
                                        style: TextStyle(fontSize: 12, color: Color(0xFF92400E), height: 1.3),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                            const SizedBox(height: 20),

                        // Elapsed Duration or Call to Punch
                        if (isOnDuty) ...[
                          const Text(
                            'Elapsed Duty Time',
                            style: TextStyle(
                              fontSize: 13,
                              color: OprinoColors.slate,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            _formatDuration(punchInTime),
                            style: const TextStyle(
                              fontSize: 36,
                              fontWeight: FontWeight.w800,
                              fontFamily: 'monospace',
                              letterSpacing: 1.0,
                              color: OprinoColors.navy,
                            ),
                          ),
                          const SizedBox(height: 8),
                          if (punchInTime != null)
                            Text(
                              'Started at ${TimeOfDay.fromDateTime(punchInTime.toLocal()).format(context)}',
                              style: const TextStyle(fontSize: 12, color: OprinoColors.slate),
                            ),
                        ] else ...[
                          const Text(
                            'Ready to start your work shift?',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: OprinoColors.navy,
                            ),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'Punches record canonical server timestamps.',
                            style: TextStyle(fontSize: 12, color: OprinoColors.slate),
                          ),
                        ],

                        const SizedBox(height: 24),

                        // Primary Action Button (Punch In / Punch Out)
                        SizedBox(
                          width: double.infinity,
                          height: 52,
                          child: ElevatedButton.icon(
                            onPressed: _isActioning
                                ? null
                                : () => isOnDuty
                                    ? _handlePunchOut(workspaceId)
                                    : _handlePunchIn(workspaceId),
                            icon: _isActioning
                                ? const SizedBox(
                                    width: 18,
                                    height: 18,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                    ),
                                  )
                                : Icon(isOnDuty ? Icons.logout : Icons.login),
                            label: Text(
                              _isActioning
                                  ? 'Processing...'
                                  : isOnDuty
                                      ? 'Punch Out (End Duty)'
                                      : 'Punch In (Start Duty)',
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: isOnDuty
                                  ? const Color(0xFFDC2626)
                                  : const Color(0xFF16A34A),
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              elevation: 0,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 16),

                // GPS Telemetry & Geofencing Card
                Card(
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: BorderSide(
                      color: isTracking ? const Color(0xFF86EFAC) : OprinoColors.border,
                      width: isTracking ? 1.5 : 1.0,
                    ),
                  ),
                  color: isTracking ? const Color(0xFFF9FEFA) : Colors.white,
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                Icon(
                                  isTracking ? Icons.my_location : Icons.location_off_outlined,
                                  size: 18,
                                  color: isTracking ? const Color(0xFF16A34A) : OprinoColors.slate,
                                ),
                                const SizedBox(width: 8),
                                const Text(
                                  'GPS Telemetry & Geofencing',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    color: OprinoColors.navy,
                                  ),
                                ),
                              ],
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: isTracking ? const Color(0xFFDCFCE7) : const Color(0xFFF1F5F9),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                isTracking ? 'TRACKING ON' : 'STANDBY (OFF)',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: 0.5,
                                  color: isTracking ? const Color(0xFF15803D) : OprinoColors.slate,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        if (isTracking) ...[
                          if (nearbyGeofences.any((g) => g.isInside)) ...[
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: const Color(0xFFDCFCE7),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: const Color(0xFF86EFAC)),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.verified, size: 16, color: Color(0xFF15803D)),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      'Inside Geofence: ${nearbyGeofences.firstWhere((g) => g.isInside).geofenceName}',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                        color: Color(0xFF15803D),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ] else if (nearbyGeofences.isNotEmpty) ...[
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: const Color(0xFFEFF6FF),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: const Color(0xFFBFDBFE)),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.near_me, size: 16, color: Color(0xFF1D4ED8)),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      'Nearest Site: ${nearbyGeofences.first.geofenceName} (${nearbyGeofences.first.distanceMeters.toStringAsFixed(0)}m away)',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w500,
                                        color: Color(0xFF1D4ED8),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ] else ...[
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF8FAFC),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: OprinoColors.border),
                              ),
                              child: const Row(
                                children: [
                                  Icon(Icons.explore_outlined, size: 16, color: OprinoColors.slate),
                                  SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      'Field Operational Radius: Tracking route points',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: OprinoColors.slate,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                          const SizedBox(height: 8),
                          if (latestLocation != null)
                            Text(
                              'Current Fix: ${latestLocation.latitude.toStringAsFixed(4)}° N, ${latestLocation.longitude.toStringAsFixed(4)}° E  (±${latestLocation.accuracy.toStringAsFixed(1)}m)',
                              style: const TextStyle(
                                fontSize: 11,
                                fontFamily: 'monospace',
                                color: OprinoColors.slate,
                              ),
                            ),
                        ] else ...[
                          const Text(
                            'GPS hardware is unhooked. Off-duty location tracking NEVER occurs, guaranteeing complete employee privacy.',
                            style: TextStyle(
                              fontSize: 12,
                              color: OprinoColors.slate,
                              height: 1.3,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 16),

                // Shift Information Card
                Card(
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: const BorderSide(color: OprinoColors.border),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.schedule, size: 18, color: OprinoColors.cobalt),
                            SizedBox(width: 8),
                            Text(
                              'Shift & Schedule Policies',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: OprinoColors.navy,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Assigned Schedule',
                              style: TextStyle(fontSize: 13, color: OprinoColors.slate),
                            ),
                            Text(
                              attendance?.shiftName ?? 'General Operations Shift',
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: OprinoColors.navy,
                              ),
                            ),
                          ],
                        ),
                        const Divider(height: 20),
                        const Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Duty-Hours Privacy Guarantee',
                              style: TextStyle(fontSize: 13, color: OprinoColors.slate),
                            ),
                            Text(
                              'ACTIVE',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF16A34A),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          'Location tracking and field coordination occur strictly while On-Duty. Punching out terminates operational tracking immediately.',
                          style: TextStyle(
                            fontSize: 11,
                            color: OprinoColors.slate,
                            height: 1.3,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  },
);
  }
}

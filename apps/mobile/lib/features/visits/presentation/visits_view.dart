import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/oprino_theme.dart';
import '../../../../core/sync/sync_service.dart';
import '../../../../core/database/database.dart';
import '../../../../core/location/location_service.dart';
import '../../auth/presentation/auth_state_notifier.dart';

class VisitsView extends ConsumerStatefulWidget {
  const VisitsView({super.key});

  @override
  ConsumerState<VisitsView> createState() => _VisitsViewState();
}

class _VisitsViewState extends ConsumerState<VisitsView> {
  String _selectedFilter = 'ALL';
  bool _isProcessing = false;
  String? _error;

  Future<void> _handleCheckIn(String workspaceId, String visitId) async {
    setState(() {
      _isProcessing = true;
      _error = null;
    });

    try {
      final locationService = ref.read(locationServiceProvider);
      final fix = await locationService.getCurrentFix();
      final sync = ref.read(syncServiceProvider);

      final lat = fix?.latitude ?? 37.7749;
      final lng = fix?.longitude ?? -122.4194;
      final accuracy = fix?.accuracy ?? 5.0;

      await sync.queueVisitCheckIn(
        workspaceId: workspaceId,
        visitId: visitId,
        latitude: lat,
        longitude: lng,
        accuracy: accuracy,
        notes: 'GPS check-in via mobile app',
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Checked into site successfully!'),
            backgroundColor: Color(0xFF059669),
          ),
        );
      }
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  Future<void> _handleCheckOut(String workspaceId, String visitId) async {
    setState(() {
      _isProcessing = true;
      _error = null;
    });

    try {
      final locationService = ref.read(locationServiceProvider);
      final fix = await locationService.getCurrentFix();
      final sync = ref.read(syncServiceProvider);

      final lat = fix?.latitude ?? 37.7749;
      final lng = fix?.longitude ?? -122.4194;
      final accuracy = fix?.accuracy ?? 5.0;

      await sync.queueVisitCheckOut(
        workspaceId: workspaceId,
        visitId: visitId,
        latitude: lat,
        longitude: lng,
        accuracy: accuracy,
        notes: 'GPS check-out via mobile app',
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Checked out of site successfully!'),
            backgroundColor: Color(0xFF059669),
          ),
        );
      }
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authStateProvider);
    final workspaceId = auth.context?.activeWorkspace?.id ?? '';
    final sync = ref.watch(syncServiceProvider);

    return Column(
      children: [
        // Filter Chips Row
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          color: Colors.white,
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildFilterChip('ALL', 'All Visits'),
                const SizedBox(width: 8),
                _buildFilterChip('SCHEDULED', 'Scheduled'),
                const SizedBox(width: 8),
                _buildFilterChip('IN_PROGRESS', 'In Progress'),
                const SizedBox(width: 8),
                _buildFilterChip('COMPLETED', 'Completed'),
              ],
            ),
          ),
        ),
        const Divider(height: 1, color: OprinoColors.border),

        if (_error != null)
          Container(
            margin: const EdgeInsets.all(12),
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF2F2),
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: const Color(0xFFFCA5A5)),
            ),
            child: Text(
              _error!,
              style: const TextStyle(color: Color(0xFF991B1B), fontSize: 12),
            ),
          ),

        // Visits Stream
        Expanded(
          child: StreamBuilder<List<CachedVisit>>(
            stream: sync.watchVisits(workspaceId),
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting &&
                  !snapshot.hasData) {
                return const Center(child: CircularProgressIndicator());
              }

              final allVisits = snapshot.data ?? [];
              final filteredVisits = _selectedFilter == 'ALL'
                  ? allVisits
                  : allVisits.where((v) => v.status == _selectedFilter).toList();

              if (filteredVisits.isEmpty) {
                return RefreshIndicator(
                  onRefresh: () => sync.syncDownVisits(workspaceId),
                  child: ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    children: [
                      SizedBox(
                        height: MediaQuery.of(context).size.height * 0.4,
                        child: Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.location_on_outlined,
                                  size: 48, color: OprinoColors.slate.withValues(alpha: 0.5)),
                              const SizedBox(height: 12),
                              Text(
                                _selectedFilter == 'ALL'
                                    ? 'No customer site visits scheduled'
                                    : 'No $_selectedFilter visits',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                  color: OprinoColors.slate,
                                ),
                              ),
                              const SizedBox(height: 4),
                              const Text(
                                'Pull down to refresh from server',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: OprinoColors.slate,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              }

              return RefreshIndicator(
                onRefresh: () => sync.syncDownVisits(workspaceId),
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: filteredVisits.length,
                  itemBuilder: (context, index) {
                    final visit = filteredVisits[index];
                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: Card(
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                          side: const BorderSide(color: OprinoColors.border),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  _buildStatusBadge(visit.status),
                                  if (visit.durationMinutes != null)
                                    Text(
                                      '⏱ ${visit.durationMinutes} min',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                        color: OprinoColors.slate,
                                      ),
                                    ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              Text(
                                visit.customerName ?? 'Customer Site Visit',
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: OprinoColors.navy,
                                ),
                              ),
                              if (visit.siteName != null && visit.siteName!.isNotEmpty) ...[
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    const Icon(Icons.place, size: 14, color: OprinoColors.cobalt),
                                    const SizedBox(width: 4),
                                    Expanded(
                                      child: Text(
                                        visit.siteName!,
                                        style: const TextStyle(
                                          fontSize: 13,
                                          color: OprinoColors.slate,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                              if (visit.notes != null && visit.notes!.isNotEmpty) ...[
                                const SizedBox(height: 6),
                                Text(
                                  visit.notes!,
                                  style: const TextStyle(fontSize: 12, color: OprinoColors.slate),
                                ),
                              ],
                              const Divider(height: 20),
                              if (visit.status == 'SCHEDULED')
                                SizedBox(
                                  width: double.infinity,
                                  child: ElevatedButton.icon(
                                    onPressed: _isProcessing
                                        ? null
                                        : () => _handleCheckIn(workspaceId, visit.id),
                                    icon: const Icon(Icons.login, size: 16),
                                    label: const Text('Check In (GPS Geofence)', style: TextStyle(fontWeight: FontWeight.bold)),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: OprinoColors.cobalt,
                                      foregroundColor: Colors.white,
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                    ),
                                  ),
                                )
                              else if (visit.status == 'IN_PROGRESS')
                                SizedBox(
                                  width: double.infinity,
                                  child: ElevatedButton.icon(
                                    onPressed: _isProcessing
                                        ? null
                                        : () => _handleCheckOut(workspaceId, visit.id),
                                    icon: const Icon(Icons.logout, size: 16),
                                    label: const Text('Check Out of Site', style: TextStyle(fontWeight: FontWeight.bold)),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFFD97706),
                                      foregroundColor: Colors.white,
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                    ),
                                  ),
                                )
                              else if (visit.status == 'COMPLETED')
                                Row(
                                  children: [
                                    const Icon(Icons.check_circle, size: 16, color: Color(0xFF059669)),
                                    const SizedBox(width: 6),
                                    Text(
                                      'Visit completed ${visit.checkOutTime != null ? "at ${visit.checkOutTime!.toLocal().hour}:${visit.checkOutTime!.toLocal().minute.toString().padLeft(2, '0')}" : ""}',
                                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF059669)),
                                    ),
                                  ],
                                ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildStatusBadge(String status) {
    Color bg = const Color(0xFFEFF6FF);
    Color color = OprinoColors.cobalt;

    if (status == 'IN_PROGRESS') {
      bg = const Color(0xFFFEF3C7);
      color = const Color(0xFFB45309);
    } else if (status == 'COMPLETED') {
      bg = const Color(0xFFECFDF5);
      color = const Color(0xFF047857);
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        status.replaceAll('_', ' '),
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.bold,
          color: color,
        ),
      ),
    );
  }

  Widget _buildFilterChip(String filterKey, String label) {
    final isSelected = _selectedFilter == filterKey;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        if (selected) setState(() => _selectedFilter = filterKey);
      },
      selectedColor: const Color(0xFFEFF6FF),
      labelStyle: TextStyle(
        fontSize: 12,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        color: isSelected ? OprinoColors.cobalt : OprinoColors.slate,
      ),
      side: BorderSide(
        color: isSelected ? OprinoColors.cobalt : OprinoColors.border,
      ),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
    );
  }
}

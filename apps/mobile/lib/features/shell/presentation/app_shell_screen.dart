import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/oprino_theme.dart';
import '../../../core/network/api_client_provider.dart';
import '../../../core/sync/sync_service.dart';
import '../../../core/database/database.dart';
import '../../auth/presentation/auth_state_notifier.dart';
import '../../attendance/presentation/attendance_view.dart';
import '../../tasks/presentation/tasks_view.dart';

class AppShellScreen extends ConsumerStatefulWidget {
  const AppShellScreen({super.key});

  @override
  ConsumerState<AppShellScreen> createState() => _AppShellScreenState();
}

class _AppShellScreenState extends ConsumerState<AppShellScreen> {
  String? _installationId;
  int _selectedIndex = 0;

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

  void _showWorkspaceSwitchDialog(BuildContext context, AuthState authState) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) {
        final currentWsId = authState.context?.activeWorkspace?.id;
        final workspaces = authState.workspaces;

        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Switch Workspace',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: OprinoColors.navy,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                if (workspaces.isEmpty)
                  const Padding(
                    padding: EdgeInsets.all(16.0),
                    child: Text('No other workspaces available.'),
                  )
                else
                  ...workspaces.map((ws) {
                    final isCurrent = ws.id == currentWsId;
                    return ListTile(
                      title: Text(
                        ws.name,
                        style: TextStyle(
                          fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
                          color: isCurrent ? OprinoColors.cobalt : OprinoColors.navy,
                        ),
                      ),
                      subtitle: Text(
                        'Role: ${ws.roleName} • Status: ${ws.membershipStatus}',
                        style: const TextStyle(fontSize: 12, color: OprinoColors.slate),
                      ),
                      trailing: isCurrent
                          ? const Icon(Icons.check_circle, color: OprinoColors.cobalt)
                          : null,
                      onTap: () {
                        Navigator.pop(ctx);
                        if (!isCurrent) {
                          ref.read(authStateProvider.notifier).switchWorkspace(ws.id);
                        }
                      },
                    );
                  }),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);
    final me = authState.context;
    final user = me?.user;
    final workspace = me?.activeWorkspace;
    final role = me?.role;
    final permissions = me?.permissions ?? [];
    final sync = ref.watch(syncServiceProvider);

    return Scaffold(
      backgroundColor: OprinoColors.paper,
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
          // Outbox Sync Indicator
          StreamBuilder<List<OutboxMutation>>(
            stream: sync.watchPendingMutations(),
            builder: (context, snapshot) {
              final pendingCount = snapshot.data?.length ?? 0;
              if (pendingCount == 0) return const SizedBox.shrink();
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: Tooltip(
                  message: '$pendingCount offline changes queued for sync',
                  child: Chip(
                    avatar: const SizedBox(
                      width: 12,
                      height: 12,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                    label: Text(
                      '$pendingCount sync',
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                    backgroundColor: const Color(0xFFEFF6FF),
                    side: const BorderSide(color: Color(0xFFBFDBFE)),
                    visualDensity: VisualDensity.compact,
                  ),
                ),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout, color: OprinoColors.slate),
            tooltip: 'Sign Out',
            onPressed: () {
              ref.read(authStateProvider.notifier).signOut();
            },
          ),
        ],
      ),
      body: IndexedStack(
        index: _selectedIndex,
        children: [
          // Tab 0: Attendance
          const AttendanceView(),

          // Tab 1: Tasks
          const TasksView(),

          // Tab 2: Profile & Workspace Governance
          SingleChildScrollView(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Active Workspace Card
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
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Active Workspace',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: OprinoColors.slate,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: const Color(0xFFDCFCE7),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Text(
                                'Active Tenant',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF15803D),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          workspace?.name ?? 'Loading Workspace...',
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                            color: OprinoColors.navy,
                            fontFamily: 'Outfit',
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Slug: ${workspace?.slug ?? 'N/A'}',
                          style: const TextStyle(
                            fontSize: 12,
                            color: OprinoColors.slate,
                            fontFamily: 'monospace',
                          ),
                        ),
                        const SizedBox(height: 12),
                        OutlinedButton.icon(
                          onPressed: () => _showWorkspaceSwitchDialog(context, authState),
                          icon: const Icon(Icons.swap_horiz, size: 16),
                          label: Text('Switch Workspace (${authState.workspaces.length})'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: OprinoColors.cobalt,
                            side: const BorderSide(color: OprinoColors.cobalt),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // User Identity & Role Card
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
                        const Text(
                          'Identity & Governance',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: OprinoColors.navy,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            CircleAvatar(
                              backgroundColor: OprinoColors.cobalt,
                              foregroundColor: Colors.white,
                              child: Text(
                                user?.name.isNotEmpty == true ? user!.name[0].toUpperCase() : 'U',
                                style: const TextStyle(fontWeight: FontWeight.bold),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    user?.name ?? 'Loading User...',
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      color: OprinoColors.navy,
                                    ),
                                  ),
                                  Text(
                                    user?.email ?? '',
                                    style: const TextStyle(fontSize: 13, color: OprinoColors.slate),
                                  ),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: const Color(0xFFEFF6FF),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(color: const Color(0xFFBFDBFE)),
                              ),
                              child: Text(
                                role?.name ?? 'Employee',
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: OprinoColors.cobalt,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Active Permissions Card
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
                        const Text(
                          'Active Workspace Capabilities',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: OprinoColors.navy,
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Capabilities enforced via tenant-scoped PostgreSQL RLS policies.',
                          style: TextStyle(fontSize: 12, color: OprinoColors.slate),
                        ),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 6,
                          runSpacing: 6,
                          children: permissions.map((perm) {
                            return Chip(
                              label: Text(
                                perm,
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontFamily: 'monospace',
                                  color: OprinoColors.navy,
                                ),
                              ),
                              backgroundColor: const Color(0xFFF1F5F9),
                              side: const BorderSide(color: OprinoColors.border),
                              visualDensity: VisualDensity.compact,
                            );
                          }).toList(),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Device Installation Governance Card
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
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Device Installation Governance',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: OprinoColors.navy,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: const Color(0xFFDCFCE7),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Text(
                                'Authorized',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF15803D),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'UUID: ${_installationId ?? 'Loading...'}',
                          style: const TextStyle(
                            fontSize: 12,
                            fontFamily: 'monospace',
                            color: OprinoColors.slate,
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Strict Zero-IMEI privacy design. Random secure RFC 4122 UUIDv4.',
                          style: TextStyle(fontSize: 11, color: OprinoColors.slate),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Duty-Hours Core Invariant Banner
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: OprinoColors.border),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.shield_outlined, size: 20, color: OprinoColors.cobalt),
                      SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'Duty-Hours Invariant: Off-duty location tracking NEVER occurs. Peer visibility OFF by default.',
                          style: TextStyle(
                            fontSize: 11,
                            color: OprinoColors.navy,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (index) => setState(() => _selectedIndex = index),
        selectedItemColor: OprinoColors.cobalt,
        unselectedItemColor: OprinoColors.slate,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.schedule),
            label: 'Attendance',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.assignment),
            label: 'Tasks',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/oprino_theme.dart';
import '../../../../core/sync/sync_service.dart';
import '../../../../core/database/database.dart';
import '../../auth/presentation/auth_state_notifier.dart';
import 'task_detail_screen.dart';

class TasksView extends ConsumerStatefulWidget {
  const TasksView({super.key});

  @override
  ConsumerState<TasksView> createState() => _TasksViewState();
}

class _TasksViewState extends ConsumerState<TasksView> {
  String _selectedFilter = 'ALL'; // 'ALL', 'TO_DO', 'IN_PROGRESS', 'DONE'

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _refreshTasks();
    });
  }

  void _refreshTasks() {
    final auth = ref.read(authStateProvider);
    final wsId = auth.context?.activeWorkspace?.id;
    if (wsId != null) {
      ref.read(syncServiceProvider).syncDownTasks(wsId);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authStateProvider);
    final workspaceId = auth.context?.activeWorkspace?.id ?? '';
    final sync = ref.watch(syncServiceProvider);

    return Column(
      children: [
        // Filter Chips Bar
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          color: Colors.white,
          child: Row(
            children: [
              _buildFilterChip('ALL', 'All'),
              const SizedBox(width: 8),
              _buildFilterChip('TO_DO', 'To Do'),
              const SizedBox(width: 8),
              _buildFilterChip('IN_PROGRESS', 'In Progress'),
              const SizedBox(width: 8),
              _buildFilterChip('DONE', 'Done'),
            ],
          ),
        ),
        const Divider(height: 1, color: OprinoColors.border),

        // Task List
        Expanded(
          child: StreamBuilder<List<CachedTask>>(
            stream: sync.watchTasks(workspaceId),
            builder: (context, snapshot) {
              final allTasks = snapshot.data ?? [];
              final filteredTasks = _selectedFilter == 'ALL'
                  ? allTasks
                  : allTasks.where((t) => t.simplifiedStatus == _selectedFilter).toList();

              return RefreshIndicator(
                onRefresh: () async => _refreshTasks(),
                child: filteredTasks.isEmpty
                    ? ListView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        children: [
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 60, horizontal: 20),
                            child: Column(
                              children: [
                                const Icon(Icons.assignment_outlined, size: 48, color: OprinoColors.slate),
                                const SizedBox(height: 12),
                                Text(
                                  _selectedFilter == 'ALL'
                                      ? 'No assigned tasks'
                                      : 'No $_selectedFilter tasks',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                    color: OprinoColors.navy,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                const Text(
                                  'Pull to refresh or check back when new tasks are dispatched.',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(fontSize: 13, color: OprinoColors.slate),
                                ),
                              ],
                            ),
                          ),
                        ],
                      )
                    : ListView.builder(
                        physics: const AlwaysScrollableScrollPhysics(),
                        padding: const EdgeInsets.all(16),
                        itemCount: filteredTasks.length,
                        itemBuilder: (context, index) {
                          final task = filteredTasks[index];
                          return Card(
                            elevation: 0,
                            margin: const EdgeInsets.only(bottom: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                              side: const BorderSide(color: OprinoColors.border),
                            ),
                            child: InkWell(
                              borderRadius: BorderRadius.circular(12),
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => TaskDetailScreen(
                                      taskId: task.id,
                                      title: task.title,
                                      description: task.description,
                                      initialStatus: task.status,
                                      priority: task.priority,
                                      version: task.version,
                                      dueAt: task.dueAt,
                                    ),
                                  ),
                                );
                              },
                              child: Padding(
                                padding: const EdgeInsets.all(16),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                              horizontal: 8, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFEFF6FF),
                                            borderRadius: BorderRadius.circular(4),
                                          ),
                                          child: Text(
                                            task.status,
                                            style: const TextStyle(
                                              fontSize: 11,
                                              fontWeight: FontWeight.bold,
                                              color: OprinoColors.cobalt,
                                            ),
                                          ),
                                        ),
                                        Text(
                                          task.priority,
                                          style: const TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.w600,
                                            color: OprinoColors.slate,
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 10),
                                    Text(
                                      task.title,
                                      style: const TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                        color: OprinoColors.navy,
                                      ),
                                    ),
                                    if (task.description != null &&
                                        task.description!.isNotEmpty) ...[
                                      const SizedBox(height: 4),
                                      Text(
                                        task.description!,
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                          fontSize: 13,
                                          color: OprinoColors.slate,
                                        ),
                                      ),
                                    ],
                                    const SizedBox(height: 12),
                                    Row(
                                      children: [
                                        const Icon(Icons.calendar_today,
                                            size: 14, color: OprinoColors.slate),
                                        const SizedBox(width: 4),
                                        Text(
                                          task.dueAt != null
                                              ? '${task.dueAt!.toLocal().month}/${task.dueAt!.toLocal().day}'
                                              : 'No due date',
                                          style: const TextStyle(
                                            fontSize: 12,
                                            color: OprinoColors.slate,
                                          ),
                                        ),
                                        const Spacer(),
                                        const Icon(Icons.chevron_right,
                                            size: 18, color: OprinoColors.slate),
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

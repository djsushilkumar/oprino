import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/oprino_theme.dart';
import '../../../../core/sync/sync_service.dart';
import '../../../../core/database/database.dart';
import '../../auth/presentation/auth_state_notifier.dart';

class TaskDetailScreen extends ConsumerStatefulWidget {
  final String taskId;
  final String title;
  final String? description;
  final String initialStatus;
  final String priority;
  final int version;
  final DateTime? dueAt;

  const TaskDetailScreen({
    super.key,
    required this.taskId,
    required this.title,
    this.description,
    required this.initialStatus,
    required this.priority,
    required this.version,
    this.dueAt,
  });

  @override
  ConsumerState<TaskDetailScreen> createState() => _TaskDetailScreenState();
}

class _TaskDetailScreenState extends ConsumerState<TaskDetailScreen> {
  bool _isTransitioning = false;
  String? _transitionError;
  final TextEditingController _commentController = TextEditingController();

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  String? _getNextStatus(String currentStatus) {
    switch (currentStatus) {
      case 'ASSIGNED':
        return 'ACCEPTED';
      case 'ACCEPTED':
        return 'EN_ROUTE';
      case 'EN_ROUTE':
        return 'ARRIVED';
      case 'ARRIVED':
        return 'IN_PROGRESS';
      case 'IN_PROGRESS':
        return 'COMPLETED';
      default:
        return null;
    }
  }

  String _getNextStatusButtonLabel(String currentStatus) {
    switch (currentStatus) {
      case 'ASSIGNED':
        return 'Accept Task';
      case 'ACCEPTED':
        return 'Start Travel (En Route)';
      case 'EN_ROUTE':
        return 'Arrived at Site';
      case 'ARRIVED':
        return 'Start Work (In Progress)';
      case 'IN_PROGRESS':
        return 'Mark Completed';
      default:
        return 'Update Status';
    }
  }

  Future<void> _handleTransition(String workspaceId, String targetStatus, int currentVersion) async {
    setState(() {
      _isTransitioning = true;
      _transitionError = null;
    });

    try {
      final sync = ref.read(syncServiceProvider);
      await sync.queueTaskTransition(
        workspaceId: workspaceId,
        taskId: widget.taskId,
        targetStatus: targetStatus,
        version: currentVersion,
        comment: _commentController.text.trim().isNotEmpty ? _commentController.text.trim() : null,
      );
      _commentController.clear();
    } catch (e) {
      setState(() => _transitionError = e.toString());
    } finally {
      if (mounted) setState(() => _isTransitioning = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authStateProvider);
    final workspaceId = auth.context?.activeWorkspace?.id ?? '';
    final sync = ref.watch(syncServiceProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Task Details'),
        backgroundColor: Colors.white,
        foregroundColor: OprinoColors.navy,
        elevation: 0,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: OprinoColors.border, height: 1),
        ),
      ),
      backgroundColor: const Color(0xFFF8FAFC),
      body: StreamBuilder<List<CachedTask>>(
        stream: sync.watchTasks(workspaceId),
        builder: (context, taskSnapshot) {
          final tasks = taskSnapshot.data ?? [];
          final currentTask = tasks.cast<CachedTask?>().firstWhere(
                (t) => t?.id == widget.taskId,
                orElse: () => null,
              );

          final status = currentTask?.status ?? widget.initialStatus;
          final version = currentTask?.version ?? widget.version;
          final nextStatus = _getNextStatus(status);

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (_transitionError != null)
                  Container(
                    margin: const EdgeInsets.only(bottom: 16),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF2F2),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFFFCA5A5)),
                    ),
                    child: Text(
                      _transitionError!,
                      style: const TextStyle(color: Color(0xFF991B1B), fontSize: 13),
                    ),
                  ),

                // Task Summary Card
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
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: const Color(0xFFEFF6FF),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                status,
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: OprinoColors.cobalt,
                                ),
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFEF3C7),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                widget.priority,
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFFB45309),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Text(
                          widget.title,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: OprinoColors.navy,
                          ),
                        ),
                        if (widget.description != null && widget.description!.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          Text(
                            widget.description!,
                            style: const TextStyle(
                              fontSize: 14,
                              color: OprinoColors.slate,
                              height: 1.4,
                            ),
                          ),
                        ],
                        const Divider(height: 24),
                        Row(
                          children: [
                            const Icon(Icons.event, size: 16, color: OprinoColors.slate),
                            const SizedBox(width: 6),
                            Text(
                              widget.dueAt != null
                                  ? 'Due: ${widget.dueAt!.toLocal().month}/${widget.dueAt!.toLocal().day}/${widget.dueAt!.toLocal().year}'
                                  : 'No due date set',
                              style: const TextStyle(fontSize: 12, color: OprinoColors.slate),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 16),

                // Status Transition Action Button
                if (nextStatus != null)
                  Card(
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: const BorderSide(color: OprinoColors.cobalt),
                    ),
                    color: const Color(0xFFF8FAFC),
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Text(
                            'Next Action: $nextStatus',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: OprinoColors.cobalt,
                            ),
                          ),
                          const SizedBox(height: 12),
                          SizedBox(
                            height: 48,
                            child: ElevatedButton(
                              onPressed: _isTransitioning
                                  ? null
                                  : () => _handleTransition(workspaceId, nextStatus, version),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: OprinoColors.cobalt,
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                elevation: 0,
                              ),
                              child: _isTransitioning
                                  ? const SizedBox(
                                      width: 20,
                                      height: 20,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        valueColor: AlwaysStoppedAnimation(Colors.white),
                                      ),
                                    )
                                  : Text(
                                      _getNextStatusButtonLabel(status),
                                      style: const TextStyle(fontWeight: FontWeight.bold),
                                    ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  )
                else if (status == 'COMPLETED')
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFECFDF5),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFA7F3D0)),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.check_circle, color: Color(0xFF059669)),
                        SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Task is completed and awaiting manager verification.',
                            style: TextStyle(
                              color: Color(0xFF065F46),
                              fontWeight: FontWeight.w600,
                              fontSize: 13,
                            ),
                          ),
                        ),
                      ],
                    ),
                  )
                else if (status == 'VERIFIED')
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: OprinoColors.border),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.verified, color: OprinoColors.cobalt),
                        SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Task verified and closed by supervisor.',
                            style: TextStyle(
                              color: OprinoColors.navy,
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                const SizedBox(height: 20),

                // Interactive Checklist Card
                StreamBuilder<List<CachedChecklistItem>>(
                  stream: sync.watchChecklist(widget.taskId),
                  builder: (context, checklistSnapshot) {
                    final items = checklistSnapshot.data ?? [];
                    if (items.isEmpty) return const SizedBox.shrink();

                    final completedCount = items.where((i) => i.isCompleted).length;

                    return Card(
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
                                  'Action Checklist',
                                  style: TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.bold,
                                    color: OprinoColors.navy,
                                  ),
                                ),
                                Text(
                                  '$completedCount/${items.length} Done',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: OprinoColors.slate,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            ...items.map((item) {
                              return CheckboxListTile(
                                contentPadding: EdgeInsets.zero,
                                activeColor: OprinoColors.cobalt,
                                title: Text(
                                  item.title,
                                  style: TextStyle(
                                    fontSize: 14,
                                    decoration: item.isCompleted
                                        ? TextDecoration.lineThrough
                                        : TextDecoration.none,
                                    color: item.isCompleted
                                        ? OprinoColors.slate
                                        : OprinoColors.navy,
                                  ),
                                ),
                                value: item.isCompleted,
                                onChanged: (val) {
                                  if (val != null) {
                                    sync.queueChecklistToggle(
                                      workspaceId: workspaceId,
                                      taskId: widget.taskId,
                                      itemId: item.id,
                                      isCompleted: val,
                                    );
                                  }
                                },
                              );
                            }),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

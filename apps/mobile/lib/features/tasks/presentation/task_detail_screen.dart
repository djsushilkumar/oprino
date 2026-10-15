import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/oprino_theme.dart';
import '../../../../core/sync/sync_service.dart';
import '../../../../core/database/database.dart';
import '../../../../core/location/location_service.dart';
import '../../../../core/network/media_upload_service.dart';
import '../../../../core/utils/signature_rasterizer.dart';
import '../../auth/presentation/auth_state_notifier.dart';
import 'widgets/customer_signature_sheet.dart';
import 'widgets/photo_proof_sheet.dart';
import 'widgets/proof_viewer_sheet.dart';

class TaskDetailScreen extends ConsumerStatefulWidget {
  final String taskId;
  final String title;
  final String? description;
  final String initialStatus;
  final String priority;
  final int version;
  final DateTime? dueAt;
  final String? customerName;
  final String? siteName;
  final bool requiresPhotoProof;
  final bool requiresSignature;
  final String? verifierName;
  final String? verificationNotes;

  const TaskDetailScreen({
    super.key,
    required this.taskId,
    required this.title,
    this.description,
    required this.initialStatus,
    required this.priority,
    required this.version,
    this.dueAt,
    this.customerName,
    this.siteName,
    this.requiresPhotoProof = false,
    this.requiresSignature = false,
    this.verifierName,
    this.verificationNotes,
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

  Future<void> _handleTransition({
    required String workspaceId,
    required String targetStatus,
    required int currentVersion,
    required List<CachedChecklistItem> checklist,
    required List<CachedTaskProof> proofs,
    required bool reqPhoto,
    required bool reqSig,
  }) async {
    // 1. Mandatory Checklist validation
    if (targetStatus == 'COMPLETED') {
      final incomplete = checklist.where((item) => !item.isCompleted).toList();
      if (incomplete.isNotEmpty) {
        setState(() {
          _transitionError =
              'Cannot complete task: ${incomplete.length} checklist items are still incomplete. All checklist items must be checked off.';
        });
        return;
      }

      // 2. Proof of Work validation
      if (reqPhoto) {
        final hasPhoto = proofs.any((p) => p.proofType == 'PHOTO');
        if (!hasPhoto) {
          setState(() {
            _transitionError =
                'Cannot complete task: Mandatory geotagged photo proof must be captured first.';
          });
          return;
        }
      }

      if (reqSig) {
        final hasSignature = proofs.any((p) => p.proofType == 'SIGNATURE');
        if (!hasSignature) {
          setState(() {
            _transitionError =
                'Cannot complete task: Mandatory customer on-glass digital signature must be captured first.';
          });
          return;
        }
      }
    }

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
        comment: _commentController.text.trim().isNotEmpty
            ? _commentController.text.trim()
            : null,
      );
      _commentController.clear();
    } catch (e) {
      setState(() => _transitionError = e.toString());
    } finally {
      if (mounted) setState(() => _isTransitioning = false);
    }
  }

  void _openSignatureSheet(String workspaceId, String userId) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => CustomerSignatureSheet(
        taskId: widget.taskId,
        onConfirm: ({
          required String signerName,
          String? signerPhone,
          required List<List<Offset>> strokes,
          Uint8List? signaturePngBytes,
        }) async {
          final sync = ref.read(syncServiceProvider);
          final mediaService = ref.read(mediaUploadServiceProvider);
          final now = DateTime.now();

          // Ensure valid PNG bytes exist
          final pngBytes = signaturePngBytes ??
              await SignatureRasterizer.renderStrokesToPng(strokes: strokes);

          try {
            // 1. Try online direct binary upload to R2/S3
            final uploadMeta = await mediaService.requestTaskProofUploadUrl(
              taskId: widget.taskId,
              visitId: null,
              proofType: 'SIGNATURE',
              fileName: 'signature_${widget.taskId}.png',
              mimeType: 'image/png',
              fileSizeBytes: pngBytes.length,
            );

            await mediaService.uploadBinaryBytes(
              uploadUrl: uploadMeta.uploadUrl,
              bytes: pngBytes,
              contentType: 'image/png',
            );

            await sync.queueProofConfirmation(
              workspaceId: workspaceId,
              taskId: widget.taskId,
              userId: userId,
              proofType: 'SIGNATURE',
              fileKey: uploadMeta.fileKey,
              localFilePath: null,
              isBinaryUploaded: true,
              signerName: signerName,
              signerPhone: signerPhone,
              notes: 'Digital signature on glass captured via mobile client',
            );

            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Customer signature captured and uploaded successfully!'),
                  backgroundColor: Color(0xFF059669),
                ),
              );
            }
          } catch (_) {
            // 2. Offline Resilience: save signature PNG to local private storage & queue confirmation for outbox sync
            try {
              final localPath = await mediaService.savePendingImageFile(
                prefix: 'sig_${widget.taskId}',
                bytes: pngBytes,
                extension: 'png',
              );

              await sync.queueProofConfirmation(
                workspaceId: workspaceId,
                taskId: widget.taskId,
                userId: userId,
                proofType: 'SIGNATURE',
                fileKey: 'pending_sig_${now.millisecondsSinceEpoch}.png',
                localFilePath: localPath,
                isBinaryUploaded: false,
                signerName: signerName,
                signerPhone: signerPhone,
                notes: 'Digital signature on glass captured offline',
              );

              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Customer signature saved locally (offline mode). Will sync automatically when online.'),
                    backgroundColor: Color(0xFF2563EB),
                  ),
                );
              }
            } catch (saveErr) {
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Failed to save signature: ${saveErr.toString()}'),
                    backgroundColor: const Color(0xFFDC2626),
                  ),
                );
              }
            }
          }
        },
      ),
    );
  }

  void _openPhotoSheet(String workspaceId, String userId) async {
    final locationAdapter = ref.read(locationHardwareAdapterProvider);
    final currentLoc = await locationAdapter.getCurrentPosition();

    if (!mounted) return;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => PhotoProofSheet(
        taskId: widget.taskId,
        currentLatitude: currentLoc?.latitude,
        currentLongitude: currentLoc?.longitude,
        accuracy: currentLoc?.accuracy,
        onConfirm: ({
          required String fileKey,
          String? localFilePath,
          required bool isBinaryUploaded,
          required String notes,
          double? latitude,
          double? longitude,
          double? accuracy,
          required DateTime timestamp,
        }) async {
          final sync = ref.read(syncServiceProvider);

          await sync.queueProofConfirmation(
            workspaceId: workspaceId,
            taskId: widget.taskId,
            userId: userId,
            proofType: 'PHOTO',
            fileKey: fileKey,
            localFilePath: localFilePath,
            isBinaryUploaded: isBinaryUploaded,
            watermarkMetadata: {
              if (latitude != null) 'latitude': latitude,
              if (longitude != null) 'longitude': longitude,
              if (accuracy != null) 'accuracy': accuracy,
              'timestamp': timestamp.toIso8601String(),
              'geotagged': latitude != null && longitude != null,
            },
            notes: notes.isNotEmpty ? notes : null,
          );

          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  latitude != null
                      ? 'Geotagged photo proof recorded successfully!'
                      : 'Photo proof recorded successfully (un-geotagged)!',
                ),
                backgroundColor: const Color(0xFF059669),
              ),
            );
          }
        },
      ),
    );
  }

  void _openVerificationDialog(String workspaceId) {
    final notesController = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Verify Task Completion', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Confirm that the task deliverables, checklists, and photo proofs meet quality standards.',
              style: TextStyle(fontSize: 13, color: OprinoColors.slate),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: notesController,
              decoration: const InputDecoration(
                labelText: 'Verification Notes (Optional)',
                border: OutlineInputBorder(),
                isDense: true,
              ),
              maxLines: 2,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.of(ctx).pop();
              final sync = ref.read(syncServiceProvider);
              await sync.queueTaskVerification(
                workspaceId: workspaceId,
                taskId: widget.taskId,
                action: 'APPROVE',
                notes: notesController.text.trim().isNotEmpty ? notesController.text.trim() : null,
              );
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Task verified and closed successfully!'),
                    backgroundColor: Color(0xFF059669),
                  ),
                );
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF059669),
              foregroundColor: Colors.white,
            ),
            child: const Text('Approve & Verify'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authStateProvider);
    final workspaceId = auth.context?.activeWorkspace?.id ?? '';
    final userId = auth.context?.user.id ?? '';
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
          final customerName = currentTask?.customerName ?? widget.customerName;
          final siteName = currentTask?.siteName ?? widget.siteName;
          final reqPhoto = currentTask?.requiresPhotoProof ?? widget.requiresPhotoProof;
          final reqSig = currentTask?.requiresSignature ?? widget.requiresSignature;
          final verifier = currentTask?.verifierName ?? widget.verifierName;
          final nextStatus = _getNextStatus(status);

          return StreamBuilder<List<CachedChecklistItem>>(
            stream: sync.watchChecklist(widget.taskId),
            builder: (context, checklistSnapshot) {
              final checklist = checklistSnapshot.data ?? [];

              return StreamBuilder<List<CachedTaskProof>>(
                stream: sync.watchTaskProofs(widget.taskId),
                builder: (context, proofSnapshot) {
                  final proofs = proofSnapshot.data ?? [];

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
                            child: Row(
                              children: [
                                const Icon(Icons.error_outline, color: Color(0xFF991B1B), size: 20),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    _transitionError!,
                                    style: const TextStyle(color: Color(0xFF991B1B), fontSize: 13),
                                  ),
                                ),
                              ],
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
                                if (customerName != null && customerName.isNotEmpty) ...[
                                  const SizedBox(height: 6),
                                  Row(
                                    children: [
                                      const Icon(Icons.business, size: 15, color: OprinoColors.cobalt),
                                      const SizedBox(width: 6),
                                      Text(
                                        customerName,
                                        style: const TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w600,
                                          color: OprinoColors.cobalt,
                                        ),
                                      ),
                                      if (siteName != null && siteName.isNotEmpty) ...[
                                        const SizedBox(width: 4),
                                        Text(
                                          '• $siteName',
                                          style: const TextStyle(fontSize: 13, color: OprinoColors.slate),
                                        ),
                                      ],
                                    ],
                                  ),
                                ],
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

                                // Proof Badges
                                if (reqPhoto || reqSig) ...[
                                  const SizedBox(height: 12),
                                  Wrap(
                                    spacing: 8,
                                    runSpacing: 6,
                                    children: [
                                      if (reqPhoto)
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFF0FDF4),
                                            borderRadius: BorderRadius.circular(4),
                                            border: Border.all(color: const Color(0xFFBBF7D0)),
                                          ),
                                          child: const Text(
                                            '📷 Photo Proof Required',
                                            style: TextStyle(
                                              fontSize: 11,
                                              fontWeight: FontWeight.bold,
                                              color: Color(0xFF15803D),
                                            ),
                                          ),
                                        ),
                                      if (reqSig)
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFEFF6FF),
                                            borderRadius: BorderRadius.circular(4),
                                            border: Border.all(color: const Color(0xFFBFDBFE)),
                                          ),
                                          child: const Text(
                                            '✍️ On-Glass Signature Required',
                                            style: TextStyle(
                                              fontSize: 11,
                                              fontWeight: FontWeight.bold,
                                              color: Color(0xFF1D4ED8),
                                            ),
                                          ),
                                        ),
                                    ],
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
                                          : () => _handleTransition(
                                                workspaceId: workspaceId,
                                                targetStatus: nextStatus,
                                                currentVersion: version,
                                                checklist: checklist,
                                                proofs: proofs,
                                                reqPhoto: reqPhoto,
                                                reqSig: reqSig,
                                              ),
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
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                const Row(
                                  children: [
                                    Icon(Icons.check_circle, color: Color(0xFF059669)),
                                    SizedBox(width: 12),
                                    Expanded(
                                      child: Text(
                                        'Task is completed and awaiting manager verification review.',
                                        style: TextStyle(
                                          color: Color(0xFF065F46),
                                          fontWeight: FontWeight.w600,
                                          fontSize: 13,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                ElevatedButton.icon(
                                  onPressed: () => _openVerificationDialog(workspaceId),
                                  icon: const Icon(Icons.verified, size: 18),
                                  label: const Text('Verify Task Completion (Manager Action)', style: TextStyle(fontWeight: FontWeight.bold)),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF059669),
                                    foregroundColor: Colors.white,
                                    elevation: 0,
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
                            child: Row(
                              children: [
                                const Icon(Icons.verified, color: OprinoColors.cobalt),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    verifier != null
                                        ? 'Verified by $verifier'
                                        : 'Task verified and closed by supervisor.',
                                    style: const TextStyle(
                                      color: OprinoColors.navy,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),

                        const SizedBox(height: 16),

                        // Proof of Work Collection Card
                        if (status == 'IN_PROGRESS' || status == 'ARRIVED' || status == 'COMPLETED')
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
                                    'Proof of Work & Field Evidence',
                                    style: TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.bold,
                                      color: OprinoColors.navy,
                                    ),
                                  ),
                                  const SizedBox(height: 12),
                                  Row(
                                    children: [
                                      Expanded(
                                        child: OutlinedButton.icon(
                                          onPressed: () => _openPhotoSheet(workspaceId, userId),
                                          icon: const Icon(Icons.camera_alt, size: 16),
                                          label: const Text('Add Photo', style: TextStyle(fontSize: 12)),
                                          style: OutlinedButton.styleFrom(
                                            foregroundColor: const Color(0xFF059669),
                                            side: const BorderSide(color: Color(0xFF10B981)),
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: OutlinedButton.icon(
                                          onPressed: () => _openSignatureSheet(workspaceId, userId),
                                          icon: const Icon(Icons.draw, size: 16),
                                          label: const Text('Add Signature', style: TextStyle(fontSize: 12)),
                                          style: OutlinedButton.styleFrom(
                                            foregroundColor: OprinoColors.cobalt,
                                            side: const BorderSide(color: OprinoColors.cobalt),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  if (proofs.isNotEmpty) ...[
                                    const SizedBox(height: 12),
                                    const Text(
                                      'Captured Proofs:',
                                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: OprinoColors.slate),
                                    ),
                                    const SizedBox(height: 6),
                                    ...proofs.map((p) => InkWell(
                                          onTap: () {
                                            showModalBottomSheet(
                                              context: context,
                                              isScrollControlled: true,
                                              backgroundColor: Colors.transparent,
                                              builder: (_) => ProofViewerSheet(proof: p),
                                            );
                                          },
                                          borderRadius: BorderRadius.circular(6),
                                          child: Container(
                                            margin: const EdgeInsets.only(bottom: 6),
                                            padding: const EdgeInsets.all(8),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFFF8FAFC),
                                              borderRadius: BorderRadius.circular(6),
                                              border: Border.all(color: OprinoColors.border),
                                            ),
                                            child: Row(
                                              children: [
                                                Icon(
                                                  p.proofType == 'SIGNATURE' ? Icons.draw : Icons.camera_alt,
                                                  size: 16,
                                                  color: p.proofType == 'SIGNATURE' ? OprinoColors.cobalt : const Color(0xFF059669),
                                                ),
                                                const SizedBox(width: 8),
                                                Expanded(
                                                  child: Text(
                                                    p.proofType == 'SIGNATURE'
                                                        ? 'Signed by: ${p.signerName ?? "Customer"}'
                                                        : 'Geotagged Photo Proof',
                                                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                                                  ),
                                                ),
                                                const Text(
                                                  'View',
                                                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: OprinoColors.cobalt),
                                                ),
                                                const SizedBox(width: 4),
                                                const Icon(Icons.chevron_right, size: 14, color: OprinoColors.cobalt),
                                              ],
                                            ),
                                          ),
                                        )),
                                  ],
                                ],
                              ),
                            ),
                          ),

                        const SizedBox(height: 16),

                        // Interactive Checklist Card
                        if (checklist.isNotEmpty)
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
                                        'Action Checklist',
                                        style: TextStyle(
                                          fontSize: 15,
                                          fontWeight: FontWeight.bold,
                                          color: OprinoColors.navy,
                                        ),
                                      ),
                                      Text(
                                        '${checklist.where((i) => i.isCompleted).length}/${checklist.length} Done',
                                        style: const TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w600,
                                          color: OprinoColors.slate,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  ...checklist.map((item) {
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
                          ),
                      ],
                    ),
                  );
                },
              );
            },
          );
        },
      ),
    );
  }
}

// ignore_for_file: deprecated_member_use
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/media_upload_service.dart';
import '../../../../core/theme/oprino_theme.dart';

class PhotoProofSheet extends ConsumerStatefulWidget {
  final String taskId;
  final String? visitId;
  final double currentLatitude;
  final double currentLongitude;
  final double accuracy;
  final Function({
    required String fileKey,
    String? localFilePath,
    required bool isBinaryUploaded,
    required String notes,
    required double latitude,
    required double longitude,
    required double accuracy,
    required DateTime timestamp,
  }) onConfirm;

  const PhotoProofSheet({
    super.key,
    required this.taskId,
    this.visitId,
    this.currentLatitude = 37.7749,
    this.currentLongitude = -122.4194,
    this.accuracy = 4.2,
    required this.onConfirm,
  });

  @override
  ConsumerState<PhotoProofSheet> createState() => _PhotoProofSheetState();
}

class _PhotoProofSheetState extends ConsumerState<PhotoProofSheet> {
  final TextEditingController _notesController = TextEditingController();
  bool _isUploading = false;
  String? _uploadError;

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _isUploading = true;
      _uploadError = null;
    });

    final mediaService = ref.read(mediaUploadServiceProvider);
    final syntheticBytes = MediaUploadService.createSyntheticJpeg();
    final now = DateTime.now();

    try {
      // 1. Try online direct binary upload to Cloudflare R2 / S3
      final uploadMeta = await mediaService.requestTaskProofUploadUrl(
        taskId: widget.taskId,
        visitId: widget.visitId,
        proofType: 'PHOTO',
        fileName: 'proof_${widget.taskId}.jpg',
        mimeType: 'image/jpeg',
        fileSizeBytes: syntheticBytes.length,
      );
      await mediaService.uploadBinaryBytes(
        uploadUrl: uploadMeta.uploadUrl,
        bytes: syntheticBytes,
        contentType: 'image/jpeg',
      );

      if (!mounted) return;
      widget.onConfirm(
        fileKey: uploadMeta.fileKey,
        localFilePath: null,
        isBinaryUploaded: true,
        notes: _notesController.text.trim(),
        latitude: widget.currentLatitude,
        longitude: widget.currentLongitude,
        accuracy: widget.accuracy,
        timestamp: now,
      );
      if (mounted) setState(() => _isUploading = false);
      if (Navigator.of(context).canPop()) {
        Navigator.of(context).pop();
      }
    } catch (_) {
      // 2. Offline Resilience: Save image locally and queue confirmation for outbox sync
      try {
        final localPath = await mediaService.savePendingImageFile(
          prefix: 'task_${widget.taskId}',
          bytes: syntheticBytes,
        );

        if (!mounted) return;
        widget.onConfirm(
          fileKey: 'pending_proof_${now.millisecondsSinceEpoch}',
          localFilePath: localPath,
          isBinaryUploaded: false,
          notes: _notesController.text.trim(),
          latitude: widget.currentLatitude,
          longitude: widget.currentLongitude,
          accuracy: widget.accuracy,
          timestamp: now,
        );
        if (mounted) setState(() => _isUploading = false);
        if (Navigator.of(context).canPop()) {
          Navigator.of(context).pop();
        }
      } catch (saveErr) {
        if (mounted) {
          setState(() {
            _isUploading = false;
            _uploadError = 'Failed to save proof offline: ${saveErr.toString()}';
          });
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();

    return Container(
      padding: EdgeInsets.only(
        top: 20,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Row(
                  children: [
                    Icon(Icons.camera_alt, color: Color(0xFF059669), size: 22),
                    SizedBox(width: 8),
                    Text(
                      'Capture Geotagged Photo Proof',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: OprinoColors.navy,
                      ),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.close, size: 20),
                  onPressed: _isUploading ? null : () => Navigator.of(context).pop(),
                ),
              ],
            ),
            const SizedBox(height: 12),

            if (_uploadError != null)
              Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF2F2),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFFFCA5A5)),
                ),
                child: Text(
                  _uploadError!,
                  style: const TextStyle(color: Color(0xFF991B1B), fontSize: 12),
                ),
              ),

            // Camera Watermarked Preview Box
            Container(
              height: 200,
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Stack(
                fit: StackFit.expand,
                children: [
                  const Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.photo_camera_back, color: Colors.white38, size: 48),
                        SizedBox(height: 8),
                        Text(
                          'Ready to capture field work evidence',
                          style: TextStyle(color: Colors.white70, fontSize: 13),
                        ),
                      ],
                    ),
                  ),

                  // Watermark Overlay
                  Positioned(
                    bottom: 0,
                    left: 0,
                    right: 0,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.75),
                        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(12)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'GPS: ${widget.currentLatitude.toStringAsFixed(5)}, ${widget.currentLongitude.toStringAsFixed(5)}',
                                style: const TextStyle(color: Colors.white, fontSize: 11, fontFamily: 'monospace', fontWeight: FontWeight.bold),
                              ),
                              Text(
                                '±${widget.accuracy}m',
                                style: const TextStyle(color: Color(0xFF34D399), fontSize: 10, fontWeight: FontWeight.w600),
                              ),
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Time: ${now.toIso8601String()}',
                            style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 10, fontFamily: 'monospace'),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            TextField(
              controller: _notesController,
              maxLines: 2,
              decoration: const InputDecoration(
                labelText: 'Work Notes / Verification Details',
                hintText: 'e.g. Compressor filter replaced and pressure verified at 45 PSI.',
                border: OutlineInputBorder(),
                isDense: true,
              ),
            ),
            const SizedBox(height: 16),

            SizedBox(
              height: 48,
              child: ElevatedButton.icon(
                onPressed: _isUploading ? null : _submit,
                icon: _isUploading
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Icon(Icons.cloud_upload, size: 18),
                label: Text(
                  _isUploading ? 'Uploading & Verifying Proof...' : 'Confirm & Save Geotagged Proof',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF059669),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

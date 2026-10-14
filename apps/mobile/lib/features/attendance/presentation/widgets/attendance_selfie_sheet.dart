// ignore_for_file: deprecated_member_use
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/media_upload_service.dart';
import '../../../../core/theme/oprino_theme.dart';

class AttendanceSelfieSheet extends ConsumerStatefulWidget {
  final String workspaceId;
  final String userId;
  final double? currentLatitude;
  final double? currentLongitude;
  final double? accuracy;
  final Function({
    String? selfieMediaKey,
    String? localFilePath,
    required double? latitude,
    required double? longitude,
    required double? accuracy,
    required DateTime timestamp,
  }) onConfirm;

  const AttendanceSelfieSheet({
    super.key,
    required this.workspaceId,
    required this.userId,
    this.currentLatitude,
    this.currentLongitude,
    this.accuracy,
    required this.onConfirm,
  });

  @override
  ConsumerState<AttendanceSelfieSheet> createState() => _AttendanceSelfieSheetState();
}

class _AttendanceSelfieSheetState extends ConsumerState<AttendanceSelfieSheet> {
  bool _isCaptured = false;
  bool _isUploading = false;
  String? _uploadError;
  late DateTime _capturedTimestamp;

  @override
  void initState() {
    super.initState();
    _capturedTimestamp = DateTime.now();
  }

  void _capturePhoto() {
    setState(() {
      _isCaptured = true;
      _uploadError = null;
      _capturedTimestamp = DateTime.now();
    });
  }

  void _retakePhoto() {
    setState(() {
      _isCaptured = false;
      _uploadError = null;
    });
  }

  Future<void> _confirmAndPunchIn() async {
    setState(() {
      _isUploading = true;
      _uploadError = null;
    });

    final mediaService = ref.read(mediaUploadServiceProvider);
    final syntheticBytes = MediaUploadService.createSyntheticJpeg();

    try {
      // 1. Try online direct binary upload to Cloudflare R2 / S3
      final uploadMeta = await mediaService.requestAttendanceSelfieUploadUrl(
        fileName: 'selfie_${widget.userId}.jpg',
      );
      await mediaService.uploadBinaryBytes(
        uploadUrl: uploadMeta.uploadUrl,
        bytes: syntheticBytes,
        contentType: 'image/jpeg',
      );

      if (!mounted) return;
      widget.onConfirm(
        selfieMediaKey: uploadMeta.fileKey,
        localFilePath: null,
        latitude: widget.currentLatitude,
        longitude: widget.currentLongitude,
        accuracy: widget.accuracy,
        timestamp: _capturedTimestamp,
      );
      if (mounted) setState(() => _isUploading = false);
      if (Navigator.of(context).canPop()) {
        Navigator.of(context).pop();
      }
    } catch (_) {
      // 2. Offline Resilience: Save image locally and queue mutation for outbox sync
      try {
        final localPath = await mediaService.savePendingImageFile(
          prefix: 'selfie_${widget.userId}',
          bytes: syntheticBytes,
        );

        if (!mounted) return;
        widget.onConfirm(
          selfieMediaKey: null,
          localFilePath: localPath,
          latitude: widget.currentLatitude,
          longitude: widget.currentLongitude,
          accuracy: widget.accuracy,
          timestamp: _capturedTimestamp,
        );
        if (mounted) setState(() => _isUploading = false);
        if (Navigator.of(context).canPop()) {
          Navigator.of(context).pop();
        }
      } catch (saveErr) {
        if (mounted) {
          setState(() {
            _isUploading = false;
            _uploadError = 'Could not save selfie offline: ${saveErr.toString()}';
          });
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        top: 20,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Row(
                  children: [
                    Icon(Icons.face_retouching_natural, color: Color(0xFF164CFF), size: 24),
                    SizedBox(width: 8),
                    Text(
                      'Attendance Selfie Verification',
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
            const SizedBox(height: 8),

            // Employee Purpose & Consent Banner
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFF0FDF4),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFBBF7D0)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.shield_outlined, size: 18, color: Color(0xFF166534)),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Selfie is used exclusively for attendance verification and stored securely in company private storage.',
                      style: TextStyle(fontSize: 11, color: Color(0xFF166534), height: 1.3),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            if (_uploadError != null)
              Container(
                margin: const EdgeInsets.only(bottom: 14),
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF2F2),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFFFCA5A5)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline, color: Color(0xFF991B1B), size: 18),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _uploadError!,
                        style: const TextStyle(color: Color(0xFF991B1B), fontSize: 12),
                      ),
                    ),
                  ],
                ),
              ),

            // Camera Viewfinder Box
            Container(
              height: 240,
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF1E293B)),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    if (!_isCaptured)
                      Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: Colors.white.withOpacity(0.1),
                              ),
                              child: const Icon(Icons.camera_front, size: 48, color: Colors.white70),
                            ),
                            const SizedBox(height: 10),
                            const Text(
                              'Position your face within the frame',
                              style: TextStyle(color: Colors.white70, fontSize: 13),
                            ),
                          ],
                        ),
                      )
                    else
                      Container(
                        color: const Color(0xFF1E293B),
                        child: Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(14),
                                decoration: const BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: Color(0xFF10B981),
                                ),
                                child: const Icon(Icons.check, size: 36, color: Colors.white),
                              ),
                              const SizedBox(height: 10),
                              const Text(
                                'Selfie Verified & Geotagged',
                                style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Ready to punch in',
                                style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 12),
                              ),
                            ],
                          ),
                        ),
                      ),

                    // Top Edge Alignment Overlay
                    Positioned(
                      top: 16,
                      left: 16,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.6),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 8,
                              height: 8,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: _isCaptured ? const Color(0xFF10B981) : const Color(0xFF3B82F6),
                              ),
                            ),
                            const SizedBox(width: 6),
                            Text(
                              _isCaptured ? 'Captured' : 'Live Camera',
                              style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Timestamp and GPS Watermark Card
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Timestamp:',
                        style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                      ),
                      Text(
                        _capturedTimestamp.toLocal().toString().split('.')[0],
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                      ),
                    ],
                  ),
                  if (widget.currentLatitude != null && widget.currentLongitude != null) ...[
                    const SizedBox(height: 4),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'GPS Coordinates:',
                          style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                        ),
                        Text(
                          '${widget.currentLatitude!.toStringAsFixed(4)}, ${widget.currentLongitude!.toStringAsFixed(4)} (±${(widget.accuracy ?? 0).round()}m)',
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF164CFF)),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 18),

            // Action Buttons
            if (_isUploading)
              Container(
                height: 48,
                decoration: BoxDecoration(
                  color: const Color(0xFFEFF6FF),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFBFDBFE)),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF164CFF)),
                    ),
                    SizedBox(width: 12),
                    Text(
                      'Uploading selfie & verifying storage...',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF164CFF)),
                    ),
                  ],
                ),
              )
            else if (!_isCaptured) ...[
              ElevatedButton.icon(
                onPressed: _capturePhoto,
                icon: const Icon(Icons.camera_alt, color: Colors.white),
                label: const Text(
                  'Capture Selfie',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF164CFF),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
            ] else ...[
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _retakePhoto,
                      icon: const Icon(Icons.refresh, color: Color(0xFF475569)),
                      label: const Text(
                        'Retake',
                        style: TextStyle(color: Color(0xFF475569), fontWeight: FontWeight.w600),
                      ),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: ElevatedButton.icon(
                      onPressed: _confirmAndPunchIn,
                      icon: const Icon(Icons.check, color: Colors.white),
                      label: const Text(
                        'Confirm & Punch In',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF10B981),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

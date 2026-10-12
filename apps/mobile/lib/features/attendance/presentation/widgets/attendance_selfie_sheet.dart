import 'package:flutter/material.dart';
import '../../../../core/theme/oprino_theme.dart';

class AttendanceSelfieSheet extends StatefulWidget {
  final String workspaceId;
  final String userId;
  final double? currentLatitude;
  final double? currentLongitude;
  final double? accuracy;
  final Function({
    required String selfieMediaKey,
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
  State<AttendanceSelfieSheet> createState() => _AttendanceSelfieSheetState();
}

class _AttendanceSelfieSheetState extends State<AttendanceSelfieSheet> {
  bool _isCaptured = false;
  late DateTime _capturedTimestamp;

  @override
  void initState() {
    super.initState();
    _capturedTimestamp = DateTime.now();
  }

  void _capturePhoto() {
    setState(() {
      _isCaptured = true;
      _capturedTimestamp = DateTime.now();
    });
  }

  void _retakePhoto() {
    setState(() {
      _isCaptured = false;
    });
  }

  void _confirmAndPunchIn() {
    final ts = _capturedTimestamp.millisecondsSinceEpoch;
    final fileKey = '${widget.workspaceId}/attendance/selfies/${widget.userId}_$ts.jpg';

    widget.onConfirm(
      selfieMediaKey: fileKey,
      latitude: widget.currentLatitude,
      longitude: widget.currentLongitude,
      accuracy: widget.accuracy,
      timestamp: _capturedTimestamp,
    );
    Navigator.of(context).pop();
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
                  onPressed: () => Navigator.of(context).pop(),
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
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.info_outline, size: 16, color: Color(0xFF16A34A)),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Visual duty verification under your company policy. Automated facial recognition or biometric matching is not conducted.',
                      style: TextStyle(fontSize: 11, color: Color(0xFF166534), height: 1.3),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Viewfinder / Captured Preview Frame
            Center(
              child: Container(
                width: 220,
                height: 220,
                decoration: BoxDecoration(
                  color: Colors.grey.shade900,
                  borderRadius: BorderRadius.circular(110),
                  border: Border.all(
                    color: _isCaptured ? const Color(0xFF10B981) : const Color(0xFF164CFF),
                    width: 4,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: (_isCaptured ? const Color(0xFF10B981) : const Color(0xFF164CFF))
                          .withOpacity(0.2),
                      blurRadius: 12,
                      spreadRadius: 2,
                    ),
                  ],
                ),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    if (!_isCaptured) ...[
                      Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.person, size: 84, color: Colors.white.withOpacity(0.4)),
                          const SizedBox(height: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.black.withOpacity(0.6),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Text(
                              'Front Camera View',
                              style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                            ),
                          ),
                        ],
                      ),
                    ] else ...[
                      Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.check_circle, size: 64, color: Color(0xFF10B981)),
                          const SizedBox(height: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.black.withOpacity(0.6),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Text(
                              'Photo Captured',
                              style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ),
                    ],
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
            if (!_isCaptured) ...[
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

import 'package:flutter/material.dart';
import '../../../../core/theme/oprino_theme.dart';

class PhotoProofSheet extends StatefulWidget {
  final String taskId;
  final String? visitId;
  final double currentLatitude;
  final double currentLongitude;
  final double accuracy;
  final Function({
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
  State<PhotoProofSheet> createState() => _PhotoProofSheetState();
}

class _PhotoProofSheetState extends State<PhotoProofSheet> {
  final TextEditingController _notesController = TextEditingController();

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  void _submit() {
    widget.onConfirm(
      notes: _notesController.text.trim(),
      latitude: widget.currentLatitude,
      longitude: widget.currentLongitude,
      accuracy: widget.accuracy,
      timestamp: DateTime.now(),
    );
    Navigator.of(context).pop();
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
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Camera Watermarked Preview Box
            Container(
              height: 200,
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: OprinoColors.border),
              ),
              child: Stack(
                fit: StackFit.expand,
                children: [
                  const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.photo_camera_back, size: 48, color: Color(0xFF475569)),
                        SizedBox(height: 8),
                        Text(
                          'High-Resolution Geotagged Proof',
                          style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13, fontWeight: FontWeight.w500),
                        ),
                      ],
                    ),
                  ),

                  // Watermark Overlay Banner (GPS + Timestamp)
                  Positioned(
                    bottom: 8,
                    left: 8,
                    right: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.75),
                        borderRadius: BorderRadius.circular(6),
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
                onPressed: _submit,
                icon: const Icon(Icons.cloud_upload, size: 18),
                label: const Text('Confirm & Save Geotagged Proof', style: TextStyle(fontWeight: FontWeight.bold)),
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

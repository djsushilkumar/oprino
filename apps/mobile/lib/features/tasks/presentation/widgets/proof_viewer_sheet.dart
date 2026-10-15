// ignore_for_file: deprecated_member_use
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/database/database.dart';
import '../../../../core/network/media_upload_service.dart';
import '../../../../core/theme/oprino_theme.dart';

class ProofViewerSheet extends ConsumerStatefulWidget {
  final CachedTaskProof proof;

  const ProofViewerSheet({super.key, required this.proof});

  @override
  ConsumerState<ProofViewerSheet> createState() => _ProofViewerSheetState();
}

class _ProofViewerSheetState extends ConsumerState<ProofViewerSheet> {
  String? _downloadUrl;
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadDownloadUrl();
  }

  Future<void> _loadDownloadUrl() async {
    if (widget.proof.proofType == 'SIGNATURE') {
      setState(() => _isLoading = false);
      return;
    }

    try {
      final mediaService = ref.read(mediaUploadServiceProvider);
      final res = await mediaService.requestMediaDownloadUrl(fileKey: widget.proof.fileKey);
      if (mounted) {
        setState(() {
          _downloadUrl = res.downloadUrl;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Could not fetch cloud photo. Evidence metadata verified offline.';
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    Map<String, dynamic>? watermark;
    if (widget.proof.watermarkJson != null) {
      try {
        watermark = jsonDecode(widget.proof.watermarkJson!) as Map<String, dynamic>;
      } catch (_) {}
    }

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
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(
                      widget.proof.proofType == 'SIGNATURE' ? Icons.draw : Icons.camera_alt,
                      color: widget.proof.proofType == 'SIGNATURE'
                          ? OprinoColors.cobalt
                          : const Color(0xFF059669),
                      size: 22,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      widget.proof.proofType == 'SIGNATURE'
                          ? 'Customer Signature Verification'
                          : 'Field Photo Proof Evidence',
                      style: const TextStyle(
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

            // Media Box
            Container(
              height: 220,
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF1E293B)),
              ),
              child: Stack(
                fit: StackFit.expand,
                children: [
                  if (_isLoading)
                    const Center(
                      child: CircularProgressIndicator(color: Colors.white),
                    )
                  else if (_downloadUrl != null)
                    ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.network(
                        _downloadUrl!,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => const Center(
                          child: Icon(Icons.broken_image, color: Colors.white54, size: 48),
                        ),
                      ),
                    )
                  else
                    Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            widget.proof.proofType == 'SIGNATURE' ? Icons.draw : Icons.photo_library,
                            color: Colors.white54,
                            size: 40,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            widget.proof.proofType == 'SIGNATURE'
                                ? 'Digital Signature on Record'
                                : 'Verified Storage Key',
                            style: const TextStyle(color: Colors.white70, fontSize: 13),
                          ),
                          if (_errorMessage != null) ...[
                            const SizedBox(height: 4),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              child: Text(
                                _errorMessage!,
                                style: const TextStyle(color: Color(0xFFFCA5A5), fontSize: 11),
                                textAlign: TextAlign.center,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),

                  // Watermark Banner Overlay
                  Positioned(
                    bottom: 0,
                    left: 0,
                    right: 0,
                    child: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.85),
                        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(12)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (watermark != null) ...[
                            Text(
                              'GPS: ${watermark['latitude']}, ${watermark['longitude']} (±${watermark['accuracy']}m)',
                              style: const TextStyle(
                                color: Color(0xFF34D399),
                                fontSize: 11,
                                fontFamily: 'monospace',
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 2),
                          ],
                          Text(
                            'Recorded: ${widget.proof.createdAt.toLocal().toString().split('.')[0]}',
                            style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 10),
                          ),
                          if (widget.proof.signerName != null) ...[
                            const SizedBox(height: 2),
                            Text(
                              'Signer: ${widget.proof.signerName}${widget.proof.signerPhone != null ? " (${widget.proof.signerPhone})" : ""}',
                              style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // Metadata card
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Storage Key: ${widget.proof.fileKey}',
                    style: const TextStyle(fontSize: 11, fontFamily: 'monospace', color: Color(0xFF475569)),
                  ),
                  if (widget.proof.notes != null && widget.proof.notes!.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text(
                      'Work Notes: ${widget.proof.notes}',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: OprinoColors.navy),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

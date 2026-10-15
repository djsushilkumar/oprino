import 'dart:typed_data';
import 'package:flutter/material.dart';
import '../../../../core/theme/oprino_theme.dart';
import '../../../../core/utils/signature_rasterizer.dart';

class CustomerSignatureSheet extends StatefulWidget {
  final String taskId;
  final String? visitId;
  final Function({
    required String signerName,
    String? signerPhone,
    required List<List<Offset>> strokes,
    Uint8List? signaturePngBytes,
  }) onConfirm;

  const CustomerSignatureSheet({
    super.key,
    required this.taskId,
    this.visitId,
    required this.onConfirm,
  });

  @override
  State<CustomerSignatureSheet> createState() => _CustomerSignatureSheetState();
}

class _CustomerSignatureSheetState extends State<CustomerSignatureSheet> {
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final List<List<Offset>> _strokes = [];
  List<Offset> _currentStroke = [];
  String? _error;

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  void _clearCanvas() {
    setState(() {
      _strokes.clear();
      _currentStroke.clear();
      _error = null;
    });
  }

  void _submit() async {
    final name = _nameController.text.trim();
    if (name.isEmpty) {
      setState(() => _error = 'Please enter customer signer name.');
      return;
    }
    if (_strokes.isEmpty) {
      setState(() => _error = 'Please provide on-glass customer signature.');
      return;
    }

    try {
      final pngBytes = await SignatureRasterizer.renderStrokesToPng(
        strokes: _strokes,
        width: 400,
        height: 200,
      );

      widget.onConfirm(
        signerName: name,
        signerPhone: _phoneController.text.trim().isNotEmpty ? _phoneController.text.trim() : null,
        strokes: _strokes,
        signaturePngBytes: pngBytes,
      );
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      if (mounted) {
        setState(() => _error = 'Failed to rasterize signature: ${e.toString()}');
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
                    Icon(Icons.draw, color: OprinoColors.cobalt, size: 22),
                    SizedBox(width: 8),
                    Text(
                      'Customer On-Glass Signature',
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
            if (_error != null)
              Container(
                margin: const EdgeInsets.only(bottom: 12),
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
            TextField(
              controller: _nameController,
              decoration: const InputDecoration(
                labelText: 'Signer Name *',
                hintText: 'e.g. Alice Henderson',
                prefixIcon: Icon(Icons.person, size: 18),
                border: OutlineInputBorder(),
                isDense: true,
              ),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _phoneController,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(
                labelText: 'Signer Phone (Optional)',
                hintText: '+1-555-0199',
                prefixIcon: Icon(Icons.phone, size: 18),
                border: OutlineInputBorder(),
                isDense: true,
              ),
            ),
            const SizedBox(height: 14),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Sign inside box below:',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: OprinoColors.slate),
                ),
                TextButton.icon(
                  onPressed: _clearCanvas,
                  icon: const Icon(Icons.refresh, size: 14),
                  label: const Text('Clear', style: TextStyle(fontSize: 12)),
                  style: TextButton.styleFrom(
                    foregroundColor: const Color(0xFFDC2626),
                    padding: EdgeInsets.zero,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Container(
              height: 180,
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: OprinoColors.border, width: 1.5),
              ),
              child: Listener(
                key: const Key('signature_canvas'),
                behavior: HitTestBehavior.opaque,
                onPointerDown: (event) {
                  setState(() {
                    _currentStroke = [event.localPosition];
                    _strokes.add(_currentStroke);
                  });
                },
                onPointerMove: (event) {
                  setState(() {
                    _currentStroke.add(event.localPosition);
                  });
                },
                child: CustomPaint(
                  painter: _SignaturePainter(strokes: _strokes),
                  size: Size.infinite,
                ),
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 48,
              child: ElevatedButton.icon(
                onPressed: _submit,
                icon: const Icon(Icons.check, size: 18),
                label: const Text('Confirm & Save Signature', style: TextStyle(fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: OprinoColors.cobalt,
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

class _SignaturePainter extends CustomPainter {
  final List<List<Offset>> strokes;

  _SignaturePainter({required this.strokes});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF1E293B)
      ..strokeCap = StrokeCap.round
      ..strokeWidth = 3.0;

    for (final stroke in strokes) {
      for (int i = 0; i < stroke.length - 1; i++) {
        canvas.drawLine(stroke[i], stroke[i + 1], paint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant _SignaturePainter oldDelegate) => true;
}

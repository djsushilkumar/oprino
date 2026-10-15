import 'dart:typed_data';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';

class WatermarkService {
  /// Burns a permanent, tamper-resistant watermark banner directly onto the image bitmap.
  /// Converts the composite canvas into an immutable PNG raster image.
  static Future<Uint8List> burnWatermark({
    required Uint8List imageBytes,
    required String timestampText,
    String? gpsCoordinatesText,
    String? taskIdText,
    String? workerNameText,
  }) async {
    final codec = await ui.instantiateImageCodec(imageBytes);
    final frame = await codec.getNextFrame();
    final originalImage = frame.image;

    // If original image is tiny (e.g. synthetic test fixtures), upscale canvas to minimum legible dimensions
    final width = originalImage.width < 320 ? 320.0 : originalImage.width.toDouble();
    final height = originalImage.height < 240 ? 240.0 : originalImage.height.toDouble();

    final recorder = ui.PictureRecorder();
    final canvas = Canvas(recorder, Rect.fromLTWH(0, 0, width, height));

    // 1. Draw original photo onto canvas (scale if necessary)
    final srcRect = Rect.fromLTWH(0, 0, originalImage.width.toDouble(), originalImage.height.toDouble());
    final dstRect = Rect.fromLTWH(0, 0, width, height);
    canvas.drawImageRect(originalImage, srcRect, dstRect, Paint());

    // 2. Compute proportional banner dimensions
    final bannerHeight = (height * 0.20).clamp(48.0, 140.0);
    final bannerRect = Rect.fromLTWH(0, height - bannerHeight, width, bannerHeight);

    // 3. Draw high-contrast translucent banner background
    final bannerPaint = Paint()..color = const Color(0xDD0F172A); // Deep navy translucent
    canvas.drawRect(bannerRect, bannerPaint);

    // 4. Accent line
    final accentPaint = Paint()..color = const Color(0xFF10B981); // Emerald accent
    canvas.drawRect(Rect.fromLTWH(0, height - bannerHeight, width, 3), accentPaint);

    // 5. Build watermark text string
    final textLines = <String>[];
    if (gpsCoordinatesText != null && gpsCoordinatesText.isNotEmpty) {
      textLines.add('GPS: $gpsCoordinatesText');
    }
    textLines.add('Time: $timestampText');
    if (taskIdText != null && taskIdText.isNotEmpty) {
      final worker = (workerNameText != null && workerNameText.isNotEmpty) ? ' | User: $workerNameText' : '';
      textLines.add('Task: $taskIdText$worker');
    }

    final fontSize = (bannerHeight * 0.18).clamp(9.0, 20.0);
    final textPainter = TextPainter(
      text: TextSpan(
        text: textLines.join('\n'),
        style: TextStyle(
          color: Colors.white,
          fontSize: fontSize,
          fontWeight: FontWeight.w600,
          fontFamily: 'monospace',
          height: 1.25,
        ),
      ),
      textDirection: TextDirection.ltr,
      maxLines: 4,
    );

    final maxTextWidth = (width - 16.0).clamp(100.0, double.infinity);
    textPainter.layout(maxWidth: maxTextWidth);
    textPainter.paint(canvas, Offset(8, height - bannerHeight + 6));

    final picture = recorder.endRecording();
    final watermarkedImage = await picture.toImage(width.toInt(), height.toInt());
    final byteData = await watermarkedImage.toByteData(format: ui.ImageByteFormat.png);

    if (byteData == null) {
      throw Exception('Failed to encode watermarked image bitmap');
    }

    return byteData.buffer.asUint8List();
  }
}

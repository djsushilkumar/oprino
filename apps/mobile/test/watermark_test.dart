import 'package:flutter_test/flutter_test.dart';
import 'package:oprino_mobile/core/network/media_upload_service.dart';
import 'package:oprino_mobile/core/utils/signature_rasterizer.dart';
import 'package:oprino_mobile/core/utils/watermark_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('WatermarkService Unit Tests', () {
    test('burns permanent raster watermark onto image bytes', () async {
      final baseJpeg = MediaUploadService.createSyntheticJpeg();

      final watermarkedBytes = await WatermarkService.burnWatermark(
        imageBytes: baseJpeg,
        timestampText: '2026-10-15T18:30:00Z',
        gpsCoordinatesText: '37.77492, -122.41941 (±3.5m)',
        taskIdText: 'task-101',
        workerNameText: 'Alex Johnson',
      );

      expect(watermarkedBytes, isNotEmpty);
      expect(SignatureRasterizer.isValidPng(watermarkedBytes), isTrue);
      // Verify byte output is different and larger than the original 1x1 image due to added canvas banner
      expect(watermarkedBytes.length, greaterThan(baseJpeg.length));
    });
  });
}

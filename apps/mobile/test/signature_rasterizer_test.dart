import 'package:flutter_test/flutter_test.dart';
import 'package:oprino_mobile/core/utils/signature_rasterizer.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('SignatureRasterizer Unit Tests', () {
    test('renders strokes into valid PNG binary buffer', () async {
      final strokes = [
        [const Offset(10, 10), const Offset(50, 50), const Offset(100, 20)],
        [const Offset(120, 30), const Offset(180, 90)],
      ];

      final pngBytes = await SignatureRasterizer.renderStrokesToPng(
        strokes: strokes,
        width: 300,
        height: 150,
      );

      expect(pngBytes, isNotEmpty);
      expect(SignatureRasterizer.isValidPng(pngBytes), isTrue);
      // Valid PNG header checks
      expect(pngBytes[0], equals(0x89));
      expect(pngBytes[1], equals(0x50)); // 'P'
      expect(pngBytes[2], equals(0x4E)); // 'N'
      expect(pngBytes[3], equals(0x47)); // 'G'
    });

    test('validates negative/corrupt PNG bytes correctly', () {
      expect(SignatureRasterizer.isValidPng([]), isFalse);
      expect(SignatureRasterizer.isValidPng([1, 2, 3]), isFalse);
      expect(SignatureRasterizer.isValidPng([0xFF, 0xD8, 0xFF, 0xE0]), isFalse); // JPEG, not PNG
      expect(SignatureRasterizer.isValidPng(List.filled(200, 0x00)), isFalse);
    });
  });
}

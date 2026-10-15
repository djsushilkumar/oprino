import 'dart:typed_data';
import 'package:flutter_test/flutter_test.dart';
import 'package:oprino_mobile/core/network/media_upload_service.dart';
import 'package:oprino_mobile/core/utils/media_validator.dart';
import 'package:oprino_mobile/core/utils/signature_rasterizer.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('MediaValidator Unit Tests', () {
    test('positive: successfully validates authentic JPEG fixture', () async {
      final jpegBytes = MediaUploadService.createSyntheticJpeg();

      final result = await MediaValidator.validateImageBytes(jpegBytes);
      expect(result.isValid, isTrue);
      expect(result.mimeType, equals('image/jpeg'));
      expect(result.width, greaterThan(0));
      expect(result.height, greaterThan(0));
      expect(result.error, isNull);
    });

    test('positive: successfully validates authentic PNG fixture', () async {
      final pngBytes = await SignatureRasterizer.renderStrokesToPng(
        strokes: [
          [const Offset(10, 10), const Offset(40, 40)],
        ],
        width: 100,
        height: 60,
      );

      final result = await MediaValidator.validateImageBytes(pngBytes);
      expect(result.isValid, isTrue);
      expect(result.mimeType, equals('image/png'));
      expect(result.width, equals(100));
      expect(result.height, equals(60));
      expect(result.error, isNull);
    });

    test('negative: rejects empty byte buffer', () async {
      final result = await MediaValidator.validateImageBytes([]);
      expect(result.isValid, isFalse);
      expect(result.error, contains('empty (0 bytes)'));
    });

    test('negative: rejects truncated byte buffer under minimum header size', () async {
      final result = await MediaValidator.validateImageBytes([0xFF, 0xD8]);
      expect(result.isValid, isFalse);
      expect(result.error, contains('corrupted or incomplete'));
    });

    test('negative: rejects arbitrary non-image payload exceeding 100 bytes', () async {
      // Previously, "if (!isJpeg && bytes.length < 100)" would allow this to pass!
      final fakePayload = Uint8List.fromList(List.filled(256, 0x41)); // 256 bytes of 'A'

      final result = await MediaValidator.validateImageBytes(fakePayload);
      expect(result.isValid, isFalse);
      expect(result.error, contains('Corrupted or unsupported image format'));
    });

    test('negative: rejects fake magic bytes with corrupted pixel payload', () async {
      // Starts with JPEG magic bytes [0xFF, 0xD8, 0xFF, 0xE0] but rest is garbage
      final corruptedPayload = Uint8List.fromList([
        0xFF, 0xD8, 0xFF, 0xE0,
        ...List.filled(200, 0x00),
      ]);

      final result = await MediaValidator.validateImageBytes(corruptedPayload);
      expect(result.isValid, isFalse);
      expect(result.error, contains('unable to decode bitmap pixels'));
    });

    test('negative: rejects oversized byte buffer (>10MB)', () async {
      final oversizedBytes = Uint8List(10 * 1024 * 1024 + 1);
      final result = await MediaValidator.validateImageBytes(oversizedBytes);
      expect(result.isValid, isFalse);
      expect(result.error, contains('exceeds maximum allowed limit of 10 MB'));
    });
  });
}

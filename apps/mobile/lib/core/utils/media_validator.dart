import 'dart:typed_data';
import 'dart:ui' as ui;

class ImageValidationResult {
  final bool isValid;
  final String? error;
  final String? mimeType;
  final int width;
  final int height;

  const ImageValidationResult({
    required this.isValid,
    this.error,
    this.mimeType,
    this.width = 0,
    this.height = 0,
  });

  factory ImageValidationResult.success({
    required String mimeType,
    required int width,
    required int height,
  }) {
    return ImageValidationResult(
      isValid: true,
      mimeType: mimeType,
      width: width,
      height: height,
    );
  }

  factory ImageValidationResult.failure(String error) {
    return ImageValidationResult(
      isValid: false,
      error: error,
    );
  }
}

class MediaValidator {
  static const int maxFileSizeBytes = 10 * 1024 * 1024; // 10 MB
  static const int minFileSizeBytes = 32; // Smallest valid header

  /// Determines MIME type from file header magic bytes
  static String? detectMimeType(List<int> bytes) {
    if (bytes.length < 3) return null;

    // JPEG: 0xFF, 0xD8, 0xFF
    if (bytes[0] == 0xFF && bytes[1] == 0xD8 && bytes[2] == 0xFF) {
      return 'image/jpeg';
    }

    // PNG: 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
    if (bytes.length >= 8 &&
        bytes[0] == 0x89 &&
        bytes[1] == 0x50 &&
        bytes[2] == 0x4E &&
        bytes[3] == 0x47 &&
        bytes[4] == 0x0D &&
        bytes[5] == 0x0A &&
        bytes[6] == 0x1A &&
        bytes[7] == 0x0A) {
      return 'image/png';
    }

    // WebP: RIFF....WEBP
    if (bytes.length >= 12 &&
        bytes[0] == 0x52 && // R
        bytes[1] == 0x49 && // I
        bytes[2] == 0x46 && // F
        bytes[3] == 0x46 && // F
        bytes[8] == 0x57 && // W
        bytes[9] == 0x45 && // E
        bytes[10] == 0x42 && // B
        bytes[11] == 0x50) { // P
      return 'image/webp';
    }

    return null;
  }

  /// Synchronous fast magic bytes validation
  static bool hasValidImageHeader(List<int> bytes) {
    return detectMimeType(bytes) != null;
  }

  /// Full deep validation: file size, supported MIME format, decoding, and positive dimensions.
  static Future<ImageValidationResult> validateImageBytes(List<int> bytes) async {
    if (bytes.isEmpty) {
      return ImageValidationResult.failure('Captured photo is empty (0 bytes).');
    }

    if (bytes.length < minFileSizeBytes) {
      return ImageValidationResult.failure(
        'Captured image is corrupted or incomplete (${bytes.length} bytes).',
      );
    }

    if (bytes.length > maxFileSizeBytes) {
      return ImageValidationResult.failure(
        'Captured image exceeds maximum allowed limit of 10 MB.',
      );
    }

    final mimeType = detectMimeType(bytes);
    if (mimeType == null) {
      return ImageValidationResult.failure(
        'Corrupted or unsupported image format. Only authentic JPEG, PNG, and WebP images are allowed.',
      );
    }

    // Deep decode verification using native graphics engine
    try {
      final uint8 = bytes is Uint8List ? bytes : Uint8List.fromList(bytes);
      final codec = await ui.instantiateImageCodec(uint8);
      final frame = await codec.getNextFrame();
      final img = frame.image;

      if (img.width <= 0 || img.height <= 0) {
        return ImageValidationResult.failure('Image decoding produced invalid dimensions (0x0).');
      }

      return ImageValidationResult.success(
        mimeType: mimeType,
        width: img.width,
        height: img.height,
      );
    } catch (e) {
      return ImageValidationResult.failure(
        'Corrupted image data: unable to decode bitmap pixels (${e.toString()}).',
      );
    }
  }
}

import 'dart:io';
import 'dart:typed_data';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:oprino_api/oprino_api.dart';
import 'package:path_provider/path_provider.dart';
import '../storage/secure_storage_service.dart';
import 'api_client_provider.dart';

final mediaUploadServiceProvider = Provider<MediaUploadService>((ref) {
  final client = ref.watch(apiClientProvider);
  return MediaUploadService(client: client);
});

class MediaUploadService {
  final OprinoApiClient client;
  final Dio _rawUploadDio;
  final Directory? baseDirectory;

  MediaUploadService({
    required this.client,
    Dio? rawUploadDio,
    this.baseDirectory,
  }) : _rawUploadDio = rawUploadDio ?? Dio(BaseOptions(
          connectTimeout: const Duration(seconds: 30),
          receiveTimeout: const Duration(seconds: 30),
          sendTimeout: const Duration(seconds: 60),
        ));

  /// Requests authorized presigned upload URL for employee attendance selfie verification (ADR-012, BLK-004)
  Future<MediaUploadUrlResponse> requestAttendanceSelfieUploadUrl({
    String fileName = 'selfie.jpg',
  }) async {
    return await client.requestAttendanceSelfieUploadUrl(fileName: fileName);
  }

  /// Requests authorized presigned upload URL for task or visit proof of work
  Future<MediaUploadUrlResponse> requestTaskProofUploadUrl({
    required String taskId,
    String? visitId,
    required String proofType,
    required String fileName,
    String mimeType = 'image/jpeg',
    int? fileSizeBytes,
  }) async {
    return await client.requestMediaUploadUrl(
      taskId: taskId,
      visitId: visitId,
      proofType: proofType,
      fileName: fileName,
      mimeType: mimeType,
      fileSizeBytes: fileSizeBytes,
    );
  }

  /// Direct binary upload of media bytes to storage via HTTP PUT.
  /// Bypasses ambient authorization headers so S3/R2 SigV4 signatures remain intact.
  Future<void> uploadBinaryBytes({
    required String uploadUrl,
    required List<int> bytes,
    String contentType = 'image/jpeg',
  }) async {
    final response = await _rawUploadDio.put(
      uploadUrl,
      data: Stream.fromIterable([Uint8List.fromList(bytes)]),
      options: Options(
        headers: {
          'Content-Type': contentType,
          'Content-Length': bytes.length.toString(),
        },
      ),
    );

    if (response.statusCode != null && (response.statusCode! < 200 || response.statusCode! >= 300)) {
      throw Exception('Direct binary upload failed with status ${response.statusCode}');
    }
  }

  /// Requests short-lived 15-minute presigned download URL for manager inspection
  Future<MediaDownloadUrlResponse> requestMediaDownloadUrl({
    required String fileKey,
  }) async {
    return await client.requestMediaDownloadUrl(fileKey: fileKey);
  }

  /// Durably saves pending image to local private app storage for offline resilient sync
  Future<String> savePendingImageFile({
    required String prefix,
    required List<int> bytes,
  }) async {
    Directory dir;
    if (baseDirectory != null) {
      dir = baseDirectory!;
    } else {
      try {
        dir = await getApplicationDocumentsDirectory();
      } catch (_) {
        dir = Directory.systemTemp;
      }
    }
    final mediaDir = Directory('${dir.path}/pending_media');
    if (!await mediaDir.exists()) {
      await mediaDir.create(recursive: true);
    }

    final id = SecureStorageService.generateUuidV4().substring(0, 8);
    final fileName = '${prefix}_${DateTime.now().millisecondsSinceEpoch}_$id.jpg';
    final filePath = '${mediaDir.path}/$fileName';

    final file = File(filePath);
    await file.writeAsBytes(bytes, flush: true);
    return filePath;
  }

  /// Safely deletes local media file after confirmed server delivery to protect employee privacy
  Future<void> deleteLocalMediaFile(String? filePath) async {
    if (filePath == null || filePath.isEmpty) return;
    try {
      final file = File(filePath);
      if (await file.exists()) {
        await file.delete();
      }
    } catch (_) {
      // Best effort cleanup: ignore filesystem permission anomalies
    }
  }

  /// Creates a valid synthetic 1x1 JPEG binary buffer for tests and fallback
  static Uint8List createSyntheticJpeg() {
    return Uint8List.fromList([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
      0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
      0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
      0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20, 0x24, 0x2E, 0x27, 0x20,
      0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29, 0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27,
      0x39, 0x3D, 0x38, 0x32, 0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
      0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
      0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04,
      0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F,
      0x00, 0xBF, 0x80, 0xFF, 0xD9,
    ]);
  }
}

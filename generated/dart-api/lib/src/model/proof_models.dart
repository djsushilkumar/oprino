// GENERATED CODE - DO NOT MODIFY BY HAND
// Generated from OpenAPI 3.1 specification by @oprino/contracts

class TaskProof {
  final String id;
  final String workspaceId;
  final String taskId;
  final String? visitId;
  final String userId;
  final String? userName;
  final String proofType;
  final String fileKey;
  final String? fileUrl;
  final int? fileSizeBytes;
  final String? mimeType;
  final String? signerName;
  final String? signerPhone;
  final Map<String, dynamic>? watermarkMetadata;
  final String? notes;
  final DateTime createdAt;

  const TaskProof({
    required this.id,
    required this.workspaceId,
    required this.taskId,
    this.visitId,
    required this.userId,
    this.userName,
    required this.proofType,
    required this.fileKey,
    this.fileUrl,
    this.fileSizeBytes,
    this.mimeType,
    this.signerName,
    this.signerPhone,
    this.watermarkMetadata,
    this.notes,
    required this.createdAt,
  });

  factory TaskProof.fromJson(Map<String, dynamic> json) {
    return TaskProof(
      id: json['id'] as String,
      workspaceId: json['workspaceId'] as String,
      taskId: json['taskId'] as String,
      visitId: json['visitId'] as String?,
      userId: json['userId'] as String,
      userName: json['userName'] as String?,
      proofType: json['proofType'] as String,
      fileKey: json['fileKey'] as String,
      fileUrl: json['fileUrl'] as String?,
      fileSizeBytes: json['fileSizeBytes'] as int?,
      mimeType: json['mimeType'] as String?,
      signerName: json['signerName'] as String?,
      signerPhone: json['signerPhone'] as String?,
      watermarkMetadata: json['watermarkMetadata'] as Map<String, dynamic>?,
      notes: json['notes'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'workspaceId': workspaceId,
        'taskId': taskId,
        if (visitId != null) 'visitId': visitId,
        'userId': userId,
        if (userName != null) 'userName': userName,
        'proofType': proofType,
        'fileKey': fileKey,
        if (fileUrl != null) 'fileUrl': fileUrl,
        if (fileSizeBytes != null) 'fileSizeBytes': fileSizeBytes,
        if (mimeType != null) 'mimeType': mimeType,
        if (signerName != null) 'signerName': signerName,
        if (signerPhone != null) 'signerPhone': signerPhone,
        if (watermarkMetadata != null) 'watermarkMetadata': watermarkMetadata,
        if (notes != null) 'notes': notes,
        'createdAt': createdAt.toIso8601String(),
      };
}

class MediaUploadUrlResponse {
  final String uploadUrl;
  final String fileKey;
  final int expiresInSeconds;

  const MediaUploadUrlResponse({
    required this.uploadUrl,
    required this.fileKey,
    required this.expiresInSeconds,
  });

  factory MediaUploadUrlResponse.fromJson(Map<String, dynamic> json) {
    return MediaUploadUrlResponse(
      uploadUrl: json['uploadUrl'] as String,
      fileKey: json['fileKey'] as String,
      expiresInSeconds: json['expiresInSeconds'] as int? ?? 600,
    );
  }

  Map<String, dynamic> toJson() => {
        'uploadUrl': uploadUrl,
        'fileKey': fileKey,
        'expiresInSeconds': expiresInSeconds,
      };
}

class ListTaskProofsResponse {
  final List<TaskProof> proofs;

  const ListTaskProofsResponse({required this.proofs});

  factory ListTaskProofsResponse.fromJson(Map<String, dynamic> json) {
    return ListTaskProofsResponse(
      proofs: (json['proofs'] as List<dynamic>)
          .map((e) => TaskProof.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() => {
        'proofs': proofs.map((p) => p.toJson()).toList(),
      };
}

class MediaDownloadUrlResponse {
  final String downloadUrl;
  final String fileKey;
  final int expiresInSeconds;

  const MediaDownloadUrlResponse({
    required this.downloadUrl,
    required this.fileKey,
    required this.expiresInSeconds,
  });

  factory MediaDownloadUrlResponse.fromJson(Map<String, dynamic> json) {
    return MediaDownloadUrlResponse(
      downloadUrl: json['downloadUrl'] as String,
      fileKey: json['fileKey'] as String,
      expiresInSeconds: json['expiresInSeconds'] as int? ?? 900,
    );
  }

  Map<String, dynamic> toJson() => {
        'downloadUrl': downloadUrl,
        'fileKey': fileKey,
        'expiresInSeconds': expiresInSeconds,
      };
}

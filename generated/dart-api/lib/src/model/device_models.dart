// GENERATED CODE - DO NOT MODIFY BY HAND
// Generated from OpenAPI 3.1 specification by @oprino/contracts

class DeviceResponse {
  final String id;
  final String installationId;
  final String platform;
  final String? deviceModel;
  final String? osVersion;
  final String? appVersion;
  final String status;
  final bool isTrusted;
  final DateTime lastActiveAt;

  const DeviceResponse({
    required this.id,
    required this.installationId,
    required this.platform,
    this.deviceModel,
    this.osVersion,
    this.appVersion,
    required this.status,
    required this.isTrusted,
    required this.lastActiveAt,
  });

  factory DeviceResponse.fromJson(Map<String, dynamic> json) {
    return DeviceResponse(
      id: json['id'] as String,
      installationId: json['installationId'] as String,
      platform: json['platform'] as String,
      deviceModel: json['deviceModel'] as String?,
      osVersion: json['osVersion'] as String?,
      appVersion: json['appVersion'] as String?,
      status: json['status'] as String,
      isTrusted: json['isTrusted'] as bool? ?? true,
      lastActiveAt: DateTime.parse(json['lastActiveAt'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'installationId': installationId,
        'platform': platform,
        if (deviceModel != null) 'deviceModel': deviceModel,
        if (osVersion != null) 'osVersion': osVersion,
        if (appVersion != null) 'appVersion': appVersion,
        'status': status,
        'isTrusted': isTrusted,
        'lastActiveAt': lastActiveAt.toIso8601String(),
      };
}

class ListDevicesResponse {
  final List<DeviceResponse> devices;

  const ListDevicesResponse({required this.devices});

  factory ListDevicesResponse.fromJson(Map<String, dynamic> json) {
    return ListDevicesResponse(
      devices: (json['devices'] as List<dynamic>)
          .map((e) => DeviceResponse.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() => {
        'devices': devices.map((d) => d.toJson()).toList(),
      };
}

class RevokeDeviceResponse {
  final bool success;
  final String message;

  const RevokeDeviceResponse({required this.success, required this.message});

  factory RevokeDeviceResponse.fromJson(Map<String, dynamic> json) {
    return RevokeDeviceResponse(
      success: json['success'] as bool? ?? true,
      message: json['message'] as String? ?? 'Revoked',
    );
  }

  Map<String, dynamic> toJson() => {
        'success': success,
        'message': message,
      };
}

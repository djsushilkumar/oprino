// GENERATED CODE - DO NOT MODIFY BY HAND
// Generated from OpenAPI 3.1 specification by @oprino/contracts

class LocationPoint {
  final String id;
  final DateTime recordedAt;
  final double latitude;
  final double longitude;
  final double accuracy;
  final double? speed;
  final double? heading;
  final double? altitude;
  final double? batteryLevel;
  final bool? isCharging;
  final String? activityType;
  final bool? isMoving;

  const LocationPoint({
    required this.id,
    required this.recordedAt,
    required this.latitude,
    required this.longitude,
    required this.accuracy,
    this.speed,
    this.heading,
    this.altitude,
    this.batteryLevel,
    this.isCharging,
    this.activityType,
    this.isMoving,
  });

  factory LocationPoint.fromJson(Map<String, dynamic> json) {
    return LocationPoint(
      id: json['id'] as String,
      recordedAt: DateTime.parse(json['recordedAt'] as String),
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      accuracy: (json['accuracy'] as num).toDouble(),
      speed: (json['speed'] as num?)?.toDouble(),
      heading: (json['heading'] as num?)?.toDouble(),
      altitude: (json['altitude'] as num?)?.toDouble(),
      batteryLevel: (json['batteryLevel'] as num?)?.toDouble(),
      isCharging: json['isCharging'] as bool?,
      activityType: json['activityType'] as String?,
      isMoving: json['isMoving'] as bool?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'recordedAt': recordedAt.toIso8601String(),
        'latitude': latitude,
        'longitude': longitude,
        'accuracy': accuracy,
        if (speed != null) 'speed': speed,
        if (heading != null) 'heading': heading,
        if (altitude != null) 'altitude': altitude,
        if (batteryLevel != null) 'batteryLevel': batteryLevel,
        if (isCharging != null) 'isCharging': isCharging,
        if (activityType != null) 'activityType': activityType,
        if (isMoving != null) 'isMoving': isMoving,
      };
}

class LocationIngestBatchRequest {
  final List<LocationPoint> locations;

  const LocationIngestBatchRequest({required this.locations});

  factory LocationIngestBatchRequest.fromJson(Map<String, dynamic> json) {
    return LocationIngestBatchRequest(
      locations: (json['locations'] as List<dynamic>)
          .map((e) => LocationPoint.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() => {
        'locations': locations.map((e) => e.toJson()).toList(),
      };
}

class LocationIngestResponse {
  final int accepted;
  final int dropped;
  final String? reason;
  final DateTime serverTimestamp;

  const LocationIngestResponse({
    required this.accepted,
    required this.dropped,
    this.reason,
    required this.serverTimestamp,
  });

  factory LocationIngestResponse.fromJson(Map<String, dynamic> json) {
    return LocationIngestResponse(
      accepted: json['accepted'] as int? ?? 0,
      dropped: json['dropped'] as int? ?? 0,
      reason: json['reason'] as String?,
      serverTimestamp: DateTime.parse(json['serverTimestamp'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'accepted': accepted,
        'dropped': dropped,
        if (reason != null) 'reason': reason,
        'serverTimestamp': serverTimestamp.toIso8601String(),
      };
}

class LiveWorkerLocation {
  final String userId;
  final String userName;
  final String? userEmail;
  final String dutyStatus;
  final String? sessionId;
  final DateTime recordedAt;
  final double latitude;
  final double longitude;
  final double accuracy;
  final double? speed;
  final double? heading;
  final double? batteryLevel;
  final bool? isCharging;
  final String? activityType;
  final bool? isMoving;
  final String? currentTaskId;
  final String? currentTaskTitle;

  const LiveWorkerLocation({
    required this.userId,
    required this.userName,
    this.userEmail,
    required this.dutyStatus,
    this.sessionId,
    required this.recordedAt,
    required this.latitude,
    required this.longitude,
    required this.accuracy,
    this.speed,
    this.heading,
    this.batteryLevel,
    this.isCharging,
    this.activityType,
    this.isMoving,
    this.currentTaskId,
    this.currentTaskTitle,
  });

  factory LiveWorkerLocation.fromJson(Map<String, dynamic> json) {
    return LiveWorkerLocation(
      userId: json['userId'] as String,
      userName: json['userName'] as String,
      userEmail: json['userEmail'] as String?,
      dutyStatus: json['dutyStatus'] as String,
      sessionId: json['sessionId'] as String?,
      recordedAt: DateTime.parse(json['recordedAt'] as String),
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      accuracy: (json['accuracy'] as num).toDouble(),
      speed: (json['speed'] as num?)?.toDouble(),
      heading: (json['heading'] as num?)?.toDouble(),
      batteryLevel: (json['batteryLevel'] as num?)?.toDouble(),
      isCharging: json['isCharging'] as bool?,
      activityType: json['activityType'] as String?,
      isMoving: json['isMoving'] as bool?,
      currentTaskId: json['currentTaskId'] as String?,
      currentTaskTitle: json['currentTaskTitle'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'userId': userId,
        'userName': userName,
        if (userEmail != null) 'userEmail': userEmail,
        'dutyStatus': dutyStatus,
        if (sessionId != null) 'sessionId': sessionId,
        'recordedAt': recordedAt.toIso8601String(),
        'latitude': latitude,
        'longitude': longitude,
        'accuracy': accuracy,
        if (speed != null) 'speed': speed,
        if (heading != null) 'heading': heading,
        if (batteryLevel != null) 'batteryLevel': batteryLevel,
        if (isCharging != null) 'isCharging': isCharging,
        if (activityType != null) 'activityType': activityType,
        if (isMoving != null) 'isMoving': isMoving,
        if (currentTaskId != null) 'currentTaskId': currentTaskId,
        if (currentTaskTitle != null) 'currentTaskTitle': currentTaskTitle,
      };
}

class ListLiveWorkersResponse {
  final List<LiveWorkerLocation> workers;

  const ListLiveWorkersResponse({required this.workers});

  factory ListLiveWorkersResponse.fromJson(Map<String, dynamic> json) {
    return ListLiveWorkersResponse(
      workers: (json['workers'] as List<dynamic>)
          .map((e) => LiveWorkerLocation.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() => {
        'workers': workers.map((e) => e.toJson()).toList(),
      };
}

class LocationHistoryResponse {
  final String userId;
  final String? userName;
  final String date;
  final double totalDistanceMeters;
  final int totalDurationMinutes;
  final List<LocationPoint> points;

  const LocationHistoryResponse({
    required this.userId,
    this.userName,
    required this.date,
    required this.totalDistanceMeters,
    required this.totalDurationMinutes,
    required this.points,
  });

  factory LocationHistoryResponse.fromJson(Map<String, dynamic> json) {
    return LocationHistoryResponse(
      userId: json['userId'] as String,
      userName: json['userName'] as String?,
      date: json['date'] as String,
      totalDistanceMeters: (json['totalDistanceMeters'] as num?)?.toDouble() ?? 0.0,
      totalDurationMinutes: json['totalDurationMinutes'] as int? ?? 0,
      points: (json['points'] as List<dynamic>)
          .map((e) => LocationPoint.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() => {
        'userId': userId,
        if (userName != null) 'userName': userName,
        'date': date,
        'totalDistanceMeters': totalDistanceMeters,
        'totalDurationMinutes': totalDurationMinutes,
        'points': points.map((e) => e.toJson()).toList(),
      };
}

class Geofence {
  final String id;
  final String workspaceId;
  final String name;
  final String? description;
  final double latitude;
  final double longitude;
  final double radiusMeters;
  final String geofenceType;
  final bool isActive;
  final String createdBy;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Geofence({
    required this.id,
    required this.workspaceId,
    required this.name,
    this.description,
    required this.latitude,
    required this.longitude,
    required this.radiusMeters,
    required this.geofenceType,
    required this.isActive,
    required this.createdBy,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Geofence.fromJson(Map<String, dynamic> json) {
    return Geofence(
      id: json['id'] as String,
      workspaceId: json['workspaceId'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      radiusMeters: (json['radiusMeters'] as num).toDouble(),
      geofenceType: json['geofenceType'] as String,
      isActive: json['isActive'] as bool? ?? true,
      createdBy: json['createdBy'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'workspaceId': workspaceId,
        'name': name,
        if (description != null) 'description': description,
        'latitude': latitude,
        'longitude': longitude,
        'radiusMeters': radiusMeters,
        'geofenceType': geofenceType,
        'isActive': isActive,
        'createdBy': createdBy,
        'createdAt': createdAt.toIso8601String(),
        'updatedAt': updatedAt.toIso8601String(),
      };
}

class CreateGeofenceRequest {
  final String name;
  final String? description;
  final double latitude;
  final double longitude;
  final double radiusMeters;
  final String geofenceType;

  const CreateGeofenceRequest({
    required this.name,
    this.description,
    required this.latitude,
    required this.longitude,
    this.radiusMeters = 100.0,
    this.geofenceType = 'OFFICE',
  });

  Map<String, dynamic> toJson() => {
        'name': name,
        if (description != null) 'description': description,
        'latitude': latitude,
        'longitude': longitude,
        'radiusMeters': radiusMeters,
        'geofenceType': geofenceType,
      };
}

class ListGeofencesResponse {
  final List<Geofence> geofences;

  const ListGeofencesResponse({required this.geofences});

  factory ListGeofencesResponse.fromJson(Map<String, dynamic> json) {
    return ListGeofencesResponse(
      geofences: (json['geofences'] as List<dynamic>)
          .map((e) => Geofence.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() => {
        'geofences': geofences.map((e) => e.toJson()).toList(),
      };
}

class CheckGeofenceProximityRequest {
  final String geofenceId;
  final double latitude;
  final double longitude;

  const CheckGeofenceProximityRequest({
    required this.geofenceId,
    required this.latitude,
    required this.longitude,
  });

  Map<String, dynamic> toJson() => {
        'geofenceId': geofenceId,
        'latitude': latitude,
        'longitude': longitude,
      };
}

class CheckGeofenceProximityResponse {
  final String geofenceId;
  final String geofenceName;
  final double distanceMeters;
  final double radiusMeters;
  final bool isInside;

  const CheckGeofenceProximityResponse({
    required this.geofenceId,
    required this.geofenceName,
    required this.distanceMeters,
    required this.radiusMeters,
    required this.isInside,
  });

  factory CheckGeofenceProximityResponse.fromJson(Map<String, dynamic> json) {
    return CheckGeofenceProximityResponse(
      geofenceId: json['geofenceId'] as String,
      geofenceName: json['geofenceName'] as String,
      distanceMeters: (json['distanceMeters'] as num).toDouble(),
      radiusMeters: (json['radiusMeters'] as num).toDouble(),
      isInside: json['isInside'] as bool,
    );
  }

  Map<String, dynamic> toJson() => {
        'geofenceId': geofenceId,
        'geofenceName': geofenceName,
        'distanceMeters': distanceMeters,
        'radiusMeters': radiusMeters,
        'isInside': isInside,
      };
}

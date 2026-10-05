// GENERATED CODE - DO NOT MODIFY BY HAND
// Generated from OpenAPI 3.1 specification by @oprino/contracts

class AuthUser {
  final String id;
  final String email;
  final String name;
  final bool emailVerified;
  final String? image;

  const AuthUser({
    required this.id,
    required this.email,
    required this.name,
    required this.emailVerified,
    this.image,
  });

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: json['id'] as String,
      email: json['email'] as String,
      name: json['name'] as String,
      emailVerified: json['emailVerified'] as bool? ?? false,
      image: json['image'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'name': name,
        'emailVerified': emailVerified,
        if (image != null) 'image': image,
      };
}

class AuthResponse {
  final String token;
  final AuthUser user;
  final String? activeWorkspaceId;

  const AuthResponse({
    required this.token,
    required this.user,
    this.activeWorkspaceId,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      token: json['token'] as String,
      user: AuthUser.fromJson(json['user'] as Map<String, dynamic>),
      activeWorkspaceId: json['activeWorkspaceId'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'token': token,
        'user': user.toJson(),
        if (activeWorkspaceId != null) 'activeWorkspaceId': activeWorkspaceId,
      };
}

class SignOutResponse {
  final bool success;

  const SignOutResponse({required this.success});

  factory SignOutResponse.fromJson(Map<String, dynamic> json) {
    return SignOutResponse(
      success: json['success'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() => {'success': success};
}

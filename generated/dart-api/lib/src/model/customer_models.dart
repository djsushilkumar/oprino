// GENERATED CODE - DO NOT MODIFY BY HAND
// Generated from OpenAPI 3.1 specification by @oprino/contracts

class Customer {
  final String id;
  final String workspaceId;
  final String name;
  final String? companyName;
  final String? email;
  final String? phone;
  final String? notes;
  final bool isActive;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Customer({
    required this.id,
    required this.workspaceId,
    required this.name,
    this.companyName,
    this.email,
    this.phone,
    this.notes,
    required this.isActive,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Customer.fromJson(Map<String, dynamic> json) {
    return Customer(
      id: json['id'] as String,
      workspaceId: json['workspaceId'] as String,
      name: json['name'] as String,
      companyName: json['companyName'] as String?,
      email: json['email'] as String?,
      phone: json['phone'] as String?,
      notes: json['notes'] as String?,
      isActive: json['isActive'] as bool? ?? true,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'workspaceId': workspaceId,
        'name': name,
        if (companyName != null) 'companyName': companyName,
        if (email != null) 'email': email,
        if (phone != null) 'phone': phone,
        if (notes != null) 'notes': notes,
        'isActive': isActive,
        'createdAt': createdAt.toIso8601String(),
        'updatedAt': updatedAt.toIso8601String(),
      };
}

class ListCustomersResponse {
  final List<Customer> customers;
  final int total;

  const ListCustomersResponse({required this.customers, required this.total});

  factory ListCustomersResponse.fromJson(Map<String, dynamic> json) {
    return ListCustomersResponse(
      customers: (json['customers'] as List<dynamic>)
          .map((e) => Customer.fromJson(e as Map<String, dynamic>))
          .toList(),
      total: json['total'] as int? ?? (json['customers'] as List<dynamic>).length,
    );
  }

  Map<String, dynamic> toJson() => {
        'customers': customers.map((c) => c.toJson()).toList(),
        'total': total,
      };
}

class CustomerSite {
  final String id;
  final String workspaceId;
  final String customerId;
  final String? customerName;
  final String name;
  final String address;
  final double? latitude;
  final double? longitude;
  final double geofenceRadiusMeters;
  final String? contactName;
  final String? contactPhone;
  final String? notes;
  final bool isActive;
  final DateTime createdAt;
  final DateTime updatedAt;

  const CustomerSite({
    required this.id,
    required this.workspaceId,
    required this.customerId,
    this.customerName,
    required this.name,
    required this.address,
    this.latitude,
    this.longitude,
    this.geofenceRadiusMeters = 100.0,
    this.contactName,
    this.contactPhone,
    this.notes,
    required this.isActive,
    required this.createdAt,
    required this.updatedAt,
  });

  factory CustomerSite.fromJson(Map<String, dynamic> json) {
    return CustomerSite(
      id: json['id'] as String,
      workspaceId: json['workspaceId'] as String,
      customerId: json['customerId'] as String,
      customerName: json['customerName'] as String?,
      name: json['name'] as String,
      address: json['address'] as String,
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      geofenceRadiusMeters: (json['geofenceRadiusMeters'] as num?)?.toDouble() ?? 100.0,
      contactName: json['contactName'] as String?,
      contactPhone: json['contactPhone'] as String?,
      notes: json['notes'] as String?,
      isActive: json['isActive'] as bool? ?? true,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'workspaceId': workspaceId,
        'customerId': customerId,
        if (customerName != null) 'customerName': customerName,
        'name': name,
        'address': address,
        if (latitude != null) 'latitude': latitude,
        if (longitude != null) 'longitude': longitude,
        'geofenceRadiusMeters': geofenceRadiusMeters,
        if (contactName != null) 'contactName': contactName,
        if (contactPhone != null) 'contactPhone': contactPhone,
        if (notes != null) 'notes': notes,
        'isActive': isActive,
        'createdAt': createdAt.toIso8601String(),
        'updatedAt': updatedAt.toIso8601String(),
      };
}

class ListCustomerSitesResponse {
  final List<CustomerSite> sites;
  final int total;

  const ListCustomerSitesResponse({required this.sites, required this.total});

  factory ListCustomerSitesResponse.fromJson(Map<String, dynamic> json) {
    return ListCustomerSitesResponse(
      sites: (json['sites'] as List<dynamic>)
          .map((e) => CustomerSite.fromJson(e as Map<String, dynamic>))
          .toList(),
      total: json['total'] as int? ?? (json['sites'] as List<dynamic>).length,
    );
  }

  Map<String, dynamic> toJson() => {
        'sites': sites.map((s) => s.toJson()).toList(),
        'total': total,
      };
}

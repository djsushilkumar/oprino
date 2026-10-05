# oprino_api.api.ReportsApi

## Load the API package
```dart
import 'package:oprino_api/api.dart';
```

All URIs are relative to *http://localhost:3099*

Method | HTTP request | Description
------------- | ------------- | -------------
[**downloadAttendancePdfReport**](ReportsApi.md#downloadattendancepdfreport) | **GET** /v1/reports/pdf | Generate and download attendance PDF summary


# **downloadAttendancePdfReport**
> String downloadAttendancePdfReport()

Generate and download attendance PDF summary

### Example
```dart
import 'package:oprino_api/api.dart';

final api = OprinoApi().getReportsApi();

try {
    final response = api.downloadAttendancePdfReport();
    print(response);
} catch on DioException (e) {
    print('Exception when calling ReportsApi->downloadAttendancePdfReport: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

**String**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/pdf

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


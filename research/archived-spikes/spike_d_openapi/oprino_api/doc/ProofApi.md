# oprino_api.api.ProofApi

## Load the API package
```dart
import 'package:oprino_api/api.dart';
```

All URIs are relative to *http://localhost:3099*

Method | HTTP request | Description
------------- | ------------- | -------------
[**uploadProofPhoto**](ProofApi.md#uploadproofphoto) | **POST** /v1/proof/upload | Upload proof of work photo


# **uploadProofPhoto**
> UploadProofPhoto200Response uploadProofPhoto()

Upload proof of work photo

### Example
```dart
import 'package:oprino_api/api.dart';

final api = OprinoApi().getProofApi();

try {
    final response = api.uploadProofPhoto();
    print(response);
} catch on DioException (e) {
    print('Exception when calling ProofApi->uploadProofPhoto: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**UploadProofPhoto200Response**](UploadProofPhoto200Response.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


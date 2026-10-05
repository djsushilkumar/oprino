# oprino_api.api.TasksApi

## Load the API package
```dart
import 'package:oprino_api/api.dart';
```

All URIs are relative to *http://localhost:3099*

Method | HTTP request | Description
------------- | ------------- | -------------
[**createTask**](TasksApi.md#createtask) | **POST** /v1/tasks | Create a new operational task
[**listTasks**](TasksApi.md#listtasks) | **GET** /v1/tasks | List tasks with pagination and status filter


# **createTask**
> ListTasks200ResponseItemsInner createTask(createTaskRequest)

Create a new operational task

### Example
```dart
import 'package:oprino_api/api.dart';

final api = OprinoApi().getTasksApi();
final CreateTaskRequest createTaskRequest = ; // CreateTaskRequest | 

try {
    final response = api.createTask(createTaskRequest);
    print(response);
} catch on DioException (e) {
    print('Exception when calling TasksApi->createTask: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **createTaskRequest** | [**CreateTaskRequest**](CreateTaskRequest.md)|  | 

### Return type

[**ListTasks200ResponseItemsInner**](ListTasks200ResponseItemsInner.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listTasks**
> ListTasks200Response listTasks(page, limit, status, search)

List tasks with pagination and status filter

### Example
```dart
import 'package:oprino_api/api.dart';

final api = OprinoApi().getTasksApi();
final int page = 56; // int | 
final int limit = 56; // int | 
final String status = status_example; // String | 
final String search = search_example; // String | 

try {
    final response = api.listTasks(page, limit, status, search);
    print(response);
} catch on DioException (e) {
    print('Exception when calling TasksApi->listTasks: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **page** | **int**|  | [optional] [default to 1]
 **limit** | **int**|  | [optional] [default to 20]
 **status** | **String**|  | [optional] 
 **search** | **String**|  | [optional] 

### Return type

[**ListTasks200Response**](ListTasks200Response.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


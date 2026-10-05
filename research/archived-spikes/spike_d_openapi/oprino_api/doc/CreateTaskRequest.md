# oprino_api.model.CreateTaskRequest

## Load the model package
```dart
import 'package:oprino_api/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**title** | **String** |  | 
**description** | **String** |  | [optional] 
**priority** | **String** |  | [optional] [default to 'MEDIUM']
**assignedUserId** | **String** |  | [optional] 
**location** | [**ListTasks200ResponseItemsInnerLocation**](ListTasks200ResponseItemsInnerLocation.md) |  | [optional] 
**tags** | **BuiltList&lt;String&gt;** |  | [optional] [default to ListBuilder()]
**dueAt** | [**DateTime**](DateTime.md) |  | [optional] 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)



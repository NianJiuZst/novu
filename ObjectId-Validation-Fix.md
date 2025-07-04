# MongoDB ObjectId Validation Fix

## Issue Description

The application was experiencing BSONError crashes with the message:
```
BSONError: Argument passed in must be a string of 12 bytes or a string of 24 hex characters or an integer
```

This error occurred in the `MessageRepository.changeStatus` method when invalid ObjectId strings were passed to the `new Types.ObjectId(id)` constructor.

## Root Cause

The issue was caused by insufficient validation at the DTO (Data Transfer Object) level. When invalid ObjectId strings were submitted through the API endpoints, they were not validated before reaching the repository layer, causing the MongoDB ObjectId constructor to fail.

## Solution

### 1. DTO Validation Enhancement

Added `@IsMongoId()` validation decorators to ensure ObjectId validation at the input level:

**Files Updated:**
- `apps/api/src/app/widgets/dtos/mark-as-request.dto.ts`
- `apps/api/src/app/widgets/dtos/mark-message-as-request.dto.ts`

**Changes Made:**
```typescript
// Added validation for messageId field
@ValidateIf((o) => Array.isArray(o.messageId))
@IsMongoId({ each: true })
@ValidateIf((o) => typeof o.messageId === 'string')
@IsMongoId()
messageId: string | string[];
```

### 2. Command Validation Enhancement

Added `@IsMongoId()` validation decorators to command classes:

**Files Updated:**
- `apps/api/src/app/widgets/usecases/mark-message-as/mark-message-as.command.ts`
- `apps/api/src/app/widgets/usecases/mark-message-as-by-mark/mark-message-as-by-mark.command.ts`
- `apps/api/src/app/widgets/usecases/remove-message/remove-message.command.ts`
- `apps/api/src/app/messages/usecases/remove-message/remove-message.command.ts`

**Changes Made:**
```typescript
// For arrays
@IsArray()
@IsMongoId({ each: true })
messageIds: string[];

// For single values
@IsString()
@IsMongoId()
messageId: string;
```

### 3. Repository-Level Defensive Validation

Added defensive validation in the repository methods as a safety net:

**File Updated:**
- `libs/dal/src/repositories/message/message.repository.ts`

**Changes Made:**
```typescript
// Validate that all messageIds are valid MongoDB ObjectIds
const invalidIds = messageIds.filter(id => !Types.ObjectId.isValid(id));
if (invalidIds.length > 0) {
  throw new Error(`Invalid ObjectId(s) provided: ${invalidIds.join(', ')}`);
}
```

**Methods Enhanced:**
- `changeMessagesStatus()`
- `changeStatus()` (deprecated)
- `updateMessagesStatusByIds()`

## Benefits

1. **Early Validation**: Invalid ObjectIds are caught at the API validation layer before reaching the repository
2. **Better Error Messages**: Clear validation errors are returned to clients instead of cryptic BSONError messages
3. **Defensive Programming**: Repository-level validation provides an additional safety net
4. **Consistency**: All message-related operations now have consistent ObjectId validation

## Testing

After implementing these changes, the following scenarios should be tested:

1. **Valid ObjectIds**: Ensure normal functionality works correctly
2. **Invalid ObjectIds**: Verify that proper validation errors are returned
3. **Mixed Valid/Invalid**: Test arrays with both valid and invalid ObjectIds
4. **Edge Cases**: Test with empty strings, null values, and non-string types

## API Response Changes

Clients will now receive proper validation error responses (HTTP 400) instead of internal server errors (HTTP 500) when submitting invalid ObjectIds.

Example error response:
```json
{
  "statusCode": 400,
  "timestamp": "2024-01-11T10:00:00.000Z",
  "path": "/v1/subscribers/123/messages/mark-as",
  "message": "Bad Request",
  "errors": {
    "messageId": {
      "messages": ["messageId must be a mongodb id"],
      "value": "invalid-id"
    }
  }
}
```

## Migration Notes

This is a backward-compatible change that enhances validation without breaking existing functionality. Clients sending valid ObjectIds will continue to work as before.

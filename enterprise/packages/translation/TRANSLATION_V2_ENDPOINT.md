# Translation V2 Endpoint

This document describes the new v2 translation endpoint that has been added to the enterprise translation package.

## Overview

The v2 translation endpoint provides a simple way to retrieve translations from the translation repository with optional filtering capabilities.

## Endpoint

```
GET /v2/translations
```

## Features

- **Pagination**: Support for page-based pagination with configurable limits
- **Filtering**: Filter by translation group identifier and locale
- **Enterprise Integration**: Fully integrated with the Novu enterprise architecture

## Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `groupIdentifier` | string | No | Filter by translation group identifier |
| `locale` | string | No | Filter by locale (e.g., en_US, fr_FR) |
| `page` | string | No | Page number for pagination (default: 0) |
| `limit` | string | No | Number of items per page (default: 50) |

## Response Format

```typescript
{
  data: TranslationResponseDto[];
  total: number;
  page: number;
  limit: number;
}
```

### TranslationResponseDto

```typescript
{
  _id: string;
  _groupId: string;
  isoLanguage: string;
  translations?: Record<string, any>;
  fileName?: string;
  _environmentId: string;
  _organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Example Usage

### Get all translations
```bash
GET /v2/translations
```

### Get translations for a specific group
```bash
GET /v2/translations?groupIdentifier=welcome_messages
```

### Get translations for a specific locale
```bash
GET /v2/translations?locale=en_US
```

### Get translations with pagination
```bash
GET /v2/translations?page=1&limit=20
```

### Combined filtering
```bash
GET /v2/translations?groupIdentifier=welcome_messages&locale=fr_FR&page=0&limit=10
```

## Implementation Details

- The endpoint is implemented in the `TranslationV2Controller` class
- It uses the `GetTranslations` usecase for business logic
- Currently returns mock data but includes TODO comments for repository integration
- Follows Novu's established patterns for v2 controllers

## Next Steps

1. **Repository Integration**: Replace mock data with actual repository calls
2. **Authentication**: Add proper authentication and authorization decorators
3. **Validation**: Add more robust input validation
4. **Error Handling**: Implement comprehensive error handling
5. **Testing**: Add unit and integration tests

## Files Created

- `.source/translation/src/translation-v2.controller.ts` - The main v2 controller
- `.source/translation/src/usecases/get-translations/` - Business logic usecase
- `.source/translation/src/dtos/` - Data transfer objects
- `.source/translation/src/translation.module.ts` - Module configuration

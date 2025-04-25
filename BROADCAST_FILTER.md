# Broadcast Notification Filtering

This feature allows API clients to filter which subscribers receive broadcast notifications by providing MongoDB-compatible query filters.

## Implementation Overview

The implementation adds a `subscriberFilter` parameter to the broadcast endpoint that allows passing MongoDB-compatible query filters to narrow down which subscribers should receive the notification.

### Key Changes

1. Added `subscriberFilter` field to the DTOs:

   - `TriggerEventToAllRequestDto` (API request DTO)
   - `TriggerEventToAllCommand` (Controller to usecase command)
   - `TriggerEventBroadcastCommand` (Base broadcast command)
   - `ParseEventRequestBroadcastCommand` (Parse event request command)

2. Modified the `TriggerBroadcast` usecase to use the filter when querying subscribers:

   ```typescript
   // Base query includes environment and organization
   const query: Record<string, unknown> = {
     _environmentId: command.environmentId,
     _organizationId: command.organizationId,
   };

   // Add subscriber filter if provided
   if (command.subscriberFilter && Object.keys(command.subscriberFilter).length > 0) {
     Object.assign(query, command.subscriberFilter);
   }

   for await (const subscriber of this.subscriberRepository.findBatch(
     query,
     'subscriberId',
     {},
     subscriberFetchBatchSize
   )) {
     // Process each subscriber
   }
   ```

3. Updated API documentation to explain the feature and provide examples of filter usage.

4. Added e2e tests to verify the functionality.

## Usage Examples

```javascript
// Trigger broadcast to subscribers in the USA
await novuClient.triggerBroadcast({
  name: 'new-feature-announcement',
  payload: {
    featureName: 'Broadcast Filtering',
  },
  subscriberFilter: {
    'data.country': 'USA',
  },
});

// Trigger broadcast to premium or enterprise subscribers
await novuClient.triggerBroadcast({
  name: 'premium-announcement',
  payload: {
    message: 'New premium features available!',
  },
  subscriberFilter: {
    'data.plan': { $in: ['premium', 'enterprise'] },
  },
});

// Trigger broadcast to subscribers with names starting with 'A'
await novuClient.triggerBroadcast({
  name: 'special-offer',
  payload: {
    offer: 'Special discount for A-names!',
  },
  subscriberFilter: {
    firstName: { $regex: '^A' },
  },
});
```

## Security Considerations

- The filter is directly passed to MongoDB, so it's important to validate the input in production.
- In a future version, consider implementing a more structured filtering approach with predefined operators.
- The feature allows querying any field on the subscriber object, including sensitive ones. Consider restricting this to only certain fields if needed.

## Performance Considerations

- For very large subscriber bases, complex queries might impact performance.
- Consider adding monitoring to track the execution time of filtered broadcasts.
- Future optimizations could include indexing commonly filtered fields in the subscriber collection.

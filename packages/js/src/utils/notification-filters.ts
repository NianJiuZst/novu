import { Notification, NotificationFilter } from '../types';

/**
 * Check if notification data matches the filter data criteria.
 * Extracted from CountContext.tsx for reuse across React and SolidJS.
 */
export function checkNotificationDataFilter(
  notificationData: Notification['data'],
  filterData: NotificationFilter['data']
): boolean {
  if (!filterData || Object.keys(filterData).length === 0) {
    // No data filter defined, so it's a match on the data aspect.
    return true;
  }
  if (!notificationData) {
    // Filter has data criteria, but the notification has no data.
    return false;
  }

  return Object.entries(filterData).every(([key, filterValue]) => {
    const notifValue = notificationData[key];

    if (notifValue === undefined && filterValue !== undefined) {
      // Key is specified in filter, but not present in notification data.
      return false;
    }

    if (Array.isArray(filterValue)) {
      if (Array.isArray(notifValue)) {
        /*
         * Both filter value and notification value are arrays.
         * Check for set equality (same elements, regardless of order).
         */
        if (filterValue.length !== notifValue.length) return false;
        /*
         * Ensure elements are of primitive types for direct sort and comparison.
         * If elements can be objects, a more sophisticated comparison is needed.
         */
        const sortedFilterValue = [...(filterValue as (string | number | boolean)[])].sort();
        const sortedNotifValue = [...(notifValue as (string | number | boolean)[])].sort();

        return sortedFilterValue.every((val, index) => val === sortedNotifValue[index]);
      } else {
        /*
         * Filter value is an array, notification value is scalar.
         * Check if the scalar notification value is present in the filter array.
         */
        return (filterValue as unknown[]).includes(notifValue);
      }
    } else {
      // Filter value is scalar. Notification value must be equal.
      return notifValue === filterValue;
    }
  });
}

/**
 * Check if notification tags match the filter tags criteria.
 */
export function checkNotificationTagFilter(
  notificationTags: string[] | undefined,
  filterTags: string[] | undefined
): boolean {
  if (!filterTags || filterTags.length === 0) {
    // No tag filter specified, so it matches
    return true;
  }

  if (!notificationTags || notificationTags.length === 0) {
    // Filter has tags but notification has none
    return false;
  }

  // Check if notification has any of the required tags
  return filterTags.some((tag) => notificationTags.includes(tag));
}

/**
 * Check if notification matches basic filter criteria (read, seen, archived, snoozed).
 */
export function checkBasicFilters(
  notification: Notification,
  filter: Pick<NotificationFilter, 'read' | 'seen' | 'archived' | 'snoozed'>
): boolean {
  // Check read status
  if (filter.read !== undefined && notification.isRead !== filter.read) {
    return false;
  }

  // Check seen status
  if (filter.seen !== undefined && notification.isSeen !== filter.seen) {
    return false;
  }

  // Check archived status
  if (filter.archived !== undefined && notification.isArchived !== filter.archived) {
    return false;
  }

  // Check snoozed status
  if (filter.snoozed !== undefined && notification.isSnoozed !== filter.snoozed) {
    return false;
  }

  return true;
}

/**
 * Complete notification filter check combining all criteria.
 * This is the main function that should be used by both React and SolidJS implementations.
 */
export function checkNotificationMatchesFilter(notification: Notification, filter: NotificationFilter): boolean {
  return (
    checkBasicFilters(notification, filter) &&
    checkNotificationTagFilter(notification.tags, filter.tags) &&
    checkNotificationDataFilter(notification.data, filter.data)
  );
}

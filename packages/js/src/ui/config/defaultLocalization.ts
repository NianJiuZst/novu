import { createSignal } from 'solid-js';

export const defaultLocalization = {
  locale: 'en-US',
  'inbox.filters.dropdownOptions.unread': 'Unread only',
  'inbox.filters.dropdownOptions.default': 'Unread & read',
  'inbox.filters.dropdownOptions.archived': 'Archived',
  'inbox.filters.dropdownOptions.snoozed': 'Snoozed',
  'inbox.filters.labels.unread': 'Unread',
  'inbox.filters.labels.default': 'Inbox',
  'inbox.filters.labels.archived': 'Archived',
  'inbox.filters.labels.snoozed': 'Snoozed',
  'notifications.emptyNotice': 'Quiet for now. Check back later.',
  'notifications.actions.readAll': 'Mark all as read',
  'notifications.actions.archiveAll': 'Archive all',
  'notifications.actions.archiveRead': 'Archive read',
  'notifications.newNotifications': ({ notificationCount }: { notificationCount: number }) =>
    `${notificationCount > 99 ? '99+' : notificationCount} new ${
      notificationCount === 1 ? 'notification' : 'notifications'
    }`,
  'notification.actions.read.tooltip': 'Mark as read',
  'notification.actions.unread.tooltip': 'Mark as unread',
  'notification.actions.archive.tooltip': 'Archive',
  'notification.actions.unarchive.tooltip': 'Unarchive',
  'notification.actions.snooze.tooltip': 'Snooze',
  'notification.actions.unsnooze.tooltip': 'Unsnooze',
  'notification.snoozedUntil': 'Snoozed until',
  'preferences.title': 'Preferences',
  'preferences.emptyNotice': 'No notification specific preferences yet.',
  'preferences.global': 'Global preferences',
  'preferences.workflow': 'Workflow preferences',
  'preferences.workflow.disabled.notice':
    'Contact admin to enable subscription management for this critical notification.',
  'preferences.workflow.disabled.tooltip': 'Contact admin to edit',
  'preferences.group.info': 'Applies to all notifications under this group.',
  'snooze.datePicker.timePickerLabel': 'Time',
  'snooze.datePicker.apply': 'Apply',
  'snooze.datePicker.cancel': 'Cancel',
  'snooze.options.anHourFromNow': 'An hour from now',
  'snooze.datePicker.pastDateTooltip': 'Selected time must be at least 3 minutes in the future',
  'snooze.datePicker.noDateSelectedTooltip': 'Please select a date',
  'snooze.datePicker.exceedingLimitTooltip': ({ days }: { days: number }) =>
    `Selected time cannot exceed ${days === 1 ? '24 hours' : `${days} days`} from now`,
  'snooze.options.customTime': 'Custom time...',
  'snooze.options.inOneDay': 'Tomorrow',
  'snooze.options.inOneWeek': 'Next week',

  // My Notifications
  'myNotifications.title': 'My notifications',
  'myNotifications.badge': 'AI',
  'myNotifications.description':
    'Create custom notification rules using natural language. AI will match system events against your preferences and send personalized notifications.',
  'myNotifications.addButton': 'Add custom notification',
  'myNotifications.form.title': 'Create Custom Notification',
  'myNotifications.form.description': 'Describe what you want to be notified about and how you want to be notified.',
  'myNotifications.form.label': 'What do you want to be notified about?',
  'myNotifications.form.placeholder': 'e.g., "Notify me about critical security issues in production"',
  'myNotifications.form.hint': 'Be specific about the events or conditions you care about',
  'myNotifications.form.contentLabel': 'How should we notify you?',
  'myNotifications.form.contentPlaceholder': 'e.g., "Security Alert: Critical issue detected in {{environment}}"',
  'myNotifications.form.contentHint': 'This template will be used to generate your notification content',
  'myNotifications.form.oneTimeLabel': 'One-time notification',
  'myNotifications.form.oneTimeHint': 'This notification will be automatically deactivated after being triggered once',
  'myNotifications.form.cancel': 'Cancel',
  'myNotifications.form.submit': 'Create notification',
  'myNotifications.form.submitting': 'Creating...',
  'myNotifications.list.title': 'Your custom notifications',
  'myNotifications.list.createdAt': 'Created',
  'myNotifications.empty': 'No custom notifications yet. Create your first one above!',

  // Notify Component
  'notify.button': 'Smart Notify',
  'notify.tooltip': 'Create AI-powered notifications',
  'notify.form.title': 'Smart Notification',
  'notify.form.description':
    "Describe what you want to be notified about and we'll create a smart notification for you.",
  'notify.form.success': 'Notification created successfully!',
  'notify.form.error': 'Failed to create notification. Please try again.',

  'inbox.status.options.unread': 'Unread',
  'inbox.status.options.unreadRead': 'All',
  'inbox.status.options.archived': 'Archived',
  'inbox.status.options.snoozed': 'Snoozed',
  'preferences.channels.email': 'Email',
  'preferences.channels.sms': 'SMS',
  'preferences.channels.in_app': 'In-App',
  'preferences.channels.chat': 'Chat',
  'preferences.channels.push': 'Push',
  'preferences.channels.aiPreference': 'AI Preference',
  'preferences.channels.aiPreference.enabled': 'Enabled',
  'preferences.channels.aiPreference.disabled': 'Disabled',
  'preferences.channels.aiPreference.prompt': 'Custom prompt',
  'preferences.channels.aiPreference.promptPlaceholder': 'Describe when you want to receive notifications...',
  'preferences.channels.aiPreference.description':
    'AI will intelligently filter notifications based on your custom criteria.',
} as const;

export const [dynamicLocalization, setDynamicLocalization] = createSignal<Record<string, string>>({});

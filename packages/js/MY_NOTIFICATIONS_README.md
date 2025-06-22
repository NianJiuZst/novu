# My Notifications Feature for Novu JS SDK

This document describes the new "My notifications" feature that allows users to create custom notification queries based on their specific needs.

## Overview

The "My notifications" feature introduces a new concept in the Novu JS UI preference page that enables users to create personalized notification rules. Users can specify what they want to be notified about using natural language, and the system will create preference entries that can be matched against system triggers using AI.

## Features

- **Custom Notification Creation**: Users can describe what they want to be notified about in natural language
- **Modern Slick UI**: Beautiful gradient design with sparkle icons and smooth animations
- **Real-time Validation**: Form validation with character counting (10-500 characters)
- **Notification Management**: Users can view, manage, and remove their custom notifications
- **AI-Ready Integration**: Creates preference entries for the "my-notifications" workflow identifier

## Components Added

### 1. MyNotifications Component

Located: `packages/js/src/ui/components/elements/Preferences/MyNotifications.tsx`

The main component that provides:

- Header section with title, description, and "Add Custom Notification" button
- Expandable form for creating new notification queries
- List of existing custom notifications with remove functionality
- Empty state when no notifications exist

### 2. MyNotificationsDemo Component

Located: `packages/js/src/ui/components/elements/Preferences/MyNotificationsDemo.tsx`

A demo component showcasing the feature with explanatory information.

### 3. Updated Preferences Component

The main Preferences component now includes the MyNotifications section positioned after the global preferences.

## UI Design

The component features:

- **Gradient Background**: Primary to secondary gradient for the header section
- **Sparkle Icon**: Represents AI functionality and modern design
- **Beta Badge**: Indicates the experimental nature of the feature
- **Smooth Animations**: Motion components for form appearance and list items
- **Responsive Design**: Works well on different screen sizes
- **Accessibility**: Proper labeling and keyboard navigation support

## Localization

All text content is localized with keys under the `myNotifications` namespace:

- `myNotifications.title`: "My notifications"
- `myNotifications.badge`: "New"
- `myNotifications.description`: Feature description
- `myNotifications.form.*`: Form-related text
- `myNotifications.list.*`: List-related text
- `myNotifications.empty`: Empty state message

## Technical Implementation

### Data Structure

```typescript
type CustomNotification = {
  id: string;
  query: string;
  createdAt: Date;
};
```

### Key Features

1. **Form Validation**: Ensures queries are between 10-500 characters
2. **State Management**: Uses SolidJS signals for reactive state
3. **Local Storage**: Temporarily stores notifications (TODO: API integration)
4. **Error Handling**: Graceful error handling for form submission

### Integration Points

- **Preferences API**: Will create entries for "my-notifications" workflow
- **AI Matching**: Queries will be used to match against system triggers
- **Appearance System**: Full integration with Novu's appearance key system
- **Localization System**: Complete i18n support

## Usage Example

```typescript
import { MyNotifications } from '@novu/js/ui';

// The component is automatically included in the Preferences page
// or can be used standalone:
<MyNotifications />
```

## Future Enhancements

1. **API Integration**: Replace local storage with actual API calls
2. **Query Templates**: Provide common notification query templates
3. **Advanced Matching**: More sophisticated AI matching algorithms
4. **Notification Preview**: Show how queries would match sample content
5. **Import/Export**: Allow users to share notification configurations

## Development Notes

- Uses modern SolidJS patterns with signals and effects
- Follows Novu's design system and appearance key conventions
- Includes comprehensive TypeScript types
- Responsive and accessible design
- Smooth animations and transitions
- Proper error handling and loading states

The feature is designed to be extensible and can be enhanced with additional functionality as the AI matching system evolves.

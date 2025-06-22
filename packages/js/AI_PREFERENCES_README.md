# AI Preferences for Novu JS SDK

This document describes the AI Preferences feature that allows users to set up AI-powered notification filtering based on custom prompts.

## Overview

The AI Preferences feature adds an intelligent layer to notification preferences, allowing users to describe in natural language when they want to receive notifications for specific workflows. The AI analyzes notification content against the user's prompt to determine whether to deliver the notification.

## Features

- **Toggle AI Preference**: Users can enable/disable AI-based filtering for each workflow
- **Custom Prompt Input**: A textarea where users can describe their notification preferences in natural language
- **Modern UI Design**: Gradient background, sparkle icon, and beta badge to indicate the experimental nature
- **Seamless Integration**: Works alongside existing channel preferences without disruption

## Components Added

### 1. AIPreferenceRow Component

Located: `packages/js/src/ui/components/elements/Preferences/AIPreferenceRow.tsx`

Features:

- Toggle switch to enable/disable AI preferences
- Collapsible textarea for prompt input
- Modern design with gradient background and sparkle icon
- Beta badge to indicate experimental feature

### 2. Sparkle Icon

Located: `packages/js/src/ui/icons/Sparkle.tsx`

A custom SVG icon representing AI functionality.

### 3. Textarea Component

Located: `packages/js/src/ui/components/primitives/Textarea.tsx`

A reusable textarea component for text input with proper styling and appearance key support.

### 4. Updated Types

Located: `packages/js/src/types.ts`

Added:

```typescript
export type AIPreference = {
  enabled: boolean;
  prompt?: string;
};
```

## Usage Example

```typescript
import { AIPreferenceRow } from '@novu/js/ui';

const MyComponent = () => {
  const [aiPreference, setAIPreference] = useState({
    enabled: false,
    prompt: ''
  });

  const handleAIPreferenceChange = (newPreference) => {
    setAIPreference(newPreference);
    // Update preference via API
  };

  return (
    <AIPreferenceRow
      aiPreference={aiPreference}
      workflowName="User Signup Welcome"
      workflowIdentifier="user-signup-welcome"
      onChange={handleAIPreferenceChange}
    />
  );
};
```

## Example Prompts

Users can write prompts like:

- "Only notify me about high-priority issues during business hours"
- "Send notifications only if the message mentions my name or team"
- "Notify me about security alerts immediately, but delay marketing messages until weekends"
- "Only send notifications for urgent matters when I'm not in a meeting"

## Integration Points

### 1. PreferencesRow Component

Updated to include the AI preference section when `onAIPreferenceChange` prop is provided.

### 2. Preference Class

Extended to support `aiPreference` property and update methods.

### 3. API Integration

Currently implemented with local state management. Backend API integration is marked as TODO for future implementation.

### 4. Appearance Keys

Added comprehensive appearance keys for styling customization:

- `aiPreferenceContainer`
- `aiPreferenceHeader`
- `aiPreferenceLabelContainer`
- `aiPreferenceIcon`
- `aiPreferenceContent`
- `aiPreferenceTitle`
- `aiPreferenceLabel`
- `aiPreferenceBadge`
- `aiPreferenceDescription`
- `aiPreferenceSwitchContainer`
- `aiPreferencePromptContainer`
- `aiPreferencePromptLabel`
- `aiPreferencePromptInput`
- `aiPreferencePromptHint`

## Demo Component

A demo component (`PreferencesDemo.tsx`) is available to showcase the AI preference functionality with mock data.

## Future Enhancements

1. **Backend API Integration**: Update API endpoints to support AI preference storage and retrieval
2. **AI Processing**: Implement actual AI analysis of notification content against user prompts
3. **Prompt Templates**: Provide pre-written prompt templates for common use cases
4. **Analytics**: Track AI preference usage and effectiveness
5. **Advanced Prompts**: Support for more complex conditions and time-based rules

## Technical Notes

- The feature is designed to be backward compatible
- AI preferences are optional and don't affect existing functionality
- The UI gracefully handles cases where AI preferences are not available
- Proper TypeScript support throughout the implementation
- Follows existing Novu design patterns and conventions

## Styling

The AI preference section uses a distinctive design to stand out:

- Gradient background (primary to secondary alpha)
- Sparkle icon for AI representation
- Beta badge to indicate experimental status
- Smooth animations and transitions
- Responsive design that works across different screen sizes

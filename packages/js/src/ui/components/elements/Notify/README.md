# Notify Component

The `<Notify />` component is a standalone AI-powered notification creation tool that allows users to quickly create custom notifications from within their application context.

## Features

- **Smart Button Interface**: Elegant button with AI sparkle icon and smooth hover animations
- **Modal Form**: Contextual popup form with professional styling
- **Real-time Validation**: Form validation with character counting and visual feedback
- **Success Animations**: Smooth success state with check icon and auto-close
- **Customizable**: Multiple size and variant options
- **Accessible**: Full keyboard navigation and screen reader support
- **Integration Ready**: Works seamlessly with the Novu provider context

## Usage

### Basic Usage

```tsx
import { Notify } from '@novu/js/ui';

function MyApp() {
  return (
    <div>
      <Notify />
    </div>
  );
}
```

### With Custom Props

```tsx
import { Notify } from '@novu/js/ui';

function MyApp() {
  const handleSuccess = (notification) => {
    console.log('Custom notification created:', notification);
  };

  const handleError = (error) => {
    console.error('Failed to create notification:', error);
  };

  return (
    <div>
      <Notify size="lg" variant="outline" onSuccess={handleSuccess} onError={handleError} className="my-custom-class" />
    </div>
  );
}
```

## Props

| Prop        | Type                                | Default     | Description                                                    |
| ----------- | ----------------------------------- | ----------- | -------------------------------------------------------------- |
| `onSuccess` | `(notification: any) => void`       | -           | Callback fired when notification is successfully created       |
| `onError`   | `(error: string) => void`           | -           | Callback fired when there's an error creating the notification |
| `className` | `string`                            | -           | Additional CSS classes to apply to the container               |
| `size`      | `'sm' \| 'md' \| 'lg'`              | `'md'`      | Size of the button                                             |
| `variant`   | `'default' \| 'outline' \| 'ghost'` | `'default'` | Visual style variant of the button                             |

## Styling

The component uses the Novu design system and follows the established appearance key patterns:

- `notifyContainer` - Main container
- `notifyButton` - The trigger button
- `notifyModal` - The popup modal
- `notifyForm*` - Form-related elements

You can customize the appearance using the Novu appearance system or by passing custom CSS classes.

## Behavior

1. **Button Click**: Opens the notification creation modal
2. **Form Validation**: Real-time validation with visual feedback
3. **Success State**: Shows success animation and auto-closes after 1.5 seconds
4. **Error Handling**: Displays error messages with retry capability
5. **Outside Click**: Closes the modal when clicking outside

## Integration

The component automatically integrates with:

- **Novu Context**: Uses the Novu provider for API calls
- **Localization**: Supports all localized text strings
- **Style System**: Uses the Novu style system for consistent theming
- **Custom Notifications API**: Creates notifications via the inbox service

## Accessibility

- Full keyboard navigation support
- ARIA labels and descriptions
- Screen reader friendly
- Focus management
- High contrast support

## Examples

### In a Header

```tsx
<header className="app-header">
  <div className="header-content">
    <h1>My App</h1>
    <div className="header-actions">
      <Notify size="sm" variant="ghost" />
    </div>
  </div>
</header>
```

### In a Sidebar

```tsx
<aside className="sidebar">
  <nav>
    <ul>
      <li>
        <a href="/dashboard">Dashboard</a>
      </li>
      <li>
        <a href="/settings">Settings</a>
      </li>
    </ul>
  </nav>
  <div className="sidebar-actions">
    <Notify variant="outline" />
  </div>
</aside>
```

### Floating Action Button

```tsx
<div className="fixed bottom-4 right-4">
  <Notify
    size="lg"
    onSuccess={(notification) => {
      // Show toast notification
      showToast('Smart notification created!');
    }}
  />
</div>
```

import { useMemo } from 'react';
import {
  RiBookOpenLine,
  RiCodeSSlashLine,
  RiFlashlightLine,
  RiLinkUnlinkM,
  RiPaletteLine,
  RiPlayFill,
  RiSettings4Line,
  RiUserAddLine,
} from 'react-icons/ri';
import { useLocation } from 'react-router-dom';

export type ContextualSuggestion = {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action: () => void;
  priority: number;
};

export function useContextualHelp(): ContextualSuggestion[] {
  const location = useLocation();

  const suggestions = useMemo((): ContextualSuggestion[] => {
    const currentPath = location.pathname;
    const allSuggestions: ContextualSuggestion[] = [];

    // Workflow-related suggestions
    if (currentPath.includes('/workflows')) {
      allSuggestions.push(
        {
          id: 'understand-steps',
          icon: RiBookOpenLine,
          title: 'Understand steps',
          description: 'What each step does—like Delay, Digest, Email, and when to use them.',
          action: () => window.open('https://docs.novu.co/workflows/steps', '_blank'),
          priority: 10,
        },
        {
          id: 'sprinkle-variables',
          icon: RiCodeSSlashLine,
          title: 'Sprinkle variables',
          description: 'Say hello with {{firstName}}. Personal, but scalable.',
          action: () => window.open('https://docs.novu.co/workflows/variables', '_blank'),
          priority: 9,
        },
        {
          id: 'give-test-run',
          icon: RiPlayFill,
          title: 'Give it a test run',
          description: 'Fire it up! See what happens before your users do.',
          action: () => window.open('https://docs.novu.co/workflows/testing', '_blank'),
          priority: 8,
        }
      );
    }

    // Integration-related suggestions
    if (currentPath.includes('/integrations')) {
      allSuggestions.push({
        id: 'connect-providers',
        icon: RiLinkUnlinkM,
        title: 'Connect providers',
        description: 'Email, SMS, chat—whatever you need to reach users.',
        action: () => window.open('https://docs.novu.co/integrations', '_blank'),
        priority: 10,
      });
    }

    // Subscriber-related suggestions
    if (currentPath.includes('/subscribers')) {
      allSuggestions.push({
        id: 'manage-subscribers',
        icon: RiUserAddLine,
        title: 'Manage subscribers',
        description: 'Add, update, and organize your notification recipients.',
        action: () => window.open('https://docs.novu.co/subscribers', '_blank'),
        priority: 10,
      });
    }

    // Settings-related suggestions
    if (currentPath.includes('/settings')) {
      allSuggestions.push({
        id: 'configure-settings',
        icon: RiSettings4Line,
        title: 'Configure settings',
        description: 'Team management, API keys, and workspace configuration.',
        action: () => window.open('https://docs.novu.co/settings', '_blank'),
        priority: 10,
      });
    }

    // Dashboard-specific suggestions
    if (currentPath.includes('/analytics')) {
      allSuggestions.push({
        id: 'understand-analytics',
        icon: RiFlashlightLine,
        title: 'Understand analytics',
        description: 'Track delivery rates, engagement, and performance metrics.',
        action: () => window.open('https://docs.novu.co/analytics', '_blank'),
        priority: 10,
      });
    }

    // Theme/branding suggestions
    if (currentPath.includes('/branding') || currentPath.includes('/appearance')) {
      allSuggestions.push({
        id: 'customize-branding',
        icon: RiPaletteLine,
        title: 'Customize branding',
        description: 'Make notifications match your brand colors and style.',
        action: () => window.open('https://docs.novu.co/branding', '_blank'),
        priority: 10,
      });
    }

    // Sort by priority (higher priority first)
    return allSuggestions.sort((a, b) => b.priority - a.priority);
  }, [location.pathname]);

  return suggestions;
}

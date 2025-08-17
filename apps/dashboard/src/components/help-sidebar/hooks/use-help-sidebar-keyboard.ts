import { useEffect } from 'react';
import { useTelemetry } from '@/hooks/use-telemetry';
import { TelemetryEvent } from '@/utils/telemetry';
import { useHelpSidebar } from './use-help-sidebar';

export function useHelpSidebarKeyboard() {
  const { toggleHelpSidebar } = useHelpSidebar();
  const track = useTelemetry();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Check for Cmd/Ctrl + ?
      if ((event.metaKey || event.ctrlKey) && event.key === '?') {
        event.preventDefault();

        track(TelemetryEvent.HELP_SIDEBAR_OPENED, {
          trigger: 'keyboard_shortcut',
          source: 'cmd_question_mark',
        });

        toggleHelpSidebar();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleHelpSidebar, track]);
}

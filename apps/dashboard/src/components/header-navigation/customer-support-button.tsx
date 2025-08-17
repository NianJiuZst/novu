import { RiQuestionFill } from 'react-icons/ri';
import { useHelpSidebar } from '@/components/help-sidebar';
import { useTelemetry } from '@/hooks/use-telemetry';
import { TelemetryEvent } from '@/utils/telemetry';
import { HeaderButton } from './header-button';

export const CustomerSupportButton = () => {
  const { openHelpSidebar } = useHelpSidebar();
  const track = useTelemetry();

  function handleClick() {
    track(TelemetryEvent.HELP_SIDEBAR_OPENED, {
      trigger: 'header_button',
      source: 'customer_support_button',
    });

    openHelpSidebar();
  }

  return (
    <button tabIndex={-1} className="flex items-center justify-center" onClick={handleClick}>
      <HeaderButton label="Help">
        <RiQuestionFill className="text-foreground-600 size-4" />
      </HeaderButton>
    </button>
  );
};

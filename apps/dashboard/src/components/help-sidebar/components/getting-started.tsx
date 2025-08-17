import { RiBookOpenLine, RiCodeSSlashLine, RiLinkUnlinkM } from 'react-icons/ri';
import { useOnboardingSteps } from '@/hooks/use-onboarding-steps';

const GETTING_STARTED_ITEMS = [
  {
    id: 'learn-basics',
    icon: RiBookOpenLine,
    title: 'Learn the basics',
    description: 'A quick tour of how Novu does what it does best.',
    action: () => window.open('https://docs.novu.co/getting-started', '_blank'),
  },
  {
    id: 'inbox-component',
    icon: RiCodeSSlashLine,
    title: '<Inbox/> Component',
    description: 'Triggers, delays, emails—mix them like a wizard.',
    action: () => window.open('https://docs.novu.co/inbox/introduction', '_blank'),
  },
  {
    id: 'connect-providers',
    icon: RiLinkUnlinkM,
    title: 'Connect providers',
    description: 'Email, SMS, chat—whatever you need to reach users.',
    action: () => window.open('https://docs.novu.co/integrations/introduction', '_blank'),
  },
];

export function GettingStarted() {
  return (
    <div className="p-4">
      <h3 className="text-sm font-medium text-neutral-900 mb-4">Getting started</h3>
      <div className="space-y-3">
        {GETTING_STARTED_ITEMS.map((item) => {
          return (
            <button
              key={item.id}
              onClick={item.action}
              className="w-full text-left p-3 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-6 h-6 rounded bg-neutral-100 flex items-center justify-center text-neutral-400 text-xs">
                    {item.id === 'learn-basics' && '📚'}
                    {item.id === 'inbox-component' && '△'}
                    {item.id === 'connect-providers' && '📧'}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-neutral-900">{item.title}</div>
                  <div className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{item.description}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

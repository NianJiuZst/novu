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
  const { completedSteps, totalSteps } = useOnboardingSteps();
  const isOnboarding = completedSteps < totalSteps;

  return (
    <div className="p-4 border-b">
      <h3 className="text-sm font-medium text-neutral-900 mb-4">Getting started</h3>
      <div className="space-y-3">
        {GETTING_STARTED_ITEMS.map((item) => {
          const IconComponent = item.icon;

          return (
            <button
              key={item.id}
              onClick={item.action}
              className="w-full text-left p-4 rounded-xl border border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50 transition-all duration-200"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                    <IconComponent className="h-4 w-4 text-neutral-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="text-sm font-medium text-neutral-900 mb-1">{item.title}</div>
                  <div className="text-xs text-neutral-500 leading-relaxed">{item.description}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {isOnboarding && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <div className="text-xs text-blue-700 font-medium">
            Onboarding Progress: {completedSteps}/{totalSteps} steps completed
          </div>
          <div className="mt-2 bg-blue-200 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

import { RiCalendarLine, RiMessage3Line, RiQuestionLine } from 'react-icons/ri';

const FOOTER_ACTIONS = [
  {
    id: 'help-center',
    icon: RiQuestionLine,
    title: 'Help center',
    action: () => window.open('https://docs.novu.co', '_blank'),
  },
  {
    id: 'share-feedback',
    icon: RiMessage3Line,
    title: 'Share feedback',
    action: () => window.open('https://github.com/novuhq/novu/discussions', '_blank'),
  },
  {
    id: 'book-demo',
    icon: RiCalendarLine,
    title: 'Book a demo',
    subtitle: '(Yes, with a real human)',
    action: () => window.open('https://cal.com/team/novu/intro', '_blank'),
  },
];

export function FooterActions() {
  return (
    <div className="p-4 space-y-3">
      {FOOTER_ACTIONS.map((action) => {
        const IconComponent = action.icon;

        return (
          <button
            key={action.id}
            onClick={action.action}
            className="w-full text-left flex items-center gap-3 hover:opacity-70 transition-opacity"
          >
            <IconComponent className="h-4 w-4 text-neutral-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-sm text-neutral-900">{action.title}</span>
              {action.subtitle && <span className="text-sm text-neutral-400 ml-1">{action.subtitle}</span>}
            </div>
          </button>
        );
      })}
    </div>
  );
}

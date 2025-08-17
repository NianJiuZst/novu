import { useTelemetry } from '@/hooks/use-telemetry';
import { TelemetryEvent } from '@/utils/telemetry';
import { useContextualHelp } from '../hooks/use-contextual-help';

export function SuggestionsSection() {
  const suggestions = useContextualHelp();
  const track = useTelemetry();

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="p-3">
      <h3 className="text-sm font-medium text-neutral-900 mb-4">Suggestions</h3>
      <div className="space-y-3">
        {suggestions.map((suggestion) => {
          return (
            <button
              key={suggestion.id}
              onClick={() => {
                track(TelemetryEvent.HELP_SIDEBAR_SUGGESTION_CLICKED, {
                  suggestionId: suggestion.id,
                  suggestionTitle: suggestion.title,
                  source: 'contextual_suggestions',
                });
                suggestion.action();
              }}
              className="w-full text-left p-2 rounded-[16px] hover:bg-neutral-50 transition-colors border border-stroke-soft"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-6 h-6 rounded bg-neutral-100 flex items-center justify-center text-neutral-400 text-xs font-mono">
                    {suggestion.id === 'understand-steps' && '01'}
                    {suggestion.id === 'sprinkle-variables' && '{}'}
                    {suggestion.id === 'give-test-run' && '○'}
                    {suggestion.id === 'connect-providers' && '🔗'}
                    {suggestion.id === 'manage-subscribers' && '👤'}
                    {suggestion.id === 'configure-settings' && '⚙'}
                    {suggestion.id === 'understand-analytics' && '📊'}
                    {suggestion.id === 'customize-branding' && '🎨'}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-neutral-900">{suggestion.title}</div>
                  <div className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{suggestion.description}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

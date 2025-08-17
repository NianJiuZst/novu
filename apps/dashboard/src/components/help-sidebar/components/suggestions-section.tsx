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
    <div className="p-4 border-b">
      <h3 className="text-sm font-medium text-neutral-900 mb-4">Suggestions</h3>
      <div className="space-y-3">
        {suggestions.map((suggestion) => {
          const IconComponent = suggestion.icon;

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
              className="w-full text-left p-4 rounded-xl border border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50 transition-all duration-200"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                    <IconComponent className="h-4 w-4 text-neutral-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="text-sm font-medium text-neutral-900 mb-1">{suggestion.title}</div>
                  <div className="text-xs text-neutral-500 leading-relaxed">{suggestion.description}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

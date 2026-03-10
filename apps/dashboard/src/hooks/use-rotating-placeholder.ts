import { useEffect, useMemo, useState } from 'react';

type UseRotatingPlaceholderOptions = {
  suggestions: string[];
  intervalMs?: number;
  shouldRotate?: boolean;
};

const DEFAULT_ROTATION_INTERVAL_MS = 5000;

export function useRotatingPlaceholder({
  suggestions,
  intervalMs = DEFAULT_ROTATION_INTERVAL_MS,
  shouldRotate = true,
}: UseRotatingPlaceholderOptions) {
  const placeholderSuggestions = useMemo(
    () => suggestions.map((suggestion) => suggestion.trim()).filter((suggestion) => suggestion.length > 0),
    [suggestions]
  );
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);

  useEffect(() => {
    setActiveSuggestionIndex((currentIndex) => {
      if (currentIndex < placeholderSuggestions.length) {
        return currentIndex;
      }

      return 0;
    });
  }, [placeholderSuggestions.length]);

  useEffect(() => {
    if (!shouldRotate || placeholderSuggestions.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveSuggestionIndex((currentIndex) => (currentIndex + 1) % placeholderSuggestions.length);
    }, intervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [intervalMs, placeholderSuggestions.length, shouldRotate]);

  if (placeholderSuggestions.length === 0) {
    return '';
  }

  return placeholderSuggestions[activeSuggestionIndex] ?? placeholderSuggestions[0];
}

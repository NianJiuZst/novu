import { TranslationResponseDto } from '@novu/api/models/components';
import { useCallback, useEffect, useMemo, useState } from 'react';

function escapeControlCharsInJsonStrings(raw: string): string {
  let result = '';
  let inString = false;

  for (let i = 0; i < raw.length; i++) {
    const char = raw[i];

    if (inString) {
      if (char === '\\') {
        result += char;
        i++;
        if (i < raw.length) {
          result += raw[i];
        }
      } else if (char === '"') {
        result += char;
        inString = false;
      } else if (char === '\n') {
        result += '\\n';
      } else if (char === '\r') {
        result += '\\r';
      } else if (char === '\t') {
        result += '\\t';
      } else {
        result += char;
      }
    } else {
      if (char === '"') {
        inString = true;
      }
      result += char;
    }
  }

  return result;
}

export function useTranslationEditor(selectedTranslation: TranslationResponseDto | undefined) {
  const [modifiedContentString, setModifiedContentString] = useState<string | null>(null);
  const [modifiedContent, setModifiedContent] = useState<Record<string, any> | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const originalContent = useMemo(
    () => JSON.stringify(selectedTranslation?.content ?? {}, null, 2),
    [selectedTranslation?.content]
  );

  useEffect(() => {
    setModifiedContentString(null);
    setModifiedContent(null);
    setJsonError(null);
  }, [selectedTranslation?.locale]);

  const handleContentChange = useCallback((newContentString: string) => {
    setModifiedContentString(newContentString);

    try {
      setModifiedContent(JSON.parse(newContentString));
      setJsonError(null);
    } catch {
      try {
        const sanitized = escapeControlCharsInJsonStrings(newContentString);
        setModifiedContent(JSON.parse(sanitized));
        setJsonError(null);
      } catch (innerError) {
        setModifiedContent(null);
        setJsonError(innerError instanceof Error ? innerError.message : 'Invalid JSON format');
      }
    }
  }, []);

  const resetContent = useCallback(() => {
    setModifiedContentString(null);
    setModifiedContent(null);
    setJsonError(null);
  }, []);

  const hasUnsavedChanges =
    !modifiedContentString || !selectedTranslation ? false : modifiedContentString !== originalContent;

  return {
    originalContent,
    modifiedContent,
    modifiedContentString,
    jsonError,
    handleContentChange,
    resetContent,
    hasUnsavedChanges,
  };
}

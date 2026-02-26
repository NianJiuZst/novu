import { TranslationResponseDto } from '@novu/api/models/components';
import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * Fixes JSON strings that contain literal control characters (like newlines, tabs, etc.)
 * by escaping them properly. This handles the case where users press Enter inside
 * a JSON string value, which creates a literal newline that JSON.parse() rejects.
 */
function fixJsonControlCharacters(jsonString: string): string {
  let result = '';
  let inString = false;
  let i = 0;

  while (i < jsonString.length) {
    const char = jsonString[i];
    const prevChar = i > 0 ? jsonString[i - 1] : '';

    // Check if we're entering or exiting a string (but ignore escaped quotes)
    if (char === '"' && prevChar !== '\\') {
      inString = !inString;
      result += char;
      i++;
      continue;
    }

    // If we're inside a string, escape control characters
    if (inString) {
      // Check for literal control characters and escape them
      switch (char) {
        case '\n':
          result += '\\n';
          break;
        case '\r':
          result += '\\r';
          break;
        case '\t':
          result += '\\t';
          break;
        case '\b':
          result += '\\b';
          break;
        case '\f':
          result += '\\f';
          break;
        default:
          result += char;
      }
    } else {
      result += char;
    }

    i++;
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
    // Store the raw string content without any reformatting
    setModifiedContentString(newContentString);

    try {
      // Try to parse the JSON as-is first
      let parsedContent;
      try {
        parsedContent = JSON.parse(newContentString);
      } catch (firstError) {
        // If parsing fails due to control characters in strings (like literal newlines),
        // try to fix common issues by escaping control characters in string values
        const fixedContent = fixJsonControlCharacters(newContentString);
        parsedContent = JSON.parse(fixedContent);
        // Don't update modifiedContentString - keep what the user typed
        // The parsed content will be correctly escaped when saved
      }
      
      setModifiedContent(parsedContent);
      setJsonError(null);
    } catch (error) {
      setModifiedContent(null);
      setJsonError(error instanceof Error ? error.message : 'Invalid JSON format');
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

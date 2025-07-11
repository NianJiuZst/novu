import { useTimeout } from '@mantine/hooks';
import { useState } from 'react';

export function useEditTemplateContent() {
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const { start, clear } = useTimeout(() => setIsPreviewLoading(false), 1000);

  const handleContentChange = (value: string, onChange: (string) => void) => {
    setIsPreviewLoading(true);
    clear();
    onChange(value);
    start();
  };

  return { handleContentChange, isPreviewLoading };
}

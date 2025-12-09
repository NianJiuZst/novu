import { ChatContent, EmailContent, GenerateContentResponse, InAppContent, PushContent, SmsContent } from '@/api/ai';
import { useWorkflowSchema } from '@/components/workflow-editor/workflow-schema-provider';
import { useFeatureFlag } from '@/hooks/use-feature-flag';
import { FeatureFlagsKeysEnum, StepResponseDto, StepTypeEnum, WorkflowResponseDto } from '@novu/shared';
import { useCallback, useMemo, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { v4 as uuidv4 } from 'uuid';
import { useSaveForm } from './save-form-context';

const AI_SUPPORTED_STEP_TYPES = [
  StepTypeEnum.EMAIL,
  StepTypeEnum.SMS,
  StepTypeEnum.PUSH,
  StepTypeEnum.IN_APP,
  StepTypeEnum.CHAT,
];

function inferTypeFromValue(value: unknown): 'string' | 'number' | 'boolean' | 'object' | 'array' {
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object' && value !== null) return 'object';
  return 'string';
}

function getSampleValueForVariable(varName: string): string {
  const lowerName = varName.toLowerCase();
  if (lowerName.includes('url') || lowerName.includes('link')) {
    return 'https://example.com';
  }
  if (lowerName.includes('email')) {
    return 'user@example.com';
  }
  if (lowerName.includes('name') || lowerName.includes('company')) {
    return 'Acme Inc';
  }
  if (lowerName.includes('order') || lowerName.includes('number') || lowerName.includes('id')) {
    return '#12345';
  }
  if (lowerName.includes('amount') || lowerName.includes('price') || lowerName.includes('total')) {
    return '$99.00';
  }
  if (lowerName.includes('date') || lowerName.includes('time')) {
    return new Date().toLocaleDateString();
  }
  return `sample_${varName}`;
}

interface UseAiSuggestionsProps {
  workflow: WorkflowResponseDto;
  step: StepResponseDto;
  editorValue: string;
  setEditorValue: (value: string) => void;
}

export function useAiSuggestions({ workflow, step, editorValue, setEditorValue }: UseAiSuggestionsProps) {
  const form = useFormContext();
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  const { addProperty, getSchemaPropertyByKey, isPayloadSchemaEnabled, handleSaveChanges } = useWorkflowSchema();
  const { saveForm } = useSaveForm();
  const isAiStepGenerationEnabled = useFeatureFlag(FeatureFlagsKeysEnum.IS_AI_STEP_GENERATION_ENABLED);

  const showAiButton = isAiStepGenerationEnabled && AI_SUPPORTED_STEP_TYPES.includes(step.type as StepTypeEnum);

  const watchedSubject = form.watch('subject');
  const watchedBody = form.watch('body');

  const hasExistingContent = useMemo(() => {
    switch (step.type) {
      case StepTypeEnum.EMAIL:
        return !!(watchedSubject || watchedBody);
      case StepTypeEnum.SMS:
      case StepTypeEnum.CHAT:
        return !!watchedBody;
      case StepTypeEnum.PUSH:
        return !!(watchedSubject || watchedBody);
      case StepTypeEnum.IN_APP:
        return !!(watchedSubject || watchedBody);
      default:
        return false;
    }
  }, [watchedSubject, watchedBody, step.type]);

  const handleAiInsert = useCallback(
    async (content: GenerateContentResponse['content'], suggestedPayload?: Record<string, string>) => {
      // Insert content into form
      switch (step.type) {
        case StepTypeEnum.EMAIL:
          if ('subject' in content && 'body' in content) {
            const emailContent = content as EmailContent;
            const bodyStr =
              typeof emailContent.body === 'object' ? JSON.stringify(emailContent.body) : emailContent.body;

            form.setValue('body', '');

            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                form.setValue('subject', emailContent.subject);
                form.setValue('body', bodyStr);
                form.trigger(['subject', 'body']);
              });
            });
          }
          break;
        case StepTypeEnum.SMS:
        case StepTypeEnum.CHAT:
          if ('body' in content) {
            form.setValue('body', (content as SmsContent | ChatContent).body, { shouldDirty: true, shouldTouch: true });
          }
          break;
        case StepTypeEnum.PUSH:
          if ('subject' in content && 'body' in content) {
            const pushContent = content as PushContent;
            form.setValue('subject', pushContent.subject, { shouldDirty: true, shouldTouch: true });
            form.setValue('body', pushContent.body, { shouldDirty: true, shouldTouch: true });
          }
          break;
        case StepTypeEnum.IN_APP:
          if ('body' in content) {
            const inAppContent = content as InAppContent;
            if (inAppContent.subject) {
              form.setValue('subject', inAppContent.subject, { shouldDirty: true, shouldTouch: true });
            }
            form.setValue('body', inAppContent.body, { shouldDirty: true, shouldTouch: true });

            if (inAppContent.primaryAction) {
              form.setValue('primaryAction.label', inAppContent.primaryAction.label, {
                shouldDirty: true,
                shouldTouch: true,
              });
              if (inAppContent.primaryAction.url) {
                form.setValue('primaryAction.redirect.url', inAppContent.primaryAction.url, {
                  shouldDirty: true,
                  shouldTouch: true,
                });
              }
            }

            if (inAppContent.secondaryAction) {
              form.setValue('secondaryAction.label', inAppContent.secondaryAction.label, {
                shouldDirty: true,
                shouldTouch: true,
              });
              if (inAppContent.secondaryAction.url) {
                form.setValue('secondaryAction.redirect.url', inAppContent.secondaryAction.url, {
                  shouldDirty: true,
                  shouldTouch: true,
                });
              }
            }
          }
          break;
      }

      // Merge suggested payload into preview sandbox
      try {
        const currentPayload = JSON.parse(editorValue || '{}');
        const existingPayload = currentPayload.payload || {};

        const payloadToMerge: Record<string, string> = {};
        if (suggestedPayload) {
          for (const [key, value] of Object.entries(suggestedPayload)) {
            if (!key.startsWith('subscriber') && !key.includes('subscriber.')) {
              payloadToMerge[key] = value;
            }
          }
        }

        if (Object.keys(payloadToMerge).length === 0) {
          const contentStr = JSON.stringify(content);
          const payloadVarMatches = contentStr.matchAll(/\{\{payload\.([^}]+)\}\}/g);
          for (const match of payloadVarMatches) {
            const varName = match[1].trim();
            if (!payloadToMerge[varName]) {
              payloadToMerge[varName] = getSampleValueForVariable(varName);
            }
          }
        }

        const newPayloadKeys: Record<string, string> = {};
        for (const [key, value] of Object.entries(payloadToMerge)) {
          if (!(key in existingPayload)) {
            newPayloadKeys[key] = value;
          }
        }

        if (Object.keys(newPayloadKeys).length > 0) {
          const mergedPayload = {
            ...currentPayload,
            payload: {
              ...existingPayload,
              ...newPayloadKeys,
            },
          };
          setEditorValue(JSON.stringify(mergedPayload, null, 2));

          if (isPayloadSchemaEnabled) {
            let hasNewProperties = false;
            for (const [key, value] of Object.entries(newPayloadKeys)) {
              const existingProperty = getSchemaPropertyByKey(key);

              if (!existingProperty) {
                const inferredType = inferTypeFromValue(value);

                addProperty({
                  id: uuidv4(),
                  keyName: key,
                  definition: {
                    type: inferredType,
                    description: `AI-generated payload variable`,
                  },
                  isRequired: false,
                  isNullable: false,
                });
                hasNewProperties = true;
              }
            }

            // Save the schema if we added new properties
            if (hasNewProperties) {
              await handleSaveChanges();
            }
          }
        }
      } catch {
        // If parsing fails, ignore the suggested payload
      }

      setIsAiDialogOpen(false);

      // Save the workflow form with the inserted content
      await saveForm({ forceSubmit: true });
    },
    [
      form,
      step.type,
      editorValue,
      setEditorValue,
      isPayloadSchemaEnabled,
      addProperty,
      getSchemaPropertyByKey,
      handleSaveChanges,
      saveForm,
    ]
  );

  return {
    showAiButton,
    isAiDialogOpen,
    setIsAiDialogOpen,
    hasExistingContent,
    handleAiInsert,
    aiContext: {
      workflowName: workflow.name,
      workflowDescription: workflow.description,
    },
  };
}

import {
  ChatContent,
  EmailContent,
  GenerateContentResponse,
  InAppContent,
  PushContent,
  SmsContent,
} from '@/api/ai';
import { AiSuggestionsDialog } from '@/components/ai-suggestions';
import { IssuesPanel } from '@/components/issues-panel';
import { Button } from '@/components/primitives/button';
import { LocaleSelect } from '@/components/primitives/locale-select';
import { PreviewContextContainer } from '@/components/workflow-editor/steps/context/preview-context-container';
import { StepEditorProvider, useStepEditor } from '@/components/workflow-editor/steps/context/step-editor-context';
import { StepEditorFactory } from '@/components/workflow-editor/steps/editor/step-editor-factory';
import { PanelHeader } from '@/components/workflow-editor/steps/layout/panel-header';
import { ResizableLayout } from '@/components/workflow-editor/steps/layout/resizable-layout';
import { StepPreviewFactory } from '@/components/workflow-editor/steps/preview/step-preview-factory';
import { parseJsonValue } from '@/components/workflow-editor/steps/utils/preview-context.utils';
import { getEditorTitle } from '@/components/workflow-editor/steps/utils/step-utils';
import { TestWorkflowDrawer } from '@/components/workflow-editor/test-workflow/test-workflow-drawer';
import { TranslationStatus } from '@/components/workflow-editor/translation-status';
import { useFeatureFlag } from '@/hooks/use-feature-flag';
import { useFetchTranslationGroup } from '@/hooks/use-fetch-translation-group';
import { useFetchWorkflowTestData } from '@/hooks/use-fetch-workflow-test-data';
import { useIsTranslationEnabled } from '@/hooks/use-is-translation-enabled';
import { LocalizationResourceEnum } from '@/types/translations';
import { cn } from '@/utils/ui';
import { FeatureFlagsKeysEnum, PermissionsEnum, StepResponseDto, StepTypeEnum, WorkflowResponseDto } from '@novu/shared';
import { useCallback, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { RiCodeBlock, RiEdit2Line, RiEyeLine, RiPlayCircleLine, RiSparklingLine } from 'react-icons/ri';
import { useParams } from 'react-router-dom';
import { Protect } from '../../../utils/protect';

const AI_SUPPORTED_STEP_TYPES = [
  StepTypeEnum.EMAIL,
  StepTypeEnum.SMS,
  StepTypeEnum.PUSH,
  StepTypeEnum.IN_APP,
  StepTypeEnum.CHAT,
];

// Generate sample values for common payload variable names
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

type StepEditorLayoutProps = {
  workflow: WorkflowResponseDto;
  step: StepResponseDto;
  className?: string;
};

function StepEditorContent() {
  const { step, isSubsequentLoad, editorValue, setEditorValue, workflow, selectedLocale, setSelectedLocale } = useStepEditor();
  const form = useFormContext();
  const editorTitle = getEditorTitle(step.type);
  const { workflowSlug = '' } = useParams<{ workflowSlug: string }>();
  const [isTestDrawerOpen, setIsTestDrawerOpen] = useState(false);
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  const { testData } = useFetchWorkflowTestData({ workflowSlug });
  const isTranslationsEnabled = useIsTranslationEnabled({
    isTranslationEnabledOnResource: workflow?.isTranslationEnabled ?? false,
  });
  const isAiStepGenerationEnabled = useFeatureFlag(FeatureFlagsKeysEnum.IS_AI_STEP_GENERATION_ENABLED);

  const showAiButton = isAiStepGenerationEnabled && AI_SUPPORTED_STEP_TYPES.includes(step.type as StepTypeEnum);

  const handleAiInsert = useCallback(
    (content: GenerateContentResponse['content'], suggestedPayload?: Record<string, string>) => {
      console.log('handleAiInsert called', { stepType: step.type, content, suggestedPayload });
      
      // Insert content into form
      switch (step.type) {
        case StepTypeEnum.EMAIL:
          if ('subject' in content && 'body' in content) {
            const emailContent = content as EmailContent;
            console.log('Inserting email content:', {
              subject: emailContent.subject,
              bodyType: typeof emailContent.body,
              body: emailContent.body,
            });
            
            const bodyStr = typeof emailContent.body === 'object' ? JSON.stringify(emailContent.body) : emailContent.body;
            console.log('Setting body as:', bodyStr);
            
            // Clear body first
            form.setValue('body', '');
            
            // Use requestAnimationFrame to ensure the clear is processed first
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                form.setValue('subject', emailContent.subject);
                form.setValue('body', bodyStr);
                // Trigger form update to force all fields to re-render
                form.trigger(['subject', 'body']);
                console.log('Form values after insert:', form.getValues());
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
            // Handle primary action
            if (inAppContent.primaryAction) {
              form.setValue('primaryAction.label', inAppContent.primaryAction.label, { shouldDirty: true, shouldTouch: true });
              if (inAppContent.primaryAction.url) {
                form.setValue('primaryAction.redirect.url', inAppContent.primaryAction.url, { shouldDirty: true, shouldTouch: true });
              }
            }
            // Handle secondary action
            if (inAppContent.secondaryAction) {
              form.setValue('secondaryAction.label', inAppContent.secondaryAction.label, { shouldDirty: true, shouldTouch: true });
              if (inAppContent.secondaryAction.url) {
                form.setValue('secondaryAction.redirect.url', inAppContent.secondaryAction.url, { shouldDirty: true, shouldTouch: true });
              }
            }
          }
          break;
      }

      // Merge suggested payload into preview sandbox (only add new keys, don't overwrite existing)
      try {
        const currentPayload = JSON.parse(editorValue || '{}');
        const existingPayload = currentPayload.payload || {};

        // Get payload variables from AI suggestion or extract from content
        // Filter out any subscriber variables that might have been incorrectly included
        let payloadToMerge: Record<string, string> = {};
        if (suggestedPayload) {
          for (const [key, value] of Object.entries(suggestedPayload)) {
            // Skip subscriber variables - they come from subscriber data, not payload
            if (!key.startsWith('subscriber') && !key.includes('subscriber.')) {
              payloadToMerge[key] = value;
            }
          }
        }

        // If AI didn't provide suggestions, extract payload variables from content
        if (Object.keys(payloadToMerge).length === 0) {
          const contentStr = JSON.stringify(content);
          const payloadVarMatches = contentStr.matchAll(/\{\{payload\.([^}]+)\}\}/g);
          for (const match of payloadVarMatches) {
            const varName = match[1].trim();
            if (!payloadToMerge[varName]) {
              // Provide a sample value based on variable name
              payloadToMerge[varName] = getSampleValueForVariable(varName);
            }
          }
        }

        // Only add keys that don't already exist
        const newPayloadKeys: Record<string, string> = {};
        for (const [key, value] of Object.entries(payloadToMerge)) {
          if (!(key in existingPayload)) {
            newPayloadKeys[key] = value;
          }
        }

        // Only update if there are new keys to add
        if (Object.keys(newPayloadKeys).length > 0) {
          const mergedPayload = {
            ...currentPayload,
            payload: {
              ...existingPayload,
              ...newPayloadKeys,
            },
          };
          setEditorValue(JSON.stringify(mergedPayload, null, 2));
        }
      } catch {
        // If parsing fails, ignore the suggested payload
      }

      setIsAiDialogOpen(false);
    },
    [form, step.type, editorValue, setEditorValue]
  );

  // Fetch translation group to get outdated locales status
  const { data: translationGroup } = useFetchTranslationGroup({
    resourceId: workflow.workflowId,
    resourceType: LocalizationResourceEnum.WORKFLOW,
    enabled: isTranslationsEnabled,
  });

  // Extract available locales from translations
  const availableLocales = translationGroup?.locales || [];

  const handleTestWorkflowClick = () => {
    setIsTestDrawerOpen(true);
  };

  const currentPayload = parseJsonValue(editorValue).payload;

  return (
    <ResizableLayout autoSaveId="step-editor-main-layout">
      <ResizableLayout.ContextPanel>
        <PanelHeader icon={RiCodeBlock} title="Preview sandbox" className="py-2">
          <Protect permission={PermissionsEnum.EVENT_WRITE}>
            <Button
              variant="secondary"
              size="2xs"
              mode="gradient"
              leadingIcon={RiPlayCircleLine}
              onClick={handleTestWorkflowClick}
            >
              Test workflow
            </Button>
          </Protect>
        </PanelHeader>
        <div className="bg-bg-weak flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <PreviewContextContainer />
          </div>
        </div>
      </ResizableLayout.ContextPanel>

      <ResizableLayout.Handle />

      <ResizableLayout.MainContentPanel>
        <div className="flex min-h-0 flex-1 flex-col">
          <ResizableLayout autoSaveId="step-editor-content-layout">
            <ResizableLayout.EditorPanel>
              <PanelHeader icon={() => <RiEdit2Line />} title={editorTitle} className="min-h-[45px] py-2">
                <TranslationStatus
                  resourceId={workflow.workflowId}
                  resourceType={LocalizationResourceEnum.WORKFLOW}
                  isTranslationEnabledOnResource={!!workflow.isTranslationEnabled}
                  className="h-7 text-xs"
                />
              </PanelHeader>
              <div className="flex-1 overflow-y-auto">
                <div className="h-full p-3">
                  <StepEditorFactory />
                </div>
              </div>
            </ResizableLayout.EditorPanel>

            <ResizableLayout.Handle />

            <ResizableLayout.PreviewPanel>
              <PanelHeader icon={RiEyeLine} title="Preview" isLoading={isSubsequentLoad} className="min-h-[45px] py-2">
                {isTranslationsEnabled && availableLocales.length > 0 && (
                  <LocaleSelect
                    value={selectedLocale}
                    onChange={setSelectedLocale}
                    placeholder="Select locale"
                    availableLocales={availableLocales}
                    className="h-7 w-auto min-w-[120px] text-xs"
                  />
                )}
              </PanelHeader>
              <div className="flex-1 overflow-hidden">
                <div
                  className="bg-bg-weak relative h-full overflow-y-auto p-3"
                  style={{
                    backgroundImage: 'radial-gradient(circle, hsl(var(--neutral-alpha-100)) 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                  }}
                >
                  <StepPreviewFactory />
                </div>
              </div>
            </ResizableLayout.PreviewPanel>
          </ResizableLayout>
        </div>

        <IssuesPanel issues={step.issues} isTranslationEnabled={workflow.isTranslationEnabled} />
      </ResizableLayout.MainContentPanel>

      <TestWorkflowDrawer
        isOpen={isTestDrawerOpen}
        onOpenChange={setIsTestDrawerOpen}
        testData={testData}
        initialPayload={currentPayload}
      />

      {showAiButton && (
        <>
          <div className="fixed bottom-6 right-6 z-50">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsAiDialogOpen(true);
              }}
              className="flex items-center justify-center gap-1 overflow-hidden rounded-full border border-[#ff884d] py-2 pl-2 pr-2.5 shadow-[0px_18px_88px_-4px_rgba(28,40,64,0.14),0px_1px_2px_0px_rgba(0,0,0,0.05)] transition-all hover:shadow-xl"
              style={{
                background: 'linear-gradient(113.916deg, rgba(0, 0, 0, 0) 12.861%, rgba(0, 0, 0, 0.02) 117.52%), linear-gradient(90deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 1) 100%)',
              }}
            >
              <RiSparklingLine className="size-4" style={{ color: '#ff884d' }} />
              <span
                className="bg-clip-text text-xs font-medium leading-4"
                style={{
                  background: 'linear-gradient(90deg, #ff884d 0%, #f97316 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Compose with AI
              </span>
            </button>
          </div>
          <AiSuggestionsDialog
            open={isAiDialogOpen}
            onOpenChange={setIsAiDialogOpen}
            stepType={step.type as StepTypeEnum}
            context={{
              workflowName: workflow.name,
              workflowDescription: workflow.description,
            }}
            previewPayload={editorValue}
            onInsert={handleAiInsert}
          />
        </>
      )}
    </ResizableLayout>
  );
}

export function StepEditorLayout({ workflow, step, className }: StepEditorLayoutProps) {
  return (
    <div className={cn('h-full w-full', className)}>
      <StepEditorProvider workflow={workflow} step={step}>
        <StepEditorContent />
      </StepEditorProvider>
    </div>
  );
}

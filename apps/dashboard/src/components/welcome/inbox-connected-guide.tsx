import { IEnvironment } from '@novu/shared';
import { RiCheckboxCircleFill, RiLoader3Line } from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

import { useFetchApiKeys } from '@/hooks/use-fetch-api-keys';
import { useTriggerWorkflow } from '@/hooks/use-trigger-workflow';
import { useFirstTriggerDetection } from '@/hooks/use-first-trigger-detection';
import { useTelemetry } from '@/hooks/use-telemetry';
import { ONBOARDING_DEMO_WORKFLOW_ID } from '../../config';
import { useInitDemoWorkflow } from '../../hooks/use-init-demo-workflow';
import { ROUTES } from '../../utils/routes';
import { Button } from '../primitives/button';
import { ToastIcon } from '../primitives/sonner';
import { showToast } from '../primitives/sonner-helpers';
import { TelemetryEvent } from '@/utils/telemetry';
import {
  createNodeJsSnippet,
  createCurlSnippet,
  createPhpSnippet,
  createGoSnippet,
  createPythonSnippet,
  type CodeSnippet,
} from '@/utils/code-snippets';
import { CodeBlock, type Language } from '../primitives/code-block';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../primitives/tabs';
import { TimelineContainer, TimelineStep } from '../primitives/timeline';
import { InlineToast } from '../primitives/inline-toast';


type InboxConnectedGuideProps = {
  subscriberId: string;
  environment: IEnvironment;
};

type CodeLanguage = 'curl' | 'nodejs' | 'php' | 'go' | 'python';

function generateCodeSnippet(language: CodeLanguage, userId: string, apiKey: string): string {
  if (!apiKey) {
    throw new Error('API key not found');
  }

  const snippetProps: CodeSnippet = {
    identifier: ONBOARDING_DEMO_WORKFLOW_ID,
    to: { subscriberId: userId },
    payload: '{}',
    secretKey: apiKey,
  };

  switch (language) {
    case 'curl':
      return createCurlSnippet(snippetProps);
    case 'nodejs':
      return createNodeJsSnippet(snippetProps);
    case 'php':
      return createPhpSnippet(snippetProps);
    case 'go':
      return createGoSnippet(snippetProps);
    case 'python':
      return createPythonSnippet(snippetProps);
    default:
      return '';
  }
}

interface InstructionStepProps {
  index: number;
  title: string;
  children?: React.ReactNode;
  code?: string;
  codeTitle?: string;
  codeLanguage?: Language;
}

function InstructionStep({
  index,
  title,
  children,
  code,
  codeTitle,
  codeLanguage = 'shell',
}: InstructionStepProps) {
  return (
    <TimelineStep index={index} title={title} description={children as string}>
      {code && (
        <div className="mt-3">
          <CodeBlock code={code} language={codeLanguage} title={codeTitle} />
        </div>
      )}
    </TimelineStep>
  );
}

function TriggerStepContent() {
  return (
    <>
      <div className="text-foreground-400 mb-3 text-xs">
        A trigger is the starting point of every workflow — an action or event that kicks it off. To initiate this, you
        call the Novu API using workflow_id.
      </div>
    </>
  );
}

function WorkflowIntegrationSteps({ userId, apiKey }: { userId: string; apiKey: string }) {

  return (
    <Tabs defaultValue="nodejs" className="w-full">
      <TabsList className="w-full !border-t-0" variant="regular">
        <TabsTrigger value="nodejs" variant="regular" size="xl">
          NodeJS
        </TabsTrigger>
        <TabsTrigger value="shell" variant="regular" size="xl">
          cURL
        </TabsTrigger>
        <TabsTrigger value="php" variant="regular" size="xl">
          PHP
        </TabsTrigger>
        <TabsTrigger value="go" variant="regular" size="xl">
          Golang
        </TabsTrigger>
        <TabsTrigger value="python" variant="regular" size="xl">
          Python
        </TabsTrigger>
      </TabsList>

      <TabsContent value="nodejs" className="mt-5">
        <TimelineContainer>
          <InstructionStep
            index={0}
            title="Install @novu/api"
            code="npm install @novu/api"
            codeTitle="Terminal"
          >
            The npm package to use with novu and node.js.
          </InstructionStep>

          <InstructionStep
            index={1}
            title="Add trigger code to your application"
            code={generateCodeSnippet('nodejs', userId, apiKey)}
            codeLanguage="typescript"
            codeTitle="index.ts"
          >
            <TriggerStepContent />
          </InstructionStep>
        </TimelineContainer>
      </TabsContent>

      <TabsContent value="shell" className="mt-5">
        <TimelineContainer>
          <InstructionStep
            index={0}
            title="Trigger from your terminal"
            code={generateCodeSnippet('curl', userId, apiKey)}
            codeLanguage="shell"
          >
            <TriggerStepContent />
          </InstructionStep>
        </TimelineContainer>
      </TabsContent>

      <TabsContent value="php" className="mt-5">
        <TimelineContainer>
          <InstructionStep
            index={0}
            title="Install"
            code='composer require "novuhq/novu"'
            codeTitle="Terminal"
          />

          <InstructionStep
            index={1}
            title="Add trigger code to your application"
            code={generateCodeSnippet('php', userId, apiKey)}
            codeTitle="index.php"
            codeLanguage="php"
          >
            <TriggerStepContent />
          </InstructionStep>
        </TimelineContainer>
      </TabsContent>

      <TabsContent value="python" className="mt-5">
        <TimelineContainer>
          <InstructionStep index={0} title="Install" code="pip install novu" codeTitle="Terminal" />

          <InstructionStep
            index={1}
            title="Add trigger code to your application"
            code={generateCodeSnippet('python', userId, apiKey)}
            codeLanguage="python"
          >
            <TriggerStepContent />
          </InstructionStep>
        </TimelineContainer>
      </TabsContent>

      <TabsContent value="go" className="mt-5">
        <TimelineContainer>
          <InstructionStep
            index={0}
            title="Install"
            code="go get github.com/novuhq/novu-go"
            codeTitle="Terminal"
          />

          <InstructionStep
            index={1}
            title="Add trigger code to your application"
            code={generateCodeSnippet('go', userId, apiKey)}
            codeLanguage="go"
          >
            <TriggerStepContent />
          </InstructionStep>
        </TimelineContainer>
      </TabsContent>
    </Tabs>
  );
}

function showStatusToast(variant: 'success' | 'error', message: string) {
  showToast({
    children: () => (
      <>
        <ToastIcon variant={variant} />
        <span className="text-sm">{message}</span>
      </>
    ),
    options: {
      position: 'bottom-center',
      style: {
        left: '50%',
        transform: 'translateX(-50%)',
      },
    },
  });
}

export function InboxConnectedGuide({ subscriberId, environment }: InboxConnectedGuideProps) {
  const navigate = useNavigate();
  const telemetry = useTelemetry();
  const { triggerWorkflow, isPending } = useTriggerWorkflow(environment);
  useInitDemoWorkflow(environment);
  const apiKeysQuery = useFetchApiKeys();
  const apiKeys = apiKeysQuery.data?.data ?? [];
  const apiKey = apiKeys[0]?.key ?? '';
  const hasValidApiKey = !apiKeysQuery.isLoading && !apiKeysQuery.error && apiKey;

  // First trigger detection
  const {
    hasDetectedFirstTrigger,
    isWaitingForTrigger,
    startWaiting,
    workflowSlug,
  } = useFirstTriggerDetection({
    enabled: true,
    onFirstTriggerDetected: () => {
      showStatusToast('success', 'API trigger detected');
    },
  });



  // Auto-start waiting when component mounts and API key is available
  useEffect(() => {
    if (hasValidApiKey && !hasDetectedFirstTrigger && !isWaitingForTrigger) {
      // Add a small delay to avoid immediate polling
      const timer = setTimeout(() => {
        startWaiting();
      }, 2000); // Increased delay to 2 seconds
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [hasValidApiKey, hasDetectedFirstTrigger, isWaitingForTrigger, workflowSlug, startWaiting]);



  function handleCompleteOnboarding() {
    telemetry(TelemetryEvent.INBOX_ONBOARDING_COMPLETED);
    navigate(ROUTES.WELCOME);
  }

  return (
    <>
      <div className="flex flex-col pl-[72px]">
        {/* Combined section with left content and right code snippets */}
        <div className="relative p-8 pb-12 pt-16">
          <div className="absolute left-1 top-0 bottom-0 w-px bg-[#eeeef0]"></div>
          <div className="relative mt-8 flex gap-8 first:mt-0">
            {/* Left side - both status sections stacked */}
            <div className="flex w-[350px] flex-col gap-8">
              {/* First section - Inbox connected */}
              <div className="relative flex gap-8">
                <div className="absolute -left-[38px] flex h-5 w-5 items-center justify-center rounded-full bg-white">
                  <RiCheckboxCircleFill className="text-success h-4 w-4" />
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-success text-sm font-medium">In-App Channel Integration Activated</span>
                  </div>
                  <p className="text-foreground-400 text-xs">
                    You've initilized your Inbox. The last step is to make an API call to confirm everything is working.
                  </p>
                </div>
              </div>

              {/* Second section - Waiting for trigger */}
              <div className="relative flex gap-8">
                <div className="absolute -left-[38px] flex h-5 w-5 items-center justify-center rounded-full bg-white">
                  {hasDetectedFirstTrigger ? (
                    <RiCheckboxCircleFill className="text-success h-4 w-4" />
                  ) : (
                    <RiLoader3Line className="h-4 w-4 text-primary animate-spin" />
                  )}
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {hasDetectedFirstTrigger 
                        ? "Ready to complete onboarding" 
                        : "Waiting for your first API trigger..."
                      }
                    </span>
                  </div>
                  <p className="text-foreground-400 text-xs">
                    {hasDetectedFirstTrigger 
                      ? "Great! We detected your API trigger. Click the button to complete your onboarding." 
                      : "Copy and run the code snippet below to trigger your first notification. We'll detect it automatically."
                    }
                  </p>
                  
                  {/* Complete onboarding button - positioned under the waiting text */}
                  <div className="flex justify-start mt-4">
                    <Button
                      onClick={handleCompleteOnboarding}
                      disabled={!hasDetectedFirstTrigger}
                      variant="primary"
                      className={`px-6 py-2 ${
                        !hasDetectedFirstTrigger 
                          ? 'cursor-not-allowed bg-gray-800 text-white border-gray-900 hover:bg-gray-800' 
                          : ''
                      }`}
                    >
                      <RiCheckboxCircleFill className="mr-2 h-4 w-4" />
                      Complete Onboarding
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - code snippets spanning full height */}
            <div className="flex w-[520px] flex-col gap-6 -mt-4">
              {apiKeysQuery.isLoading ? (
                <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-8">
                  <div className="flex items-center justify-center gap-3 text-gray-600">
                    <RiLoader3Line className="h-5 w-5 animate-spin" />
                    <span>Loading API key...</span>
                  </div>
                </div>
              ) : apiKeysQuery.error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-6">
                  <div className="flex flex-col gap-3 text-center">
                    <div className="text-red-600 font-medium">⚠️ Error loading API key</div>
                    <div className="text-gray-600 text-sm">
                      Please check your connection and{' '}
                      <button 
                        onClick={() => apiKeysQuery.refetch()}
                        className="text-blue-600 underline hover:text-blue-700 font-medium"
                      >
                        try again
                      </button>
                    </div>
                  </div>
                </div>
              ) : !apiKey ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
                  <div className="flex flex-col gap-3 text-center">
                    <div className="text-amber-600 font-medium">⚠️ No API key found</div>
                    <div className="text-gray-600 text-sm">
                      Please generate an API key in your{' '}
                      <a 
                        href="/settings" 
                        className="text-blue-600 underline hover:text-blue-700 font-medium"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        settings
                      </a>{' '}
                      first.
                    </div>
                  </div>
                </div>
              ) : (
                <WorkflowIntegrationSteps userId={subscriberId} apiKey={apiKey} />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

import { RouteFill } from '@/components/icons/route-fill';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/primitives/breadcrumb';
import { Button } from '@/components/primitives/button';
import { CompactButton } from '@/components/primitives/button-compact';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTrigger } from '@/components/primitives/dialog';
import { Form, FormRoot } from '@/components/primitives/form/form';
import { WorkflowResults } from '@/components/template-store/components/workflow-results';
import { getTemplates } from '@/components/template-store/templates';
import { IWorkflowSuggestion } from '@/components/template-store/templates/types';
import { WorkflowMode } from '@/components/template-store/types';
import { WorkflowSidebar } from '@/components/template-store/workflow-sidebar';
import TruncatedText from '@/components/truncated-text';
import { CreateWorkflowForm } from '@/components/workflow-editor/create-workflow-form';
import { workflowSchema } from '@/components/workflow-editor/schema';
import { WorkflowCanvas } from '@/components/workflow-editor/workflow-canvas';
import { useCreateWorkflow } from '@/hooks/use-create-workflow';
import { useTelemetry } from '@/hooks/use-telemetry';
import { buildRoute, ROUTES } from '@/utils/routes';
import { TelemetryEvent } from '@/utils/telemetry';
import { ComponentProps, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { RiArrowLeftSLine } from 'react-icons/ri';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { z } from 'zod';

const WORKFLOW_TEMPLATES = getTemplates();

export type WorkflowTemplateModalProps = ComponentProps<typeof DialogTrigger> & {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  source?: string;
  selectedTemplate?: IWorkflowSuggestion;
};

export function WorkflowTemplateModal(props: WorkflowTemplateModalProps) {
  const form = useForm();
  const track = useTelemetry();
  const navigate = useNavigate();
  const { environmentSlug } = useParams();
  const [searchParams] = useSearchParams();
  const { submit: createFromTemplate, isLoading: isCreating } = useCreateWorkflow();
  const [selectedCategory, setSelectedCategory] = useState<string>('popular');
  const [suggestions, setSuggestions] = useState<IWorkflowSuggestion[]>([]);
  const [mode, setMode] = useState<WorkflowMode>(WorkflowMode.TEMPLATES);
  const [internalSelectedTemplate, setInternalSelectedTemplate] = useState<IWorkflowSuggestion | null>(null);

  const selectedTemplate = props.selectedTemplate ?? internalSelectedTemplate;

  const filteredTemplates = WORKFLOW_TEMPLATES.filter((template) => {
    if (selectedCategory === 'popular') {
      return template.isPopular;
    }

    if (selectedCategory === 'stripe') {
      return template.workflowDefinition.tags?.includes('stripe');
    }

    return template.category === selectedCategory;
  });
  const templates = suggestions.length > 0 ? suggestions : filteredTemplates;

  useEffect(() => {
    if (props.open) {
      track(TelemetryEvent.TEMPLATE_MODAL_OPENED, {
        source: searchParams.get('source') || 'unknown',
      });
    }
  }, [props.open, track, searchParams]);

  useEffect(() => {
    if (props.selectedTemplate) {
      setInternalSelectedTemplate(props.selectedTemplate);
    }
  }, [props.selectedTemplate]);

  const handleCreateWorkflow = async (values: z.infer<typeof workflowSchema>) => {
    if (!selectedTemplate) return;

    await createFromTemplate(values, selectedTemplate.workflowDefinition);
    track(TelemetryEvent.CREATE_WORKFLOW_FROM_TEMPLATE, {
      templateId: selectedTemplate.id,
      templateName: selectedTemplate.name,
      category: selectedCategory,
    });
  };

  const getHeaderText = () => {
    if (selectedTemplate) {
      return selectedTemplate.name;
    }

    if (mode === WorkflowMode.GENERATE) {
      return 'AI Suggested workflows';
    }

    if (mode === WorkflowMode.FROM_PROMPT) {
      return 'Scaffold your workflow';
    }

    if (mode === WorkflowMode.TEMPLATES) {
      if (selectedCategory === 'stripe') {
        return (
          <div className="flex items-center gap-1.5">
            <span>Billing (with</span>
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 20 20"
                fill="none"
                className="text-gray-700"
              >
                <path
                  d="M1.79497 3.98005C1.25 5.04961 1.25 6.44974 1.25 9.25V10.75C1.25 13.5503 1.25 14.9504 1.79497 16.02C2.27433 16.9608 3.03924 17.7257 3.98005 18.205C5.04961 18.75 6.44974 18.75 9.25 18.75H10.75C13.5503 18.75 14.9504 18.75 16.02 18.205C16.9608 17.7257 17.7257 16.9608 18.205 16.02C18.75 14.9504 18.75 13.5503 18.75 10.75V9.25C18.75 6.44974 18.75 5.04961 18.205 3.98005C17.7257 3.03924 16.9608 2.27433 16.02 1.79497C14.9504 1.25 13.5503 1.25 10.75 1.25H9.25C6.44974 1.25 5.04961 1.25 3.98005 1.79497C3.03924 2.27433 2.27433 3.03924 1.79497 3.98005Z"
                  fill="url(#title_paint0_linear_14649_553430)"
                />
                <path
                  d="M1.41576 5.1744C1.25 6.11645 1.25 7.36643 1.25 9.24967V10.7497C1.25 13.5499 1.25 14.9501 1.79497 16.0196C2.27433 16.9604 3.03924 17.7253 3.98005 18.2047C5.04961 18.7497 6.44974 18.7497 9.25 18.7497H10.75C13.5503 18.7497 14.9504 18.7497 16.02 18.2047C16.9608 17.7253 17.7257 16.9604 18.205 16.0196C18.75 14.9501 18.75 13.5499 18.75 10.7497V9.24967C18.75 6.4494 18.75 5.04927 18.205 3.97971C17.7423 3.07164 17.0136 2.32744 16.1175 1.8457L1.41576 5.1744Z"
                  fill="url(#title_paint1_linear_14649_553430)"
                />
                <path
                  d="M18.569 14.9092C18.4886 15.3315 18.3726 15.6916 18.205 16.0203C17.7257 16.9612 16.9608 17.7261 16.02 18.2054C14.9824 18.7341 13.6338 18.7499 10.9977 18.7504H10.0366V16.7734L18.569 14.9092Z"
                  fill="url(#title_paint2_linear_14649_553430)"
                />
                <path
                  d="M10.75 1.25H9.24999C8.7052 1.25 8.2134 1.25 7.76672 1.25401V3.73157L16.1159 1.84516C16.0841 1.8281 16.0521 1.81136 16.0199 1.79497C15.4262 1.49243 14.7305 1.35784 13.75 1.29797C12.9643 1.25 11.9957 1.25 10.75 1.25Z"
                  fill="url(#title_paint3_linear_14649_553430)"
                />
                <path
                  d="M18.75 10.858C18.7499 12.7365 18.7466 13.9747 18.5689 14.9084L15.6014 15.5568V11.1346L18.75 10.4023V10.858Z"
                  fill="url(#title_paint4_linear_14649_553430)"
                />
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M9.33813 8.36143C9.33813 7.95976 9.66653 7.80527 10.2105 7.80527C10.9904 7.80527 11.9756 8.04215 12.7556 8.46442V6.04408C11.9038 5.7042 11.0622 5.57031 10.2105 5.57031C8.12715 5.57031 6.7417 6.66204 6.7417 8.48502C6.7417 11.3276 10.6415 10.8745 10.6415 12.1001C10.6415 12.5739 10.231 12.7283 9.65627 12.7283C8.80448 12.7283 7.71664 12.3782 6.85459 11.9044V14.3556C7.80901 14.7676 8.77369 14.9427 9.65627 14.9427C11.7909 14.9427 13.2584 13.8819 13.2584 12.0383C13.2482 8.96909 9.33813 9.51495 9.33813 8.36143Z"
                  fill="white"
                />
                <defs>
                  <linearGradient
                    id="title_paint0_linear_14649_553430"
                    x1="1.25"
                    y1="1.25"
                    x2="6.99791"
                    y2="5.31381"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stop-color="#392993" />
                    <stop offset="1" stop-color="#4B47B9" />
                  </linearGradient>
                  <linearGradient
                    id="title_paint1_linear_14649_553430"
                    x1="1.909"
                    y1="5.35871"
                    x2="14.5979"
                    y2="15.8253"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stop-color="#594BB9" />
                    <stop offset="1" stop-color="#60A8F2" />
                  </linearGradient>
                  <linearGradient
                    id="title_paint2_linear_14649_553430"
                    x1="10.0366"
                    y1="16.8466"
                    x2="18.75"
                    y2="18.7504"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stop-color="#61A2EF" />
                    <stop offset="1" stop-color="#58E6FD" />
                  </linearGradient>
                  <linearGradient
                    id="title_paint3_linear_14649_553430"
                    x1="7.76672"
                    y1="2.49477"
                    x2="18.75"
                    y2="1.25"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stop-color="#534EBE" />
                    <stop offset="1" stop-color="#6875E2" />
                  </linearGradient>
                  <linearGradient
                    id="title_paint4_linear_14649_553430"
                    x1="15.6014"
                    y1="11.1712"
                    x2="18.75"
                    y2="14.9421"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stop-color="#71A5F3" />
                    <stop offset="1" stop-color="#6CC3FA" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span>Stripe webhooks)</span>
          </div>
        );
      }

      return `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} workflows`;
    }

    return '';
  };

  const handleTemplateClick = (template: IWorkflowSuggestion) => {
    setInternalSelectedTemplate(template);
  };

  const handleBackClick = () => {
    navigate(buildRoute(ROUTES.TEMPLATE_STORE, { environmentSlug: environmentSlug || '' }));
    setInternalSelectedTemplate(null);
    setMode(WorkflowMode.TEMPLATES);
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setSuggestions([]);
    setMode(WorkflowMode.TEMPLATES);
    track(TelemetryEvent.TEMPLATE_CATEGORY_SELECTED, {
      category,
    });
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogTrigger asChild {...props} />

      <DialogContent className="w-full max-w-[1240px] gap-0 p-0" id="workflow-templates-modal">
        <DialogHeader className="border-stroke-soft flex flex-row items-center gap-1 border-b p-3">
          {selectedTemplate ? (
            <CompactButton size="md" variant="ghost" onClick={handleBackClick} icon={RiArrowLeftSLine}></CompactButton>
          ) : null}
          <Breadcrumb className="!mt-0">
            <BreadcrumbList>
              {selectedTemplate && (
                <>
                  <BreadcrumbItem onClick={handleBackClick} className="flex items-center gap-1 hover:cursor-pointer">
                    Templates
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              )}
              <BreadcrumbItem>
                <BreadcrumbPage className="flex items-center gap-1">
                  <RouteFill className="size-4" />
                  <div className="flex max-w-[32ch]">
                    <TruncatedText>{getHeaderText()}</TruncatedText>
                  </div>
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </DialogHeader>
        <div className={`flex ${selectedTemplate ? 'min-h-[600px]' : 'min-h-[640px]'}`}>
          {!selectedTemplate && (
            <WorkflowSidebar selectedCategory={selectedCategory} onCategorySelect={handleCategorySelect} mode={mode} />
          )}

          <div className="w-full flex-1 overflow-auto">
            {!selectedTemplate ? (
              <div className="p-3">
                <Form {...form}>
                  <FormRoot>
                    <div className="mb-1.5 flex items-center justify-between">
                      <h2 className="text-label-md text-strong">{getHeaderText()}</h2>
                    </div>

                    <WorkflowResults mode={mode} suggestions={templates} onClick={handleTemplateClick} />
                  </FormRoot>
                </Form>
              </div>
            ) : (
              <div className="flex h-full w-full gap-4">
                <div className="flex-1">
                  <WorkflowCanvas
                    readOnly
                    steps={
                      selectedTemplate.workflowDefinition.steps.map((step) => ({
                        _id: null,
                        slug: null,
                        stepId: step.name,
                        controls: {
                          values: step.controlValues ?? {},
                        },
                        ...step,
                      })) as any
                    }
                  />
                </div>
                <div className="border-stroke-soft w-full max-w-[300px] border-l p-3">
                  <CreateWorkflowForm onSubmit={handleCreateWorkflow} template={selectedTemplate.workflowDefinition} />
                </div>
              </div>
            )}
          </div>
        </div>

        {selectedTemplate && (
          <DialogFooter className="border-stroke-soft !mx-0 border-t !p-1.5">
            <Button className="ml-auto" mode="gradient" type="submit" form="create-workflow" isLoading={isCreating}>
              Create workflow
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

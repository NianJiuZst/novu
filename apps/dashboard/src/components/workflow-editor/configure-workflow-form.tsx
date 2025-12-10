import { zodResolver } from '@hookform/resolvers/zod';
import {
  EnvironmentTypeEnum,
  MAX_DESCRIPTION_LENGTH,
  PermissionsEnum,
  ResourceOriginEnum,
  UpdateWorkflowDto,
  WorkflowResponseDto,
} from '@novu/shared';
import { ChevronsUpDown, FilesIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  RiAddLine,
  RiArrowRightSLine,
  RiCodeSSlashLine,
  RiDeleteBin2Line,
  RiListView,
  RiMore2Fill,
  RiSettingsLine,
} from 'react-icons/ri';

import { Link, useNavigate } from 'react-router-dom';
import type { ExternalToast } from 'sonner';
import { z } from 'zod';
import { ConfirmationModal } from '@/components/confirmation-modal';
import { DeleteWorkflowDialog } from '@/components/delete-workflow-dialog';
import { RouteFill } from '@/components/icons/route-fill';
import { PageMeta } from '@/components/page-meta';
import { PAUSE_MODAL_TITLE, PauseModalDescription } from '@/components/pause-workflow-dialog';
import { Badge, Dot as BadgeDot } from '@/components/primitives/badge';
import { Button } from '@/components/primitives/button';
import { CompactButton } from '@/components/primitives/button-compact';
import { CopyButton } from '@/components/primitives/copy-button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/primitives/dropdown-menu';
import { Form, FormField, FormItem, FormMessage, FormRoot } from '@/components/primitives/form/form';
import { Input } from '@/components/primitives/input';
import { Separator } from '@/components/primitives/separator';
import { ToastIcon } from '@/components/primitives/sonner';
import { showToast } from '@/components/primitives/sonner-helpers';
import { Switch } from '@/components/primitives/switch';
import { TagInput } from '@/components/primitives/tag-input';
import { Textarea } from '@/components/primitives/textarea';
import { usePromotionalBanner } from '@/components/promotional/coming-soon-banner';
import { SidebarContent, SidebarHeader } from '@/components/side-navigation/sidebar';
import { workflowSchema } from '@/components/workflow-editor/schema';
import { UpdateWorkflowFn } from '@/components/workflow-editor/workflow-provider';
import { useEnvironment } from '@/context/environment/hooks';
import { useDeleteWorkflow } from '@/hooks/use-delete-workflow';
import { useFormAutosave } from '@/hooks/use-form-autosave';
import { useSyncWorkflow } from '@/hooks/use-sync-workflow';
import { useTags } from '@/hooks/use-tags';
import { LocalizationResourceEnum } from '@/types/translations';
import { Protect } from '@/utils/protect';
import { buildRoute, ROUTES } from '@/utils/routes';
import { TelemetryEvent } from '@/utils/telemetry';
import { cn } from '@/utils/ui';
import { PayloadSchemaDrawer } from './payload-schema-drawer';
import { TranslationToggleSection } from './translation-toggle-section';

interface ConfigureWorkflowFormProps {
  workflow: WorkflowResponseDto;
  update: UpdateWorkflowFn;
}

const toastOptions: ExternalToast = {
  position: 'bottom-right',
  classNames: {
    toast: 'mb-4 right-0',
  },
};

export const ConfigureWorkflowForm = (props: ConfigureWorkflowFormProps) => {
  const { workflow, update } = props;
  const navigate = useNavigate();
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPayloadSchemaDrawerOpen, setIsPayloadSchemaDrawerOpen] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);

  const { tags } = useTags();
  const { currentEnvironment } = useEnvironment();
  const { isSyncable, PromoteConfirmModal } = useSyncWorkflow(workflow);

  const { show: showComingSoonBanner } = usePromotionalBanner({
    content: {
      title: '🚧 Export to Code is on the way!',
      description:
        'With Export to Code, you can design workflows in the GUI and switch to code anytime you need more control and flexibility.',
      feedbackQuestion: "Sounds like a feature you'd need?",
      telemetryEvent: TelemetryEvent.EXPORT_TO_CODE_BANNER_REACTION,
    },
  });

  const isReadOnly =
    workflow.origin === ResourceOriginEnum.EXTERNAL || currentEnvironment?.type !== EnvironmentTypeEnum.DEV;

  const { deleteWorkflow, isPending: isDeleteWorkflowPending } = useDeleteWorkflow({
    onSuccess: () => {
      showToast({
        children: () => (
          <>
            <ToastIcon variant="success" />
            <span className="text-sm">
              Deleted workflow <span className="font-bold">{workflow.name}</span>.
            </span>
          </>
        ),
        options: toastOptions,
      });
      navigate(ROUTES.WORKFLOWS);
    },
    onError: () => {
      showToast({
        children: () => (
          <>
            <ToastIcon variant="error" />
            <span className="text-sm">
              Failed to delete workflow <span className="font-bold">{workflow.name}</span>.
            </span>
          </>
        ),
        options: toastOptions,
      });
    },
  });

  const onDeleteWorkflow = async () => {
    await deleteWorkflow({
      workflowSlug: workflow.slug,
    });
  };

  const form = useForm<z.infer<typeof workflowSchema>>({
    defaultValues: {
      active: workflow.active,
      name: workflow.name,
      workflowId: workflow.workflowId,
      description: workflow.description,
      tags: workflow.tags,
      isTranslationEnabled: workflow.isTranslationEnabled,
    },
    resolver: zodResolver(workflowSchema),
    shouldFocusError: false,
  });

  const { onBlur, saveForm } = useFormAutosave({
    previousData: workflow,
    form,
    isReadOnly,
    save: (data) => update(data as UpdateWorkflowDto),
    shouldClientValidate: true,
  });

  const onPauseWorkflow = (active: boolean) => {
    form.setValue('active', active, { shouldValidate: true, shouldDirty: true });
    saveForm();
  };

  function handleExportToCode() {
    showComingSoonBanner();
  }

  const handleSavePayloadSchema = useCallback(() => {
    showToast({
      children: () => (
        <>
          <ToastIcon variant="success" />
          <span className="text-sm">Payload schema updated.</span>
        </>
      ),
      options: toastOptions,
    });
  }, []);

  const isDuplicable = useMemo(() => workflow.origin === ResourceOriginEnum.NOVU_CLOUD, [workflow.origin]);

  return (
    <>
      <ConfirmationModal
        open={isPauseModalOpen}
        onOpenChange={setIsPauseModalOpen}
        onConfirm={() => {
          onPauseWorkflow(false);
          setIsPauseModalOpen(false);
        }}
        title={PAUSE_MODAL_TITLE}
        description={<PauseModalDescription workflowName={workflow.name} />}
        confirmButtonText="Proceed"
      />
      <DeleteWorkflowDialog
        workflow={workflow}
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={onDeleteWorkflow}
        isLoading={isDeleteWorkflowPending}
      />
      <PayloadSchemaDrawer
        workflow={workflow}
        isOpen={isPayloadSchemaDrawerOpen}
        onOpenChange={setIsPayloadSchemaDrawerOpen}
        onSave={handleSavePayloadSchema}
        readOnly={isReadOnly}
      />
      <PageMeta title={workflow.name} />
      <motion.div
        className={cn('relative flex h-full w-full flex-col')}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0.1 }}
        transition={{ duration: 0.1 }}
      >
        <SidebarHeader className="items-center border-b py-3 text-sm font-medium">
          <div className="flex items-center gap-1">
            <RouteFill />
            <span>Configure workflow</span>
          </div>
          {/**
           * Needs modal={false} to prevent the click freeze after the modal is closed
           */}
          <Protect permission={PermissionsEnum.WORKFLOW_WRITE}>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <CompactButton size="md" icon={RiMore2Fill} variant="ghost" className="ml-auto">
                  <span className="sr-only">More</span>
                </CompactButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuGroup>
                  {isSyncable && (
                    <DropdownMenuItem onClick={handleExportToCode}>
                      <RiCodeSSlashLine />
                      Export to Code
                    </DropdownMenuItem>
                  )}
                  {isDuplicable && currentEnvironment?.type === EnvironmentTypeEnum.DEV && (
                    <Link
                      to={buildRoute(ROUTES.WORKFLOWS_DUPLICATE, {
                        environmentSlug: currentEnvironment?.slug ?? '',
                        workflowId: workflow.workflowId,
                      })}
                    >
                      <DropdownMenuItem className="cursor-pointer">
                        <FilesIcon />
                        Duplicate workflow
                      </DropdownMenuItem>
                    </Link>
                  )}
                </DropdownMenuGroup>
                {currentEnvironment?.type === EnvironmentTypeEnum.DEV && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup className="*:cursor-pointer">
                      <DropdownMenuItem
                        className="text-destructive"
                        disabled={workflow.origin === ResourceOriginEnum.EXTERNAL}
                        onClick={() => {
                          setIsDeleteModalOpen(true);
                        }}
                      >
                        <RiDeleteBin2Line />
                        Delete workflow
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </Protect>
          <PromoteConfirmModal />
        </SidebarHeader>
        <Form {...form}>
          <FormRoot onBlur={onBlur}>
            <SidebarContent size="md" className="space-y-2 py-2">
              {/* STATUS Section */}
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem>
                    <div className="group flex items-center justify-between">
                      <span className="text-text-soft font-code text-xs font-medium">STATUS</span>
                      <div className="flex items-center gap-3">
                        {field.value ? (
                          <motion.div
                            initial={false}
                            animate={{
                              scale: [1, 1.02, 1],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            }}
                          >
                            <Badge
                              variant="light"
                              color="green"
                              size="md"
                              className="bg-success-lighter text-success-base gap-1.5"
                            >
                              <BadgeDot />
                              <span className="font-code text-xs uppercase text-success">Active</span>
                            </Badge>
                          </motion.div>
                        ) : (
                          <Badge variant="light" color="gray" size="md" className="gap-1.5">
                            <BadgeDot />
                            <span className="font-code text-xs uppercase text-faded">Inactive</span>
                          </Badge>
                        )}
                        <motion.div whileTap={{ scale: 0.95 }} transition={{ duration: 0.1 }}>
                          <Switch
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              if (!checked) {
                                setIsPauseModalOpen(true);
                                return;
                              }

                              onPauseWorkflow(checked);
                            }}
                            disabled={isReadOnly}
                          />
                        </motion.div>
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              {/* WORKFLOW Section */}
              <FormField
                control={form.control}
                name="name"
                defaultValue=""
                render={({ field, fieldState }) => (
                  <FormItem>
                    <div className="group flex items-center justify-between">
                      <span className="text-text-soft font-code text-xs font-medium">WORKFLOW</span>
                      <div className="relative flex items-center gap-2 min-w-0 flex-1 justify-end">
                        {isEditingName && !isReadOnly ? (
                          <Input
                            placeholder="New workflow"
                            value={field.value}
                            onChange={field.onChange}
                            hasError={!!fieldState.error}
                            className="min-w-[200px] [&>div]:before:hidden [&>div]:shadow-none [&>div]:focus-within:ring-1 [&>div]:focus-within:ring-stroke-soft [&>div]:focus-within:ring-offset-0 [&>div]:focus-within:border-stroke-soft"
                            size="xs"
                            autoFocus
                            onBlur={() => {
                              field.onBlur();
                              setIsEditingName(false);
                              saveForm();
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.currentTarget.blur();
                              }
                              if (e.key === 'Escape') {
                                form.resetField('name');
                                setIsEditingName(false);
                              }
                            }}
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => !isReadOnly && setIsEditingName(true)}
                            disabled={isReadOnly}
                            className={cn(
                              'text-foreground-600 text-right text-xs transition-colors',
                              !isReadOnly && 'hover:text-foreground-800 cursor-pointer',
                              isReadOnly && 'cursor-default'
                            )}
                          >
                            {field.value || 'Untitled workflow'}
                          </button>
                        )}
                      </div>
                    </div>
                    <FormMessage className="mt-1" />
                  </FormItem>
                )}
              />

              {/* ID Section */}
              <FormField
                control={form.control}
                name="workflowId"
                defaultValue=""
                render={({ field }) => (
                  <FormItem>
                    <div className="group flex items-center justify-between">
                      <span className="text-text-soft font-code text-xs font-medium">ID</span>
                      <div className="relative flex items-center gap-2">
                        <div className="opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                          <CopyButton valueToCopy={field.value} size="2xs" className="h-1 p-0.5" />
                        </div>
                        <motion.span
                          whileHover={{ x: -2 }}
                          transition={{ duration: 0.15 }}
                          className="text-foreground-600 font-mono text-xs"
                        >
                          {field.value}
                        </motion.span>
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              {/* DESCRIPTION Section */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <button
                      type="button"
                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                      className="group flex w-full items-center justify-between"
                    >
                      <span className="text-text-soft font-code text-xs font-medium">DESCRIPTION</span>
                      <div className="relative flex items-center gap-2">
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="text-foreground-400 group-hover:text-foreground-600 rounded p-1 transition-colors"
                        >
                          <ChevronsUpDown
                            className={cn(
                              'size-4 transition-transform duration-200',
                              isDescriptionExpanded && 'rotate-180'
                            )}
                          />
                        </motion.div>
                      </div>
                    </button>
                    {isDescriptionExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="mt-2 overflow-hidden"
                      >
                        <Textarea
                          className="min-h-24 text-sm"
                          placeholder="Describe what this workflow does"
                          value={field.value}
                          onChange={field.onChange}
                          maxLength={MAX_DESCRIPTION_LENGTH}
                          showCounter
                          disabled={isReadOnly}
                          onBlur={() => {
                            field.onBlur();
                            saveForm();
                          }}
                        />
                      </motion.div>
                    )}
                    <FormMessage className="mt-1" />
                  </FormItem>
                )}
              />

              {/* TAGS Section */}
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <div className="group flex items-center justify-between">
                      <span className="text-text-soft font-code text-xs font-medium">TAGS</span>
                      <div className="relative flex items-center gap-2">
                        {!isReadOnly && (
                          <motion.button
                            type="button"
                            onClick={() => setIsAddingTag(!isAddingTag)}
                            whileHover={{ scale: 1.05, rotate: 90 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="bg-bg-white hover:bg-bg-weak text-foreground-600 hover:text-foreground-800 flex h-6 w-6 shrink-0 items-center justify-center rounded transition-colors"
                          >
                            <RiAddLine className="size-3.5" />
                          </motion.button>
                        )}
                      </div>
                    </div>
                    <AnimatePresence>
                      {isAddingTag && !isReadOnly && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: 'easeInOut' }}
                          className="mt-2 overflow-hidden"
                        >
                          <TagInput
                            value={field.value ?? []}
                            onChange={(newTags) => {
                              form.setValue('tags', newTags, { shouldValidate: true, shouldDirty: true });
                              saveForm();
                            }}
                            disabled={isReadOnly}
                            suggestions={tags.map((tag) => tag.name)}
                            onBlur={() => setIsAddingTag(false)}
                            className="h-6 text-xs"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <FormMessage className="mt-1" />
                  </FormItem>
                )}
              />
            </SidebarContent>
          </FormRoot>
        </Form>
        <Separator />
        <SidebarContent size="lg">
          <Link to={ROUTES.EDIT_WORKFLOW_PREFERENCES}>
            <Button
              variant="secondary"
              mode="outline"
              leadingIcon={RiSettingsLine}
              className="flex w-full justify-start gap-1.5 p-1.5 text-xs font-medium"
              type="button"
              trailingIcon={RiArrowRightSLine}
            >
              Configure channel preferences
              <span className="ml-auto" />
            </Button>
          </Link>
          {workflow?.origin === ResourceOriginEnum.NOVU_CLOUD && (
            <Button
              variant="secondary"
              mode="outline"
              leadingIcon={RiListView}
              className="flex w-full justify-start gap-1.5 p-1.5 text-xs font-medium"
              type="button"
              onClick={() => setIsPayloadSchemaDrawerOpen(true)}
              trailingIcon={RiArrowRightSLine}
            >
              Manage payload schema
              <span className="ml-auto" />
            </Button>
          )}
          <FormField
            control={form.control}
            name="isTranslationEnabled"
            render={({ field }) => (
              <TranslationToggleSection
                value={field.value ?? false}
                onChange={(checked) => {
                  field.onChange(checked);
                  saveForm();
                }}
                isReadOnly={isReadOnly}
                resourceId={workflow?.workflowId}
                resourceType={LocalizationResourceEnum.WORKFLOW}
                showDrawer={!!(workflow?.workflowId && workflow?.isTranslationEnabled)}
              />
            )}
          />
        </SidebarContent>
        <Separator />
      </motion.div>
    </>
  );
};

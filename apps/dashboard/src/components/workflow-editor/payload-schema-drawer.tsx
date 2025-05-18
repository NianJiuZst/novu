import { forwardRef, useState, useCallback, useEffect } from 'react';
import { RiFileMarkedLine, RiInformation2Line } from 'react-icons/ri';

import { Button } from '@/components/primitives/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetMain,
  SheetTitle,
} from '@/components/primitives/sheet';
import { cn } from '@/utils/ui';
import { SchemaEditor } from '@/components/schema-editor';
import type { JSONSchema7 } from '@/components/schema-editor/json-schema';
import { ExternalLink } from '../shared/external-link';
import { Separator } from '../primitives/separator';
import { usePatchWorkflow } from '@/hooks/use-patch-workflow';
import { Link } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/primitives/tooltip';
import type { WorkflowResponseDto as NovuWorkflowResponseDto } from '@novu/shared';

interface WorkflowForSchemaEditing extends NovuWorkflowResponseDto {
  payloadSchema?: JSONSchema7;
}

type PayloadSchemaDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflow: WorkflowForSchemaEditing;
  onSave?: (schema: JSONSchema7) => void;
  initialFieldPath?: string;
};

const defaultEditorSchema: JSONSchema7 = {
  type: 'object',
  properties: {},
};

function initializeSchemaFromWorkflow(
  workflow: WorkflowForSchemaEditing,
  open: boolean,
  initialFieldPath?: string
): { schemaToSet: JSONSchema7; fieldToHighlight?: string } {
  let schemaToSet = structuredClone(defaultEditorSchema);

  if (workflow?.payloadSchema && typeof workflow.payloadSchema === 'object') {
    schemaToSet = structuredClone(workflow.payloadSchema);
  } else {
    // Ensure schemaToSet is a fresh clone if not derived from workflow.payloadSchema
    // This line was implicitly handled by the previous logic but is good to be explicit.
    schemaToSet = structuredClone(defaultEditorSchema);
  }

  let fieldToHighlightOutput: string | undefined = undefined;

  if (open && initialFieldPath) {
    // Normalize path: remove leading "payload." if present
    let path = initialFieldPath;

    if (path.startsWith('payload.')) {
      path = path.substring('payload.'.length);
    } else if (path === 'payload') {
      path = ''; // Treat 'payload' as root, don't add sub-property
    }

    if (path && path.trim() !== '') {
      const pathParts = path.split('.').filter((p) => p.trim() !== ''); // Filter out empty parts

      if (pathParts.length > 0) {
        let currentLevel = schemaToSet;

        // Ensure the root is an object if we are trying to add properties to it.
        if (currentLevel.type !== 'object') {
          console.warn('Cannot add suggested field: Root schema is not an object. Resetting to an object schema.');
          currentLevel.type = 'object';
          currentLevel.properties = {};
          // Also reset other potential properties like 'items' if it was an array, etc.
          // For simplicity, we are just ensuring it's a basic object here.
        }

        currentLevel.properties = currentLevel.properties || {};

        for (let i = 0; i < pathParts.length; i++) {
          const part = pathParts[i];

          if (i === pathParts.length - 1) {
            // Last part, set the type (e.g., string), only if it doesn't exist
            if (!currentLevel.properties[part]) {
              currentLevel.properties[part] = { type: 'string' };
            }
            // If it exists, we don't overwrite its type, just ensure it's present.
          } else {
            // Not the last part, ensure it's an object
            const currentProperty = currentLevel.properties[part];

            if (
              !currentProperty ||
              typeof currentProperty !== 'object' ||
              !('type' in currentProperty) ||
              currentProperty.type !== 'object'
            ) {
              // If it doesn't exist, or isn't an object schema, overwrite/initialize as an object schema
              currentLevel.properties[part] = { type: 'object', properties: {} };
            }

            // Navigate deeper
            currentLevel = currentLevel.properties[part] as JSONSchema7;
            // Ensure the deeper level also has a properties object if we are to add to it
            currentLevel.properties = currentLevel.properties || {};
          }
        }

        fieldToHighlightOutput = path; // Set the path to be highlighted
      }
    }
  }

  return { schemaToSet, fieldToHighlight: fieldToHighlightOutput };
}

export const PayloadSchemaDrawer = forwardRef<HTMLDivElement, PayloadSchemaDrawerProps>((props, ref) => {
  const { open, onOpenChange, workflow, onSave } = props;
  const [currentSchema, setCurrentSchema] = useState<JSONSchema7>(defaultEditorSchema);
  const [isSchemaEditorFormValid, setIsSchemaEditorFormValid] = useState<boolean>(true);
  const [fieldToHighlight, setFieldToHighlight] = useState<string | undefined>(undefined);
  const { patchWorkflow, isPending: isSavingSchema } = usePatchWorkflow();

  useEffect(() => {
    const { schemaToSet, fieldToHighlight: newFieldToHighlight } = initializeSchemaFromWorkflow(
      workflow,
      open,
      props.initialFieldPath
    );
    setCurrentSchema(schemaToSet);

    if (newFieldToHighlight) {
      setFieldToHighlight(newFieldToHighlight);
    }
  }, [workflow, open, props.initialFieldPath]); // Rerun if workflow, open state, or initialFieldPath changes

  // Effect to clear highlight after a delay
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (fieldToHighlight) {
      timer = setTimeout(() => {
        setFieldToHighlight(undefined);
      }, 3000); // Highlight for 3 seconds
    }

    return () => {
      clearTimeout(timer);
    };
  }, [fieldToHighlight]);

  const handleSchemaChange = useCallback((schema: JSONSchema7) => {
    setCurrentSchema(schema);
  }, []);

  const handleSchemaValidityChange = useCallback((isValid: boolean) => {
    setIsSchemaEditorFormValid(isValid);
  }, []);

  const handleSaveChanges = async () => {
    if (!workflow.slug) {
      console.error('Workflow slug is missing. Cannot save.');
      return;
    }

    const payloadSchemaForApi = currentSchema;

    if (
      !payloadSchemaForApi ||
      (Object.keys(payloadSchemaForApi.properties || {}).length === 0 && payloadSchemaForApi.type === 'object')
    ) {
      // Schema is effectively empty (default object with no properties).
      // The API should handle this as clearing the schema or setting it to a minimal object.
      // No special client-side action needed here beyond sending the current state.
    }

    try {
      await patchWorkflow({
        workflowSlug: workflow.slug,
        workflow: {
          payloadSchema: payloadSchemaForApi,
        },
      });
      onSave?.(currentSchema);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save payload schema due to API error:', error);
    }
  };

  const handleExportToJsonSchema = () => {
    const jsonString = JSON.stringify(currentSchema, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflow.slug || 'payload'}-schema.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isSchemaEmpty =
    !currentSchema ||
    currentSchema.type !== 'object' ||
    !currentSchema.properties ||
    Object.keys(currentSchema.properties).length === 0;

  return (
    <Sheet open={open} modal={false} onOpenChange={onOpenChange}>
      <div
        className={cn('fade-in animate-in fixed inset-0 z-50 bg-black/20 transition-opacity duration-300', {
          'pointer-events-none opacity-0': !open,
        })}
      />
      <SheetContent ref={ref} className="bg-bg-weak flex w-[600px] flex-col p-0 sm:max-w-3xl">
        <SheetHeader className="space-y-1 px-3 py-4">
          <SheetTitle className="text-label-lg">Manage Payload Schema</SheetTitle>
          <SheetDescription className="text-paragraph-xs mt-0">
            Define the structure of your workflow payload.{' '}
            <ExternalLink href="https://docs.novu.co/platform/concepts/workflows">Learn more</ExternalLink>
          </SheetDescription>
        </SheetHeader>
        <Separator />

        <SheetMain className="p-3">
          <div className="mb-2 flex flex-row items-center justify-between gap-2">
            <h3 className="text-label-xs w-full">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="flex cursor-default flex-row items-center gap-1">
                    Payload schema <RiInformation2Line className="inline-block size-4 text-neutral-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Validating the workflow payload content, to match a specific schema. This validation ensures
                      content consistency.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </h3>

            <Button
              variant="secondary"
              mode="outline"
              onClick={handleExportToJsonSchema}
              size="2xs"
              className="text-sm"
            >
              Export JSON
            </Button>
          </div>

          <SchemaEditor
            initialSchema={currentSchema}
            onChange={handleSchemaChange}
            onValidityChange={handleSchemaValidityChange}
            highlightPath={fieldToHighlight}
          />
        </SheetMain>
        <SheetFooter className="border-neutral-content-weak space-between flex border-t px-3 py-1.5">
          <div className="flex w-full flex-row items-center justify-between gap-2">
            <Link to="https://docs.novu.co/platform/concepts/payloads" target="_blank">
              <Button variant="secondary" mode="ghost" size="xs" leadingIcon={RiFileMarkedLine}>
                View Docs
              </Button>
            </Link>
            <Button
              size="xs"
              mode="gradient"
              variant="secondary"
              onClick={handleSaveChanges}
              disabled={
                isSavingSchema ||
                !isSchemaEditorFormValid ||
                (workflow?.payloadSchema === currentSchema && !isSchemaEmpty)
              }
              data-test-id="save-payload-schema-btn"
            >
              {isSavingSchema ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
});

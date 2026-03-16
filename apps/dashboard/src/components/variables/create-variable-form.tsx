import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { IEnvironment } from '@novu/shared';
import { useId } from 'react';
import { useForm } from 'react-hook-form';
import { RiInformationLine } from 'react-icons/ri';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { NovuApiError } from '@/api/api.client';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormRoot,
} from '@/components/primitives/form/form';
import { Hint, HintIcon } from '@/components/primitives/hint';
import { Input } from '@/components/primitives/input';
import { Separator } from '@/components/primitives/separator';
import { showErrorToast, showSuccessToast } from '@/components/primitives/sonner-helpers';
import { Switch } from '@/components/primitives/switch';
import { useCreateEnvironmentVariable } from '@/hooks/use-create-environment-variable';
import { EnvironmentBranchIcon } from '../primitives/environment-branch-icon';

const VARIABLE_KEY_REGEX = /^[A-Z][A-Z0-9_]*$/;

const CreateVariableSchema = z.object({
  key: z
    .string()
    .min(1, 'Variable key is required')
    .regex(VARIABLE_KEY_REGEX, 'Must be unique and all uppercase, using _ only'),
  isSecret: z.boolean(),
  defaultValue: z.string().optional(),
  environmentValues: z.record(z.string(), z.string()),
});

type CreateVariableFormValues = z.infer<typeof CreateVariableSchema>;

type CreateVariableFormProps = {
  formId?: string;
  environments: IEnvironment[];
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  onSubmitStart?: () => void;
};

export const CreateVariableForm = ({
  formId: providedFormId,
  environments,
  onSuccess,
  onError,
  onSubmitStart,
}: CreateVariableFormProps) => {
  const generatedFormId = useId();
  const formId = providedFormId ?? generatedFormId;

  const { createEnvironmentVariable } = useCreateEnvironmentVariable({
    onSuccess: () => {
      showSuccessToast('Variable created successfully');
      onSuccess?.();
    },
    onError: (error) => {
      if (error instanceof NovuApiError && error.status === 409) {
        form.setError('key', { type: 'manual', message: 'A variable with this key already exists' });
      } else {
        const message = error instanceof Error ? error.message : 'Failed to create variable';
        showErrorToast(message);
      }
      onError?.(error instanceof Error ? error : new Error('Unknown error'));
    },
  });

  const form = useForm<CreateVariableFormValues>({
    defaultValues: {
      key: '',
      isSecret: false,
      defaultValue: '',
      environmentValues: {},
    },
    resolver: standardSchemaResolver(CreateVariableSchema),
    shouldFocusError: false,
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  const onSubmit = async (data: CreateVariableFormValues) => {
    onSubmitStart?.();

    const values = Object.entries(data.environmentValues)
      .filter(([, val]) => val.trim())
      .map(([_environmentId, value]) => ({ _environmentId, value }));

    await createEnvironmentVariable({
      key: data.key.trim(),
      isSecret: data.isSecret,
      defaultValue: data.defaultValue?.trim() || undefined,
      values,
    });
  };

  return (
    <Form {...form}>
      <FormRoot
        id={formId}
        autoComplete="off"
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6"
      >
        <FormField
          control={form.control}
          name="key"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Variable key</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g. BASE_URL"
                  size="xs"
                  hasError={!!fieldState.error}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                />
              </FormControl>
              {fieldState.error ? (
                <FormMessage />
              ) : (
                <Hint>
                  <HintIcon as={RiInformationLine} />
                  Must be unique and all uppercase, using _ only
                </Hint>
              )}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isSecret"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1">
                    <FormLabel className="mb-0">Secret variable</FormLabel>
                    <RiInformationLine className="text-text-soft size-4" />
                  </div>
                  <p className="text-text-sub text-xs">Secret variables are never exposed in the API and dashboard.</p>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </div>
            </FormItem>
          )}
        />

        <Separator />

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-text-strong text-xs font-medium">Values</p>
            <p className="text-text-sub text-xs">Add values for this variable in different environments.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <FormField
              control={form.control}
              name="defaultValue"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-1.5">
                    <div className="flex w-[175px] shrink-0 items-center gap-1">
                      <span className="text-text-sub text-xs font-medium">Default value</span>
                      <RiInformationLine className="text-text-soft size-4" />
                    </div>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Default value used across environments..."
                        size="xs"
                        className="flex-1"
                      />
                    </FormControl>
                  </div>
                </FormItem>
              )}
            />

            {environments.map((env) => (
              <FormField
                key={env._id}
                control={form.control}
                name={`environmentValues.${env._id}`}
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-1.5">
                      <div className="flex w-[175px] shrink-0 items-center gap-1.5">
                        <EnvironmentBranchIcon environment={env} size="sm" />
                        <span className="text-text-sub truncate text-xs font-medium">{env.name}</span>
                      </div>
                      <FormControl>
                        <Input {...field} placeholder={`${env.name} value`} size="xs" className="flex-1" />
                      </FormControl>
                    </div>
                  </FormItem>
                )}
              />
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
          <div className="flex gap-2">
            <div className="bg-faded-base mt-0.5 h-auto w-1 shrink-0 rounded-full" />
            <p className="text-text-sub text-xs">
              <span className="text-text-strong font-medium">Note</span>
              {': These values can be accessed in the workflows via '}
              <code className="font-mono">{'{{env.'}</code>
              <code className="font-mono text-text-strong">{'{KEY}'}</code>
              <code className="font-mono">{'}'}</code>
              {'. '}
              <Link
                to="https://docs.novu.co/platform/workflow/template-editor/variables"
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-sub underline"
              >
                Learn more ↗
              </Link>
            </p>
          </div>
        </div>
      </FormRoot>
    </Form>
  );
};

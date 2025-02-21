import { useEnvironment } from '@/context/environment/hooks';
import { useAddExternalAuthIssuerUrls } from '@/hooks/use-add-external-auth-issuer-urls';
import { Controller, useForm } from 'react-hook-form';
import { TagInput } from '../primitives/tag-input';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../primitives/button';

const formSchema = z.object({
  externalAuthIssuerUrls: z
    .array(
      z.string().url({
        message: 'Invalid URL',
      })
    )
    .max(5, {
      message: 'Max 5 URLs allowed',
    })
    .min(1),
});

export function ExternalAuthIssuerUrlsForm() {
  const { addExternalAuthIssuerUrls } = useAddExternalAuthIssuerUrls();
  const { currentEnvironment } = useEnvironment();

  const form = useForm<z.infer<typeof formSchema>>({
    values: {
      externalAuthIssuerUrls: currentEnvironment?.externalAuthIssuerUrls?.map((iss) => iss.url) ?? [],
    },
    mode: 'onChange',
    resolver: zodResolver(formSchema),
  });

  const submitForm = async (formData: any) => {
    try {
      await addExternalAuthIssuerUrls({
        externalAuthIssuerUrls: formData.externalAuthIssuerUrls,
      });
    } catch (error) {
      if (error instanceof Error) {
        form.setError('externalAuthIssuerUrls', {
          type: 'manual',
          message: error?.message,
        });
      }
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Controller
        control={form.control}
        name="externalAuthIssuerUrls"
        render={({ field }) => (
          <TagInput
            suggestions={[]}
            placeholder="Add External Auth Issuer URL"
            key={form.getValues('externalAuthIssuerUrls').length}
            {...field}
            onChange={(tags) => {
              // saveForm();

              console.log({ tags });
              form.setValue('externalAuthIssuerUrls', tags, { shouldValidate: true, shouldDirty: true });
            }}
          />
        )}
      />
      {form.formState.errors.externalAuthIssuerUrls && (
        <span className="mb-2 text-xs font-light text-red-500">
          {form.formState.errors.externalAuthIssuerUrls.message}
        </span>
      )}
      <Button onClick={form.handleSubmit(submitForm)} disabled={!form.formState.isDirty}>
        Update
      </Button>
    </div>
  );
}

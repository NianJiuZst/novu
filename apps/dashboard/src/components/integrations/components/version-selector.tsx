import { IProviderConfig, ProviderVersion, ProviderVersionStatus } from '@novu/shared';
import { Control, useWatch } from 'react-hook-form';
import { Badge } from '@/components/primitives/badge';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/primitives/form/form';
import { InlineToast } from '@/components/primitives/inline-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/primitives/select';
import { IntegrationFormData } from '../types';
import { DescriptionWithLinks } from './description-with-links';

function versionStatusBadgeProps(
  status: ProviderVersionStatus,
  isDefault: boolean
): {
  variant: 'filled' | 'light';
  color: 'green' | 'orange' | 'blue' | 'gray';
} {
  if (status === 'deprecated') {
    return { variant: 'light', color: 'orange' };
  }

  if (status === 'beta') {
    return { variant: 'light', color: 'blue' };
  }

  if (isDefault) {
    return { variant: 'light', color: 'green' };
  }

  return { variant: 'light', color: 'gray' };
}

function versionStatusLabel(status: ProviderVersionStatus, isDefault: boolean): string {
  if (status === 'deprecated') {
    return 'Deprecated';
  }

  if (status === 'beta') {
    return 'Beta';
  }

  if (isDefault) {
    return 'Recommended';
  }

  return 'Stable';
}

type VersionSelectorProps = {
  provider: IProviderConfig;
  control: Control<IntegrationFormData>;
  isReadOnly?: boolean;
};

export function VersionSelector({ provider, control, isReadOnly }: VersionSelectorProps) {
  const versions = provider.versions;

  const selectedValue = useWatch({
    control,
    name: 'credentials.apiVersion',
  });

  if (!versions?.length) {
    return null;
  }

  const selectedMeta: ProviderVersion | undefined = versions.find((v) => v.value === selectedValue);

  const defaultVersion = versions.find((v) => v.isDefault);

  const showDeprecationBanner =
    selectedMeta?.status === 'deprecated' &&
    defaultVersion !== undefined &&
    selectedMeta.value !== defaultVersion.value;

  return (
    <div className="border-neutral-alpha-200 bg-background text-foreground-600 mx-0 flex flex-col gap-3 rounded-lg border p-3">
      <FormField
        control={control}
        name="credentials.apiVersion"
        rules={{
          required: 'Select a provider API version',
        }}
        render={({ field, fieldState }) => (
          <FormItem>
            <div className="flex flex-wrap items-center gap-2">
              <FormLabel required optional={false}>
                Provider API version
              </FormLabel>
              {selectedMeta ? (
                <Badge
                  variant={versionStatusBadgeProps(selectedMeta.status, selectedMeta.isDefault).variant}
                  color={versionStatusBadgeProps(selectedMeta.status, selectedMeta.isDefault).color}
                  size="sm"
                >
                  {versionStatusLabel(selectedMeta.status, selectedMeta.isDefault)}
                </Badge>
              ) : null}
            </div>
            <FormControl>
              <Select
                value={typeof field.value === 'string' ? field.value : ''}
                onValueChange={field.onChange}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select API version" />
                </SelectTrigger>
                <SelectContent>
                  {versions.map((v) => (
                    <SelectItem key={v.value} value={v.value}>
                      {v.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage>{fieldState.error?.message}</FormMessage>
            {selectedMeta?.description ? (
              <p className="text-foreground-600 text-xs leading-relaxed">
                <DescriptionWithLinks description={selectedMeta.description} />
              </p>
            ) : null}
          </FormItem>
        )}
      />

      {showDeprecationBanner && defaultVersion ? (
        <InlineToast
          variant="warning"
          title="Deprecated API version"
          description={`We recommend upgrading to ${defaultVersion.displayName}. ${defaultVersion.description ?? ''}`}
        />
      ) : null}
    </div>
  );
}

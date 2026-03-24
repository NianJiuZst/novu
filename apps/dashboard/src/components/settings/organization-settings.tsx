/** biome-ignore-all lint/correctness/useUniqueElementIds: expected */
import { OrganizationProfile } from '@clerk/clerk-react';
import type { Appearance } from '@clerk/types';
import { IndustryEnum, industryToLabelMapper, PermissionsEnum } from '@novu/shared';
import { RiInformation2Line } from 'react-icons/ri';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/primitives/select';
import { Tooltip, TooltipContent, TooltipPortal, TooltipTrigger } from '@/components/primitives/tooltip';
import { EE_AUTH_PROVIDER } from '@/config';
import { useFetchOrganizationSettings } from '@/hooks/use-fetch-organization-settings';
import { useUpdateOrganizationSettings } from '@/hooks/use-update-organization-settings';
import { OrganizationSettings as BetterAuthOrganizationSettings } from '@/utils/better-auth/components/organization-settings';
import { Protect } from '@/utils/protect';
import { NovuBrandingSwitch } from './novu-branding-switch';

export function OrganizationSettings({ clerkAppearance }: { clerkAppearance: Appearance }) {
  const { data: organizationSettings, isLoading: isLoadingSettings } = useFetchOrganizationSettings();
  const updateOrganizationSettings = useUpdateOrganizationSettings();

  const handleRemoveBrandingChange = (value: boolean) => {
    updateOrganizationSettings.mutate({
      removeNovuBranding: value,
    });
  };

  const handleIndustryChange = (value: string) => {
    updateOrganizationSettings.mutate({
      industry: value as IndustryEnum,
    });
  };

  const removeNovuBranding = organizationSettings?.data?.removeNovuBranding;
  const industry = organizationSettings?.data?.industry;
  const isUpdating = updateOrganizationSettings.isPending;

  return (
    <div className="space-y-8">
      <Protect permission={PermissionsEnum.ORG_SETTINGS_READ}>
        <div>
          <h1 className="text-label-sm text-text-strong mb-2">Branding & Integrations</h1>

          <div className="flex flex-col gap-7">
            <div className="flex flex-col border-t border-neutral-100 pt-4 pl-1">
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-1">
                  <span className="text-label-sm text-text-strong">Remove Novu branding</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <RiInformation2Line className="size-4 text-text-soft cursor-help" />
                    </TooltipTrigger>
                    <TooltipPortal>
                      <TooltipContent
                        side="right"
                        sideOffset={10}
                        hideWhenDetached
                        className="w-[220px] border-0 bg-white p-1 shadow-md"
                      >
                        <figure className="aspect-[3] w-full overflow-hidden rounded-md border border-gray-200">
                          <img
                            src="/images/novu-branding.png"
                            alt="Novu branding preview"
                            className="h-full w-full object-contain"
                          />
                        </figure>
                        <p className="mt-2 px-0.5 text-xs text-gray-500">
                          Novu branding appears at the bottom of your emails and in your inbox.
                        </p>
                      </TooltipContent>
                    </TooltipPortal>
                  </Tooltip>
                </div>
                <NovuBrandingSwitch
                  id="remove-branding"
                  value={removeNovuBranding}
                  onChange={handleRemoveBrandingChange}
                  isReadOnly={isLoadingSettings || isUpdating}
                />
              </div>
              <p className="text-paragraph-sm text-text-soft mb-1">
                When enabled, removes Novu branding from your notifications.
              </p>
            </div>
          </div>
        </div>
      </Protect>

      <Protect permission={PermissionsEnum.ORG_SETTINGS_READ}>
        <div>
          <h1 className="text-label-sm text-text-strong mb-2">AI Co-Pilot</h1>

          <div className="flex flex-col gap-7">
            <div className="flex flex-col border-t border-neutral-100 pt-4 pl-1">
              <div className="flex items-center justify-between py-1">
                <div className="flex flex-col gap-0.5">
                  <span className="text-label-sm text-text-strong">Company industry</span>
                  <p className="text-paragraph-sm text-text-soft">
                    Tailors AI workflow suggestions to your industry best practices.
                  </p>
                </div>
                <Select
                  value={industry ?? ''}
                  onValueChange={handleIndustryChange}
                  disabled={isLoadingSettings || isUpdating}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(industryToLabelMapper).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </Protect>

      <div>
        <h1 className="text-label-sm text-text-strong mb-3">Organization Settings</h1>
        {EE_AUTH_PROVIDER === 'clerk' ? (
          <OrganizationProfile appearance={clerkAppearance}>
            <OrganizationProfile.Page label="members" />
          </OrganizationProfile>
        ) : (
          <BetterAuthOrganizationSettings />
        )}
      </div>
    </div>
  );
}

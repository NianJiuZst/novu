import type { WorkflowPreferences } from '@novu/shared';
import type { FC, PropsWithChildren } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import type { WorkflowGeneralSettings } from './types';

export type WorkflowDetailFormContext = {
  general: WorkflowGeneralSettings;
  preferences: WorkflowPreferences | null;
};

export const WorkflowDetailFormContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const formValues = useForm<WorkflowDetailFormContext>({
    mode: 'onChange',
  });

  return <FormProvider {...formValues}>{children}</FormProvider>;
};

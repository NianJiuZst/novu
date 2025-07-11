import type { IResponseError } from '@novu/shared';
import { captureException } from '@sentry/react';
import { useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';

import { api } from '../../../api/api.client';
import { errorMessage } from '../../../utils/notifications';

export function useAcceptInvite() {
  const { isLoading, mutateAsync, error } = useMutation<string, IResponseError, string>((tokenItem) =>
    api.post(`/v1/invites/${tokenItem}/accept`, {})
  );

  const acceptInvite = useCallback(
    async (invitationToken: string) => {
      try {
        return await mutateAsync(invitationToken);
      } catch (e: unknown) {
        errorMessage('Failed to accept an invite.');

        captureException(e);
      }
    },
    [mutateAsync]
  );

  return {
    acceptInvite,
    isLoading,
    error,
  };
}

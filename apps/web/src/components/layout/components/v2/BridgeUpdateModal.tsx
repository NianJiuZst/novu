import { Modal, successMessage } from '@novu/design-system';
import { Button, Input, Title } from '@novu/novui';
import { css } from '@novu/novui/css';
import { IconOutlineMenuBook } from '@novu/novui/icons';
import { Box, HStack, styled } from '@novu/novui/jsx';
import { text } from '@novu/novui/recipes';
import { type FC, useEffect, useState } from 'react';
import { updateBridgeUrl } from '../../../../api';
import { validateBridgeUrl } from '../../../../api/bridge';
import { buildBridgeHTTPClient } from '../../../../bridgeApi/bridgeApi.client';
import { useEnvironment } from '../../../../hooks';
import { useTelemetry } from '../../../../hooks/useNovuAPI';
import { useStudioState } from '../../../../studio/StudioStateProvider';
import { validateURL } from '../../../../utils';
import { PATHS } from '../../../docs/docs.const';
import { useDocsModal } from '../../../docs/useDocsModal';

export type BridgeUpdateModalProps = {
  isOpen: boolean;
  toggleOpen: () => void;
};
const LinkText = styled('a', text);

export const BridgeUpdateModal: FC<BridgeUpdateModalProps> = ({ isOpen, toggleOpen }) => {
  const track = useTelemetry();
  const { isLocalStudio, bridgeURL, setBridgeURL } = useStudioState();
  const [urlError, setUrlError] = useState<string>('');
  const [url, setUrl] = useState(bridgeURL);
  const [isUpdating, setIsUpdating] = useState(false);
  const { Component, toggle, setPath } = useDocsModal();

  const { environment, isLoaded: isEnvironmentLoaded } = useEnvironment();

  useEffect(() => {
    setUrl(bridgeURL);
  }, [bridgeURL]);

  const onBridgeUrlChange = (event) => {
    event.preventDefault();
    setUrlError('');
    setUrl(event.target.value);
  };

  const validateFromLocal = async (bridgeUrl: string): Promise<{ isValid: boolean }> => {
    try {
      const client = buildBridgeHTTPClient(bridgeUrl);
      const response = await client.healthCheck();

      const result = { isValid: response.status === 'ok' };

      return result;
    } catch {
      /* empty */
    }

    return { isValid: false };
  };
  const localDomains = ['localhost', '127.0.0.1'];
  const isLocalAddress = () => {
    const parsedUrl = new URL(url);

    return localDomains.includes(parsedUrl.hostname);
  };

  const onUpdateClick = async () => {
    setUrlError('');
    setIsUpdating(true);
    try {
      if (url) {
        validateURL(url);

        let result =
          isLocalStudio && isLocalAddress()
            ? await validateFromLocal(url)
            : await validateBridgeUrl({ bridgeUrl: url });

        if (!result.isValid && isLocalStudio) {
          result = await validateBridgeUrl({ bridgeUrl: url });
        }
        if (!result.isValid) {
          throw new Error(result.error);
        }
      }

      await storeInProperLocation(url);
      track('Update endpoint clicked - [Bridge Modal]');
      successMessage('You have successfully updated your Novu Endpoint configuration');
      toggleOpen();
    } catch (error) {
      const err = error as Error;
      setUrlError(err.message || 'Unknown error');
    }

    setIsUpdating(false);
  };

  const storeInProperLocation = async (newUrl: string) => {
    setBridgeURL(newUrl);
    if (!isLocalStudio) {
      await updateBridgeUrl({ url: newUrl }, environment?._id ?? '');
    }
  };

  const isLoading = !isEnvironmentLoaded || isUpdating;

  return (
    <>
      <Modal opened={isOpen} title={<Title variant="section">Update Novu Endpoint URL</Title>} onClose={toggleOpen}>
        <Box colorPalette={'mode.local'}>
          <Input
            label={'Novu Endpoint URL'}
            description={
              'This url should be a full URL to the Novu Endpoint including the /api/novu path, e.g. https://your.api.com/api/novu'
            }
            onChange={onBridgeUrlChange}
            value={url}
            disabled={isLoading}
            variant="preventLayoutShift"
            error={urlError}
            className={css({ marginBottom: '16px' })}
          />
          <HStack justify={'space-between'}>
            <div>
              <HStack gap="50" className={css({ color: 'typography.text.secondary' })}>
                <IconOutlineMenuBook />
                <LinkText
                  onClick={(e) => {
                    e.preventDefault();
                    setPath(PATHS.CONCEPT_ENDPOINT);
                    toggle();
                  }}
                  href=""
                >
                  Learn more in our docs
                </LinkText>
              </HStack>
            </div>
            <Button size={'md'} loading={isLoading} onClick={onUpdateClick}>
              Update
            </Button>
          </HStack>
        </Box>
      </Modal>
      <Component />
    </>
  );
};

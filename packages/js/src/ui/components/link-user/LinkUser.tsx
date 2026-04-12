import type { Context } from '../../../types';
import { useChannelEndpoint } from '../../api/hooks/useChannelEndpoint';
import { useStyle } from '../../helpers/useStyle';
import { Loader } from '../../icons/Loader';
import { Button, Motion } from '../primitives';

export type LinkUserProps = {
  integrationIdentifier: string;
  connectionIdentifier?: string;
  subscriberId: string;
  slackUserId: string;
  endpointIdentifier?: string;
  context?: Context;
  onLinkSuccess?: (endpoint: { identifier: string }) => void;
  onLinkError?: (error: unknown) => void;
  onUnlinkSuccess?: () => void;
  onUnlinkError?: (error: unknown) => void;
};

export const LinkUser = (props: LinkUserProps) => {
  const style = useStyle();
  const { endpoint, loading, create, remove } = useChannelEndpoint({
    endpointIdentifier: props.endpointIdentifier,
    subscriberId: props.subscriberId,
    integrationIdentifier: props.integrationIdentifier,
    connectionIdentifier: props.connectionIdentifier,
  });

  const isLinked = () => !!endpoint();

  const handleClick = async () => {
    if (isLinked()) {
      const identifier = endpoint()?.identifier;
      if (!identifier) return;

      const result = await remove(identifier);
      if (result.error) {
        props.onUnlinkError?.(result.error);
      } else {
        props.onUnlinkSuccess?.();
      }
    } else {
      const result = await create({
        integrationIdentifier: props.integrationIdentifier,
        connectionIdentifier: props.connectionIdentifier,
        subscriberId: props.subscriberId,
        context: props.context,
        type: 'slack_user',
        endpoint: { userId: props.slackUserId },
      });

      if (result.error) {
        props.onLinkError?.(result.error);
      } else if (result.data) {
        props.onLinkSuccess?.({ identifier: result.data.identifier });
      }
    }
  };

  return (
    <div
      class={style({
        key: 'linkUserContainer',
        className: 'nt-flex nt-items-center nt-gap-2',
      })}
    >
      <Button
        class={style({
          key: 'linkUserButton',
          className: 'nt-transition-[width] nt-duration-800 nt-will-change-[width]',
        })}
        variant="secondary"
        onClick={handleClick}
        disabled={loading()}
      >
        <span
          class={style({
            key: 'linkUserButtonContainer',
            className: 'nt-relative nt-overflow-hidden nt-inline-flex nt-items-center nt-justify-center nt-gap-1',
          })}
        >
          <Motion.span
            initial={{ opacity: 1 }}
            animate={{ opacity: loading() ? 0 : 1 }}
            transition={{ easing: 'ease-in-out', duration: 0.2 }}
            class="nt-inline-flex nt-items-center"
          >
            <span
              class={style({
                key: 'linkUserButtonLabel',
                className: '[line-height:16px]',
              })}
            >
              {isLinked() ? 'Unlink' : 'Link User'}
            </span>
          </Motion.span>
          <Motion.span
            initial={{ opacity: 1 }}
            animate={{ opacity: loading() ? 1 : 0 }}
            transition={{ easing: 'ease-in-out', duration: 0.2 }}
            class="nt-absolute nt-left-0 nt-inline-flex nt-items-center"
          >
            <Loader class="nt-text-foreground-alpha-600 nt-size-3.5 nt-animate-spin" />
          </Motion.span>
        </span>
      </Button>
    </div>
  );
};

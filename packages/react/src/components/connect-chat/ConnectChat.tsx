import React, { useMemo } from 'react';
import { useNovu } from '../../hooks/NovuProvider';
import { NovuUI, NovuUIOptions } from '../NovuUI';
import { withRenderer } from '../Renderer';
import { DefaultConnectChat, DefaultConnectChatProps } from './DefaultConnectChat';

export type ConnectChatProps = DefaultConnectChatProps & Pick<NovuUIOptions, 'container'>;

const ConnectChatInternal = withRenderer<ConnectChatProps>((props) => {
  const { container, ...defaultProps } = props;
  const novu = useNovu();

  const options: NovuUIOptions = useMemo(() => {
    return {
      container,
      options: novu.options,
    };
  }, [container, novu.options]);

  return (
    <NovuUI options={options} novu={novu}>
      <DefaultConnectChat {...defaultProps} />
    </NovuUI>
  );
});

ConnectChatInternal.displayName = 'ConnectChatInternal';

export const ConnectChat = React.memo((props: ConnectChatProps) => {
  return <ConnectChatInternal {...props} />;
});

ConnectChat.displayName = 'ConnectChat';

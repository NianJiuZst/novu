import React, { useMemo } from 'react';
import { useNovu } from '../../hooks/NovuProvider';
import { NovuUI, NovuUIOptions } from '../NovuUI';
import { withRenderer } from '../Renderer';
import { DefaultSlackConnectButton, DefaultSlackConnectButtonProps } from './DefaultSlackConnectButton';

export type SlackConnectButtonProps = DefaultSlackConnectButtonProps & Pick<NovuUIOptions, 'container'>;

const SlackConnectButtonInternal = withRenderer<SlackConnectButtonProps>((props) => {
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
      <DefaultSlackConnectButton {...defaultProps} />
    </NovuUI>
  );
});

SlackConnectButtonInternal.displayName = 'SlackConnectButtonInternal';

export const SlackConnectButton = React.memo((props: SlackConnectButtonProps) => {
  return <SlackConnectButtonInternal {...props} />;
});

SlackConnectButton.displayName = 'SlackConnectButton';

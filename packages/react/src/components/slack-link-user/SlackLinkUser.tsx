import React, { useMemo } from 'react';
import { useNovu } from '../../hooks/NovuProvider';
import { NovuUI, NovuUIOptions } from '../NovuUI';
import { withRenderer } from '../Renderer';
import { DefaultSlackLinkUser, DefaultSlackLinkUserProps } from './DefaultSlackLinkUser';

export type SlackLinkUserProps = DefaultSlackLinkUserProps & Pick<NovuUIOptions, 'container'>;

const SlackLinkUserInternal = withRenderer<SlackLinkUserProps>((props) => {
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
      <DefaultSlackLinkUser {...defaultProps} />
    </NovuUI>
  );
});

SlackLinkUserInternal.displayName = 'SlackLinkUserInternal';

export const SlackLinkUser = React.memo((props: SlackLinkUserProps) => {
  return <SlackLinkUserInternal {...props} />;
});

SlackLinkUser.displayName = 'SlackLinkUser';

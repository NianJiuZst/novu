import React, { useMemo } from 'react';
import { useNovu } from '../../hooks/NovuProvider';
import { NovuUI, NovuUIOptions } from '../NovuUI';
import { withRenderer } from '../Renderer';
import { DefaultLinkSlackUser, DefaultLinkSlackUserProps } from './DefaultLinkSlackUser';

export type LinkSlackUserProps = DefaultLinkSlackUserProps & Pick<NovuUIOptions, 'container'>;

const LinkSlackUserInternal = withRenderer<LinkSlackUserProps>((props) => {
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
      <DefaultLinkSlackUser {...defaultProps} />
    </NovuUI>
  );
});

LinkSlackUserInternal.displayName = 'LinkSlackUserInternal';

export const LinkSlackUser = React.memo((props: LinkSlackUserProps) => {
  return <LinkSlackUserInternal {...props} />;
});

LinkSlackUser.displayName = 'LinkSlackUser';

import React, { useMemo } from 'react';
import { useNovu } from '../../hooks/NovuProvider';
import { NovuUI, NovuUIOptions } from '../NovuUI';
import { withRenderer } from '../Renderer';
import { DefaultLinkUser, DefaultLinkUserProps } from './DefaultLinkUser';

export type LinkUserProps = DefaultLinkUserProps & Pick<NovuUIOptions, 'container'>;

const LinkUserInternal = withRenderer<LinkUserProps>((props) => {
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
      <DefaultLinkUser {...defaultProps} />
    </NovuUI>
  );
});

LinkUserInternal.displayName = 'LinkUserInternal';

export const LinkUser = React.memo((props: LinkUserProps) => {
  return <LinkUserInternal {...props} />;
});

LinkUser.displayName = 'LinkUser';

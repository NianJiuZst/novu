import React from 'react';
import { useNovuUI } from '../context/NovuUIContext';
import { Mounter } from './Mounter';
import { withRenderer } from './Renderer';

const _AIChats = React.memo(() => {
  const { novuUI } = useNovuUI();
  const mount = React.useCallback(
    (element: HTMLElement) => {
      return novuUI.mountComponent({
        name: 'AIChats',
        element,
        props: {},
      });
    },
    [novuUI]
  );

  return <Mounter mount={mount} />;
});

_AIChats.displayName = 'AIChats';

export const AIChats = withRenderer(_AIChats);

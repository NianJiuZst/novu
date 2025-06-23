import React from 'react';
import { Mounter } from './Mounter';
import { withRenderer } from './Renderer';
import { useNovuUI } from '../context/NovuUIContext';

export type NotifyProps = {
  onSuccess?: (notification: any) => void;
  onError?: (error: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
};

const _Notify = React.memo((props: NotifyProps) => {
  const { onSuccess, onError, className, size, variant } = props;
  const { novuUI } = useNovuUI();

  const mount = React.useCallback(
    (element: HTMLElement) => {
      return novuUI.mountComponent({
        name: 'Notify',
        element,
        props: {
          onSuccess,
          onError,
          className,
          size,
          variant,
        },
      });
    },
    [onSuccess, onError, className, size, variant, novuUI]
  );

  return <Mounter mount={mount} />;
});

export const Notify = withRenderer(_Notify);

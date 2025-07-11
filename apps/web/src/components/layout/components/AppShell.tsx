import { cva } from '@novu/novui/css';
import { styled } from '@novu/novui/jsx';

export const AppShell = styled(
  'div',
  cva({
    base: {
      display: 'flex',
      width: '[100vw]',
      height: '[100vh]',
      minWidth: '[1024px]',
    },
  })
);

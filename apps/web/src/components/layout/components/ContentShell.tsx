import { cva } from '@novu/novui/css';
import { styled } from '@novu/novui/jsx';

export const ContentShell = styled(
  'div',
  cva({
    base: {
      display: 'flex',
      flexDirection: 'column',
      flex: '[1 1 0%]',
      // for appropriate scroll
      overflow: 'hidden',
    },
  })
);

import { type IInputProps, Input } from '@novu/design-system';
import { css, cx } from '@novu/novui/css';
import React from 'react';

const inputPlainStyles = css({
  marginBottom: '200',

  '& label': {
    margin: '0 !important',
  },
  '& input': {
    border: 'none !important',
    paddingLeft: '0 !important',
    height: '125 !important',
    minHeight: '125 !important',
    color: 'typography.text.secondary !important',
  },
});

export const InputPlain = React.forwardRef<HTMLInputElement, IInputProps & React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...restInputProps }, ref) => {
    return <Input ref={ref} {...restInputProps} className={cx(inputPlainStyles, className)} />;
  }
);

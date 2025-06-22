import { cva, VariantProps } from 'class-variance-authority';
import { splitProps } from 'solid-js';
import { JSX } from 'solid-js/jsx-runtime';
import { cn, useStyle } from '../../helpers';
import type { AppearanceKey } from '../../types';

export const textareaVariants = cva(
  cn(
    `focus-visible:nt-outline-none focus-visible:nt-ring-2 focus-visible:nt-rounded-md focus-visible:nt-ring-ring focus-visible:nt-ring-offset-2 nt-resize-none`
  ),
  {
    variants: {
      variant: {
        default: 'nt-border nt-border-neutral-200 nt-rounded-md nt-p-2 nt-bg-background',
      },
      size: {
        default: 'nt-min-h-[80px]',
        sm: 'nt-min-h-[60px] nt-text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

type TextareaProps = JSX.IntrinsicElements['textarea'] & { appearanceKey?: AppearanceKey } & VariantProps<
    typeof textareaVariants
  >;

export const Textarea = (props: TextareaProps) => {
  const [local, rest] = splitProps(props, ['class', 'appearanceKey']);
  const style = useStyle();

  return (
    <textarea
      data-variant={props.variant}
      data-size={props.size}
      class={style(
        local.appearanceKey || 'input',
        cn(textareaVariants({ variant: props.variant, size: props.size }), local.class)
      )}
      {...rest}
    />
  );
};

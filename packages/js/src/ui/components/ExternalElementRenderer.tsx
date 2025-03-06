import { createEffect, JSX, onCleanup, splitProps } from 'solid-js';

type ExternalElementMounterProps = JSX.HTMLAttributes<HTMLDivElement> & {
  id: string;
  render: (el: HTMLDivElement) => () => void;
};

export const ExternalElementRenderer = (props: ExternalElementMounterProps) => {
  let unmount: () => void;
  let ref: HTMLDivElement;
  const [local, rest] = splitProps(props, ['render', 'id']);

  createEffect(() => {
    unmount = local.render(ref);
  });

  onCleanup(() => {
    unmount();
  });

  return (
    <div
      ref={(el) => {
        console.log('Solid.ExternalElementRenderer.ref', { el, id: local.id });
        ref = el;
      }}
      {...rest}
      data-mounter="solid"
      data-id={local.id}
    />
  );
};

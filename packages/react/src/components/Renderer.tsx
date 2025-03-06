import { ComponentType, PropsWithChildren, useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { MountedElement, RendererProvider } from '../context/RendererContext';

type RendererProps = PropsWithChildren;
export const Renderer = (props: RendererProps) => {
  const { children } = props;
  const [mountedElements, setMountedElements] = useState(
    new Map<string, { el: HTMLElement; mountedElement: MountedElement }>()
  );

  const mountElement = useCallback(
    (el: HTMLElement, mountedElement: MountedElement) => {
      const id = el.getAttribute('data-id');
      if (!el.isConnected || !id) {
        console.log('React.Renderer.mountElement.elementNotConnected', { id, el, mountedElement });

        return () => {};
      }

      console.log('React.Renderer.mountElement', {
        id,
        el,
        mountedElement,
      });

      setMountedElements((prev) => {
        const newMountedElements = new Map(prev);
        newMountedElements.set(id, { el, mountedElement });

        return newMountedElements;
      });

      return () => {
        console.log('React.Renderer.mountElement.unmountingElement', { el });
        /*
         * setMountedElements((prev) => {
         * const newMountedElements = new Map(prev);
         * newMountedElements.delete(id);
         *
         * return newMountedElements;
         * });
         *
         * setElementOrder((prev) => prev.filter((element) => element !== el));
         */
      };
    },
    [setMountedElements]
  );

  console.log('React.Renderer.render', mountedElements);

  const value = useMemo(() => ({ mountElement }), [mountElement]);

  return (
    <RendererProvider value={value}>
      {Array.from(mountedElements.values()).map((item) => {
        if (!item) return null;

        console.log('React.Renderer.renderPortal', { item });

        return createPortal(item.mountedElement, item.el);
      })}

      {children}
    </RendererProvider>
  );
};

export const withRenderer = <P extends object>(
  WrappedComponent: ComponentType<P>
): ComponentType<P & PropsWithChildren<{}>> => {
  const HOC = (props: P) => {
    return (
      <Renderer>
        <WrappedComponent {...props} />
      </Renderer>
    );
  };

  HOC.displayName = `WithRenderer(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return HOC;
};

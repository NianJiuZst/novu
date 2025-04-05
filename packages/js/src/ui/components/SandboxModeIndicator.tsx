import { createEffect, createSignal, Show } from 'solid-js';
import { useInboxContext } from '../context';
import { useStyle } from '../helpers';
import { cn } from '../helpers/cn.js';
import { Button } from './primitives';
import { Popover } from './primitives/Popover';
import { Sandbox } from '../icons/Sandbox.js';

export function SandboxModeIndicator() {
  const style = useStyle();
  const { isSandbox, applicationIdentifier } = useInboxContext();
  const [shouldShow, setShouldShow] = createSignal(false);
  const identifier = applicationIdentifier() || window.localStorage.getItem('novu_sandbox_application_identifier');

  // Use createEffect to react to changes in isSandbox
  createEffect(() => {
    const sandboxValue = isSandbox();
    setShouldShow(sandboxValue);
  });

  return (
    <Show when={shouldShow()}>
      <div
        class={style(
          'button',
          cn(
            'nt-fixed nt-bottom-5 nt-right-5 nt-z-[9999] nt-flex nt-items-center nt-justify-center',
            'nt-transition-all nt-duration-300 nt-ease-in-out'
          )
        )}
      >
        <Popover.Root>
          <Popover.Trigger
            asChild={(props) => (
              <Button
                appearanceKey="button"
                size="iconSm"
                variant="ghost"
                class={style(
                  'button',
                  cn(
                    'nt-bg-red-500/90 nt-border nt-border-neutral-alpha-100 nt-rounded-lg nt-backdrop-blur-lg',
                    'nt-p-2 nt-transition-all nt-duration-300 nt-ease-in-out',
                    'hover:nt-bg-primary-alpha-25'
                  )
                )}
                {...props}
              >
                <Sandbox class={style('icon', 'nt-size-4 nt-text-white')} />
              </Button>
            )}
          ></Popover.Trigger>
          <Popover.Content
            class={style(
              'popoverContent',
              cn(
                'nt-max-w-[300px] nt-bg-background/90 nt-border nt-border-neutral-alpha-100 nt-rounded-lg nt-backdrop-blur-lg',
                'nt-p-3 nt-text-sm nt-text-foreground'
              )
            )}
          >
            <p>
              You are running the app in sandbox mode. To trigger a notification, you need to specify the{' '}
              <code class={style('button', 'nt-bg-primary-alpha-25 nt-px-1 nt-py-0.5 nt-rounded')}>
                applicationIdentifier
              </code>
              in your trigger payload.
            </p>
            <Show when={identifier}>
              <p class={style('button', 'nt-mt-2')}>
                Your current application identifier is:
                <code class={style('button', 'nt-bg-primary-alpha-25 nt-px-1 nt-py-0.5 nt-rounded')}>{identifier}</code>
              </p>
            </Show>
          </Popover.Content>
        </Popover.Root>
      </div>
    </Show>
  );
}

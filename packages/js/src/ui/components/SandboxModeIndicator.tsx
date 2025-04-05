import { createEffect, createSignal, Show, onMount } from 'solid-js';
import { useInboxContext } from '../context';
import { useStyle } from '../helpers';
import { cn } from '../helpers/cn.js';
import { Button } from './primitives';
import { Tooltip } from './primitives/Tooltip';
import { Info } from '../icons/Info.js';

export function SandboxModeIndicator() {
  const style = useStyle();
  const { isSandbox, applicationIdentifier } = useInboxContext();
  const [isTooltipOpen, setIsTooltipOpen] = createSignal(false);
  const [shouldShow, setShouldShow] = createSignal(false);
  const [showMessage, setShowMessage] = createSignal(false);

  // Debug logs
  console.log('SandboxModeIndicator rendered');
  console.log('isSandbox:', isSandbox());
  console.log('applicationIdentifier:', applicationIdentifier());

  // Use createEffect to react to changes in isSandbox
  createEffect(() => {
    const sandboxValue = isSandbox();
    console.log('isSandbox changed to:', sandboxValue);
    setShouldShow(sandboxValue);
  });

  // Add a direct DOM element on mount
  onMount(() => {
    console.log('SandboxModeIndicator mounted');
    const div = document.createElement('div');
    div.style.position = 'fixed';
    div.style.bottom = '20px';
    div.style.right = '20px';
    div.style.zIndex = '9999';
    div.style.backgroundColor = 'red';
    div.style.color = 'white';
    div.style.padding = '10px';
    div.style.borderRadius = '5px';
    div.style.cursor = 'pointer';
    div.textContent = 'Sandbox Mode Indicator (Direct DOM)';

    // Add click event listener
    div.addEventListener('click', () => {
      setShowMessage(true);

      // Create message element
      const messageDiv = document.createElement('div');
      messageDiv.style.position = 'fixed';
      messageDiv.style.bottom = '70px';
      messageDiv.style.right = '20px';
      messageDiv.style.zIndex = '9999';
      messageDiv.style.backgroundColor = 'white';
      messageDiv.style.color = 'black';
      messageDiv.style.padding = '15px';
      messageDiv.style.borderRadius = '5px';
      messageDiv.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
      messageDiv.style.maxWidth = '300px';
      messageDiv.style.border = '1px solid #eaeaea';

      const messageText = document.createElement('p');
      messageText.textContent =
        'You are running the app in sandbox mode. To trigger a notification, you need to specify the applicationIdentifier in your trigger payload.';
      messageText.style.margin = '0 0 10px 0';

      const identifierText = document.createElement('p');
      identifierText.textContent = `Your current application identifier is: ${applicationIdentifier() || 'Not set'}`;
      identifierText.style.margin = '0';
      identifierText.style.fontSize = '12px';
      identifierText.style.color = '#666';

      const closeButton = document.createElement('button');
      closeButton.textContent = 'Close';
      closeButton.style.position = 'absolute';
      closeButton.style.top = '5px';
      closeButton.style.right = '5px';
      closeButton.style.background = 'none';
      closeButton.style.border = 'none';
      closeButton.style.cursor = 'pointer';
      closeButton.style.fontSize = '12px';
      closeButton.style.color = '#666';

      closeButton.addEventListener('click', () => {
        document.body.removeChild(messageDiv);
        setShowMessage(false);
      });

      messageDiv.appendChild(messageText);
      messageDiv.appendChild(identifierText);
      messageDiv.appendChild(closeButton);

      document.body.appendChild(messageDiv);
    });

    document.body.appendChild(div);

    return () => {
      document.body.removeChild(div);
    };
  });

  return null;
  /*
   * <Show when={shouldShow()}>
   *   <div
   *     class={style(
   *       'button',
   *       cn(
   *         'nt-fixed nt-bottom-5 nt-right-5 nt-z-[9999] nt-flex nt-items-center nt-justify-center',
   *         'nt-transition-all nt-duration-300 nt-ease-in-out',
   *         'nt-border nt-border-red-500'
   *       )
   *     )}
   *   >
   *     <Tooltip.Root>
   *       <Tooltip.Trigger
   *         asChild={(props) => (
   *           <Button
   *             appearanceKey="button"
   *             size="iconSm"
   *             variant="ghost"
   *             class={style(
   *               'button',
   *               cn(
   *                 'nt-bg-red-500/90 nt-border nt-border-neutral-alpha-100 nt-rounded-lg nt-backdrop-blur-lg',
   *                 'nt-p-2 nt-transition-all nt-duration-300 nt-ease-in-out',
   *                 'hover:nt-bg-primary-alpha-25'
   *               )
   *             )}
   *             {...props}
   *           >
   *             <Info class={style('icon', 'nt-size-4 nt-text-white')} />
   *           </Button>
   *         )}
   *       ></Tooltip.Trigger>
   *       <Tooltip.Content
   *         class={style(
   *           'popoverContent',
   *           cn(
   *             'nt-max-w-[300px] nt-bg-background/90 nt-border nt-border-neutral-alpha-100 nt-rounded-lg nt-backdrop-blur-lg',
   *             'nt-p-3 nt-text-sm nt-text-foreground'
   *           )
   *         )}
   *       >
   *         <p>
   *           You are running the app in sandbox mode. To trigger a notification, you need to specify the{' '}
   *           <code class={style('button', 'nt-bg-primary-alpha-25 nt-px-1 nt-py-0.5 nt-rounded')}>
   *             applicationIdentifier
   *           </code>{' '}
   *           in your trigger payload.
   *         </p>
   *         <Show when={applicationIdentifier()}>
   *           <p class={style('button', 'nt-mt-2')}>
   *             Your current application identifier is:{' '}
   *             <code class={style('button', 'nt-bg-primary-alpha-25 nt-px-1 nt-py-0.5 nt-rounded')}>
   *               {applicationIdentifier()}
   *             </code>
   *           </p>
   *         </Show>
   *       </Tooltip.Content>
   *     </Tooltip.Root>
   *   </div>
   * </Show>
   * );
   */
}

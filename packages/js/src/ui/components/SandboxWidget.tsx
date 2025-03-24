import { createSignal, onMount, onCleanup, Show, Component } from 'solid-js';
import { useInboxContext } from '../context/InboxContext';
import { useStyle } from '../helpers/useStyle';

interface SandboxWidgetProps {
  applicationIdentifier: string;
}

export const SandboxWidget: Component<SandboxWidgetProps> = (props) => {
  const [isExpanded, setIsExpanded] = createSignal(false);
  const style = useStyle();

  const widget = (
    <div
      class={style('sandboxWidget', 'fixed bottom-4 right-4 z-50')}
      style={{
        'font-family': 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        class={style('sandboxWidgetContainer', 'relative cursor-pointer transition-all duration-300 ease-in-out')}
        style={{
          transform: isExpanded() ? 'scale(1)' : 'scale(1)',
          width: isExpanded() ? '300px' : '40px',
          height: isExpanded() ? 'auto' : '40px',
        }}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        <div
          class={style(
            'sandboxWidgetTrigger',
            'absolute bottom-0 right-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 p-2 shadow-lg transition-all duration-300'
          )}
          style={{
            width: isExpanded() ? '100%' : '40px',
            height: isExpanded() ? '100%' : '40px',
          }}
        >
          <div
            class={style(
              'sandboxWidgetContent',
              'flex h-full w-full items-center justify-center rounded-full bg-white/10 backdrop-blur-sm'
            )}
          >
            <Show
              when={isExpanded()}
              fallback={
                <div class={style('sandboxWidgetTrigger', 'flex h-full w-full items-center justify-center')}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class={style('icon', 'h-5 w-5 text-white')}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </div>
              }
            >
              <div class={style('sandboxWidgetContent', 'flex w-full flex-col gap-2 p-3 text-white')}>
                <div class={style('sandboxWidgetTitle', 'flex items-center justify-between')}>
                  <span class={style('sandboxWidgetTitle', 'text-sm font-medium')}>Sandbox Mode</span>
                  <span class={style('sandboxWidgetBadge', 'rounded-full bg-white/20 px-2 py-0.5 text-xs')}>
                    Development
                  </span>
                </div>
                <div class={style('sandboxWidgetText', 'text-xs opacity-90')}>
                  Application Identifier:{' '}
                  <code class={style('sandboxWidgetCode', 'rounded bg-white/10 px-1 py-0.5')}>
                    {props.applicationIdentifier}
                  </code>
                </div>
                <div class={style('sandboxWidgetText', 'text-xs opacity-80')}>
                  Use this identifier to trigger notifications in development
                </div>
              </div>
            </Show>
          </div>
        </div>
      </div>
    </div>
  );

  return widget;
};

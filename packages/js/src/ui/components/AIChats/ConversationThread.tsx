import { createResource, For, Show } from 'solid-js';
import type { InboxConversationMessage } from '../../../types';
import { useLocalization, useNovu } from '../../context';
import { formatToRelativeTime, useStyle } from '../../helpers';
import Markdown from '../elements/Markdown';

function formatMessageTimestamp(createdAt: string, locale: string): string {
  const fromDate = new Date(createdAt);

  if (Number.isNaN(fromDate.getTime())) {
    return '';
  }

  return formatToRelativeTime({ fromDate, locale });
}

type ConversationThreadProps = {
  conversationId: string;
  title: string;
  agentId: string;
};

export function ConversationThread(props: ConversationThreadProps) {
  const style = useStyle();
  const { t, locale } = useLocalization();
  const novu = useNovu();

  const [messages] = createResource(
    () => props.conversationId,
    async (id) => {
      const result = await novu().conversations.messages(id, { limit: 100, orderDirection: 'ASC' });

      if (result.error) {
        throw result.error;
      }

      return result.data?.data ?? [];
    }
  );

  const bubbleClass = (m: InboxConversationMessage) =>
    m.role === 'user'
      ? 'nt-ml-auto nt-bg-primary nt-text-primary-foreground'
      : 'nt-mr-auto nt-bg-neutral-alpha-100 nt-text-foreground';

  return (
    <div
      class={style({
        key: 'aiChats__thread',
        className: 'nt-flex nt-h-full nt-min-h-0 nt-flex-1 nt-flex-col nt-overflow-hidden',
      })}
    >
      <div
        class={style({
          key: 'aiChats__thread__header',
          className:
            'nt-shrink-0 nt-border-b nt-border-border nt-bg-neutral-alpha-25 nt-px-4 nt-py-3 nt-flex nt-flex-col nt-gap-0.5',
        })}
      >
        <span
          class={style({
            key: 'aiChats__thread__title',
            className: 'nt-text-sm nt-font-semibold nt-truncate',
          })}
        >
          {props.title}
        </span>
        <span
          class={style({
            key: 'aiChats__thread__agent',
            className: 'nt-text-xs nt-text-foreground-alpha-600',
          })}
        >
          {props.agentId}
        </span>
      </div>
      <div
        class={style({
          key: 'aiChats__thread__scroll',
          className: 'nt-flex-1 nt-overflow-y-auto nt-px-4 nt-py-3 nt-flex nt-flex-col nt-gap-3',
        })}
      >
        <Show when={messages.loading}>
          <p class="nt-text-sm nt-text-foreground-alpha-600">…</p>
        </Show>
        <Show when={messages.error}>
          <p class="nt-text-sm nt-text-destructive">{(messages.error as Error)?.message}</p>
        </Show>
        <Show when={!messages.loading && !messages.error && (messages() ?? []).length === 0}>
          <p class="nt-text-sm nt-text-foreground-alpha-600">{t('aiChats.threadEmpty')}</p>
        </Show>
        <For each={messages()}>
          {(m) => (
            <div
              class={style({
                key: 'aiChats__thread__row',
                className: 'nt-flex nt-w-full nt-flex-col nt-gap-1',
              })}
            >
              <div
                class={style({
                  key: 'aiChats__thread__bubbleWrap',
                  className: 'nt-flex nt-w-full nt-max-w-[min(100%,520px)]',
                })}
              >
                <div
                  class={style({
                    key: 'aiChats__thread__bubble',
                    className: `nt-max-w-full nt-rounded-2xl nt-px-3 nt-py-2 nt-text-sm nt-shadow-sm ${bubbleClass(m)}`,
                  })}
                >
                  <Markdown
                    appearanceKey="aiChats__message"
                    strongAppearanceKey="aiChats__message__strong"
                    emAppearanceKey="aiChats__message__em"
                    class="nt-text-start nt-whitespace-pre-wrap [word-break:break-word]"
                  >
                    {m.content}
                  </Markdown>
                </div>
              </div>
              <div
                class={style({
                  key: 'aiChats__thread__meta',
                  className: 'nt-flex nt-flex-wrap nt-items-center nt-gap-2 nt-text-[11px] nt-text-foreground-alpha-500',
                })}
              >
                <span>{formatMessageTimestamp(m.createdAt, locale())}</span>
                <Show when={m.senderName}>
                  {(name) => <span>{name()}</span>}
                </Show>
                <Show when={m.platform}>
                  {(platform) => (
                    <span>
                      {t('aiChats.via')} {platform()}
                    </span>
                  )}
                </Show>
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}

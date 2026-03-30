import { Show } from 'solid-js';
import type { InboxConversation } from '../../../types';
import { useLocalization } from '../../context';
import { formatToRelativeTime, useStyle } from '../../helpers';

type ConversationCardProps = {
  conversation: InboxConversation;
  onSelect: () => void;
};

export function ConversationCard(props: ConversationCardProps) {
  const style = useStyle();
  const { t, locale } = useLocalization();
  const c = () => props.conversation;

  const messageCountText = () => {
    const count = c().messageCount;

    if (count === 0) {
      return `0 ${t('aiChats.messages')}`;
    }

    if (count === 1) {
      return `1 ${t('aiChats.message')}`;
    }

    return `${count} ${t('aiChats.messages')}`;
  };
  const timeLabel = () => {
    const raw = c().lastMessageAt || c().updatedAt || c().createdAt;

    if (!raw) {
      return '';
    }

    const fromDate = new Date(raw);

    if (Number.isNaN(fromDate.getTime())) {
      return '';
    }

    return formatToRelativeTime({ fromDate, locale: locale() });
  };

  return (
    <button
      type="button"
      onClick={() => props.onSelect()}
      class={style({
        key: 'aiChats__conversationCard',
        className:
          'nt-w-full nt-text-left nt-rounded-lg nt-border nt-border-border nt-bg-background nt-p-3 nt-transition-colors hover:nt-bg-neutral-alpha-50 focus-visible:nt-outline-none focus-visible:nt-ring-2 focus-visible:nt-ring-primary nt-flex nt-flex-col nt-gap-1',
      })}
    >
      <div class="nt-flex nt-items-start nt-justify-between nt-gap-2">
        <div class="nt-flex nt-min-w-0 nt-flex-1 nt-flex-col nt-gap-0.5">
          <span
            class={style({
              key: 'aiChats__conversationCard__title',
              className: 'nt-text-sm nt-font-semibold nt-truncate nt-text-foreground',
            })}
          >
            {c().title || c().agentId}
          </span>
          <Show when={c().title}>
            <span
              class={style({
                key: 'aiChats__conversationCard__agent',
                className: 'nt-text-xs nt-text-foreground-alpha-600',
              })}
            >
              {c().agentId}
            </span>
          </Show>
          <Show when={!c().title && c().platform}>
            <span
              class={style({
                key: 'aiChats__conversationCard__platform',
                className: 'nt-text-xs nt-capitalize nt-text-foreground-alpha-600',
              })}
            >
              {c().platform}
            </span>
          </Show>
        </div>
        <div class="nt-flex nt-shrink-0 nt-flex-col nt-items-end nt-gap-1">
          <Show when={timeLabel()}>
            {(label) => (
              <span
                class={style({
                  key: 'aiChats__conversationCard__time',
                  className: 'nt-text-xs nt-text-foreground-alpha-500',
                })}
              >
                {label()}
              </span>
            )}
          </Show>
          <span
            class={style({
              key: 'aiChats__conversationCard__status',
              className:
                'nt-inline-flex nt-rounded-md nt-border nt-border-border nt-bg-neutral-alpha-50 nt-px-1.5 nt-py-0.5 nt-text-[10px] nt-font-medium nt-capitalize nt-text-foreground',
            })}
          >
            {c().status}
          </span>
        </div>
      </div>
      <Show when={c().lastMessagePreview}>
        {(preview) => (
          <p
            class={style({
              key: 'aiChats__conversationCard__preview',
              className: 'nt-line-clamp-2 nt-text-xs nt-text-foreground-alpha-700',
            })}
          >
            {preview()}
          </p>
        )}
      </Show>
      <Show when={!c().lastMessagePreview && c().messageCount === 0}>
        <p
          data-localization="aiChats.conversationNoMessagesYet"
          class={style({
            key: 'aiChats__conversationCard__emptyPreview',
            className: 'nt-text-xs nt-text-foreground-alpha-600 nt-italic',
          })}
        >
          {t('aiChats.conversationNoMessagesYet')}
        </p>
      </Show>
      <div
        class={style({
          key: 'aiChats__conversationCard__meta',
          className: 'nt-flex nt-items-center nt-gap-2 nt-text-[11px] nt-text-foreground-alpha-500',
        })}
      >
        <span data-localization="aiChats.messages">{messageCountText()}</span>
        <Show when={c().platform}>
          {(platform) => (
            <span>
              {t('aiChats.via')} {platform()}
            </span>
          )}
        </Show>
      </div>
    </button>
  );
}

import { createResource, For, Show, createSignal } from 'solid-js';
import type { InboxConversation } from '../../../types';
import { useLocalization, useNovu } from '../../context';
import { useStyle } from '../../helpers';
import { AIChatsHeader } from './AIChatsHeader';
import { ConversationCard } from './ConversationCard';
import { ConversationThread } from './ConversationThread';

type AIChatsPageProps = {
  navigateToNotifications?: () => void;
};

export function AIChatsPage(props: AIChatsPageProps) {
  const style = useStyle();
  const { t } = useLocalization();
  const novu = useNovu();
  const [selected, setSelected] = createSignal<InboxConversation | null>(null);

  const [list] = createResource(async () => {
    const result = await novu().conversations.list({ limit: 50 });

    if (result.error) {
      throw result.error;
    }

    return result.data?.data ?? [];
  });

  return (
    <div
      class={style({
        key: 'aiChatsPage',
        className: 'nt-flex nt-h-full nt-min-h-0 nt-flex-1 nt-flex-col nt-overflow-hidden',
      })}
    >
      <Show when={!selected()}>
        <AIChatsHeader onBack={props.navigateToNotifications} />
        <div
          class={style({
            key: 'aiChatsPage__list',
            className: 'nv-aiChatsList nt-flex-1 nt-overflow-y-auto nt-px-4 nt-py-3 nt-flex nt-flex-col nt-gap-2',
          })}
        >
          <Show when={list.loading}>
            <p class="nt-text-sm nt-text-foreground-alpha-600">…</p>
          </Show>
          <Show when={list.error}>
            <p class="nt-text-sm nt-text-destructive">{(list.error as Error)?.message}</p>
          </Show>
          <Show when={!list.loading && !list.error && (list() ?? []).length === 0}>
            <p class="nt-text-sm nt-text-foreground-alpha-600">{t('aiChats.empty')}</p>
          </Show>
          <For each={list()}>
            {(conversation) => (
              <ConversationCard conversation={conversation} onSelect={() => setSelected(conversation)} />
            )}
          </For>
        </div>
      </Show>
      <Show when={selected()}>
        {(c) => (
          <>
            <AIChatsHeader onBack={() => setSelected(null)} />
            <ConversationThread
              conversationId={c().id}
              title={c().title || c().agentId}
              agentId={c().agentId}
            />
          </>
        )}
      </Show>
    </div>
  );
}

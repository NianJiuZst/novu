import { createSignal, createMemo, Show, For, onMount } from 'solid-js';
import { JSX } from 'solid-js/jsx-runtime';

import { useLocalization, useNovu } from '../../../context';
import { useStyle } from '../../../helpers';
import { Sparkle, ArrowRight } from '../../../icons';
import { Button } from '../../primitives/Button';
import { Textarea } from '../../primitives/Textarea';
import { Badge } from '../../primitives/Badge';
import { Motion } from '../../primitives/Motion';

type CustomNotification = {
  _id: string;
  query: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export const MyNotifications = () => {
  const style = useStyle();
  const { t } = useLocalization();
  const novu = useNovu();

  const [customNotifications, setCustomNotifications] = createSignal<CustomNotification[]>([]);
  const [newQuery, setNewQuery] = createSignal('');
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [showForm, setShowForm] = createSignal(false);
  const [isLoading, setIsLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);

  const canSubmit = createMemo(() => {
    const query = newQuery().trim();

    return query.length >= 10 && query.length <= 500;
  });

  const handleQueryChange = (event: Event) => {
    const target = event.target as HTMLTextAreaElement;
    setNewQuery(target.value);
  };

  const loadCustomNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Call the custom notifications API
      const response = await fetch('/v1/inbox/custom-notifications', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${novu.session?.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load custom notifications');
      }

      const notifications = await response.json();
      setCustomNotifications(
        notifications.map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt),
          updatedAt: new Date(n.updatedAt),
        }))
      );
    } catch (error) {
      console.error('Failed to load custom notifications:', error);
      setError('Failed to load custom notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/v1/inbox/custom-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${novu.session?.token}`,
        },
        body: JSON.stringify({
          query: newQuery().trim(),
          enabled: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create custom notification');
      }

      const newNotification = await response.json();
      setCustomNotifications((prev) => [
        ...prev,
        {
          ...newNotification,
          createdAt: new Date(newNotification.createdAt),
          updatedAt: new Date(newNotification.updatedAt),
        },
      ]);

      setNewQuery('');
      setShowForm(false);
    } catch (error) {
      console.error('Failed to create custom notification:', error);
      setError(error instanceof Error ? error.message : 'Failed to create custom notification');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      const response = await fetch(`/v1/inbox/custom-notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${novu.session?.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete custom notification');
      }

      setCustomNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (error) {
      console.error('Failed to delete custom notification:', error);
      setError('Failed to delete custom notification');
    }
  };

  const handleToggleEnabled = async (id: string, enabled: boolean) => {
    try {
      const response = await fetch(`/v1/inbox/custom-notifications/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${novu.session?.token}`,
        },
        body: JSON.stringify({ enabled }),
      });

      if (!response.ok) {
        throw new Error('Failed to update custom notification');
      }

      const updatedNotification = await response.json();
      setCustomNotifications((prev) =>
        prev.map((n) =>
          n._id === id
            ? {
                ...updatedNotification,
                createdAt: new Date(updatedNotification.createdAt),
                updatedAt: new Date(updatedNotification.updatedAt),
              }
            : n
        )
      );
    } catch (error) {
      console.error('Failed to update custom notification:', error);
      setError('Failed to update custom notification');
    }
  };

  // Load custom notifications on mount
  onMount(() => {
    loadCustomNotifications();
  });

  const sparkleIconClass = style('myNotifications__sparkleIcon', 'nt-text-primary nt-size-4');

  return (
    <div class={style('myNotificationsContainer', 'nt-space-y-4')}>
      {/* Error Message */}
      <Show when={error()}>
        <div
          class={style(
            'myNotificationsError',
            'nt-p-3 nt-bg-destructive/10 nt-border nt-border-destructive/20 nt-rounded-lg'
          )}
        >
          <p class={style('myNotificationsErrorText', 'nt-text-sm nt-text-destructive')}>{error()}</p>
        </div>
      </Show>

      {/* Header Section */}
      <div
        class={style(
          'myNotificationsHeader',
          'nt-p-4 nt-bg-gradient-to-r nt-from-primary-alpha-50 nt-to-secondary-alpha-50 nt-rounded-lg nt-border nt-border-primary-alpha-100'
        )}
      >
        <div class={style('myNotificationsHeaderContent', 'nt-flex nt-items-start nt-gap-3 nt-mb-3')}>
          <div class={style('myNotificationsIconContainer', 'nt-mt-0.5')}>
            <Sparkle class={sparkleIconClass} />
          </div>
          <div class={style('myNotificationsContent', 'nt-flex-1')}>
            <div class={style('myNotificationsTitle', 'nt-flex nt-items-center nt-gap-2 nt-mb-1')}>
              <h3 class={style('myNotificationsLabel', 'nt-text-base nt-font-semibold nt-text-foreground')}>
                {t('myNotifications.title')}
              </h3>
              <Badge
                class={style(
                  'myNotificationsBadge',
                  'nt-px-2 nt-py-0.5 nt-text-xs nt-bg-primary-alpha-100 nt-text-primary nt-font-medium'
                )}
              >
                {t('myNotifications.badge')}
              </Badge>
            </div>
            <p
              class={style('myNotificationsDescription', 'nt-text-sm nt-text-foreground-alpha-600 nt-leading-relaxed')}
            >
              {t('myNotifications.description')}
            </p>
          </div>
        </div>

        <Show when={!showForm() && !isLoading()}>
          <Button
            class={style(
              'myNotificationsAddButton',
              'nt-w-full nt-justify-center nt-bg-primary nt-text-primary-foreground nt-hover:bg-primary/90'
            )}
            onClick={() => setShowForm(true)}
          >
            <Sparkle class={style('icon', 'nt-size-4 nt-mr-2')} />
            {t('myNotifications.addButton')}
          </Button>
        </Show>
      </div>

      {/* Form Section */}
      <Show when={showForm()}>
        <Motion.div
          animate={{ opacity: 1, scale: 1 }}
          initial={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2, easing: 'ease-out' }}
          class={style(
            'myNotificationsForm',
            'nt-p-4 nt-bg-background nt-border nt-border-border nt-rounded-lg nt-space-y-4'
          )}
        >
          <div class={style('myNotificationsFormHeader', 'nt-space-y-2')}>
            <h4 class={style('myNotificationsFormTitle', 'nt-text-sm nt-font-medium nt-text-foreground')}>
              {t('myNotifications.form.title')}
            </h4>
            <p class={style('myNotificationsFormDescription', 'nt-text-xs nt-text-foreground-alpha-600')}>
              {t('myNotifications.form.description')}
            </p>
          </div>

          <div class={style('myNotificationsFormField', 'nt-space-y-2')}>
            <label class={style('myNotificationsFormLabel', 'nt-block nt-text-xs nt-font-medium nt-text-foreground')}>
              {t('myNotifications.form.label')}
            </label>
            <Textarea
              value={newQuery()}
              onInput={handleQueryChange}
              placeholder={t('myNotifications.form.placeholder')}
              class={style('myNotificationsFormTextarea', 'nt-w-full nt-min-h-[80px] nt-text-sm nt-resize-none')}
              disabled={isSubmitting()}
            />
            <div class={style('myNotificationsFormMeta', 'nt-flex nt-justify-between nt-items-center nt-text-xs')}>
              <span class={style('myNotificationsFormHint', 'nt-text-foreground-alpha-500')}>
                {t('myNotifications.form.hint')}
              </span>
              <span
                class={style(
                  'myNotificationsFormCounter',
                  newQuery().length > 450
                    ? 'nt-text-foreground-alpha-500 nt-text-destructive'
                    : 'nt-text-foreground-alpha-500'
                )}
              >
                {newQuery().length}/500
              </span>
            </div>
          </div>

          <div class={style('myNotificationsFormActions', 'nt-flex nt-gap-2 nt-justify-end')}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowForm(false);
                setNewQuery('');
                setError(null);
              }}
              disabled={isSubmitting()}
            >
              {t('myNotifications.form.cancel')}
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!canSubmit() || isSubmitting()}
              class={style(
                'myNotificationsFormSubmit',
                'nt-bg-primary nt-text-primary-foreground nt-hover:bg-primary/90'
              )}
            >
              <Show
                when={isSubmitting()}
                fallback={
                  <>
                    <ArrowRight class={style('icon', 'nt-size-3 nt-mr-1')} />
                    {t('myNotifications.form.submit')}
                  </>
                }
              >
                {t('myNotifications.form.submitting')}
              </Show>
            </Button>
          </div>
        </Motion.div>
      </Show>

      {/* Loading State */}
      <Show when={isLoading()}>
        <div class={style('myNotificationsLoading', 'nt-text-center nt-py-8 nt-text-foreground-alpha-500')}>
          <p class={style('myNotificationsLoadingText', 'nt-text-sm')}>Loading custom notifications...</p>
        </div>
      </Show>

      {/* Custom Notifications List */}
      <Show when={customNotifications().length > 0 && !isLoading()}>
        <div class={style('myNotificationsList', 'nt-space-y-3')}>
          <h4 class={style('myNotificationsListTitle', 'nt-text-sm nt-font-medium nt-text-foreground nt-px-1')}>
            {t('myNotifications.list.title')} ({customNotifications().length})
          </h4>
          <For each={customNotifications()}>
            {(notification) => (
              <Motion.div
                animate={{ opacity: 1, x: 0 }}
                initial={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3, easing: 'ease-out' }}
                class={style(
                  'myNotificationsListItem',
                  'nt-p-3 nt-bg-neutral-alpha-25 nt-border nt-border-border nt-rounded-lg nt-group nt-hover:bg-neutral-alpha-50 nt-transition-colors'
                )}
              >
                <div
                  class={style('myNotificationsListItemContent', 'nt-flex nt-justify-between nt-items-start nt-gap-3')}
                >
                  <div class={style('myNotificationsListItemText', 'nt-flex-1 nt-min-w-0')}>
                    <p class={style('myNotificationsListItemQuery', 'nt-text-sm nt-text-foreground nt-break-words')}>
                      "{notification.query}"
                    </p>
                    <p class={style('myNotificationsListItemDate', 'nt-text-xs nt-text-foreground-alpha-500 nt-mt-1')}>
                      {t('myNotifications.list.createdAt')} {notification.createdAt.toLocaleDateString()}
                    </p>
                    <div class={style('myNotificationsListItemActions', 'nt-flex nt-items-center nt-gap-2 nt-mt-2')}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleEnabled(notification._id, !notification.enabled)}
                        class={style('myNotificationsListItemToggle', 'nt-text-xs nt-px-2 nt-py-1')}
                      >
                        {notification.enabled ? 'Disable' : 'Enable'}
                      </Button>
                      <span
                        class={style(
                          'myNotificationsListItemStatus',
                          `nt-text-xs ${notification.enabled ? 'nt-text-green-600' : 'nt-text-gray-500'}`
                        )}
                      >
                        {notification.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(notification._id)}
                    class={style(
                      'myNotificationsListItemRemove',
                      'nt-opacity-0 group-hover:nt-opacity-100 nt-transition-opacity nt-text-destructive nt-hover:bg-destructive/10'
                    )}
                  >
                    ×
                  </Button>
                </div>
              </Motion.div>
            )}
          </For>
        </div>
      </Show>

      {/* Empty State */}
      <Show when={customNotifications().length === 0 && !showForm() && !isLoading()}>
        <div class={style('myNotificationsEmpty', 'nt-text-center nt-py-8 nt-text-foreground-alpha-500')}>
          <p class={style('myNotificationsEmptyText', 'nt-text-sm')}>{t('myNotifications.empty')}</p>
        </div>
      </Show>
    </div>
  );
};

import { createSignal, createMemo, Show, For } from 'solid-js';
import { JSX } from 'solid-js/jsx-runtime';

import { useLocalization } from '../../../context';
import { useStyle } from '../../../helpers';
import { Sparkle, ArrowRight } from '../../../icons';
import { Button } from '../../primitives/Button';
import { Textarea } from '../../primitives/Textarea';
import { Badge } from '../../primitives/Badge';
import { Motion } from '../../primitives/Motion';

type CustomNotification = {
  id: string;
  query: string;
  createdAt: Date;
};

export const MyNotifications = () => {
  const style = useStyle();
  const { t } = useLocalization();

  const [customNotifications, setCustomNotifications] = createSignal<CustomNotification[]>([]);
  const [newQuery, setNewQuery] = createSignal('');
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [showForm, setShowForm] = createSignal(false);

  const canSubmit = createMemo(() => {
    const query = newQuery().trim();

    return query.length >= 10 && query.length <= 500;
  });

  const handleQueryChange = (event: Event) => {
    const target = event.target as HTMLTextAreaElement;
    setNewQuery(target.value);
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;

    setIsSubmitting(true);

    try {
      // TODO: Replace with actual API call to create custom notification preference
      const newNotification: CustomNotification = {
        id: crypto.randomUUID(),
        query: newQuery().trim(),
        createdAt: new Date(),
      };

      setCustomNotifications((prev) => [...prev, newNotification]);
      setNewQuery('');
      setShowForm(false);

      // TODO: Create preference entry for 'my-notifications' workflow
      console.log('Creating custom notification:', newNotification);
    } catch (error) {
      console.error('Failed to create custom notification:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = (id: string) => {
    setCustomNotifications((prev) => prev.filter((n) => n.id !== id));
    // TODO: Remove from preferences API
  };

  const sparkleIconClass = style('myNotifications__sparkleIcon', 'nt-text-primary nt-size-4');

  return (
    <div class={style('myNotificationsContainer', 'nt-space-y-4')}>
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

        <Show when={!showForm()}>
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

      {/* Custom Notifications List */}
      <Show when={customNotifications().length > 0}>
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
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(notification.id)}
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
      <Show when={customNotifications().length === 0 && !showForm()}>
        <div class={style('myNotificationsEmpty', 'nt-text-center nt-py-8 nt-text-foreground-alpha-500')}>
          <p class={style('myNotificationsEmptyText', 'nt-text-sm')}>{t('myNotifications.empty')}</p>
        </div>
      </Show>
    </div>
  );
};

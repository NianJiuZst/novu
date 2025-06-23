import { createSignal, createMemo, Show } from 'solid-js';
import { JSX } from 'solid-js/jsx-runtime';

import { useLocalization, useNovu } from '../../../context';
import { useStyle } from '../../../helpers';
import { Sparkle, ArrowRight, Check } from '../../../icons';
import { Button } from '../../primitives/Button';
import { Textarea } from '../../primitives/Textarea';
import { Motion } from '../../primitives/Motion';
import { Tooltip } from '../../primitives/Tooltip';

type NotifyProps = {
  onSuccess?: (notification: any) => void;
  onError?: (error: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
};

export const Notify = (props: NotifyProps) => {
  const style = useStyle();
  const { t } = useLocalization();
  const novu = useNovu();

  const [isOpen, setIsOpen] = createSignal(false);
  const [newQuery, setNewQuery] = createSignal('');
  const [newContent, setNewContent] = createSignal('');
  const [isOneTime, setIsOneTime] = createSignal(false);
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [showSuccess, setShowSuccess] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  const canSubmit = createMemo(() => {
    const query = newQuery().trim();
    const content = newContent().trim();

    return query.length >= 10 && query.length <= 500 && content.length >= 5 && content.length <= 1000;
  });

  const handleQueryChange = (event: Event) => {
    const target = event.target as HTMLTextAreaElement;
    setNewQuery(target.value);
  };

  const handleContentChange = (event: Event) => {
    const target = event.target as HTMLTextAreaElement;
    setNewContent(target.value);
  };

  const handleOneTimeChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    setIsOneTime(target.checked);
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const newNotification = await novu.inboxService.createCustomNotification({
        query: newQuery().trim(),
        content: newContent().trim(),
        enabled: true,
        isOneTime: isOneTime(),
      });

      setShowSuccess(true);
      props.onSuccess?.(newNotification);

      // Reset form after success
      setTimeout(() => {
        setNewQuery('');
        setNewContent('');
        setIsOneTime(false);
        setIsOpen(false);
        setShowSuccess(false);
      }, 1500);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('notify.form.error');
      setError(errorMessage);
      props.onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setNewQuery('');
    setNewContent('');
    setIsOneTime(false);
    setError(null);
    setShowSuccess(false);
  };

  const buttonSize = () => {
    switch (props.size) {
      case 'sm':
        return 'nt-px-3 nt-py-2 nt-text-sm';
      case 'lg':
        return 'nt-px-6 nt-py-3 nt-text-base';
      default:
        return 'nt-px-4 nt-py-2.5 nt-text-sm';
    }
  };

  const iconSize = () => {
    switch (props.size) {
      case 'sm':
        return 'nt-size-3.5';
      case 'lg':
        return 'nt-size-5';
      default:
        return 'nt-size-4';
    }
  };

  const getButtonVariant = () => {
    switch (props.variant) {
      case 'outline':
        return 'nt-border nt-border-primary nt-bg-transparent nt-text-primary nt-hover:bg-primary nt-hover:text-primary-foreground';
      case 'ghost':
        return 'nt-bg-transparent nt-text-primary nt-hover:bg-primary-alpha-100';
      default:
        return 'nt-bg-gradient-to-r nt-from-primary nt-to-primary/90 nt-text-primary-foreground nt-hover:from-primary/90 nt-hover:to-primary/80 nt-shadow-lg nt-shadow-primary/25';
    }
  };

  return (
    <div class={`${style('notifyContainer', 'nt-relative nt-inline-block')} ${props.className || ''}`}>
      {/* Smart Notify Button */}
      <Tooltip.Root>
        <Tooltip.Trigger
          asChild={(triggerProps: any) => (
            <Button
              {...triggerProps}
              onClick={() => setIsOpen(!isOpen())}
              class={style(
                'notifyButton',
                `nt-inline-flex nt-items-center nt-gap-2 nt-font-medium nt-rounded-lg nt-transition-all nt-duration-200 nt-transform nt-hover:scale-105 nt-active:scale-95 ${buttonSize()} ${getButtonVariant()}`
              )}
            >
              <Show when={showSuccess()} fallback={<Sparkle class={`${style('notifyIcon')} ${iconSize()}`} />}>
                <Check class={`${style('notifySuccessIcon')} ${iconSize()}`} />
              </Show>
              {t('notify.button')}
            </Button>
          )}
        />
        <Tooltip.Content>{t('notify.tooltip')}</Tooltip.Content>
      </Tooltip.Root>

      {/* Notification Form Modal */}
      <Show when={isOpen()}>
        <Motion.div
          animate={{ opacity: 1, scale: 1, y: 0 }}
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.2, easing: 'ease-out' }}
          class={style(
            'notifyModal',
            'nt-absolute nt-top-full nt-left-0 nt-mt-2 nt-w-96 nt-max-w-[90vw] nt-bg-background nt-border nt-border-border nt-rounded-xl nt-shadow-2xl nt-shadow-black/10 nt-backdrop-blur-sm nt-z-50'
          )}
        >
          {/* Modal Header */}
          <div class={style('notifyModalHeader', 'nt-p-4 nt-border-b nt-border-border')}>
            <div class={style('notifyModalHeaderContent', 'nt-flex nt-items-center nt-gap-3')}>
              <div
                class={style(
                  'notifyModalIcon',
                  'nt-flex nt-items-center nt-justify-center nt-w-8 nt-h-8 nt-bg-gradient-to-br nt-from-primary nt-to-primary/80 nt-rounded-lg'
                )}
              >
                <Sparkle class={style('notifyModalSparkle', 'nt-size-4 nt-text-primary-foreground')} />
              </div>
              <div class={style('notifyModalTitleContainer', 'nt-flex-1')}>
                <h3 class={style('notifyModalTitle', 'nt-text-base nt-font-semibold nt-text-foreground')}>
                  {t('notify.form.title')}
                </h3>
                <p class={style('notifyModalDescription', 'nt-text-xs nt-text-foreground-alpha-600 nt-mt-0.5')}>
                  {t('notify.form.description')}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                class={style(
                  'notifyModalClose',
                  'nt-w-6 nt-h-6 nt-p-0 nt-text-foreground-alpha-500 nt-hover:text-foreground'
                )}
              >
                ×
              </Button>
            </div>
          </div>

          {/* Success State */}
          <Show when={showSuccess()}>
            <Motion.div
              animate={{ opacity: 1, scale: 1 }}
              initial={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, easing: 'ease-out' }}
              class={style('notifySuccess', 'nt-p-6 nt-text-center')}
            >
              <div
                class={style(
                  'notifySuccessIcon',
                  'nt-w-12 nt-h-12 nt-mx-auto nt-mb-3 nt-bg-green-100 nt-rounded-full nt-flex nt-items-center nt-justify-center'
                )}
              >
                <Check class={style('checkIcon', 'nt-size-6 nt-text-green-600')} />
              </div>
              <p class={style('notifySuccessText', 'nt-text-sm nt-font-medium nt-text-foreground')}>
                {t('notify.form.success')}
              </p>
            </Motion.div>
          </Show>

          {/* Form Content */}
          <Show when={!showSuccess()}>
            <div class={style('notifyModalContent', 'nt-p-4 nt-space-y-4')}>
              {/* Error Message */}
              <Show when={error()}>
                <Motion.div
                  animate={{ opacity: 1, x: 0 }}
                  initial={{ opacity: 0, x: -10 }}
                  class={style(
                    'notifyError',
                    'nt-p-3 nt-bg-destructive/10 nt-border nt-border-destructive/20 nt-rounded-lg'
                  )}
                >
                  <p class={style('notifyErrorText', 'nt-text-sm nt-text-destructive')}>{error()}</p>
                </Motion.div>
              </Show>

              {/* Query Field */}
              <div class={style('notifyFormField', 'nt-space-y-2')}>
                <label class={style('notifyFormLabel', 'nt-block nt-text-xs nt-font-medium nt-text-foreground')}>
                  {t('myNotifications.form.label')}
                </label>
                <Textarea
                  value={newQuery()}
                  onInput={handleQueryChange}
                  placeholder={t('myNotifications.form.placeholder')}
                  class={style(
                    'notifyFormTextarea',
                    'nt-w-full nt-min-h-[80px] nt-text-sm nt-resize-none nt-border-border nt-focus:border-primary nt-focus:ring-2 nt-focus:ring-primary/20'
                  )}
                  disabled={isSubmitting()}
                />
                <div class={style('notifyFormMeta', 'nt-flex nt-justify-between nt-items-center nt-text-xs')}>
                  <span class={style('notifyFormHint', 'nt-text-foreground-alpha-500')}>
                    {t('myNotifications.form.hint')}
                  </span>
                  <span
                    class={style(
                      'notifyFormCounter',
                      newQuery().length > 450 ? 'nt-text-destructive' : 'nt-text-foreground-alpha-500'
                    )}
                  >
                    {newQuery().length}/500
                  </span>
                </div>
              </div>

              {/* Content Field */}
              <div class={style('notifyFormField', 'nt-space-y-2')}>
                <label class={style('notifyFormLabel', 'nt-block nt-text-xs nt-font-medium nt-text-foreground')}>
                  {t('myNotifications.form.contentLabel')}
                </label>
                <Textarea
                  value={newContent()}
                  onInput={handleContentChange}
                  placeholder={t('myNotifications.form.contentPlaceholder')}
                  class={style(
                    'notifyFormTextarea',
                    'nt-w-full nt-min-h-[80px] nt-text-sm nt-resize-none nt-border-border nt-focus:border-primary nt-focus:ring-2 nt-focus:ring-primary/20'
                  )}
                  disabled={isSubmitting()}
                />
                <div class={style('notifyFormMeta', 'nt-flex nt-justify-between nt-items-center nt-text-xs')}>
                  <span class={style('notifyFormHint', 'nt-text-foreground-alpha-500')}>
                    {t('myNotifications.form.contentHint')}
                  </span>
                  <span
                    class={style(
                      'notifyFormCounter',
                      newContent().length > 900 ? 'nt-text-destructive' : 'nt-text-foreground-alpha-500'
                    )}
                  >
                    {newContent().length}/1000
                  </span>
                </div>
              </div>

              {/* One-time Checkbox */}
              <div class={style('notifyFormField', 'nt-space-y-2')}>
                <div class={style('notifyFormCheckbox', 'nt-flex nt-items-center nt-gap-2')}>
                  <input
                    type="checkbox"
                    id="notifyOneTime"
                    checked={isOneTime()}
                    onChange={handleOneTimeChange}
                    disabled={isSubmitting()}
                    class={style('notifyFormCheckboxInput', 'nt-w-4 nt-h-4 nt-text-primary nt-rounded')}
                  />
                  <label
                    for="notifyOneTime"
                    class={style(
                      'notifyFormCheckboxLabel',
                      'nt-text-xs nt-font-medium nt-text-foreground nt-cursor-pointer'
                    )}
                  >
                    {t('myNotifications.form.oneTimeLabel')}
                  </label>
                </div>
                <p class={style('notifyFormCheckboxHint', 'nt-text-xs nt-text-foreground-alpha-500 nt-ml-6')}>
                  {t('myNotifications.form.oneTimeHint')}
                </p>
              </div>

              {/* Form Actions */}
              <div class={style('notifyFormActions', 'nt-flex nt-gap-2 nt-pt-2')}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  disabled={isSubmitting()}
                  class={style('notifyFormCancel', 'nt-flex-1')}
                >
                  {t('myNotifications.form.cancel')}
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={!canSubmit() || isSubmitting()}
                  class={style(
                    'notifyFormSubmit',
                    'nt-flex-1 nt-bg-primary nt-text-primary-foreground nt-hover:bg-primary/90'
                  )}
                >
                  <Show
                    when={isSubmitting()}
                    fallback={
                      <>
                        <ArrowRight class={style('submitIcon', 'nt-size-3 nt-mr-1')} />
                        {t('myNotifications.form.submit')}
                      </>
                    }
                  >
                    {t('myNotifications.form.submitting')}
                  </Show>
                </Button>
              </div>
            </div>
          </Show>
        </Motion.div>
      </Show>

      {/* Backdrop */}
      <Show when={isOpen()}>
        <div class={style('notifyBackdrop', 'nt-fixed nt-inset-0 nt-z-40')} onClick={handleClose} />
      </Show>
    </div>
  );
};

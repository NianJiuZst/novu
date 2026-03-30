import { Show } from 'solid-js';
import { useLocalization } from '../../context';
import { useStyle } from '../../helpers';
import { ArrowLeft as DefaultArrowLeft } from '../../icons';
import { Button } from '../primitives';
import { IconRendererWrapper } from '../shared/IconRendererWrapper';

type AIChatsHeaderProps = {
  onBack?: () => void;
};

export function AIChatsHeader(props: AIChatsHeaderProps) {
  const style = useStyle();
  const { t } = useLocalization();
  const arrowLeftIconClass = style({
    key: 'aiChatsHeader__back__icon',
    className: 'nt-size-4',
    iconKey: 'arrowLeft',
  });

  return (
    <div
      class={style({
        key: 'aiChatsHeader',
        className:
          'nt-flex nt-bg-neutral-alpha-25 nt-shrink-0 nt-border-b nt-border-border nt-items-center nt-py-3.5 nt-px-4 nt-gap-2',
      })}
    >
      <Show when={props.onBack}>
        {(goBack) => (
          <Button
            appearanceKey="aiChatsHeader__back"
            class="nt-text-foreground-alpha-600"
            variant="unstyled"
            size="none"
            onClick={goBack()}
          >
            <IconRendererWrapper
              iconKey="arrowLeft"
              class={arrowLeftIconClass}
              fallback={<DefaultArrowLeft class={arrowLeftIconClass} />}
            />
          </Button>
        )}
      </Show>
      <div
        data-localization="aiChats.title"
        class={style({
          key: 'aiChatsHeader__title',
          className: 'nt-text-base nt-font-medium',
        })}
      >
        {t('aiChats.title')}
      </div>
    </div>
  );
}

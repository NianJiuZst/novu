import { Show } from 'solid-js';
import { useStyle } from '../../../helpers';
import { Chat as DefaultChat, Cogs as DefaultCogs } from '../../../icons';
import { Button } from '../../primitives';
import { IconRendererWrapper } from '../../shared/IconRendererWrapper';
import { MoreActionsDropdown } from './MoreActionsDropdown';

type ActionsContainerProps = {
  showAiChats?: () => void;
  showPreferences?: () => void;
};

export const ActionsContainer = (props: ActionsContainerProps) => {
  const style = useStyle();
  const cogsIconClass = style({
    key: 'icon',
    className: 'nt-size-5',
    iconKey: 'cogs',
  });
  const chatIconClass = style({
    key: 'aiChats__headerButton__icon',
    className: 'nt-size-5',
    iconKey: 'chat',
  });

  return (
    <div
      class={style({
        key: 'moreActionsContainer',
        className: 'nt-flex nt-gap-3',
      })}
    >
      <MoreActionsDropdown />
      <Show when={props.showAiChats}>
        {(showAiChats) => (
          <Button
            appearanceKey="aiChats__headerButton"
            variant="ghost"
            size="iconSm"
            onClick={showAiChats()}
            data-localization="aiChats.title"
          >
            <IconRendererWrapper
              iconKey="chat"
              class={chatIconClass}
              fallback={<DefaultChat class={chatIconClass} />}
            />
          </Button>
        )}
      </Show>
      <Show when={props.showPreferences}>
        {(showPreferences) => (
          <Button appearanceKey="preferences__button" variant="ghost" size="iconSm" onClick={showPreferences()}>
            <IconRendererWrapper
              iconKey="cogs"
              class={cogsIconClass}
              fallback={<DefaultCogs class={cogsIconClass} />}
            />
          </Button>
        )}
      </Show>
    </div>
  );
};

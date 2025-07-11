import { useDisclosure } from '@mantine/hooks';
import { Popover, useColorScheme } from '@novu/design-system';
import { type LocalizedMessage, Text } from '@novu/novui';
import { css } from '@novu/novui/css';
import { Flex, Stack } from '@novu/novui/jsx';
import type { FC } from 'react';

type LocalStudioSidebarOrganizationDisplayProps = {
  title: LocalizedMessage;
  subtitle: LocalizedMessage;
};

export const LocalStudioSidebarOrganizationDisplay: FC<LocalStudioSidebarOrganizationDisplayProps> = ({
  title,
  subtitle,
}) => {
  const { colorScheme } = useColorScheme();
  const [opened, { close, open }] = useDisclosure(false);

  return (
    <Popover
      opened={opened}
      position="bottom"
      offset={0}
      withinPortal
      title="Novu Local Studio"
      classNames={{
        dropdown: css({ bg: 'surface.popover !important', border: 'none !important', shadow: 'medium !important' }),
      }}
      target={
        <Flex gap="50" py="75" px="100" onMouseEnter={open} onMouseLeave={close}>
          <img
            src={`/static/images/standalone-${colorScheme}-theme.svg`}
            className={css({
              w: '37px',
              h: '37px',
              borderRadius: '100',
            })}
          />
          <Stack gap="25">
            <Text variant="strong">{title}</Text>
            <Text variant={'secondary'}>{subtitle}</Text>
          </Stack>
        </Flex>
      }      description="A stateless version of the Novu Dashboard. It's connected to your local application and used for development and debugging purposes."
    />
  );
};

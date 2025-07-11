import { type HoverCardProps, HoverCard as MantineHoverCard } from '@mantine/core';

/**
 * HoverCard component
 */
export function HoverCard(props: HoverCardProps) {
  return <MantineHoverCard transition="fade" radius="md" {...props} />;
}
HoverCard.Target = MantineHoverCard.Target;
HoverCard.Dropdown = MantineHoverCard.Dropdown;

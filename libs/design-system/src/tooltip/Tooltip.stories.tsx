import type { Meta, StoryFn } from '@storybook/react';
import React from 'react';
import { Tooltip } from './Tooltip';

export default {
  title: 'Components/Tooltip',
  component: Tooltip,
  argTypes: {},
} as Meta<typeof Tooltip>;

const Template: StoryFn<typeof Tooltip> = ({ ...args }) => <Tooltip {...args}>Hover Here</Tooltip>;

export const Label = Template.bind({});
Label.args = {
  label: 'This is a tooltip!',
};

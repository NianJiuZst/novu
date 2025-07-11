import type { Meta, StoryFn } from '@storybook/react';
import React from 'react';
import { ColorInput } from './ColorInput';

export default {
  title: 'Inputs/ColorInput',
  component: ColorInput,
  argTypes: {
    value: {
      table: {
        disable: true,
      },
    },
    onChange: {
      table: {
        disable: true,
      },
    },
  },
} as Meta<typeof ColorInput>;

const Template: StoryFn<typeof ColorInput> = ({ ...args }) => <ColorInput {...args} />;

export const PrimaryUse = Template.bind({});
PrimaryUse.args = {
  label: 'Font Color',
  placeholder: 'Pick font color',
};

import { type CheckboxProps, Checkbox as MantineCheckbox } from '@mantine/core';
import type React from 'react';
import type { ChangeEvent } from 'react';
import useStyles from './Checkbox.styles';

interface ICheckboxProps extends CheckboxProps {
  checked?: boolean;
  disabled?: boolean;
  label?: React.ReactNode | string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Checkbox Component
 *
 */
export function Checkbox({
  label = 'Default Checkbox',
  checked,
  onChange,
  disabled = false,
  ...props
}: ICheckboxProps) {
  const { classes } = useStyles({ disabled });

  return (
    <MantineCheckbox
      classNames={classes}
      label={label}
      onChange={onChange}
      disabled={disabled}
      size="sm"
      checked={checked}
      {...props}
    />
  );
}

Checkbox.Group = MantineCheckbox.Group;

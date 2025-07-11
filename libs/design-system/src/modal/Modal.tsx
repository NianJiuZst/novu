import { Modal as MantineModal, type ModalProps } from '@mantine/core';
import React, { type ReactNode } from 'react';
import { colors, shadows } from '../config';
import useStyles from './Modal.styles';

interface IModalProps extends ModalProps {
  opened: boolean;
  title: ReactNode | string;
  onClose: () => void;
  size?: 'lg' | 'xl' | 'md';
  zIndex?: number;
  centered?: boolean;
}

export function Modal({ children, ...props }: IModalProps) {
  const { classes, theme } = useStyles();
  const defaultDesign = {
    radius: 'md',
    size: 'lg',
    overlayOpacity: 0.7,
    overlayColor: theme.colorScheme === 'dark' ? colors.BGDark : colors.BGLight,
    shadow: theme.colorScheme === 'dark' ? shadows.dark : shadows.medium,
    classNames: classes,
  } as ModalProps;

  return (
    <MantineModal {...defaultDesign} {...props} sx={{ backdropFilter: 'blur(10px)' }}>
      {children}
    </MantineModal>
  );
}

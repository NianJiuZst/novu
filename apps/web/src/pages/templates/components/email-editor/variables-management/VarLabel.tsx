import { Center, Collapse, UnstyledButton } from '@mantine/core';
import { ChevronDown, ChevronUp, colors } from '@novu/design-system';
import { useState } from 'react';

export const VarLabel = ({ label, children, Icon }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <UnstyledButton
        data-test-id="var-label"
        onClick={() => {
          setOpen(!open);
        }}
        type="button"
        sx={{
          width: '100%',
          marginBottom: 15,
          marginTop: 20,
        }}
      >
        <div
          style={{
            color: colors.B60,
            fontSize: 14,
            fontWeight: 'bold',
          }}
        >
          <Center inline>
            <Icon width={16} height={16} color={colors.B60} style={{ marginRight: '8px' }} />
            {label}
          </Center>
          <span
            style={{
              float: 'right',
            }}
          >
            {open ? <ChevronUp /> : <ChevronDown />}
          </span>
        </div>
      </UnstyledButton>
      <Collapse in={open}>{children}</Collapse>
    </>
  );
};

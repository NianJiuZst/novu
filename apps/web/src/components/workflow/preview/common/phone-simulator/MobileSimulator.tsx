import { useMantineColorScheme } from '@mantine/core';
import { When } from '@novu/design-system';
import { ChannelTypeEnum } from '@novu/shared';
import { useState } from 'react';
import { AndroidIndicatorsIcon, AndroidKeyboard, IOSIndicatorsIcon, IOSKeyboard } from '../icons';
import {
  Camera,
  IndicatorsContainer,
  MobileSimulatorBody,
  Notch,
  SwitchContainer,
  TimeIconStyled,
} from './MobileSimulator.styles';
import { PhonePlatformSwitch } from './PhonePlatformSwitch';

export const MobileSimulator = ({
  children,
  withBackground,
}: {
  withBackground: boolean;
  children: React.ReactNode;
}) => {
  const [isIOS, setIsIOS] = useState(true);
  const { colorScheme } = useMantineColorScheme();

  return (
    <MobileSimulatorBody isIOS={isIOS} withBackground={withBackground}>
      {isIOS ? <Notch /> : <Camera />}
      <IndicatorsContainer>
        <TimeIconStyled isVisible={isIOS} />
        {isIOS ? <IOSIndicatorsIcon /> : <AndroidIndicatorsIcon />}
      </IndicatorsContainer>
      <SwitchContainer>
        <PhonePlatformSwitch isIOS={isIOS} onChange={() => setIsIOS((old) => !old)} />
      </SwitchContainer>
      {children}
      <When truthy={!withBackground}>
        {isIOS ? (
          <IOSKeyboard isDarkMode={colorScheme === 'dark'} />
        ) : (
          <AndroidKeyboard isDarkMode={colorScheme === 'dark'} />
        )}
      </When>
    </MobileSimulatorBody>
  );
};

export default MobileSimulator;

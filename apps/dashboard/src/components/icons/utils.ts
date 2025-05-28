import {
  RiCellphoneFill,
  RiChatThreadFill,
  RiCodeBlock,
  RiFlashlightFill,
  RiHourglassFill,
  RiShadowLine,
} from 'react-icons/ri';
import { Mail3Fill } from './mail-3-fill';
import { Notification5Fill } from './notification-5-fill';
import { Sms } from './sms';
import { IconType } from 'react-icons/lib';
import { StepTypeEnum } from '@novu/api/models/components';

export const STEP_TYPE_TO_ICON: Record<StepTypeEnum, IconType> = {
  [StepTypeEnum.Chat]: RiChatThreadFill,
  [StepTypeEnum.Custom]: RiCodeBlock,
  [StepTypeEnum.Delay]: RiHourglassFill,
  [StepTypeEnum.Digest]: RiShadowLine,
  [StepTypeEnum.Email]: Mail3Fill,
  [StepTypeEnum.InApp]: Notification5Fill,
  [StepTypeEnum.Push]: RiCellphoneFill,
  [StepTypeEnum.Sms]: Sms,
  [StepTypeEnum.Trigger]: RiFlashlightFill,
};

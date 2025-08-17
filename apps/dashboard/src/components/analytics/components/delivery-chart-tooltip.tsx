import { StepTypeEnum } from '@novu/shared';
import { STEP_TYPE_TO_ICON } from '../../icons/utils';
import { NovuTooltip, type NovuTooltipRow } from '../../primitives/chart';

type DeliveryTooltipProps = {
  active?: boolean;
  payload?: Array<{
    dataKey?: string;
    name?: string;
    value?: number;
    color?: string;
    payload?: {
      email?: number;
      push?: number;
      sms?: number;
      inApp?: number;
      chat?: number;
      date?: string;
      timestamp?: string;
      [key: string]: unknown;
    };
  }>;
  label?: string;
};

/**
 * Custom tooltip renderer for delivery trends chart
 * Handles the complex logic of showing channels with icons and proper values
 */
export function DeliveryChartTooltip(props: DeliveryTooltipProps) {
  const data = props.payload?.[0]?.payload;

  if (!props.active || !data) return null;

  // Get values from either complete or incomplete data (whichever is available)
  const getChannelValue = (channel: string) => {
    const completeValue = data?.[`${channel}Complete`] as number;
    const incompleteValue = data?.[`${channel}Incomplete`] as number;
    const originalValue = data?.[channel] as number;

    return completeValue || incompleteValue || originalValue || 0;
  };

  const channels: NovuTooltipRow[] = [
    {
      key: 'email',
      label: 'Email',
      value: getChannelValue('email'),
      color: '#8b5cf6',
      icon: STEP_TYPE_TO_ICON[StepTypeEnum.EMAIL],
    },
    {
      key: 'push',
      label: 'Push',
      value: getChannelValue('push'),
      color: '#06b6d4',
      icon: STEP_TYPE_TO_ICON[StepTypeEnum.PUSH],
    },
    {
      key: 'chat',
      label: 'Chat',
      value: getChannelValue('chat'),
      color: '#10b981',
      icon: STEP_TYPE_TO_ICON[StepTypeEnum.CHAT],
    },
    {
      key: 'sms',
      label: 'SMS',
      value: getChannelValue('sms'),
      color: '#facc15',
      icon: STEP_TYPE_TO_ICON[StepTypeEnum.SMS],
    },
    {
      key: 'inApp',
      label: 'In-app (Inbox)',
      value: getChannelValue('inApp'),
      color: '#f97316',
      icon: STEP_TYPE_TO_ICON[StepTypeEnum.IN_APP],
    },
  ];

  return <NovuTooltip active={props.active} label={props.label} rows={channels} showTotal={true} />;
}

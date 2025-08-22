export enum ChannelEndpointRoutingTypeEnum {
  SLACK = 'slack',
}

export type SlackRouting = {
  type: ChannelEndpointRoutingTypeEnum.SLACK;
  channelId?: string;
  userId?: string;
};

export type ChannelEndpointRouting = SlackRouting;

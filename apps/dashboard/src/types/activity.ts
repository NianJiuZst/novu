import type { ActivityFilters } from '@/api/activity';
import type { ChannelTypeEnum } from '@novu/shared';

export type ActivityFiltersData = {
  dateRange: string;
  channels: ChannelTypeEnum[];
  workflows: string[];
  transactionId: string;
  subscriberId: string;
  topicKey: string;
};

export type ActivityUrlState = {
  activityItemId: string | null;
  filters: ActivityFilters;
  filterValues: ActivityFiltersData;
};

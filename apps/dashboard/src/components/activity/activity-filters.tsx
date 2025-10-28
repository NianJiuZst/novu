import { useOrganization } from '@clerk/clerk-react';
import { ChannelTypeEnum, FeatureFlagsKeysEnum, SeverityLevelEnum } from '@novu/shared';
import { CalendarIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/primitives/badge';
import { Tooltip, TooltipContent, TooltipPortal, TooltipTrigger } from '@/components/primitives/tooltip';
import { useFeatureFlag } from '@/hooks/use-feature-flag';
import { useFetchSubscription } from '@/hooks/use-fetch-subscription';
import { ActivityFiltersData } from '@/types/activity';
import { buildActivityDateFilters } from '@/utils/activityFilters';
import { ROUTES } from '@/utils/routes';
import { capitalize } from '@/utils/string';
import { cn } from '@/utils/ui';
import { IS_SELF_HOSTED } from '../../config';
import { useFetchWorkflows } from '../../hooks/use-fetch-workflows';
import { Button } from '../primitives/button';
import { FacetedFormFilter } from '../primitives/form/faceted-filter/facated-form-filter';
import { CHANNEL_OPTIONS } from './constants';

type Fields =
  | 'dateRange'
  | 'workflows'
  | 'channels'
  | 'transactionId'
  | 'subscriberId'
  | 'topicKey'
  | 'severity'
  | 'contextKeys';

export type ActivityFilters = {
  filters: ActivityFiltersData;
  showReset?: boolean;
  onFiltersChange: (filters: ActivityFiltersData) => void;
  onReset?: () => void;
  hide?: Fields[];
  className?: string;
};

const UpgradeCtaIcon: React.ComponentType<{ className?: string }> = () => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to={ROUTES.SETTINGS_BILLING + '?utm_source=activity-feed-retention'}
          className="block flex items-center justify-center transition-all duration-200 hover:scale-105"
        >
          <Badge color="purple" size="sm" variant="lighter">
            Upgrade
          </Badge>
        </Link>
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent>Upgrade your plan to unlock extended retention periods</TooltipContent>
      </TooltipPortal>
    </Tooltip>
  );
};

export function ActivityFilters({
  onFiltersChange,
  filters,
  onReset,
  showReset = false,
  hide = [],
  className,
}: ActivityFilters) {
  const { data: workflowTemplates } = useFetchWorkflows({ limit: 100 });
  const { organization } = useOrganization();
  const { subscription } = useFetchSubscription();
  const isContextEnabled = useFeatureFlag(FeatureFlagsKeysEnum.IS_CONTEXT_ENABLED, false);

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [localTransactionId, setLocalTransactionId] = useState(filters.transactionId || '');
  const [localSubscriberId, setLocalSubscriberId] = useState(filters.subscriberId || '');
  const [localTopicKey, setLocalTopicKey] = useState(filters.topicKey || '');
  const [localContextKeys, setLocalContextKeys] = useState(filters.contextKeys || '');

  useEffect(() => {
    setLocalTransactionId(filters.transactionId || '');
    setLocalSubscriberId(filters.subscriberId || '');
    setLocalTopicKey(filters.topicKey || '');
    setLocalContextKeys(filters.contextKeys || '');
  }, [filters.transactionId, filters.subscriberId, filters.topicKey, filters.contextKeys]);

  const clearDebounceTimeout = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
  }, []);

  const debouncedFilterChange = useCallback(
    (fieldName: keyof ActivityFiltersData, value: string) => {
      clearDebounceTimeout();

      debounceTimeoutRef.current = setTimeout(() => {
        onFiltersChange({
          ...filters,
          [fieldName]: value,
        });
        debounceTimeoutRef.current = null;
      }, 400);
    },
    [clearDebounceTimeout, onFiltersChange, filters]
  );

  useEffect(() => {
    return clearDebounceTimeout;
  }, [clearDebounceTimeout]);

  const maxActivityFeedRetentionOptions = useMemo(() => {
    const missingSubscription = !subscription && !IS_SELF_HOSTED;

    if (!organization || missingSubscription) {
      return [];
    }

    return buildActivityDateFilters({
      organization,
      apiServiceLevel: subscription?.apiServiceLevel,
    }).map((option) => ({
      ...option,
      icon: option.disabled ? UpgradeCtaIcon : undefined,
    }));
  }, [organization, subscription]);

  return (
    <div className={cn('flex items-center gap-2 pb-2.5', className)}>
      {!hide.includes('dateRange') && (
        <FacetedFormFilter
          size="small"
          type="single"
          hideClear
          hideSearch
          hideTitle
          title="Time period"
          options={maxActivityFeedRetentionOptions}
          selected={[filters.dateRange]}
          onSelect={(values) => onFiltersChange({ ...filters, dateRange: values[0] })}
          icon={CalendarIcon}
        />
      )}

      {!hide.includes('workflows') && (
        <FacetedFormFilter
          size="small"
          type="multi"
          title="Workflows"
          options={
            workflowTemplates?.workflows?.map((workflow) => ({
              label: workflow.name,
              value: workflow._id,
            })) || []
          }
          selected={filters.workflows}
          onSelect={(values) => onFiltersChange({ ...filters, workflows: values })}
        />
      )}

      {!hide.includes('channels') && (
        <FacetedFormFilter
          size="small"
          type="multi"
          title="Channels"
          hideSearch
          options={CHANNEL_OPTIONS}
          selected={filters.channels}
          onSelect={(values) => onFiltersChange({ ...filters, channels: values as ChannelTypeEnum[] })}
        />
      )}

      {!hide.includes('transactionId') && (
        <FacetedFormFilter
          type="text"
          size="small"
          title="Transaction ID"
          value={localTransactionId}
          onChange={(value) => {
            setLocalTransactionId(value);
            debouncedFilterChange('transactionId', value);
          }}
          placeholder="Search by full Transaction ID"
        />
      )}

      {!hide.includes('subscriberId') && (
        <FacetedFormFilter
          type="text"
          size="small"
          title="Subscriber ID"
          value={localSubscriberId}
          onChange={(value) => {
            setLocalSubscriberId(value);
            debouncedFilterChange('subscriberId', value);
          }}
          placeholder="Search by full Subscriber ID"
        />
      )}

      {!hide.includes('topicKey') && (
        <FacetedFormFilter
          type="text"
          size="small"
          title="Topic Key"
          value={localTopicKey}
          onChange={(value) => {
            setLocalTopicKey(value);
            debouncedFilterChange('topicKey', value);
          }}
          placeholder="Search by full Topic Key"
        />
      )}

      {!hide.includes('severity') && (
        <FacetedFormFilter
          size="small"
          type="multi"
          title="Severity"
          hideSearch
          options={Object.values(SeverityLevelEnum).map((severity) => ({
            label: capitalize(severity),
            value: severity,
          }))}
          selected={filters.severity}
          onSelect={(values) => onFiltersChange({ ...filters, severity: values as SeverityLevelEnum[] })}
        />
      )}

      {!hide.includes('contextKeys') && isContextEnabled && (
        <FacetedFormFilter
          type="text"
          size="small"
          title="Context"
          value={localContextKeys}
          onChange={(value) => {
            setLocalContextKeys(value);
            debouncedFilterChange('contextKeys', value);
          }}
          placeholder="e.g., tenant:org-123, region:us-east-1"
        />
      )}

      {showReset && (
        <Button variant="secondary" mode="ghost" size="2xs" onClick={onReset}>
          Reset
        </Button>
      )}
    </div>
  );
}

import { HTMLAttributes, useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { RiLoader4Line } from 'react-icons/ri';
import { ActivityFilters } from '@/api/activity';
import { Button } from '@/components/primitives/button';
import { FacetedFormFilter } from '@/components/primitives/form/faceted-filter/facated-form-filter';
import { Form, FormField, FormItem, FormRoot } from '@/components/primitives/form/form';
import { cn } from '@/utils/ui';
import { defaultWorkflowRunsFilter } from './hooks/use-workflow-runs-url-state';

export type WorkflowRunsFiltersProps = HTMLAttributes<HTMLDivElement> & {
  onFiltersChange: (filter: ActivityFilters) => void;
  filterValues: ActivityFilters;
  onReset?: () => void;
  isFetching?: boolean;
};

export function WorkflowRunsFilters(props: WorkflowRunsFiltersProps) {
  const { onFiltersChange, filterValues, onReset, className, isFetching, ...rest } = props;

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [localSubscriberId, setLocalSubscriberId] = useState(filterValues.subscriberId || '');

  const form = useForm<ActivityFilters>({
    values: filterValues,
    defaultValues: {
      ...filterValues,
    },
  });
  const { formState, watch } = form;

  useEffect(() => {
    setLocalSubscriberId(filterValues.subscriberId || '');
  }, [filterValues.subscriberId]);

  const clearDebounceTimeout = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
  }, []);

  const debouncedSubscriberIdChange = useCallback(
    (value: string) => {
      clearDebounceTimeout();

      debounceTimeoutRef.current = setTimeout(() => {
        onFiltersChange({
          ...filterValues,
          subscriberId: value,
        });
        debounceTimeoutRef.current = null;
      }, 400);
    },
    [clearDebounceTimeout, onFiltersChange, filterValues]
  );

  useEffect(() => {
    return clearDebounceTimeout;
  }, [clearDebounceTimeout]);

  useEffect(() => {
    const subscription = watch((value) => {
      if (value.subscriberId !== undefined) {
        return;
      }

      onFiltersChange(value as ActivityFilters);
    });

    return () => subscription.unsubscribe();
  }, [watch, onFiltersChange]);

  const handleReset = () => {
    clearDebounceTimeout();
    setLocalSubscriberId('');
    form.reset(defaultWorkflowRunsFilter);
    onFiltersChange(defaultWorkflowRunsFilter);
    onReset?.();
  };

  const isResetButtonVisible = formState.isDirty || filterValues.channels?.length || filterValues.subscriberId !== '';

  return (
    <div className={cn('flex items-center gap-2 px-2.5 py-1.5', className)} {...rest}>
      <Form {...form}>
        <FormRoot className="flex items-center gap-2">
          <FormField
            control={form.control}
            name="channels"
            render={({ field }) => (
              <FormItem className="relative">
                <FacetedFormFilter
                  type="multi"
                  size="small"
                  title="Channels"
                  options={[
                    { label: 'Email', value: 'email' },
                    { label: 'SMS', value: 'sms' },
                    { label: 'Push', value: 'push' },
                    { label: 'In-App', value: 'in_app' },
                    { label: 'Chat', value: 'chat' },
                  ]}
                  selected={field.value || []}
                  onSelect={field.onChange}
                />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="subscriberId"
            render={() => (
              <FormItem className="relative">
                <FacetedFormFilter
                  type="text"
                  size="small"
                  title="Subscriber ID"
                  value={localSubscriberId}
                  onChange={(value) => {
                    setLocalSubscriberId(value);
                    debouncedSubscriberIdChange(value);
                  }}
                  placeholder="Search by subscriber ID..."
                />
              </FormItem>
            )}
          />

          {isResetButtonVisible && (
            <div className="flex items-center gap-1">
              <Button variant="secondary" mode="ghost" size="2xs" onClick={handleReset}>
                Reset
              </Button>
              {isFetching && <RiLoader4Line className="h-3 w-3 animate-spin text-neutral-400" />}
            </div>
          )}
        </FormRoot>
      </Form>
    </div>
  );
}

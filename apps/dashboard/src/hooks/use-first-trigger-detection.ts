import { useEffect, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getWorkflow, getWorkflows } from '@/api/workflows';
import { useEnvironment } from '../context/environment/hooks';
import { QueryKeys } from '@/utils/query-keys';
import { ONBOARDING_DEMO_WORKFLOW_ID } from '../config';

type FirstTriggerDetectionOptions = {
  enabled?: boolean;
  onFirstTriggerDetected?: () => void;
};

/**
 * Hook to detect the first API trigger event for a workflow
 * Uses the workflow's lastTriggeredAt field to detect when it has been triggered
 * Only detects triggers that occur after the user has visited the page/component
 */
export function useFirstTriggerDetection({
  enabled = true,
  onFirstTriggerDetected,
}: FirstTriggerDetectionOptions) {
  const [hasDetectedFirstTrigger, setHasDetectedFirstTrigger] = useState(false);
  const [isWaitingForTrigger, setIsWaitingForTrigger] = useState(false);
  const [visitTimestamp, setVisitTimestamp] = useState<string | null>(null);
  const [workflowSlug, setWorkflowSlug] = useState<string | null>(null);
  const { currentEnvironment } = useEnvironment();

  // First, fetch workflows to find the demo workflow slug
  const { data: workflowsData } = useQuery({
    queryKey: [QueryKeys.fetchWorkflows, currentEnvironment?._id, ONBOARDING_DEMO_WORKFLOW_ID],
    queryFn: () => {
      return getWorkflows({ 
        environment: currentEnvironment!, 
        limit: 50, 
        offset: 0, 
        query: ONBOARDING_DEMO_WORKFLOW_ID,
        orderBy: '',
        orderDirection: 'DESC',
        tags: [],
        status: []
      });
    },
    enabled: enabled && !!currentEnvironment?._id && !workflowSlug,
    refetchOnWindowFocus: false,
    staleTime: 30000, // Cache for 30 seconds since slug doesn't change
  });

  // Extract workflow slug from the search results
  useEffect(() => {
    if (workflowsData?.workflows) {
      const demoWorkflow = workflowsData.workflows.find((w) => w.workflowId?.includes(ONBOARDING_DEMO_WORKFLOW_ID));
      if (demoWorkflow?.slug && demoWorkflow.slug !== workflowSlug) {
        setWorkflowSlug(demoWorkflow.slug);
      }
    }
  }, [workflowsData, workflowSlug]);

  // Now fetch the specific workflow using the slug for polling
  const { data: workflow, isPending, error } = useQuery({
    queryKey: [QueryKeys.fetchWorkflow, currentEnvironment?._id, workflowSlug],
    queryFn: () => {
      return getWorkflow({ 
        environment: currentEnvironment!, 
        workflowSlug: workflowSlug!
      });
    },
    enabled: enabled && !!currentEnvironment?._id && !!workflowSlug,
    refetchInterval: isWaitingForTrigger && !hasDetectedFirstTrigger ? 2000 : false,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  // Initialize visit timestamp when first loaded
  useEffect(() => {
    if (!enabled || !currentEnvironment || isPending) return;

    if (error) {
      return;
    }

    if (!workflow) {
      return;
    }

    // Set visit timestamp on first load (when user sees the component)
    if (!visitTimestamp) {
      const timestamp = new Date().toISOString();
      setVisitTimestamp(timestamp);
    }
  }, [enabled, currentEnvironment, workflow, isPending, error, visitTimestamp]);

  // Start waiting for trigger
  const startWaiting = useCallback(() => {
    if (hasDetectedFirstTrigger) {
      return;
    }
    setIsWaitingForTrigger(true);
  }, [hasDetectedFirstTrigger]);

  // Detect when lastTriggeredAt changes (first trigger after visit)
  useEffect(() => {
    if (!isWaitingForTrigger || isPending || hasDetectedFirstTrigger || !workflow || !visitTimestamp) {
      return;
    }

    const currentLastTriggeredAt = workflow.lastTriggeredAt;
    const visitTime = new Date(visitTimestamp);
    
    // Check if lastTriggeredAt exists and is after the visit timestamp
    if (currentLastTriggeredAt) {
      const triggerTime = new Date(currentLastTriggeredAt);
      
      if (triggerTime > visitTime) {
        setHasDetectedFirstTrigger(true);
        setIsWaitingForTrigger(false);
        onFirstTriggerDetected?.();
      }
    }
  }, [workflow, isPending, isWaitingForTrigger, hasDetectedFirstTrigger, visitTimestamp, onFirstTriggerDetected]);

  // Reset detection state
  const resetDetection = useCallback(() => {
    setHasDetectedFirstTrigger(false);
    setIsWaitingForTrigger(false);
    setVisitTimestamp(null);
    setWorkflowSlug(null);
  }, []);

  return {
    hasDetectedFirstTrigger,
    isWaitingForTrigger,
    startWaiting,
    resetDetection,
    isLoading: isPending,
    workflow,
    workflowSlug,
    lastTriggeredAt: workflow?.lastTriggeredAt,
    visitTimestamp,
    error,
  };
}

-- Migration: Backfill daily aggregated materialized views with historical data
-- This migration populates the daily aggregation tables from existing raw data
-- Run this AFTER the materialized views have been created

-- Backfill step_runs_daily from existing data
INSERT INTO step_runs_daily
SELECT
    toDate(created_at) AS date,
    environment_id,
    organization_id,
    workflow_id,
    step_type,
    provider_id,
    countState() AS total_count,
    countIfState(status = 'completed') AS completed_count,
    uniqState(external_subscriber_id) AS unique_subscribers
FROM step_runs FINAL
WHERE step_type IN ('in_app', 'email', 'sms', 'chat', 'push')
GROUP BY date, environment_id, organization_id, workflow_id, step_type, provider_id;

-- Backfill workflow_runs_daily from existing data
-- Uses argMaxState to track latest status per workflow_run_id to avoid double-counting
INSERT INTO workflow_runs_daily
SELECT
    toDate(created_at) AS date,
    environment_id,
    organization_id,
    workflow_id,
    workflow_name,
    workflow_run_id,
    argMaxState(status, created_at) AS latest_status,
    uniqState(external_subscriber_id) AS unique_subscribers
FROM workflow_runs FINAL
GROUP BY date, environment_id, organization_id, workflow_id, workflow_name, workflow_run_id;

-- Backfill traces_daily from existing data
INSERT INTO traces_daily
SELECT
    toDate(created_at) AS date,
    environment_id,
    organization_id,
    workflow_id,
    event_type,
    countState() AS total_count
FROM traces
WHERE entity_type = 'step_run'
  AND event_type IN ('message_seen', 'message_read', 'message_snoozed', 'message_archived')
GROUP BY date, environment_id, organization_id, workflow_id, event_type;

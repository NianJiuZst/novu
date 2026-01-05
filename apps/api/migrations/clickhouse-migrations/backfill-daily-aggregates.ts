import { ClickHouseClient, createClient } from '@clickhouse/client';

async function backfillDailyAggregates() {
  if (!process.env.CLICK_HOUSE_URL || !process.env.CLICK_HOUSE_DATABASE) {
    console.error('ClickHouse environment variables not set');
    process.exit(1);
  }

  const client: ClickHouseClient = createClient({
    url: process.env.CLICK_HOUSE_URL,
    username: process.env.CLICK_HOUSE_USER,
    password: process.env.CLICK_HOUSE_PASSWORD,
    database: process.env.CLICK_HOUSE_DATABASE,
  });

  try {
    console.log('Starting backfill of daily aggregated tables...');

    console.log('Backfilling step_runs_daily...');
    await client.exec({
      query: `
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
        GROUP BY date, environment_id, organization_id, workflow_id, step_type, provider_id
      `,
    });
    console.log('✓ step_runs_daily backfilled successfully');

    console.log('Backfilling workflow_runs_daily...');
    await client.exec({
      query: `
        INSERT INTO workflow_runs_daily
        SELECT
            toDate(created_at) AS date,
            environment_id,
            organization_id,
            workflow_id,
            workflow_name,
            status,
            countState() AS total_count,
            uniqState(external_subscriber_id) AS unique_subscribers
        FROM workflow_runs FINAL
        GROUP BY date, environment_id, organization_id, workflow_id, workflow_name, status
      `,
    });
    console.log('✓ workflow_runs_daily backfilled successfully');

    console.log('Backfilling traces_daily...');
    await client.exec({
      query: `
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
        GROUP BY date, environment_id, organization_id, workflow_id, event_type
      `,
    });
    console.log('✓ traces_daily backfilled successfully');

    console.log('\n✓ All daily aggregated tables backfilled successfully!');
    console.log('\nNote: Future data will be automatically populated by the materialized views.');
  } catch (error) {
    console.error('Error during backfill:', error);
    throw error;
  } finally {
    await client.close();
  }
}

if (require.main === module) {
  backfillDailyAggregates()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { backfillDailyAggregates };

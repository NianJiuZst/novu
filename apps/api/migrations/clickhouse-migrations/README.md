# ClickHouse Migrations

This directory contains SQL migration files for ClickHouse database schema management.

## Overview

Migrations are managed using the `clickhouse-migrations` npm package, which provides:
- Automatic migration tracking via a `migrations` table in ClickHouse
- Idempotent execution - each migration runs only once per database
- Simple CLI interface with environment variable support

### Automatic Migrations in Local/Test Environments

**Migrations run automatically** when the API or Worker application starts in `local` or `test` environments. The `ClickHouseService` executes all pending migrations during initialization, ensuring your local database schema is always up to date.

This means:
- ✅ **No manual migration step required** when pulling new code with migrations
- ✅ **Developers automatically get schema updates** when starting the app
- ✅ **Both API and Worker apps** run migrations on startup (first one to start applies them)
- ✅ **Safe concurrent execution** - migrations are idempotent and tracked in the database

You only need to run migrations manually if you want to apply them before starting the application.

## Creating New Migrations

### Naming Convention

Migration files must follow this naming pattern:
```
<number>_<description>.sql
```

Examples:
- `1_initial_schema.sql`
- `2_add_user_preferences_table.sql`
- `3_add_index_on_workflow_runs.sql`

The number prefix determines execution order. Migrations are applied in ascending numerical order.

### Migration File Rules

1. **Use Idempotent SQL**: Always use conditional statements to ensure migrations can be safely re-run:
   ```sql
   CREATE TABLE IF NOT EXISTS my_table (...);
   ALTER TABLE my_table ADD COLUMN IF NOT EXISTS new_column String;
   CREATE INDEX IF NOT EXISTS idx_name ON my_table (column);
   ```

2. **One Logical Change Per File**: Keep migrations focused on a single schema change for easier rollback and debugging.

3. **Include Comments**: Document the purpose and context of each migration:
   ```sql
   -- Add user timezone preference
   -- Ticket: NV-1234
   ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone String DEFAULT 'UTC';
   ```

4. **Multiple Statements**: Separate statements with semicolons (;):
   ```sql
   CREATE TABLE IF NOT EXISTS table1 (...);
   CREATE TABLE IF NOT EXISTS table2 (...);
   ```

5. **ClickHouse Settings**: Include query-level settings as needed:
   ```sql
   SET allow_experimental_json_type = 1;
   CREATE TABLE IF NOT EXISTS events (data JSON) ENGINE = MergeTree ...;
   ```

## Running Migrations Locally

### Automatic Execution (Recommended)

Migrations run automatically when you start the API or Worker in local/test mode:
```bash
# Migrations will run automatically during startup
pnpm run start:dev
```

### Manual Execution (Optional)

If you want to run migrations before starting the application, you can execute them manually:

#### Prerequisites
Ensure ClickHouse is running locally (via Docker Compose):
```bash
cd /path/to/novu
docker-compose -f docker/local/docker-compose.yml up -d clickhouse
```

#### Run Migrations Manually
```bash
cd apps/api
pnpm run clickhouse:migrate
```

The local script uses hardcoded values:
- Host: `http://localhost:8123`
- User: `default`
- Password: (empty)
- Database: `novu-local`

The script will:
1. Connect to your local ClickHouse instance
2. Create a `migrations` tracking table if it doesn't exist
3. Execute any pending migrations in numerical order
4. Mark completed migrations as applied

## Running Migrations in Production/Staging

For production and staging environments, use:
```bash
pnpm run clickhouse:migrate:prod
```

This script relies on native `clickhouse-migrations` environment variables:
- `CH_MIGRATIONS_HOST` - ClickHouse server URL (e.g., `http://clickhouse.example.com:8123`)
- `CH_MIGRATIONS_USER` - Database username
- `CH_MIGRATIONS_PASSWORD` - Database password
- `CH_MIGRATIONS_DB` - Target database name
- `CH_MIGRATIONS_HOME` - Migrations directory (optional, defaults to `./migrations/clickhouse-migrations`)

These should be set in your deployment environment (GitHub Actions secrets, Kubernetes secrets, etc.).

## CI/CD Integration

Migrations run automatically in CI/CD before deployments using `pnpm run clickhouse:migrate:prod`:

## Example Migration

```sql
-- Add step execution metrics
-- This migration adds performance tracking columns to step_runs table

ALTER TABLE IF EXISTS step_runs 
  ADD COLUMN IF NOT EXISTS execution_time_ms UInt32 DEFAULT 0,
  ADD COLUMN IF NOT EXISTS retry_count UInt8 DEFAULT 0;

-- Add index for performance queries
CREATE INDEX IF NOT EXISTS idx_step_runs_execution_time 
  ON step_runs (execution_time_ms) 
  TYPE minmax GRANULARITY 4;
```

## Troubleshooting

### Migration Failed in CI
If a migration fails during deployment:
1. Check CI logs for the specific error message
2. Fix the migration SQL locally
3. Test locally: `pnpm run clickhouse:migrate`
4. Commit the fix and re-run the deployment

### Reset Local Migrations
To reset your local ClickHouse and re-run all migrations:
```bash
# Drop the database
docker exec -it clickhouse_main clickhouse-client --query "DROP DATABASE IF EXISTS \`novu-local\`"

# Migrations will run automatically when you restart the app
# Or run them manually:
cd apps/api && pnpm run clickhouse:migrate
```

### Check Migration Status
To see which migrations have been applied:
```bash
docker exec -it clickhouse_main clickhouse-client --query "SELECT * FROM \`novu-local\`.migrations ORDER BY version"
```

## Schema Reference

Current tables managed by migrations:
- `step_runs` - Individual step executions within workflows
- `traces` - Event traces for debugging and monitoring
- `requests` - HTTP request logs
- `workflow_runs` - Complete workflow execution instances

For detailed schema definitions, see the TypeScript schema files in:
`libs/application-generic/src/services/analytic-logs/`

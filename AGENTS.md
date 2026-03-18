# AGENTS.md

## Cursor Cloud specific instructions

When running in the cloud environment the pnpm setup:agent was already run, so you don't need to run it again and everything should be already setup (including .env files copied from .env.agent, and pnpm build and install with enterprise packages).

### Prerequisites

- **Docker** required for MongoDB, Redis, ClickHouse, and LocalStack

### Infrastructure Services

Start with: `docker compose -f docker/local/docker-compose.yml -f docker/local/docker-compose.agent.yml up -d`

| Service | Port | Purpose |
|---------|------|---------|
| MongoDB | 27017 | Primary database |
| Redis | 6379 | Caching + Bull queues |
| ClickHouse | 8123/9000 | Analytics (optional) |
| LocalStack | 4566 | S3 emulation (optional) |


### Pre-seeding User and Organization

After Docker services and the API are running, seed a default user and organization so you can skip the signup and org creation flows:

```bash
pnpm seed:agent
```

This creates a user and organization via the Better Auth API. Default credentials (overridable via env vars `SEED_USER_EMAIL`, `SEED_USER_PASSWORD`, `SEED_ORG_NAME`):

| Field        | Value                |
|--------------|----------------------|
| Email        | `agent@novu.co`      |
| Password     | `Agent123!@#`        |
| Organization | `Agent Organization` |

After seeding, sign in on the dashboard at `http://localhost:4201/auth/sign-in` with the credentials above. The organization already exists, so you will go straight to the dashboard without creating one.

**🏃 Running Services:**

Before running the use computer resource to navigate to the dashboard, make sure to run "pnpm build" script to ensure all your code changes are built and ready to be used. Only run those changes if you made changes to the "packages" folder or the "enterprise" folder.

```bash
# Core development stack
pnpm start:api:dev    # API service with hot reload
pnpm start:dashboard  # New React dashboard  
```

Key gotchas:
- The Dashboard Vite dev server runs on **port 4201** (configured in `apps/dashboard/vite.config.ts`)
- The Worker service must be running when testing the triggering of a workflow notification in Novu, otherwise can be skipped.

```bash
pnpm start:worker    # Background worker
```

### Dashboard interaction

If you have run `pnpm seed:agent`, sign in with `agent@novu.co` / `Agent123!@#` and you will land directly on the workflows page (no signup or org creation needed).

If you have NOT seeded, you will need to create a new user and organization. After the organization name is submitted, you can immediately navigate to the localhost:4201 root url and you should see the dashboard directly on the workflows page (Avoid doing the full onboarding unless requested).

### Linting

`pnpm check` runs Biome across the entire monorepo. Pre-existing warnings/errors are expected in this large codebase. The linter itself functions correctly.

### Testing

- API E2E tests: see `.cursor/skills/run-api-e2e-tests/SKILL.md`
- Dashboard E2E: `cd apps/dashboard && pnpm test:e2e`
- API unit tests: `cd apps/api && pnpm test`

## Creating Pull Requests

Requirements:

Follow the Conventional Commits specification
As a team member, include Linear ticket ID at the end: fixes TICKET-ID or include it in your branch name
Expected format: feat(scope): Add fancy new feature fixes NOV-123

Possible scopes:
- dashboard
- api-service
- worker
- shared
- js
- react
- react-native
- nextjs
- providers
- root 

PR title must end with 'fixes TICKET-ID' (e.g., 'fixes NOV-123') when a linear ticket id is available in context.

### Enterprise Packages (Git Submodule)

The `.source` folder is a **git submodule** pointing to the `novuhq/packages-enterprise` repository. When changes are made inside this submodule or `enterprise/packages` folder (which contains symlinked folders to the submodule), both repositories must be updated:

1. **Create a branch in the submodule** following the same Conventional Commits naming convention (e.g., `feat/scope-description-fixes-NOV-123`).
2. **Commit and push** the enterprise changes to that branch in the `novuhq/packages-enterprise` remote.
3. **Create a matching branch in the main repository** with the same name.
4. **Commit the updated submodule reference** (the changed pointer in `enterprise/`) along with any other main-repo changes to that branch.
5. **Push the main repository branch** and open PRs in both repositories.

Both PRs must follow the conventions from the "Creating Pull Requests" section above (Conventional Commits format, proper scope, Linear ticket ID when available).

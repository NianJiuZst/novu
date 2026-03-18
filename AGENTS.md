# AGENTS.md

## Cursor Cloud specific instructions

`pnpm setup:agent` has already been run. Do not run it again. The environment is fully configured: dependencies installed, enterprise packages linked, project built, `.env` files in place, Docker services running, and a default user/org seeded.

### Infrastructure Services

Docker services are running. To restart them after a reboot:

`docker compose -f docker/local/docker-compose.agent.yml up -d`

| Service | Port | Purpose |
|---------|------|---------|
| MongoDB | 27017 | Primary database |
| Redis | 6379 | Caching + Bull queues |
| ClickHouse | 8123/9000 | Analytics |
| LocalStack | 4566 | S3 emulation |

### Running Services

```bash
pnpm start:api:dev    # API service with hot reload
pnpm start:dashboard  # Dashboard (Vite dev server on port 4201)
pnpm start:worker     # Background worker (only needed when testing workflow triggers)
```

Run `pnpm build` before starting services **only** if you made changes to the `libs/`, `packages/` or `enterprise/` folder.

### Dashboard interaction

A default user and organization are pre-seeded. Sign in at `http://localhost:4201/auth/sign-in` with these credentials — no signup or org creation is needed:

| Field        | Value                |
|--------------|----------------------|
| Email        | `agent@novu.co`      |
| Password     | `Agent123!@#`        |
| Organization | `Agent Organization` |

Do not go through the onboarding flow unless explicitly requested.

### Linting

`pnpm check` runs Biome across the monorepo. Pre-existing warnings/errors are expected.

### Testing

- API E2E tests: see `.cursor/skills/run-api-e2e-tests/SKILL.md`
- Dashboard E2E: `cd apps/dashboard && pnpm test:e2e`
- API unit tests: `cd apps/api && pnpm test`

## Creating Pull Requests

Follow the Conventional Commits specification. Include a Linear ticket ID when available.

Format: `feat(scope): Add fancy new feature fixes NOV-123`

Scopes: `dashboard`, `api-service`, `worker`, `shared`, `js`, `react`, `react-native`, `nextjs`, `providers`, `root`, `application-generic`

### Enterprise Packages (Git Submodule)

The `.source` folder is a **git submodule** pointing to the `novuhq/packages-enterprise` repository. When changes are made inside this submodule or `enterprise/packages` folder (which contains symlinked folders to the submodule), both repositories must be updated:

1. **Create a branch in the submodule** following the same Conventional Commits naming convention (e.g., `feat/scope-description-fixes-NOV-123`).
2. **Commit and push** the enterprise changes to that branch in the `novuhq/packages-enterprise` remote.
3. **Create a matching branch in the main repository** with the same name.
4. **Commit the updated submodule reference** (the changed pointer in `enterprise/`) along with any other main-repo changes to that branch.
5. **Push the main repository branch** and open PRs in both repositories.

Both PRs must follow the conventions from the "Creating Pull Requests" section above (Conventional Commits format, proper scope, Linear ticket ID when available).

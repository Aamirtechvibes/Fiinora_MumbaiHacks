# CI/CD & Operations Guide

## Continuous Integration (GitHub Actions)

The CI pipeline is defined in `.github/workflows/ci.yml` and runs automatically on push and pull requests to `main` and `develop` branches.

### What the CI pipeline does:

1. **Setup**: Starts Postgres 15 and Redis 7 services in Docker containers
2. **Install**: Installs dependencies via `npm ci`
3. **Generate Prisma Client**: Regenerates Prisma client types
4. **Migrations**: Applies all pending Prisma migrations to test database
5. **Build**: Compiles TypeScript to JavaScript
6. **Unit & Route Tests**: Runs tests with coverage reporting
7. **Integration Tests**: Runs integration tests against real DB/Redis
8. **Coverage**: Uploads coverage reports to Codecov

### Environment Variables in CI

The workflow sets the following environment variables automatically:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/finora_test
REDIS_URL=redis://localhost:6379
NODE_ENV=test
```

For secrets (API keys, OpenRouter tokens), add them via GitHub Secrets:
- Go to **Settings → Secrets and variables → Actions**
- Add secrets like `OPENROUTER_API_KEY`, `JWT_SECRET`, etc.
- Reference in workflow: `${{ secrets.OPENROUTER_API_KEY }}`

## Local Development & Testing

### Prerequisites

- Docker and Docker Compose installed
- Node.js 20+ and npm

### Start services locally

```bash
docker-compose up -d postgres redis
```

Postgres will be available at `localhost:5432`, Redis at `localhost:6379`.

### Run migrations locally

```bash
npx prisma migrate dev
```

This creates a new migration and applies it. For deployment:

```bash
npx prisma migrate deploy
```

### Run tests locally

```bash
# All tests (mocked + integration)
npm test

# Only unit & route tests (fast, mocked)
npm test -- --testPathPattern="(unit|routes)"

# Only integration tests (requires DB/Redis)
npm test -- --testPathPattern="integration" --runInBand

# Watch mode
npm test -- --watch

# With coverage
npm test -- --coverage
```

## Database Backups & Restore

### Create a backup

```bash
# Backup database to SQL file
./scripts/backup-db.sh

# Or manually:
pg_dump "$DATABASE_URL" > backup_$(date +%Y%m%d_%H%M%S).sql
```

Backups are stored in `backups/` directory.

### Restore from backup

```bash
./scripts/restore-db.sh backup_20251125_120000.sql

# Or manually:
psql "$DATABASE_URL" < backup_20251125_120000.sql
```

## Deployment Checklist

- [ ] All tests passing locally and in CI
- [ ] Migrations applied to production database
- [ ] Environment variables set (secrets in deployment platform)
- [ ] Database backup taken before deployment
- [ ] Monitoring & alerting configured
- [ ] Rollback plan in place

## Monitoring & Alerts

- Application logs: Check Pino logger output
- Metrics: Prometheus metrics available at `/metrics`
- Health check: GET `/health` returns `200 OK`
- Performance: Monitor Redis memory and Postgres connections

## Security Notes

- **Secrets**: Never commit `.env` files. Use GitHub Secrets or platform-specific secret management.
- **CORS**: Configure in `src/config/index.ts` based on environment.
- **Rate Limiting**: Configured in Redis with 20 requests per hour per user for sensitive endpoints.
- **Account Lockout**: After 5 failed login attempts, account is locked for 30 minutes.

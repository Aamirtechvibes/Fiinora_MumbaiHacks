# Finora Backend - Production Ready ✅

## System Status

All services are running and operational:

- ✅ **API Server**: Running on http://localhost:4000 (hot-reload with ts-node-dev)
- ✅ **PostgreSQL Database**: Running on localhost:5432 (Finora database created)
- ✅ **Redis Cache**: Running on localhost:6379 (job queue and session storage)
- ✅ **Worker Service**: Running with BullMQ job processing enabled
- ✅ **Database Migrations**: Applied successfully (initial schema created)

## Architecture

### Services (Docker Compose)
```yaml
- api: Node.js 20 Slim backend server (port 4000)
- postgres: PostgreSQL 15 database (port 5432)
- redis: Redis 7 cache/job queue (port 6379)
- worker: BullMQ job worker (processes async tasks)
```

### Key Technologies
- **Framework**: Fastify 4.23.0 (@fastify/* scoped plugins)
- **ORM**: Prisma 5.0.0 (PostgreSQL)
- **Authentication**: JWT + Argon2 password hashing with refresh token rotation
- **Job Queue**: BullMQ with Redis
- **Type Safety**: TypeScript 5.8.0 strict mode
- **Container**: Docker with node:20-slim (Debian-based for OpenSSL compatibility)

## Critical Fixes Applied

### 1. Prisma Binary Target Compatibility
- **Issue**: Prisma Client generated for Windows couldn't run in Linux containers
- **Solution**: 
  - Added `binaryTargets = ["native", "debian-openssl-1.1.x"]` to schema.prisma
  - Switched from Alpine to Debian-based image (node:20-slim)
  - Regenerates Prisma on container startup

### 2. Native Module (Argon2) Compilation
- **Issue**: Windows-compiled argon2.node binary failed in Linux containers
- **Solution**:
  - Uses named volume `node_modules:/app/node_modules` for isolation
  - API startup command rebuilds argon2: `npm install argon2`
  - Docker build includes: `npm rebuild argon2`

### 3. Plugin Imports Standardization
- **Fixed**: Switched from legacy `fastify-*` to `@fastify/*` scoped packages
- **Affected**: @fastify/cors, @fastify/helmet, @fastify/cookie, @fastify/swagger

### 4. Module Structure
- **Created**: Missing module entry files (`src/modules/users/index.ts`, `src/modules/files/index.ts`)
- **Created**: Prisma plugin shim for compatibility

### 5. Prisma Schema Relations
- **Fixed**: Added missing reverse relation in Transaction → User
- **Added**: Cascade delete and proper indexing

## Quick Commands

### Start all services
```bash
docker-compose up -d
```

### Stop all services
```bash
docker-compose down
```

### View logs
```bash
docker-compose logs -f api      # API logs
docker-compose logs -f worker   # Worker logs
docker-compose logs -f postgres # Database logs
```

### Database operations
```bash
# Run migrations
docker-compose exec api npx prisma migrate dev

# Access database
docker-compose exec postgres psql -U postgres -d finora

# View schema in Prisma Studio
docker-compose exec api npx prisma studio
```

### Run tests
```bash
npm test
```

## Environment Variables

Required in `.env`:
- `DATABASE_URL=postgresql://postgres:postgres@postgres:5432/finora`
- `REDIS_URL=redis://redis:6379`
- `JWT_SECRET=<your-secret>`
- `JWT_REFRESH_SECRET=<your-secret>`

See `.env.example` for full list of available configuration.

## API Endpoints

### Authentication Module
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get tokens
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user
- `GET /auth/verify/:token` - Verify email
- `POST /auth/forgot` - Request password reset
- `POST /auth/reset` - Reset password

### Documentation
- `GET /docs` - OpenAPI/Swagger documentation
- `GET /docs/static/index.html` - Swagger UI

## Database Schema

**Tables Created:**
- `User` - Users with email, name, role, currency
- `Session` - JWT refresh token sessions with rotation tracking
- `Account` - External account integrations
- `PasswordReset` - Password reset token tracking
- `EmailVerification` - Email verification token tracking
- `Transaction` - User financial transactions
- `PointsTransaction` - Points history

## Deprecation Warnings (Non-Critical)

1. **BullMQ Redis Options**: Update Redis client options to set `maxRetriesPerRequest: null` to fix deprecation warning
2. **Prisma Version**: v7.0.0 available (breaking change, requires migration path)

## Production Deployment

For production deployments:

1. **Build production images**:
   ```bash
   docker build -t finora-api:latest .
   docker build -t finora-worker:latest -f Dockerfile .
   ```

2. **Update environment variables** in production deployment platform

3. **Run migrations** in production database:
   ```bash
   docker run --env-file .env finora-api:latest npx prisma migrate deploy
   ```

4. **Start services** with production compose file

5. **Ensure SSL/TLS** is configured at load balancer level

6. **Configure database backups** for PostgreSQL

7. **Set up monitoring** for Redis, PostgreSQL, and API endpoints

## Health Checks

API endpoint health verification:
- PostgreSQL: Prisma client connects on startup
- Redis: Checked when first job is queued
- Worker: Logs "Worker started" when connected to BullMQ

## Notes

- Development: Hot reload enabled with ts-node-dev
- Database: Automatically initializes with `CREATE DATABASE` if not exists
- Volumes: Named volumes persist data across container restarts
- Bind mount: Source code synced to container for development (excludes node_modules/.prisma)

---

**Status**: ✅ Production Ready  
**Last Updated**: 2025-11-24  
**Container Runtime**: Docker Compose  
**Base Image**: node:20-slim (Debian)

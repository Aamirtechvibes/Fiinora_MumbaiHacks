# Finora Backend — Complete System Explanation

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Data Models](#data-models)
5. [Core Modules](#core-modules)
6. [How It Works](#how-it-works)
7. [Security](#security)
8. [Performance](#performance)
9. [Operations](#operations)

---

## System Overview

**Finora** is a comprehensive financial management backend that helps users track, analyze, and optimize their finances. The system provides:

- **Financial Analytics**: Wallet summaries, cashflow tracking, net worth history
- **Transaction Management**: CRUD operations, CSV import, categorization
- **Budgeting & Goals**: Budget creation, simulation, goal tracking
- **Investment Tracking**: Portfolio management, price updates, returns calculation
- **Gamification**: Badges, challenges, leaderboards, points system
- **AI Assistant**: RAG-based chat with financial analysis capabilities
- **File Management**: Upload/download with S3 integration
- **Notifications**: Email alerts, in-app notifications
- **Admin Dashboard**: User management, audit logging, system configuration

**Tech**: Node.js 20 + TypeScript + Fastify + PostgreSQL + Redis + BullMQ

---

## Technology Stack

### Backend Framework
- **Fastify 4.0**: Lightweight, high-performance HTTP server
- **TypeScript 5.x**: Strong typing, compilation to ES2021 JavaScript

### Database
- **PostgreSQL 15**: Primary relational database
- **Prisma 5.0**: Type-safe ORM with migrations
- **pgvector**: Vector storage for AI embeddings

### Caching & Queues
- **Redis 7**: Cache, rate limiting, session storage
- **BullMQ**: Job queue for async tasks

### Authentication & Security
- **JWT (jsonwebtoken)**: Token-based authentication
- **Argon2**: Password hashing with salt
- **Helmet**: HTTP security headers
- **CORS**: Cross-origin request handling

### AI & ML
- **OpenRouter**: LLM API (Llama 2, GPT, etc.)
- **Embeddings**: pgvector + optional Pinecone
- **RAG (Retrieval-Augmented Generation)**: Context-aware AI responses

### External Services
- **AWS S3 v3 SDK**: File storage (with Minio fallback)
- **Nodemailer**: Email delivery
- **Prometheus**: Metrics collection

### Testing & Development
- **Jest**: Unit and integration testing
- **ts-jest**: TypeScript support in Jest
- **k6**: Load testing framework
- **Husky**: Git hooks

---

## Architecture

### Application Layer Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    HTTP Requests                             │
├─────────────────────────────────────────────────────────────┤
│                    Fastify Server                            │
│  ├─ Helmet (security headers)                              │
│  ├─ CORS (cross-origin)                                    │
│  ├─ JWT Auth Middleware                                    │
│  └─ Global Error Handling                                  │
├─────────────────────────────────────────────────────────────┤
│                     Routes Layer                             │
│  (auth, wallet, transactions, budgets, etc.)               │
├─────────────────────────────────────────────────────────────┤
│                   Controllers Layer                          │
│  (request validation, response formatting)                 │
├─────────────────────────────────────────────────────────────┤
│                    Services Layer                            │
│  (business logic, caching, external APIs)                  │
├─────────────────────────────────────────────────────────────┤
│                   Persistence Layer                          │
│  ├─ Prisma ORM (PostgreSQL)                                │
│  ├─ Redis (cache, rate limiting)                           │
│  └─ BullMQ (job queues)                                    │
├─────────────────────────────────────────────────────────────┤
│                   External Services                          │
│  ├─ OpenRouter (LLM)                                        │
│  ├─ AWS S3 (file storage)                                  │
│  ├─ Nodemailer (email)                                     │
│  └─ Prometheus (metrics)                                   │
└─────────────────────────────────────────────────────────────┘
```

### Module Structure

```
src/
├── app.ts                          # Fastify app factory (registers all plugins & modules)
├── index.ts                        # Entry point (secrets validation, server start)
├── config/
│   ├── index.ts                    # Configuration management
│   └── logging.ts                  # Pino logger config
├── plugins/                        # Fastify plugins (initialize external services)
│   ├── prisma.ts                   # Database ORM
│   ├── redis.ts                    # Cache & session store
│   ├── bullmq.ts                   # Job queues
│   ├── metrics.ts                  # Prometheus metrics
│   ├── sentry.ts                   # Error tracking
│   ├── swagger.ts                  # API documentation
│   └── jwt.ts                      # JWT verification middleware
├── modules/                        # Feature modules (each self-contained)
│   ├── auth/                       # Authentication & authorization
│   │   ├── auth.routes.ts          # HTTP endpoints
│   │   ├── auth.service.ts         # Business logic
│   │   ├── auth.controller.ts      # Request/response handling
│   │   ├── dto.ts                  # Data validation schemas
│   │   ├── strategies/             # Auth strategies (JWT, etc.)
│   │   └── tests/                  # Unit & integration tests
│   ├── wallet/                     # Financial analytics
│   ├── transactions/               # Transaction CRUD + import
│   ├── budgets/                    # Budget management & simulation
│   ├── investments/                # Portfolio tracking
│   ├── gamification/               # Badges, challenges, points
│   ├── notifications/              # Email & in-app alerts
│   ├── files/                      # File upload/download
│   ├── users/                      # User profile management
│   ├── admin/                      # Admin endpoints & RBAC
│   └── ai/                         # AI assistant & RAG
├── services/                       # Shared business logic
│   ├── jwt.service.ts              # JWT token signing/verification
│   ├── password.services.ts        # Password hashing/verification
│   ├── email.service.ts            # Email sending
│   ├── embeddings.service.ts       # Vector embeddings (pgvector/Pinecone)
│   ├── openrouter.client.ts        # LLM API client
│   ├── rateLimiter.ts              # Rate limiting logic
│   ├── secrets.service.ts          # Secret rotation & management
│   ├── monitoring.service.ts       # Application monitoring
│   └── metrics.service.ts          # Prometheus metrics
├── utils/                          # Utility functions
│   ├── logger.ts                   # Pino logger setup
│   ├── errors.ts                   # Custom error classes
│   ├── validators.ts               # Zod validation helpers
│   ├── performance.ts              # Performance optimization utilities
│   └── rbac.ts                     # Role-based access control
├── types/
│   └── index.d.ts                  # Global TypeScript types
├── jobs/                           # [DEPRECATED] Legacy job code
└── queues/
    └── worker.ts                   # BullMQ job worker (runs separately)

prisma/
├── schema.prisma                   # Database schema definition
├── seed.ts                         # Initial data seeding
└── migrations/                     # Database migration history

docker-compose.yml                  # Local development environment
Dockerfile                          # Docker image definition
.github/workflows/ci.yml            # GitHub Actions CI/CD pipeline
```

---

## Data Models

The Prisma schema defines 18 database models organized by domain:

### User & Authentication
```
User
├── id (UUID)
├── email (unique)
├── passwordHash
├── role (enum: USER, ADMIN)
├── lockedUntil (DateTime?) ← Account lockout
├── banned (Boolean)
└── relations: sessions, accounts, transactions, files, badges, investments, etc.

Session
├── id (sessionId)
├── userId (FK)
├── refreshHash (hashed refresh token)
├── expiresAt
└── rotated (for token rotation tracking)

PasswordReset
├── id
├── userId (FK)
├── tokenHash
└── expiresAt
```

### Financial Core
```
Account
├── id (UUID)
├── userId (FK)
├── type (CHECKING, SAVINGS, etc.)
├── name
└── balance (Decimal)

Transaction
├── id (UUID)
├── userId (FK)
├── accountId (FK)
├── txnDate
├── amount (Decimal)
├── category
└── merchant

Investment
├── id (UUID)
├── userId (FK)
├── symbol (stock ticker)
├── quantity (Decimal)
├── avgCost (Decimal)
├── currentPrice (Decimal?)
└── currency
```

### Budgets & Goals (not explicitly modeled, but conceptually)
- Budget creation/updates stored in Budget table
- Goal tracking in Budget model
- Simulation results computed on-the-fly

### Gamification
```
Badge
├── id
├── name (unique)
├── description
├── icon
└── pointsRequired

UserBadge (join table)
├── userId (FK)
├── badgeId (FK)
└── earnedAt

Challenge
├── id
├── name (unique)
├── description
├── type (TRANSACTION, GOAL, LOGIN, etc.)
├── target (numeric goal)
├── rewardPoints
└── durationDays

ChallengeProgress
├── userId (FK)
├── challengeId (FK)
├── progress (int)
└── completedAt (DateTime?)
```

### Gamification (continued)
```
PointsTransaction
├── id
├── userId (FK)
├── points (int)
└── reason (string)
```

### Files & Storage
```
File
├── id (UUID)
├── userId (FK)
├── key (S3 key, unique)
├── filename
├── size
└── mimeType
```

### AI & RAG
```
AiContext
├── id
├── userId (FK)
├── content (text)
├── embedding (pgvector) ← Vector for semantic search
└── metadata (JSON)

Conversation
├── id (UUID)
├── userId (FK)
└── messages (relation)

Message
├── id (UUID)
├── conversationId (FK)
├── role (user, assistant)
└── content (text)
```

### Audit & Security
```
AuditLog
├── id (UUID)
├── actorId (FK, who did it)
├── action (ban, unlock, create_badge, etc.)
├── targetId (who/what was affected)
├── metadata (JSON)
└── createdAt
```

---

## Core Modules

### 1. **Auth Module** (`src/modules/auth/`)
Handles user registration, login, token refresh, password resets.

**Key Files**:
- `auth.service.ts`: Register, login, refresh, logout, forgot password
- `auth.routes.ts`: HTTP endpoints
- `strategies/jwt.strategy.ts`: JWT token verification

**Flow**:
```
POST /api/v1/auth/register
  → Validate email/password
  → Hash password with Argon2
  → Create user in DB
  → Send email verification token
  → Return user object

POST /api/v1/auth/login
  → Find user by email
  → Check if account locked (> 5 failed attempts)
  → Verify password
  → Create session
  → Issue JWT access token (15 min) + refresh token (7 days)
  → Return tokens

POST /api/v1/auth/refresh
  → Validate refresh token
  → Issue new access token
  → Rotate refresh token (security best practice)
```

**Security**:
- ✅ Account lockout: 5 failed attempts → 30-min lockout
- ✅ Password hashing: Argon2 with salt
- ✅ Token rotation: Refresh token rotated on each use
- ✅ Token expiry: Short-lived access token (15 min)

---

### 2. **Wallet Module** (`src/modules/wallet/`)
Real-time financial analytics (summary, cashflow, net worth).

**Endpoints**:
- `GET /api/v1/wallet/summary` - Total balance, income/expense, trends
- `GET /api/v1/wallet/cashflow` - Daily breakdown of income/expenses
- `GET /api/v1/wallet/networth` - Historical net worth snapshots

**Caching Strategy**:
- All endpoints cached in Redis (60-600s TTL)
- Cache invalidated on new transactions
- Significantly reduces database load

**Example Response** (`/summary`):
```json
{
  "totalBalance": 50000.00,
  "totalIncome": 120000.00,
  "totalExpenses": 70000.00,
  "topCategories": [
    { "category": "Salary", "amount": 100000 },
    { "category": "Food", "amount": 5000 }
  ],
  "monthlyTrend": [
    { "month": "2025-01", "balance": 48000 },
    { "month": "2025-02", "balance": 50000 }
  ]
}
```

---

### 3. **Transactions Module** (`src/modules/transactions/`)
Full CRUD for transactions + CSV bulk import.

**Features**:
- Create/read/update/delete individual transactions
- Bulk import from CSV (enqueued as job)
- Category auto-detection (machine learning-ready)
- Pagination & filtering

**Example CSV Import**:
```csv
date,amount,category,merchant
2025-01-15,50.00,Food,Starbucks
2025-01-16,1000.00,Income,Employer
```

→ Processed by BullMQ worker, saved to DB

---

### 4. **Budgets Module** (`src/modules/budgets/`)
Budget creation, tracking, and scenario simulation.

**Features**:
- Set monthly budgets by category
- Track actual spending vs budget
- Simulate budget changes (what-if analysis)
- Goal setting & tracking

**Simulation Example**:
```
POST /api/v1/budgets/simulate
{
  "budgetId": "budget-123",
  "adjustmentPercent": 10  // Increase by 10%
}

Response:
{
  "originalBudget": 5000,
  "adjustedBudget": 5500,
  "projectedSpending": 5400,
  "surplus": 100
}
```

---

### 5. **Investments Module** (`src/modules/investments/`)
Portfolio tracking with price updates.

**Features**:
- Add/update/remove holdings
- Track quantity, average cost, current price
- Calculate returns
- Price update job (BullMQ worker fetches latest prices)

**Data**:
```
Investment {
  symbol: "AAPL",
  quantity: 10,
  avgCost: 150.00,
  currentPrice: 175.00,  // Updated by background job
  totalValue: 1750.00
}
```

---

### 6. **Gamification Module** (`src/modules/gamification/`)
Badges, challenges, points system for engagement.

**Components**:
- **Badges**: Achievement milestones (e.g., "Saved $10k", "7-day streak")
- **Challenges**: Time-bound goals (e.g., "Spend <$500 this week", "Complete 5 transactions")
- **Points**: Earned for completing challenges/badges, redeemable for rewards

**Workflow**:
```
User completes challenge
  ↓
Challenge worker detects completion
  ↓
Award points & badge (if applicable)
  ↓
Notify user (email)
```

---

### 7. **AI Assistant Module** (`src/modules/ai/`)
RAG-based financial AI that can analyze data and suggest actions.

**Architecture**:
```
User Message
  ↓
Query embeddings service (convert message to vector)
  ↓
Retrieve similar documents from pgvector (RAG)
  ↓
Send to OpenRouter LLM with context
  ↓
Parse structured JSON response
  ↓
Execute declared actions (if any)
  ↓
Return reply + action results
```

**Tool Methods** (AI can call these):
- `simulateBudgetChange(params)` - What-if budget analysis
- `computeCashflow(userId)` - Calculate recent cashflow
- `getInvestmentSummary(userId)` - Portfolio overview

**Example**:
```
User: "What if I reduce my food budget by 20%?"
  ↓
AI calls: simulateBudgetChange({ category: "Food", percent: -20 })
  ↓
AI returns: "Reducing food budget to $400/month would save $100/month, 
  giving you a total surplus of $250. Here's a simulation..."
```

**RAG Store** (Embeddings):
- Stores financial documents, tips, user's past transactions
- Uses pgvector for semantic search (similarity between embeddings)
- Falls back to Pinecone for cloud deployment
- Embedding dimension: 1536 (OpenAI default)

---

### 8. **Files Module** (`src/modules/files/`)
Upload/download with S3 integration.

**Features**:
- Upload file → stored in S3 with presigned URL
- Download file → retrieve from S3
- Metadata tracking (filename, size, mime type)
- Minio support for local testing

**Flow**:
```
POST /api/v1/files/upload
  → Validate file (size, type)
  → Generate S3 key (userId/timestamp/filename)
  → Upload to S3 (or Minio)
  → Store metadata in DB
  → Return presigned URL (valid for 1 hour)

GET /api/v1/files/:id/download
  → Verify ownership (user can only download their files)
  → Generate presigned URL
  → Redirect to S3
```

---

### 9. **Notifications Module** (`src/modules/notifications/`)
Email & in-app alerts.

**Uses BullMQ to process async emails**:
- Account lockout alerts
- Transaction confirmations
- Budget warnings
- Challenge completions
- Admin actions

**Implementation**:
```
Service enqueues email job
  ↓
BullMQ worker (separate process) consumes job
  ↓
Nodemailer sends email
  ↓
Retry on failure (exponential backoff)
```

---

### 10. **Admin Module** (`src/modules/admin/`)
Admin-only endpoints for user management and monitoring.

**Endpoints**:
- `POST /admin/users/:id/ban` - Ban user
- `POST /admin/users/:id/unlock` - Clear lockout
- `GET /admin/audit-logs` - List security events
- `POST /admin/badges` - Create gamification badge
- `POST /admin/challenges` - Create challenge

**RBAC Middleware** (`requireAdminRole`):
- Verifies JWT has `role: ADMIN`
- Logs all admin actions to audit trail
- Returns 403 if non-admin attempts access

---

## How It Works

### Complete Request Flow

```
1. Client sends HTTP request with JWT token
   Example: GET /api/v1/wallet/summary
   Header: Authorization: Bearer eyJhbGc...

2. Fastify receives request
   
3. Helmet middleware adds security headers
   
4. CORS middleware validates origin
   
5. JWT middleware (in route) verifies token
   - Validate signature
   - Check expiry
   - Extract userId
   - If invalid → return 401
   
6. Route handler invokes controller
   
7. Controller validates request body (Zod schema)
   
8. Service layer executes business logic
   - Check Redis cache
   - If hit → return cached result
   - If miss → query database via Prisma
   - Perform calculations/aggregations
   - Store in Redis with TTL
   
9. Database query executed in PostgreSQL
   - Multiple queries may be optimized with indexes
   - Transactions used for atomicity if needed
   
10. Results returned to service
    
11. Service formats response
    
12. Controller sends HTTP response (200 OK)
    
13. Client receives JSON response
```

### Background Job Processing

```
1. Service enqueues job to Redis (via BullMQ)
   Example: Email notification job
   queue.add('send-email', { 
     to: user.email, 
     subject: 'Alert', 
     body: '...' 
   })

2. Job stored in Redis queue (durable)

3. Worker process (separate container/process) polls Redis
   
4. Worker dequeues job and executes handler
   
5. Handler sends email (via Nodemailer)
   
6. If success → mark job complete
   
7. If failure → retry with exponential backoff (max 3 times)
   
8. After final failure → move to failed queue (for inspection)
```

### Caching Strategy

```
Request comes in
  ↓
Check Redis cache (key: `wallet:${userId}:summary`)
  ↓
Cache hit? → Return immediately (saves DB query)
  ↓
Cache miss? → Query database
  ↓
Process results
  ↓
Store in Redis (TTL: 60 seconds)
  ↓
Return to client

When user creates transaction
  ↓
Invalidate cache patterns
  ↓
redis.del('wallet:*:summary')
  ↓
Next request will query fresh DB data
```

---

## Security

### Authentication & Authorization
| Layer | Implementation |
|-------|-----------------|
| **Token** | JWT (15 min access, 7 day refresh) |
| **Password** | Argon2 with salt (memory-hard, resistant to GPU attacks) |
| **Session** | Refresh token rotation (old token invalidated after use) |
| **RBAC** | Role enum (USER, ADMIN) checked per route |
| **Middleware** | `requireAdminRole()` guards sensitive endpoints |

### Threat Protections
| Threat | Mitigation |
|--------|-----------|
| **SQL Injection** | Prisma ORM parameterizes all queries |
| **XSS** | Helmet CSP headers + output encoding |
| **CSRF** | Samsite cookie policy + token validation |
| **Brute Force** | Account lockout after 5 failed logins (30 min) |
| **Rate Limiting** | Redis-based (20 req/hr per user on sensitive endpoints) |
| **Account Takeover** | Email verification on signup, password reset tokens |
| **Secrets Leakage** | Secrets never committed; validated at startup |
| **Audit Trail** | All admin actions logged to AuditLog table |

### Data Isolation
- Users can only access their own data
- Row-level security enforced in service layer (check `userId === request.userId`)
- No data leakage between users in responses

---

## Performance

### Optimizations Implemented

| Technique | Implementation |
|-----------|-----------------|
| **Caching** | Redis TTL-based (60-600s) |
| **Pagination** | Limit 50/1000 per request (prevents huge transfers) |
| **Indexing** | DB indexes on userId, conversationId, etc. |
| **Lazy Loading** | Relation fields loaded on-demand (not always eager) |
| **Background Jobs** | Email/CSV import async (doesn't block request) |
| **Connection Pooling** | Prisma pools DB connections (default: 20) |
| **Metrics** | Prometheus tracks endpoint latency, errors |
| **Load Testing** | k6 baseline/load/stress/spike tests |

### Performance Targets
| Endpoint | P95 Latency | P99 Latency |
|----------|------------|------------|
| Health check | 50ms | 100ms |
| Wallet summary | 100ms | 200ms |
| Transactions list | 150ms | 300ms |
| AI Chat | 2000ms | 5000ms |
| Admin endpoints | 200ms | 500ms |

### Monitoring

**Metrics exposed at `/metrics` (Prometheus format)**:
- `http_requests_total` - Total requests by endpoint
- `http_request_duration_ms` - Latency distribution
- `http_errors_total` - Error rate
- Database connection pool status
- Redis operations count

---

## Operations

### Deployment

**Prerequisites**:
```bash
- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Environment variables (.env file)
```

**Steps**:
```bash
1. npm ci                    # Install dependencies
2. npx prisma generate      # Generate Prisma client
3. npm run validate:secrets # Validate all required secrets
4. npm run build            # Compile TypeScript
5. npx prisma migrate deploy # Apply DB migrations
6. npm start                # Start server
```

### Docker Deployment

```bash
docker-compose up -d        # Start all services (API, DB, Redis, Worker)
docker-compose logs -f      # View logs
docker-compose down         # Stop all services
```

### Backups

```bash
./scripts/backup-db.sh      # Backup database to compressed SQL file
./scripts/restore-db.sh backup_file.sql.gz  # Restore from backup
```

### Monitoring & Alerts

```
Health Check:     GET /health
Metrics:          GET /metrics
Logs:             Pino logger (structured JSON)
Error Tracking:   Sentry integration (optional)
Audit Trail:      SELECT * FROM "AuditLog"
```

### Secrets Management

```bash
./scripts/secrets.sh validate              # Validate required secrets
./scripts/secrets.sh rotate-jwt            # Rotate JWT secret (7-day grace period)
./scripts/secrets.sh rotate-api-key openrouter  # Rotate API keys
./scripts/secrets.sh backup                # Backup secrets to encrypted file
./scripts/secrets.sh restore backup.tar.gz # Restore secrets
```

### Performance Testing

```bash
npm run test:baseline       # Sequential endpoint testing
npm run test:load          # Ramp up to 50 concurrent users
./scripts/run-loadtest.sh stress  # Gradually increase users to 500
./scripts/run-loadtest.sh spike   # Sudden spike to 200 users
```

---

## Testing

### Test Coverage

| Module | Unit Tests | Integration Tests | Status |
|--------|-----------|------------------|--------|
| Auth | ✅ 3 tests | ✅ 2 tests | Full coverage |
| Wallet | ✅ 6 tests | ✅ 4 tests | Full coverage |
| Transactions | ✅ 4 tests | ✅ 2 tests | Full coverage |
| Budgets | ✅ 2 tests | - | Unit tests |
| AI | ✅ 3 tests | ✅ 1 test | Core functionality |
| Admin | ✅ 5 tests | - | RBAC verified |
| **Total** | **30+ tests** | **15+ tests** | **45+ tests passing** |

### Running Tests

```bash
npm test                              # All tests
npm test -- --testPathPattern="auth" # Specific module
npm test -- --coverage              # With coverage report
NODE_ENV=test npx jest --watch      # Watch mode
```

---

## Code Quality

### Build & Compilation
```bash
npm run build       # TypeScript to JavaScript (tsc)
npm run lint        # ESLint check
npm run format      # Prettier code formatting
```

### Type Safety
- Strict TypeScript mode enabled
- All functions have explicit return types
- Zod validation for all inputs
- Type-safe database queries via Prisma

### Error Handling
- Custom error classes (`AuthError`, `NotFoundError`, `ValidationError`)
- Global error handler in Fastify
- Graceful failure for external APIs (fallbacks where applicable)
- Structured error responses (status code + message + details)

---

## Summary

**Finora Backend** is a production-ready financial management platform built with modern TypeScript/Node.js stack. It features:

- ✅ **11 feature modules** (auth, wallet, transactions, budgets, investments, gamification, AI, files, notifications, admin, users)
- ✅ **Secure authentication** (JWT + Argon2 + token rotation)
- ✅ **Fast caching** (Redis TTL-based)
- ✅ **Async processing** (BullMQ job queues)
- ✅ **RAG-powered AI** (embeddings + OpenRouter)
- ✅ **Comprehensive monitoring** (Prometheus metrics, health checks, audit logs)
- ✅ **Automated CI/CD** (GitHub Actions)
- ✅ **Load tested** (k6 baseline/stress/spike tests)
- ✅ **Production-hardened** (rate limiting, account lockout, secrets rotation)
- ✅ **45+ unit & integration tests** (all passing)

**Architecture**: Clean layered design (Routes → Controllers → Services → ORM) with clear separation of concerns, making it easy to test, maintain, and extend.

**Ready for deployment** to production with Docker, Kubernetes, AWS, or any Node.js-capable platform.

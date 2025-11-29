# Finora Backend - Visual Architecture & Data Flow

## 📊 System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                          CLIENT APPLICATIONS                                │
│                   (Web, Mobile, Third-party APIs)                          │
└────────────────────────────────────────────┬───────────────────────────────┘
                                              │ HTTP/HTTPS
                                              ↓
┌────────────────────────────────────────────────────────────────────────────┐
│                         FASTIFY HTTP SERVER                                 │
├────────────────────────────────────────────────────────────────────────────┤
│  Security Layer:                                                            │
│  ├─ Helmet (Security Headers)                                             │
│  ├─ CORS (Cross-Origin Validation)                                        │
│  ├─ JWT Middleware (Authentication)                                       │
│  ├─ Rate Limiter (20 req/hr per user)                                     │
│  └─ RBAC Middleware (Role-based Access)                                   │
├────────────────────────────────────────────────────────────────────────────┤
│  Router Layer (11 Modules):                                               │
│  ├─ /api/v1/auth              (Register, Login, Refresh)                 │
│  ├─ /api/v1/wallet            (Analytics, Cashflow)                      │
│  ├─ /api/v1/transactions      (CRUD, Import)                             │
│  ├─ /api/v1/budgets           (Create, Simulate)                         │
│  ├─ /api/v1/investments       (Portfolio)                                │
│  ├─ /api/v1/gamification      (Badges, Challenges)                       │
│  ├─ /api/v1/ai                (Chat, RAG)                                │
│  ├─ /api/v1/files             (Upload, Download)                         │
│  ├─ /api/v1/notifications     (Email, Alerts)                            │
│  ├─ /api/v1/users             (Profile)                                  │
│  ├─ /admin                    (Admin endpoints)                           │
│  ├─ /health                   (Service health)                           │
│  ├─ /metrics                  (Prometheus)                               │
│  └─ /docs                     (Swagger API docs)                         │
├────────────────────────────────────────────────────────────────────────────┤
│  Service Layer (Business Logic):                                           │
│  • Controllers (Request validation via Zod)                               │
│  • Services (Business logic, caching, orchestration)                      │
│  • External clients (OpenRouter, AWS S3, Nodemailer)                      │
└────────────────────────────────────────────────────────────────────────────┘
         │                      │                      │
         ↓                      ↓                      ↓
    ┌─────────┐           ┌─────────┐           ┌──────────┐
    │ REDIS   │           │POSTGRES │           │   AWS    │
    │ Cache   │           │Database │           │  S3      │
    ├─────────┤           ├─────────┤           ├──────────┤
    │ Sessions│           │ Users   │           │ Files    │
    │ Cache   │           │ Trans   │           │ (Docs)   │
    │ Queues  │           │ Budgets │           │ Backups  │
    │ Limits  │           │ Goals   │           │          │
    │ Pub/Sub │           │ Badges  │           └──────────┘
    └─────────┘           │ Messages│
         ▲                 │ Logs    │
         │                 └─────────┘
         │                      ▲
    ┌──────────────────────────────┐
    │   BullMQ Job Queue Worker    │
    ├──────────────────────────────┤
    │ Email Queue                  │
    │ CSV Import Queue             │
    │ Price Update Queue           │
    │ Gamification Queue           │
    │ Notification Queue           │
    └──────────────────────────────┘
```

---

## 🔄 Request Flow Diagram

### Example: Wallet Summary Request

```
┌──────────────────────────────┐
│  Client (Browser/App)        │
│  GET /api/v1/wallet/summary  │
│  Authorization: Bearer JWT   │
└──────────┬───────────────────┘
           │
           ↓
┌──────────────────────────────────────────┐
│  Fastify Server                          │
│  1. Helmet middleware (security headers) │
│  2. CORS middleware (check origin)       │
│  3. JWT middleware (verify token)        │
│     ├─ Decode token                      │
│     ├─ Verify signature                  │
│     ├─ Check expiry                      │
│     └─ Extract userId                    │
└──────────┬───────────────────────────────┘
           │
           ↓
┌──────────────────────────────────────────┐
│  Route Handler                           │
│  walletRoutes[GET /summary]              │
│  ├─ Verify JWT valid                     │
│  └─ Call wallet controller               │
└──────────┬───────────────────────────────┘
           │
           ↓
┌──────────────────────────────────────────┐
│  Controller (walletController)           │
│  ├─ Parse request query params           │
│  ├─ Validate input (Zod schema)          │
│  └─ Call wallet service                  │
└──────────┬───────────────────────────────┘
           │
           ↓
┌──────────────────────────────────────────┐
│  Service (walletService.getSummary)      │
│  1. Generate cache key                   │
│     `wallet:${userId}:summary`           │
│                                          │
│  2. Check Redis cache                    │
└──────────┬──────────────────┬────────────┘
           │                  │
    ┌──────▼──────┐    ┌──────▼──────────┐
    │ Cache HIT   │    │  Cache MISS     │
    ├─────────────┤    ├─────────────────┤
    │ Return data │    │ Query database  │
    │ (instant)   │    │ 1. Get accounts │
    └──────┬──────┘    │ 2. Get trans    │
           │           │ 3. Aggregate    │
           │           │ 4. Calculate    │
           │           │ 5. Store cache  │
           │           └─────────┬───────┘
           │                     │
           └──────────┬──────────┘
                      ↓
         ┌────────────────────────────┐
         │  Format Response (JSON)    │
         │  {                         │
         │    totalBalance: 50000,    │
         │    income: 120000,         │
         │    expenses: 70000,        │
         │    topCategories: [...]    │
         │  }                         │
         └──────────┬─────────────────┘
                    ↓
         ┌────────────────────────────┐
         │  Send HTTP 200 Response    │
         │  Content-Type: application/json
         └──────────┬─────────────────┘
                    ↓
         ┌────────────────────────────┐
         │  Client receives JSON data │
         │  Renders on screen         │
         └────────────────────────────┘
```

---

## 🔐 Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    REGISTRATION FLOW                             │
├─────────────────────────────────────────────────────────────────┤

User submits: { email, password, name }
         ↓
Validate input (Zod)
         ↓
Check email unique?
         ↓ Yes
Hash password with Argon2 + salt
         ↓
Create User in DB
         ↓
Generate random verification token
         ↓
Store hashed token in EmailVerification table (24h expiry)
         ↓
Send email with verification link
         ↓
Return user object (without password)

┌─────────────────────────────────────────────────────────────────┐
│                      LOGIN FLOW                                  │
├─────────────────────────────────────────────────────────────────┤

User submits: { email, password }
         ↓
Find user by email
         ↓
User exists?
    │
    ├─ No  → Return "Invalid credentials"
    └─ Yes → Next
         ↓
Check if user.lockedUntil > now()
    │
    ├─ Yes → Return "AccountLocked"
    └─ No  → Next
         ↓
Verify password (Argon2)
    │
    ├─ Failed → Increment Redis counter
    │           (auth:fail:${userId})
    │           Count >= 5?
    │           ├─ Yes → Lock account 30 min
    │           │        Send email alert
    │           └─ No  → Return "Invalid credentials"
    │
    └─ Success → Clear counter
                 ↓
         Create Session in DB
                 ↓
         Issue JWT access token (15 min)
         + JWT refresh token (7 days)
                 ↓
         Hash & store refresh token in DB
                 ↓
         Return tokens to client
                 ↓
         Client stores in secure storage
         (httpOnly cookie or secure storage)

┌─────────────────────────────────────────────────────────────────┐
│                   TOKEN REFRESH FLOW                             │
├─────────────────────────────────────────────────────────────────┤

Client sends: { refreshToken }
         ↓
Verify refresh token (check hash in DB)
         ↓
Token valid & not expired?
    │
    ├─ No  → Return 401 (must login again)
    └─ Yes → Next
         ↓
Issue NEW access token (15 min)
         ↓
ROTATE refresh token (security best practice)
    • Generate new refresh token
    • Hash it
    • Store in DB
    • Delete old token from DB
         ↓
Return new tokens
         ↓
Invalidate old refresh token
(prevents replay attacks)

┌─────────────────────────────────────────────────────────────────┐
│              PROTECTED REQUEST FLOW                              │
├─────────────────────────────────────────────────────────────────┤

Client sends request with: Authorization: Bearer ${accessToken}
         ↓
Extract token from header
         ↓
Verify signature (using JWT_ACCESS_TOKEN_SECRET)
    │
    ├─ Signature invalid → Return 401
    ├─ Token expired → Return 401
    └─ Valid → Extract claims (userId, role, sub)
         ↓
Check expiry time (iat + exp)
    │
    ├─ Expired → Return 401
    └─ Valid → Attach to request.userId & request.role
         ↓
Process request with user context
```

---

## 📦 Job Processing Flow

```
┌────────────────────────────────────────────────────────┐
│              SERVICE ENQUEUES JOB                       │
├────────────────────────────────────────────────────────┤

User uploads CSV for import
         ↓
Service validates file
         ↓
const job = await csvQueue.add('import', {
  fileKey: 'user-123/file.csv',
  userId: 'user-123',
  timestamp: now()
})
         ↓
Job stored in Redis queue
         ↓
Service returns immediately (doesn't wait)
         ↓
Client gets success response

┌────────────────────────────────────────────────────────┐
│         BULLMQ WORKER PROCESSES JOB                     │
├────────────────────────────────────────────────────────┤

Worker starts (separate process/container)
         ↓
Loop:
  1. Poll Redis for pending jobs
  2. Dequeue job from queue
  3. Execute job handler
         ↓
Handler processes CSV:
  • Download file from S3
  • Parse CSV rows
  • Validate each row
  • Create Transaction records
  • Store in DB
         ↓
Success?
    │
    ├─ Yes → Mark job complete
    │        Emit 'completed' event
    │        Send notification to user
    │
    └─ No  → Increment retry count
             Max retries (3) exceeded?
             ├─ Yes → Move to dead letter queue
             │        Send error email
             └─ No  → Re-queue with backoff

┌────────────────────────────────────────────────────────┐
│        JOB STATE TRANSITIONS                            │
├────────────────────────────────────────────────────────┤

Pending → (Worker picks up) → Active
   ↓
   ├─ Success → Completed (deleted after 24h)
   ├─ Failure → Failed (moved to DLQ)
   └─ Pause  → Paused (can be resumed)

Queue types:
• email         (Send emails)
• csv-import    (Bulk import transactions)
• price-update  (Fetch stock prices)
• gamification  (Check & award badges)
• notifications (Send alerts)

Concurrency:
• Each queue: 1-5 concurrent workers
• Prevents overwhelming external services
• Configurable per queue
```

---

## 🗄️ Database Schema Relationships

```
USER (many)
  ├── has many SESSIONS (token storage)
  ├── has many ACCOUNTS (checking, savings, etc.)
  ├── has many TRANSACTIONS (all financial activity)
  ├── has many INVESTMENTS (stock portfolio)
  ├── has many USER_BADGES (earned badges)
  ├── has many CHALLENGE_PROGRESS (challenge tracking)
  ├── has many POINT_TRANSACTIONS (gamification points)
  ├── has many FILES (uploaded documents)
  ├── has many CONVERSATIONS (chat history)
  └── has many AUDIT_LOG entries (admin actions)

ACCOUNT (many)
  ├── belongs to USER (one)
  └── has many TRANSACTIONS

TRANSACTION (many)
  ├── belongs to ACCOUNT
  └── belongs to USER

INVESTMENT (many)
  └── belongs to USER

BADGE (many)
  └── has many USER_BADGES (join table)

CHALLENGE (many)
  └── has many CHALLENGE_PROGRESS

USER_BADGE (join)
  ├── belongs to USER
  └── belongs to BADGE

CHALLENGE_PROGRESS (join)
  ├── belongs to USER
  └── belongs to CHALLENGE

FILE (many)
  └── belongs to USER

CONVERSATION (many)
  ├── belongs to USER
  └── has many MESSAGES

MESSAGE (many)
  └── belongs to CONVERSATION

AI_CONTEXT (many)
  └── belongs to USER
      (for RAG embeddings)

AUDIT_LOG (many)
  └── references USER (actor) & target
      (security event tracking)
```

---

## 💾 Caching Strategy

```
┌─────────────────────────────────────────────────────────┐
│            REQUEST HITS CACHE LAYER                      │
├─────────────────────────────────────────────────────────┤

GET /api/v1/wallet/summary?userId=123
         ↓
Generate cache key: "wallet:123:summary"
         ↓
redis.get("wallet:123:summary")
         ↓
    ├─ Key exists → Return immediately (no DB query!)
    │              Response time: ~5-10ms
    │
    └─ Key not found → Query database
                      ↓
                  Run aggregation queries
                      ↓
                  Process results
                      ↓
                  redis.setex(
                    "wallet:123:summary",
                    60,  // 60 second TTL
                    JSON.stringify(result)
                  )
                      ↓
                  Return to client
                  Response time: ~100-200ms

┌─────────────────────────────────────────────────────────┐
│         CACHE INVALIDATION ON WRITE                      │
├─────────────────────────────────────────────────────────┤

POST /api/v1/transactions (create new transaction)
         ↓
Save transaction to DB
         ↓
Invalidate wallet cache:
  redis.del("wallet:${userId}:summary")
  redis.del("wallet:${userId}:cashflow")
  redis.del("wallet:${userId}:networth")
         ↓
Next read will query fresh database
         ↓
Cache repopulated for next request

Cache TTL Strategy:
┌────────────────────┬──────────┬─────────────────────┐
│ Data               │ TTL      │ Invalidation        │
├────────────────────┼──────────┼─────────────────────┤
│ Wallet Summary     │ 60s      │ On new transaction  │
│ Cashflow           │ 60s      │ On new transaction  │
│ Net Worth (hist)   │ 600s     │ Daily refresh       │
│ Badges             │ 3600s    │ On achievement      │
│ User Profile       │ 300s     │ On profile update   │
│ Investments        │ 300s     │ On price update     │
│ Rate Limit Counter │ 3600s    │ Auto-expire         │
└────────────────────┴──────────┴─────────────────────┘
```

---

## 🔒 Security Layers

```
                    REQUEST
                      │
                      ↓
    ┌─────────────────────────────────┐
    │ NETWORK SECURITY                │
    ├─────────────────────────────────┤
    │ • HTTPS/TLS encryption          │
    │ • DDoS protection (Cloudflare)  │
    │ • WAF (Web App Firewall)        │
    └──────────┬──────────────────────┘
               │
               ↓
    ┌─────────────────────────────────┐
    │ APPLICATION SECURITY            │
    ├─────────────────────────────────┤
    │ • Helmet security headers       │
    │ • CORS validation               │
    │ • Input validation (Zod)        │
    │ • SQL injection prevention      │
    └──────────┬──────────────────────┘
               │
               ↓
    ┌─────────────────────────────────┐
    │ AUTHENTICATION                  │
    ├─────────────────────────────────┤
    │ • JWT token verification        │
    │ • Token expiry check            │
    │ • Refresh token rotation        │
    │ • Account lockout (5 attempts)  │
    └──────────┬──────────────────────┘
               │
               ↓
    ┌─────────────────────────────────┐
    │ AUTHORIZATION (RBAC)            │
    ├─────────────────────────────────┤
    │ • Role check (USER/ADMIN)       │
    │ • Resource ownership validation │
    │ • Row-level security            │
    │ • Per-endpoint permissions      │
    └──────────┬──────────────────────┘
               │
               ↓
    ┌─────────────────────────────────┐
    │ RATE LIMITING & DOS             │
    ├─────────────────────────────────┤
    │ • Redis-based rate limiter      │
    │ • 20 req/hour per user          │
    │ • Per-endpoint limits           │
    │ • IP-based backup limits        │
    └──────────┬──────────────────────┘
               │
               ↓
    ┌─────────────────────────────────┐
    │ DATA PROTECTION                 │
    ├─────────────────────────────────┤
    │ • User data isolation           │
    │ • Password hashing (Argon2)     │
    │ • Secrets rotation (90 days)    │
    │ • Audit logging                 │
    │ • Database encryption (at rest) │
    └──────────┬──────────────────────┘
               │
               ↓
           REQUEST ALLOWED
```

---

## 📊 Monitoring & Observability

```
┌────────────────────────────────────────────────┐
│         APPLICATION METRICS                     │
├────────────────────────────────────────────────┤
│ Prometheus Endpoint: /metrics                  │
│                                                │
│ Tracked Metrics:                               │
│ • http_requests_total (count by endpoint)     │
│ • http_request_duration_ms (latency p50/95)  │
│ • http_errors_total (errors by code)          │
│ • database_connections (pool size)            │
│ • redis_operations (commands/sec)             │
│ • job_queue_length (pending jobs)             │
│ • cache_hit_rate (% of cache hits)            │
└────────────────────┬───────────────────────────┘
                     │
        ┌────────────┴────────────┐
        ↓                         ↓
    ┌─────────┐            ┌──────────┐
    │ Grafana │            │ Datadog  │
    │ (local) │            │ (SaaS)   │
    └─────────┘            └──────────┘
        │                      │
        ├─ Dashboard           ├─ Alerts
        ├─ Visualizations      ├─ Anomaly detection
        └─ Historical data     └─ Team notifications

┌────────────────────────────────────────────────┐
│         LOGGING & TRACING                       │
├────────────────────────────────────────────────┤
│ Logger: Pino (structured JSON logs)            │
│ Log Level: debug, info, warn, error            │
│                                                │
│ Example log:                                   │
│ {                                              │
│   "level": "info",                             │
│   "time": "2025-01-15T12:30:45Z",             │
│   "request_id": "uuid-123",                    │
│   "method": "GET",                             │
│   "path": "/api/v1/wallet/summary",           │
│   "status_code": 200,                          │
│   "duration_ms": 87,                           │
│   "userId": "user-123"                         │
│ }                                              │
│                                                │
│ Integration:                                   │
│ • Logs shipped to ELK/Splunk                   │
│ • Sentry for error tracking                    │
│ • Datadog/NewRelic for APM                     │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│         HEALTH CHECK                            │
├────────────────────────────────────────────────┤
│ Endpoint: GET /health                          │
│                                                │
│ Response:                                      │
│ {                                              │
│   "status": "ok" | "degraded",                │
│   "database": "connected" | "disconnected",   │
│   "cache": "connected" | "disconnected",      │
│   "timestamp": "2025-01-15T12:30:45Z"         │
│ }                                              │
│                                                │
│ Used by:                                       │
│ • Kubernetes health probes (liveness/ready)   │
│ • Load balancer heartbeat                     │
│ • Uptime monitoring services                  │
└────────────────────────────────────────────────┘
```

---

## 🚀 Deployment Architecture

```
┌─────────────────────────────────────────────────────┐
│            DOCKER COMPOSE (Local Dev)               │
├─────────────────────────────────────────────────────┤
│                                                     │
│  api container                                     │
│  ├─ Node.js 20 Slim                               │
│  ├─ Port 4000                                      │
│  └─ Hot-reload (ts-node-dev)                      │
│                                                     │
│  postgres container                                │
│  ├─ PostgreSQL 15                                  │
│  ├─ Port 5432                                      │
│  └─ Volume: pgdata                                │
│                                                     │
│  redis container                                   │
│  ├─ Redis 7                                        │
│  ├─ Port 6379                                      │
│  └─ No persistence (for dev)                       │
│                                                     │
│  worker container                                  │
│  ├─ BullMQ job processor                          │
│  ├─ Linked to redis & postgres                    │
│  └─ Restarts on failure                           │
│                                                     │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│            KUBERNETES (Production)                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  API Pod (replicated: 3+)                          │
│  ├─ Container: finora-api:latest                   │
│  ├─ Resource limits: CPU/Memory                    │
│  ├─ Health probes: liveness/readiness              │
│  └─ Rolling updates                                │
│                                                     │
│  Worker Pod (replicated: 2+)                       │
│  ├─ Container: finora-api:latest (worker cmd)      │
│  ├─ Restart policy: on-failure                     │
│  └─ Limited by queue depth                         │
│                                                     │
│  PostgreSQL Service                                │
│  ├─ StatefulSet (persistent storage)               │
│  ├─ Backups (PVC snapshots)                        │
│  ├─ Point-in-time recovery                         │
│  └─ Primary + replicas (HA)                        │
│                                                     │
│  Redis Service                                     │
│  ├─ Cluster mode (sharded)                         │
│  ├─ Persistence (AOF)                              │
│  ├─ Sentinel (failover)                            │
│  └─ Replicated (HA)                                │
│                                                     │
│  Ingress Controller                                │
│  ├─ TLS termination                                │
│  ├─ Load balancing                                 │
│  ├─ SSL certificate renewal                        │
│  └─ Domain routing                                 │
│                                                     │
│  ConfigMap/Secret                                  │
│  ├─ Environment variables                          │
│  ├─ Secrets (encrypted at rest)                    │
│  ├─ Database credentials                           │
│  └─ API keys (rotated 90 days)                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

This visual guide complements the COMPLETE_SYSTEM_GUIDE.md with architecture diagrams and data flow illustrations.

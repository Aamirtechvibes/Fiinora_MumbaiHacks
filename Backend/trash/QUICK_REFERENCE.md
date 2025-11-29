# Finora Backend - Quick Reference Guide

## 🚀 Quick Start

```bash
# Clone/setup
git clone <repo>
cd finora-backend

# Install dependencies
npm install

# Start all services (Docker)
docker-compose up --build

# Or manually:
# Terminal 1: PostgreSQL
psql postgresql://postgres:postgres@localhost:5432/finora

# Terminal 2: Redis
redis-server

# Terminal 3: API Server
npm run dev

# Terminal 4: Worker
npm run build && node dist/queues/worker.js
```

**Access**:
- API: http://localhost:4000
- Swagger Docs: http://localhost:4000/docs
- Prometheus: http://localhost:4000/metrics
- Health: http://localhost:4000/health

---

## 📚 API Endpoints Cheat Sheet

### Authentication
```bash
# Register
POST /api/v1/auth/register
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}

# Login
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
# Response: { accessToken, refreshToken, user }

# Refresh Token
POST /api/v1/auth/refresh
{ "refreshToken": "..." }

# Logout
POST /api/v1/auth/logout
{}
```

### Wallet Analytics
```bash
# Summary (cached 60s)
GET /api/v1/wallet/summary
# Returns: totalBalance, income, expenses, topCategories, monthlyTrend

# Cashflow (cached 60s)
GET /api/v1/wallet/cashflow?startDate=2025-01-01&endDate=2025-01-31
# Returns: daily breakdown of income/expenses

# Net Worth History (cached 600s)
GET /api/v1/wallet/networth?months=12
# Returns: monthly net worth snapshots
```

### Transactions
```bash
# Create
POST /api/v1/transactions
{
  "accountId": "...",
  "txnDate": "2025-01-15",
  "amount": 50.00,
  "category": "Food",
  "merchant": "Starbucks"
}

# List (paginated)
GET /api/v1/transactions?page=1&limit=50

# Update
PUT /api/v1/transactions/:id
{ "category": "Coffee", "merchant": "New Merchant" }

# Delete
DELETE /api/v1/transactions/:id

# Import CSV (async)
POST /api/v1/transactions/import
Content-Type: multipart/form-data
file: transactions.csv
# Returns: jobId (check status with polling)
```

### Budgets
```bash
# Create
POST /api/v1/budgets
{
  "name": "Monthly Food Budget",
  "category": "Food",
  "limit": 500.00,
  "period": "MONTHLY"
}

# Simulate (what-if analysis)
POST /api/v1/budgets/simulate
{
  "budgetId": "budget-123",
  "adjustmentPercent": 10  # Increase by 10%
}

# List with progress
GET /api/v1/budgets
# Returns: budget, spent, remaining, progress%
```

### Investments
```bash
# Add holding
POST /api/v1/investments
{
  "symbol": "AAPL",
  "name": "Apple",
  "quantity": 10,
  "avgCost": 150.00,
  "currency": "USD"
}

# List portfolio
GET /api/v1/investments
# Returns: holdings with current price, gains/losses

# Update
PUT /api/v1/investments/:id
{ "quantity": 15, "avgCost": 155.00 }

# Delete
DELETE /api/v1/investments/:id
```

### Gamification
```bash
# Get badges
GET /api/v1/gamification/badges
# Returns: all badges user can earn

# Get earned badges
GET /api/v1/gamification/user-badges
# Returns: badges earned by current user

# List challenges
GET /api/v1/gamification/challenges
# Returns: active challenges with user progress

# Get points
GET /api/v1/gamification/points
# Returns: totalPoints, pointsHistory, leaderboard position
```

### AI Assistant
```bash
# Chat
POST /api/v1/ai/chat
{
  "message": "What's my current balance?",
  "conversationId": "conv-123"  # optional, creates new if omitted
}
# Returns: { reply: "...", actions: [...], conversationId: "..." }

# Get conversation history
GET /api/v1/ai/conversations/:conversationId
# Returns: all messages in conversation

# List conversations
GET /api/v1/ai/conversations?limit=10
# Returns: recent conversations
```

### Files
```bash
# Upload
POST /api/v1/files/upload
Content-Type: multipart/form-data
file: document.pdf
# Returns: { fileId, presignedUrl, expiresIn }

# List
GET /api/v1/files
# Returns: user's files with metadata

# Download (redirect to S3)
GET /api/v1/files/:id/download
# Redirects to presigned S3 URL

# Delete
DELETE /api/v1/files/:id
```

### Notifications
```bash
# Get notifications
GET /api/v1/notifications?limit=20
# Returns: list of notifications

# Mark as read
PUT /api/v1/notifications/:id
{ "read": true }

# Delete
DELETE /api/v1/notifications/:id
```

### Admin (requires role: ADMIN)
```bash
# Ban user
POST /admin/users/:id/ban
# Logs to AuditLog

# Unlock account
POST /admin/users/:id/unlock
# Clears lockout, logs to AuditLog

# Create badge
POST /admin/badges
{
  "name": "Saver",
  "description": "Saved $10,000",
  "icon": "🎯",
  "pointsRequired": 100
}

# Create challenge
POST /admin/challenges
{
  "name": "Weekly Challenge",
  "description": "Spend <$500 this week",
  "type": "SPENDING_LIMIT",
  "target": 500,
  "rewardPoints": 50,
  "durationDays": 7
}

# List audit logs
GET /admin/audit-logs?page=1&limit=100
# Returns: paginated audit trail of all admin actions
```

---

## 🔑 Environment Variables

**Required**:
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/finora
REDIS_URL=redis://localhost:6379
JWT_ACCESS_TOKEN_SECRET=<min 32 chars>
JWT_REFRESH_TOKEN_SECRET=<min 32 chars>
```

**Optional**:
```bash
NODE_ENV=development|production|test
PORT=4000

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=app-password

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
S3_BUCKET=finora-files

# Or use Minio (local S3)
S3_ENDPOINT=http://minio:9000
S3_FAKE_URL=http://localhost:9000

# AI / OpenRouter
OPENROUTER_API_KEY=sk-or-v1-xxx
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=meta-llama/llama-2-70b-chat

# Embeddings
USE_PINECONE=false
PINECONE_API_KEY=xxx
PINECONE_INDEX=finora

# Monitoring
SENTRY_DSN=xxx

# Secrets rotation
SECRET_ROTATION_INTERVAL_DAYS=90
```

---

## 🛠️ Common Commands

```bash
# Development
npm run dev              # Start with ts-node-dev (hot-reload)

# Production
npm run build            # Compile TypeScript
npm start                # Run compiled JavaScript

# Database
npx prisma generate      # Generate Prisma client
npx prisma migrate dev   # Create migration & apply
npx prisma migrate deploy  # Apply existing migrations
npx prisma studio       # GUI for database
npx prisma seed         # Seed initial data

# Testing
npm test                 # Run all tests
npm test -- --watch     # Watch mode
npm test -- --coverage  # With coverage report

# Load Testing
npm run test:baseline   # Sequential endpoint test
npm run test:load       # Ramp up to 50 concurrent users
npm run test:stress     # Gradually increase to 500 users

# Security & Ops
npm run validate:secrets    # Validate env vars
npm run build && npm start  # Build & run
./scripts/secrets.sh rotate-jwt  # Rotate JWT secret
./scripts/backup-db.sh           # Backup database
./scripts/restore-db.sh backup.sql.gz  # Restore

# Code Quality
npm run lint            # ESLint
npm run format          # Prettier
npm run build           # TypeScript check

# Docker
docker-compose up --build    # Start all services
docker-compose down          # Stop all services
docker-compose logs -f       # Stream logs
docker-compose ps            # List running containers
```

---

## 📊 Database Schema Quick Reference

```
User (auth)
├─ Sessions (token storage)
├─ Accounts (checking, savings)
├─ Transactions (financial activity)
├─ Investments (portfolio)
├─ UserBadges (earned achievements)
├─ ChallengeProgress (goal tracking)
├─ PointsTransactions (gamification points)
├─ Files (document storage)
├─ Conversations (chat history)
└─ Messages (chat messages)

Key Tables:
• Users - 100K+ user records
• Transactions - 1M+ transaction records (indexed by userId, date)
• Investments - Holdings for each user
• Badges - 20-50 badge templates
• Challenges - Active challenges
• AiContext - RAG embeddings (pgvector)
• AuditLog - Security events
```

---

## 🔒 Security Checklist

Before deployment:
- [ ] All required secrets set (no defaults)
- [ ] `JWT_ACCESS_TOKEN_SECRET` is 32+ chars
- [ ] HTTPS/TLS enabled
- [ ] Database password strong
- [ ] Redis password set (if exposed)
- [ ] CORS origin restricted
- [ ] Rate limits tuned
- [ ] Backups tested
- [ ] Monitoring configured
- [ ] Audit logging enabled
- [ ] Secrets rotated (90 days)
- [ ] Team trained on security procedures

---

## 🐛 Troubleshooting

### Connection Errors

```bash
# Database not found
Error: Can't reach database server at `postgres:5432`
→ Solution: Check DATABASE_URL, ensure postgres container running

# Redis connection failed
Error: connect ECONNREFUSED 127.0.0.1:6379
→ Solution: Check REDIS_URL, ensure redis container running

# Port already in use
Error: listen EADDRINUSE :::4000
→ Solution: Kill process: lsof -ti:4000 | xargs kill -9
```

### Authentication Issues

```bash
# Token expired
Error: 401 Unauthorized
→ Solution: Refresh token via POST /api/v1/auth/refresh

# Invalid JWT
Error: Invalid token
→ Solution: Check JWT secret matches issuer

# Account locked
Error: AccountLocked
→ Solution: Admin unlock: POST /admin/users/:id/unlock
```

### Performance Issues

```bash
# Slow queries
→ Check indexes: SELECT * FROM pg_stat_user_indexes
→ Monitor with: EXPLAIN ANALYZE <query>
→ Enable query logging: NODE_ENV=debug npm run dev

# Memory leak
→ Monitor with: node --inspect dist/index.js
→ Use Chrome DevTools: chrome://inspect

# Cache miss rate high
→ Increase TTL
→ Add more cache keys
→ Monitor: redis-cli INFO stats
```

---

## 📈 Monitoring Commands

```bash
# Health check
curl http://localhost:4000/health

# Metrics (Prometheus format)
curl http://localhost:4000/metrics | grep http_request_duration

# Database connections
psql -c "SELECT count(*) FROM pg_stat_activity;"

# Redis info
redis-cli INFO stats | grep connected_clients

# Job queue status
redis-cli LLEN "bull:email:pending"
redis-cli LLEN "bull:csv-import:failed"

# Slowest queries
psql -c "SELECT query, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

---

## 📖 Documentation Files

| File | Purpose |
|------|---------|
| `COMPLETE_SYSTEM_GUIDE.md` | 📚 Full system explanation |
| `ARCHITECTURE_DIAGRAMS.md` | 📊 Visual architecture & flows |
| `CI_CD_OPS.md` | 🚀 Operations & CI/CD |
| `PERFORMANCE.md` | ⚡ Performance optimization |
| `SECRETS.md` | 🔐 Secrets management |
| `PHASE_C_SUMMARY.md` | ✅ Ops & Security phases |
| `README.md` | 🚀 Quick start |
| Swagger Docs | 📖 Interactive API docs at `/docs` |

---

## 🎯 Common Workflows

### Adding a New Feature

1. Create Prisma model (if needed)
2. Run migration: `npx prisma migrate dev --name add_feature`
3. Create module in `src/modules/feature/`
4. Implement: routes → controller → service
5. Add DTOs (Zod schemas) for validation
6. Write tests (unit + integration)
7. Register in `src/app.ts`
8. Test: `npm test`
9. Build: `npm run build`
10. Deploy

### Emergency Lockout Recovery

```bash
# User account locked after 5 failed attempts
# Solution 1: Wait 30 minutes (auto-unlocks)
# Solution 2: Admin unlock immediately

# Unlock via API
curl -X POST http://localhost:4000/admin/users/user-id/unlock \
  -H "Authorization: Bearer admin-token"

# Or via database
psql -c "UPDATE \"User\" SET locked_until = NULL WHERE id = 'user-id';"
redis-cli DEL auth:fail:user-id
```

### Restore from Backup

```bash
# List backups
ls -lah backups/

# Restore specific backup
./scripts/restore-db.sh backups/backup_20250115_120000.sql.gz

# Verify restoration
npm run dev
curl http://localhost:4000/health
```

---

## 🚨 Emergency Procedures

### System Down - Recovery Steps

1. **Check services status**
   ```bash
   docker-compose ps
   # If any stopped, restart: docker-compose up -d service-name
   ```

2. **Check database connection**
   ```bash
   psql $DATABASE_URL -c "SELECT 1;"
   ```

3. **Check Redis connection**
   ```bash
   redis-cli ping
   ```

4. **View recent errors**
   ```bash
   docker-compose logs --tail=100 api | grep ERROR
   ```

5. **Rollback to known good state**
   ```bash
   git revert <commit-hash>
   npm run build
   npx prisma migrate deploy
   npm start
   ```

6. **Restore from backup if data corruption**
   ```bash
   ./scripts/restore-db.sh backups/backup_<timestamp>.sql.gz
   ```

---

**For more detailed information, see:**
- Complete System Guide: `COMPLETE_SYSTEM_GUIDE.md`
- Architecture: `ARCHITECTURE_DIAGRAMS.md`
- API Docs: http://localhost:4000/docs

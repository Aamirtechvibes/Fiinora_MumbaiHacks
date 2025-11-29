# Performance & Load Testing Guide

## Quick Start

### Prerequisites

Install k6: https://k6.io/docs/getting-started/installation

```bash
# macOS
brew install k6

# Linux (Ubuntu/Debian)
sudo apt-get install k6

# Windows
choco install k6

# Or from source
https://github.com/grafana/k6/releases
```

### Running Tests Locally

Start your server:
```bash
npm run dev
```

In another terminal, run tests:

```bash
# 1. Baseline test (sequential, single user)
./scripts/run-loadtest.sh baseline

# 2. Load test (ramp up to 50 concurrent users)
./scripts/run-loadtest.sh load

# 3. Stress test (scale from 100 to 500 users)
./scripts/run-loadtest.sh stress

# 4. Spike test (sudden jump to 200 concurrent users)
./scripts/run-loadtest.sh spike
```

### With Authentication

If you need to test authenticated endpoints, pass an auth token:

```bash
AUTH_TOKEN="your-jwt-token" BASE_URL="http://localhost:3000" ./scripts/run-loadtest.sh load
```

## Performance Targets

| Endpoint | Target P95 | Target P99 | Error Rate |
|----------|-----------|-----------|-----------|
| Health check | 50ms | 100ms | <1% |
| Auth (register) | 200ms | 500ms | <2% |
| Wallet summary | 100ms | 200ms | <1% |
| Transactions list | 150ms | 300ms | <1% |
| AI Chat | 2000ms | 5000ms | <5% |
| Admin endpoints | 200ms | 500ms | <1% |

## Key Performance Optimizations

### 1. Database Query Optimization

**Current state**: Queries use Prisma ORM with full object hydration.

**Optimizations applied/recommended**:

- ✅ **Wallet caching**: Summary endpoint caches results in Redis (30s TTL)
- ✅ **Pagination**: Transaction/investment lists use offset-limit pagination
- ⚠️ **N+1 query prevention**: Use Prisma `include()` and `select()` to minimize queries
  ```typescript
  // ❌ Slow: N queries
  const users = await prisma.user.findMany();
  for (const user of users) {
    const transactions = await prisma.transaction.findMany({ where: { userId: user.id } });
  }

  // ✅ Fast: 1 query
  const users = await prisma.user.findMany({
    include: { transactions: true }
  });
  ```

- ⚠️ **Indexes**: Ensure DB indexes on frequently queried fields:
  ```sql
  CREATE INDEX idx_transaction_user_date ON "Transaction"(user_id, txn_date DESC);
  CREATE INDEX idx_user_email ON "User"(email);
  CREATE INDEX idx_ai_context_user ON "AiContext"(user_id);
  ```

### 2. Caching Strategy

**Current**: Redis cache on wallet summary (30s)

**Recommended additions**:

```typescript
// Cache frequently accessed data
const CACHE_KEYS = {
  WALLET_SUMMARY: (userId) => `wallet:${userId}:summary`, // 30s TTL
  BADGES: 'badges:all', // 1h TTL (infrequently updated)
  CHALLENGES: 'challenges:all', // 1h TTL
  USER_PROFILE: (userId) => `user:${userId}:profile`, // 5m TTL
  INVESTMENTS: (userId) => `inv:${userId}:all`, // 10m TTL
};
```

- Cache computed/expensive values (e.g., networth calculations)
- Invalidate cache on data mutations (create/update/delete)
- Set sensible TTLs based on update frequency

### 3. API Response Optimization

**Recommended**:

- ✅ Pagination on list endpoints (limit max 1000 items)
- ⚠️ **Field selection**: Return only needed fields:
  ```typescript
  // ❌ Bloated response (all fields)
  await prisma.transaction.findMany();

  // ✅ Lean response (only needed fields)
  await prisma.transaction.findMany({
    select: { id: true, amount: true, category: true, date: true }
  });
  ```

- ⚠️ **Compression**: Enable gzip/brotli (Fastify helmet already includes this)
- ⚠️ **Lazy loading**: For nested data, use separate endpoints rather than deep nesting

### 4. Background Job Optimization

**Current**: BullMQ for email, CSV imports, price updates, gamification

**Recommendations**:

- Use job retries with exponential backoff
- Set sensible concurrency limits per queue (currently: 1 worker per queue)
- Monitor queue depth and adjust worker count if needed
- Archive completed/failed jobs after 24 hours

```typescript
// Example: limit email queue to 5 concurrent jobs
const emailQueue = new Queue('email', { connection: redis });
const emailWorker = new Worker('email', handler, {
  connection: redis,
  concurrency: 5,
});
```

### 5. Locking & Concurrency

**Risk**: Multiple requests updating same user wallet simultaneously

**Mitigation**:

```typescript
// Use Redis distributed lock
const lockKey = `wallet:lock:${userId}`;
const locked = await redis.set(lockKey, '1', 'EX', 5, 'NX');
if (!locked) throw new Error('Wallet locked, try again');
try {
  // Update wallet
} finally {
  await redis.del(lockKey);
}
```

### 6. AI/LLM Optimization

**Current**: Direct OpenRouter calls (blocking)

**Recommendations**:

- Cache embeddings (currently done via pgvector)
- Implement response streaming for long-running AI queries
- Add timeout (currently: none specified)
- Use streaming responses for chat (reduces memory usage)

```typescript
// Stream response back to client
reply.raw.setHeader('Content-Type', 'text/event-stream');
reply.raw.setHeader('Cache-Control', 'no-cache');

// Send chunks as they arrive
const stream = await openrouter.chat(message);
stream.on('data', (chunk) => {
  reply.raw.write(`data: ${JSON.stringify({ chunk })}\n\n`);
});
```

### 7. Rate Limiting Effectiveness

**Current**: 20 requests/hour per user for AI endpoint via Redis

**Check rate limiter impact**:
```bash
redis-cli INFO stats | grep total_commands_processed
```

**Recommendations**:
- Monitor rate limiter overhead
- Consider sliding window vs fixed window algorithms
- Implement per-IP rate limiting for public endpoints

### 8. Monitoring & Observability

**Current**: Prometheus metrics exposed at `/metrics`

**Recommendations**:

Add custom metrics:
```typescript
const httpDuration = new Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [50, 100, 200, 500, 1000, 2000, 5000],
});

// In request handler
const start = Date.now();
// ... handle request
httpDuration.labels(method, route, statusCode).observe(Date.now() - start);
```

**Monitor these metrics**:
- Request latency (p50, p95, p99)
- Error rates by endpoint
- Queue depth
- Cache hit rates
- Database connection pool usage

## Load Test Interpretation

### Example Baseline Results
```
✓ status is 200
✓ response time < 100ms

     http_req_failed ........: 0%      ✓
     http_req_duration ......: avg=150ms, p(95)=180ms, p(99)=220ms
     vus ...................: 1       ✓
     vus_max ...............: 1       ✓
```

**Interpretation**:
- ✅ All requests succeeded
- ✅ P95 latency is 180ms (acceptable)
- ✅ P99 latency is 220ms (within threshold)
- Healthy baseline

### Example Load Test Results
```
     http_req_failed ........: 0.5%
     http_req_duration ......: avg=450ms, p(95)=900ms, p(99)=1500ms
```

**Issues to investigate**:
- ⚠️ P95 is 900ms (above 300ms target)
- ⚠️ 0.5% failures → check error logs
- 📊 Likely bottleneck: database queries or cache misses

### Stress Test Failures

If stress test shows failures at 200-300 concurrent users:
- Database connection pool exhausted (increase in Prisma config)
- Redis connection issues (check Redis memory)
- CPU throttling (scale horizontally)

## Profiling & Debugging

### Enable Fastify request logging

```bash
DEBUG=fastify:* npm run dev
```

### Monitor database queries

```typescript
// Log slow queries
prisma.$on('query', (e) => {
  if (e.duration > 100) {
    console.warn(`Slow query (${e.duration}ms): ${e.query}`);
  }
});
```

### Check Redis memory usage

```bash
redis-cli INFO memory | grep used_memory_human
redis-cli --bigkeys  # Find large keys
```

### Node.js profiling

```bash
node --prof dist/index.js
# Run load test...
node --prof-process isolate-*.log > profile.txt
```

## CI Integration

The GitHub Actions workflow runs baseline tests on each PR:

```yaml
- name: Run baseline performance test
  run: npm run test:baseline
```

If baseline test fails (thresholds exceeded), PR is blocked.

## Further Reading

- [k6 Documentation](https://k6.io/docs)
- [Fastify Performance](https://www.fastify.io/docs/latest/Guides/Recommendations)
- [Prisma Performance](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Redis Best Practices](https://redis.io/docs/management/optimization)

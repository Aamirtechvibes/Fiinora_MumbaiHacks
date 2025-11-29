# Secrets Management & Key Rotation Guide

## Overview

This guide covers secure handling of secrets, API keys, and sensitive credentials in the Finora backend.

## Core Principles

1. **Never commit secrets** to version control
2. **Rotate secrets regularly** (90 days recommended)
3. **Use short-lived tokens** where possible (JWT: 15 min, Refresh: 7 days)
4. **Audit all secret access** for compliance
5. **Encrypt secrets at rest** and in transit
6. **Use environment variables** in development, secret vaults in production

## Environment Variables Setup

### Required Secrets

Create a `.env` file in the project root (never commit this):

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/finora

# Redis
REDIS_URL=redis://localhost:6379

# JWT Tokens (generate with: openssl rand -base64 32)
JWT_ACCESS_TOKEN_SECRET=your-long-random-secret-here-min-32-chars
JWT_REFRESH_TOKEN_SECRET=another-long-random-secret-here-min-32-chars

# OpenRouter (AI)
OPENROUTER_API_KEY=sk-or-v1-xxxxx
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=meta-llama/llama-2-70b-chat

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# Optional: Pinecone for vector store
USE_PINECONE=false
PINECONE_API_KEY=your-pinecone-key
PINECONE_INDEX=finora-index

# Node environment
NODE_ENV=development
PORT=3000
```

### Generate Strong Secrets

```bash
# Generate JWT secret
openssl rand -base64 32

# Generate API key
openssl rand -hex 32

# Generate password
openssl rand -base64 16
```

## JWT Token Management

### Token Lifetime Strategy

```
Access Token:  15 minutes  (short-lived, frequent refresh)
Refresh Token: 7 days      (long-lived, for generating new access tokens)
JWT Rotation:  90 days     (when access tokens use new secret)
```

### JWT Rotation Process

JWT rotation is **safe** because the system accepts tokens signed with previous secret versions for a grace period.

```bash
# Step 1: Generate new secret
openssl rand -base64 32

# Step 2: Update environment variable
JWT_ACCESS_TOKEN_SECRET=<new-secret>

# Step 3: Restart application
# Old tokens remain valid for 7 days (grace period)

# Step 4: Monitor logs for successful authentications
docker logs -f finora-backend | grep "auth"

# Step 5: After 7 days, old secret is completely invalid
# Update documentation and monitoring
```

Timeline:
- **Day 0**: Deploy new secret, old tokens still valid
- **Day 1-7**: Both old and new secrets accepted (grace period)
- **Day 7+**: Only new secret accepted, old tokens rejected

## API Key Rotation

### OpenRouter (AI)

```bash
# Step 1: Generate new API key in OpenRouter dashboard
# https://openrouter.ai/keys

# Step 2: Update in environment
OPENROUTER_API_KEY=sk-or-v1-<new-key>

# Step 3: Deploy
./scripts/deploy.sh

# Step 4: Monitor for errors
# Check logs: /var/log/finora/error.log

# Step 5: Revoke old key after 48 hours
# Go back to OpenRouter dashboard and delete old key
```

### AWS S3

```bash
# Step 1: Create new access key in AWS IAM
# https://console.aws.amazon.com/iam/home

# Step 2: Store new credentials temporarily
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=wJal...

# Step 3: Update in secret manager (not .env)
# AWS Secrets Manager, HashiCorp Vault, etc.

# Step 4: Rotate in application config
docker-compose up -d  # Redeploy with new env vars

# Step 5: Verify S3 operations work
npm run test:s3

# Step 6: Deactivate old key
aws iam update-access-key --access-key-id AKIA... --status Inactive
```

### Database Credentials

```bash
# PostgreSQL password rotation
# Step 1: Create new user in PostgreSQL
ALTER USER postgres WITH PASSWORD 'new-password';

# Step 2: Update DATABASE_URL
DATABASE_URL=postgresql://postgres:new-password@localhost:5432/finora

# Step 3: Verify connection
npx prisma validate

# Step 4: Deploy new config
# Step 5: Remove old user (after 24 hours of monitoring)
DROP USER old_user;
```

## Local Development Setup

### Using .env.local

```bash
# Create local override file (ignored by git)
cp .env.example .env.local

# Edit with your local secrets
nano .env.local

# Load in development
source .env.local
npm run dev
```

### Using direnv (recommended)

```bash
# Install direnv
brew install direnv  # macOS
sudo apt-get install direnv  # Linux

# Create .envrc (also ignored by git)
echo "export $(cat .env.local | xargs)" > .envrc
direnv allow .envrc

# Now all env vars auto-loaded when entering directory
cd /path/to/backend
# ✓ Secrets loaded automatically
```

## Production Secret Management

### Option 1: AWS Secrets Manager

```typescript
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({ region: "us-east-1" });

async function getSecret(secretName: string) {
  const command = new GetSecretValueCommand({ SecretId: secretName });
  const response = await client.send(command);
  return response.SecretString;
}

// Usage
const dbPassword = await getSecret("finora/db-password");
```

### Option 2: HashiCorp Vault

```typescript
import vault from 'node-vault';

const client = vault({
  endpoint: 'https://vault.example.com',
  token: process.env.VAULT_TOKEN,
});

async function getSecret(path: string) {
  const response = await client.read(`secret/data/${path}`);
  return response.data.data;
}

// Usage
const secrets = await getSecret('finora/production');
const { db_password, api_keys } = secrets;
```

### Option 3: Kubernetes Secrets

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: finora-secrets
type: Opaque
stringData:
  DATABASE_URL: postgresql://user:pass@postgres:5432/finora
  JWT_ACCESS_TOKEN_SECRET: your-secret-here
  OPENROUTER_API_KEY: sk-or-v1-xxxxx
```

```typescript
// Load in application
const dbUrl = process.env.DATABASE_URL;
const jwtSecret = process.env.JWT_ACCESS_TOKEN_SECRET;
```

## Secrets Validation

### On Application Startup

```bash
npm run validate:secrets
```

This verifies:
- ✓ All required secrets are set
- ✓ No placeholder values remain
- ✓ Secrets meet minimum length requirements
- ✓ Database URL not localhost in production
- ✓ API keys in correct format

### Manual Validation

```bash
./scripts/secrets.sh validate
```

## Backup & Recovery

### Backup Secrets

```bash
# Backup encrypted (use strong passphrase)
./scripts/secrets.sh backup
# Creates: secrets-backup-2025-01-15-120000.tar.gz

# Store in secure location (e.g., encrypted USB, secure vault)
```

### Restore Secrets

```bash
# Restore from backup
./scripts/secrets.sh restore secrets-backup-2025-01-15-120000.tar.gz

# Verify restoration
./scripts/secrets.sh validate
```

## Audit Logging

### Track Secret Access

All secret access is logged to `.secrets/audit.log`:

```json
{
  "timestamp": "2025-01-15T12:30:45.123Z",
  "action": "access",
  "secretName": "JWT_ACCESS_TOKEN_SECRET",
  "actor": "auth-service",
  "details": {}
}
```

### View Audit Log

```bash
./scripts/secrets.sh audit-log
```

### Rotate Secrets

```bash
./scripts/secrets.sh rotate-jwt
./scripts/secrets.sh rotate-api-key openrouter
```

## CI/CD Integration

### GitHub Actions Secrets

```yaml
# .github/workflows/deploy.yml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  JWT_ACCESS_TOKEN_SECRET: ${{ secrets.JWT_ACCESS_TOKEN_SECRET }}
  OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
```

Add secrets in GitHub:
1. Go to **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Add each secret as key-value pair

### Environment-Specific Secrets

```yaml
# Production
ENVIRONMENT=production
DATABASE_URL=postgresql://prod-user:strong-password@prod-db.aws.com:5432/finora_prod
JWT_ACCESS_TOKEN_SECRET=<prod-secret>

# Staging
ENVIRONMENT=staging
DATABASE_URL=postgresql://staging-user:staging-password@staging-db.aws.com:5432/finora_staging
JWT_ACCESS_TOKEN_SECRET=<staging-secret>
```

## Security Checklist

- [ ] All required secrets are set (no placeholders)
- [ ] `.env` file is in `.gitignore`
- [ ] `.secrets/` directory is in `.gitignore`
- [ ] Secrets are at least 32 characters long
- [ ] No secrets in logs or error messages
- [ ] Database URL uses strong password (20+ chars)
- [ ] API keys are read-only where possible
- [ ] Rotation schedule established (90 days)
- [ ] Audit logging enabled
- [ ] Backup procedure tested
- [ ] Team trained on secret handling
- [ ] Production secrets use vault/manager (not .env)

## Troubleshooting

### Secret Validation Fails

```
Error: JWT_ACCESS_TOKEN_SECRET must be at least 32 characters long
```

Solution: Generate new secret with `openssl rand -base64 32`

### Tokens Stop Working After Rotation

Old tokens are accepted for 7 days. If tokens are rejected immediately:
1. Verify new secret is correctly set
2. Clear Redis cache: `redis-cli FLUSHALL`
3. Restart application

### Can't Access Secrets in Production

1. Verify deployment uses correct secret manager
2. Check IAM permissions (AWS/GCP)
3. Verify network access to vault
4. Check service account credentials

## References

- [JWT Best Practices](https://tools.ietf.org/html/rfc8949)
- [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/)
- [HashiCorp Vault](https://www.vaultproject.io/docs)
- [Kubernetes Secrets](https://kubernetes.io/docs/concepts/configuration/secret/)

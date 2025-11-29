"use strict";
/**
 * Secrets management utilities
 * Handles secure secret rotation, validation, and environment-based secret management
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecretsAuditLogger = exports.SecureEnv = exports.ApiKeyRotation = exports.SecretsValidator = exports.JwtSecretRotation = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * JWT Secret Rotation Manager
 * Manages multiple JWT secret versions to prevent token invalidation during rotation
 */
class JwtSecretRotation {
    constructor(storageDir = '.secrets') {
        this.activeSecrets = new Map();
        this.secretsFile = path_1.default.join(storageDir, 'jwt-secrets.json');
        this.ensureStorageDir(storageDir);
        this.loadSecrets();
    }
    ensureStorageDir(dir) {
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true, mode: 0o700 }); // Only owner can read
        }
    }
    /**
     * Get current active secret for signing new tokens
     */
    getActiveSecret() {
        const active = Array.from(this.activeSecrets.values())
            .filter(s => !s.expiresAt || s.expiresAt > new Date())
            .sort((a, b) => b.rotatedAt.getTime() - a.rotatedAt.getTime())[0];
        if (!active) {
            throw new Error('No active JWT secret found. Initialize secrets first.');
        }
        return active.value;
    }
    /**
     * Get all valid secrets for verification
     * Includes current and recently rotated secrets
     */
    getVerificationSecrets() {
        const now = new Date();
        const gracePeriodDays = 7; // Accept tokens signed with secrets from last 7 days
        const gracePeriodMs = gracePeriodDays * 24 * 60 * 60 * 1000;
        return Array.from(this.activeSecrets.values())
            .filter(s => {
            const age = now.getTime() - s.rotatedAt.getTime();
            return age <= gracePeriodMs;
        })
            .map(s => s.value);
    }
    /**
     * Rotate JWT secret
     * Keeps previous versions for grace period
     */
    async rotateSecret(newSecret) {
        const config = {
            name: 'jwt',
            value: newSecret,
            rotatedAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in 7 days
            version: (this.activeSecrets.size || 0) + 1,
        };
        this.activeSecrets.set(`v${config.version}`, config);
        await this.persistSecrets();
        console.log(`✓ JWT secret rotated. Version: ${config.version}, Expires: ${config.expiresAt}`);
    }
    /**
     * Initialize first secret (should be done once at setup)
     */
    async initializeSecret(secret) {
        if (this.activeSecrets.size > 0) {
            throw new Error('Secrets already initialized');
        }
        await this.rotateSecret(secret);
    }
    async persistSecrets() {
        const data = Array.from(this.activeSecrets.entries()).map(([key, value]) => ({
            ...value,
            rotatedAt: value.rotatedAt.toISOString(),
            expiresAt: value.expiresAt?.toISOString(),
        }));
        fs_1.default.writeFileSync(this.secretsFile, JSON.stringify(data, null, 2), { mode: 0o600 });
    }
    loadSecrets() {
        if (!fs_1.default.existsSync(this.secretsFile)) {
            return;
        }
        try {
            const data = JSON.parse(fs_1.default.readFileSync(this.secretsFile, 'utf-8'));
            data.forEach((item) => {
                this.activeSecrets.set(`v${item.version}`, {
                    ...item,
                    rotatedAt: new Date(item.rotatedAt),
                    expiresAt: item.expiresAt ? new Date(item.expiresAt) : undefined,
                });
            });
        }
        catch (err) {
            console.warn('Warning: Could not load existing JWT secrets');
        }
    }
}
exports.JwtSecretRotation = JwtSecretRotation;
/**
 * Environment secret validator
 * Ensures all required secrets are set and valid
 */
class SecretsValidator {
    constructor(required = [], optional = []) {
        this.requiredSecrets = required;
        this.optionalSecrets = optional;
    }
    /**
     * Validate all required secrets are present
     */
    validate() {
        const errors = [];
        const warnings = [];
        // Check required secrets
        for (const secret of this.requiredSecrets) {
            if (!process.env[secret]) {
                errors.push(`Missing required secret: ${secret}`);
            }
        }
        // Check optional secrets
        for (const secret of this.optionalSecrets) {
            if (!process.env[secret]) {
                warnings.push(`Missing optional secret: ${secret}`);
            }
        }
        // Validate JWT secret is not default/weak
        if (process.env.JWT_ACCESS_TOKEN_SECRET?.length ?? 0 < 32) {
            errors.push('JWT_ACCESS_TOKEN_SECRET must be at least 32 characters long');
        }
        // Validate database URL is not localhost in production
        if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL?.includes('localhost')) {
            errors.push('DATABASE_URL cannot be localhost in production');
        }
        // Validate API keys are not placeholder values
        if (process.env.OPENROUTER_API_KEY === 'sk-or-v1-xxx') {
            errors.push('OPENROUTER_API_KEY is a placeholder. Set real value.');
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings,
        };
    }
}
exports.SecretsValidator = SecretsValidator;
/**
 * API Key rotation manager
 * Manages multiple API key versions (e.g., OpenRouter, S3)
 */
class ApiKeyRotation {
    constructor(policy = {
        rotationIntervalDays: 90,
        retainVersions: 3,
        notifyBeforeDays: 7,
    }) {
        this.keyVersions = new Map();
        this.rotationPolicy = policy;
    }
    /**
     * Add API key version
     */
    addKeyVersion(keyName, key) {
        const versions = this.keyVersions.get(keyName) || [];
        versions.unshift(key); // Add to front
        // Keep only N versions
        if (versions.length > this.rotationPolicy.retainVersions) {
            versions.pop();
        }
        this.keyVersions.set(keyName, versions);
    }
    /**
     * Get current active key
     */
    getActiveKey(keyName) {
        const versions = this.keyVersions.get(keyName);
        return versions?.[0];
    }
    /**
     * Validate API key against all known versions
     * Useful for validating incoming requests
     */
    isValidKey(keyName, key) {
        const versions = this.keyVersions.get(keyName) || [];
        return versions.includes(key);
    }
    /**
     * Get rotation policy
     */
    getPolicy() {
        return this.rotationPolicy;
    }
}
exports.ApiKeyRotation = ApiKeyRotation;
/**
 * Secure environment loader
 * Loads environment variables with validation and type coercion
 */
class SecureEnv {
    static getString(key, defaultValue) {
        const value = process.env[key];
        if (!value && defaultValue === undefined) {
            throw new Error(`Environment variable ${key} is required`);
        }
        return value ?? defaultValue ?? '';
    }
    static getNumber(key, defaultValue) {
        const value = process.env[key];
        if (!value) {
            if (defaultValue === undefined) {
                throw new Error(`Environment variable ${key} is required`);
            }
            return defaultValue;
        }
        const num = parseInt(value, 10);
        if (isNaN(num)) {
            throw new Error(`Environment variable ${key} must be a number, got: ${value}`);
        }
        return num;
    }
    static getBoolean(key, defaultValue = false) {
        const value = process.env[key];
        if (!value)
            return defaultValue;
        return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
    }
    static getList(key, separator = ',') {
        const value = process.env[key];
        if (!value)
            return [];
        return value.split(separator).map(v => v.trim());
    }
}
exports.SecureEnv = SecureEnv;
/**
 * Secrets audit logger
 * Logs secrets access for security audit trail
 */
class SecretsAuditLogger {
    constructor(logFile = '.secrets/audit.log') {
        this.logFile = logFile;
    }
    log(action, secretName, actor, details) {
        const entry = {
            timestamp: new Date().toISOString(),
            action,
            secretName,
            actor,
            details,
        };
        const logEntry = JSON.stringify(entry) + '\n';
        fs_1.default.appendFileSync(this.logFile, logEntry);
    }
    // Log secret access
    logAccess(secretName, actor = 'system') {
        this.log('access', secretName, actor);
    }
    // Log secret rotation
    logRotation(secretName, version, actor = 'system') {
        this.log('rotation', secretName, actor, { version });
    }
    // Log failed secret validation
    logValidationFailure(secretName, actor = 'system') {
        this.log('validation_failure', secretName, actor);
    }
}
exports.SecretsAuditLogger = SecretsAuditLogger;

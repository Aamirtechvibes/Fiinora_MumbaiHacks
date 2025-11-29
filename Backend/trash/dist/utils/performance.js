"use strict";
/**
 * Performance optimization utilities
 * Use these helpers to implement common optimization patterns
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.withCache = withCache;
exports.withLock = withLock;
exports.optimizeSelect = optimizeSelect;
exports.getPagination = getPagination;
exports.logSlowQuery = logSlowQuery;
exports.batchFind = batchFind;
exports.invalidateCache = invalidateCache;
exports.compressibleResponse = compressibleResponse;
exports.measurePerformance = measurePerformance;
/**
 * Cache decorator for expensive operations
 * @param key Cache key in Redis
 * @param ttl Time to live in seconds
 */
function withCache(key, ttl = 300) {
    return async (fn, fastify) => {
        // Try to get from cache
        const cached = await fastify.redis?.get(key);
        if (cached) {
            return JSON.parse(cached);
        }
        // Execute function
        const result = await fn();
        // Store in cache
        if (result !== null && result !== undefined) {
            await fastify.redis?.setex(key, ttl, JSON.stringify(result));
        }
        return result;
    };
}
/**
 * Distributed lock for concurrent operations
 * Prevents race conditions on shared resources
 */
async function withLock(lockKey, fn, fastify, lockDuration = 5) {
    const locked = await fastify.redis?.set(lockKey, '1', 'EX', lockDuration, 'NX');
    if (!locked) {
        throw new Error('Resource is locked. Please try again.');
    }
    try {
        return await fn();
    }
    finally {
        await fastify.redis?.del(lockKey);
    }
}
/**
 * Query optimizer: Select only needed fields
 * Usage: optimizeSelect('User', ['id', 'email', 'name'])
 */
function optimizeSelect(model, fields) {
    return fields.reduce((acc, field) => {
        acc[field] = true;
        return acc;
    }, {});
}
/**
 * Pagination helper
 * Returns offset and limit from page number
 */
function getPagination(page = 1, limit = 50) {
    const maxLimit = 1000;
    const safeLimit = Math.min(Math.max(1, limit), maxLimit);
    const offset = Math.max(0, (page - 1) * safeLimit);
    return { offset, limit: safeLimit };
}
/**
 * Query complexity analyzer
 * Logs slow queries for debugging
 */
function logSlowQuery(query, duration, threshold = 100) {
    if (duration > threshold) {
        console.warn(`⚠️ Slow query (${duration}ms, threshold: ${threshold}ms):\n${query}`);
    }
}
/**
 * Batch operation handler
 * Prevents N+1 queries by batching similar operations
 */
async function batchFind(ids, findFn, mapper) {
    if (ids.length === 0)
        return {};
    const results = await findFn(ids);
    return mapper(results);
}
/**
 * Cache invalidation helper
 * Clears related cache keys when data changes
 */
async function invalidateCache(patterns, fastify) {
    for (const pattern of patterns) {
        const keys = await fastify.redis?.keys(pattern);
        if (keys && keys.length > 0) {
            await fastify.redis?.del(...keys);
        }
    }
}
/**
 * Response compression hint
 * Returns response with compression-friendly structure
 */
function compressibleResponse(data, meta) {
    return {
        data,
        meta: meta || {},
        timestamp: new Date().toISOString(),
    };
}
/**
 * Monitor function execution time
 * Useful for identifying performance regressions
 */
async function measurePerformance(name, fn) {
    const start = Date.now();
    try {
        return await fn();
    }
    finally {
        const duration = Date.now() - start;
        console.log(`⏱️ ${name}: ${duration}ms`);
    }
}

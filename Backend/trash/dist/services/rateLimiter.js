"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.incrAndCheck = incrAndCheck;
async function incrAndCheck(fastify, key, limit, windowSec) {
    // returns { count, exceeded }
    const redis = fastify.redis;
    if (!redis)
        throw new Error('Redis not available');
    const count = await redis.incr(key);
    if (count === 1)
        await redis.expire(key, windowSec);
    return { count: Number(count), exceeded: Number(count) > limit };
}
exports.default = { incrAndCheck };

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = adminRoutes;
const rbac_1 = __importDefault(require("../../utils/rbac"));
async function adminRoutes(fastify) {
    // Ban a user (ADMIN only)
    fastify.post('/users/:id/ban', { onRequest: rbac_1.default }, async (request, reply) => {
        try {
            const { id } = request.params;
            const actorId = request.userId;
            const user = await fastify.prisma.user.update({ where: { id }, data: { banned: true } }).catch((e) => { throw e; });
            // log audit
            await fastify.prisma.$executeRawUnsafe(`INSERT INTO "AuditLog" (id, actor_id, action, target_id, metadata, created_at) VALUES (gen_random_uuid(), $1::uuid, 'user.ban', $2::uuid, $3::jsonb, now())`.replace('$1', `'${actorId}'`).replace('$2', `'${id}'`).replace('$3', `'{}'`));
            return reply.send({ ok: true, userId: id });
        }
        catch (err) {
            fastify.log.error(err);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
    // Get audit logs (paginated)
    fastify.get('/audit-logs', { onRequest: rbac_1.default }, async (request, reply) => {
        try {
            const page = Number(request.query.page || 1);
            const limit = Math.min(Number(request.query.limit || 100), 1000);
            const offset = (page - 1) * limit;
            const rows = await fastify.prisma.$queryRawUnsafe(`SELECT id, actor_id as "actorId", action, target_id as "targetId", metadata, created_at as "createdAt" FROM "AuditLog" ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`);
            return reply.send({ items: rows, pagination: { page, limit } });
        }
        catch (err) {
            fastify.log.error(err);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
    // Create Badge (ADMIN only)
    fastify.post('/badges', { onRequest: rbac_1.default }, async (request, reply) => {
        try {
            const { name, description, icon, pointsRequired } = request.body;
            const b = await fastify.prisma.badge.create({ data: { name, description, icon, pointsRequired: pointsRequired || 0 } });
            await fastify.prisma.$executeRawUnsafe(`INSERT INTO "AuditLog" (id, actor_id, action, target_id, metadata, created_at) VALUES (gen_random_uuid(), $1::uuid, 'badge.create', NULL, $2::jsonb, now())`.replace('$1', `'${request.userId}'`).replace('$2', `'${JSON.stringify({ badge: b.name })}'`));
            return reply.status(201).send(b);
        }
        catch (err) {
            fastify.log.error(err);
            return reply.status(400).send({ error: 'Bad Request' });
        }
    });
    // Create Challenge (ADMIN only)
    fastify.post('/challenges', { onRequest: rbac_1.default }, async (request, reply) => {
        try {
            const { name, description, type, target, rewardPoints, durationDays } = request.body;
            const c = await fastify.prisma.challenge.create({ data: { name, description, type, target: Number(target || 0), rewardPoints: Number(rewardPoints || 10), durationDays: Number(durationDays || 7) } });
            await fastify.prisma.$executeRawUnsafe(`INSERT INTO "AuditLog" (id, actor_id, action, target_id, metadata, created_at) VALUES (gen_random_uuid(), $1::uuid, 'challenge.create', NULL, $2::jsonb, now())`.replace('$1', `'${request.userId}'`).replace('$2', `'${JSON.stringify({ challenge: c.name })}'`));
            return reply.status(201).send(c);
        }
        catch (err) {
            fastify.log.error(err);
            return reply.status(400).send({ error: 'Bad Request' });
        }
    });
    // Unlock a user (ADMIN only) — clear lockout after failed login attempts
    fastify.post('/users/:id/unlock', { onRequest: rbac_1.default }, async (request, reply) => {
        try {
            const { id } = request.params;
            const actorId = request.userId;
            const user = await fastify.prisma.user.update({ where: { id }, data: { lockedUntil: null } }).catch((e) => { throw e; });
            // Clear failure counter from Redis
            const redisKey = `auth:fail:${id}`;
            await fastify.redis.del(redisKey);
            // Log audit
            await fastify.prisma.$executeRawUnsafe(`INSERT INTO "AuditLog" (id, actor_id, action, target_id, metadata, created_at) VALUES (gen_random_uuid(), $1::uuid, 'user.unlock', $2::uuid, $3::jsonb, now())`.replace('$1', `'${actorId}'`).replace('$2', `'${id}'`).replace('$3', `'{}'`));
            return reply.send({ ok: true, userId: id, message: 'User unlocked' });
        }
        catch (err) {
            fastify.log.error(err);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}

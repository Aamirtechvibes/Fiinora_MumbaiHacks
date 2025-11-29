"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const gamification_service_1 = __importDefault(require("./gamification.service"));
const dto_1 = require("./dto");
async function gamificationRoutes(fastify) {
    const gamificationService = new gamification_service_1.default(fastify);
    // Auth middleware
    const authMiddleware = async (request, reply) => {
        const auth = request.headers['authorization'];
        if (!auth?.startsWith('Bearer ')) {
            return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
        }
        const token = auth.split(' ')[1];
        try {
            const payload = require('jsonwebtoken').verify(token, process.env.JWT_ACCESS_TOKEN_SECRET || 'dev_access_secret');
            request.userId = payload.sub;
        }
        catch (e) {
            return reply.status(401).send({ error: 'Invalid token', code: 'INVALID_TOKEN' });
        }
    };
    // GET /badges - list all badges
    fastify.get('/badges', {
        schema: {
            querystring: { type: 'object', properties: { page: { type: 'number' }, limit: { type: 'number' } } },
            summary: 'Get all badges',
        },
    }, async (request, reply) => {
        try {
            const query = dto_1.getBadgeSchema.parse(request.query);
            const result = await gamificationService.getBadges(query.page, query.limit);
            return reply.send(result);
        }
        catch (error) {
            if (error.issues) {
                return reply.status(400).send({ error: 'Validation failed', code: 'VALIDATION_ERROR', details: error.issues });
            }
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
        }
    });
    // GET /me - user's gamification profile
    fastify.get('/me', { onRequest: authMiddleware, schema: { summary: 'Get user gamification profile' } }, async (request, reply) => {
        try {
            const profile = await gamificationService.getUserProfile(request.userId);
            return reply.send(profile);
        }
        catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
        }
    });
    // GET /leaderboard - weekly (or specified scope) leaderboard
    fastify.get('/leaderboard', {
        schema: {
            querystring: { type: 'object', properties: { scope: { type: 'string' }, limit: { type: 'number' } } },
            summary: 'Get leaderboard',
        },
    }, async (request, reply) => {
        try {
            const query = dto_1.getLeaderboardSchema.parse(request.query);
            // For now, only implement weekly; other scopes can be added later
            if (query.scope !== 'weekly') {
                return reply.status(501).send({ error: 'Scope not yet implemented', code: 'NOT_IMPLEMENTED' });
            }
            const leaderboard = await gamificationService.getWeeklyLeaderboard(query.limit);
            return reply.send({ leaderboard, scope: query.scope });
        }
        catch (error) {
            if (error.issues) {
                return reply.status(400).send({ error: 'Validation failed', code: 'VALIDATION_ERROR', details: error.issues });
            }
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
        }
    });
}
exports.default = gamificationRoutes;

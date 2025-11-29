"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = aiRoutes;
const ai_service_1 = __importDefault(require("./ai.service"));
const dto_1 = require("./dto");
async function aiRoutes(fastify) {
    const service = new ai_service_1.default(fastify);
    const auth = async (request, reply) => {
        const header = request.headers['authorization'];
        if (!header?.startsWith('Bearer '))
            return reply.status(401).send({ error: 'Unauthorized' });
        try {
            const payload = require('jsonwebtoken').verify(header.split(' ')[1], process.env.JWT_ACCESS_TOKEN_SECRET || 'dev_access_secret');
            request.userId = payload.sub;
        }
        catch (e) {
            return reply.status(401).send({ error: 'Invalid token' });
        }
    };
    const rateLimit = async (request, reply) => {
        // 20 requests per hour per user
        const userId = request.userId;
        if (!userId)
            return reply.status(401).send({ error: 'Unauthorized' });
        const { incrAndCheck } = await Promise.resolve().then(() => __importStar(require('../../services/rateLimiter')));
        const { exceeded } = await incrAndCheck(fastify, `ratelimit:ai:${userId}`, 20, 60 * 60);
        if (exceeded)
            return reply.status(429).send({ error: 'Rate limit exceeded' });
    };
    fastify.post('/chat', { onRequest: [auth, rateLimit] }, async (request, reply) => {
        try {
            const body = dto_1.chatRequestSchema.parse(request.body);
            const res = await service.chat(request.userId, body.conversationId, body.message);
            return reply.send(res);
        }
        catch (err) {
            fastify.log.error(err);
            return reply.status(400).send({ error: 'Bad Request' });
        }
    });
}

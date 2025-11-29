"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const ai_routes_1 = __importDefault(require("../ai.routes"));
const jwt_service_1 = require("../../../services/jwt.service");
describe('AI Routes', () => {
    let fastify;
    let token;
    beforeAll(async () => {
        fastify = (0, fastify_1.default)();
        // Attach mocked redis and prisma to avoid external deps
        const makeMockResolved = (v) => { const f = jest.fn(); f.mockResolvedValue(v); return f; };
        fastify.decorate('redis', { incr: makeMockResolved(1), expire: makeMockResolved(1) });
        fastify.decorate('prisma', { conversation: { findUnique: jest.fn(), create: makeMockResolved({ id: 'c1' }) }, message: { create: makeMockResolved(true) } });
        // attach mocked openrouter and embeddings so AiService uses them
        fastify.decorate('openrouterClient', { callChat: jest.fn().mockResolvedValue({ reply: 'hi', raw: {} }) });
        fastify.decorate('embeddingsService', { createEmbedding: jest.fn().mockResolvedValue([0.1, 0.2]), querySimilar: jest.fn().mockResolvedValue([]) });
        await fastify.register(ai_routes_1.default, { prefix: '/api/v1/ai' });
        await fastify.ready();
        token = (0, jwt_service_1.signAccessToken)({ sub: 'u1', role: 'USER' });
    });
    afterAll(async () => {
        await fastify.close();
    });
    test('POST /api/v1/ai/chat returns structured response', async () => {
        // stub openrouter and embeddings on service instance
        const serviceInstance = fastify.routes && true; // noop to silence linter
        const response = await fastify.inject({
            method: 'POST',
            url: '/api/v1/ai/chat',
            headers: { authorization: `Bearer ${token}` },
            payload: { message: 'hello' },
        });
        // if something failed, print body
        if (response.statusCode !== 200)
            console.error('AI route body:', response.body);
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body).toHaveProperty('reply');
        expect(body).toHaveProperty('sources');
    });
});

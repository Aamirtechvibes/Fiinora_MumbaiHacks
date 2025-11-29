"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_service_1 = require("../auth.service");
const fastify_1 = __importDefault(require("fastify"));
const prisma_1 = __importDefault(require("../../../plugins/prisma"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
describe('AuthService basic', () => {
    let fastify;
    let auth;
    beforeAll(async () => {
        fastify = (0, fastify_1.default)();
        await fastify.register(prisma_1.default);
        await fastify.ready();
        auth = new auth_service_1.AuthService(fastify);
    });
    afterAll(async () => {
        await fastify.prisma.$disconnect();
        await fastify.close();
    });
    test('register -> login -> refresh -> logout flow', async () => {
        const email = `test_${Date.now()}@finora.test`;
        const reg = await auth.register(email, 'P@ssword123', 'Tester');
        expect(reg.email).toBe(email);
        const loginRes = await auth.login(email, 'P@ssword123');
        expect(loginRes).toHaveProperty('accessToken');
        expect(loginRes).toHaveProperty('refreshToken');
        expect(loginRes).toHaveProperty('sessionId');
        const refreshRes = await auth.refresh(loginRes.sessionId, loginRes.refreshToken);
        expect(refreshRes).toHaveProperty('accessToken');
        expect(refreshRes).toHaveProperty('refreshToken');
        expect(refreshRes).toHaveProperty('sessionId');
        const logoutRes = await auth.logout(refreshRes.sessionId);
        expect(logoutRes.ok).toBe(true);
    }, 20000);
});

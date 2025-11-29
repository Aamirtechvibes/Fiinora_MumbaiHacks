"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const prisma_1 = __importDefault(require("../../../plugins/prisma"));
const redis_1 = __importDefault(require("../../../plugins/redis"));
const wallet_routes_1 = __importDefault(require("../wallet.routes"));
const jwt_service_1 = require("../../../services/jwt.service");
describe('Wallet Routes', () => {
    let fastify;
    let testUserId;
    let testToken;
    beforeAll(async () => {
        fastify = (0, fastify_1.default)();
        await fastify.register(prisma_1.default);
        await fastify.register(redis_1.default);
        await fastify.register(wallet_routes_1.default, { prefix: '/wallet' });
        await fastify.ready();
        // Create test user
        const user = await fastify.prisma.user.create({
            data: {
                email: `wallet_route_${Date.now()}@test.com`,
                passwordHash: 'hash',
                name: 'Route Tester',
            },
        });
        testUserId = user.id;
        testToken = (0, jwt_service_1.signAccessToken)({ sub: testUserId, role: 'USER' });
        // Create test data
        await fastify.prisma.account.create({
            data: {
                userId: testUserId,
                type: 'checking',
                name: 'Test Account',
                balance: 10000,
            },
        });
        const today = new Date();
        await fastify.prisma.transaction.createMany({
            data: [
                {
                    userId: testUserId,
                    accountId: 'test-account',
                    txnDate: today,
                    amount: 5000,
                    category: 'income',
                },
                {
                    userId: testUserId,
                    accountId: 'test-account',
                    txnDate: today,
                    amount: -500,
                    category: 'food',
                },
            ],
        });
    });
    afterAll(async () => {
        await fastify.prisma.transaction.deleteMany({ where: { userId: testUserId } });
        await fastify.prisma.account.deleteMany({ where: { userId: testUserId } });
        await fastify.prisma.user.delete({ where: { id: testUserId } });
        await fastify.redis.quit();
        await fastify.prisma.$disconnect();
        await fastify.close();
    });
    test('GET /wallet/summary returns 200 with valid token', async () => {
        const response = await fastify.inject({
            method: 'GET',
            url: '/wallet/summary?period=month',
            headers: {
                authorization: `Bearer ${testToken}`,
            },
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body).toHaveProperty('netWorth');
        expect(body).toHaveProperty('totalIncome');
        expect(body).toHaveProperty('totalExpense');
    });
    test('GET /wallet/summary returns 401 without token', async () => {
        const response = await fastify.inject({
            method: 'GET',
            url: '/wallet/summary',
        });
        expect(response.statusCode).toBe(401);
    });
    test('GET /wallet/cashflow returns daily data', async () => {
        const from = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
        const to = new Date().toISOString();
        const response = await fastify.inject({
            method: 'GET',
            url: `/wallet/cashflow?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
            headers: {
                authorization: `Bearer ${testToken}`,
            },
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(Array.isArray(body)).toBe(true);
    });
    test('GET /wallet/networth returns historical data', async () => {
        const response = await fastify.inject({
            method: 'GET',
            url: '/wallet/networth?months=6',
            headers: {
                authorization: `Bearer ${testToken}`,
            },
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(Array.isArray(body)).toBe(true);
    });
});

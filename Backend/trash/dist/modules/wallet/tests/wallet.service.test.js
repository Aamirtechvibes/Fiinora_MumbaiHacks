"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const wallet_service_1 = require("../wallet.service");
const fastify_1 = __importDefault(require("fastify"));
const prisma_1 = __importDefault(require("../../../plugins/prisma"));
const redis_1 = __importDefault(require("../../../plugins/redis"));
describe('WalletService', () => {
    let fastify;
    let service;
    let testUserId;
    beforeAll(async () => {
        fastify = (0, fastify_1.default)();
        await fastify.register(prisma_1.default);
        await fastify.register(redis_1.default);
        await fastify.ready();
        service = new wallet_service_1.WalletService(fastify);
        // Create test user
        const user = await fastify.prisma.user.create({
            data: {
                email: `wallet_test_${Date.now()}@test.com`,
                passwordHash: 'hash',
                name: 'Wallet Tester',
            },
        });
        testUserId = user.id;
        // Create test account
        await fastify.prisma.account.create({
            data: {
                userId: testUserId,
                type: 'checking',
                name: 'Test Account',
                balance: 5000,
            },
        });
        // Create test transactions
        const today = new Date();
        await fastify.prisma.transaction.createMany({
            data: [
                {
                    userId: testUserId,
                    accountId: 'test-account',
                    txnDate: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
                    amount: 2000,
                    category: 'salary',
                    merchant: 'employer',
                },
                {
                    userId: testUserId,
                    accountId: 'test-account',
                    txnDate: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000),
                    amount: -150,
                    category: 'food',
                    merchant: 'restaurant',
                },
                {
                    userId: testUserId,
                    accountId: 'test-account',
                    txnDate: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
                    amount: -50,
                    category: 'transport',
                    merchant: 'uber',
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
    test('getSummary returns correct aggregates', async () => {
        const summary = await service.getSummary(testUserId, 'month');
        expect(summary).toHaveProperty('netWorth');
        expect(summary).toHaveProperty('totalIncome');
        expect(summary).toHaveProperty('totalExpense');
        expect(summary).toHaveProperty('topCategories');
        expect(summary.totalIncome).toBe(2000);
        expect(summary.totalExpense).toBe(200);
    });
    test('getSummary caches results', async () => {
        const before = await service.getSummary(testUserId, 'month');
        const cacheKey = `wallet:${testUserId}:summary:month`;
        const cached = await fastify.redis.get(cacheKey);
        expect(cached).toBeTruthy();
        expect(JSON.parse(cached)).toEqual(before);
    });
    test('getCashflow returns daily aggregates', async () => {
        const from = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
        const to = new Date().toISOString();
        const cashflow = await service.getCashflow(testUserId, from, to);
        expect(Array.isArray(cashflow)).toBe(true);
        expect(cashflow.length).toBeGreaterThan(0);
        expect(cashflow[0]).toHaveProperty('date');
        expect(cashflow[0]).toHaveProperty('income');
        expect(cashflow[0]).toHaveProperty('expense');
    });
    test('getNetworth returns historical points', async () => {
        const networth = await service.getNetworth(testUserId, 6);
        expect(Array.isArray(networth)).toBe(true);
        expect(networth.length).toBe(7); // months + 1 for current
        expect(networth[0]).toHaveProperty('date');
        expect(networth[0]).toHaveProperty('netWorth');
    });
    test('invalidateCache clears wallet cache', async () => {
        await service.getSummary(testUserId, 'month');
        const cacheKey = `wallet:${testUserId}:summary:month`;
        let cached = await fastify.redis.get(cacheKey);
        expect(cached).toBeTruthy();
        await service.invalidateCache(testUserId);
        cached = await fastify.redis.get(cacheKey);
        expect(cached).toBeNull();
    });
});

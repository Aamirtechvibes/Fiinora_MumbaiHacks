"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const investments_routes_1 = __importDefault(require("../investments.routes"));
const jwt_service_1 = require("../../../services/jwt.service");
describe('Investments Routes', () => {
    let fastify;
    let testUserId;
    let testToken;
    let createdId;
    const mockQueueAdd = jest.fn();
    beforeAll(async () => {
        fastify = (0, fastify_1.default)();
        // make route errors visible in test output
        fastify.log = { error: console.error.bind(console), info: console.log.bind(console) };
        // Register mocked Prisma to avoid external DB dependency in unit tests
        const mockPrisma = {
            investment: {
                create: jest.fn().mockResolvedValue({ id: 'inv-1', userId: 'test-user', symbol: 'AAPL', quantity: 1, avgCost: 150, currency: 'USD' }),
                findMany: jest.fn().mockResolvedValue([{ id: 'inv-1', userId: 'test-user', symbol: 'AAPL' }]),
                findFirst: jest.fn().mockImplementation(({ where }) => {
                    if (where && where.id === 'inv-1')
                        return Promise.resolve({ id: 'inv-1', userId: 'test-user', symbol: 'AAPL' });
                    return Promise.resolve(null);
                }),
                count: jest.fn().mockResolvedValue(1),
                deleteMany: jest.fn().mockResolvedValue({}),
            },
            user: { delete: jest.fn().mockResolvedValue({}) },
        };
        // Attach mocked prisma directly to the Fastify instance
        fastify.decorate('prisma', mockPrisma);
        // register a lightweight mock bullmq decorator
        // Attach mocked bullmq queue directly
        fastify.decorate('bullmq', { transactionQueue: { add: mockQueueAdd } });
        await fastify.register(investments_routes_1.default, { prefix: '/api/v1/investments' });
        await fastify.ready();
        // Use a static test user id; we don't create a real DB user here
        testUserId = 'test-user';
        // sanity checks: ensure mocks are attached
        if (!fastify.prisma)
            console.error('prisma not attached');
        if (!(fastify.bullmq && fastify.bullmq.transactionQueue))
            console.error('bullmq.transactionQueue not attached');
        testToken = (0, jwt_service_1.signAccessToken)({ sub: testUserId, role: 'USER' });
    });
    afterAll(async () => {
        await fastify.close();
    });
    test('POST /api/v1/investments creates investment and enqueues price job', async () => {
        const response = await fastify.inject({
            method: 'POST',
            url: '/api/v1/investments',
            headers: { authorization: `Bearer ${testToken}` },
            payload: { symbol: 'AAPL', quantity: 1, avgCost: 150, currency: 'USD' },
        });
        if (response.statusCode !== 201)
            console.error('POST response body:', response.body);
        expect(response.statusCode).toBe(201);
        const body = JSON.parse(response.body);
        expect(body).toHaveProperty('id');
        expect(body.symbol).toBe('AAPL');
        createdId = body.id;
        expect(fastify.bullmq.transactionQueue.add.mock.calls.length).toBeGreaterThanOrEqual(1);
    });
    test('GET /api/v1/investments returns list', async () => {
        const response = await fastify.inject({
            method: 'GET',
            url: '/api/v1/investments',
            headers: { authorization: `Bearer ${testToken}` },
        });
        if (response.statusCode !== 200)
            console.error('LIST response body:', response.body);
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body).toHaveProperty('items');
        expect(Array.isArray(body.items)).toBe(true);
    });
    test('GET /api/v1/investments/:id returns the created investment', async () => {
        const response = await fastify.inject({
            method: 'GET',
            url: `/api/v1/investments/${createdId}`,
            headers: { authorization: `Bearer ${testToken}` },
        });
        if (response.statusCode !== 200)
            console.error('GET by id response body:', response.body);
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body).toHaveProperty('id', createdId);
    });
});

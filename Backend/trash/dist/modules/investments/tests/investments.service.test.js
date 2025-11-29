"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const investments_service_1 = __importDefault(require("../investments.service"));
(0, globals_1.describe)('InvestmentsService', () => {
    let service;
    let mockFastify;
    let mockPrisma;
    (0, globals_1.beforeEach)(() => {
        mockPrisma = {
            investment: {
                findMany: globals_1.jest.fn(),
                count: globals_1.jest.fn(),
                findFirst: globals_1.jest.fn(),
                create: globals_1.jest.fn(),
                update: globals_1.jest.fn(),
                delete: globals_1.jest.fn(),
                updateMany: globals_1.jest.fn(),
            },
        };
        mockFastify = { prisma: mockPrisma, bullmq: { transactionQueue: { add: globals_1.jest.fn() } } };
        service = new investments_service_1.default(mockFastify);
    });
    (0, globals_1.it)('lists investments', async () => {
        mockPrisma.investment.findMany.mockResolvedValue([{ id: 'i1', symbol: 'AAPL' }]);
        mockPrisma.investment.count.mockResolvedValue(1);
        const res = await service.listInvestments('u1', { page: 1, limit: 20 });
        (0, globals_1.expect)(res.items.length).toBe(1);
        (0, globals_1.expect)(res.pagination.total).toBe(1);
    });
    (0, globals_1.it)('creates investment and enqueues price job', async () => {
        mockPrisma.investment.create.mockResolvedValue({ id: 'i1', symbol: 'AAPL' });
        const res = await service.createInvestment('u1', { symbol: 'AAPL', quantity: 1, avgCost: 150, currency: 'USD' });
        (0, globals_1.expect)(res).toHaveProperty('id');
        (0, globals_1.expect)(mockFastify.bullmq.transactionQueue.add.mock.calls.length).toBe(1);
    });
    (0, globals_1.it)('produces recommendations for empty portfolio', async () => {
        mockPrisma.investment.findMany.mockResolvedValue([]);
        const rec = await service.getRecommendations('u1');
        (0, globals_1.expect)(rec.suggestions.length).toBeGreaterThan(0);
    });
});

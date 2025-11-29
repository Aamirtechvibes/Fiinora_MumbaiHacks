"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const ai_service_1 = __importDefault(require("../ai.service"));
(0, globals_1.describe)('AiService tools', () => {
    let svc;
    let mockFastify;
    (0, globals_1.beforeEach)(() => {
        const makeMockResolved = (v) => { const f = globals_1.jest.fn(); f.mockResolvedValue(v); return f; };
        mockFastify = {
            prisma: {
                budget: { findMany: makeMockResolved([]) },
                transaction: { aggregate: makeMockResolved({ _sum: { amount: 100 } }) },
                $queryRawUnsafe: globals_1.jest.fn().mockResolvedValue([{ day: '2025-01-01', total: '100' }]),
                investment: { findMany: makeMockResolved([{ id: 'i1', symbol: 'AAPL', quantity: 2, avgCost: 100, currentPrice: 110 }]) },
            }
        };
        svc = new ai_service_1.default(mockFastify);
    });
    (0, globals_1.it)('simulateBudgetChange returns projection', async () => {
        const out = await svc.simulateBudgetChange('u1', { changeAmount: 50 });
        (0, globals_1.expect)(out).toHaveProperty('projectedSpending');
    });
    (0, globals_1.it)('computeCashflow returns daily totals', async () => {
        const out = await svc.computeCashflow('u1');
        (0, globals_1.expect)(Array.isArray(out)).toBe(true);
        (0, globals_1.expect)(out[0]).toHaveProperty('total');
    });
    (0, globals_1.it)('getInvestmentSummary returns totalValue', async () => {
        const out = await svc.getInvestmentSummary('u1');
        (0, globals_1.expect)(out).toHaveProperty('totalValue');
        (0, globals_1.expect)(out.holdings.length).toBeGreaterThan(0);
    });
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const budgets_service_1 = require("../budgets.service");
(0, globals_1.describe)('BudgetsService', () => {
    let service;
    let mockFastify;
    let mockPrisma;
    (0, globals_1.beforeEach)(() => {
        mockPrisma = {
            budget: {
                create: jest.fn(),
                findMany: jest.fn(),
                count: jest.fn(),
                findFirst: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
            },
            transaction: {
                aggregate: jest.fn(),
                findMany: jest.fn(),
            },
        };
        mockFastify = { prisma: mockPrisma };
        service = new budgets_service_1.BudgetsService(mockFastify);
    });
    (0, globals_1.it)('should create budget', async () => {
        mockPrisma.budget.create.mockResolvedValue({ id: 'b1', name: 'Test', amount: 100, startDate: new Date(), endDate: new Date(), createdAt: new Date() });
        const res = await service.createBudget('u1', { name: 'Test', amount: 100, startDate: new Date().toISOString(), endDate: new Date().toISOString() });
        (0, globals_1.expect)(res).toHaveProperty('id');
    });
    (0, globals_1.it)('should calculate progress', async () => {
        const budget = { id: 'b1', name: 'Test', amount: 100, startDate: new Date('2025-01-01'), endDate: new Date('2025-01-31'), category: null };
        mockPrisma.budget.findFirst.mockResolvedValue(budget);
        mockPrisma.transaction.aggregate.mockResolvedValue({ _sum: { amount: 40 } });
        const p = await service.getBudgetProgress('u1', 'b1');
        (0, globals_1.expect)(p.spent).toBeDefined();
        (0, globals_1.expect)(p.progress).toBeLessThanOrEqual(100);
    });
    (0, globals_1.it)('should simulate budget', async () => {
        const budget = { id: 'b1', name: 'Test', amount: 300, category: null };
        mockPrisma.budget.findFirst.mockResolvedValue(budget);
        mockPrisma.transaction.findMany.mockResolvedValue([
            { amount: { toNumber: () => 100 } },
            { amount: { toNumber: () => 50 } },
        ]);
        const sim = await service.simulateBudget('u1', { budgetId: 'b1', scenarioMonths: 3 });
        (0, globals_1.expect)(sim.projection.length).toBe(3);
    });
});

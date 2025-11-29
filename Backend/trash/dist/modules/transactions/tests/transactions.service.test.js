"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const transactions_service_1 = require("../transactions.service");
(0, globals_1.describe)('TransactionsService', () => {
    let service;
    let mockFastify;
    let mockPrisma;
    let mockRedis;
    (0, globals_1.beforeEach)(() => {
        mockRedis = {
            keys: jest.fn().mockResolvedValue([]),
            del: jest.fn().mockResolvedValue(0),
        };
        mockPrisma = {
            account: {
                findFirst: jest.fn(),
            },
            transaction: {
                create: jest.fn(),
                findMany: jest.fn(),
                count: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
            },
        };
        mockFastify = {
            prisma: mockPrisma,
            redis: mockRedis,
            log: { warn: jest.fn() },
        };
        service = new transactions_service_1.TransactionsService(mockFastify);
    });
    (0, globals_1.describe)('createTransaction', () => {
        (0, globals_1.it)('should create a transaction successfully', async () => {
            const userId = 'user-1';
            const accountId = 'account-1';
            const txnData = {
                accountId,
                amount: 100,
                txnDate: new Date().toISOString(),
                category: 'Food',
                merchant: 'Restaurant',
            };
            mockPrisma.account.findFirst.mockResolvedValue({ id: accountId, userId });
            mockPrisma.transaction.create.mockResolvedValue({
                id: 'txn-1',
                accountId,
                userId,
                amount: 100,
                txnDate: new Date(),
                category: 'Food',
                merchant: 'Restaurant',
                createdAt: new Date(),
            });
            const result = await service.createTransaction(userId, txnData);
            (0, globals_1.expect)(result).toHaveProperty('id');
            (0, globals_1.expect)(result.amount).toBe(100);
            (0, globals_1.expect)(result.category).toBe('Food');
            (0, globals_1.expect)(mockPrisma.transaction.create).toHaveBeenCalled();
        });
        (0, globals_1.it)('should throw error if account not found', async () => {
            mockPrisma.account.findFirst.mockResolvedValue(null);
            await (0, globals_1.expect)(service.createTransaction('user-1', {
                accountId: 'account-1',
                amount: 100,
                txnDate: new Date().toISOString(),
            })).rejects.toThrow('ACCOUNT_NOT_FOUND');
        });
        (0, globals_1.it)('should throw error if account belongs to different user', async () => {
            mockPrisma.account.findFirst.mockResolvedValue(null);
            await (0, globals_1.expect)(service.createTransaction('user-1', {
                accountId: 'account-2',
                amount: 100,
                txnDate: new Date().toISOString(),
            })).rejects.toThrow('ACCOUNT_NOT_FOUND');
        });
        (0, globals_1.it)('should invalidate wallet cache after creation', async () => {
            mockPrisma.account.findFirst.mockResolvedValue({ id: 'account-1' });
            mockPrisma.transaction.create.mockResolvedValue({
                id: 'txn-1',
                accountId: 'account-1',
                userId: 'user-1',
                amount: 100,
                txnDate: new Date(),
                category: 'Food',
                merchant: 'Restaurant',
                createdAt: new Date(),
            });
            mockRedis.keys.mockResolvedValue([
                'wallet:user-1:summary:month',
                'wallet:user-1:cashflow:2025-01',
            ]);
            await service.createTransaction('user-1', {
                accountId: 'account-1',
                amount: 100,
                txnDate: new Date().toISOString(),
            });
            (0, globals_1.expect)(mockRedis.keys).toHaveBeenCalled();
            (0, globals_1.expect)(mockRedis.del).toHaveBeenCalled();
        });
    });
    (0, globals_1.describe)('listTransactions', () => {
        (0, globals_1.it)('should list transactions with pagination', async () => {
            const userId = 'user-1';
            mockPrisma.transaction.findMany.mockResolvedValue([
                {
                    id: 'txn-1',
                    amount: 100,
                    txnDate: new Date(),
                    category: 'Food',
                    merchant: 'Restaurant',
                    createdAt: new Date(),
                    accountId: 'account-1',
                    userId,
                },
            ]);
            mockPrisma.transaction.count.mockResolvedValue(1);
            const result = await service.listTransactions(userId, {
                page: 1,
                limit: 20,
            });
            (0, globals_1.expect)(result.transactions).toHaveLength(1);
            (0, globals_1.expect)(result.pagination.page).toBe(1);
            (0, globals_1.expect)(result.pagination.total).toBe(1);
        });
        (0, globals_1.it)('should filter by category', async () => {
            mockPrisma.transaction.findMany.mockResolvedValue([]);
            mockPrisma.transaction.count.mockResolvedValue(0);
            await service.listTransactions('user-1', {
                page: 1,
                limit: 20,
                category: 'Food',
            });
            const callArgs = mockPrisma.transaction.findMany.mock.calls[0][0];
            (0, globals_1.expect)(callArgs.where.category).toBe('Food');
        });
        (0, globals_1.it)('should filter by date range', async () => {
            mockPrisma.transaction.findMany.mockResolvedValue([]);
            mockPrisma.transaction.count.mockResolvedValue(0);
            const fromDate = new Date('2025-01-01').toISOString();
            const toDate = new Date('2025-01-31').toISOString();
            await service.listTransactions('user-1', {
                page: 1,
                limit: 20,
                fromDate,
                toDate,
            });
            const callArgs = mockPrisma.transaction.findMany.mock.calls[0][0];
            (0, globals_1.expect)(callArgs.where.txnDate).toBeDefined();
        });
        (0, globals_1.it)('should filter by amount range', async () => {
            mockPrisma.transaction.findMany.mockResolvedValue([]);
            mockPrisma.transaction.count.mockResolvedValue(0);
            await service.listTransactions('user-1', {
                page: 1,
                limit: 20,
                minAmount: 50,
                maxAmount: 200,
            });
            const callArgs = mockPrisma.transaction.findMany.mock.calls[0][0];
            (0, globals_1.expect)(callArgs.where.amount).toBeDefined();
        });
    });
    (0, globals_1.describe)('updateTransaction', () => {
        (0, globals_1.beforeEach)(() => {
            // Ensure transaction mocks exist (defensive in case previous tests mutate them)
            mockPrisma.transaction = mockPrisma.transaction || {};
            mockPrisma.transaction.findFirst = mockPrisma.transaction.findFirst || jest.fn();
            mockPrisma.transaction.update = mockPrisma.transaction.update || jest.fn();
        });
        (0, globals_1.it)('should update transaction successfully', async () => {
            mockPrisma.transaction.findFirst.mockResolvedValue({
                id: 'txn-1',
                userId: 'user-1',
            });
            mockPrisma.transaction.update.mockResolvedValue({
                id: 'txn-1',
                amount: 150,
                txnDate: new Date(),
                category: 'Food',
                merchant: 'Restaurant',
                createdAt: new Date(),
                accountId: 'account-1',
                userId: 'user-1',
            });
            const result = await service.updateTransaction('user-1', 'txn-1', {
                amount: 150,
            });
            (0, globals_1.expect)(result.amount).toBe(150);
        });
        (0, globals_1.it)('should throw error if transaction not found', async () => {
            mockPrisma.transaction.findFirst.mockResolvedValue(null);
            await (0, globals_1.expect)(service.updateTransaction('user-1', 'txn-1', { amount: 150 })).rejects.toThrow('TRANSACTION_NOT_FOUND');
        });
    });
    (0, globals_1.describe)('deleteTransaction', () => {
        (0, globals_1.beforeEach)(() => {
            // Defensive mocks
            mockPrisma.transaction = mockPrisma.transaction || {};
            mockPrisma.transaction.findFirst = mockPrisma.transaction.findFirst || jest.fn();
            mockPrisma.transaction.delete = mockPrisma.transaction.delete || jest.fn();
        });
        (0, globals_1.it)('should delete transaction successfully', async () => {
            mockPrisma.transaction.findFirst.mockResolvedValue({
                id: 'txn-1',
                userId: 'user-1',
            });
            mockPrisma.transaction.delete.mockResolvedValue({});
            await service.deleteTransaction('user-1', 'txn-1');
            (0, globals_1.expect)(mockPrisma.transaction.delete).toHaveBeenCalledWith({
                where: { id: 'txn-1' },
            });
        });
        (0, globals_1.it)('should throw error if transaction not found', async () => {
            mockPrisma.transaction.findFirst.mockResolvedValue(null);
            await (0, globals_1.expect)(service.deleteTransaction('user-1', 'txn-1')).rejects.toThrow('TRANSACTION_NOT_FOUND');
        });
    });
});

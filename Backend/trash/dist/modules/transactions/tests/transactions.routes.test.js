"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const transactions_controller_1 = require("../transactions.controller");
(0, globals_1.describe)('TransactionsController', () => {
    let controller;
    let mockRequest;
    let mockReply;
    let mockService;
    (0, globals_1.beforeEach)(() => {
        controller = new transactions_controller_1.TransactionsController();
        mockRequest = { body: {}, params: {}, query: {} };
        mockReply = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
        };
        mockService = {
            createTransaction: jest.fn(),
            listTransactions: jest.fn(),
            updateTransaction: jest.fn(),
            deleteTransaction: jest.fn(),
        };
    });
    (0, globals_1.describe)('createTransaction', () => {
        (0, globals_1.it)('should validate request body', async () => {
            mockRequest.body = {
                accountId: 'invalid-uuid',
                amount: 100,
                txnDate: '2025-01-01T00:00:00Z',
            };
            await controller.createTransaction(mockRequest, mockReply, mockService);
            (0, globals_1.expect)(mockReply.status).toHaveBeenCalledWith(400);
        });
        (0, globals_1.it)('should return 404 if account not found', async () => {
            mockRequest.userId = 'user-1';
            mockRequest.body = {
                accountId: 'c7f06659-cb6e-4f3a-b90f-d6c6e6d6e6d6',
                amount: 100,
                txnDate: '2025-01-01T00:00:00Z',
            };
            mockService.createTransaction.mockRejectedValue(new Error('ACCOUNT_NOT_FOUND'));
            await controller.createTransaction(mockRequest, mockReply, mockService);
            (0, globals_1.expect)(mockReply.status).toHaveBeenCalledWith(404);
        });
    });
    (0, globals_1.describe)('listTransactions', () => {
        (0, globals_1.it)('should list transactions with valid query params', async () => {
            mockRequest.userId = 'user-1';
            mockRequest.query = { page: '1', limit: '20' };
            mockService.listTransactions.mockResolvedValue({
                transactions: [],
                pagination: { page: 1, limit: 20, total: 0, pages: 0 },
            });
            await controller.listTransactions(mockRequest, mockReply, mockService);
            (0, globals_1.expect)(mockReply.send).toHaveBeenCalled();
        });
        (0, globals_1.it)('should return 400 if query validation fails', async () => {
            mockRequest.userId = 'user-1';
            mockRequest.query = { page: '-1' };
            await controller.listTransactions(mockRequest, mockReply, mockService);
            (0, globals_1.expect)(mockReply.status).toHaveBeenCalledWith(400);
        });
    });
    (0, globals_1.describe)('updateTransaction', () => {
        (0, globals_1.it)('should update transaction with valid data', async () => {
            mockRequest.userId = 'user-1';
            mockRequest.params = { id: 'c7f06659-cb6e-4f3a-b90f-d6c6e6d6e6d6' };
            mockRequest.body = { amount: 150 };
            mockService.updateTransaction.mockResolvedValue({ id: 'txn-1', amount: 150 });
            await controller.updateTransaction(mockRequest, mockReply, mockService);
            (0, globals_1.expect)(mockReply.send).toHaveBeenCalled();
        });
        (0, globals_1.it)('should return 404 if transaction not found', async () => {
            mockRequest.userId = 'user-1';
            mockRequest.params = { id: 'c7f06659-cb6e-4f3a-b90f-d6c6e6d6e6d6' };
            mockRequest.body = { amount: 150 };
            mockService.updateTransaction.mockRejectedValue(new Error('TRANSACTION_NOT_FOUND'));
            await controller.updateTransaction(mockRequest, mockReply, mockService);
            (0, globals_1.expect)(mockReply.status).toHaveBeenCalledWith(404);
        });
        (0, globals_1.it)('should return 403 if user does not own transaction', async () => {
            mockRequest.userId = 'user-1';
            mockRequest.params = { id: 'c7f06659-cb6e-4f3a-b90f-d6c6e6d6e6d6' };
            mockRequest.body = { amount: 150 };
            mockService.updateTransaction.mockRejectedValue(new Error('FORBIDDEN'));
            await controller.updateTransaction(mockRequest, mockReply, mockService);
            (0, globals_1.expect)(mockReply.status).toHaveBeenCalledWith(403);
        });
    });
    (0, globals_1.describe)('deleteTransaction', () => {
        (0, globals_1.it)('should delete transaction successfully', async () => {
            mockRequest.userId = 'user-1';
            mockRequest.params = { id: 'c7f06659-cb6e-4f3a-b90f-d6c6e6d6e6d6' };
            mockService.deleteTransaction.mockResolvedValue(undefined);
            await controller.deleteTransaction(mockRequest, mockReply, mockService);
            (0, globals_1.expect)(mockReply.status).toHaveBeenCalledWith(204);
        });
        (0, globals_1.it)('should return 404 if transaction not found', async () => {
            mockRequest.userId = 'user-1';
            mockRequest.params = { id: 'c7f06659-cb6e-4f3a-b90f-d6c6e6d6e6d6' };
            mockService.deleteTransaction.mockRejectedValue(new Error('TRANSACTION_NOT_FOUND'));
            await controller.deleteTransaction(mockRequest, mockReply, mockService);
            (0, globals_1.expect)(mockReply.status).toHaveBeenCalledWith(404);
        });
    });
});

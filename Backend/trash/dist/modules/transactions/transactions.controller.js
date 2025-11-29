"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsController = void 0;
const dto_1 = require("./dto");
class TransactionsController {
    async createTransaction(req, reply, service) {
        try {
            const body = dto_1.createTransactionSchema.parse(req.body);
            const userId = req.userId;
            const transaction = await service.createTransaction(userId, body);
            return reply.status(201).send(transaction);
        }
        catch (error) {
            if (error.issues) {
                return reply.status(400).send({
                    error: 'Validation failed',
                    code: 'VALIDATION_ERROR',
                    details: error.issues,
                });
            }
            if (error.message === 'ACCOUNT_NOT_FOUND') {
                return reply.status(404).send({
                    error: 'Account not found',
                    code: 'ACCOUNT_NOT_FOUND',
                });
            }
            throw error;
        }
    }
    async listTransactions(req, reply, service) {
        try {
            const query = dto_1.listTransactionsQuerySchema.parse(req.query);
            const userId = req.userId;
            const result = await service.listTransactions(userId, query);
            return reply.send(result);
        }
        catch (error) {
            if (error.issues) {
                return reply.status(400).send({
                    error: 'Validation failed',
                    code: 'VALIDATION_ERROR',
                    details: error.issues,
                });
            }
            throw error;
        }
    }
    async updateTransaction(req, reply, service) {
        try {
            const { id } = req.params;
            const body = dto_1.updateTransactionSchema.parse(req.body);
            const userId = req.userId;
            const transaction = await service.updateTransaction(userId, id, body);
            return reply.send(transaction);
        }
        catch (error) {
            if (error.issues) {
                return reply.status(400).send({
                    error: 'Validation failed',
                    code: 'VALIDATION_ERROR',
                    details: error.issues,
                });
            }
            if (error.message === 'TRANSACTION_NOT_FOUND') {
                return reply.status(404).send({
                    error: 'Transaction not found',
                    code: 'TRANSACTION_NOT_FOUND',
                });
            }
            if (error.message === 'FORBIDDEN') {
                return reply.status(403).send({
                    error: 'You do not own this transaction',
                    code: 'FORBIDDEN',
                });
            }
            throw error;
        }
    }
    async deleteTransaction(req, reply, service) {
        try {
            const { id } = req.params;
            const userId = req.userId;
            await service.deleteTransaction(userId, id);
            return reply.status(204).send();
        }
        catch (error) {
            if (error.message === 'TRANSACTION_NOT_FOUND') {
                return reply.status(404).send({
                    error: 'Transaction not found',
                    code: 'TRANSACTION_NOT_FOUND',
                });
            }
            if (error.message === 'FORBIDDEN') {
                return reply.status(403).send({
                    error: 'You do not own this transaction',
                    code: 'FORBIDDEN',
                });
            }
            throw error;
        }
    }
}
exports.TransactionsController = TransactionsController;

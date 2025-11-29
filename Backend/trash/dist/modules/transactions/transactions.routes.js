"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const transactions_service_1 = require("./transactions.service");
const dto_1 = require("./dto");
async function transactionsRoutes(fastify) {
    const transactionsService = new transactions_service_1.TransactionsService(fastify);
    // Auth middleware
    const authMiddleware = async (request, reply) => {
        const auth = request.headers['authorization'];
        if (!auth?.startsWith('Bearer ')) {
            return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
        }
        const token = auth.split(' ')[1];
        try {
            const payload = require('jsonwebtoken').verify(token, process.env.JWT_ACCESS_TOKEN_SECRET || 'dev_access_secret');
            request.userId = payload.sub;
        }
        catch (e) {
            return reply.status(401).send({ error: 'Invalid token', code: 'INVALID_TOKEN' });
        }
    };
    // POST /transactions - Create transaction
    fastify.post('/transactions', { onRequest: authMiddleware }, async (request, reply) => {
        try {
            const body = dto_1.createTransactionSchema.parse(request.body);
            const transaction = await transactionsService.createTransaction(request.userId, body);
            return reply.status(201).send(transaction);
        }
        catch (error) {
            if (error.issues) {
                return reply
                    .status(400)
                    .send({ error: 'Validation failed', code: 'VALIDATION_ERROR', details: error.issues });
            }
            if (error.message === 'ACCOUNT_NOT_FOUND') {
                return reply.status(404).send({ error: 'Account not found', code: 'ACCOUNT_NOT_FOUND' });
            }
            fastify.log.error(error);
            return reply
                .status(500)
                .send({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
        }
    });
    // GET /transactions - List transactions with filtering
    fastify.get('/transactions', { onRequest: authMiddleware }, async (request, reply) => {
        try {
            const query = dto_1.listTransactionsQuerySchema.parse(request.query);
            const result = await transactionsService.listTransactions(request.userId, query);
            return reply.send(result);
        }
        catch (error) {
            if (error.issues) {
                return reply
                    .status(400)
                    .send({ error: 'Validation failed', code: 'VALIDATION_ERROR', details: error.issues });
            }
            fastify.log.error(error);
            return reply
                .status(500)
                .send({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
        }
    });
    // PUT /transactions/:id - Update transaction
    fastify.put('/transactions/:id', { onRequest: authMiddleware }, async (request, reply) => {
        try {
            const { id } = request.params;
            const body = dto_1.updateTransactionSchema.parse(request.body);
            const transaction = await transactionsService.updateTransaction(request.userId, id, body);
            return reply.send(transaction);
        }
        catch (error) {
            if (error.issues) {
                return reply
                    .status(400)
                    .send({ error: 'Validation failed', code: 'VALIDATION_ERROR', details: error.issues });
            }
            if (error.message === 'TRANSACTION_NOT_FOUND') {
                return reply
                    .status(404)
                    .send({ error: 'Transaction not found', code: 'TRANSACTION_NOT_FOUND' });
            }
            if (error.message === 'FORBIDDEN') {
                return reply
                    .status(403)
                    .send({ error: 'You do not own this transaction', code: 'FORBIDDEN' });
            }
            fastify.log.error(error);
            return reply
                .status(500)
                .send({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
        }
    });
    // DELETE /transactions/:id - Delete transaction
    fastify.delete('/transactions/:id', { onRequest: authMiddleware }, async (request, reply) => {
        try {
            const { id } = request.params;
            await transactionsService.deleteTransaction(request.userId, id);
            return reply.status(204).send();
        }
        catch (error) {
            if (error.message === 'TRANSACTION_NOT_FOUND') {
                return reply
                    .status(404)
                    .send({ error: 'Transaction not found', code: 'TRANSACTION_NOT_FOUND' });
            }
            if (error.message === 'FORBIDDEN') {
                return reply
                    .status(403)
                    .send({ error: 'You do not own this transaction', code: 'FORBIDDEN' });
            }
            fastify.log.error(error);
            return reply
                .status(500)
                .send({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
        }
    });
    // POST /transactions/import - CSV import
    fastify.post('/transactions/import', { onRequest: authMiddleware }, async (request, reply) => {
        try {
            const data = await request.file();
            if (!data) {
                return reply
                    .status(400)
                    .send({ error: 'No file provided', code: 'NO_FILE' });
            }
            const filename = data.filename.toLowerCase();
            if (!filename.endsWith('.csv')) {
                return reply
                    .status(400)
                    .send({ error: 'Only CSV files are supported', code: 'INVALID_FILE_TYPE' });
            }
            const job = await transactionsService.enqueueCsvImportJob(request.userId, data.file);
            return reply.status(202).send({
                message: 'Import started',
                jobId: job.id,
                status: 'processing',
            });
        }
        catch (error) {
            if (error.message === 'INVALID_CSV') {
                return reply
                    .status(400)
                    .send({ error: 'Invalid CSV format', code: 'INVALID_CSV' });
            }
            fastify.log.error(error);
            return reply
                .status(500)
                .send({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
        }
    });
}
exports.default = transactionsRoutes;

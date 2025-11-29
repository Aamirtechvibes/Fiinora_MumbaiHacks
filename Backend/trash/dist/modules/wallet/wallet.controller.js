"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = walletController;
const wallet_service_1 = require("./wallet.service");
const dto_1 = require("./dto");
function walletController(fastify) {
    const service = new wallet_service_1.WalletService(fastify);
    return {
        getSummary: async (req, reply) => {
            try {
                const userId = req.userId;
                const query = dto_1.summaryQuerySchema.parse(req.query);
                const result = await service.getSummary(userId, query.period || 'month');
                reply.send(result);
            }
            catch (err) {
                fastify.log.error(err);
                if (err.name === 'ZodError') {
                    return reply.code(400).send({ error: 'Validation error', code: 'VALIDATION_ERROR' });
                }
                reply.code(500).send({ error: 'Internal server error' });
            }
        },
        getCashflow: async (req, reply) => {
            try {
                const userId = req.userId;
                const query = dto_1.cashflowQuerySchema.parse(req.query);
                const result = await service.getCashflow(userId, query.from, query.to);
                reply.send(result);
            }
            catch (err) {
                fastify.log.error(err);
                if (err.name === 'ZodError') {
                    return reply.code(400).send({ error: 'Validation error', code: 'VALIDATION_ERROR' });
                }
                reply.code(500).send({ error: 'Internal server error' });
            }
        },
        getNetworth: async (req, reply) => {
            try {
                const userId = req.userId;
                const query = dto_1.networthQuerySchema.parse(req.query);
                const result = await service.getNetworth(userId, query.months || 12);
                reply.send(result);
            }
            catch (err) {
                fastify.log.error(err);
                if (err.name === 'ZodError') {
                    return reply.code(400).send({ error: 'Validation error', code: 'VALIDATION_ERROR' });
                }
                reply.code(500).send({ error: 'Internal server error' });
            }
        }
    };
}

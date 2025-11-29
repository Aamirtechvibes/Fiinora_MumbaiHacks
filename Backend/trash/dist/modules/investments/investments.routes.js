"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = investmentsRoutes;
const investments_service_1 = __importDefault(require("./investments.service"));
const dto_1 = require("./dto");
async function investmentsRoutes(fastify) {
    const service = new investments_service_1.default(fastify);
    const auth = async (request, reply) => {
        const header = request.headers['authorization'];
        if (!header?.startsWith('Bearer '))
            return reply.status(401).send({ error: 'Unauthorized' });
        try {
            const payload = require('jsonwebtoken').verify(header.split(' ')[1], process.env.JWT_ACCESS_TOKEN_SECRET || 'dev_access_secret');
            request.userId = payload.sub;
        }
        catch (e) {
            return reply.status(401).send({ error: 'Invalid token' });
        }
    };
    fastify.get('/', { onRequest: auth, schema: { summary: 'List investments' } }, async (request, reply) => {
        try {
            const q = dto_1.listInvestmentsQuery.parse(request.query);
            const res = await service.listInvestments(request.userId, q);
            return reply.send(res);
        }
        catch (err) {
            return reply.status(400).send({ error: 'Bad Request' });
        }
    });
    fastify.get('/:id', { onRequest: auth }, async (request, reply) => {
        try {
            const { id } = request.params;
            const inv = await service.getInvestment(request.userId, id);
            return reply.send(inv);
        }
        catch (err) {
            return reply.status(404).send({ error: 'Not found' });
        }
    });
    fastify.post('/', { onRequest: auth }, async (request, reply) => {
        try {
            const body = dto_1.createInvestmentSchema.parse(request.body);
            const inv = await service.createInvestment(request.userId, body);
            return reply.status(201).send(inv);
        }
        catch (err) {
            if (err.issues)
                return reply.status(400).send({ error: 'Validation failed', details: err.issues });
            fastify.log.error(err);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
    fastify.put('/:id', { onRequest: auth }, async (request, reply) => {
        try {
            const { id } = request.params;
            const body = dto_1.updateInvestmentSchema.parse(request.body);
            const updated = await service.updateInvestment(request.userId, id, body);
            return reply.send(updated);
        }
        catch (err) {
            return reply.status(400).send({ error: 'Bad Request' });
        }
    });
    fastify.delete('/:id', { onRequest: auth }, async (request, reply) => {
        try {
            const { id } = request.params;
            await service.deleteInvestment(request.userId, id);
            return reply.status(204).send();
        }
        catch (err) {
            return reply.status(404).send({ error: 'Not found' });
        }
    });
    fastify.get('/recommendations', { onRequest: auth }, async (request, reply) => {
        try {
            const res = await service.getRecommendations(request.userId);
            return reply.send(res);
        }
        catch (err) {
            fastify.log.error(err);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}

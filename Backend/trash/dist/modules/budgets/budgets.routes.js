"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = budgetsRoutes;
const budgets_service_1 = require("./budgets.service");
const budgets_controller_1 = require("./budgets.controller");
async function budgetsRoutes(fastify) {
    const service = new budgets_service_1.BudgetsService(fastify);
    const ctrl = new budgets_controller_1.BudgetsController();
    const authMiddleware = async (req, reply) => {
        try {
            const auth = req.headers['authorization'];
            if (!auth?.startsWith('Bearer '))
                return reply.code(401).send({ error: 'Unauthorized', code: 'NO_AUTH' });
            const token = auth.split(' ')[1];
            const payload = require('jsonwebtoken').verify(token, process.env.JWT_ACCESS_TOKEN_SECRET || 'dev_access_secret');
            req.userId = payload.sub;
        }
        catch (e) {
            return reply.code(401).send({ error: 'Invalid token', code: 'INVALID_TOKEN' });
        }
    };
    fastify.post('/', { preHandler: authMiddleware }, async (req, reply) => {
        return ctrl.create(req, reply, service);
    });
    fastify.get('/', { preHandler: authMiddleware }, async (req, reply) => {
        return ctrl.list(req, reply, service);
    });
    fastify.get('/:id', { preHandler: authMiddleware }, async (req, reply) => {
        return ctrl.get(req, reply, service);
    });
    fastify.put('/:id', { preHandler: authMiddleware }, async (req, reply) => {
        return ctrl.update(req, reply, service);
    });
    fastify.delete('/:id', { preHandler: authMiddleware }, async (req, reply) => {
        return ctrl.remove(req, reply, service);
    });
    fastify.get('/:id/progress', { preHandler: authMiddleware }, async (req, reply) => {
        return ctrl.progress(req, reply, service);
    });
    fastify.post('/simulate', { preHandler: authMiddleware }, async (req, reply) => {
        return ctrl.simulate(req, reply, service);
    });
}

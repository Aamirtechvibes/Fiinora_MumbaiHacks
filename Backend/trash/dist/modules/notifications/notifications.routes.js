"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = notificationsRoutes;
const notifications_service_1 = require("./notifications.service");
const notifications_controller_1 = require("./notifications.controller");
async function notificationsRoutes(fastify) {
    const service = new notifications_service_1.NotificationsService(fastify);
    const ctrl = new notifications_controller_1.NotificationsController();
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
    fastify.post('/mark-read', { preHandler: authMiddleware }, async (req, reply) => {
        return ctrl.markRead(req, reply, service);
    });
}

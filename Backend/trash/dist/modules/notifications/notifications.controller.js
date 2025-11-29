"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsController = void 0;
const dto_1 = require("./dto");
class NotificationsController {
    async create(req, reply, service) {
        try {
            const body = dto_1.createNotificationSchema.parse(req.body);
            const userId = req.userId;
            const n = await service.createNotification(userId, body);
            return reply.status(201).send(n);
        }
        catch (err) {
            if (err.issues)
                return reply.status(400).send({ error: 'Validation failed', code: 'VALIDATION_ERROR', details: err.issues });
            throw err;
        }
    }
    async list(req, reply, service) {
        try {
            const q = dto_1.listNotificationsQuerySchema.parse(req.query);
            const userId = req.userId;
            const res = await service.listNotifications(userId, q);
            return reply.send(res);
        }
        catch (err) {
            if (err.issues)
                return reply.status(400).send({ error: 'Validation failed', code: 'VALIDATION_ERROR', details: err.issues });
            throw err;
        }
    }
    async markRead(req, reply, service) {
        try {
            const body = dto_1.markReadSchema.parse(req.body);
            const userId = req.userId;
            const res = await service.markRead(userId, body.ids);
            return reply.send(res);
        }
        catch (err) {
            if (err.issues)
                return reply.status(400).send({ error: 'Validation failed', code: 'VALIDATION_ERROR', details: err.issues });
            throw err;
        }
    }
}
exports.NotificationsController = NotificationsController;

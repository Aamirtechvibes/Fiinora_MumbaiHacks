"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
class NotificationsService {
    constructor(fastify) {
        this.fastify = fastify;
    }
    async createNotification(userId, data) {
        const n = await this.fastify.prisma.notification.create({
            data: {
                userId,
                type: data.type,
                channel: data.channel,
                payload: data.payload,
            },
        });
        // enqueue worker job to deliver notification
        const jobQueue = this.fastify.bullmq?.emailQueue;
        if (jobQueue) {
            await jobQueue.add('send-notification', { userId, notificationId: n.id, channel: n.channel, payload: n.payload });
        }
        return this.formatNotification(n);
    }
    async listNotifications(userId, query) {
        const { page, limit, unreadOnly } = query;
        const skip = (page - 1) * limit;
        const where = { userId };
        if (unreadOnly)
            where.read = false;
        const [items, total] = await Promise.all([
            this.fastify.prisma.notification.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
            this.fastify.prisma.notification.count({ where }),
        ]);
        return {
            notifications: items.map((n) => this.formatNotification(n)),
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        };
    }
    async markRead(userId, ids) {
        await this.fastify.prisma.notification.updateMany({ where: { id: { in: ids }, userId }, data: { read: true } });
        return { updated: ids.length };
    }
    formatNotification(n) {
        return {
            id: n.id,
            type: n.type,
            channel: n.channel,
            payload: n.payload,
            read: n.read || false,
            createdAt: n.createdAt.toISOString(),
        };
    }
}
exports.NotificationsService = NotificationsService;

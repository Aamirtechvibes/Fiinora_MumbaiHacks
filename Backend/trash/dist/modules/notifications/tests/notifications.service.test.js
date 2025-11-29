"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const notifications_service_1 = require("../notifications.service");
(0, globals_1.describe)('NotificationsService', () => {
    let service;
    let mockFastify;
    let mockPrisma;
    (0, globals_1.beforeEach)(() => {
        mockPrisma = {
            notification: {
                create: jest.fn(),
                findMany: jest.fn(),
                count: jest.fn(),
                updateMany: jest.fn(),
            },
        };
        mockFastify = { prisma: mockPrisma };
        service = new notifications_service_1.NotificationsService(mockFastify);
    });
    (0, globals_1.it)('should create notification and enqueue job when queue exists', async () => {
        mockPrisma.notification.create.mockResolvedValue({ id: 'n1', channel: 'email', payload: {}, createdAt: new Date() });
        const mockQueue = { add: jest.fn().mockResolvedValue({ id: 'job1' }) };
        service.fastify = { prisma: mockPrisma, bullmq: { emailQueue: mockQueue } };
        const res = await service.createNotification('u1', { type: 'ALERT', channel: 'email', payload: {} });
        (0, globals_1.expect)(res).toHaveProperty('id');
        (0, globals_1.expect)(mockQueue.add).toHaveBeenCalled();
    });
    (0, globals_1.it)('should list notifications', async () => {
        mockPrisma.notification.findMany.mockResolvedValue([{ id: 'n1', channel: 'email', payload: {}, createdAt: new Date(), read: false }]);
        mockPrisma.notification.count.mockResolvedValue(1);
        const res = await service.listNotifications('u1', { page: 1, limit: 20 });
        (0, globals_1.expect)(res.notifications.length).toBe(1);
    });
    (0, globals_1.it)('should mark read', async () => {
        mockPrisma.notification.updateMany.mockResolvedValue({ count: 1 });
        const res = await service.markRead('u1', ['n1']);
        (0, globals_1.expect)(res.updated).toBe(1);
    });
});

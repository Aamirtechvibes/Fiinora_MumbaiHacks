"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markReadSchema = exports.listNotificationsQuerySchema = exports.createNotificationSchema = void 0;
const zod_1 = require("zod");
exports.createNotificationSchema = zod_1.z.object({
    type: zod_1.z.string().min(1).max(50),
    channel: zod_1.z.enum(['email', 'push']).default('email'),
    payload: zod_1.z.record(zod_1.z.any()),
});
exports.listNotificationsQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    unreadOnly: zod_1.z.coerce.boolean().optional(),
});
exports.markReadSchema = zod_1.z.object({
    ids: zod_1.z.array(zod_1.z.string().uuid()).min(1),
});

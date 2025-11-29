"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.networthQuerySchema = exports.cashflowQuerySchema = exports.summaryQuerySchema = void 0;
const zod_1 = require("zod");
exports.summaryQuerySchema = zod_1.z.object({
    period: zod_1.z.enum(['week', 'month', 'year']).default('month'),
});
exports.cashflowQuerySchema = zod_1.z.object({
    from: zod_1.z.string().datetime(),
    to: zod_1.z.string().datetime(),
});
exports.networthQuerySchema = zod_1.z.object({
    months: zod_1.z.number().int().min(1).max(120).default(12),
});

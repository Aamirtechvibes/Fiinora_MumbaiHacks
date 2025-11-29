"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listBudgetsQuerySchema = exports.simulateBudgetSchema = exports.updateBudgetSchema = exports.createBudgetSchema = void 0;
const zod_1 = require("zod");
exports.createBudgetSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    amount: zod_1.z.number().finite().positive(),
    startDate: zod_1.z.string().datetime(),
    endDate: zod_1.z.string().datetime(),
    category: zod_1.z.string().min(1).max(50).optional(),
});
exports.updateBudgetSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).optional(),
    amount: zod_1.z.number().finite().positive().optional(),
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
    category: zod_1.z.string().min(1).max(50).optional(),
    archived: zod_1.z.boolean().optional(),
});
exports.simulateBudgetSchema = zod_1.z.object({
    budgetId: zod_1.z.string().uuid(),
    scenarioMonths: zod_1.z.coerce.number().int().min(1).max(60).default(6),
    monthlyIncomeChangePercent: zod_1.z.number().optional(),
});
exports.listBudgetsQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    archived: zod_1.z.coerce.boolean().optional(),
});

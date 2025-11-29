"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTransactionsQuerySchema = exports.updateTransactionSchema = exports.createTransactionSchema = void 0;
const zod_1 = require("zod");
exports.createTransactionSchema = zod_1.z.object({
    accountId: zod_1.z.string().uuid('Invalid account ID'),
    amount: zod_1.z.number().finite('Amount must be a finite number').refine((n) => n !== 0, 'Amount cannot be zero'),
    txnDate: zod_1.z.string().datetime('Invalid date format, use ISO8601'),
    category: zod_1.z.string().min(1).max(50).optional(),
    merchant: zod_1.z.string().min(1).max(100).optional(),
});
exports.updateTransactionSchema = zod_1.z.object({
    amount: zod_1.z.number().finite().optional(),
    txnDate: zod_1.z.string().datetime().optional(),
    category: zod_1.z.string().min(1).max(50).optional(),
    merchant: zod_1.z.string().min(1).max(100).optional(),
});
exports.listTransactionsQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    category: zod_1.z.string().optional(),
    merchant: zod_1.z.string().optional(),
    fromDate: zod_1.z.string().datetime().optional(),
    toDate: zod_1.z.string().datetime().optional(),
    minAmount: zod_1.z.coerce.number().finite().optional(),
    maxAmount: zod_1.z.coerce.number().finite().optional(),
});

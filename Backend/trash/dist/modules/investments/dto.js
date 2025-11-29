"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listInvestmentsQuery = exports.updateInvestmentSchema = exports.createInvestmentSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.createInvestmentSchema = zod_1.default.object({
    symbol: zod_1.default.string().min(1),
    name: zod_1.default.string().optional(),
    quantity: zod_1.default.coerce.number().positive(),
    avgCost: zod_1.default.coerce.number().nonnegative(),
    currency: zod_1.default.string().default('USD'),
});
exports.updateInvestmentSchema = zod_1.default.object({
    name: zod_1.default.string().optional(),
    quantity: zod_1.default.coerce.number().positive().optional(),
    avgCost: zod_1.default.coerce.number().nonnegative().optional(),
    currency: zod_1.default.string().optional(),
});
exports.listInvestmentsQuery = zod_1.default.object({
    page: zod_1.default.coerce.number().int().positive().default(1),
    limit: zod_1.default.coerce.number().int().min(1).max(100).default(50),
});

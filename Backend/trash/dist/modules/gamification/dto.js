"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createChallengeSchema = exports.getLeaderboardSchema = exports.getBadgeSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.getBadgeSchema = zod_1.default.object({
    page: zod_1.default.number().int().positive().default(1),
    limit: zod_1.default.number().int().min(1).max(100).default(20),
});
exports.getLeaderboardSchema = zod_1.default.object({
    scope: zod_1.default.enum(['weekly', 'monthly', 'alltime']).default('weekly'),
    limit: zod_1.default.number().int().min(1).max(100).default(20),
});
exports.createChallengeSchema = zod_1.default.object({
    name: zod_1.default.string().min(1).max(255),
    description: zod_1.default.string().max(1000).optional(),
    type: zod_1.default.enum(['TRANSACTION', 'GOAL', 'LOGIN']),
    target: zod_1.default.number().int().positive(),
    rewardPoints: zod_1.default.number().int().min(1).default(10),
    durationDays: zod_1.default.number().int().min(1).default(7),
});

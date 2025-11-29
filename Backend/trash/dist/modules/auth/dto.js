"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetSchema = exports.forgotSchema = exports.refreshSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    name: zod_1.z.string().min(2).max(120).optional()
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1)
});
exports.refreshSchema = zod_1.z.object({
    refreshToken: zod_1.z.string(),
    sessionId: zod_1.z.string()
});
exports.forgotSchema = zod_1.z.object({
    email: zod_1.z.string().email()
});
exports.resetSchema = zod_1.z.object({
    token: zod_1.z.string(),
    password: zod_1.z.string().min(8)
});

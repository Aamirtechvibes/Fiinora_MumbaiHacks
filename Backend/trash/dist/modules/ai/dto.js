"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRequestSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.chatRequestSchema = zod_1.default.object({
    conversationId: zod_1.default.string().optional(),
    message: zod_1.default.string().min(1),
});

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
exports.default = (0, fastify_plugin_1.default)(async (fastify, opts) => {
    const connection = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379');
    const emailQueue = new bullmq_1.Queue('emailQueue', { connection });
    const transactionQueue = new bullmq_1.Queue('transactionQueue', { connection });
    fastify.decorate('bullmq', { emailQueue, transactionQueue });
    // We intentionally don't start long-running workers in the HTTP process.
    // Worker processes should run `src/queues/worker.ts` or specific worker entrypoints.
    fastify.addHook('onClose', async () => {
        await emailQueue.close();
        await transactionQueue.close();
        await connection.quit();
    });
});

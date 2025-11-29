"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const helmet_1 = __importDefault(require("@fastify/helmet"));
const cookie_1 = __importDefault(require("@fastify/cookie"));
const swagger_1 = __importDefault(require("./plugins/swagger"));
const prisma_1 = __importDefault(require("./plugins/prisma"));
const redis_1 = __importDefault(require("./plugins/redis"));
const bullmq_1 = __importDefault(require("./plugins/bullmq"));
const metrics_1 = __importDefault(require("./plugins/metrics"));
const sentry_1 = __importDefault(require("./plugins/sentry"));
const auth_1 = __importDefault(require("./modules/auth"));
const wallet_1 = __importDefault(require("./modules/wallet"));
const transactions_1 = __importDefault(require("./modules/transactions"));
const budgets_1 = __importDefault(require("./modules/budgets"));
const notifications_1 = __importDefault(require("./modules/notifications"));
const users_1 = __importDefault(require("./modules/users"));
const files_1 = __importDefault(require("./modules/files"));
const gamification_1 = __importDefault(require("./modules/gamification"));
const investments_1 = __importDefault(require("./modules/investments"));
const ai_routes_1 = __importDefault(require("./modules/ai/ai.routes"));
const admin_routes_1 = __importDefault(require("./modules/admin/admin.routes"));
const logger_1 = __importDefault(require("./utils/logger"));
const app = (0, fastify_1.default)({
    logger: logger_1.default
});
app.register(helmet_1.default);
app.register(cors_1.default, { origin: true, credentials: true });
app.register(cookie_1.default);
app.register(prisma_1.default);
app.register(redis_1.default);
app.register(bullmq_1.default);
app.register(metrics_1.default);
app.register(sentry_1.default);
app.register(swagger_1.default, {
    routePrefix: '/docs',
    swagger: {
        info: { title: 'Finora API', version: '1.0.0' }
    },
    exposeRoute: true
});
app.register(auth_1.default, { prefix: '/api/v1/auth' });
app.register(wallet_1.default, { prefix: '/api/v1/wallet' });
app.register(transactions_1.default, { prefix: '/api/v1/transactions' });
app.register(budgets_1.default, { prefix: '/api/v1/budgets' });
app.register(notifications_1.default, { prefix: '/api/v1/notifications' });
app.register(users_1.default, { prefix: '/api/v1/users' });
app.register(files_1.default, { prefix: '/api/v1/files' });
app.register(gamification_1.default, { prefix: '/api/v1/gamification' });
app.register(investments_1.default, { prefix: '/api/v1/investments' });
app.register(ai_routes_1.default, { prefix: '/api/v1/ai' });
app.register(admin_routes_1.default, { prefix: '/admin' });
app.get('/', async () => ({ ok: true, version: '0.1.0' }));
app.get('/health', async (request, reply) => {
    const isRedisReady = await app.redis?.ping().then(() => true).catch(() => false) ?? false;
    const isPrismaReady = app.prisma?.user !== undefined;
    return reply.send({
        status: isRedisReady && isPrismaReady ? 'ok' : 'degraded',
        database: isPrismaReady ? 'connected' : 'disconnected',
        cache: isRedisReady ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});
exports.default = app;

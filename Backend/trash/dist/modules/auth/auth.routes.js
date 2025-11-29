"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = routes;
const auth_controller_1 = __importDefault(require("./auth.controller"));
const dto_1 = require("./dto");
async function routes(fastify) {
    const ctrl = (0, auth_controller_1.default)(fastify);
    // health
    fastify.post('/register', async (req, reply) => {
        const parsed = dto_1.registerSchema.parse(req.body);
        return ctrl.register({ body: parsed }, reply);
    });
    fastify.post('/login', async (req, reply) => {
        const parsed = dto_1.loginSchema.parse(req.body);
        return ctrl.login({ body: parsed }, reply);
    });
    fastify.post('/refresh', async (req, reply) => {
        const parsed = dto_1.refreshSchema.parse(req.body);
        return ctrl.refresh({ body: parsed }, reply);
    });
    fastify.post('/logout', async (req, reply) => {
        const { sessionId } = req.body;
        return ctrl.logout({ body: { sessionId } }, reply);
    });
    fastify.get('/verify', async (req, reply) => {
        return ctrl.verify(req, reply);
    });
    fastify.post('/forgot', async (req, reply) => {
        const parsed = dto_1.forgotSchema.parse(req.body);
        return ctrl.forgot({ body: parsed }, reply);
    });
    fastify.post('/reset', async (req, reply) => {
        const parsed = dto_1.resetSchema.parse(req.body);
        return ctrl.reset({ body: parsed }, reply);
    });
}

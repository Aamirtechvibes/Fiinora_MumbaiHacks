"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = walletRoutes;
const wallet_controller_1 = __importDefault(require("./wallet.controller"));
async function walletRoutes(fastify) {
    const ctrl = (0, wallet_controller_1.default)(fastify);
    // Middleware to extract userId from JWT
    const authMiddleware = async (req, reply) => {
        try {
            const auth = req.headers['authorization'];
            if (!auth?.startsWith('Bearer ')) {
                return reply.code(401).send({ error: 'Unauthorized', code: 'NO_AUTH' });
            }
            const token = auth.split(' ')[1];
            const payload = require('jsonwebtoken').verify(token, process.env.JWT_ACCESS_TOKEN_SECRET || 'dev_access_secret');
            req.userId = payload.sub;
        }
        catch (err) {
            return reply.code(401).send({ error: 'Invalid token', code: 'INVALID_TOKEN' });
        }
    };
    fastify.get('/summary', { preHandler: authMiddleware }, async (req, reply) => {
        return ctrl.getSummary(req, reply);
    });
    fastify.get('/cashflow', { preHandler: authMiddleware }, async (req, reply) => {
        return ctrl.getCashflow(req, reply);
    });
    fastify.get('/networth', { preHandler: authMiddleware }, async (req, reply) => {
        return ctrl.getNetworth(req, reply);
    });
}

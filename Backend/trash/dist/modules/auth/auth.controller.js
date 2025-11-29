"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = authController;
const auth_service_1 = require("./auth.service");
const errors_1 = require("../../utils/errors");
function authController(fastify) {
    const service = new auth_service_1.AuthService(fastify);
    return {
        register: async (req, reply) => {
            try {
                const { email, password, name } = req.body;
                const user = await service.register(email, password, name);
                reply.code(201).send(user);
            }
            catch (err) {
                reply.code(400).send((0, errors_1.toErrorResponse)(err));
            }
        },
        login: async (req, reply) => {
            try {
                const { email, password } = req.body;
                const r = await service.login(email, password);
                reply.send(r);
            }
            catch (err) {
                reply.code(401).send((0, errors_1.toErrorResponse)(err));
            }
        },
        refresh: async (req, reply) => {
            try {
                const { refreshToken, sessionId } = req.body;
                const r = await service.refresh(sessionId, refreshToken);
                reply.send(r);
            }
            catch (err) {
                reply.code(401).send((0, errors_1.toErrorResponse)(err));
            }
        },
        logout: async (req, reply) => {
            try {
                const { sessionId } = req.body;
                await service.logout(sessionId);
                reply.send({ ok: true });
            }
            catch (err) {
                reply.code(400).send((0, errors_1.toErrorResponse)(err));
            }
        },
        verify: async (req, reply) => {
            try {
                const token = req.query.token;
                await service.verifyEmail(token);
                // redirect to deep link or send json
                if (fastify.config?.frontendUrl) {
                    reply.redirect(302, `${fastify.config.frontendUrl}/verified`);
                }
                else {
                    reply.send({ ok: true });
                }
            }
            catch (err) {
                reply.code(400).send((0, errors_1.toErrorResponse)(err));
            }
        },
        forgot: async (req, reply) => {
            try {
                const { email } = req.body;
                await service.forgot(email);
                reply.send({ ok: true });
            }
            catch (err) {
                reply.code(400).send((0, errors_1.toErrorResponse)(err));
            }
        },
        reset: async (req, reply) => {
            try {
                const { token, password } = req.body;
                await service.resetPassword(token, password);
                reply.send({ ok: true });
            }
            catch (err) {
                reply.code(400).send((0, errors_1.toErrorResponse)(err));
            }
        }
    };
}

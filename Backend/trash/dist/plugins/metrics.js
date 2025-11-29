"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const prom_client_1 = __importDefault(require("prom-client"));
exports.default = (0, fastify_plugin_1.default)(async (fastify, opts) => {
    prom_client_1.default.collectDefaultMetrics();
    fastify.decorate('metricsClient', prom_client_1.default);
    fastify.get('/metrics', async (req, reply) => {
        reply.type('text/plain');
        return prom_client_1.default.register.metrics();
    });
});

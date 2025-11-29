"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
exports.default = (0, fastify_plugin_1.default)(async (fastify, opts) => {
    const dsn = process.env.SENTRY_DSN;
    if (dsn) {
        // require @sentry/node lazily so Sentry is optional in development
        // and to avoid build-time dependency if not installed.
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Sentry = require('@sentry/node');
        Sentry.init({ dsn, tracesSampleRate: 0.1 });
        fastify.setErrorHandler((err, req, reply) => {
            Sentry.captureException(err);
            reply.send(err);
        });
    }
});

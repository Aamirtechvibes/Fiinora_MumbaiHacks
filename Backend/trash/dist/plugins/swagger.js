"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const swagger_1 = __importDefault(require("@fastify/swagger"));
exports.default = (0, fastify_plugin_1.default)(async (fastify, opts) => {
    // allow options to be passed via app.register(..., opts)
    fastify.register(swagger_1.default, opts);
});

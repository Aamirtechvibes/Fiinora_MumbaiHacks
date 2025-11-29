"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = authModule;
const auth_routes_1 = __importDefault(require("./auth.routes"));
async function authModule(fastify) {
    fastify.register(auth_routes_1.default, { prefix: '/' });
}

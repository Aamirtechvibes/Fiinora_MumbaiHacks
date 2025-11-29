"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = usersModule;
const users_routes_1 = __importDefault(require("./users.routes"));
async function usersModule(fastify) {
    fastify.register(users_routes_1.default, { prefix: '/' });
}

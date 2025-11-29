"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = filesModule;
const files_routes_1 = __importDefault(require("./files.routes"));
async function filesModule(fastify) {
    fastify.register(files_routes_1.default, { prefix: '/' });
}

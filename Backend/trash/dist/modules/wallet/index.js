"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = walletModule;
const wallet_routes_1 = __importDefault(require("./wallet.routes"));
async function walletModule(fastify) {
    fastify.register(wallet_routes_1.default, { prefix: '/' });
}

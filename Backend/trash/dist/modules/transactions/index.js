"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsController = exports.TransactionsService = void 0;
const transactions_routes_1 = __importDefault(require("./transactions.routes"));
exports.default = transactions_routes_1.default;
var transactions_service_1 = require("./transactions.service");
Object.defineProperty(exports, "TransactionsService", { enumerable: true, get: function () { return transactions_service_1.TransactionsService; } });
var transactions_controller_1 = require("./transactions.controller");
Object.defineProperty(exports, "TransactionsController", { enumerable: true, get: function () { return transactions_controller_1.TransactionsController; } });

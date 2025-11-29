"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BudgetsController = exports.BudgetsService = void 0;
const budgets_routes_1 = __importDefault(require("./budgets.routes"));
exports.default = budgets_routes_1.default;
var budgets_service_1 = require("./budgets.service");
Object.defineProperty(exports, "BudgetsService", { enumerable: true, get: function () { return budgets_service_1.BudgetsService; } });
var budgets_controller_1 = require("./budgets.controller");
Object.defineProperty(exports, "BudgetsController", { enumerable: true, get: function () { return budgets_controller_1.BudgetsController; } });

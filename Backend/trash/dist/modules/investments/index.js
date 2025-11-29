"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvestmentsService = exports.default = void 0;
var investments_routes_1 = require("./investments.routes");
Object.defineProperty(exports, "default", { enumerable: true, get: function () { return __importDefault(investments_routes_1).default; } });
var investments_service_1 = require("./investments.service");
Object.defineProperty(exports, "InvestmentsService", { enumerable: true, get: function () { return __importDefault(investments_service_1).default; } });

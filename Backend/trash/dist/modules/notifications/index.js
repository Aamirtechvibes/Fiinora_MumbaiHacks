"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsController = exports.NotificationsService = void 0;
const notifications_routes_1 = __importDefault(require("./notifications.routes"));
exports.default = notifications_routes_1.default;
var notifications_service_1 = require("./notifications.service");
Object.defineProperty(exports, "NotificationsService", { enumerable: true, get: function () { return notifications_service_1.NotificationsService; } });
var notifications_controller_1 = require("./notifications.controller");
Object.defineProperty(exports, "NotificationsController", { enumerable: true, get: function () { return notifications_controller_1.NotificationsController; } });

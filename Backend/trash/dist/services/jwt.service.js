"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAccessToken = exports.signAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config"));
const signAccessToken = (payload) => {
    const secret = config_1.default.jwtAccessSecret;
    const expiresIn = config_1.default.accessExpiresIn;
    return jsonwebtoken_1.default.sign(payload, secret, { expiresIn });
};
exports.signAccessToken = signAccessToken;
const verifyAccessToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, config_1.default.jwtAccessSecret);
    }
    catch (err) {
        return null;
    }
};
exports.verifyAccessToken = verifyAccessToken;

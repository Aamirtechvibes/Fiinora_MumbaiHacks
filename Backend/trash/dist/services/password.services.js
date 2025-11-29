"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyWithPepper = exports.hashWithPepper = exports.verifyPassword = exports.hashPassword = void 0;
const argon2_1 = __importDefault(require("argon2"));
const hashPassword = async (plain) => {
    return argon2_1.default.hash(plain);
};
exports.hashPassword = hashPassword;
const verifyPassword = async (hash, plain) => {
    try {
        return await argon2_1.default.verify(hash, plain);
    }
    catch {
        return false;
    }
};
exports.verifyPassword = verifyPassword;
const hashWithPepper = async (value, pepper) => {
    return argon2_1.default.hash(value + '|' + pepper);
};
exports.hashWithPepper = hashWithPepper;
const verifyWithPepper = async (hash, value, pepper) => {
    try {
        return await argon2_1.default.verify(hash, value + '|' + pepper);
    }
    catch {
        return false;
    }
};
exports.verifyWithPepper = verifyWithPepper;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toErrorResponse = exports.ApiError = void 0;
class ApiError extends Error {
    constructor(message, status = 400, code) {
        super(message);
        this.status = status;
        this.code = code;
    }
}
exports.ApiError = ApiError;
const toErrorResponse = (err) => {
    if (err instanceof ApiError) {
        return { error: err.message, code: err.code };
    }
    return { error: 'Internal server error' };
};
exports.toErrorResponse = toErrorResponse;

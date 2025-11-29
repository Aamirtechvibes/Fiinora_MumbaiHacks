"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseZod = void 0;
const zod_1 = require("zod");
const parseZod = (schema, data) => {
    try {
        return schema.parse(data);
    }
    catch (e) {
        if (e instanceof zod_1.ZodError) {
            const issues = e.errors.map(err => ({ path: err.path.join('.'), message: err.message }));
            const errObj = { error: 'Validation error', code: 'VALIDATION_ERROR', details: issues };
            throw errObj;
        }
        throw e;
    }
};
exports.parseZod = parseZod;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const rateLimiter_1 = require("../../rateLimiter");
(0, globals_1.describe)('rateLimiter', () => {
    let mockFastify;
    (0, globals_1.beforeEach)(() => {
        mockFastify = { redis: { incr: globals_1.jest.fn().mockResolvedValue(1), expire: globals_1.jest.fn().mockResolvedValue(1) } };
    });
    (0, globals_1.it)('increments and reports not exceeded', async () => {
        const res = await (0, rateLimiter_1.incrAndCheck)(mockFastify, 'key1', 5, 60);
        (0, globals_1.expect)(res.exceeded).toBe(false);
        (0, globals_1.expect)(res.count).toBe(1);
    });
});

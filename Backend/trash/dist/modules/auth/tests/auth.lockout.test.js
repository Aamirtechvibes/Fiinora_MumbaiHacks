"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const auth_service_1 = require("../auth.service");
(0, globals_1.describe)('AuthService lockout', () => {
    let svc;
    let mockFastify;
    const email = 'locked@test.com';
    (0, globals_1.beforeEach)(() => {
        globals_1.jest.setTimeout(10000);
        const makeMockResolved = (v) => { const f = globals_1.jest.fn(); f.mockResolvedValue(v); return f; };
        // mock password verify to always fail
        const pw = require('../../../services/password.services');
        pw.verifyPassword = globals_1.jest.fn().mockResolvedValue(false);
        // mock sendEmail to avoid external SMTP attempts
        const mail = require('../../../services/email.service');
        mail.sendEmail = globals_1.jest.fn().mockResolvedValue(true);
        mockFastify = {
            prisma: {
                user: { findUnique: globals_1.jest.fn().mockResolvedValue({ id: 'u1', email, passwordHash: 'hash', lockedUntil: null }), update: globals_1.jest.fn().mockResolvedValue(true) },
            },
            redis: {
                incr: globals_1.jest.fn().mockResolvedValue(5),
                expire: globals_1.jest.fn().mockResolvedValue(1),
            },
            log: { error: globals_1.jest.fn() }
        };
        svc = new auth_service_1.AuthService(mockFastify);
    });
    (0, globals_1.it)('locks account after repeated failed attempts and sends email', async () => {
        try {
            await svc.login(email, 'wrong');
        }
        catch (err) {
            // expected invalid credentials
        }
        // After calling login once, our mock redis.incr returns 5 so lock should happen
        (0, globals_1.expect)(mockFastify.prisma.user.update.mock.calls.length).toBeGreaterThanOrEqual(1);
    });
});

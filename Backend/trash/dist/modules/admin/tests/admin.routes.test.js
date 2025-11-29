"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const admin_routes_1 = __importDefault(require("../admin.routes"));
const jwt_service_1 = require("../../../services/jwt.service");
describe('Admin Routes RBAC', () => {
    let fastify;
    let adminToken;
    let userToken;
    beforeAll(async () => {
        fastify = (0, fastify_1.default)();
        // Attach mocked prisma and redis
        fastify.decorate('prisma', {
            user: { update: jest.fn().mockResolvedValue(true) },
            badge: { create: jest.fn().mockResolvedValue({ id: 'b1', name: 'Test' }) },
            challenge: { create: jest.fn().mockResolvedValue({ id: 'c1', name: 'Ch' }) },
            $queryRawUnsafe: jest.fn().mockResolvedValue([]),
            $executeRawUnsafe: jest.fn().mockResolvedValue(true),
        });
        fastify.decorate('redis', {
            del: jest.fn().mockResolvedValue(1),
        });
        await fastify.register(admin_routes_1.default, { prefix: '/admin' });
        await fastify.ready();
        adminToken = (0, jwt_service_1.signAccessToken)({ sub: 'admin1', role: 'ADMIN' });
        userToken = (0, jwt_service_1.signAccessToken)({ sub: 'u1', role: 'USER' });
    });
    afterAll(async () => {
        await fastify.close();
    });
    test('non-admin cannot ban', async () => {
        const res = await fastify.inject({ method: 'POST', url: '/admin/users/u2/ban', headers: { authorization: `Bearer ${userToken}` } });
        expect(res.statusCode).toBe(403);
    });
    test('admin can ban', async () => {
        const res = await fastify.inject({ method: 'POST', url: '/admin/users/u2/ban', headers: { authorization: `Bearer ${adminToken}` } });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.body);
        expect(body).toHaveProperty('ok', true);
    });
    test('admin can create badge and challenge', async () => {
        const b = await fastify.inject({ method: 'POST', url: '/admin/badges', headers: { authorization: `Bearer ${adminToken}` }, payload: { name: 'New', description: 'd' } });
        expect(b.statusCode).toBe(201);
        const c = await fastify.inject({ method: 'POST', url: '/admin/challenges', headers: { authorization: `Bearer ${adminToken}` }, payload: { name: 'Ch', type: 'TRANSACTION', target: 1 } });
        expect(c.statusCode).toBe(201);
    });
    test('admin can list audit logs', async () => {
        const res = await fastify.inject({ method: 'GET', url: '/admin/audit-logs', headers: { authorization: `Bearer ${adminToken}` } });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.body);
        expect(body).toHaveProperty('items');
    });
    test('admin can unlock user', async () => {
        const res = await fastify.inject({ method: 'POST', url: '/admin/users/u2/unlock', headers: { authorization: `Bearer ${adminToken}` } });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.body);
        expect(body).toHaveProperty('ok', true);
        expect(body).toHaveProperty('message', 'User unlocked');
    });
});

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const index_1 = __importDefault(require("../index"));
const prisma_1 = __importDefault(require("../../../plugins/prisma"));
const supertest_1 = __importDefault(require("supertest"));
describe('Auth routes', () => {
    let server;
    beforeAll(async () => {
        server = (0, fastify_1.default)();
        await server.register(prisma_1.default);
        await server.register(index_1.default);
        await server.ready();
    });
    afterAll(async () => {
        await server.prisma.$disconnect();
        await server.close();
    });
    test('POST /register returns 201', async () => {
        const email = `route_${Date.now()}@finora.test`;
        const res = await (0, supertest_1.default)(server.server).post('/api/v1/auth/register').send({
            email,
            password: 'P@ssword123',
            name: 'Route Tester'
        });
        expect(res.status).toBe(201);
        expect(res.body.email).toBe(email);
    }, 10000);
});

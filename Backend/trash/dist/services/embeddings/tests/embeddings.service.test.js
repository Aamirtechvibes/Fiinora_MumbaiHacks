"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const embeddings_service_1 = __importDefault(require("../../embeddings.service"));
(0, globals_1.describe)('EmbeddingsService (pgvector)', () => {
    let svc;
    let mockFastify;
    (0, globals_1.beforeEach)(() => {
        const makeMockResolved = (v) => { const f = globals_1.jest.fn(); f.mockResolvedValue(v); return f; };
        mockFastify = { prisma: { $executeRawUnsafe: makeMockResolved(1), $queryRawUnsafe: makeMockResolved([{ id: 'a1', content: 'hello world', metadata: { source: 'test' }, distance: 0.12 }]) } };
        svc = new embeddings_service_1.default(mockFastify, 8);
    });
    (0, globals_1.it)('createEmbedding returns an array of numbers', async () => {
        const emb = await svc.createEmbedding('test');
        (0, globals_1.expect)(Array.isArray(emb)).toBe(true);
        (0, globals_1.expect)(emb.length).toBe(8);
    });
    (0, globals_1.it)('storeEmbedding calls prisma $executeRawUnsafe', async () => {
        const emb = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];
        await svc.storeEmbedding('00000000-0000-0000-0000-000000000000', 'content', emb, { foo: 'bar' });
        (0, globals_1.expect)(mockFastify.prisma.$executeRawUnsafe).toHaveBeenCalled();
    });
    (0, globals_1.it)('querySimilar calls prisma $queryRawUnsafe and returns rows', async () => {
        const emb = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];
        const res = await svc.querySimilar('00000000-0000-0000-0000-000000000000', emb, 3);
        (0, globals_1.expect)(Array.isArray(res)).toBe(true);
        (0, globals_1.expect)(res[0]).toHaveProperty('id', 'a1');
    });
});
(0, globals_1.describe)('EmbeddingsService (pinecone)', () => {
    let svc;
    let mockFastify;
    (0, globals_1.beforeEach)(() => {
        const makeMock = (v) => { const f = globals_1.jest.fn(); f.mockResolvedValue(v); return f; };
        const mockPineconeClient = { upsert: makeMock(true), query: makeMock({ matches: [{ id: 'p1', score: 0.01, metadata: { content: 'm' } }] }) };
        mockFastify = { pineconeClient: mockPineconeClient, prisma: {} };
        svc = new embeddings_service_1.default(mockFastify, 8);
        process.env.USE_PINECONE = '1';
    });
    afterEach(() => {
        delete process.env.USE_PINECONE;
    });
    (0, globals_1.it)('storeEmbedding calls pinecone upsert', async () => {
        const emb = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];
        await svc.storeEmbedding('u1', 'c', emb, { a: 1 });
        (0, globals_1.expect)(mockFastify.pineconeClient.upsert.mock.calls.length).toBeGreaterThan(0);
    });
    (0, globals_1.it)('querySimilar calls pinecone.query and returns matches', async () => {
        const emb = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];
        const res = await svc.querySimilar('u1', emb, 2);
        (0, globals_1.expect)(Array.isArray(res)).toBe(true);
        (0, globals_1.expect)(res[0]).toHaveProperty('id', 'p1');
    });
});

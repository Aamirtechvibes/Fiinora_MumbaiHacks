"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const ai_service_1 = __importDefault(require("../ai.service"));
(0, globals_1.describe)('AiService', () => {
    let svc;
    let mockFastify;
    (0, globals_1.beforeEach)(() => {
        const makeMockResolved = (v) => { const f = globals_1.jest.fn(); f.mockResolvedValue(v); return f; };
        mockFastify = {
            prisma: {
                conversation: { findUnique: globals_1.jest.fn(), create: makeMockResolved({ id: 'c1', userId: 'u1' }) },
                message: { create: makeMockResolved(true) },
                investment: { findMany: makeMockResolved([{ id: 'i1', symbol: 'AAPL', quantity: 2, avgCost: 100, currentPrice: 110 }]) },
            },
        };
        svc = new ai_service_1.default(mockFastify);
        // stub embeddings
        svc.embeddings.createEmbedding = globals_1.jest.fn().mockResolvedValue([0.1, 0.2]);
        svc.embeddings.querySimilar = globals_1.jest.fn().mockResolvedValue([{ id: 'a1', content: 'ctx' }]);
        // stub openrouter returning structured JSON with an action
        const structured = JSON.stringify({ reply: 'Here is a summary', actions: [{ name: 'getInvestmentSummary', params: {} }] });
        svc.openrouter.callChat = globals_1.jest.fn().mockResolvedValue({ reply: structured, raw: {} });
    });
    (0, globals_1.it)('creates conversation, stores messages and returns reply with sources', async () => {
        const out = await svc.chat('u1', undefined, 'what is my balance?');
        (0, globals_1.expect)(out).toHaveProperty('reply');
        (0, globals_1.expect)(Array.isArray(out.sources)).toBe(true);
        (0, globals_1.expect)(Array.isArray(out.actions)).toBe(true);
        // ensure an action was executed and returned a result
        (0, globals_1.expect)(out.actions[0]).toHaveProperty('name', 'getInvestmentSummary');
        (0, globals_1.expect)(out.actions[0]).toHaveProperty('result');
        (0, globals_1.expect)(mockFastify.prisma.message.create.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
});

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const openrouter_client_1 = __importDefault(require("../../services/openrouter.client"));
const embeddings_service_1 = __importDefault(require("../../services/embeddings.service"));
class AiService {
    constructor(fastify) {
        this.fastify = fastify;
        // allow tests or runtime to inject clients on fastify for easier mocking
        this.openrouter = fastify.openrouterClient || new openrouter_client_1.default();
        this.embeddings = fastify.embeddingsService || new embeddings_service_1.default(fastify);
    }
    async ensureConversation(userId, conversationId) {
        if (conversationId) {
            const conv = await this.fastify.prisma.conversation.findUnique({ where: { id: conversationId } });
            if (conv)
                return conv;
        }
        const created = await this.fastify.prisma.conversation.create({ data: { userId } });
        return created;
    }
    async appendMessage(conversationId, role, content) {
        return this.fastify.prisma.message.create({ data: { conversationId, role, content } });
    }
    // Core chat pipeline (minimal): create/load conversation, retrieve RAG contexts, call LLM, persist messages
    async chat(userId, conversationId, message) {
        // rate limiting handled in route
        const conv = await this.ensureConversation(userId, conversationId);
        // store user message
        await this.appendMessage(conv.id, 'user', message);
        // embeddings RAG
        const emb = await this.embeddings.createEmbedding(message);
        const contexts = await this.embeddings.querySimilar(userId, emb, 5);
        // Compose system prompt with retrieved contexts and request structured JSON output when possible
        const systemPrompt = `You are Finora AI assistant. Use the following context chunks as sources:\n${contexts.map((c, i) => `(${i + 1}) ${c.content}`).join('\n\n')}
  Return a JSON object with keys: reply (string), actions (array of { name: string, params: object }). Example: { \"reply\": \"I can help\", \"actions\": [{ \"name\": \"getInvestmentSummary\", \"params\": {} }] }`;
        // Call OpenRouter
        const resp = await this.openrouter.callChat(message, systemPrompt);
        // Persist assistant reply
        await this.appendMessage(conv.id, 'assistant', resp.reply);
        // Attempt to parse structured actions from the model reply.
        let parsed = null;
        try {
            parsed = JSON.parse(resp.reply);
        }
        catch (e) {
            // ignore — model may have returned plain text
        }
        const actions = [];
        if (parsed && Array.isArray(parsed.actions)) {
            for (const act of parsed.actions) {
                try {
                    let result = null;
                    if (act.name === 'simulateBudgetChange') {
                        result = await this.simulateBudgetChange(userId, act.params || {});
                    }
                    else if (act.name === 'computeCashflow') {
                        result = await this.computeCashflow(userId);
                    }
                    else if (act.name === 'getInvestmentSummary') {
                        result = await this.getInvestmentSummary(userId);
                    }
                    else {
                        result = { error: 'unknown_action' };
                    }
                    actions.push({ name: act.name, params: act.params || {}, result });
                }
                catch (err) {
                    actions.push({ name: act.name, error: String(err) });
                }
            }
        }
        // If the model returned a structured reply field, prefer that; otherwise use raw reply text
        const finalReply = parsed && parsed.reply ? parsed.reply : resp.reply;
        // Return structured response referencing sources and executed actions
        return { reply: finalReply, sources: contexts, actions };
    }
    // Tool: simulateBudgetChange(params)
    // Minimal simulation: returns estimated remaining budget impact without persisting anything.
    async simulateBudgetChange(userId, params) {
        // Fetch budgets and recent expenses
        const budgets = await this.fastify.prisma.budget.findMany({ where: { userId } }).catch(() => []);
        const txnSum = await this.fastify.prisma.transaction.aggregate({ where: { userId }, _sum: { amount: true } }).catch(() => ({ _sum: { amount: 0 } }));
        const totalSpending = Number(txnSum?._sum?.amount ?? 0);
        // Very simple projection: apply changeAmount and return message
        const projected = totalSpending + params.changeAmount;
        return { projectedSpending: projected, budgetsCount: budgets.length, note: 'This is a simulation only; no data is changed.' };
    }
    // Tool: computeCashflow(userId)
    // Compute simple cashflow for last 30 days grouped by day
    async computeCashflow(userId) {
        const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const rows = await this.fastify.prisma.$queryRawUnsafe(`SELECT date_trunc('day', txn_date) as day, SUM(amount) as total FROM "Transaction" WHERE user_id = '${userId}' AND txn_date >= '${from.toISOString()}' GROUP BY 1 ORDER BY 1`);
        return rows.map(r => ({ day: r.day, total: Number(r.total) }));
    }
    // Tool: getInvestmentSummary(userId)
    // Returns holdings and total estimated value using currentPrice or avgCost
    async getInvestmentSummary(userId) {
        const invs = await this.fastify.prisma.investment.findMany({ where: { userId } }).catch(() => []);
        const holdings = invs.map((i) => {
            const price = Number(i.currentPrice ?? i.avgCost ?? 0);
            const qty = Number(i.quantity ?? 0);
            return { symbol: i.symbol, quantity: qty, price, value: price * qty };
        });
        const total = holdings.reduce((s, h) => s + (h.value || 0), 0);
        return { totalValue: total, holdings };
    }
}
exports.AiService = AiService;
exports.default = AiService;
